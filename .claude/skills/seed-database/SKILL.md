---
name: seed-database
description: Generate and load realistic seed data for Needl. Use before any demo or stakeholder presentation. Non-negotiable — zero search results kills a demo.
argument-hint: [environment] e.g. "local" or "staging"
allowed-tools: Bash(supabase *) Bash(npm *) Read Write
---

Generate and load realistic seed data for Needl in the $ARGUMENTS environment.

The seed must include the following minimum dataset:

**Organizations and Geography:**

- 1 organization: Corporate Connections Canada
- 3 countries: Canada (CA), United States (US), United Kingdom (GB)
- 3 regions: Ontario, British Columbia, Alberta

**Chapters (10 total):**

- Ontario: CC Toronto Bay Street, CC Toronto Midtown, CC Toronto West End, CC Ottawa
- British Columbia: CC Vancouver Downtown, CC Vancouver North Shore
- Alberta: CC Calgary, CC Edmonton
- Quebec: CC Montreal
- Manitoba: CC Winnipeg

**Members (6-8 per chapter, 65-80 total):**
Industry distribution across all chapters:

- Commercial Real Estate (1-2 per chapter)
- Legal — Corporate / M&A (1 per chapter)
- Accounting / CFO Services (1 per chapter)
- Technology / IT Services (1 per chapter)
- Marketing / PR (1 per chapter)
- Financial Services / Wealth Management (1 per chapter)
- Insurance (1 per chapter)
- Human Resources / Executive Search (1 per chapter)

All members must have:

- Complete member_profiles (profile_completeness > 80)
- Realistic company names (not "Test Company" or "ACME")
- Realistic bios that sound like they were written by the person
- Clients served: 2-4 named clients OR industry categories
- Geography served: Canada + 1-2 other regions
- Industry tags: 3-5 relevant tags

**Standing Asks (20 total, distributed across chapters):**
Examples of realistic asks:

- "Looking for a commercial real estate lawyer in Calgary who works with mid-market developers"
- "Need a fractional CFO in Vancouver with SaaS company experience"
- "Looking for a PR firm in Toronto that has worked with financial services companies"
- "Need an IT managed services provider in Ottawa with government security clearance"
- Ensure geography varies (some Canada-wide, some province-specific)

**Matches (pre-generated, 15 total):**

- Each ask should have at least 1 match already generated and notified
- asker_action should vary: pending (8), intro_requested (5), connected (2)

**Introductions (5 completed):**

- status: completed
- intro_sent_at: in the past 30 days
- Both parties notified

**Referrals (10 logged):**

- Mix of statuses: passed (6), closed (3), lost (1)
- closed referrals have estimated_value in CAD (range $5,000 - $50,000)

**Events (5 upcoming):**

- One per major chapter in the next 30 days
- 3-5 visitor invitations per event in various follow_up_status stages

Steps:

1. Generate seed data using AIService (call Claude to create realistic content)
2. Write to supabase/seed.sql
3. Apply: `supabase db reset` (local) or load via Supabase dashboard (staging)
4. Verify: run the search query "I need a real estate lawyer in Calgary" — confirm 2+ results
5. Verify: run the search query "looking for a marketing agency in Vancouver" — confirm 2+ results
6. Verify: admin dashboard shows at least 3 at-risk members (engagement_score < 30)
7. Verify: visitor pipeline has invitations in at least 3 different follow_up_status stages
8. Report: total counts for members, asks, matches, introductions, referrals

Do not present this as done until all 8 verification steps pass.
