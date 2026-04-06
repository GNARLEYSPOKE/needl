import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import { createServiceClient } from '@/lib/supabase/admin';
import { RequestIntroForm } from '@/components/introductions/request-intro-form';

interface RequestIntroPageProps {
  params: Promise<{ targetMemberId: string }>;
  searchParams: Promise<{ askId?: string; matchId?: string }>;
}

export default async function RequestIntroPage({ params, searchParams }: RequestIntroPageProps) {
  const { userId } = await auth();
  if (!userId) redirect('/sign-in');

  const { targetMemberId } = await params;
  const { askId, matchId } = await searchParams;

  const adminClient = createServiceClient();

  // Get target member info
  const { data: target } = await adminClient
    .from('members')
    .select('id, full_name')
    .eq('id', targetMemberId)
    .single();

  if (!target) {
    return (
      <div className="mx-auto w-full max-w-2xl px-4 py-8">
        <p className="text-muted-foreground">Member not found.</p>
      </div>
    );
  }

  const { data: profile } = await adminClient
    .from('member_profiles')
    .select('company_name')
    .eq('member_id', targetMemberId)
    .single();

  // Get current member ID to find connector
  const { data: currentMember } = await adminClient
    .from('members')
    .select('id')
    .eq('clerk_user_id', userId)
    .single();

  // Find potential connector (longest-tenured in target's chapter, excluding requester and target)
  let connectorName: string | null = null;
  if (currentMember) {
    const { data: targetChapters } = await adminClient
      .from('chapter_memberships')
      .select('chapter_id')
      .eq('member_id', targetMemberId)
      .eq('status', 'active');

    if (targetChapters && targetChapters.length > 0) {
      const { data: connector } = await adminClient
        .from('chapter_memberships')
        .select('member_id, members!inner(full_name)')
        .in(
          'chapter_id',
          targetChapters.map((c) => c.chapter_id),
        )
        .eq('status', 'active')
        .neq('member_id', currentMember.id)
        .neq('member_id', targetMemberId)
        .order('joined_at', { ascending: true })
        .limit(1)
        .single();

      if (connector) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any -- Supabase join typing
        connectorName = (connector as any).members?.full_name ?? null;
      }
    }
  }

  return (
    <div className="mx-auto w-full max-w-2xl px-4 py-8">
      <h1 className="text-2xl font-semibold tracking-tight">Request Introduction</h1>
      <div className="mt-6">
        <RequestIntroForm
          targetMemberId={targetMemberId}
          targetName={target.full_name}
          targetCompany={profile?.company_name ?? ''}
          connectorName={connectorName}
          askId={askId}
          matchId={matchId}
        />
      </div>
    </div>
  );
}
