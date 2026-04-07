-- Demo seed data for Phase 10 — realistic data for stakeholder demos
-- Requires: seed.sql and test-seed.sql already applied
-- Safe to run repeatedly (ON CONFLICT DO NOTHING)
--
-- Contents: 10 chapters, ~65 members, profiles, asks, matches, intros, referrals, events, visitors

-- ============================================================================
-- 8 Additional Chapters (Toronto + Vancouver already exist)
-- ============================================================================

INSERT INTO chapters (id, organization_id, region_id, name, meeting_format, meeting_day, meeting_time, timezone, max_members) VALUES
  ('d0000000-0000-0000-0000-000000000003', 'a0000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000001', 'CC Toronto Midtown', 'in_person', 'Thursday', '07:30', 'America/Toronto', 25),
  ('d0000000-0000-0000-0000-000000000004', 'a0000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000001', 'CC Ottawa Parliament', 'hybrid', 'Wednesday', '07:30', 'America/Toronto', 25),
  ('d0000000-0000-0000-0000-000000000005', 'a0000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000002', 'CC Vancouver Gastown', 'in_person', 'Tuesday', '07:30', 'America/Vancouver', 25),
  ('d0000000-0000-0000-0000-000000000006', 'a0000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000002', 'CC Victoria Inner Harbour', 'virtual', 'Friday', '08:00', 'America/Vancouver', 25),
  ('d0000000-0000-0000-0000-000000000007', 'a0000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000003', 'CC Calgary Downtown', 'in_person', 'Tuesday', '07:30', 'America/Edmonton', 25),
  ('d0000000-0000-0000-0000-000000000008', 'a0000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000003', 'CC Edmonton Jasper', 'hybrid', 'Thursday', '07:30', 'America/Edmonton', 25),
  ('d0000000-0000-0000-0000-000000000009', 'a0000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000001', 'CC Hamilton Mountain', 'in_person', 'Monday', '07:30', 'America/Toronto', 25),
  ('d0000000-0000-0000-0000-000000000010', 'a0000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000001', 'CC Mississauga Square One', 'hybrid', 'Wednesday', '12:00', 'America/Toronto', 25)
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- 60 Members across 10 chapters (6 per chapter)
-- Using deterministic UUIDs: e1000000-0000-0000-0000-0000000000XX
-- ============================================================================

