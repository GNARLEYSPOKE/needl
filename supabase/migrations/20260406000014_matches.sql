-- Migration 014: Matches table (Layer 4: AI Matching — APPEND-ONLY)
-- No DELETE policy exists on this table. Do not add one. (ADR-005)
-- Matches is the AI engine audit trail.

CREATE TYPE asker_action AS ENUM ('pending', 'intro_requested', 'dismissed', 'connected');

CREATE TABLE matches (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  ask_id uuid NOT NULL REFERENCES asks(id),
  matched_member_id uuid NOT NULL REFERENCES members(id),
  match_score float NOT NULL,
  match_reason text NOT NULL,
  notified_at timestamptz,
  asker_action asker_action NOT NULL DEFAULT 'pending',
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_matches_ask_id ON matches(ask_id);
CREATE INDEX idx_matches_matched_member_id ON matches(matched_member_id);

-- ============================================================================
-- RLS POLICIES — append-only, no DELETE
-- ============================================================================

ALTER TABLE matches ENABLE ROW LEVEL SECURITY;

-- SELECT: asker can see matches for their own asks
CREATE POLICY "Read own ask matches"
  ON matches FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM asks a
      WHERE a.id = matches.ask_id
        AND a.member_id = public.get_member_id()
    )
  );

-- INSERT: service_role only (Edge Function inserts matches)
CREATE POLICY "No direct insert"
  ON matches FOR INSERT
  WITH CHECK (false);

-- UPDATE: asker can update asker_action on their own matches
CREATE POLICY "Update own match action"
  ON matches FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM asks a
      WHERE a.id = matches.ask_id
        AND a.member_id = public.get_member_id()
    )
  );

-- NO DELETE POLICY — matches table is append-only (ADR-005)
