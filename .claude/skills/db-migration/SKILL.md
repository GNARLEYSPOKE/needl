---
name: db-migration
description: Safely generate and apply a Supabase database migration for Needl. Use when adding tables, columns, indexes, RLS policies, or Edge Function triggers. Always use this skill instead of manually editing migration files.
disable-model-invocation: true
allowed-tools: Bash(supabase *) Read Write
---

Generate a safe Supabase migration for: $ARGUMENTS

Steps:
1. Read existing migrations in supabase/migrations/ to understand current schema state
2. Read ECOSYSTEM.md to confirm the target entity definition and relationships
3. Plan the migration — include in the plan:
   - Table DDL with all columns and constraints
   - organization_id FK (required on all data tables)
   - deleted_at for soft-delete tables
   - RLS: ALTER TABLE ... ENABLE ROW LEVEL SECURITY
   - RLS SELECT policy checking organization_id
   - RLS INSERT/UPDATE/DELETE policies with role checks
   - Indexes: FK columns + any composite indexes for query patterns
   - Database webhook if this table needs async embedding (member_profiles, asks)
4. Present the full plan — do NOT generate files yet
5. Wait for explicit approval
6. Generate migration: `supabase db diff --linked -f [descriptive-name]`
7. Review the generated SQL — confirm it matches the plan exactly
8. Apply to local: `supabase db push`
9. Confirm migration applied cleanly: `supabase db status`
10. Regenerate types: `supabase gen types typescript --linked > src/types/database.ts`
11. Confirm src/types/database.ts was updated

Needl-specific safety rules:
- chapter_memberships indexes (chapter_id, status) and (member_id, status) must never be removed
- matches table must never have a DELETE policy added
- Every new table needs organization_id NOT NULL REFERENCES organizations(id)
- Vector columns (embedding vector(1536)) require an HNSW index in the same migration
- Never drop a column that is still referenced in application code
- Always include RLS in the same migration as the table creation — never in a separate migration
- If migrating existing data, create the column as nullable first, backfill, then add NOT NULL constraint
