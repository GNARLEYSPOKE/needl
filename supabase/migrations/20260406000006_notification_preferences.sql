-- Migration 006: Notification Preferences

CREATE TYPE email_digest_frequency AS ENUM ('daily', 'weekly', 'never');

CREATE TABLE notification_preferences (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  member_id uuid NOT NULL UNIQUE REFERENCES members(id),
  email_digest_frequency email_digest_frequency NOT NULL DEFAULT 'weekly',
  push_enabled boolean NOT NULL DEFAULT true,
  sms_enabled boolean NOT NULL DEFAULT false,
  match_notifications boolean NOT NULL DEFAULT true,
  intro_notifications boolean NOT NULL DEFAULT true,
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TRIGGER trg_notification_preferences_updated_at
  BEFORE UPDATE ON notification_preferences
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

ALTER TABLE notification_preferences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Select own preferences"
  ON notification_preferences FOR SELECT
  USING (member_id = auth.uid());

CREATE POLICY "Insert own preferences"
  ON notification_preferences FOR INSERT
  WITH CHECK (member_id = auth.uid());

CREATE POLICY "Update own preferences"
  ON notification_preferences FOR UPDATE
  USING (member_id = auth.uid());

CREATE POLICY "No delete"
  ON notification_preferences FOR DELETE
  USING (false);
