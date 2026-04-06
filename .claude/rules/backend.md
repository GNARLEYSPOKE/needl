---
paths:
  - "src/app/api/**/*"
  - "src/lib/actions/**/*"
  - "src/lib/services/**/*"
  - "src/lib/supabase/**/*"
  - "supabase/**/*"
---

# Backend and Database Conventions

## Supabase Client Usage
- `createClient()` from src/lib/supabase/server.ts — Server Components, Server Actions, Route Handlers
- `createBrowserClient()` from src/lib/supabase/client.ts — Client Components for Realtime only
- Never instantiate a Supabase client inside a loop — call once per request
- Never use the service_role key outside of Edge Functions

## Service Abstractions
- Never call vendor SDKs directly from Server Actions or components
- All external services go through src/lib/services/:
  - NotificationService for email and push
  - EmbeddingService for OpenAI embedding calls
  - AIService for Anthropic Claude calls
  - BillingService for Stripe operations
  - StorageService for Supabase Storage
- If you need a new external service, create the interface in src/lib/services/ first

## Database Conventions
- All tables: `id uuid DEFAULT gen_random_uuid() PRIMARY KEY`
- All tables: `created_at timestamptz DEFAULT now() NOT NULL`
- Data tables: `organization_id uuid NOT NULL REFERENCES organizations(id)`
- Soft delete tables: `deleted_at timestamptz` (never hard-delete member or chapter data)
- `NOT NULL` by default. Nullable only when absence is meaningful (not just optional).
- Foreign key columns always get an index
- chapter_memberships indexes (chapter_id, status) and (member_id, status) are sacred — never remove

## Migrations
- Never edit a migration file that has been applied to any environment
- Generate with: `supabase db diff --linked -f [descriptive-name]`
- Every migration includes: schema change + RLS policies + indexes in the same file
- Run `supabase gen types typescript --linked > src/types/database.ts` after every migration
- Test against local Supabase before applying to staging

## Server Actions
- File location: src/lib/actions/[feature].ts
- Always in this order: validate session → validate input (Zod) → check role → execute
- Return type: `Promise<{ data: T | null; error: string | null }>`
- Never throw — return structured errors always
- Never trust client-provided organization_id — derive from JWT sessionClaims

## Webhook Route Handlers
- Validate signatures before processing (Svix for Clerk, Stripe for Stripe)
- Return 200 after processing — providers retry on non-200
- Return 200 even for unhandled event types (don't return 400 for unknown events)
- Log the event type on every webhook receipt

## Embedding Pipeline
- Never await an embedding call in a Server Action or Route Handler
- Embeddings are written by Edge Functions triggered by database webhooks
- Embedding text composition for member_profiles:
  [tagline, bio, what_i_do, who_i_serve, results_i_deliver, clients_served.join(', ')].join('\n')
- Embedding text for asks: ask.body only
- Model: OpenAI text-embedding-3-small (1536 dimensions)
- HNSW indexes on member_profiles.embedding and asks.embedding — do not remove

## Edge Functions
- Located in supabase/functions/
- Use service_role key only here, never elsewhere
- Always handle errors and return a response (Supabase retries on unhandled errors)
- Cron schedules defined in supabase/functions/_shared/cron-config.ts
