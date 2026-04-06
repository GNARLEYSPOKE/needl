import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import { headers } from 'next/headers';
import { createServiceClient } from '@/lib/supabase/admin';

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const { userId } = await auth();

  if (!userId) {
    redirect('/sign-in');
  }

  // Use service client for read-only member lookup (avoids Clerk getToken rate limits)
  const supabase = createServiceClient();
  const { data: member } = await supabase
    .from('members')
    .select('onboarding_completed_at')
    .eq('clerk_user_id', userId)
    .single();

  if (member && !member.onboarding_completed_at) {
    const headerList = await headers();
    const pathname = headerList.get('x-next-pathname') ?? '';
    if (!pathname.startsWith('/onboarding')) {
      redirect('/onboarding');
    }
  }

  return <div className="flex min-h-screen flex-col">{children}</div>;
}
