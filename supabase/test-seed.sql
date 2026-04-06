-- Test seed data for development — NOT for demos (see Phase 10 for demo seed)
-- Safe to run repeatedly (ON CONFLICT DO NOTHING on all inserts)
-- Requires: seed.sql already applied (org, country, regions, Toronto chapter)

-- ============================================================================
-- Chapter: CC Vancouver Downtown (British Columbia)
-- ============================================================================

INSERT INTO chapters (id, organization_id, region_id, name, meeting_format, meeting_day, meeting_time, timezone, max_members)
VALUES (
  'd0000000-0000-0000-0000-000000000002',
  'a0000000-0000-0000-0000-000000000001',
  'c0000000-0000-0000-0000-000000000002',
  'CC Vancouver Downtown',
  'hybrid',
  'Wednesday',
  '07:30',
  'America/Vancouver',
  25
) ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- 5 Test Members
-- ============================================================================

-- Member 1: Sarah Chen — Real Estate Lawyer (Toronto)
INSERT INTO members (id, organization_id, clerk_user_id, email, full_name, data_residency, is_active, onboarding_completed_at)
VALUES (
  'e0000000-0000-0000-0000-000000000010',
  'a0000000-0000-0000-0000-000000000001',
  'user_test_sarah_chen',
  'sarah.chen@example.com',
  'Sarah Chen',
  'CA',
  true,
  '2026-02-01T00:00:00Z'
) ON CONFLICT (id) DO NOTHING;

-- Member 2: David Park — Accountant (Toronto)
INSERT INTO members (id, organization_id, clerk_user_id, email, full_name, data_residency, is_active, onboarding_completed_at)
VALUES (
  'e0000000-0000-0000-0000-000000000011',
  'a0000000-0000-0000-0000-000000000001',
  'user_test_david_park',
  'david.park@example.com',
  'David Park',
  'CA',
  true,
  '2026-02-01T00:00:00Z'
) ON CONFLICT (id) DO NOTHING;

-- Member 3: Lisa Moreau — Marketing Agency (Vancouver)
INSERT INTO members (id, organization_id, clerk_user_id, email, full_name, data_residency, is_active, onboarding_completed_at)
VALUES (
  'e0000000-0000-0000-0000-000000000012',
  'a0000000-0000-0000-0000-000000000001',
  'user_test_lisa_moreau',
  'lisa.moreau@example.com',
  'Lisa Moreau',
  'CA',
  true,
  '2026-02-01T00:00:00Z'
) ON CONFLICT (id) DO NOTHING;

-- Member 4: James Wilson — Financial Advisor (Vancouver)
INSERT INTO members (id, organization_id, clerk_user_id, email, full_name, data_residency, is_active, onboarding_completed_at)
VALUES (
  'e0000000-0000-0000-0000-000000000013',
  'a0000000-0000-0000-0000-000000000001',
  'user_test_james_wilson',
  'james.wilson@example.com',
  'James Wilson',
  'CA',
  true,
  '2026-02-01T00:00:00Z'
) ON CONFLICT (id) DO NOTHING;

-- Member 5: Priya Sharma — IT Consultant (Vancouver)
INSERT INTO members (id, organization_id, clerk_user_id, email, full_name, data_residency, is_active, onboarding_completed_at)
VALUES (
  'e0000000-0000-0000-0000-000000000014',
  'a0000000-0000-0000-0000-000000000001',
  'user_test_priya_sharma',
  'priya.sharma@example.com',
  'Priya Sharma',
  'CA',
  true,
  '2026-02-01T00:00:00Z'
) ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- Chapter Memberships (2 Toronto, 3 Vancouver)
-- ============================================================================

-- Sarah Chen → Toronto
INSERT INTO chapter_memberships (id, chapter_id, member_id, role, status, joined_at, expires_at)
VALUES (
  'f0000000-0000-0000-0000-000000000010',
  'd0000000-0000-0000-0000-000000000001',
  'e0000000-0000-0000-0000-000000000010',
  'member', 'active', '2025-06-01', '2027-06-01'
) ON CONFLICT DO NOTHING;

