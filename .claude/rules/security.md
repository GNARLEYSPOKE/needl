# Security Rules

<!-- No paths frontmatter — this file loads for every Claude Code session. -->

## Secrets Management
- Never hardcode API keys, tokens, or credentials in source code
- All secrets in environment variables (.env.local locally, Vercel env vars in production)
- .env.local is gitignored — never commit it
- Supabase Vault for any secrets needed at the database layer (Edge Functions)
- service_role key: used only in Edge Functions, never in Server Actions or client code

## RLS Requirements
- Every table containing member or chapter data MUST have RLS enabled
- Every table MUST have `organization_id` — enforce tenant isolation in every policy
- SELECT policy MUST check `organization_id` matches the authenticated user's org
- Cross-chapter member_profiles SELECT policy returns summary columns only (no email, phone)
- The `matches` table has no DELETE policy — it is append-only
- Never use service_role key in any client-side code or Server Action
- Run `/audit-rls` before any production deployment

## Auth Requirements
- Validate Clerk session in every Server Action: `const { userId } = await auth()`
- Check role from JWT sessionClaims before any privileged operation
- Never trust client-provided organization_id or chapter_id — derive from JWT
- Clerk webhook signature must be validated (Svix) before processing any event
- Stripe webhook signature must be validated before processing any event

## Input Validation
- Zod schema for every Server Action input — define once, use on client and server
- Sanitize any user content rendered as HTML (use dangerouslySetInnerHTML sparingly)
- Supabase parameterized queries only — never string interpolation in SQL

## Embedding Pipeline Security
- Edge Functions that write embeddings use service_role key — scoped to that operation only
- Embedding documents must never include private fields (email, phone, membership status)
- The embedding text composition (ECOSYSTEM.md) is the authoritative definition

## Dependency Security
- Run `npm audit` before any production deployment
- No packages with known critical CVEs
- Prefer official packages from verified publishers
- Review any new package before adding
