# Needl — Architecture Reference

## System Overview

Needl is a modular monolith deployed as a dedicated Next.js 15 application per network
customer. Corporate Connections Canada has their own Supabase project and Vercel deployment.
BNI, when they sign, will get their own. Every external service dependency sits behind a
typed abstraction interface — the application never calls vendor SDKs directly.

The data layer is Supabase Postgres with the pgvector extension. RLS policies are the
primary access control mechanism. The embedding pipeline runs asynchronously via Supabase
Edge Functions triggered by database webhooks — the UI never waits for an embedding call.

## Data Flow Diagrams

### Auth Flow
```
Browser
  → /sign-in (Clerk hosted UI)
  → User selects: Google OAuth or LinkedIn OAuth
  → Clerk handles OAuth redirect and token exchange
  → Clerk fires user.created webhook → /api/webhooks/clerk
  → Next.js: upsert member record in Supabase (id = Clerk user ID)
  → Next.js: query chapter_memberships for this member
  → Clerk JWT issued: { sub: member_id, org_id: organization_id,
                        chapter_ids: [...], role: 'member' | 'director' | ... }
  → Next.js middleware validates JWT on every request
  → Supabase client initialized with JWT for RLS context
  → New member (no memberships) → /onboarding
  → Returning member → /dashboard
```

### LinkedIn Import + Profile Draft Flow
```
Member signs in with LinkedIn (first time)
  → Clerk returns LinkedIn profile data (name, headline, summary, positions)
  → Server Action: AIService.draftProfile(linkedInData)
  → Claude generates: bio, what_i_do, who_i_serve, results_i_deliver drafts
  → Member reviews and edits in /onboarding multi-step form
  → Member publishes profile
  → Supabase: upsert member_profiles row
  → Database webhook fires on member_profiles INSERT/UPDATE
  → Edge Function: combine profile text fields into embedding document
  → Edge Function: EmbeddingService.embed(document) → OpenAI text-embedding-3-small
  → Edge Function: UPDATE member_profiles SET embedding = $1, embedding_updated_at = now()
  → profile_completeness recalculated (0-100)
  [UI returned immediately after profile save — embedding is async]
```

### Standing Ask + Match Notification Flow
```
Member creates Ask
  → Server Action validates input (Zod) + checks auth
  → Supabase: INSERT into asks (body, visibility, status: active)
  → AIService.extractGeography(ask.body) → geography_filter array
  → UPDATE asks SET geography_filter = [...]
  → Database webhook fires on asks INSERT
  → Edge Function: EmbeddingService.embed(ask.body)
  → Edge Function: UPDATE asks SET embedding = $1
  → Edge Function: run core matching query (see ECOSYSTEM.md)
  → Filter: cross-chapter only, geography overlap, same organization, active members
  → Top 3 matches above 0.75 cosine similarity threshold
  → INSERT into matches (ask_id, matched_member_id, match_score, match_reason)
  → AIService.generateMatchReason(ask, profile) for each match
  → INSERT into notifications (type: new_match, member_id: asker)
  → NotificationService.sendMatchDigest(asker, matches) — scheduled or immediate per prefs
  → PushService.notify(asker) if push_enabled

  [30-day nudge cron — runs daily]
  → Query: asks WHERE status = 'active' AND created_at < now() - interval '30 days'
             AND NOT EXISTS (SELECT 1 FROM matches WHERE ask_id = asks.id)
  → AIService.generateAskNudge(ask) → suggestion sentence
  → INSERT notification (type: ask_no_matches_nudge)
```

### Warm Introduction Flow
```
Member A views match and requests intro to Member B
  → Server Action: createIntroductionRequest(requester_id, target_id, ask_id, match_id, message)
  → Connector selection algorithm (application layer):
      Query: chapter_memberships WHERE chapter_id = target's chapter AND status = 'active'
             ORDER BY joined_at ASC (longest tenure first)
      Tiebreak: COUNT referrals in last 90 days DESC
      Result: connector_member_id (or null if no active chapter members)
  → INSERT introductions (status: pending, connector_response: pending)
  → NotificationService.notifyConnector(connector, requester, target, message)

  [Connector responds]
  → accepted:
      UPDATE introductions SET connector_response = 'accepted', intro_sent_at = now()
      UPDATE introductions SET status = 'completed'
      NotificationService.notifyBothParties(requester, target)
      Generate mailto: link with both emails pre-populated
  → declined:
      UPDATE introductions SET connector_response = 'declined'
      INSERT direct intro request: connector_member_id = null
      NotificationService.notifyTarget(target, requester_full_profile)
  → suggested_alternative:
      UPDATE introductions SET alternative_member_id = $1
      Restart flow with alternative connector
```

### Billing Flow
```
Network Admin onboards new chapter
  → Server Action: createChapter(chapter data)
  → BillingService.getOrCreateCustomer(franchise_owner_email)
  → BillingService.createSubscription(customer_id, price_id: chapter_monthly_cad)
  → Stripe: subscription created, first invoice generated
  → Stripe webhook → /api/webhooks/stripe
      invoice.paid → UPDATE chapters SET billing_status = 'active'
      invoice.payment_failed → INSERT notification (type: billing_failure) to network_admin
      customer.subscription.deleted → UPDATE chapters SET is_active = false
  → Chapter member count monitored on every chapter_membership INSERT:
      count >= 23: INSERT notification (type: chapter_limit_warning) to network_admin + director
      count >= 25: BLOCK new invitations, return error to director
```

