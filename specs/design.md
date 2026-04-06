# Needl — Technical Design

## Architectural Pattern

Modular monolith using vertical slice architecture with feature-based folder organization,
where every external dependency sits behind a swappable service abstraction interface.

## Stack Decisions

| Layer          | Technology                    | Version           | Rationale                                                                           |
| -------------- | ----------------------------- | ----------------- | ----------------------------------------------------------------------------------- |
| Framework      | Next.js                       | 15                | App Router, RSC, Server Actions — best Next.js DX available                         |
| Database       | Supabase Postgres + pgvector  | latest            | RLS, realtime, storage, vector search in one platform                               |
| Auth           | Clerk                         | latest            | Best Next.js auth DX, organizations map to chapters, LinkedIn social login built-in |
| Email          | Resend                        | latest            | Clean API, excellent deliverability, developer-friendly                             |
| Embeddings     | OpenAI text-embedding-3-small | latest            | Best price/performance for 1536-dim vectors, battle-tested with pgvector            |
| AI Drafting    | Anthropic Claude              | claude-sonnet-4-6 | Profile drafting, match rationale generation, ask nudges                            |
| Billing        | Stripe                        | latest            | Subscription management, invoicing, per-chapter billing                             |
| Deployment     | Vercel                        | latest            | Edge, preview deployments on every PR, zero-config Next.js                          |
| Styling        | Tailwind CSS 4 + ShadCN UI    | 4 / latest        | Utility-first, mobile-first, composable component system                            |
| Error Tracking | Sentry                        | latest            | Free tier covers prototype and pilot, upgrade post-scale                            |
| Storage        | Supabase Storage              | latest            | Profile photos and headshots only — simple, integrated                              |

## Tenancy Architecture

Needl uses a **dedicated deployment per network customer** (Option B). Corporate Connections
Canada gets their own Supabase project and Vercel deployment. BNI, when they sign, gets their
own. Member data never shares infrastructure with another network customer.

This is a deliberate product decision, not just a technical one. Data ownership is a core
selling point. CC's legal team can confirm their member data lives in an isolated environment.
This simplifies the compliance story for PIPEDA (Canada) and GDPR (EU expansion) and
eliminates any multi-tenant RLS risk.

Within each deployment, the `organizations` table is the root entity (always one row per
deployment). `chapter_memberships` is the load-bearing join table — almost every meaningful
query joins through it. RLS policies enforce that members can only read data within their
own organization.

Subdomain routing for the pilot: `corporateconnections.needl.app`
White-label custom domain (`network.corporateconnections.com`) is a config flag unlocked
at the enterprise tier.

## Data Flow Diagrams

### Auth Flow

```
Browser
  → Clerk hosted UI (Google or LinkedIn OAuth)
  → Clerk webhook → Next.js /api/webhooks/clerk
  → Upsert member record in Supabase
  → Resolve chapter_memberships for this member
  → JWT issued with: { member_id, organization_id, chapter_ids[], role }
  → Next.js middleware reads JWT, sets org context on every request
```

### Member Profile + Embedding Pipeline

```
Member saves profile
  → Server Action validates input (Zod)
  → Supabase upserts member_profiles row
  → Supabase database webhook fires on member_profiles UPDATE
  → Edge Function: fetch updated profile text fields
  → Edge Function: call OpenAI text-embedding-3-small
  → Edge Function: write embedding vector back to member_profiles.embedding
  → profile_completeness score recalculated
  [UI returns immediately — embedding is async]
```

### Standing Ask + Match Flow

```
Member posts Ask
  → Server Action validates + inserts asks row
  → Supabase database webhook fires on asks INSERT
  → Edge Function: embed ask body via OpenAI
  → Edge Function: run pgvector similarity query against member_profiles
  → Edge Function: filter by country, exclude requester's chapter
  → Top 3 matches above threshold → insert into matches table
  → Insert notifications for asker
  → NotificationService sends push + email digest
```

### Warm Introduction Flow

```
Member requests intro to matched member
  → Server Action creates introductions row (status: pending)
  → Connector selection algorithm runs:
      1. Active member in same chapter as target
      2. Longest mutual tenure in organization
      3. Highest referral activity score
  → NotificationService notifies connector
  → Connector accepts → intro_sent_at recorded → both parties notified
  → Connector declines → direct request sent to target with requester profile
```

### Billing Flow

```
New chapter onboarded
  → Network Admin creates chapter in Needl admin
  → Stripe Customer created for franchise owner (if not exists)
  → Stripe Subscription created: $1,000 CAD/month per chapter
  → Stripe invoice generated monthly
  → Stripe webhook → /api/webhooks/stripe → update chapter billing_status
  → Chapter at 23 members → soft notification to Network Admin and Chapter Director
  → Chapter at 25 members → hard limit enforced, new member invites blocked
```

## Key Architectural Decisions (ADRs)

### ADR-001: Dedicated Deployment Per Network Customer

