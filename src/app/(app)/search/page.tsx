import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import { createServiceClient } from '@/lib/supabase/admin';
import { SearchForm } from '@/components/search/search-form';

export default async function SearchPage(): Promise<React.ReactElement> {
  const { userId } = await auth();
  if (!userId) redirect('/sign-in');

  const adminClient = createServiceClient();
  const { data: member } = await adminClient
    .from('members')
    .select('full_name')
    .eq('clerk_user_id', userId)
    .single();

  return (
    <div className="mx-auto w-full max-w-2xl px-4 py-8">
      <h1 className="text-2xl font-semibold tracking-tight">Search</h1>
      <p className="text-muted-foreground mt-1 text-sm">
        Find the right person anywhere in your network.
      </p>
      <div className="mt-6">
        <SearchForm senderName={member?.full_name ?? ''} />
      </div>
    </div>
  );
}
