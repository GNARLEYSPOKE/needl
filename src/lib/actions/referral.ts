'use server';

import { getCurrentMemberId } from '@/lib/actions/auth';
import { createClient } from '@/lib/supabase/server';
import { createServiceClient } from '@/lib/supabase/admin';
import { LogReferralSchema } from '@/lib/validations/referral';
import type { LogReferralInput } from '@/lib/validations/referral';
import type { Database } from '@/types/database';

type ReferralRow = Database['public']['Tables']['referrals']['Row'];

export async function logReferral(
  input: LogReferralInput,
): Promise<{ data: { id: string } | null; error: string | null }> {
  const member = await getCurrentMemberId();
  if (member.error || !member.data) return { data: null, error: member.error ?? 'Unauthorized' };

  const parsed = LogReferralSchema.safeParse(input);
  if (!parsed.success) {
    return { data: null, error: parsed.error.issues[0]?.message ?? 'Invalid input' };
  }

  // Get org ID
  const adminClient = createServiceClient();
  const { data: memberRow } = await adminClient
    .from('members')
    .select('organization_id')
    .eq('id', member.data.memberId)
    .single();

  if (!memberRow) return { data: null, error: 'Organization not found' };

  const supabase = await createClient();
  const { data: referral, error } = await supabase
    .from('referrals')
    .insert({
      organization_id: memberRow.organization_id,
      referring_member_id: member.data.memberId,
      receiving_member_id: parsed.data.receivingMemberId,
      referred_contact_name: parsed.data.referredContactName,
      referred_contact_email: parsed.data.referredContactEmail || null,
      notes: parsed.data.notes ?? null,
      estimated_value: parsed.data.estimatedValue ?? null,
    })
    .select('id')
    .single();

  if (error) return { data: null, error: error.message };
  return { data: { id: referral.id }, error: null };
}

export async function getMyReferrals(): Promise<{
  data: (ReferralRow & { receiving_member_name: string })[] | null;
  error: string | null;
}> {
  const member = await getCurrentMemberId();
  if (member.error || !member.data) return { data: null, error: member.error ?? 'Unauthorized' };

  const adminClient = createServiceClient();
  const { data: referrals, error } = await adminClient
    .from('referrals')
    .select('*')
    .eq('referring_member_id', member.data.memberId)
    .order('created_at', { ascending: false });

  if (error) return { data: null, error: error.message };
  if (!referrals || referrals.length === 0) return { data: [], error: null };

  const memberIds = [...new Set(referrals.map((r) => r.receiving_member_id))];
  const { data: members } = await adminClient
    .from('members')
    .select('id, full_name')
    .in('id', memberIds);

  const nameMap = new Map(members?.map((m) => [m.id, m.full_name]) ?? []);

  const enriched = referrals.map((r) => ({
    ...r,
    receiving_member_name: nameMap.get(r.receiving_member_id) ?? 'Unknown',
  }));

  return { data: enriched, error: null };
}

export async function updateReferralStatus(
  referralId: string,
  status: 'closed' | 'lost',
  closedValue?: number,
): Promise<{ data: null; error: string | null }> {
  const member = await getCurrentMemberId();
  if (member.error || !member.data) return { data: null, error: member.error ?? 'Unauthorized' };

  const supabase = await createClient();
  const { error } = await supabase
    .from('referrals')
    .update({
      status,
      estimated_value: closedValue ?? null,
      closed_at: status === 'closed' ? new Date().toISOString() : null,
    })
    .eq('id', referralId)
    .eq('referring_member_id', member.data.memberId);

  if (error) return { data: null, error: error.message };
  return { data: null, error: null };
}
