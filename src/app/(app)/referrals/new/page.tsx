import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import { createServiceClient } from '@/lib/supabase/admin';
import { LogReferralForm } from '@/components/chapter/log-referral-form';

export default async function NewReferralPage() {
  const { userId } = await auth();
  if (!userId) redirect('/sign-in');

  const adminClient = createServiceClient();
  const { data: member } = await adminClient
    .from('members')
    .select('id')
    .eq('clerk_user_id', userId)
    .single();

  if (!member) {
    return (
      <div className="mx-auto w-full max-w-2xl px-4 py-8">
        <p className="text-muted-foreground">Member not found.</p>
      </div>
    );
  }

  // Get chapter members for the "referred to" dropdown
  const { data: memberships } = await adminClient
    .from('chapter_memberships')
    .select('chapter_id')
    .eq('member_id', member.id)
    .eq('status', 'active');

  const chapterIds = memberships?.map((m) => m.chapter_id) ?? [];

  const { data: chapterMemberships } = await adminClient
    .from('chapter_memberships')
    .select('member_id')
    .in('chapter_id', chapterIds)
    .eq('status', 'active')
    .neq('member_id', member.id);

  const memberIds = [...new Set(chapterMemberships?.map((m) => m.member_id) ?? [])];

  const { data: members } = await adminClient
    .from('members')
    .select('id, full_name')
    .in('id', memberIds)
    .order('full_name');

  return (
    <div className="mx-auto w-full max-w-2xl px-4 py-8">
      <h1 className="text-2xl font-semibold tracking-tight">Log a Referral</h1>
      <p className="text-muted-foreground mt-1 text-sm">Record a referral in under 20 seconds.</p>
      <div className="mt-6">
        <LogReferralForm chapterMembers={members ?? []} />
      </div>
    </div>
  );
}
