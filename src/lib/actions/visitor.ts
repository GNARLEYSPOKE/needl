'use server';

import { getCurrentMemberId } from '@/lib/actions/auth';
import { createClient } from '@/lib/supabase/server';
import { createServiceClient } from '@/lib/supabase/admin';
import { InviteVisitorSchema, RsvpSchema } from '@/lib/validations/visitor';
import type { InviteVisitorInput, RsvpInput } from '@/lib/validations/visitor';
import type { Database } from '@/types/database';

type VisitorRow = Database['public']['Tables']['visitor_invitations']['Row'];

export async function createVisitorInvitation(
  input: InviteVisitorInput,
): Promise<{ data: { inviteToken: string } | null; error: string | null }> {
  const member = await getCurrentMemberId();
  if (member.error || !member.data) return { data: null, error: member.error ?? 'Unauthorized' };

  const parsed = InviteVisitorSchema.safeParse(input);
  if (!parsed.success) {
    return { data: null, error: parsed.error.issues[0]?.message ?? 'Invalid input' };
  }

  const supabase = await createClient();
  const { data: invite, error } = await supabase
    .from('visitor_invitations')
    .insert({
      event_id: parsed.data.eventId,
      inviting_member_id: member.data.memberId,
      visitor_name: parsed.data.visitorName,
      visitor_email: parsed.data.visitorEmail,
      visitor_company: parsed.data.visitorCompany ?? null,
      visitor_role: parsed.data.visitorRole ?? null,
    })
    .select('invite_token')
    .single();

  if (error) return { data: null, error: error.message };
  return { data: { inviteToken: invite.invite_token }, error: null };
}

export async function getVisitorPipeline(chapterId: string): Promise<{
  data: (VisitorRow & { event_title: string; inviting_member_name: string })[] | null;
  error: string | null;
}> {
  const member = await getCurrentMemberId();
  if (member.error || !member.data) return { data: null, error: member.error ?? 'Unauthorized' };

  const adminClient = createServiceClient();
  const { data: events } = await adminClient
    .from('events')
    .select('id, title')
    .eq('chapter_id', chapterId);

  if (!events || events.length === 0) return { data: [], error: null };

  const eventIds = events.map((e) => e.id);
  const eventMap = new Map(events.map((e) => [e.id, e.title]));

  const { data: visitors, error } = await adminClient
    .from('visitor_invitations')
    .select('*')
    .in('event_id', eventIds)
    .order('created_at', { ascending: false });

  if (error) return { data: null, error: error.message };

  const memberIds = [...new Set(visitors?.map((v) => v.inviting_member_id) ?? [])];
  const { data: members } = await adminClient
    .from('members')
    .select('id, full_name')
    .in('id', memberIds);

  const nameMap = new Map(members?.map((m) => [m.id, m.full_name]) ?? []);

  const enriched = (visitors ?? []).map((v) => ({
    ...v,
    event_title: eventMap.get(v.event_id) ?? '',
    inviting_member_name: nameMap.get(v.inviting_member_id) ?? 'Unknown',
  }));

  return { data: enriched, error: null };
}

// Public RSVP — no auth required
export async function rsvpByToken(input: RsvpInput): Promise<{ data: null; error: string | null }> {
  const parsed = RsvpSchema.safeParse(input);
  if (!parsed.success) {
    return { data: null, error: parsed.error.issues[0]?.message ?? 'Invalid input' };
  }

  // Use service client since this is a public action (no auth)
  const adminClient = createServiceClient();
  const { error } = await adminClient
    .from('visitor_invitations')
    .update({ rsvp_status: parsed.data.response })
    .eq('invite_token', parsed.data.token);

  if (error) return { data: null, error: error.message };
  return { data: null, error: null };
}

export async function updateVisitorStatus(
  invitationId: string,
  status: 'none' | 'contacted' | 'applied' | 'joined',
): Promise<{ data: null; error: string | null }> {
  const member = await getCurrentMemberId();
  if (member.error || !member.data) return { data: null, error: member.error ?? 'Unauthorized' };

  const supabase = await createClient();
  const { error } = await supabase
    .from('visitor_invitations')
    .update({ follow_up_status: status })
    .eq('id', invitationId);

  if (error) return { data: null, error: error.message };
  return { data: null, error: null };
}
