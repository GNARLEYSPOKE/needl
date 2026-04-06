-- Migration 016: Events, Visitor Invitations, Event Attendances (Layer 6)

CREATE TYPE rsvp_status AS ENUM ('pending', 'confirmed', 'declined');
CREATE TYPE follow_up_status AS ENUM ('none', 'contacted', 'applied', 'joined');

-- ============================================================================
-- EVENTS
-- ============================================================================

CREATE TABLE events (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  chapter_id uuid NOT NULL REFERENCES chapters(id),
  title text NOT NULL,
  format meeting_format NOT NULL DEFAULT 'in_person',
  location text,
  scheduled_at timestamptz NOT NULL,
  duration_minutes integer NOT NULL DEFAULT 90,
  created_by_member_id uuid NOT NULL REFERENCES members(id),
  is_cancelled boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_events_chapter_id ON events(chapter_id);
CREATE INDEX idx_events_scheduled_at ON events(scheduled_at);

ALTER TABLE events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Read chapter events"
  ON events FOR SELECT
  USING (chapter_id = ANY(public.get_chapter_ids()));

CREATE POLICY "Director creates events"
  ON events FOR INSERT
  WITH CHECK (
    chapter_id = ANY(public.get_chapter_ids())
    AND public.get_role() IN ('network_admin', 'super_admin', 'chapter_director')
  );

CREATE POLICY "Director updates events"
  ON events FOR UPDATE
  USING (
    chapter_id = ANY(public.get_chapter_ids())
    AND public.get_role() IN ('network_admin', 'super_admin', 'chapter_director')
  );

CREATE POLICY "No delete events"
  ON events FOR DELETE
  USING (false);

-- ============================================================================
-- VISITOR INVITATIONS
-- ============================================================================

CREATE TABLE visitor_invitations (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  event_id uuid NOT NULL REFERENCES events(id),
  inviting_member_id uuid NOT NULL REFERENCES members(id),
  visitor_name text NOT NULL,
  visitor_email text NOT NULL,
  visitor_company text,
  visitor_role text,
  invite_sent_at timestamptz,
  rsvp_status rsvp_status NOT NULL DEFAULT 'pending',
  attended boolean NOT NULL DEFAULT false,
  follow_up_status follow_up_status NOT NULL DEFAULT 'none',
  invite_token uuid NOT NULL DEFAULT gen_random_uuid() UNIQUE,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_visitor_invitations_event_id ON visitor_invitations(event_id);
CREATE INDEX idx_visitor_invitations_inviting_member ON visitor_invitations(inviting_member_id);
CREATE INDEX idx_visitor_invitations_token ON visitor_invitations(invite_token);

ALTER TABLE visitor_invitations ENABLE ROW LEVEL SECURITY;

-- Chapter members can read their chapter's visitor invitations
CREATE POLICY "Read chapter visitor invitations"
  ON visitor_invitations FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM events e
      WHERE e.id = visitor_invitations.event_id
        AND e.chapter_id = ANY(public.get_chapter_ids())
    )
  );

-- Members can create visitor invitations for their chapter events
CREATE POLICY "Create visitor invitations"
  ON visitor_invitations FOR INSERT
  WITH CHECK (inviting_member_id = public.get_member_id());

-- Chapter members can update visitor status
CREATE POLICY "Update visitor invitations"
  ON visitor_invitations FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM events e
      WHERE e.id = visitor_invitations.event_id
        AND e.chapter_id = ANY(public.get_chapter_ids())
    )
  );

CREATE POLICY "No delete visitor invitations"
  ON visitor_invitations FOR DELETE
  USING (false);

-- ============================================================================
-- EVENT ATTENDANCES
-- ============================================================================

CREATE TABLE event_attendances (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  event_id uuid NOT NULL REFERENCES events(id),
  member_id uuid NOT NULL REFERENCES members(id),
  attended boolean NOT NULL DEFAULT false,
  substitute_member_id uuid REFERENCES members(id),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_event_attendances_event_id ON event_attendances(event_id);
CREATE INDEX idx_event_attendances_member_id ON event_attendances(member_id);

ALTER TABLE event_attendances ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Read chapter attendances"
  ON event_attendances FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM events e
      WHERE e.id = event_attendances.event_id
        AND e.chapter_id = ANY(public.get_chapter_ids())
    )
  );

CREATE POLICY "Record own attendance"
  ON event_attendances FOR INSERT
  WITH CHECK (member_id = public.get_member_id());

CREATE POLICY "Update own attendance"
  ON event_attendances FOR UPDATE
  USING (member_id = public.get_member_id());

CREATE POLICY "No delete attendances"
  ON event_attendances FOR DELETE
  USING (false);
