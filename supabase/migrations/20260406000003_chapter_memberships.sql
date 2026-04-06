-- Migration 003: Chapter Memberships (THE load-bearing join table)
-- Almost every meaningful query joins through this table.

CREATE TYPE member_role AS ENUM ('member', 'director', 'co_director');
CREATE TYPE membership_status AS ENUM ('active', 'lapsed', 'suspended', 'invited', 'pending', 'cancelled');

CREATE TABLE chapter_memberships (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  chapter_id uuid NOT NULL REFERENCES chapters(id),
  member_id uuid NOT NULL, -- FK to members added in migration 004
  role member_role NOT NULL DEFAULT 'member',
  profession_category text NOT NULL,
  status membership_status NOT NULL DEFAULT 'invited',
  joined_at date NOT NULL DEFAULT CURRENT_DATE,
  expires_at date NOT NULL,
  last_renewed_at date,
  invited_by_member_id uuid, -- FK to members added in migration 004
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz
);

-- ============================================================================
-- SACRED INDEXES — do not remove or defer
-- ============================================================================
CREATE INDEX idx_chapter_memberships_chapter_status
  ON chapter_memberships(chapter_id, status);

CREATE INDEX idx_chapter_memberships_member_status
  ON chapter_memberships(member_id, status);

-- ============================================================================
-- UNIQUE CONSTRAINTS
-- ============================================================================

-- One active membership per member per chapter
CREATE UNIQUE INDEX idx_chapter_memberships_unique_active
  ON chapter_memberships(chapter_id, member_id)
  WHERE deleted_at IS NULL;

-- ============================================================================
-- PROFESSION EXCLUSIVITY TRIGGER
-- When organization.profession_exclusivity = true, enforce one profession
-- per category per chapter among active members.
-- ============================================================================

CREATE OR REPLACE FUNCTION check_profession_exclusivity()
RETURNS trigger AS $$
DECLARE
  org_exclusive boolean;
BEGIN
  SELECT o.profession_exclusivity INTO org_exclusive
  FROM organizations o
  JOIN chapters c ON c.organization_id = o.id
  WHERE c.id = NEW.chapter_id;

  IF org_exclusive AND NEW.status = 'active' THEN
    IF EXISTS (
      SELECT 1 FROM chapter_memberships
      WHERE chapter_id = NEW.chapter_id
        AND profession_category = NEW.profession_category
        AND status = 'active'
        AND deleted_at IS NULL
        AND id != COALESCE(NEW.id, '00000000-0000-0000-0000-000000000000'::uuid)
    ) THEN
      RAISE EXCEPTION 'Profession category "%" is already taken in this chapter', NEW.profession_category;
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_check_profession_exclusivity
  BEFORE INSERT OR UPDATE ON chapter_memberships
  FOR EACH ROW
  EXECUTE FUNCTION check_profession_exclusivity();

-- ============================================================================
-- RLS POLICIES
-- ============================================================================

ALTER TABLE chapter_memberships ENABLE ROW LEVEL SECURITY;

-- Members read their own memberships; directors read their chapter's memberships
CREATE POLICY "Read own or chapter memberships"
  ON chapter_memberships FOR SELECT
  USING (
    member_id = auth.uid()
    OR chapter_id = ANY(auth.chapter_ids())
  );

-- Directors and admins can insert memberships for their chapters
CREATE POLICY "Director or admin inserts memberships"
  ON chapter_memberships FOR INSERT
  WITH CHECK (
    chapter_id = ANY(auth.chapter_ids())
    AND auth.role() IN ('network_admin', 'super_admin', 'chapter_director')
  );

-- Directors and admins can update memberships in their chapters
CREATE POLICY "Director or admin updates memberships"
  ON chapter_memberships FOR UPDATE
  USING (
    chapter_id = ANY(auth.chapter_ids())
    AND auth.role() IN ('network_admin', 'super_admin', 'chapter_director')
  );

-- No hard delete — use soft delete via deleted_at UPDATE
CREATE POLICY "No delete"
  ON chapter_memberships FOR DELETE
  USING (false);