DO $$
DECLARE
  org_id uuid := 'a0000000-0000-0000-0000-000000000001';
  chapter_ids uuid[] := ARRAY[
    'd0000000-0000-0000-0000-000000000001', 'd0000000-0000-0000-0000-000000000002',
    'd0000000-0000-0000-0000-000000000003', 'd0000000-0000-0000-0000-000000000004',
    'd0000000-0000-0000-0000-000000000005', 'd0000000-0000-0000-0000-000000000006',
    'd0000000-0000-0000-0000-000000000007', 'd0000000-0000-0000-0000-000000000008',
    'd0000000-0000-0000-0000-000000000009', 'd0000000-0000-0000-0000-000000000010'
  ];
  names text[] := ARRAY[
    'Michael Torres', 'Angela Wu', 'Robert Singh', 'Jennifer Lee', 'Thomas Brown', 'Maria Garcia',
    'Kevin Zhang', 'Laura Martin', 'Daniel Kim', 'Stephanie White', 'Andrew Patel', 'Rachel Thompson',
    'Christopher Davis', 'Emily Johnson', 'Matthew Wilson', 'Jessica Moore', 'Ryan Anderson', 'Natalie Clark',
    'Brandon Taylor', 'Amanda Lewis', 'Justin Hall', 'Megan Walker', 'Tyler Young', 'Samantha King',
    'Derek Wright', 'Nicole Scott', 'Adam Green', 'Lauren Baker', 'Nathan Adams', 'Christina Nelson',
    'Patrick Hill', 'Victoria Campbell', 'Sean Mitchell', 'Diana Roberts', 'Marcus Turner', 'Olivia Phillips',
    'Trevor Evans', 'Hannah Edwards', 'Kyle Collins', 'Michelle Stewart', 'Brian Sanchez', 'Courtney Morris',
    'Jason Rogers', 'Rebecca Reed', 'Eric Cook', 'Heather Morgan', 'Chad Bell', 'Tiffany Murphy',
    'Dustin Bailey', 'Kimberly Rivera', 'Shane Cooper', 'Crystal Richardson', 'Brett Cox', 'Andrea Howard',
    'Corey Ward', 'Lindsey Torres', 'Darren Brooks', 'Vanessa Price', 'Troy Bennett', 'Monica Wood'
  ];
  professions text[] := ARRAY[
    'Real Estate Law', 'Corporate Accounting', 'Digital Marketing', 'Financial Planning', 'IT Consulting', 'Insurance Brokerage',
    'Commercial Real Estate', 'HR Consulting', 'Construction Management', 'Business Coaching', 'Logistics', 'Wealth Management',
    'Employment Law', 'Tax Strategy', 'Brand Strategy', 'Mortgage Brokerage', 'Cybersecurity', 'Benefits Consulting',
    'Residential Construction', 'Executive Recruiting', 'Supply Chain', 'Estate Planning', 'Public Relations', 'Commercial Insurance',
    'Property Management', 'Payroll Services', 'Web Development', 'Retirement Planning', 'Environmental Consulting', 'Life Insurance',
    'Intellectual Property Law', 'Forensic Accounting', 'SEO Consulting', 'Investment Advisory', 'Cloud Infrastructure', 'Health Insurance',
    'Land Development', 'Talent Acquisition', 'Fleet Management', 'Succession Planning', 'Social Media Marketing', 'Risk Management',
    'Immigration Law', 'Bookkeeping Services', 'Content Marketing', 'Venture Capital', 'Data Analytics', 'Workers Compensation',
    'Family Law', 'Corporate Finance', 'E-commerce Strategy', 'Private Equity', 'AI Consulting', 'Travel Insurance',
    'Contract Law', 'Audit Services', 'Growth Marketing', 'Angel Investing', 'DevOps Consulting', 'Marine Insurance'
  ];
  companies text[] := ARRAY[
    'Torres Legal Group', 'Wu & Associates CPA', 'Apex Digital Marketing', 'Lee Financial Partners', 'BrownTech Solutions', 'Garcia Insurance Group',
    'Zhang Commercial Realty', 'Martin HR Advisors', 'Kim Construction Corp', 'White Business Coaching', 'Patel Logistics Inc', 'Thompson Wealth',
    'Davis Employment Law', 'Johnson Tax Group', 'Wilson Brand Co', 'Moore Mortgage Group', 'Anderson Cybersecurity', 'Clark Benefits Group',
    'Taylor Builders Ltd', 'Lewis Executive Search', 'Hall Supply Chain', 'Walker Estate Planning', 'Young PR Agency', 'King Insurance Corp',
    'Wright Property Mgmt', 'Scott Payroll Solutions', 'Green Web Studio', 'Baker Retirement Group', 'Adams Environmental', 'Nelson Life Insurance',
    'Hill IP Attorneys', 'Campbell Forensic CPA', 'Mitchell SEO Agency', 'Roberts Investment Co', 'Turner Cloud Systems', 'Phillips Health Plans',
    'Evans Land Corp', 'Edwards Talent Co', 'Collins Fleet Services', 'Stewart Succession Plan', 'Sanchez Social Media', 'Morris Risk Advisory',
    'Rogers Immigration Law', 'Reed Bookkeeping', 'Cook Content Agency', 'Morgan Ventures', 'Bell Data Analytics', 'Murphy WorkComp',
    'Bailey Family Law', 'Rivera Corp Finance', 'Cooper E-Commerce', 'Richardson Private Equity', 'Cox AI Consulting', 'Howard Travel Insurance',
    'Ward Contract Law', 'Torres Audit Group', 'Brooks Growth Agency', 'Price Angel Fund', 'Bennett DevOps Co', 'Wood Marine Insurance'
  ];
  geos text[][] := ARRAY[
    ARRAY['Canada','Ontario'], ARRAY['Canada','Ontario'], ARRAY['Canada','Ontario'], ARRAY['Canada','Ontario'], ARRAY['Canada','Ontario'], ARRAY['Canada','Ontario'],
    ARRAY['Canada','British Columbia'], ARRAY['Canada','British Columbia'], ARRAY['Canada','British Columbia'], ARRAY['Canada','British Columbia'], ARRAY['Canada','British Columbia'], ARRAY['Canada','British Columbia'],
    ARRAY['Canada','Ontario'], ARRAY['Canada','Ontario'], ARRAY['Canada','Ontario'], ARRAY['Canada','Ontario'], ARRAY['Canada','Ontario'], ARRAY['Canada','Ontario'],
    ARRAY['Canada','Ontario'], ARRAY['Canada','Ontario'], ARRAY['Canada','Ontario'], ARRAY['Canada','Ontario'], ARRAY['Canada','Ontario'], ARRAY['Canada','Ontario'],
    ARRAY['Canada','British Columbia'], ARRAY['Canada','British Columbia'], ARRAY['Canada','British Columbia'], ARRAY['Canada','British Columbia'], ARRAY['Canada','British Columbia'], ARRAY['Canada','British Columbia'],
    ARRAY['Canada','British Columbia'], ARRAY['Canada','British Columbia'], ARRAY['Canada','British Columbia'], ARRAY['Canada','British Columbia'], ARRAY['Canada','British Columbia'], ARRAY['Canada','British Columbia'],
    ARRAY['Canada','Alberta'], ARRAY['Canada','Alberta'], ARRAY['Canada','Alberta'], ARRAY['Canada','Alberta'], ARRAY['Canada','Alberta'], ARRAY['Canada','Alberta'],
    ARRAY['Canada','Alberta'], ARRAY['Canada','Alberta'], ARRAY['Canada','Alberta'], ARRAY['Canada','Alberta'], ARRAY['Canada','Alberta'], ARRAY['Canada','Alberta'],
    ARRAY['Canada','Ontario'], ARRAY['Canada','Ontario'], ARRAY['Canada','Ontario'], ARRAY['Canada','Ontario'], ARRAY['Canada','Ontario'], ARRAY['Canada','Ontario'],
    ARRAY['Canada','Ontario'], ARRAY['Canada','Ontario'], ARRAY['Canada','Ontario'], ARRAY['Canada','Ontario'], ARRAY['Canada','Ontario'], ARRAY['Canada','Ontario']
  ];
  i int;
  mid uuid;
  cid uuid;
  email text;
