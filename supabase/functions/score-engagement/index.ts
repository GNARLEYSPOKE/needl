// Edge Function: score-engagement
// Cron: runs weekly (see _shared/cron-config.md)
// Also callable on-demand from getNetworkOverview() with 1-hour cache.
//
// Deploy: supabase functions deploy score-engagement

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

Deno.serve(async () => {
  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const supabase = createClient(supabaseUrl, supabaseKey);

  try {
    // Refresh the materialized view concurrently (non-blocking reads)
    const { error } = await supabase.rpc('refresh_engagement_scores');
    if (error) {
      console.error('Failed to refresh engagement scores:', error.message);
      return new Response(JSON.stringify({ error: error.message }), { status: 500 });
    }

    return new Response(
      JSON.stringify({
        message: 'Engagement scores refreshed',
        refreshed_at: new Date().toISOString(),
      }),
      { status: 200 },
    );
  } catch (err) {
    console.error('score-engagement error:', err);
    return new Response(JSON.stringify({ error: 'Internal error' }), { status: 500 });
  }
});
