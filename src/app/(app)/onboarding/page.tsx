import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import { createServiceClient } from '@/lib/supabase/admin';

export default async function OnboardingPage() {
  const { userId } = await auth();
  if (!userId) redirect('/sign-in');

  const supabase = createServiceClient();
  const { data: member } = await supabase
    .from('members')
    .select('full_name, onboarding_completed_at')
    .eq('id', userId)
    .single();

  // If already onboarded, go to dashboard
  if (member?.onboarding_completed_at) {
    redirect('/dashboard');
  }

  return (
    <div className="mx-auto w-full max-w-2xl px-4 py-8">
      <h1 className="text-2xl font-semibold tracking-tight">Welcome to Needl</h1>
      <p className="text-muted-foreground mt-2 text-sm">
        {member?.full_name ? `Hi ${member.full_name}, l` : 'L'}et&apos;s get your profile set up.
      </p>
      <p className="text-muted-foreground mt-4 text-sm">
        Multi-step onboarding flow coming in Phase 3.
      </p>
    </div>
  );
}
