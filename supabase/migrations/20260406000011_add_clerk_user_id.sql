-- Migration 011: Add clerk_user_id and revert members.id to uuid
--
-- Problem: Migration 010 changed members.id to text so Clerk IDs could be used
-- directly. The correct approach is: members.id stays as uuid (auto-generated),
-- and clerk_user_id maps the Clerk user string to the member row.

-- ============================================================================
-- Step 1: Drop all foreign keys referencing members.id
-- ============================================================================

ALTER TABLE countries DROP CONSTRAINT IF EXISTS fk_countries_national_director;
ALTER TABLE regions DROP CONSTRAINT IF EXISTS fk_regions_regional_director;
ALTER TABLE chapter_memberships DROP CONSTRAINT IF EXISTS fk_chapter_memberships_member;
ALTER TABLE chapter_memberships DROP CONSTRAINT IF EXISTS fk_chapter_memberships_invited_by;
ALTER TABLE member_profiles DROP CONSTRAINT IF EXISTS member_profiles_member_id_fkey;
ALTER TABLE notification_preferences DROP CONSTRAINT IF EXISTS notification_preferences_member_id_fkey;
ALTER TABLE testimonials DROP CONSTRAINT IF EXISTS testimonials_author_member_id_fkey;
ALTER TABLE testimonials DROP CONSTRAINT IF EXISTS testimonials_recipient_member_id_fkey;
ALTER TABLE forums DROP CONSTRAINT IF EXISTS forums_facilitator_member_id_fkey;
ALTER TABLE forum_memberships DROP CONSTRAINT IF EXISTS forum_memberships_member_id_fkey;

-- ============================================================================
-- Step 2: Add clerk_user_id column
-- ============================================================================

ALTER TABLE members ADD COLUMN IF NOT EXISTS clerk_user_id text UNIQUE;

-- ============================================================================
-- Step 3: Migrate existing data
-- For any member rows where id is a Clerk-style string (not a UUID),
-- move the id to clerk_user_id and assign a new UUID.
-- ============================================================================

-- Save Clerk IDs to clerk_user_id
UPDATE members SET clerk_user_id = id
  WHERE id::text !~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
  AND clerk_user_id IS NULL;

-- Create temp mapping: old text id → new uuid
CREATE TEMP TABLE _member_id_map AS
  SELECT id AS old_id, gen_random_uuid() AS new_id
  FROM members
  WHERE id::text !~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$';

-- Update FK references in all dependent tables
UPDATE chapter_memberships SET member_id = m.new_id::text
  FROM _member_id_map m WHERE chapter_memberships.member_id = m.old_id;
UPDATE chapter_memberships SET invited_by_member_id = m.new_id::text
  FROM _member_id_map m WHERE chapter_memberships.invited_by_member_id = m.old_id;
UPDATE member_profiles SET member_id = m.new_id::text
  FROM _member_id_map m WHERE member_profiles.member_id = m.old_id;
UPDATE notification_preferences SET member_id = m.new_id::text
  FROM _member_id_map m WHERE notification_preferences.member_id = m.old_id;
UPDATE testimonials SET author_member_id = m.new_id::text
  FROM _member_id_map m WHERE testimonials.author_member_id = m.old_id;
UPDATE testimonials SET recipient_member_id = m.new_id::text
  FROM _member_id_map m WHERE testimonials.recipient_member_id = m.old_id;
UPDATE countries SET national_director_id = m.new_id::text
  FROM _member_id_map m WHERE countries.national_director_id = m.old_id;
UPDATE regions SET regional_director_id = m.new_id::text
  FROM _member_id_map m WHERE regions.regional_director_id = m.old_id;
UPDATE forums SET facilitator_member_id = m.new_id::text
  FROM _member_id_map m WHERE forums.facilitator_member_id = m.old_id;
UPDATE forum_memberships SET member_id = m.new_id::text
  FROM _member_id_map m WHERE forum_memberships.member_id = m.old_id;

-- Update the member id itself
UPDATE members SET id = m.new_id::text
  FROM _member_id_map m WHERE members.id = m.old_id;

