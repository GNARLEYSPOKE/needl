// Edge Function: nudge-onboarding
// Cron: runs daily (configured in Supabase dashboard, see _shared/cron-config.md)
// Finds members who haven't completed onboarding after 7 days and sends a nudge email.
//
// Deploy: supabase functions deploy nudge-onboarding

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const RESEND_API_URL = 'https://api.resend.com/emails';

Deno.serve(async () => {
  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const resendKey = Deno.env.get('RESEND_API_KEY');
  const appUrl = Deno.env.get('NEXT_PUBLIC_APP_URL') ?? 'https://needl.app';

  const supabase = createClient(supabaseUrl, supabaseKey);

  // Find members who haven't completed onboarding and signed up > 7 days ago
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

  const { data: members, error } = await supabase
    .from('members')
    .select('id, email, full_name')
    .is('onboarding_completed_at', null)
    .lt('created_at', sevenDaysAgo)
    .eq('is_active', true);

  if (error) {
    console.error('Failed to query members:', error.message);
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }

  if (!members || members.length === 0) {
    return new Response(JSON.stringify({ message: 'No members to nudge' }), { status: 200 });
  }

  let nudgedCount = 0;

  for (const member of members) {
    // Check how many onboarding steps are complete
    const { data: profile } = await supabase
      .from('member_profiles')
      .select('profile_completeness')
      .eq('member_id', member.id)
      .single();

    const completeness = profile?.profile_completeness ?? 0;
    const totalSteps = 4;
    let completedSteps = 0;
    if (completeness >= 70) completedSteps++;

    const { data: memberRow } = await supabase
      .from('members')
      .select('first_ask_posted_at, first_search_at, first_intro_requested_at')
      .eq('id', member.id)
      .single();

    if (memberRow?.first_ask_posted_at) completedSteps++;
    if (memberRow?.first_search_at) completedSteps++;
    if (memberRow?.first_intro_requested_at) completedSteps++;

    // Send nudge email via Resend
    if (resendKey) {
      try {
        await fetch(RESEND_API_URL, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${resendKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            from: 'Needl <notifications@needl.app>',
            to: member.email,
            subject: 'Finish setting up your Needl profile',
            html: `
              <h2>Hi ${member.full_name},</h2>
              <p>You've completed ${completedSteps} of ${totalSteps} steps to get the most out of your network.</p>
              <p><a href="${appUrl}/onboarding">Complete your profile</a></p>
            `,
          }),
        });
        nudgedCount++;
      } catch (err) {
        console.error(`Failed to send nudge to ${member.email}:`, err);
      }
    }
  }

  return new Response(
    JSON.stringify({ message: `Nudged ${nudgedCount} members`, total: members.length }),
    { status: 200 },
  );
});
