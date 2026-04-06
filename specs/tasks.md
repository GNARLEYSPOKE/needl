# Needl — Implementation Tasks

Ordered implementation checklist for Claude Code. Each phase is a Claude Code session.
Commit after every phase. Do not proceed to the next phase until all items are checked.
Run `npm run type-check && npm run lint` before every commit.

---

## Phase 0: Project Scaffold
- [ ] Initialize Next.js 15 with TypeScript strict mode (`npx create-next-app@latest needl --typescript --tailwind --app --src-dir`)
- [ ] Configure Tailwind CSS 4 and install ShadCN UI (`npx shadcn@latest init`)
- [ ] Install ShadCN base components: button, card, input, label, badge, avatar, skeleton, toast, dialog, dropdown-menu, sheet
- [ ] Initialize Supabase project in ca-central-1 region, enable pgvector extension
- [ ] Create .env.local with: NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY, NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY, CLERK_SECRET_KEY, OPENAI_API_KEY, ANTHROPIC_API_KEY, RESEND_API_KEY, STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET, SENTRY_DSN
- [ ] Set up ESLint (strict), Prettier, Husky pre-commit hooks (type-check + lint)
- [ ] Configure Sentry for Next.js error tracking
- [ ] Create src/lib/services/ directory with typed interfaces: NotificationService, EmbeddingService, AIService, BillingService, StorageService, PushService
- [ ] Implement Resend adapter for NotificationService
- [ ] Implement OpenAI text-embedding-3-small adapter for EmbeddingService
- [ ] Implement Anthropic Claude adapter for AIService
- [ ] Initialize git, create main branch, push to GitHub
- [ ] Deploy blank app to Vercel (ca-central-1 region), confirm CI/CD pipeline works
- [ ] Confirm Sentry receives a test error from the deployed app

**Commit:** `feat: initial project scaffold`

---

## Phase 1: Database Foundation
- [ ] Enable pgvector extension in Supabase: `CREATE EXTENSION IF NOT EXISTS vector`
- [ ] Migration 001: organizations, countries, regions tables with RLS
- [ ] Migration 002: chapters table with RLS
- [ ] Migration 003: chapter_memberships table
  - Indexes: `(chapter_id, status)` and `(member_id, status)` — non-negotiable
  - Unique constraint: `(chapter_id, member_id) WHERE deleted_at IS NULL`
  - Conditional unique: `(chapter_id, profession_category)` enforced by trigger when `organization.profession_exclusivity = true`
  - RLS: members can read their own chapter_memberships; directors can read their chapter
- [ ] Migration 004: members table with data_residency char(2), soft delete
- [ ] Migration 005: member_profiles table
  - `embedding vector(1536)` column
  - HNSW index: `CREATE INDEX ON member_profiles USING hnsw (embedding vector_cosine_ops)`
  - RLS: members can read profiles within their organization; full profile only for same-chapter members; summary profile for cross-chapter
- [ ] Migration 006: notification_preferences table
- [ ] Migration 007: testimonials table with RLS
- [ ] Migration 008: forum schema stub (forums, forum_memberships) — RLS only, no application code
- [ ] Run `supabase gen types typescript --linked > src/types/database.ts`
- [ ] Verify all RLS policies: member A cannot read member B's data from a different organization
- [ ] Seed: insert one organization (Corporate Connections Canada), three regions, one chapter

**Commit:** `feat: database foundation with RLS`

---

## Phase 2: Auth and Session
- [ ] Install and configure Clerk for Next.js 15 App Router
- [ ] Configure Clerk: enable Google OAuth, enable LinkedIn OAuth
- [ ] Create Clerk webhook handler at `/api/webhooks/clerk`
  - On user.created: upsert member record in Supabase
  - On user.updated: sync email, name, avatar_url
- [ ] Create Next.js middleware: validate Clerk JWT, extract organization_id + chapter_ids[] + role, attach to request context
- [ ] Build: `/sign-in` page using Clerk hosted UI
- [ ] Build: `/sign-up` page using Clerk hosted UI
- [ ] Build: post-auth redirect logic
  - New member with no chapter_memberships → onboarding flow
  - Existing member → dashboard
- [ ] Build: LinkedIn profile import on first sign-in (fetch LinkedIn data, pass to AIService.draftProfile)
- [ ] Test: unauthenticated user cannot access any protected route
- [ ] Test: authenticated member cannot access another organization's data

**Commit:** `feat: auth and session with Clerk`

---

## Phase 3: Member Profile
- [ ] Build: `/onboarding` multi-step flow
  - Step 1: Profile basics (company name, tagline, what_i_do)
  - Step 2: Who I serve and results I deliver
  - Step 3: Clients served (named optional, industry categories required)
  - Step 4: Geography served (multi-select countries/regions)
  - Step 5: Profile photo + headshot upload (Supabase Storage)
  - Step 6: Review AI-drafted bio, edit, publish