DROP TABLE _member_id_map;

-- ============================================================================
-- Step 4: Convert all columns back to uuid
-- ============================================================================

ALTER TABLE members ALTER COLUMN id TYPE uuid USING id::uuid;
ALTER TABLE members ALTER COLUMN id SET DEFAULT gen_random_uuid();

ALTER TABLE countries ALTER COLUMN national_director_id TYPE uuid USING national_director_id::uuid;
ALTER TABLE regions ALTER COLUMN regional_director_id TYPE uuid USING regional_director_id::uuid;
ALTER TABLE chapter_memberships ALTER COLUMN member_id TYPE uuid USING member_id::uuid;
ALTER TABLE chapter_memberships ALTER COLUMN invited_by_member_id TYPE uuid USING invited_by_member_id::uuid;
ALTER TABLE member_profiles ALTER COLUMN member_id TYPE uuid USING member_id::uuid;
ALTER TABLE notification_preferences ALTER COLUMN member_id TYPE uuid USING member_id::uuid;
ALTER TABLE testimonials ALTER COLUMN author_member_id TYPE uuid USING author_member_id::uuid;
ALTER TABLE testimonials ALTER COLUMN recipient_member_id TYPE uuid USING recipient_member_id::uuid;
ALTER TABLE forums ALTER COLUMN facilitator_member_id TYPE uuid USING facilitator_member_id::uuid;
ALTER TABLE forum_memberships ALTER COLUMN member_id TYPE uuid USING member_id::uuid;

-- ============================================================================
-- Step 5: Create helper function to resolve Clerk user ID → member UUID
-- RLS policies use this instead of auth.uid() directly
-- ============================================================================

CREATE OR REPLACE FUNCTION public.get_member_id() RETURNS uuid AS $$
  SELECT id FROM members WHERE clerk_user_id = auth.uid() LIMIT 1;
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- ============================================================================
-- Step 6: Update RLS policies to use get_member_id() instead of auth.uid()
-- ============================================================================

-- members: UPDATE own record
DROP POLICY IF EXISTS "Update own record or admin" ON members;
CREATE POLICY "Update own record or admin"
  ON members FOR UPDATE
  USING (
    organization_id = public.get_organization_id()
    AND (
      id = public.get_member_id()
      OR public.get_role() IN ('network_admin', 'super_admin')
    )
  );

-- member_profiles: INSERT/UPDATE own
DROP POLICY IF EXISTS "Insert own profile" ON member_profiles;
CREATE POLICY "Insert own profile"
  ON member_profiles FOR INSERT
  WITH CHECK (member_id = public.get_member_id());

DROP POLICY IF EXISTS "Update own profile" ON member_profiles;
CREATE POLICY "Update own profile"
  ON member_profiles FOR UPDATE
  USING (member_id = public.get_member_id());

-- chapter_memberships: SELECT own
DROP POLICY IF EXISTS "Read own or chapter memberships" ON chapter_memberships;
CREATE POLICY "Read own or chapter memberships"
  ON chapter_memberships FOR SELECT
  USING (
    member_id = public.get_member_id()
    OR chapter_id = ANY(public.get_chapter_ids())
  );

-- notification_preferences: all own
DROP POLICY IF EXISTS "Select own preferences" ON notification_preferences;
CREATE POLICY "Select own preferences"
  ON notification_preferences FOR SELECT
  USING (member_id = public.get_member_id());

DROP POLICY IF EXISTS "Insert own preferences" ON notification_preferences;
CREATE POLICY "Insert own preferences"
  ON notification_preferences FOR INSERT
  WITH CHECK (member_id = public.get_member_id());

DROP POLICY IF EXISTS "Update own preferences" ON notification_preferences;
CREATE POLICY "Update own preferences"
  ON notification_preferences FOR UPDATE
  USING (member_id = public.get_member_id());

-- testimonials
DROP POLICY IF EXISTS "Read visible testimonials in own org" ON testimonials;
CREATE POLICY "Read visible testimonials in own org"
  ON testimonials FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM members m
      WHERE m.id = testimonials.author_member_id
        AND m.organization_id = public.get_organization_id()
    )
    AND (is_visible = true OR recipient_member_id = public.get_member_id())
  );