-- David Park → Toronto
INSERT INTO chapter_memberships (id, chapter_id, member_id, role, status, joined_at, expires_at)
VALUES (
  'f0000000-0000-0000-0000-000000000011',
  'd0000000-0000-0000-0000-000000000001',
  'e0000000-0000-0000-0000-000000000011',
  'member', 'active', '2025-03-01', '2027-03-01'
) ON CONFLICT DO NOTHING;

-- Lisa Moreau → Vancouver
INSERT INTO chapter_memberships (id, chapter_id, member_id, role, status, joined_at, expires_at)
VALUES (
  'f0000000-0000-0000-0000-000000000012',
  'd0000000-0000-0000-0000-000000000002',
  'e0000000-0000-0000-0000-000000000012',
  'member', 'active', '2025-09-01', '2027-09-01'
) ON CONFLICT DO NOTHING;

-- James Wilson → Vancouver
INSERT INTO chapter_memberships (id, chapter_id, member_id, role, status, joined_at, expires_at)
VALUES (
  'f0000000-0000-0000-0000-000000000013',
  'd0000000-0000-0000-0000-000000000002',
  'e0000000-0000-0000-0000-000000000013',
  'member', 'active', '2025-01-01', '2027-01-01'
) ON CONFLICT DO NOTHING;

-- Priya Sharma → Vancouver
INSERT INTO chapter_memberships (id, chapter_id, member_id, role, status, joined_at, expires_at)
VALUES (
  'f0000000-0000-0000-0000-000000000014',
  'd0000000-0000-0000-0000-000000000002',
  'e0000000-0000-0000-0000-000000000014',
  'member', 'active', '2025-04-01', '2027-04-01'
) ON CONFLICT DO NOTHING;

-- ============================================================================
-- Member Profiles (with placeholder embeddings)
-- Embeddings are placeholder vectors — good enough for testing UI and flow.
-- For real match quality, re-embed via the Edge Function after deploying.
-- ============================================================================

-- Helper: generate a deterministic 1536-dim placeholder embedding
-- Each member gets a slightly different vector based on array_agg of their profile text hash

-- Sarah Chen — Real Estate Lawyer
INSERT INTO member_profiles (id, member_id, company_name, company_url, tagline, bio, what_i_do, who_i_serve, results_i_deliver, clients_served, geography_served, industry_tags, profile_completeness, embedding)
VALUES (
  'aa000000-0000-0000-0000-000000000010',
  'e0000000-0000-0000-0000-000000000010',
  'Chen Law Professional Corporation',
  'https://chenlaw.ca',
  'Commercial real estate lawyer helping businesses secure the right space',
  'I''m a commercial real estate lawyer with 15 years of experience in Ontario. I help businesses negotiate leases, purchase properties, and navigate complex real estate transactions. My clients range from tech startups looking for their first office to established firms expanding across the GTA. I understand that real estate decisions are among the biggest investments a business makes, and I bring both legal precision and commercial awareness to every deal.',
  'I handle commercial leases, property purchases, land use planning, and real estate litigation for businesses across Ontario.',
  'Business owners and founders who are leasing or purchasing commercial property in the Greater Toronto Area and Ontario.',
  'Clients save an average of 12% on lease negotiations. I''ve closed over $200M in commercial real estate transactions with zero litigation post-closing.',
  ARRAY['Tech startups', 'Professional services firms', 'Retail chains', 'Real Estate'],
  ARRAY['Canada', 'Ontario'],
  ARRAY['Legal', 'Real Estate'],
  95,
  (SELECT array_agg(sin(i * 0.1 + 1.0))::vector(1536) FROM generate_series(1, 1536) AS i)
) ON CONFLICT (member_id) DO NOTHING;

