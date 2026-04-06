-- Migration 007: Testimonials

CREATE TABLE testimonials (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  author_member_id uuid NOT NULL REFERENCES members(id),
  recipient_member_id uuid NOT NULL REFERENCES members(id),
  body text NOT NULL,
  is_visible boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_testimonials_author ON testimonials(author_member_id);
CREATE INDEX idx_testimonials_recipient ON testimonials(recipient_member_id);

-- ============================================================================
-- Same-organization enforcement trigger
-- Author and recipient must belong to the same organization.
-- ============================================================================

CREATE OR REPLACE FUNCTION check_testimonial_same_org()
RETURNS trigger AS $$
DECLARE
  author_org uuid;
  recipient_org uuid;
BEGIN
  SELECT organization_id INTO author_org FROM members WHERE id = NEW.author_member_id;
  SELECT organization_id INTO recipient_org FROM members WHERE id = NEW.recipient_member_id;

  IF author_org IS NULL OR recipient_org IS NULL OR author_org != recipient_org THEN
    RAISE EXCEPTION 'Author and recipient must be in the same organization';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_testimonial_same_org
  BEFORE INSERT ON testimonials
  FOR EACH ROW
  EXECUTE FUNCTION check_testimonial_same_org();

-- ============================================================================
-- RLS POLICIES
-- ============================================================================

ALTER TABLE testimonials ENABLE ROW LEVEL SECURITY;

-- Visible testimonials for same-org; recipients always see their own (even hidden)
CREATE POLICY "Read visible testimonials in own org"
  ON testimonials FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM members m
      WHERE m.id = testimonials.author_member_id
        AND m.organization_id = public.get_organization_id()
    )
    AND (is_visible = true OR recipient_member_id = auth.uid())
  );

-- Active members can write testimonials (same-org enforced by trigger)
CREATE POLICY "Active members create testimonials"
  ON testimonials FOR INSERT
  WITH CHECK (
    author_member_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM chapter_memberships cm
      WHERE cm.member_id = auth.uid()
        AND cm.status = 'active'
        AND cm.deleted_at IS NULL
    )
  );

-- Recipient can toggle visibility
CREATE POLICY "Recipient toggles visibility"
  ON testimonials FOR UPDATE
  USING (recipient_member_id = auth.uid())
  WITH CHECK (recipient_member_id = auth.uid());

CREATE POLICY "No delete"
  ON testimonials FOR DELETE
  USING (false);