DROP POLICY IF EXISTS "Active members create testimonials" ON testimonials;
CREATE POLICY "Active members create testimonials"
  ON testimonials FOR INSERT
  WITH CHECK (
    author_member_id = public.get_member_id()
    AND EXISTS (
      SELECT 1 FROM chapter_memberships cm
      WHERE cm.member_id = public.get_member_id()
        AND cm.status = 'active'
        AND cm.deleted_at IS NULL
    )
  );

DROP POLICY IF EXISTS "Recipient toggles visibility" ON testimonials;
CREATE POLICY "Recipient toggles visibility"
  ON testimonials FOR UPDATE
  USING (recipient_member_id = public.get_member_id())
  WITH CHECK (recipient_member_id = public.get_member_id());

-- forums
DROP POLICY IF EXISTS "Forum members only" ON forums;
CREATE POLICY "Forum members only"
  ON forums FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM forum_memberships fm
      WHERE fm.forum_id = forums.id
        AND fm.member_id = public.get_member_id()
        AND fm.status = 'active'
    )
  );

DROP POLICY IF EXISTS "Facilitator updates forum" ON forums;
CREATE POLICY "Facilitator updates forum"
  ON forums FOR UPDATE
  USING (facilitator_member_id = public.get_member_id());

-- forum_memberships
DROP POLICY IF EXISTS "Read own forum membership" ON forum_memberships;
CREATE POLICY "Read own forum membership"
  ON forum_memberships FOR SELECT
  USING (member_id = public.get_member_id());

DROP POLICY IF EXISTS "Facilitator adds members" ON forum_memberships;
CREATE POLICY "Facilitator adds members"
  ON forum_memberships FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM forums f
      WHERE f.id = forum_memberships.forum_id
        AND f.facilitator_member_id = public.get_member_id()
    )
  );

DROP POLICY IF EXISTS "Facilitator updates memberships" ON forum_memberships;
CREATE POLICY "Facilitator updates memberships"
  ON forum_memberships FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM forums f
      WHERE f.id = forum_memberships.forum_id
        AND f.facilitator_member_id = public.get_member_id()
    )
  );

-- ============================================================================
-- Step 7: Re-add all foreign key constraints
-- ============================================================================

ALTER TABLE countries ADD CONSTRAINT fk_countries_national_director
  FOREIGN KEY (national_director_id) REFERENCES members(id);
ALTER TABLE regions ADD CONSTRAINT fk_regions_regional_director
  FOREIGN KEY (regional_director_id) REFERENCES members(id);
ALTER TABLE chapter_memberships ADD CONSTRAINT fk_chapter_memberships_member
  FOREIGN KEY (member_id) REFERENCES members(id);
ALTER TABLE chapter_memberships ADD CONSTRAINT fk_chapter_memberships_invited_by
  FOREIGN KEY (invited_by_member_id) REFERENCES members(id);
ALTER TABLE member_profiles ADD CONSTRAINT member_profiles_member_id_fkey
  FOREIGN KEY (member_id) REFERENCES members(id);
ALTER TABLE notification_preferences ADD CONSTRAINT notification_preferences_member_id_fkey
  FOREIGN KEY (member_id) REFERENCES members(id);
ALTER TABLE testimonials ADD CONSTRAINT testimonials_author_member_id_fkey
  FOREIGN KEY (author_member_id) REFERENCES members(id);
ALTER TABLE testimonials ADD CONSTRAINT testimonials_recipient_member_id_fkey
  FOREIGN KEY (recipient_member_id) REFERENCES members(id);
ALTER TABLE forums ADD CONSTRAINT forums_facilitator_member_id_fkey
  FOREIGN KEY (facilitator_member_id) REFERENCES members(id);
ALTER TABLE forum_memberships ADD CONSTRAINT forum_memberships_member_id_fkey
  FOREIGN KEY (member_id) REFERENCES members(id);
