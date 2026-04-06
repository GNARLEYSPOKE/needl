---
name: audit-rls
description: Audit all Supabase RLS policies for Needl before any production deployment. Verifies tenant isolation, cross-chapter visibility rules, append-only constraints, and index presence. Run this skill before every production deploy.
disable-model-invocation: true
allowed-tools: Bash(supabase *) Read
---

Audit all RLS policies and critical database constraints for Needl.

Run against: local Supabase instance (supabase start must be running)

**Check 1: RLS Enabled on All Tables**
Query pg_tables and pg_class to confirm rowsecurity = true for:
organizations, countries, regions, chapters, chapter_memberships,
members, member_profiles, testimonials, notification_preferences,
asks, matches, introductions, referrals, events, visitor_invitations,
event_attendances, notifications, forums, forum_memberships

FAIL if any table in the above list has rowsecurity = false.

**Check 2: organization_id Present on Data Tables**
Confirm organization_id column exists on:
chapters, chapter_memberships (via chapters join), members, member_profiles (via members join),
asks, matches (via asks join), introductions, referrals, notifications

FAIL if missing on any data table.

**Check 3: Tenant Isolation — Cross-Organization Access**
Using two different JWT contexts (org A and org B):
- Confirm org A member cannot SELECT any row from org B's members table
- Confirm org A member cannot SELECT any row from org B's asks table
- Confirm org A member cannot SELECT any row from org B's chapters table

FAIL if any cross-organization row is returned.

**Check 4: Cross-Chapter Profile Visibility**
Using a member JWT from Chapter 1 querying member_profiles of a member in Chapter 2:
- Confirm email is NOT returned
- Confirm phone is NOT returned
- Confirm company_name, tagline, what_i_do ARE returned

FAIL if email or phone are returned in cross-chapter queries.

**Check 5: matches Table is Append-Only**
Confirm no DELETE policy exists on the matches table.
Attempt a DELETE as an authenticated member — must return permission denied.

FAIL if DELETE succeeds.

**Check 6: chapter_memberships Indexes**
Confirm both indexes exist:
- idx_chapter_memberships_chapter_status ON chapter_memberships(chapter_id, status)
- idx_chapter_memberships_member_status ON chapter_memberships(member_id, status)

FAIL if either index is missing.

**Check 7: HNSW Indexes on Vector Columns**
Confirm HNSW indexes exist on:
- member_profiles.embedding
- asks.embedding

FAIL if either index is missing.

**Check 8: Forum Privacy Wall**
Confirm no foreign key references from network tables (members, asks, matches,
introductions, referrals) point to forums or forum_memberships.

FAIL if any FK reference exists from the network layer to forum tables.

**Output Format:**
Report each check as PASS or FAIL.
On any FAIL: provide the specific table, policy name, and corrective SQL.
Do not proceed with deployment recommendation if any check FAILs.
Final line: "RLS AUDIT: PASS — safe to deploy" or "RLS AUDIT: FAIL — do not deploy"