BEGIN
  FOR i IN 1..60 LOOP
    mid := ('e1000000-0000-0000-0000-' || lpad(i::text, 12, '0'))::uuid;
    cid := chapter_ids[((i-1) / 6) + 1];
    email := lower(replace(names[i], ' ', '.')) || '@example.com';

    -- Member
    INSERT INTO members (id, organization_id, clerk_user_id, email, full_name, data_residency, is_active, onboarding_completed_at, last_login_at)
    VALUES (mid, org_id, 'user_demo_' || i, email, names[i], 'CA', true, now() - interval '30 days', now() - (i * interval '2 days'))
    ON CONFLICT (id) DO NOTHING;

    -- Chapter membership (some with short expiry for at-risk testing)
    INSERT INTO chapter_memberships (id, chapter_id, member_id, role, status, joined_at, expires_at)
    VALUES (
      ('f1000000-0000-0000-0000-' || lpad(i::text, 12, '0'))::uuid,
      cid, mid, 'member', 'active',
      current_date - (i * 30 || ' days')::interval,
      CASE WHEN i <= 5 THEN current_date + interval '30 days' -- expiring soon for at-risk
           ELSE current_date + interval '365 days' END
    )
    ON CONFLICT DO NOTHING;

    -- Profile with placeholder embedding
    INSERT INTO member_profiles (id, member_id, company_name, tagline, bio, what_i_do, who_i_serve, results_i_deliver, clients_served, geography_served, industry_tags, profile_completeness, embedding)
    VALUES (
      ('aa100000-0000-0000-0000-' || lpad(i::text, 12, '0'))::uuid,
      mid,
      companies[i],
      professions[i] || ' specialist serving Canadian businesses',
      'With over ' || (10 + (i % 15)) || ' years of experience in ' || professions[i] || ', I help businesses across ' || geos[i][2] || ' achieve their goals. My practice is built on deep industry expertise and a commitment to delivering measurable results for every client.',
      'I provide ' || professions[i] || ' services to businesses across ' || geos[i][2] || '.',
      'Business owners with $2M-$50M revenue in ' || geos[i][2] || ' who need expert ' || professions[i] || ' support.',
      'Average client ROI of ' || (150 + (i * 10)) || '%. ' || (20 + i) || '+ clients served.',
      ARRAY[professions[i], geos[i][2] || ' businesses']::text[],
      ARRAY[geos[i][1], geos[i][2]]::text[],
      ARRAY[split_part(professions[i], ' ', 1)]::text[],
      CASE WHEN i <= 10 THEN 45 + (i * 2) -- some low completeness for nudge testing
           ELSE 75 + (i % 20) END,
      (SELECT array_agg(sin(j * 0.1 + i * 0.5))::vector(1536) FROM generate_series(1, 1536) AS j)
    )
    ON CONFLICT (member_id) DO NOTHING;
  END LOOP;
