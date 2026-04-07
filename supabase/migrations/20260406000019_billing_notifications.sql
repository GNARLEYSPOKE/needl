-- Migration 019: Billing status on chapters + Notifications table (Layer 8)

-- Add billing_status to chapters
ALTER TABLE chapters ADD COLUMN IF NOT EXISTS billing_status text NOT NULL DEFAULT 'active';

-- ============================================================================
-- NOTIFICATIONS
-- ============================================================================

CREATE TABLE notifications (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  member_id uuid NOT NULL REFERENCES members(id),
  type text NOT NULL,
  title text NOT NULL,
  body text NOT NULL,
  related_entity_type text,
  related_entity_id uuid,
  is_read boolean NOT NULL DEFAULT false,
  read_at timestamptz,
  delivery_channel text NOT NULL DEFAULT 'in_app',
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_notifications_member_id ON notifications(member_id);
CREATE INDEX idx_notifications_is_read ON notifications(member_id, is_read);

ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Read own notifications"
  ON notifications FOR SELECT
  USING (member_id = public.get_member_id());

-- System inserts only (service_role)
CREATE POLICY "No direct insert"
  ON notifications FOR INSERT
  WITH CHECK (false);

-- Mark as read
CREATE POLICY "Update own notifications"
  ON notifications FOR UPDATE
  USING (member_id = public.get_member_id());

CREATE POLICY "No delete notifications"
  ON notifications FOR DELETE
  USING (false);