**Date:** April 2026
**Status:** Accepted
**Context:** Needl will serve multiple network organizations (CC, BNI, EO). Each organization
has data sovereignty requirements and their members' relationship data is competitively
sensitive.
**Decision:** Each network customer gets their own Supabase project and Vercel deployment.
**Options Considered:** Shared schema multi-tenant with RLS (simpler ops, lower cost);
schema-per-tenant in one Supabase project (middle ground).
**Rationale:** Data ownership is a product differentiator and a legal selling point. A missed
RLS policy in a shared schema is a catastrophic breach. Dedicated deployments eliminate that
risk entirely and make the compliance conversation simple.
**Consequences:** More ops overhead per new customer. Acceptable at pilot scale. Revisit
if customer count exceeds 20.

### ADR-002: Async Embedding Pipeline via Edge Functions

**Date:** April 2026
**Status:** Accepted
**Context:** Profile saves and Ask posts need vector embeddings for search and matching.
OpenAI embedding calls take 200-800ms.
**Decision:** Never block a UI response waiting for an embedding call. Use Supabase database
webhooks to trigger Edge Functions that write embeddings back asynchronously.
**Options Considered:** Inline embedding in Server Action (simple but slow UX);
background job queue via BullMQ (more infrastructure).
**Rationale:** UX must feel instant on mobile. Edge Functions are serverless, retry on
failure, and require no additional infrastructure.
**Consequences:** There is a brief window (seconds) after a profile save where the embedding
is stale. Acceptable. Search results show a "updating..." indicator if embedding_updated_at
is more than 60 seconds behind updated_at.

### ADR-003: Clerk Over Supabase Auth

**Date:** April 2026
**Status:** Accepted
**Context:** Auth provider selection with LinkedIn social login and multi-chapter membership
as requirements.
**Decision:** Clerk.
**Options Considered:** Supabase Auth (free, integrated, awkward multi-org); Auth0 (expensive,
heavy); WorkOS (overkill without enterprise SSO requirement).
**Rationale:** Clerk's organizations map naturally to chapters. LinkedIn OAuth is first-class.
Next.js 15 App Router integration is the best available. The developer experience difference
is significant for a solo + Claude Code build.
**Consequences:** Costs money at scale. Acceptable. Migration path to Supabase Auth exists
if needed behind the AuthService abstraction.

### ADR-004: Service Abstraction Layer

**Date:** April 2026
**Status:** Accepted
**Context:** Needl is built to sell. The acquirer (likely BNI) will have preferred vendors
for email, AI, embeddings, and billing.
**Decision:** Every external service dependency sits behind a typed interface in src/lib/services/.
Application code calls the interface, never the vendor SDK directly.
**Options Considered:** Direct vendor SDK calls (simpler now, painful to swap later).
**Rationale:** Swapping Resend for SendGrid, or OpenAI for a self-hosted model, should be
a one-file change. This is a due diligence feature as much as an engineering one.
**Consequences:** Slightly more boilerplate upfront. Worth it for every file after.

### ADR-005: chapter_memberships as Load-Bearing Table

**Date:** April 2026
**Status:** Accepted
**Context:** A member's meaningful context (role, profession category, status, tenure) lives
at the chapter level, not the member level. Members can belong to multiple chapters.
**Decision:** chapter_memberships is the primary join table for almost every query. Indexes
on (chapter_id, status) and (member_id, status) are in the initial migration.
**Consequences:** Every query that touches member context joins through this table. Missing
indexes would cause crawling admin queries at scale. This is a day-one constraint.

## Security Model

**Data isolation:** Enforced at the database level via Supabase RLS. Every table has RLS
enabled. Policies check that the authenticated member's organization_id matches the row's
organization_id. Application-level filtering is a defense-in-depth measure, not the
primary control.

**Auth:** Clerk JWTs contain organization_id, chapter_ids[], and role. Middleware validates
the JWT on every request. Server Actions re-validate the session — never trust client-provided
org context.

**Secrets:** All API keys in environment variables. Never in source code. Supabase Vault for
any secrets that need database-level access. .env.local gitignored.

**Compliance:** PIPEDA (Canada) — data_residency flag on member records, Supabase project
in ca-central-1 region for Canadian deployments. GDPR (EU) — same flag, eu-west-1 region
for EU deployments. Soft delete everywhere — member data is never hard-deleted without
explicit Network Admin action.

**RLS never bypassed:** The service_role key is never used in client-side or browser code.
Edge Functions that need elevated access use it server-side only, scoped to specific
operations.

## Scalability Ceiling

This architecture comfortably supports:

- 1 network customer per deployment
- Up to 500 chapters per deployment
- Up to 12,500 members per deployment (500 chapters × 25 members)
- pgvector cosine similarity search on 12,500 member embeddings is fast with an HNSW index

The architecture needs re-evaluation when:

- A single network customer exceeds 50,000 members (pgvector index strategy changes)
- Needl manages more than 20 customer deployments (ops automation required)
- Real-time collaborative features are added (Supabase Realtime channel limits apply)

Honest ARR ceiling before significant re-engineering: ~$3M CAD
(~250 chapters across all deployments at $12,000/chapter/year)
Beyond that, invest in deployment automation and evaluate shared-schema migration.