END $$;

-- ============================================================================
-- 18 Standing Asks across chapters
-- ============================================================================

INSERT INTO asks (id, member_id, body, visibility, geography_filter, status, embedding) VALUES
  ('bb100000-0000-0000-0000-000000000001', 'e1000000-0000-0000-0000-000000000001', 'Looking for a commercial real estate agent in downtown Toronto who specializes in office leasing for tech companies. Need someone who understands the startup ecosystem.', 'network', ARRAY['Canada','Ontario'], 'active', (SELECT array_agg(sin(j*0.1+10))::vector(1536) FROM generate_series(1,1536) AS j)),
  ('bb100000-0000-0000-0000-000000000002', 'e1000000-0000-0000-0000-000000000003', 'Need an employment lawyer who can help draft non-compete agreements and employee stock option plans for a growing tech company.', 'network', ARRAY['Canada','Ontario'], 'active', (SELECT array_agg(sin(j*0.1+11))::vector(1536) FROM generate_series(1,1536) AS j)),
  ('bb100000-0000-0000-0000-000000000003', 'e1000000-0000-0000-0000-000000000005', 'Seeking a cybersecurity firm to do a SOC 2 compliance audit for our SaaS platform. Must have experience with Canadian data residency requirements.', 'network', ARRAY['Canada','Ontario'], 'active', (SELECT array_agg(sin(j*0.1+12))::vector(1536) FROM generate_series(1,1536) AS j)),
  ('bb100000-0000-0000-0000-000000000004', 'e1000000-0000-0000-0000-000000000007', 'Looking for a digital marketing agency in Vancouver that specializes in B2B lead generation for professional services firms.', 'network', ARRAY['Canada','British Columbia'], 'active', (SELECT array_agg(sin(j*0.1+13))::vector(1536) FROM generate_series(1,1536) AS j)),
  ('bb100000-0000-0000-0000-000000000005', 'e1000000-0000-0000-0000-000000000010', 'Need a financial advisor who specializes in business exit planning. Looking to sell my company within the next 2-3 years.', 'network', ARRAY['Canada','British Columbia'], 'active', (SELECT array_agg(sin(j*0.1+14))::vector(1536) FROM generate_series(1,1536) AS j)),
  ('bb100000-0000-0000-0000-000000000006', 'e1000000-0000-0000-0000-000000000012', 'Seeking a construction management firm in Ontario for a commercial build-out. 15,000 sq ft office space.', 'network', ARRAY['Canada','Ontario'], 'active', (SELECT array_agg(sin(j*0.1+15))::vector(1536) FROM generate_series(1,1536) AS j)),
  ('bb100000-0000-0000-0000-000000000007', 'e1000000-0000-0000-0000-000000000015', 'Looking for an HR consultant who can help implement a performance management system for a 200-person company.', 'network', ARRAY['Canada'], 'active', (SELECT array_agg(sin(j*0.1+16))::vector(1536) FROM generate_series(1,1536) AS j)),
  ('bb100000-0000-0000-0000-000000000008', 'e1000000-0000-0000-0000-000000000020', 'Need a CPA firm that specializes in cross-border tax for Canadian companies with US operations.', 'network', ARRAY['Canada','United States'], 'active', (SELECT array_agg(sin(j*0.1+17))::vector(1536) FROM generate_series(1,1536) AS j)),
  ('bb100000-0000-0000-0000-000000000009', 'e1000000-0000-0000-0000-000000000025', 'Seeking a web development agency to rebuild our e-commerce platform. Must have experience with headless CMS and Shopify Plus.', 'network', ARRAY['Canada','British Columbia'], 'active', (SELECT array_agg(sin(j*0.1+18))::vector(1536) FROM generate_series(1,1536) AS j)),
  ('bb100000-0000-0000-0000-000000000010', 'e1000000-0000-0000-0000-000000000030', 'Looking for a commercial insurance broker in Alberta who handles construction and heavy equipment.', 'network', ARRAY['Canada','Alberta'], 'active', (SELECT array_agg(sin(j*0.1+19))::vector(1536) FROM generate_series(1,1536) AS j)),
  ('bb100000-0000-0000-0000-000000000011', 'e1000000-0000-0000-0000-000000000035', 'Need an immigration lawyer for TN visa sponsorship of US-based employees joining our Calgary office.', 'network', ARRAY['Canada','Alberta'], 'active', (SELECT array_agg(sin(j*0.1+20))::vector(1536) FROM generate_series(1,1536) AS j)),
  ('bb100000-0000-0000-0000-000000000012', 'e1000000-0000-0000-0000-000000000040', 'Seeking an executive recruiter who specializes in C-suite placements for mid-market Canadian companies.', 'network', ARRAY['Canada'], 'active', (SELECT array_agg(sin(j*0.1+21))::vector(1536) FROM generate_series(1,1536) AS j)),
  ('bb100000-0000-0000-0000-000000000013', 'e1000000-0000-0000-0000-000000000045', 'Looking for a logistics company that handles last-mile delivery in the GTA for e-commerce businesses.', 'network', ARRAY['Canada','Ontario'], 'active', (SELECT array_agg(sin(j*0.1+22))::vector(1536) FROM generate_series(1,1536) AS j)),
  ('bb100000-0000-0000-0000-000000000014', 'e1000000-0000-0000-0000-000000000050', 'Need a family lawyer in Hamilton for a business divorce involving shared commercial property.', 'chapter', ARRAY['Canada','Ontario'], 'active', (SELECT array_agg(sin(j*0.1+23))::vector(1536) FROM generate_series(1,1536) AS j)),
  ('bb100000-0000-0000-0000-000000000015', 'e1000000-0000-0000-0000-000000000055', 'Seeking a growth marketing consultant for a Series A SaaS company. Need someone who can build a repeatable pipeline.', 'network', ARRAY['Canada'], 'active', (SELECT array_agg(sin(j*0.1+24))::vector(1536) FROM generate_series(1,1536) AS j)),
  ('bb100000-0000-0000-0000-000000000016', 'e1000000-0000-0000-0000-000000000002', 'Looking for a tax advisor who understands cryptocurrency and DeFi regulations in Canada.', 'network', ARRAY['Canada'], 'active', (SELECT array_agg(sin(j*0.1+25))::vector(1536) FROM generate_series(1,1536) AS j)),
  ('bb100000-0000-0000-0000-000000000017', 'e1000000-0000-0000-0000-000000000008', 'Need a benefits consultant to design a group health plan for a 50-person company in BC.', 'network', ARRAY['Canada','British Columbia'], 'active', (SELECT array_agg(sin(j*0.1+26))::vector(1536) FROM generate_series(1,1536) AS j)),
  ('bb100000-0000-0000-0000-000000000018', 'e1000000-0000-0000-0000-000000000037', 'Seeking a fleet management company for 30 commercial vehicles in Alberta. Need GPS tracking and maintenance scheduling.', 'network', ARRAY['Canada','Alberta'], 'active', (SELECT array_agg(sin(j*0.1+27))::vector(1536) FROM generate_series(1,1536) AS j))
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- 10 Matches (generated from asks above)
-- ============================================================================