-- David Park — Accountant
INSERT INTO member_profiles (id, member_id, company_name, company_url, tagline, bio, what_i_do, who_i_serve, results_i_deliver, clients_served, geography_served, industry_tags, profile_completeness, embedding)
VALUES (
  'aa000000-0000-0000-0000-000000000011',
  'e0000000-0000-0000-0000-000000000011',
  'Park & Associates CPA',
  'https://parkaccounting.ca',
  'CPA firm specializing in tax strategy for owner-managed businesses',
  'I run a CPA firm focused exclusively on owner-managed businesses with $2M to $50M in revenue. We handle everything from annual tax filings to complex corporate reorganizations, succession planning, and M&A due diligence. Most of my clients have been with me for over 5 years because we don''t just file returns — we proactively find savings and structure their businesses for the next stage of growth.',
  'Tax planning, corporate restructuring, succession planning, and financial advisory for privately held businesses.',
  'Owner-managers of Canadian businesses with $2M to $50M revenue who want proactive tax strategy, not just compliance.',
  'Average tax savings of $85K per year per client. 98% client retention rate over 5 years.',
  ARRAY['Manufacturing', 'Professional services', 'Construction', 'Accounting'],
  ARRAY['Canada', 'Ontario'],
  ARRAY['Accounting', 'Financial Services'],
  90,
  (SELECT array_agg(sin(i * 0.1 + 2.0))::vector(1536) FROM generate_series(1, 1536) AS i)
) ON CONFLICT (member_id) DO NOTHING;

-- Lisa Moreau — Marketing Agency
INSERT INTO member_profiles (id, member_id, company_name, company_url, tagline, bio, what_i_do, who_i_serve, results_i_deliver, clients_served, geography_served, industry_tags, profile_completeness, embedding)
VALUES (
  'aa000000-0000-0000-0000-000000000012',
  'e0000000-0000-0000-0000-000000000012',
  'Moreau Digital',
  'https://moreaudigital.ca',
  'Full-service digital marketing agency for B2B companies across Western Canada',
  'I founded Moreau Digital to help B2B companies stop guessing at marketing and start measuring it. We build marketing engines — SEO, content marketing, paid media, and conversion optimization — that generate qualified leads predictably. Our team of 12 has helped over 60 B2B companies across Western Canada increase their pipeline by an average of 3x within 12 months.',
  'We build and manage complete B2B marketing programs: SEO, content strategy, paid advertising, email nurture, and analytics.',
  'B2B companies in Western Canada with $5M+ revenue who need a marketing team that thinks like a growth partner, not a vendor.',
  '3x average pipeline increase within 12 months. 60+ B2B clients served. $45M in attributable revenue generated for clients.',
  ARRAY['SaaS', 'Professional services', 'Industrial', 'Marketing'],
  ARRAY['Canada', 'British Columbia', 'Alberta'],
  ARRAY['Marketing', 'Digital', 'Technology'],
  95,
  (SELECT array_agg(sin(i * 0.1 + 3.0))::vector(1536) FROM generate_series(1, 1536) AS i)
) ON CONFLICT (member_id) DO NOTHING;

