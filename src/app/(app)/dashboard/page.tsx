import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import { createServiceClient } from '@/lib/supabase/admin';
import { getOnboardingStatus } from '@/lib/actions/onboarding';
import { OnboardingChecklist } from '@/components/onboarding/onboarding-checklist';
import { CompletenessNudge } from '@/components/profile/completeness-nudge';

export default async function DashboardPage() {
  const { userId } = await auth();
  if (!userId) redirect('/sign-in');

  const supabase = createServiceClient();
  const { data: member } = await supabase
    .from('members')
    .select('full_name, onboarding_completed_at')
    .eq('clerk_user_id', userId)
    .single();

  if (member && !member.onboarding_completed_at) {
    redirect('/onboarding');
  }

  const { data: onboarding } = await getOnboardingStatus();

  // Get profile completeness for nudge
  const { data: memberRow } = await supabase
    .from('members')
    .select('id')
    .eq('clerk_user_id', userId)
    .single();

  let profileCompleteness = 0;
  if (memberRow) {
    const { data: profile } = await supabase
      .from('member_profiles')
      .select('profile_completeness')
      .eq('member_id', memberRow.id)
      .single();
    profileCompleteness = profile?.profile_completeness ?? 0;
  }

  return (
    <div className="mx-auto w-full max-w-2xl space-y-6 px-4 py-8">
      <h1 className="text-2xl font-semibold tracking-tight">
        Welcome back{member?.full_name ? `, ${member.full_name}` : ''}
      </h1>

      {onboarding && !onboarding.allComplete && <OnboardingChecklist steps={onboarding.steps} />}

      <CompletenessNudge completeness={profileCompleteness} />

      {onboarding?.allComplete && profileCompleteness >= 70 && (
        <p className="text-muted-foreground text-sm">You&apos;re all set up. Get connecting.</p>
      )}
    </div>
  );
}
