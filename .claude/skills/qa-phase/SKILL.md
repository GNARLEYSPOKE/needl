---
name: qa-phase
description: Run automated QA checks after completing a phase. Verifies database schema, RLS policies, API responses, type safety, and build integrity. Generates a manual checklist for browser-dependent tests. Run this before committing any phase.
argument-hint: [phase-number] [phase-name]
allowed-tools: Bash(npm *) Bash(npx *) Bash(supabase *) Bash(curl *) Bash(git *) Bash(node *) Read Write Glob Grep
---

# Post-Phase QA

Run comprehensive QA for Phase $ARGUMENTS[0]: $ARGUMENTS[1].

Execute every section in order. If any automated check fails, fix the issue and re-run that check before proceeding. Do not commit until all automated checks pass.

---

## 1. Build Integrity (automated)

Run these in order. Stop on first failure and fix before continuing.

```bash
npm run type-check    # Zero TypeScript errors
npm run lint          # Zero ESLint warnings or errors
npm run build         # Clean production build
```

If any fail, fix the issue. Re-run all three after fixing. All three must pass together.

---

## 2. Schema Verification (automated)

Verify the database matches expectations for this phase.

### 2a. Table existence

Query the Supabase local database to confirm all expected tables exist:

```bash
supabase db execute --sql "
  SELECT table_name
  FROM information_schema.tables
  WHERE table_schema = 'public'
  ORDER BY table_name;
"
```

Compare against the tables listed in ECOSYSTEM.md. Report any missing or unexpected tables.

### 2b. RLS enforcement

Confirm RLS is enabled on every public table that contains tenant data:

```bash
supabase db execute --sql "
  SELECT tablename, rowsecurity
  FROM pg_tables
  WHERE schemaname = 'public'
    AND tablename NOT IN ('schema_migrations')
  ORDER BY tablename;
"
```

Every tenant table must show `rowsecurity = true`. If any shows false, that is a critical failure.

### 2c. RLS policy audit

List all RLS policies and confirm they use public.get_organization_id(), NOT auth.organization_id():

```bash
supabase db execute --sql "
  SELECT tablename, policyname, qual, with_check
  FROM pg_policies
  WHERE schemaname = 'public'
  ORDER BY tablename, policyname;
"
```

Scan every policy. If any references `auth.organization_id()` or `auth.uid()` directly in the policy body instead of the public schema helpers, flag it. The project uses:

- `public.get_organization_id()` not `auth.organization_id()`
- `public.get_chapter_ids()` not `auth.chapter_ids()`
- `public.get_role()` not `auth.role()`

### 2d. Index verification

Confirm sacred indexes exist on chapter_memberships:

```bash
supabase db execute --sql "
  SELECT indexname, indexdef
  FROM pg_indexes
  WHERE tablename = 'chapter_memberships'
  ORDER BY indexname;
"
```

Required indexes: (chapter_id, status) and (member_id, status). If either is missing, that is a critical failure.

### 2e. Migration consistency

Confirm no unapplied migration files exist:

```bash
ls -la supabase/migrations/
supabase db push --dry-run 2>&1
```

If dry-run shows pending migrations, note them but do not auto-apply.

---

## 3. Type Consistency (automated)

### 3a. Regenerate database types and check for drift

```bash
supabase gen types typescript --linked > /tmp/fresh-db-types.ts
diff src/types/database.ts /tmp/fresh-db-types.ts
```

If there is drift between the generated types and the committed types, regenerate:

```bash
supabase gen types typescript --linked > src/types/database.ts
```

### 3b. Zod schema coverage

Check that every Server Action in src/actions/ has a corresponding Zod schema:

```bash
grep -rL "z\." src/actions/*.ts
```

Any action file without Zod validation is a failure. Every Server Action must validate input.

---

## 4. Server Action Smoke Tests (automated)

Start the dev server if not running, then test API endpoints:

```bash
# Start dev server in background if needed
if ! curl -s http://localhost:3000 > /dev/null 2>&1; then
  npm run dev &
  sleep 5
fi
```

### 4a. Health check

```bash
curl -s -o /dev/null -w "%{http_code}" http://localhost:3000
```

Must return 200.

### 4b. Auth-protected routes return redirect

```bash
curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/onboarding
curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/profile/edit
```

Must return 302 or 307 (redirect to sign-in) when not authenticated.

### 4c. Webhook endpoints exist

```bash
curl -s -o /dev/null -w "%{http_code}" -X POST http://localhost:3000/api/webhooks/clerk
```

Must return 400 or 401 (bad request / unauthorized), NOT 404. A 404 means the route handler is missing.

### 4d. Phase-specific endpoint checks

Based on the phase number, test additional endpoints. Build the list from specs/tasks.md for the current phase. For example:

- Phase 3: GET /profile/[testMemberId] should return 200 or redirect
- Phase 4: GET /search should return 200 or redirect
- Phase 7: GET /chapter/[testChapterId] should return 200 or redirect

---

## 5. File Structure Audit (automated)

### 5a. No default exports

```bash
grep -rn "export default" src/ --include="*.ts" --include="*.tsx" | grep -v node_modules | grep -v ".next"
```