INSERT INTO matches (id, ask_id, matched_member_id, match_score, match_reason, notified_at, asker_action) VALUES
  ('cc100000-0000-0000-0000-000000000001', 'bb100000-0000-0000-0000-000000000001', 'e1000000-0000-0000-0000-000000000007', 0.87, 'Zhang Commercial Realty specializes in office leasing and has deep knowledge of the Toronto tech corridor.', now(), 'pending'),
  ('cc100000-0000-0000-0000-000000000002', 'bb100000-0000-0000-0000-000000000002', 'e1000000-0000-0000-0000-000000000013', 0.82, 'Davis Employment Law handles employee stock options and non-compete agreements for tech companies.', now(), 'intro_requested'),
  ('cc100000-0000-0000-0000-000000000003', 'bb100000-0000-0000-0000-000000000003', 'e1000000-0000-0000-0000-000000000017', 0.91, 'Anderson Cybersecurity has completed 12 SOC 2 audits for Canadian SaaS companies.', now(), 'connected'),
  ('cc100000-0000-0000-0000-000000000004', 'bb100000-0000-0000-0000-000000000004', 'e1000000-0000-0000-0000-000000000009', 0.78, 'Kim Construction has completed multiple commercial build-outs in the Vancouver market.', now(), 'pending'),
  ('cc100000-0000-0000-0000-000000000005', 'bb100000-0000-0000-0000-000000000005', 'e1000000-0000-0000-0000-000000000012', 0.85, 'Thompson Wealth specializes in exit planning for business owners with $2M+ enterprises.', now(), 'intro_requested'),
  ('cc100000-0000-0000-0000-000000000006', 'bb100000-0000-0000-0000-000000000007', 'e1000000-0000-0000-0000-000000000020', 0.76, 'Lewis Executive Search specializes in HR leadership placements for mid-market companies.', now(), 'pending'),
  ('cc100000-0000-0000-0000-000000000007', 'bb100000-0000-0000-0000-000000000008', 'e1000000-0000-0000-0000-000000000014', 0.88, 'Johnson Tax Group handles complex cross-border tax for Canadian companies with US subsidiaries.', now(), 'connected'),
  ('cc100000-0000-0000-0000-000000000008', 'bb100000-0000-0000-0000-000000000009', 'e1000000-0000-0000-0000-000000000027', 0.83, 'Green Web Studio builds headless CMS and Shopify Plus platforms for Canadian e-commerce brands.', now(), 'pending'),
  ('cc100000-0000-0000-0000-000000000009', 'bb100000-0000-0000-0000-000000000010', 'e1000000-0000-0000-0000-000000000024', 0.79, 'King Insurance Corp specializes in commercial insurance for construction and heavy equipment.', now(), 'intro_requested'),
  ('cc100000-0000-0000-0000-000000000010', 'bb100000-0000-0000-0000-000000000012', 'e1000000-0000-0000-0000-000000000020', 0.81, 'Lewis Executive Search places C-suite executives for mid-market Canadian companies.', now(), 'pending')
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- 5 Completed Introductions
-- ============================================================================

