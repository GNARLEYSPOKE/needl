import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import { createServiceClient } from '@/lib/supabase/admin';
import { MemberDirectory } from '@/components/chapter/member-directory';

export interface DirectoryMember {
  id: string;
  full_name: string;
  avatar_url: string | null;
  company_name: string;
  tagline: string;
  what_i_do: string;
  has_profile: boolean;
}

export default async function ChapterMembersPage(): Promise<React.ReactElement> {
  const { userId } = await auth();
  if (!userId) redirect('/sign-in');

  const adminClient = createServiceClient();

  const { data: currentMember } = await adminClient
    .from('members')
    .select('id, full_name')
    .eq('clerk_user_id', userId)
    .single();

  if (!currentMember) {
    return (
      <div className="mx-auto w-full max-w-4xl px-4 py-8">
        <p className="text-muted-foreground">Member not found.</p>
      </div>
    );
  }

  // Get user's chapter
  const { data: membership } = await adminClient
    .from('chapter_memberships')
    .select('chapter_id, chapters(name)')
    .eq('member_id', currentMember.id)
    .eq('status', 'active')
    .limit(1)
    .single();

  if (!membership) {
    return (
      <div className="mx-auto w-full max-w-4xl px-4 py-8">
        <p className="text-muted-foreground">No active chapter membership.</p>
      </div>
    );
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- Supabase join typing
  const chapterName: string = (membership as any).chapters?.name ?? 'My Chapter';

  // Get all active members in chapter (exclude self)
  const { data: chapterMembers } = await adminClient
    .from('chapter_memberships')
    .select('member_id')
    .eq('chapter_id', membership.chapter_id)
    .eq('status', 'active')
    .neq('member_id', currentMember.id);

  const memberIds = [...new Set(chapterMembers?.map((m) => m.member_id) ?? [])];

  if (memberIds.length === 0) {
    return (
      <div className="mx-auto w-full max-w-4xl px-4 py-8">
        <h1 className="text-2xl font-semibold tracking-tight">{chapterName}</h1>
        <p className="text-muted-foreground mt-1 text-sm">
          Members in {chapterName} — refer them to your network.
        </p>
        <p className="text-muted-foreground mt-12 text-center text-sm">
          No other members in your chapter yet.
        </p>
      </div>
    );
  }

  const { data: members } = await adminClient
    .from('members')
    .select('id, full_name, avatar_url')
    .in('id', memberIds)
    .order('full_name');

  const { data: profiles } = await adminClient
    .from('member_profiles')
    .select('member_id, company_name, tagline, what_i_do')
    .in('member_id', memberIds);

  const profileMap = new Map(profiles?.map((p) => [p.member_id, p]) ?? []);

  const directoryMembers: DirectoryMember[] = (members ?? []).map((m) => {
    const profile = profileMap.get(m.id);
    return {
      id: m.id,
      full_name: m.full_name,
      avatar_url: m.avatar_url,
      company_name: profile?.company_name ?? '',
      tagline: profile?.tagline ?? '',
      what_i_do: profile?.what_i_do ?? '',
      has_profile: !!profile?.company_name,
    };
  });

  return (
    <div className="mx-auto w-full max-w-4xl px-4 py-8">
      <h1 className="text-2xl font-semibold tracking-tight">{chapterName}</h1>
      <p className="text-muted-foreground mt-1 text-sm">
        Members in {chapterName} — refer them to your network.
      </p>
      <div className="mt-6">
        <MemberDirectory members={directoryMembers} senderName={currentMember.full_name} />
      </div>
    </div>
  );
}