- [ ] Implement profile_completeness scoring (0-100) recalculated on every profile save
- [ ] Build: Supabase database webhook on member_profiles → Edge Function
  - Edge Function: call EmbeddingService.embed(profile text fields combined)
  - Edge Function: write embedding back to member_profiles.embedding
  - Edge Function: update embedding_updated_at
- [ ] Build: `/profile/[memberId]` — public profile view (cross-chapter summary only)
- [ ] Build: `/profile/edit` — full profile edit for authenticated member
- [ ] Build: profile completeness nudge UI (shown in dashboard until score > 70)
- [ ] Test: embedding pipeline fires within 5 seconds of profile save
- [ ] Test: cross-chapter member cannot see contact details of another member

**Commit:** `feat: member profile with async embedding pipeline`

---

## Phase 4: Search and Matching Engine
- [ ] Build: `/search` — cross-chapter natural language search
  - Input: plain language query (no dropdowns)
  - On submit: call EmbeddingService.embed(query) → pgvector similarity search
  - Filter: organization_id match, exclude requester's own chapter, geography_served overlap
  - Return: top 3 results with match_score and AI-generated match_reason
  - Each result: summary profile card + "Request Introduction" CTA
  - Mobile-first: full experience works on 375px viewport in under 30 seconds
- [ ] Build: pgvector similarity search function in Supabase (corrected query from ECOSYSTEM.md)
- [ ] Build: AIService.generateMatchReason(ask, profile) → one sentence explanation
- [ ] Build: country filter — search results filtered by member's geography_served array
- [ ] Test: search returns results from different chapters within same organization
- [ ] Test: search never returns members from a different organization
- [ ] Test: search returns zero results gracefully (no broken UI)

**Commit:** `feat: cross-chapter search and matching engine`

---

## Phase 5: Standing Ask
- [ ] Migration: asks table with embedding vector(1536) and HNSW index
- [ ] Migration: matches table (append-only — no DELETE policy on this table)
- [ ] Build: Supabase database webhook on asks INSERT/UPDATE → Edge Function
  - Edge Function: embed ask body
  - Edge Function: run similarity search against member_profiles
  - Edge Function: filter cross-chapter, geography match
  - Edge Function: top 3 matches → insert into matches table
  - Edge Function: insert notifications for asker
- [ ] Build: `/asks/new` — create standing ask (body, visibility toggle: chapter|network)
- [ ] Build: AI geography extraction from ask body (AIService.extractGeography)
- [ ] Build: ask match notification (push + email via NotificationService)
- [ ] Build: AI nudge — if ask generates zero matches in 30 days, suggest update
  - Scheduled Edge Function (cron): check asks with no matches older than 30 days
  - Insert notification with AIService-generated suggestion
- [ ] Build: `/asks` — member's active asks list with match counts
- [ ] Build: ask fulfillment flow (mark as fulfilled, attribute to a member)
- [ ] Test: posting an ask triggers embedding and match within 10 seconds
- [ ] Test: matches table rows are never deleted (audit trail integrity)

**Commit:** `feat: standing ask engine with async matching`

---

## Phase 6: Warm Introduction Flow
- [ ] Migration: introductions table with all status enums
- [ ] Build: connector selection algorithm (Server Action)
  - Priority 1: active member in same chapter as target
  - Priority 2: longest mutual tenure (joined_at) in organization
  - Priority 3: highest referral_count in last 90 days
  - Fallback: direct request if no connector found
- [ ] Build: introduction request flow (from search result or match notification)
  - Requester writes note → connector selected and notified
  - Connector: accept (intro sent) or decline (direct request triggered) or suggest alternative
- [ ] Build: direct request flow (no mutual connector)
  - Target receives requester's full profile + message
  - Target: accept or decline
- [ ] Build: introduction status tracking UI (requester sees live status)
- [ ] Build: mailto link generation on accepted introduction (both emails pre-populated)
- [ ] Build: NotificationService calls for each introduction state transition
- [ ] Test: connector receives notification within 30 seconds of intro request
- [ ] Test: direct request fires correctly when connector declines

**Commit:** `feat: warm introduction flow with connector algorithm`

---

## Phase 7: Chapter Features
- [ ] Migration: asks table visibility field (chapter|network already in schema)
- [ ] Build: `/chapter/asks` — chapter ask board
  - All active asks from chapter members
  - Visibility: chapter-scoped only
  - Members can comment or offer to help (simple reply, not a full thread)
