-- Migration 004: Members (Layer 3) + deferred foreign keys

CREATE TABLE members (
  id uuid PRIMARY KEY, -- Set by application to match Clerk user ID (NOT auto-generated)
  organization_id uuid NOT NULL REFERENCES organizations(id),
  email text NOT NULL,
  phone text,
  full_name text NOT NULL,
  avatar_url text,
  linkedin_url text,
  data_residency char(2) NOT NULL, -- "CA" | "EU" — required for PIPEDA/GDPR compliance
  is_active boolean NOT NULL DEFAULT true,
  last_login_at timestamptz,
  onboarding_completed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz
);

CREATE INDEX idx_members_organization_id ON members(organization_id);
CREATE INDEX idx_members_email ON members(email);

-- ============================================================================
-- DEFERRED FOREIGN KEYS
-- These columns were created in earlier migrations without FK constraints
-- because the members table did not exist yet.
-- ============================================================================

ALTER TABLE countries
  ADD CONSTRAINT fk_countries_national_director
  FOREIGN KEY (national_director_id) REFERENCES members(id);

ALTER TABLE regions
  ADD CONSTRAINT fk_regions_regional_director
  FOREIGN KEY (regional_director_id) REFERENCES members(id);

ALTER TABLE chapter_memberships
  ADD CONSTRAINT fk_chapter_memberships_member
  FOREIGN KEY (member_id) REFERENCES members(id);

ALTER TABLE chapter_memberships
  ADD CONSTRAINT fk_chapter_memberships_invited_by
  FOREIGN KEY (invited_by_member_id) REFERENCES members(id);

-- Indexes on newly-constrained FK columns
CREATE INDEX idx_countries_national_director_id ON countries(national_director_id);
CREATE INDEX idx_regions_regional_director_id ON regions(regional_director_id);
CREATE INDEX idx_chapter_memberships_invited_by ON chapter_memberships(invited_by_member_id);
-- chapter_memberships.member_id already indexed via idx_chapter_memberships_member_status

-- ============================================================================
-- RLS POLICIES
-- ============================================================================

ALTER TABLE members ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Select members in own org"
  ON members FOR SELECT
  USING (organization_id = public.get_organization_id());

-- INSERT only via Clerk webhook (service_role bypasses RLS)
CREATE POLICY "No direct insert"
  ON members FOR INSERT
  WITH CHECK (false);

-- Members update own record; admins update any member in their org
CREATE POLICY "Update own record or admin"
  ON members FOR UPDATE
  USING (
    organization_id = public.get_organization_id()
    AND (
      id = auth.uid()
      OR public.get_role() IN ('network_admin', 'super_admin')
    )
  );

-- No hard delete — soft delete via deleted_at UPDATE
CREATE POLICY "No delete"
  ON members FOR DELETE
  USING (false);