INSERT INTO introductions (id, requester_member_id, target_member_id, connector_member_id, ask_id, match_id, message, connector_response, status, intro_sent_at, created_at) VALUES
  ('dd100000-0000-0000-0000-000000000001', 'e1000000-0000-0000-0000-000000000003', 'e1000000-0000-0000-0000-000000000013', 'e1000000-0000-0000-0000-000000000014', 'bb100000-0000-0000-0000-000000000002', 'cc100000-0000-0000-0000-000000000002', 'Hi, I need help with non-compete agreements for my tech team.', 'accepted', 'completed', now() - interval '5 days', now() - interval '7 days'),
  ('dd100000-0000-0000-0000-000000000002', 'e1000000-0000-0000-0000-000000000005', 'e1000000-0000-0000-0000-000000000017', 'e1000000-0000-0000-0000-000000000016', 'bb100000-0000-0000-0000-000000000003', 'cc100000-0000-0000-0000-000000000003', 'We need a SOC 2 audit for our platform ASAP.', 'accepted', 'completed', now() - interval '3 days', now() - interval '10 days'),
  ('dd100000-0000-0000-0000-000000000003', 'e1000000-0000-0000-0000-000000000020', 'e1000000-0000-0000-0000-000000000014', 'e1000000-0000-0000-0000-000000000013', 'bb100000-0000-0000-0000-000000000008', 'cc100000-0000-0000-0000-000000000007', 'Need help with cross-border tax for our US expansion.', 'accepted', 'completed', now() - interval '1 day', now() - interval '14 days'),
  ('dd100000-0000-0000-0000-000000000004', 'e1000000-0000-0000-0000-000000000010', 'e1000000-0000-0000-0000-000000000012', 'e1000000-0000-0000-0000-000000000011', 'bb100000-0000-0000-0000-000000000005', 'cc100000-0000-0000-0000-000000000005', 'Planning to sell my business in the next 2 years, need wealth planning help.', 'accepted', 'completed', now() - interval '2 days', now() - interval '20 days'),
  ('dd100000-0000-0000-0000-000000000005', 'e1000000-0000-0000-0000-000000000001', 'e1000000-0000-0000-0000-000000000007', 'e1000000-0000-0000-0000-000000000002', 'bb100000-0000-0000-0000-000000000001', 'cc100000-0000-0000-0000-000000000001', 'Looking for office space in the tech corridor — heard you are the expert.', 'accepted', 'completed', now() - interval '4 days', now() - interval '12 days')
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- 8 Referrals
-- ============================================================================