## Architectural Decision Records

### ADR-001: Dedicated Deployment Per Network Customer
**Date:** April 2026 | **Status:** Accepted
**Context:** Multiple network orgs will license Needl. Each has data sovereignty concerns.
**Decision:** Separate Supabase project + Vercel deployment per network customer.
**Options Considered:** Shared schema multi-tenant with RLS; schema-per-tenant (one project).
**Rationale:** A missed RLS policy in a shared schema is a catastrophic breach in this domain.
Data ownership as a selling point simplifies the compliance conversation. Correct for current
customer count.
**Consequences:** More ops overhead per new customer. Automate with Terraform/Pulumi
when customer count exceeds 10.

### ADR-002: Async Embedding Pipeline via Edge Functions
**Date:** April 2026 | **Status:** Accepted
**Context:** Profile saves and Ask posts need vector embeddings. Embedding calls are 200-800ms.
**Decision:** Supabase database webhooks trigger Edge Functions. UI never waits for embeddings.
**Options Considered:** Inline in Server Action (simple but slow); BullMQ job queue (heavier).
**Rationale:** Mobile UX must feel instant. Edge Functions are serverless and retry on failure.
**Consequences:** Brief stale embedding window (seconds) after save. Acceptable.
Show "updating..." in search if embedding_updated_at > 60s behind updated_at.

### ADR-003: Clerk Over Supabase Auth
**Date:** April 2026 | **Status:** Accepted
**Decision:** Clerk for auth. Google + LinkedIn OAuth.
**Rationale:** LinkedIn profile import at onboarding is a core UX feature. Clerk's Next.js 15
integration and LinkedIn OAuth are first-class. Multi-chapter JWT claims are straightforward.
**Consequences:** Costs money at scale. Migration path exists behind AuthService abstraction.

### ADR-004: Service Abstraction Layer
**Date:** April 2026 | **Status:** Accepted
**Decision:** All external services behind typed interfaces in src/lib/services/.
**Rationale:** Needl is built to sell to BNI. The acquirer will have preferred vendors.
Swapping Resend for SendGrid or OpenAI for a self-hosted model should be a one-file change.
**Consequences:** Slightly more boilerplate upfront. Essential for due diligence readiness.

### ADR-005: Matches Table is Append-Only
**Date:** April 2026 | **Status:** Accepted
**Decision:** No DELETE RLS policy on the matches table.
**Rationale:** Matches is the AI engine audit trail. Regulators and acquirers will want to
see how matches were generated and what actions were taken. Immutability is a feature.
**Consequences:** Table grows indefinitely. Partition by created_at year if it exceeds 10M rows.

### ADR-006: OpenAI text-embedding-3-small Over ada-002
**Date:** April 2026 | **Status:** Accepted
**Decision:** text-embedding-3-small (1536 dimensions) for all embeddings.
**Rationale:** Newer model, better benchmark performance, lower cost per token than ada-002.
Same 1536 dimensions, compatible with existing pgvector HNSW indexes.
**Consequences:** None. Straightforward upgrade from ada-002.

## Infrastructure

**Supabase regions:**
- Canadian deployments: ca-central-1 (Montreal) — PIPEDA compliance
- EU deployments: eu-west-1 (Ireland) — GDPR compliance
- US deployments: us-east-1 (Virginia) — default

**Vercel:** Team account. One project per network customer. Preview deployments on every PR.
Environment variables set per project (never shared across customers).

**GitHub:** One repository. Vercel connects to main branch for production deployments.
Feature branches get preview URLs automatically.

**Environments per customer:**
- Local: supabase start + npm run dev
- Staging: separate Supabase project + Vercel preview
- Production: production Supabase project + Vercel production deployment

## Security Architecture

**Tenant isolation:** RLS at database level. Each Supabase project is a single-tenant
environment. organization_id on every table is a defense-in-depth measure within the
deployment — not the primary isolation mechanism.

**Auth:** Clerk JWTs validated in Next.js middleware on every request. Supabase client
initialized with the user JWT for RLS context. Server Actions re-validate the session
before executing — never trust client-provided org or chapter context.

**Secrets management:** All secrets in Vercel environment variables (per project, never
shared). Local development uses .env.local (gitignored). No secrets in source code.
Supabase Vault for any secrets needed at the database layer.

**service_role key:** Used only in Edge Functions for elevated operations (embedding writes,
engagement score computation). Never in client-side code, never in Server Actions.

**Cross-chapter visibility enforcement:** RLS policies on member_profiles return a limited
column set for cross-chapter queries. Email, phone, referral history, and membership status
are excluded from cross-chapter SELECT policies.

## Known Constraints and Scalability Ceiling

This architecture comfortably handles:
- Up to 500 chapters per deployment
- Up to 12,500 members per deployment (500 × 25)
- pgvector HNSW cosine similarity on 12,500 vectors is fast (sub-50ms)

Needs re-evaluation when:
- Members per deployment exceed 50,000 (HNSW index strategy changes)
- More than 20 concurrent customer deployments (investment in Terraform automation)
- Real-time collaborative features added (Supabase Realtime channel limits)

Honest ARR ceiling before significant re-engineering: ~$3M CAD
(~250 chapters at $12,000/chapter/year across all deployments)
