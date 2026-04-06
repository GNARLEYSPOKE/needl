import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';

export default async function DashboardPage() {
  const { userId } = await auth();
  if (!userId) redirect('/sign-in');

  const supabase = await createClient();
  const { data: member } = await supabase
    .from('members')
    .select('full_name, onboarding_completed_at')
    .eq('clerk_user_id', userId)
    .single();

  // If member hasn't completed onboarding, redirect
  if (member && !member.onboarding_completed_at) {
    redirect('/onboarding');
  }

  return (
    <div className="mx-auto w-full max-w-2xl px-4 py-8">
      <h1 className="text-2xl font-semibold tracking-tight">
        Welcome back{member?.full_name ? `, ${member.full_name}` : ''}
      </h1>
      <p className="text-muted-foreground mt-2 text-sm">Your dashboard is coming in Phase 3.</p>
    </div>
  );
}
