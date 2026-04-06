'use server';

import { getCurrentMemberId } from '@/lib/actions/auth';
import { createClient } from '@/lib/supabase/server';
import { createServiceClient } from '@/lib/supabase/admin';
import { CreateEventSchema } from '@/lib/validations/event';
import type { CreateEventInput } from '@/lib/validations/event';
import type { Database } from '@/types/database';

type EventRow = Database['public']['Tables']['events']['Row'];

export async function createEvent(
  input: CreateEventInput,
): Promise<{ data: { id: string } | null; error: string | null }> {
  const member = await getCurrentMemberId();
  if (member.error || !member.data) return { data: null, error: member.error ?? 'Unauthorized' };

  const parsed = CreateEventSchema.safeParse(input);
  if (!parsed.success) {
    return { data: null, error: parsed.error.issues[0]?.message ?? 'Invalid input' };
  }

  const supabase = await createClient();
  const { data: event, error } = await supabase
    .from('events')
    .insert({
      chapter_id: parsed.data.chapterId,
      title: parsed.data.title,
      format: parsed.data.format,
      location: parsed.data.location ?? null,
      scheduled_at: parsed.data.scheduledAt,
      duration_minutes: parsed.data.durationMinutes,
      created_by_member_id: member.data.memberId,
    })
    .select('id')
    .single();

  if (error) return { data: null, error: error.message };
  return { data: { id: event.id }, error: null };
}

export async function getChapterEvents(chapterId: string): Promise<{
  data: EventRow[] | null;
  error: string | null;
}> {
  const member = await getCurrentMemberId();
  if (member.error || !member.data) return { data: null, error: member.error ?? 'Unauthorized' };

  const adminClient = createServiceClient();
  const { data: events, error } = await adminClient
    .from('events')
    .select('*')
    .eq('chapter_id', chapterId)
    .eq('is_cancelled', false)
    .order('scheduled_at', { ascending: true });

  if (error) return { data: null, error: error.message };
  return { data: events ?? [], error: null };
}
