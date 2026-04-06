-- Seed data for development and demos
-- Fixed UUIDs for stable references in tests and development
-- Run via Supabase SQL Editor or: supabase db reset (which applies migrations + seed)

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
) ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- Country: Canada
-- ============================================================================

INSERT INTO countries (id, organization_id, name, iso_code)
VALUES (
  'b0000000-0000-0000-0000-000000000001',
  'a0000000-0000-0000-0000-000000000001',
  'Canada',
  'CA'
) ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- Regions: Ontario, British Columbia, Alberta
-- ============================================================================

INSERT INTO regions (id, country_id, name) VALUES
  ('c0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001', 'Ontario'),
  ('c0000000-0000-0000-0000-000000000002', 'b0000000-0000-0000-0000-000000000001', 'British Columbia'),
  ('c0000000-0000-0000-0000-000000000003', 'b0000000-0000-0000-0000-000000000001', 'Alberta')
ON CONFLICT (id) DO NOTHING;

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
) ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- Test Member: Jane Smith (for testing onboarding without Clerk webhook)
-- In production, members are created by the Clerk webhook.
-- This test member lets you test the full flow locally.
-- ============================================================================

INSERT INTO members (id, organization_id, email, full_name, data_residency, is_active)
VALUES (
  'e0000000-0000-0000-0000-000000000001',
  'a0000000-0000-0000-0000-000000000001',
  'jane.smith@example.com',
  'Jane Smith',
  'CA',
  true
) ON CONFLICT (id) DO NOTHING;

-- Chapter membership for test member
INSERT INTO chapter_memberships (id, chapter_id, member_id, role, status, joined_at, expires_at)
VALUES (
  'f0000000-0000-0000-0000-000000000001',
  'd0000000-0000-0000-0000-000000000001',
  'e0000000-0000-0000-0000-000000000001',
  'member',
  'active',
  '2026-01-01',
  '2027-01-01'
) ON CONFLICT DO NOTHING;
