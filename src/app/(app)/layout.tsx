import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import { createServiceClient } from '@/lib/supabase/admin';

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const { userId } = await auth();

  if (!userId) {
    redirect('/sign-in');
  }

  // Check if member has any active chapter memberships
  const supabase = createServiceClient();
  const { data: member } = await supabase
    .from('members')
    .select('onboarding_completed_at')
    .eq('id', userId)
    .single();

  // Member doesn't exist yet (webhook may not have fired) — let them through
  // Onboarding not completed — redirect (unless already on onboarding page)
  if (member && !member.onboarding_completed_at) {
    // We can't check the current path in a layout easily,
    // so the onboarding page itself will handle its own logic
  }

  return <div className="flex min-h-screen flex-col">{children}</div>;
}
