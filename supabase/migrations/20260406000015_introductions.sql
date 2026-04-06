-- Migration 015: Introductions table (Layer 5: Warm Introductions)

CREATE TYPE connector_response AS ENUM ('pending', 'accepted', 'declined', 'suggested_alternative');
CREATE TYPE introduction_status AS ENUM (
  'pending_connector',  -- waiting for connector to respond
  'pending_target',     -- direct request or connector declined, waiting for target
  'connector_accepted', -- connector made the intro
  'connector_declined', -- connector declined (auto-creates direct request)
  'completed',          -- both parties connected
  'declined',           -- target declined
  'expired'             -- no response within time limit
);

CREATE TABLE introductions (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  requester_member_id uuid NOT NULL REFERENCES members(id),
  target_member_id uuid NOT NULL REFERENCES members(id),
  connector_member_id uuid REFERENCES members(id), -- null = direct request
  ask_id uuid REFERENCES asks(id),
  match_id uuid REFERENCES matches(id),
  message text NOT NULL,
  connector_response connector_response,
  connector_note text,
  alternative_member_id uuid REFERENCES members(id),
  intro_sent_at timestamptz,
  status introduction_status NOT NULL DEFAULT 'pending_connector',
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_introductions_requester ON introductions(requester_member_id);
CREATE INDEX idx_introductions_target ON introductions(target_member_id);
CREATE INDEX idx_introductions_connector ON introductions(connector_member_id);

-- ============================================================================
-- RLS POLICIES
-- ============================================================================

ALTER TABLE introductions ENABLE ROW LEVEL SECURITY;

-- SELECT: involved parties only (requester, target, connector)
CREATE POLICY "Read own introductions"
  ON introductions FOR SELECT
  USING (
    requester_member_id = public.get_member_id()
    OR target_member_id = public.get_member_id()
    OR connector_member_id = public.get_member_id()
  );

-- INSERT: any authenticated member
CREATE POLICY "Create introduction"
  ON introductions FOR INSERT
  WITH CHECK (requester_member_id = public.get_member_id());

-- UPDATE: involved parties only
CREATE POLICY "Update own introductions"
  ON introductions FOR UPDATE
  USING (
    requester_member_id = public.get_member_id()
    OR target_member_id = public.get_member_id()
    OR connector_member_id = public.get_member_id()
  );

-- No DELETE ever
