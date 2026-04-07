-- Migration 020: Engagement scoring materialized view
-- Refreshed weekly via cron Edge Function or on-demand with 1-hour cache.

CREATE MATERIALIZED VIEW IF NOT EXISTS member_engagement_scores AS
SELECT
  cm.member_id,
  cm.chapter_id,
  cm.expires_at,
  LEAST(100, (
    -- Event attendance (last 90 days): up to 25 points
    COALESCE((
      SELECT COUNT(*)::int * 5
      FROM event_attendances ea
      JOIN events e ON e.id = ea.event_id
      WHERE ea.member_id = cm.member_id
        AND ea.attended = true
        AND e.scheduled_at > now() - interval '90 days'
    ), 0)
    -- Active asks (last 90 days): up to 15 points
    + COALESCE((
      SELECT LEAST(COUNT(*)::int * 5, 15)
      FROM asks a
      WHERE a.member_id = cm.member_id
        AND a.status = 'active'
        AND a.created_at > now() - interval '90 days'
    ), 0)
    -- Referrals logged (last 90 days): up to 20 points
    + COALESCE((
      SELECT LEAST(COUNT(*)::int * 5, 20)
      FROM referrals r
      WHERE r.referring_member_id = cm.member_id
        AND r.created_at > now() - interval '90 days'
    ), 0)
    -- Introductions made or accepted (last 90 days): up to 15 points
    + COALESCE((
      SELECT LEAST(COUNT(*)::int * 5, 15)
      FROM introductions i
      WHERE (i.requester_member_id = cm.member_id OR i.connector_member_id = cm.member_id)
        AND i.status IN ('connector_accepted', 'completed')
        AND i.created_at > now() - interval '90 days'
    ), 0)
    -- Profile completeness: up to 15 points
    + COALESCE((
      SELECT LEAST(mp.profile_completeness / 7, 15)
      FROM member_profiles mp
      WHERE mp.member_id = cm.member_id
    ), 0)
    -- Login recency: up to 10 points
    + CASE
        WHEN m.last_login_at > now() - interval '7 days' THEN 10
        WHEN m.last_login_at > now() - interval '30 days' THEN 5
        WHEN m.last_login_at > now() - interval '90 days' THEN 2
        ELSE 0
      END
  ))::int AS engagement_score,
  (
    LEAST(100, (
      COALESCE((SELECT COUNT(*)::int * 5 FROM event_attendances ea JOIN events e ON e.id = ea.event_id WHERE ea.member_id = cm.member_id AND ea.attended = true AND e.scheduled_at > now() - interval '90 days'), 0)
      + COALESCE((SELECT LEAST(COUNT(*)::int * 5, 15) FROM asks a WHERE a.member_id = cm.member_id AND a.status = 'active' AND a.created_at > now() - interval '90 days'), 0)
      + COALESCE((SELECT LEAST(COUNT(*)::int * 5, 20) FROM referrals r WHERE r.referring_member_id = cm.member_id AND r.created_at > now() - interval '90 days'), 0)
      + COALESCE((SELECT LEAST(COUNT(*)::int * 5, 15) FROM introductions i WHERE (i.requester_member_id = cm.member_id OR i.connector_member_id = cm.member_id) AND i.status IN ('connector_accepted', 'completed') AND i.created_at > now() - interval '90 days'), 0)
      + COALESCE((SELECT LEAST(mp.profile_completeness / 7, 15) FROM member_profiles mp WHERE mp.member_id = cm.member_id), 0)
      + CASE WHEN m.last_login_at > now() - interval '7 days' THEN 10 WHEN m.last_login_at > now() - interval '30 days' THEN 5 WHEN m.last_login_at > now() - interval '90 days' THEN 2 ELSE 0 END
    )) < 30
    AND cm.expires_at < now() + interval '90 days'
  ) AS is_at_risk,
  now() AS refreshed_at
FROM chapter_memberships cm
JOIN members m ON m.id = cm.member_id
WHERE cm.status = 'active'
  AND cm.deleted_at IS NULL;

CREATE UNIQUE INDEX IF NOT EXISTS idx_engagement_scores_member_chapter
  ON member_engagement_scores(member_id, chapter_id);

-- Function to refresh scores (called by Edge Function or on-demand)
CREATE OR REPLACE FUNCTION refresh_engagement_scores() RETURNS void AS $$
  REFRESH MATERIALIZED VIEW CONCURRENTLY member_engagement_scores;
$$ LANGUAGE sql;

-- Function to refresh only if stale (>1 hour since last refresh)
CREATE OR REPLACE FUNCTION refresh_engagement_scores_if_stale() RETURNS void AS $$
DECLARE
  last_refresh timestamptz;
BEGIN
  SELECT MAX(refreshed_at) INTO last_refresh FROM member_engagement_scores;
  IF last_refresh IS NULL OR last_refresh < now() - interval '1 hour' THEN
    REFRESH MATERIALIZED VIEW CONCURRENTLY member_engagement_scores;
  END IF;
END;
$$ LANGUAGE plpgsql;
