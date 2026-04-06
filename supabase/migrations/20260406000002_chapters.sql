-- Migration 002: Chapters (Layer 2)

CREATE TYPE meeting_format AS ENUM ('in_person', 'virtual', 'hybrid');

CREATE TABLE chapters (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id uuid NOT NULL REFERENCES organizations(id),
  region_id uuid NOT NULL REFERENCES regions(id),
  name text NOT NULL,
  meeting_format meeting_format NOT NULL DEFAULT 'in_person',
  meeting_day text NOT NULL,
  meeting_time time NOT NULL,
  timezone text NOT NULL DEFAULT 'America/Toronto',
  max_members integer NOT NULL DEFAULT 25,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_chapters_organization_id ON chapters(organization_id);
CREATE INDEX idx_chapters_region_id ON chapters(region_id);

ALTER TABLE chapters ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Select chapters in own org"
  ON chapters FOR SELECT
  USING (organization_id = auth.organization_id());

CREATE POLICY "Admin inserts chapters"
  ON chapters FOR INSERT
  WITH CHECK (
    organization_id = auth.organization_id()
    AND auth.role() IN ('network_admin', 'super_admin')
  );

CREATE POLICY "Admin or director updates chapters"
  ON chapters FOR UPDATE
  USING (
    organization_id = auth.organization_id()
    AND (
      auth.role() IN ('network_admin', 'super_admin')
      OR (auth.role() = 'chapter_director' AND id = ANY(auth.chapter_ids()))
    )
  );

CREATE POLICY "No delete"
  ON chapters FOR DELETE
  USING (false);
