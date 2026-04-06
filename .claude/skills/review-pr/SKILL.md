---
name: review-pr
description: Review a pull request for code quality, security vulnerabilities, RLS compliance, TypeScript errors, embedding pipeline correctness, and Needl convention adherence. Use before merging any PR.
disable-model-invocation: true
context: fork
agent: Explore
allowed-tools: Read Grep Glob Bash(git *)
---

Review the current branch against main for the following. Output a structured PASS/FAIL report with specific file and line references for any failures.

**Security**

- No hardcoded API keys, tokens, or credentials
- No service_role key usage outside of supabase/functions/
- Clerk webhook signature validation present in /api/webhooks/clerk
- Stripe webhook signature validation present in /api/webhooks/stripe
- RLS policies present for any new tables added in this PR
- Input validation (Zod) on all new or modified Server Actions

**RLS Compliance**

- Every new table has organization_id and RLS enabled
- SELECT policies check organization_id
- cross-chapter member_profiles SELECT excludes email, phone, membership status
- matches table has no DELETE policy (must remain append-only)

**Embedding Pipeline**

- No await on EmbeddingService or AIService calls in Server Actions or Route Handlers
- Any new tables with vector columns have HNSW indexes in the migration

**Code Quality**

- TypeScript strict compliance (no `any`, no untyped params, explicit return types on exports)
- Named exports only (no default exports anywhere)
- No placeholder implementations or TODOs in committed code
- All Server Actions follow the pattern: validate session → validate input → check role → execute → return { data, error }
- No vendor SDK calls outside src/lib/services/

**Conventions**

- Folder structure matches CLAUDE.md
- Migration files include: schema + RLS + indexes in the same file
- supabase gen types was run after any schema changes (src/types/database.ts updated)
- New Server Actions have corresponding test files

**Mobile-First**

- No horizontal scroll on 375px viewport for any modified screens
- Touch targets minimum 44px height on interactive elements
- Loading states present for any new async components
- Error states present for any new data-fetching components

**Performance**

- No N+1 queries in Server Components
- No unnecessary `use client` directives
- Images use Next.js Image component
- chapter_memberships indexes not removed or altered