INSERT INTO referrals (id, organization_id, referring_member_id, receiving_member_id, referred_contact_name, referred_contact_email, notes, estimated_value, currency, status, created_at) VALUES
  ('ee100000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001', 'e1000000-0000-0000-0000-000000000001', 'e1000000-0000-0000-0000-000000000002', 'John Simmons', 'john@simmonscorp.ca', 'Referred for corporate tax restructuring', 250000, 'CAD', 'closed', now() - interval '30 days'),
  ('ee100000-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000001', 'e1000000-0000-0000-0000-000000000003', 'e1000000-0000-0000-0000-000000000005', 'Sarah Mitchell', 'sarah@mitchelltech.ca', 'IT infrastructure upgrade for law firm', 85000, 'CAD', 'passed', now() - interval '15 days'),
  ('ee100000-0000-0000-0000-000000000003', 'a0000000-0000-0000-0000-000000000001', 'e1000000-0000-0000-0000-000000000007', 'e1000000-0000-0000-0000-000000000009', 'David Chen', 'david@chendev.ca', 'Office build-out for new Vancouver location', 500000, 'CAD', 'closed', now() - interval '45 days'),
  ('ee100000-0000-0000-0000-000000000004', 'a0000000-0000-0000-0000-000000000001', 'e1000000-0000-0000-0000-000000000010', 'e1000000-0000-0000-0000-000000000012', 'Lisa Park', 'lisa@parkventures.ca', 'Wealth management for post-acquisition', 2000000, 'CAD', 'passed', now() - interval '7 days'),
  ('ee100000-0000-0000-0000-000000000005', 'a0000000-0000-0000-0000-000000000001', 'e1000000-0000-0000-0000-000000000015', 'e1000000-0000-0000-0000-000000000017', 'Mark Thompson', 'mark@thompsonsaas.ca', 'Cybersecurity assessment', 45000, 'CAD', 'closed', now() - interval '60 days'),
  ('ee100000-0000-0000-0000-000000000006', 'a0000000-0000-0000-0000-000000000001', 'e1000000-0000-0000-0000-000000000020', 'e1000000-0000-0000-0000-000000000022', 'Emma Wilson', 'emma@wilsonpr.ca', 'PR campaign for product launch', 35000, 'CAD', 'passed', now() - interval '10 days'),
  ('ee100000-0000-0000-0000-000000000007', 'a0000000-0000-0000-0000-000000000001', 'e1000000-0000-0000-0000-000000000030', 'e1000000-0000-0000-0000-000000000024', 'Ryan Patel', 'ryan@patelconstruction.ca', 'Insurance for new condo development', 150000, 'CAD', 'lost', now() - interval '25 days'),
  ('ee100000-0000-0000-0000-000000000008', 'a0000000-0000-0000-0000-000000000001', 'e1000000-0000-0000-0000-000000000040', 'e1000000-0000-0000-0000-000000000042', 'Jennifer Adams', 'jennifer@adamslogistics.ca', 'Fleet management consulting', 75000, 'CAD', 'passed', now() - interval '3 days')
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- 2 Events + 6 Visitor Invitations
-- ============================================================================

