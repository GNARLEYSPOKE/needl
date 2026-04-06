'use server';

import { getCurrentMemberId } from '@/lib/actions/auth';
import { createServiceClient } from '@/lib/supabase/admin';
import type { Database } from '@/types/database';

type AskRow = Database['public']['Tables']['asks']['Row'];

export async function getChapterAsks(): Promise<{
  data: AskRow[] | null;
  error: string | null;
}> {
  const member = await getCurrentMemberId();
  if (member.error || !member.data) return { data: null, error: member.error ?? 'Unauthorized' };

  const adminClient = createServiceClient();

  // Get member's chapter IDs
  const { data: memberships } = await adminClient
    .from('chapter_memberships')
    .select('chapter_id')
    .eq('member_id', member.data.memberId)
    .eq('status', 'active');

  if (!memberships || memberships.length === 0) return { data: [], error: null };

  const chapterIds = memberships.map((m) => m.chapter_id);

  // Get all chapter members
  const { data: chapterMembers } = await adminClient
    .from('chapter_memberships')
    .select('member_id')
    .in('chapter_id', chapterIds)
    .eq('status', 'active');

  if (!chapterMembers || chapterMembers.length === 0) return { data: [], error: null };

  const memberIds = [...new Set(chapterMembers.map((m) => m.member_id))];

  // Get active asks from chapter members
  const { data: asks, error } = await adminClient
    .from('asks')
    .select('*')
    .in('member_id', memberIds)
    .eq('status', 'active')
    .order('created_at', { ascending: false });

  if (error) return { data: null, error: error.message };
  return { data: asks ?? [], error: null };
}