Any default export outside of Next.js page/layout files is a convention violation. Next.js App Router requires default exports for page.tsx, layout.tsx, loading.tsx, error.tsx, and not-found.tsx ONLY.

### 5b. No service SDK direct imports in actions

```bash
grep -rn "from '@clerk\|from '@supabase\|from '@stripe\|from 'openai'\|from '@anthropic'" src/actions/ 2>/dev/null
```

Server Actions must use service abstractions from src/lib/services/, never import vendor SDKs directly.

### 5c. No secrets in source

```bash
grep -rn "sk_live\|sk_test\|whsec_\|sk-ant-\|re_\|sb_secret" src/ --include="*.ts" --include="*.tsx" 2>/dev/null
```

Must return zero results. Any match is a critical security failure.

### 5d. No TODO or placeholder code

```bash
grep -rn "TODO\|FIXME\|HACK\|placeholder\|not yet implemented" src/ --include="*.ts" --include="*.tsx" 2>/dev/null
```

Any match is a quality policy violation. Fix or remove before committing.

---

## 6. Git Hygiene (automated)

```bash
# No unstaged changes
git status --porcelain

# No untracked files that should be tracked
git status --porcelain | grep "^??" | grep -v node_modules | grep -v .next | grep -v .env
```

If there are unstaged changes, stage them. If there are untracked source files, add them.

Confirm .env.local is in .gitignore:

```bash
grep ".env.local" .gitignore
```

---

## 7. Manual Verification Checklist

After all automated checks pass, present this checklist to the user. Format it clearly. Include only the items relevant to the current phase.

### Always (every phase):

- [ ] Dev server runs without console errors (`npm run dev`, check browser console)
- [ ] No hydration errors in browser console

### Phase-specific items:

**Phase 1 (Database Foundation):**

- [ ] Supabase dashboard shows all tables in Table Editor
- [ ] Seed data visible (CC Canada org, regions, chapter)

**Phase 2 (Auth and Session):**

- [ ] Sign up with Google OAuth works
- [ ] Sign up with LinkedIn OAuth works
- [ ] Sign out and sign back in preserves session
- [ ] Unauthenticated user gets redirected from /onboarding

**Phase 3 (Member Profile):**

- [ ] Complete all 6 onboarding steps with realistic data
- [ ] Profile saves to member_profiles table (check Supabase Table Editor)
- [ ] Embedding column populates within 10 seconds (check Table Editor)
- [ ] Profile completeness score shows on dashboard
- [ ] /profile/edit loads with saved data pre-filled
- [ ] /profile/[memberId] shows public profile view

**Phase 4 (Search and Matching):**

- [ ] Search page loads without errors
- [ ] Search query returns relevant results from embeddings
- [ ] Search results show member cards with correct data
- [ ] Cross-chapter privacy: restricted fields hidden for non-chapter members

**Phase 5 (Standing Ask):**

- [ ] Create a Standing Ask and verify it saves
- [ ] Ask appears in search results for matching queries
- [ ] Background matching produces results

**Phase 6 (Warm Introduction):**

- [ ] Request an introduction between two members
- [ ] Introduction notification sent (check Resend dashboard or logs)
- [ ] Introduction status updates correctly

**Phase 7 (Chapter Features):**

- [ ] Chapter page loads with member list
- [ ] Chapter health metrics display correctly
- [ ] Member attendance/participation data shows

**Phase 8 (Onboarding Journey):**

- [ ] Full onboarding flow end-to-end with a new test user
- [ ] Welcome email sent (check Resend)
- [ ] Progress tracking works

**Phase 9 (Admin Dashboard):**

- [ ] Admin can view all chapters
- [ ] At-risk member alerts display
- [ ] Admin actions work (invite, suspend)

**Phase 10 (Seed Data and Demo):**

- [ ] Search "real estate lawyer in Toronto" returns results
- [ ] At-risk members appear in admin dashboard
- [ ] 65+ seeded members visible across chapters

---

## 8. QA Report

After all checks complete, output a structured report:

```
## QA Report — Phase [N]: [Name]

### Automated Checks
| Check                  | Status | Notes          |
|------------------------|--------|----------------|
| Type check             | PASS   |                |
| Lint                   | PASS   |                |
| Build                  | PASS   |                |
| Table existence        | PASS   |                |
| RLS enabled            | PASS   |                |
| RLS policy audit       | PASS   |                |
| Sacred indexes         | PASS   |                |
| Migration consistency  | PASS   |                |
| Type consistency       | PASS   |                |
| Zod coverage           | PASS   |                |
| Health check           | PASS   |                |
| Auth redirect          | PASS   |                |
| Webhook endpoints      | PASS   |                |
| No default exports     | PASS   |                |
| No direct SDK imports  | PASS   |                |
| No secrets in source   | PASS   |                |
| No TODOs               | PASS   |                |
| Git clean              | PASS   |                |

### Manual Checklist
[Print only the items relevant to this phase]

### Issues Found and Fixed
[List any issues that were found and fixed during QA]

### Ready to Commit: YES / NO
```

Only commit if Ready to Commit is YES. Use commit message:
`feat([scope]): [phase description]`

Then ask: "Phase [N] complete and QA passed. Ready to start Phase [N+1]: [next phase name]?"