- [ ] Migration: events, visitor_invitations, event_attendances tables
- [ ] Build: `/events/new` — Chapter Director creates meeting event
- [ ] Build: `/invite/[token]` — visitor RSVP page (public, no auth required)
- [ ] Build: member invite flow — personalized link generation with invite_token
- [ ] Build: visitor pipeline view for Chapter Directors
  - Columns: invited, RSVP'd, attended, followed up, applied, joined
- [ ] Migration: referrals table
- [ ] Build: `/referrals/new` — log a referral (mobile-first, under 20 seconds)
- [ ] Build: referral history view for members
- [ ] Test: visitor RSVP link works without authentication
- [ ] Test: Chapter Director cannot see visitor pipeline from another chapter

**Commit:** `feat: chapter ask board, visitor pipeline, referral logging`

---

## Phase 8: Onboarding Journey
- [ ] Build: new member onboarding checklist component (shown in dashboard)
  - Step 1: Complete profile (profile_completeness > 70) ✓/✗
  - Step 2: Post your first Standing Ask ✓/✗
  - Step 3: Run your first search ✓/✗
  - Step 4: Make your first connection request ✓/✗
- [ ] Track onboarding completion per member (onboarding_completed_at on members table)
- [ ] Build: Chapter Director onboarding dashboard — who has completed each step
- [ ] Build: automated 7-day nudge email if member hasn't completed onboarding
  - NotificationService.sendOnboardingNudge() triggered by cron Edge Function

**Commit:** `feat: new member onboarding journey`

---

## Phase 9: Admin Dashboard and Chapter Health
- [ ] Build: materialized view — member_engagement_scores (refresh weekly via cron)
  - Inputs: event attendances (90d), asks posted (90d), referrals logged (90d),
    introductions made or accepted (90d), profile_completeness, last_login_at recency
  - Output: engagement_score 0-100 per member
  - Flag: is_at_risk = true when score < 30 AND expires_at within 90 days
- [ ] Build: `/admin` — Network Admin dashboard
  - Chapter list with health scores
  - At-risk member flags across all chapters
  - Member count per chapter (soft limit warning at 23)
  - Billing status per chapter
- [ ] Build: `/chapter/admin` — Chapter Director dashboard
  - Member list with engagement scores
  - At-risk member flags
  - Visitor pipeline summary
  - Onboarding completion status
- [ ] Build: Stripe webhook handler at `/api/webhooks/stripe`
  - invoice.paid → update chapter billing_status to active
  - invoice.payment_failed → flag chapter, notify Network Admin
  - customer.subscription.deleted → suspend chapter
- [ ] Build: chapter member limit enforcement
  - Hard block at 25 active members (new invites rejected)
  - Soft notification to Network Admin and Chapter Director at 23
- [ ] Test: engagement score materialized view refreshes correctly
- [ ] Test: at-risk flag appears for members with score < 30 expiring within 90 days

**Commit:** `feat: admin dashboard and chapter health scoring`

---

## Phase 10: Seed Data and Demo Prep
- [ ] Generate realistic seed data using Claude (AIService):
  - 10 chapters across 3 regions (Ontario, British Columbia, Alberta)
  - 6-8 members per chapter with complete profiles
  - Real industry distribution: legal, accounting, real estate, tech, marketing,
    financial services, HR, logistics, insurance, construction
  - Client types that make sense for each profession
  - 15-20 active Standing Asks across chapters
  - 10 matches already generated and notified
  - 5 completed introductions
  - 8 referrals logged
- [ ] Load seed data via `supabase/seed.sql`
- [ ] Verify: search returns meaningful results for "I need a real estate lawyer in Toronto"
- [ ] Verify: search returns meaningful results for "looking for a marketing agency in Vancouver"
- [ ] Verify: at least 3 at-risk members appear in admin dashboard
- [ ] Verify: visitor pipeline has at least 5 invitations in various stages
- [ ] Demo walkthrough: complete the full flow from search → match → intro request → acceptance

**Commit:** `feat: seed data and demo preparation`

---

## Phase 11: Production Readiness
- [ ] RLS audit: run `/audit-rls` skill across all tables
- [ ] Environment variables audited — no secrets in source code, no .env files committed
- [ ] Sentry configured for production environment (separate DSN from development)
- [ ] Staging environment: separate Supabase project + Vercel deployment confirmed
- [ ] Performance baseline: Lighthouse mobile score > 80 on search and profile pages
- [ ] pgvector HNSW index confirmed on member_profiles.embedding and asks.embedding
- [ ] chapter_memberships indexes confirmed: (chapter_id, status), (member_id, status)
- [ ] Runbook written for: embedding pipeline failure, Stripe webhook failure, Clerk webhook failure
- [ ] README updated for developer onboarding (clone → .env.local → supabase db push → npm run dev)
- [ ] Open source license audit: no GPL-licensed dependencies

**Commit:** `feat: production readiness`
