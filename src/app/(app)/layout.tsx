import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import { headers } from 'next/headers';
import { createClient } from '@/lib/supabase/server';

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const { userId } = await auth();

  if (!userId) {
    redirect('/sign-in');
  }

  const supabase = await createClient();
  const { data: member } = await supabase
    .from('members')
    .select('onboarding_completed_at')
    .eq('id', userId)
    .single();

  // If member exists but hasn't completed onboarding, redirect to onboarding
  // (unless they're already on the onboarding page)
  if (member && !member.onboarding_completed_at) {
    const headerList = await headers();
    const pathname = headerList.get('x-next-pathname') ?? '';
    if (!pathname.startsWith('/onboarding')) {
      redirect('/onboarding');
    }
  }

  return <div className="flex min-h-screen flex-col">{children}</div>;
}
