# Edge Function Cron Schedules

Configure these in Supabase Dashboard → Database → Extensions → pg_cron,
or via the Supabase Dashboard → Edge Functions → Schedules.

## nudge-onboarding

- **Schedule:** Daily at 10:00 AM UTC (`0 10 * * *`)
- **Function:** `nudge-onboarding`
- **Purpose:** Send nudge emails to members who haven't completed onboarding after 7 days
- **Query:** members WHERE onboarding_completed_at IS NULL AND created_at < now() - 7 days

## nudge-stale-asks (Phase 5, not yet implemented)

- **Schedule:** Daily at 9:00 AM UTC (`0 9 * * *`)
- **Function:** `nudge-stale-asks`
- **Purpose:** Suggest updates for asks with zero matches after 30 days

## score-engagement (Phase 9, not yet implemented)

- **Schedule:** Weekly, Sunday midnight UTC (`0 0 * * 0`)
- **Function:** `score-engagement`
- **Purpose:** Refresh member_engagement_scores materialized view
