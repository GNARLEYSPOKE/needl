-- Migration 008: Forum Schema Stub (privacy wall)
-- HARD RULE: No table in Layers 1-8 references forums or forum_memberships.
-- Forum context is invisible to all network queries.
-- Schema only — no UI in v1.

CREATE TYPE forum_role AS ENUM ('member', 'facilitator');
CREATE TYPE forum_membership_status AS ENUM ('active', 'inactive');

CREATE TABLE forums (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id uuid NOT NULL REFERENCES organizations(id),
  chapter_id uuid REFERENCES chapters(id), -- nullable: some forums are cross-chapter
  name text NOT NULL,
  facilitator_member_id uuid NOT NULL REFERENCES members(id),
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_forums_organization_id ON forums(organization_id);
CREATE INDEX idx_forums_facilitator ON forums(facilitator_member_id);

CREATE TABLE forum_memberships (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  forum_id uuid NOT NULL REFERENCES forums(id),
  member_id uuid NOT NULL REFERENCES members(id),
  role forum_role NOT NULL DEFAULT 'member',
  joined_at date NOT NULL DEFAULT CURRENT_DATE,
  status forum_membership_status NOT NULL DEFAULT 'active',
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_forum_memberships_forum_id ON forum_memberships(forum_id);
CREATE INDEX idx_forum_memberships_member_id ON forum_memberships(member_id);

-- ============================================================================
-- RLS POLICIES — forum context is strictly isolated
-- ============================================================================

ALTER TABLE forums ENABLE ROW LEVEL SECURITY;

-- Only active forum members can see the forum
CREATE POLICY "Forum members only"
  ON forums FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM forum_memberships fm
      WHERE fm.forum_id = forums.id
        AND fm.member_id = auth.uid()
        AND fm.status = 'active'
    )
  );

CREATE POLICY "No direct insert"
  ON forums FOR INSERT
  WITH CHECK (false);

CREATE POLICY "Facilitator updates forum"
  ON forums FOR UPDATE
  USING (facilitator_member_id = auth.uid());

CREATE POLICY "No delete"
  ON forums FOR DELETE
  USING (false);

ALTER TABLE forum_memberships ENABLE ROW LEVEL SECURITY;

-- Members can see their own forum memberships
CREATE POLICY "Read own forum membership"
  ON forum_memberships FOR SELECT
  USING (member_id = auth.uid());

-- Facilitator adds members to their forum
CREATE POLICY "Facilitator adds members"
  ON forum_memberships FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM forums f
      WHERE f.id = forum_memberships.forum_id
        AND f.facilitator_member_id = auth.uid()
    )
  );

-- Facilitator manages memberships
CREATE POLICY "Facilitator updates memberships"
  ON forum_memberships FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM forums f
      WHERE f.id = forum_memberships.forum_id
        AND f.facilitator_member_id = auth.uid()
    )
  );

CREATE POLICY "No delete"
  ON forum_memberships FOR DELETE
  USING (false);
