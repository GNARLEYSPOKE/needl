'use server';

import { getCurrentMemberId } from '@/lib/actions/auth';
import { createServiceClient } from '@/lib/supabase/admin';
import type { Database } from '@/types/database';

type AskRow = Database['public']['Tables']['asks']['Row'];

export interface ChapterAsk extends AskRow {
  member_name: string;
}

export async function getChapterAsks(): Promise<{
  data: ChapterAsk[] | null;
  error: string | null;
}> {
  const member = await getCurrentMemberId();
  if (member.error || !member.data) return { data: null, error: member.error ?? 'Unauthorized' };

  const adminClient = createServiceClient();

  const { data: memberships } = await adminClient
    .from('chapter_memberships')
    .select('chapter_id')
    .eq('member_id', member.data.memberId)
    .eq('status', 'active');

  if (!memberships || memberships.length === 0) return { data: [], error: null };

  const chapterIds = memberships.map((m) => m.chapter_id);

  const { data: chapterMembers } = await adminClient
    .from('chapter_memberships')
    .select('member_id')
    .in('chapter_id', chapterIds)
    .eq('status', 'active');

  if (!chapterMembers || chapterMembers.length === 0) return { data: [], error: null };

  const memberIds = [...new Set(chapterMembers.map((m) => m.member_id))];

  const { data: asks, error } = await adminClient
    .from('asks')
    .select('*')
    .in('member_id', memberIds)
    .eq('status', 'active')
    .order('created_at', { ascending: false });

  if (error) return { data: null, error: error.message };
  if (!asks || asks.length === 0) return { data: [], error: null };

  // Fetch member names
  const { data: members } = await adminClient
    .from('members')
    .select('id, full_name')
    .in('id', memberIds);

  const nameMap = new Map(members?.map((m) => [m.id, m.full_name]) ?? []);

  const enriched: ChapterAsk[] = asks.map((ask) => ({
    ...ask,
    member_name: nameMap.get(ask.member_id) ?? 'Unknown',
  }));

  return { data: enriched, error: null };
}
