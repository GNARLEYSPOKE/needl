-- Migration 001: Organizations, Countries, Regions (Layer 1: Tenancy and Geography)

-- ============================================================================
-- ORGANIZATIONS
-- ============================================================================

CREATE TABLE organizations (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  slug text NOT NULL UNIQUE,
  logo_url text,
  profession_exclusivity boolean NOT NULL DEFAULT false,
  settings jsonb NOT NULL DEFAULT '{}'::jsonb,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Select own organization"
  ON organizations FOR SELECT
  USING (id = auth.organization_id());

CREATE POLICY "No direct insert"
  ON organizations FOR INSERT
  WITH CHECK (false);

CREATE POLICY "Network admin updates organization"
  ON organizations FOR UPDATE
  USING (id = auth.organization_id() AND auth.role() IN ('network_admin', 'super_admin'));

CREATE POLICY "No delete"
  ON organizations FOR DELETE
  USING (false);

-- ============================================================================
-- COUNTRIES
-- ============================================================================

CREATE TABLE countries (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id uuid NOT NULL REFERENCES organizations(id),
  name text NOT NULL,
  iso_code char(2) NOT NULL,
  national_director_id uuid, -- FK to members added in migration 004
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_countries_organization_id ON countries(organization_id);

ALTER TABLE countries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Select countries in own org"
  ON countries FOR SELECT
  USING (organization_id = auth.organization_id());

CREATE POLICY "No direct insert"
  ON countries FOR INSERT
  WITH CHECK (false);

CREATE POLICY "Network admin updates countries"
  ON countries FOR UPDATE
  USING (organization_id = auth.organization_id() AND auth.role() IN ('network_admin', 'super_admin'));

CREATE POLICY "No delete"
  ON countries FOR DELETE
  USING (false);

-- ============================================================================
-- REGIONS
-- ============================================================================

CREATE TABLE regions (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  country_id uuid NOT NULL REFERENCES countries(id),
  name text NOT NULL,
  regional_director_id uuid, -- FK to members added in migration 004
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_regions_country_id ON regions(country_id);

ALTER TABLE regions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Select regions in own org"
  ON regions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM countries c
      WHERE c.id = regions.country_id
        AND c.organization_id = auth.organization_id()
    )
  );

CREATE POLICY "No direct insert"
  ON regions FOR INSERT
  WITH CHECK (false);

CREATE POLICY "Network admin updates regions"
  ON regions FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM countries c
      WHERE c.id = regions.country_id
        AND c.organization_id = auth.organization_id()
    )
    AND auth.role() IN ('network_admin', 'super_admin')
  );

CREATE POLICY "No delete"
  ON regions FOR DELETE
  USING (false);