-- James Wilson — Financial Advisor
INSERT INTO member_profiles (id, member_id, company_name, company_url, tagline, bio, what_i_do, who_i_serve, results_i_deliver, clients_served, geography_served, industry_tags, profile_completeness, embedding)
VALUES (
  'aa000000-0000-0000-0000-000000000013',
  'e0000000-0000-0000-0000-000000000013',
  'Wilson Wealth Management',
  'https://wilsonwealth.ca',
  'Wealth management for business owners planning their next chapter',
  'I specialize in comprehensive wealth management for business owners who are either growing rapidly or preparing for an exit. With 20 years in financial services and a CFP designation, I help clients integrate their business finances with their personal wealth plan. My approach is planning-first: we build a roadmap before making any investment decisions.',
  'Comprehensive wealth management: investment planning, retirement strategy, insurance review, and business exit planning.',
  'Business owners with $2M+ in investable assets who want an integrated plan across their business and personal finances.',
  'Average client net worth growth of 18% annually over 5 years. Successful exit planning for 15 business owners in the past 3 years.',
  ARRAY['Business owners', 'Executives', 'Entrepreneurs', 'Financial Services'],
  ARRAY['Canada', 'British Columbia'],
  ARRAY['Financial Services', 'Wealth Management'],
  90,
  (SELECT array_agg(sin(i * 0.1 + 4.0))::vector(1536) FROM generate_series(1, 1536) AS i)
) ON CONFLICT (member_id) DO NOTHING;

-- Priya Sharma — IT Consultant
INSERT INTO member_profiles (id, member_id, company_name, company_url, tagline, bio, what_i_do, who_i_serve, results_i_deliver, clients_served, geography_served, industry_tags, profile_completeness, embedding)
VALUES (
  'aa000000-0000-0000-0000-000000000014',
  'e0000000-0000-0000-0000-000000000014',
  'Sharma Technology Solutions',
  'https://sharmatech.ca',
  'IT consulting and cybersecurity for mid-market companies across Canada',
  'I help mid-market companies modernize their IT infrastructure and protect their data. My team of 8 consultants delivers everything from cloud migration to cybersecurity audits to managed IT services. We focus on companies that have outgrown their break-fix IT provider but aren''t ready for a full enterprise IT department. We become your fractional CTO.',
  'Cloud migration, cybersecurity audits, managed IT services, and technology strategy consulting for mid-market businesses.',
  'Companies with 50-500 employees who need enterprise-grade IT without the enterprise price tag.',
  'Average 40% reduction in IT incidents after engagement. 99.9% uptime SLA across all managed clients. SOC 2 compliance achieved for 12 clients.',
  ARRAY['Manufacturing', 'Professional services', 'Healthcare', 'Technology'],
  ARRAY['Canada', 'British Columbia', 'Ontario'],
  ARRAY['Technology', 'Cybersecurity', 'IT Services'],
  90,
  (SELECT array_agg(sin(i * 0.1 + 5.0))::vector(1536) FROM generate_series(1, 1536) AS i)
) ON CONFLICT (member_id) DO NOTHING;

-- ============================================================================
-- 2 Standing Asks (with placeholder embeddings)
-- ============================================================================

-- Ask 1: Sarah Chen looking for an accountant
INSERT INTO asks (id, member_id, body, visibility, geography_filter, status, embedding)
VALUES (
  'bb000000-0000-0000-0000-000000000001',
  'e0000000-0000-0000-0000-000000000010',
  'I need a CPA who specializes in tax strategy for real estate holding companies. My clients often have complex corporate structures with multiple holding companies and I need someone who can work alongside me on the tax implications of property transactions.',
  'network',
  ARRAY['Canada', 'Ontario'],
  'active',
  (SELECT array_agg(sin(i * 0.1 + 6.0))::vector(1536) FROM generate_series(1, 1536) AS i)
) ON CONFLICT (id) DO NOTHING;

-- Ask 2: James Wilson looking for marketing help
INSERT INTO asks (id, member_id, body, visibility, geography_filter, status, embedding)
VALUES (
  'bb000000-0000-0000-0000-000000000002',
  'e0000000-0000-0000-0000-000000000013',
  'Looking for a digital marketing agency experienced with financial services compliance. I need help building a content marketing program that generates leads from business owners but stays within IIROC and CSA advertising guidelines.',
  'network',
  ARRAY['Canada', 'British Columbia'],
  'active',
  (SELECT array_agg(sin(i * 0.1 + 7.0))::vector(1536) FROM generate_series(1, 1536) AS i)
) ON CONFLICT (id) DO NOTHING;