INSERT INTO events (id, chapter_id, title, format, location, scheduled_at, duration_minutes, created_by_member_id) VALUES
  ('ff100000-0000-0000-0000-000000000001', 'd0000000-0000-0000-0000-000000000001', 'CC Toronto Bay Street — Weekly Meeting', 'in_person', '100 King St W, Toronto', now() + interval '7 days', 90, 'e1000000-0000-0000-0000-000000000001'),
  ('ff100000-0000-0000-0000-000000000002', 'd0000000-0000-0000-0000-000000000002', 'CC Vancouver Downtown — Weekly Meeting', 'hybrid', 'https://zoom.us/j/123456', now() + interval '5 days', 90, 'e1000000-0000-0000-0000-000000000007')
ON CONFLICT (id) DO NOTHING;

INSERT INTO visitor_invitations (id, event_id, inviting_member_id, visitor_name, visitor_email, visitor_company, rsvp_status, follow_up_status) VALUES
  ('ab100000-0000-0000-0000-000000000001', 'ff100000-0000-0000-0000-000000000001', 'e1000000-0000-0000-0000-000000000001', 'Alex Novak', 'alex@novakfinance.ca', 'Novak Finance', 'confirmed', 'none'),
  ('ab100000-0000-0000-0000-000000000002', 'ff100000-0000-0000-0000-000000000001', 'e1000000-0000-0000-0000-000000000002', 'Maria Santos', 'maria@santoslaw.ca', 'Santos Legal', 'pending', 'none'),
  ('ab100000-0000-0000-0000-000000000003', 'ff100000-0000-0000-0000-000000000001', 'e1000000-0000-0000-0000-000000000003', 'Tom Reeves', 'tom@reeveshr.ca', 'Reeves HR', 'confirmed', 'contacted'),
  ('ab100000-0000-0000-0000-000000000004', 'ff100000-0000-0000-0000-000000000002', 'e1000000-0000-0000-0000-000000000007', 'Jane Okafor', 'jane@okafortech.ca', 'Okafor Tech', 'confirmed', 'applied'),
  ('ab100000-0000-0000-0000-000000000005', 'ff100000-0000-0000-0000-000000000002', 'e1000000-0000-0000-0000-000000000008', 'Peter Huang', 'peter@huangdesign.ca', 'Huang Design', 'declined', 'none'),
  ('ab100000-0000-0000-0000-000000000006', 'ff100000-0000-0000-0000-000000000002', 'e1000000-0000-0000-0000-000000000009', 'Rachel Kim', 'rachel@kimconsulting.ca', 'Kim Consulting', 'confirmed', 'joined')
ON CONFLICT (id) DO NOTHING;
