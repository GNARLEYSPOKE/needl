# Needl

AI-powered member network platform for franchise-model networking organizations — built for Corporate Connections, designed to sell to BNI.

<!-- Keep this file under 200 lines. Deep context lives in docs/. Rules in .claude/rules/. Skills in .claude/skills/. -->

## Stack

- **Framework**: Next.js 15 (App Router, RSC, Server Actions)
- **Database**: Supabase Postgres + pgvector — RLS is the source of truth for data access
- **Auth**: Clerk — Google + LinkedIn OAuth, JWT with organization_id + chapter_ids[] + role
- **Embeddings**: OpenAI text-embedding-3-small (1536 dimensions) via async Edge Function pipeline
- **AI**: Anthropic Claude (claude-sonnet-4-6) — profile drafting, match rationale, ask nudges
- **Email**: Resend — via NotificationService abstraction at src/lib/services/notification.ts
- **Billing**: Stripe — per-chapter flat rate, webhooks at /api/webhooks/stripe
- **Styling**: Tailwind CSS 4 + ShadCN UI (components in src/components/ui/ — never modify directly)
- **Deployment**: Vercel — separate deployment per network customer, preview on every PR
- **Errors**: Sentry — configured from day one, free tier

## Architecture

Modular monolith, vertical slice, feature-based folders. Every external service sits behind a typed abstraction interface in src/lib/services/ — application code never calls vendor SDKs directly.
See @docs/architecture.md for data flow diagrams and ADRs.

## Folder Structure

```
src/
  app/                    # Next.js App Router — pages, layouts, route handlers
    (auth)/               # Clerk auth routes
    (app)/                # Protected app routes
      dashboard/
      search/
      profile/
      asks/
      chapter/
      admin/
    api/
      webhooks/
        clerk/            # Member upsert on Clerk events
        stripe/           # Billing lifecycle
  components/
    ui/                   # ShadCN primitives (never modify)
    search/               # Search-specific components
    profile/              # Profile-specific components
    asks/                 # Ask and match components
    introductions/        # Intro flow components
    chapter/              # Chapter admin components
    admin/                # Network admin components
  lib/
    supabase/
      client.ts           # Browser client (Realtime only)
      server.ts           # Server client (Server Components, Server Actions)
      middleware.ts        # JWT validation, org context injection
    services/
      notification.ts     # NotificationService interface + Resend adapter
      embedding.ts        # EmbeddingService interface + OpenAI adapter
      ai.ts               # AIService interface + Anthropic adapter
      billing.ts          # BillingService interface + Stripe adapter
      storage.ts          # StorageService interface + Supabase adapter
      push.ts             # PushService interface + web push adapter
    actions/              # Server Actions — one file per feature domain
  types/
    database.ts           # Auto-generated from: supabase gen types typescript --linked
    index.ts              # App-level types not in database schema
supabase/
  migrations/             # SQL files — never edit a deployed migration
  seed.sql                # Realistic seed data (10 chapters, 60-80 members)
  functions/              # Edge Functions — embedding pipeline, cron jobs
docs/
  architecture.md         # ADRs, data flow diagrams, infrastructure
  ui-system.md            # Design principles, component patterns
  api-contracts.md        # Server Action signatures, webhook contracts
specs/
  requirements.md         # What we're building and why
  design.md               # Technical decisions already made
  tasks.md                # Ordered implementation checklist
.claude/
  rules/                  # Path-scoped conventions loaded on demand
  skills/                 # Reusable workflows
ECOSYSTEM.md              # Domain model — read before touching any schema or data code
```

## Domain Model

Read @ECOSYSTEM.md before modifying any database schema or writing data-access code.
`chapter_memberships` is the load-bearing join table. Almost every meaningful query joins through it.

## Commands

```bash
npm run dev              # Development server (http://localhost:3000)
npm run build            # Production build
npm run type-check       # TypeScript strict check — run before every commit
npm run lint             # ESLint — run before every commit
npm run test             # Test suite
supabase start           # Start local Supabase
supabase db push         # Apply pending migrations to local
supabase db diff -f name # Generate migration from schema changes
supabase gen types typescript --linked > src/types/database.ts
supabase functions serve # Serve Edge Functions locally
```

## Conventions

- TypeScript strict mode. No `any`. No untyped function params. No type assertions without comment.
- Named exports only. No default exports. Ever.
- Functional components only. No class components.
- Server Components by default. Add `'use client'` only for: hooks, event handlers, browser APIs, Realtime.
- Never fetch data in Client Components — pass as props from Server Components.
- Server Actions for all mutations. Route handlers only for webhooks and file uploads.
- All Server Actions: validate session → validate input (Zod) → check role → execute → return `{ data, error }`.
- Never call vendor SDKs directly. Use the service abstraction in src/lib/services/.
- Never use service_role key in client-side or browser code.
- Never block a UI response waiting for an embedding call — always async via Edge Function.

## Quality Policy

Zero tolerance for:

- Hydration errors
- TypeScript errors (pre-commit hook will catch and block)
- Placeholder implementations or `// TODO` in any committed code
- RLS bypasses — service_role key is server-side Edge Function only
- Direct vendor SDK calls outside src/lib/services/

## Critical Build Rules

1. `chapter_memberships` indexes `(chapter_id, status)` and `(member_id, status)` must exist from migration 003. Do not remove or defer these.
2. Embedding pipeline is always async. Never await an embedding call in a Server Action or route handler.
3. The `matches` table is append-only. There is no DELETE RLS policy on it. Do not add one.
4. `data_residency` column on members is required. Do not omit.
5. Seed the database before demoing. Zero search results kills a demo.

## Git Workflow

- Commit after every phase in specs/tasks.md
- Format: `feat(scope): description` or `fix(scope): description`
- Never force push to main
- PR required for any merge to main

## Plan Mode

Use Plan Mode (Shift+Tab twice) before:

- Any change touching more than 3 files
- Any schema change or new migration
- Any auth, billing, or service abstraction modification
- Any new feature implementation

## Context Management

- /clear between unrelated tasks
- /compact with "preserve: architectural decisions, service abstraction layer, current task, error states" before context limit
- /audit-rls before any production deployment
