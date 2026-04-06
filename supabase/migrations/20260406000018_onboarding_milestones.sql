-- Migration 018: Onboarding milestone tracking columns on members
-- Each timestamp is set once (the first time the member completes the action).

ALTER TABLE members ADD COLUMN IF NOT EXISTS first_search_at timestamptz;
ALTER TABLE members ADD COLUMN IF NOT EXISTS first_ask_posted_at timestamptz;
ALTER TABLE members ADD COLUMN IF NOT EXISTS first_intro_requested_at timestamptz;
