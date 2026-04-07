'use server';

import { getCurrentMemberId } from '@/lib/actions/auth';
import { createServiceClient } from '@/lib/supabase/admin';

// ============================================================================
// Network Admin Overview
// ============================================================================

export interface ChapterOverview {
  id: string;
  name: string;
  memberCount: number;
  billingStatus: string;
  atRiskCount: number;
  isAtLimit: boolean;
}

export async function getNetworkOverview(): Promise<{
  data: { chapters: ChapterOverview[]; totalMembers: number; totalAtRisk: number } | null;
  error: string | null;
}> {
  const member = await getCurrentMemberId();
  if (member.error || !member.data) return { data: null, error: member.error ?? 'Unauthorized' };

  const adminClient = createServiceClient();

  // Get org
  const { data: memberRow } = await adminClient
    .from('members')
    .select('organization_id')
    .eq('id', member.data.memberId)
    .single();

  if (!memberRow) return { data: null, error: 'Organization not found' };

  // Refresh engagement scores if stale (>1 hour)
  try {
    await adminClient.rpc('refresh_engagement_scores_if_stale');
  } catch {
    // View may not exist yet or refresh fails — non-blocking
  }

  // Get chapters
  const { data: chapters } = await adminClient
    .from('chapters')
    .select('id, name, billing_status')
    .eq('organization_id', memberRow.organization_id)
    .eq('is_active', true);

  if (!chapters) return { data: { chapters: [], totalMembers: 0, totalAtRisk: 0 }, error: null };

  // Get member counts per chapter
  const { data: memberships } = await adminClient
    .from('chapter_memberships')
    .select('chapter_id, member_id')
    .in(
      'chapter_id',
      chapters.map((c) => c.id),
    )
    .eq('status', 'active')
    .is('deleted_at', null);

  const countMap = new Map<string, number>();
  memberships?.forEach((m) => {
    countMap.set(m.chapter_id, (countMap.get(m.chapter_id) ?? 0) + 1);
  });

  // Try to get at-risk counts from engagement scores
  const atRiskMap = new Map<string, number>();
  try {
    // Materialized view — not in typed Tables, query untyped
    const { data: scores } = (await adminClient
      .from('member_engagement_scores' as string)
      .select('chapter_id, is_at_risk')
      .eq('is_at_risk', true)) as {
      data: Array<{ chapter_id: string; is_at_risk: boolean }> | null;
    };

    scores?.forEach((s: { chapter_id: string }) => {
      atRiskMap.set(s.chapter_id, (atRiskMap.get(s.chapter_id) ?? 0) + 1);
    });
  } catch {
    // Materialized view may not exist yet
  }

  const chapterOverviews: ChapterOverview[] = chapters.map((c) => {
    const count = countMap.get(c.id) ?? 0;
    return {
      id: c.id,
      name: c.name,
      memberCount: count,
      billingStatus: c.billing_status,
      atRiskCount: atRiskMap.get(c.id) ?? 0,
      isAtLimit: count >= 23,
    };
  });

  const totalMembers = chapterOverviews.reduce((sum, c) => sum + c.memberCount, 0);
  const totalAtRisk = chapterOverviews.reduce((sum, c) => sum + c.atRiskCount, 0);

  return { data: { chapters: chapterOverviews, totalMembers, totalAtRisk }, error: null };
}

// ============================================================================
// Chapter Director Admin
// ============================================================================

export interface MemberEngagement {
  memberId: string;
  fullName: string;
  engagementScore: number;
  isAtRisk: boolean;
  expiresAt: string;
  profileComplete: boolean;
  onboardingComplete: boolean;
}

export async function getChapterAdmin(): Promise<{
  data: {
    members: MemberEngagement[];
    visitorCount: number;
    chapterName: string;
  } | null;
  error: string | null;
}> {
  const member = await getCurrentMemberId();
  if (member.error || !member.data) return { data: null, error: member.error ?? 'Unauthorized' };

  const adminClient = createServiceClient();

  // Get member's chapter
  const { data: membership } = await adminClient
    .from('chapter_memberships')
    .select('chapter_id')
    .eq('member_id', member.data.memberId)
    .eq('status', 'active')
    .limit(1)
    .single();

  if (!membership) return { data: null, error: 'No active chapter' };

  const { data: chapter } = await adminClient
    .from('chapters')
    .select('name')
    .eq('id', membership.chapter_id)
    .single();

  // Get chapter members with engagement data
  const { data: chapterMembers } = await adminClient
    .from('chapter_memberships')
    .select('member_id, expires_at')
    .eq('chapter_id', membership.chapter_id)
    .eq('status', 'active')
    .is('deleted_at', null);

  if (!chapterMembers || chapterMembers.length === 0) {
    return {
      data: { members: [], visitorCount: 0, chapterName: chapter?.name ?? '' },
      error: null,
    };
  }

  const memberIds = chapterMembers.map((m) => m.member_id);
  const expiresMap = new Map(chapterMembers.map((m) => [m.member_id, m.expires_at]));

  const { data: members } = await adminClient
    .from('members')
    .select('id, full_name, onboarding_completed_at')
    .in('id', memberIds);

  const { data: profiles } = await adminClient
    .from('member_profiles')
    .select('member_id, profile_completeness')
    .in('member_id', memberIds);

  const profileMap = new Map(profiles?.map((p) => [p.member_id, p.profile_completeness]) ?? []);

  // Try engagement scores
  const scoreMap = new Map<string, { score: number; atRisk: boolean }>();
  try {
    const { data: scores } = (await adminClient
      .from('member_engagement_scores' as string)
      .select('member_id, engagement_score, is_at_risk')
      .eq('chapter_id', membership.chapter_id)) as {
      data: Array<{ member_id: string; engagement_score: number; is_at_risk: boolean }> | null;
    };

    scores?.forEach((s: { member_id: string; engagement_score: number; is_at_risk: boolean }) => {
      scoreMap.set(s.member_id, { score: s.engagement_score, atRisk: s.is_at_risk });
    });
  } catch {
    // View may not exist
  }

  // Get visitor count
  const { data: events } = await adminClient
    .from('events')
    .select('id')
    .eq('chapter_id', membership.chapter_id);

  let visitorCount = 0;
  if (events && events.length > 0) {
    const { count } = await adminClient
      .from('visitor_invitations')
      .select('id', { count: 'exact', head: true })
      .in(
        'event_id',
        events.map((e) => e.id),
      );
    visitorCount = count ?? 0;
  }

  const memberEngagement: MemberEngagement[] = (members ?? []).map((m) => {
    const scores = scoreMap.get(m.id);
    return {
      memberId: m.id,
      fullName: m.full_name,
      engagementScore: scores?.score ?? 0,
      isAtRisk: scores?.atRisk ?? false,
      expiresAt: expiresMap.get(m.id) ?? '',
      profileComplete: (profileMap.get(m.id) ?? 0) >= 70,
      onboardingComplete: !!m.onboarding_completed_at,
    };
  });

  return {
    data: {
      members: memberEngagement,
      visitorCount,
      chapterName: chapter?.name ?? '',
    },
    error: null,
  };
}
