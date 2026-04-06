-- Migration 017: Referrals (Layer 7)

CREATE TYPE referral_status AS ENUM ('passed', 'closed', 'lost');

CREATE TABLE referrals (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id uuid NOT NULL REFERENCES organizations(id),
  referring_member_id uuid NOT NULL REFERENCES members(id),
  receiving_member_id uuid NOT NULL REFERENCES members(id),
  referred_contact_name text NOT NULL,
  referred_contact_email text,
  notes text,
  estimated_value numeric,
  currency char(3) NOT NULL DEFAULT 'CAD',
  status referral_status NOT NULL DEFAULT 'passed',
  closed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_referrals_referring_member ON referrals(referring_member_id);
CREATE INDEX idx_referrals_receiving_member ON referrals(receiving_member_id);
CREATE INDEX idx_referrals_organization ON referrals(organization_id);

ALTER TABLE referrals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Read org referrals"
  ON referrals FOR SELECT
  USING (organization_id = public.get_organization_id());

CREATE POLICY "Create own referrals"
  ON referrals FOR INSERT
  WITH CHECK (referring_member_id = public.get_member_id());

CREATE POLICY "Update own referrals"
  ON referrals FOR UPDATE
  USING (referring_member_id = public.get_member_id());

CREATE POLICY "No delete referrals"
  ON referrals FOR DELETE
  USING (false);
