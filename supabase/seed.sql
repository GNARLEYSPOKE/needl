-- Seed data for development and demos
-- Fixed UUIDs for stable references in tests and development

-- ============================================================================
-- Organization: Corporate Connections Canada
-- ============================================================================

INSERT INTO organizations (id, name, slug, profession_exclusivity, is_active)
VALUES (
  'a0000000-0000-0000-0000-000000000001',
  'Corporate Connections Canada',
  'corporate-connections-ca',
  false,
  true
);

-- ============================================================================
-- Country: Canada
-- ============================================================================

INSERT INTO countries (id, organization_id, name, iso_code)
VALUES (
  'b0000000-0000-0000-0000-000000000001',
  'a0000000-0000-0000-0000-000000000001',
  'Canada',
  'CA'
);

-- ============================================================================
-- Regions: Ontario, British Columbia, Alberta
-- ============================================================================

INSERT INTO regions (id, country_id, name) VALUES
  ('c0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001', 'Ontario'),
  ('c0000000-0000-0000-0000-000000000002', 'b0000000-0000-0000-0000-000000000001', 'British Columbia'),
  ('c0000000-0000-0000-0000-000000000003', 'b0000000-0000-0000-0000-000000000001', 'Alberta');

-- ============================================================================
-- Chapter: CC Toronto Bay Street (Ontario)
-- ============================================================================

INSERT INTO chapters (id, organization_id, region_id, name, meeting_format, meeting_day, meeting_time, timezone, max_members)
VALUES (
  'd0000000-0000-0000-0000-000000000001',
  'a0000000-0000-0000-0000-000000000001',
  'c0000000-0000-0000-0000-000000000001',
  'CC Toronto Bay Street',
  'in_person',
  'Tuesday',
  '07:30',
  'America/Toronto',
  25
);
