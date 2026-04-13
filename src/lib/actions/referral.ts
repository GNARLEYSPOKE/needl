'use server';

import { getCurrentMemberId } from '@/lib/actions/auth';
import { createClient } from '@/lib/supabase/server';
import { createServiceClient } from '@/lib/supabase/admin';
import { createResendNotificationService } from '@/lib/services/notification';
import { createAnthropicAIService } from '@/lib/services/ai';
import { LogReferralSchema, ExternalReferralSchema } from '@/lib/validations/referral';
import type { LogReferralInput, ExternalReferralInput } from '@/lib/validations/referral';
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

// ============================================================================
// External Referral — refer a chapter member to someone outside the network
// ============================================================================

export async function createExternalReferral(
  input: ExternalReferralInput,
): Promise<{ data: { id: string } | null; error: string | null }> {
  const member = await getCurrentMemberId();
  if (member.error || !member.data) return { data: null, error: member.error ?? 'Unauthorized' };

  const parsed = ExternalReferralSchema.safeParse(input);
  if (!parsed.success) {
    return { data: null, error: parsed.error.issues[0]?.message ?? 'Invalid input' };
  }

  const adminClient = createServiceClient();

  // Get sender info + receiving member info
  const { data: sender } = await adminClient
    .from('members')
    .select('full_name, email, organization_id')
    .eq('id', member.data.memberId)
    .single();

  if (!sender) return { data: null, error: 'Sender not found' };

  const { data: receiver } = await adminClient
    .from('members')
    .select('full_name, email')
    .eq('id', parsed.data.receivingMemberId)
    .single();

  if (!receiver) return { data: null, error: 'Receiving member not found' };

  // Insert referral row
  const supabase = await createClient();
  const { data: referral, error } = await supabase
    .from('referrals')
    .insert({
      organization_id: sender.organization_id,
      referring_member_id: member.data.memberId,
      receiving_member_id: parsed.data.receivingMemberId,
      referred_contact_name: parsed.data.recipientEmail,
      referred_contact_email: parsed.data.recipientEmail,
      notes: parsed.data.message,
      status: 'passed',
    })
    .select('id')
    .single();

  if (error || !referral) {
    return { data: null, error: error?.message ?? 'Failed to create referral' };
  }

  // Send email to recipient via NotificationService
  const resendKey = process.env.RESEND_API_KEY;
  if (resendKey) {
    const notifier = createResendNotificationService(resendKey);
    await notifier.sendEmail({
      to: parsed.data.recipientEmail,
      subject: `${sender.full_name} wants to introduce you to ${receiver.full_name}`,
      html: `<p>${parsed.data.message.replace(/\n/g, '<br>')}</p>`,
    });
  }

  // Insert notification for the referred-to member
  await adminClient.from('notifications').insert({
    member_id: parsed.data.receivingMemberId,
    type: 'new_referral',
    title: `${sender.full_name} referred you to someone`,
    body: `${sender.full_name} referred you to someone in their network`,
    related_entity_type: 'member',
    related_entity_id: member.data.memberId,
  });

  return { data: { id: referral.id }, error: null };
}

export async function rewriteWhatIDoThirdPerson(
  whatIDo: string,
  firstName: string,
): Promise<{ data: string | null; error: string | null }> {
  const member = await getCurrentMemberId();
  if (member.error || !member.data) return { data: null, error: 'Unauthorized' };

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return { data: null, error: 'AI service not configured' };

  const aiService = createAnthropicAIService(apiKey);
  return aiService.rewriteThirdPerson(whatIDo, firstName);
}
