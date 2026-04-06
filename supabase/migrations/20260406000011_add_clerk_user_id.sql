-- Migration 011: Add clerk_user_id to members + get_member_id() helper
--
-- Clerk user IDs are strings like "user_3BzVcGRk..." — not UUIDs.
-- members.id stays as uuid (auto-generated). clerk_user_id maps Clerk → member.

-- Add the column
ALTER TABLE members ADD COLUMN IF NOT EXISTS clerk_user_id text UNIQUE;

-- Ensure id auto-generates
ALTER TABLE members ALTER COLUMN id SET DEFAULT gen_random_uuid();

-- Helper function: resolve Clerk user ID → member UUID for RLS policies
-- auth.uid() casts to uuid which fails for Clerk IDs like "user_xxx".
-- Read the sub claim directly as text instead.
CREATE OR REPLACE FUNCTION public.get_member_id() RETURNS uuid AS $$
  SELECT id FROM members
  WHERE clerk_user_id = (current_setting('request.jwt.claims', true)::json ->> 'sub')
  LIMIT 1;
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- Update RLS policies to use get_member_id() instead of auth.uid()

DROP POLICY IF EXISTS "Update own record or admin" ON members;
CREATE POLICY "Update own record or admin" ON members FOR UPDATE
  USING (organization_id = public.get_organization_id() AND (id = public.get_member_id() OR public.get_role() IN ('network_admin', 'super_admin')));

DROP POLICY IF EXISTS "Insert own profile" ON member_profiles;
CREATE POLICY "Insert own profile" ON member_profiles FOR INSERT
  WITH CHECK (member_id = public.get_member_id());

DROP POLICY IF EXISTS "Update own profile" ON member_profiles;
CREATE POLICY "Update own profile" ON member_profiles FOR UPDATE
  USING (member_id = public.get_member_id());

DROP POLICY IF EXISTS "Read own or chapter memberships" ON chapter_memberships;
CREATE POLICY "Read own or chapter memberships" ON chapter_memberships FOR SELECT
  USING (member_id = public.get_member_id() OR chapter_id = ANY(public.get_chapter_ids()));

DROP POLICY IF EXISTS "Select own preferences" ON notification_preferences;
CREATE POLICY "Select own preferences" ON notification_preferences FOR SELECT
  USING (member_id = public.get_member_id());

DROP POLICY IF EXISTS "Insert own preferences" ON notification_preferences;
CREATE POLICY "Insert own preferences" ON notification_preferences FOR INSERT
  WITH CHECK (member_id = public.get_member_id());

DROP POLICY IF EXISTS "Update own preferences" ON notification_preferences;
CREATE POLICY "Update own preferences" ON notification_preferences FOR UPDATE
  USING (member_id = public.get_member_id());

DROP POLICY IF EXISTS "Read visible testimonials in own org" ON testimonials;
CREATE POLICY "Read visible testimonials in own org" ON testimonials FOR SELECT
  USING (EXISTS (SELECT 1 FROM members m WHERE m.id = testimonials.author_member_id AND m.organization_id = public.get_organization_id()) AND (is_visible = true OR recipient_member_id = public.get_member_id()));

DROP POLICY IF EXISTS "Active members create testimonials" ON testimonials;
CREATE POLICY "Active members create testimonials" ON testimonials FOR INSERT
  WITH CHECK (author_member_id = public.get_member_id() AND EXISTS (SELECT 1 FROM chapter_memberships cm WHERE cm.member_id = public.get_member_id() AND cm.status = 'active' AND cm.deleted_at IS NULL));

DROP POLICY IF EXISTS "Recipient toggles visibility" ON testimonials;
CREATE POLICY "Recipient toggles visibility" ON testimonials FOR UPDATE
  USING (recipient_member_id = public.get_member_id()) WITH CHECK (recipient_member_id = public.get_member_id());

DROP POLICY IF EXISTS "Forum members only" ON forums;
CREATE POLICY "Forum members only" ON forums FOR SELECT
  USING (EXISTS (SELECT 1 FROM forum_memberships fm WHERE fm.forum_id = forums.id AND fm.member_id = public.get_member_id() AND fm.status = 'active'));

DROP POLICY IF EXISTS "Facilitator updates forum" ON forums;
CREATE POLICY "Facilitator updates forum" ON forums FOR UPDATE
  USING (facilitator_member_id = public.get_member_id());

DROP POLICY IF EXISTS "Read own forum membership" ON forum_memberships;
CREATE POLICY "Read own forum membership" ON forum_memberships FOR SELECT
  USING (member_id = public.get_member_id());

DROP POLICY IF EXISTS "Facilitator adds members" ON forum_memberships;
CREATE POLICY "Facilitator adds members" ON forum_memberships FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM forums f WHERE f.id = forum_memberships.forum_id AND f.facilitator_member_id = public.get_member_id()));

DROP POLICY IF EXISTS "Facilitator updates memberships" ON forum_memberships;
CREATE POLICY "Facilitator updates memberships" ON forum_memberships FOR UPDATE
  USING (EXISTS (SELECT 1 FROM forums f WHERE f.id = forum_memberships.forum_id AND f.facilitator_member_id = public.get_member_id()));
