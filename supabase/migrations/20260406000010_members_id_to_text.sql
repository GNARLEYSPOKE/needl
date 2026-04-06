-- Migration 010: Change members.id from uuid to text
-- Clerk user IDs are strings like "user_3BzVcGRklPVcc6Wc6nRNmmOrvhq", not UUIDs.

-- Drop foreign keys that reference members.id
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

-- Change members.id to text
ALTER TABLE members ALTER COLUMN id TYPE text;

-- Change all columns that reference members.id to text
ALTER TABLE countries ALTER COLUMN national_director_id TYPE text;
ALTER TABLE regions ALTER COLUMN regional_director_id TYPE text;
ALTER TABLE chapter_memberships ALTER COLUMN member_id TYPE text;
ALTER TABLE chapter_memberships ALTER COLUMN invited_by_member_id TYPE text;
ALTER TABLE member_profiles ALTER COLUMN member_id TYPE text;
ALTER TABLE notification_preferences ALTER COLUMN member_id TYPE text;
ALTER TABLE testimonials ALTER COLUMN author_member_id TYPE text;
ALTER TABLE testimonials ALTER COLUMN recipient_member_id TYPE text;
ALTER TABLE forums ALTER COLUMN facilitator_member_id TYPE text;
ALTER TABLE forum_memberships ALTER COLUMN member_id TYPE text;

-- Re-add foreign keys
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
