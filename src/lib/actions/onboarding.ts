'use server';

import { getCurrentMemberId } from '@/lib/actions/auth';
import { createServiceClient } from '@/lib/supabase/admin';

export interface OnboardingStep {
  label: string;
  completed: boolean;
  href: string;
}

export interface OnboardingStatus {
  steps: OnboardingStep[];
  allComplete: boolean;
}

export async function getOnboardingStatus(): Promise<{
  data: OnboardingStatus | null;
  error: string | null;
}> {
  const member = await getCurrentMemberId();
  if (member.error || !member.data) return { data: null, error: member.error ?? 'Unauthorized' };

  const adminClient = createServiceClient();

  const { data: memberRow } = await adminClient
    .from('members')
    .select('first_search_at, first_ask_posted_at, first_intro_requested_at')
    .eq('id', member.data.memberId)
    .single();

  const { data: profile } = await adminClient
    .from('member_profiles')
    .select('profile_completeness')
    .eq('member_id', member.data.memberId)
    .single();

  const steps: OnboardingStep[] = [
    {
      label: 'Complete your profile',
      completed: (profile?.profile_completeness ?? 0) >= 70,
      href: '/profile/edit',
    },
    {
      label: 'Post your first Standing Ask',
      completed: !!memberRow?.first_ask_posted_at,
      href: '/asks/new',
    },
    {
      label: 'Run your first search',
      completed: !!memberRow?.first_search_at,
      href: '/search',
    },
    {
      label: 'Request your first introduction',
      completed: !!memberRow?.first_intro_requested_at,
      href: '/search',
    },
  ];

  const allComplete = steps.every((s) => s.completed);

  return { data: { steps, allComplete }, error: null };
}

export interface MemberOnboardingRow {
  memberId: string;
  fullName: string;
  profileComplete: boolean;
  firstAskPosted: boolean;
  firstSearchRun: boolean;
  firstIntroRequested: boolean;
  joinedAt: string;
}

export async function getChapterOnboardingStatus(): Promise<{
  data: MemberOnboardingRow[] | null;
  error: string | null;
}> {
  const member = await getCurrentMemberId();
  if (member.error || !member.data) return { data: null, error: member.error ?? 'Unauthorized' };

  const adminClient = createServiceClient();

  // Get member's chapters
  const { data: memberships } = await adminClient
    .from('chapter_memberships')
    .select('chapter_id')
    .eq('member_id', member.data.memberId)
    .eq('status', 'active');

  if (!memberships || memberships.length === 0) return { data: [], error: null };

  const chapterIds = memberships.map((m) => m.chapter_id);

  // Get all chapter members
  const { data: chapterMemberships } = await adminClient
    .from('chapter_memberships')
    .select('member_id, joined_at')
    .in('chapter_id', chapterIds)
    .eq('status', 'active');

  if (!chapterMemberships || chapterMemberships.length === 0) return { data: [], error: null };

  const memberIds = [...new Set(chapterMemberships.map((m) => m.member_id))];
  const joinedMap = new Map(chapterMemberships.map((m) => [m.member_id, m.joined_at]));

  const { data: members } = await adminClient
    .from('members')
    .select('id, full_name, first_search_at, first_ask_posted_at, first_intro_requested_at')
    .in('id', memberIds);

  const { data: profiles } = await adminClient
    .from('member_profiles')
    .select('member_id, profile_completeness')
    .in('member_id', memberIds);

  const profileMap = new Map(profiles?.map((p) => [p.member_id, p.profile_completeness]) ?? []);

  const rows: MemberOnboardingRow[] = (members ?? []).map((m) => ({
    memberId: m.id,
    fullName: m.full_name,
    profileComplete: (profileMap.get(m.id) ?? 0) >= 70,
    firstAskPosted: !!m.first_ask_posted_at,
    firstSearchRun: !!m.first_search_at,
    firstIntroRequested: !!m.first_intro_requested_at,
    joinedAt: joinedMap.get(m.id) ?? '',
  }));

  return { data: rows, error: null };
}
