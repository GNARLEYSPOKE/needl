'use server';

import { getCurrentMemberId } from '@/lib/actions/auth';
import { createClient } from '@/lib/supabase/server';
import { createServiceClient } from '@/lib/supabase/admin';
import { createResendNotificationService } from '@/lib/services/notification';
import { RequestIntroSchema, RespondIntroSchema } from '@/lib/validations/introduction';
import type { RequestIntroInput, RespondIntroInput } from '@/lib/validations/introduction';
import type { Database } from '@/types/database';

type IntroRow = Database['public']['Tables']['introductions']['Row'];

// ============================================================================
// Connector Selection Algorithm
// ============================================================================

async function selectConnector(
  targetMemberId: string,
  requesterId: string,
): Promise<string | null> {
  const adminClient = createServiceClient();

  // Get target's chapters
  const { data: targetChapters } = await adminClient
    .from('chapter_memberships')
    .select('chapter_id')
    .eq('member_id', targetMemberId)
    .eq('status', 'active')
    .is('deleted_at', null);

  if (!targetChapters || targetChapters.length === 0) return null;

  const chapterIds = targetChapters.map((c) => c.chapter_id);

  // Find active members in target's chapter, exclude requester and target
  // Order by joined_at ASC (longest tenure first)
  const { data: candidates } = await adminClient
    .from('chapter_memberships')
    .select('member_id, joined_at')
    .in('chapter_id', chapterIds)
    .eq('status', 'active')
    .is('deleted_at', null)
    .neq('member_id', requesterId)
    .neq('member_id', targetMemberId)
    .order('joined_at', { ascending: true })
    .limit(1);

  return candidates?.[0]?.member_id ?? null;
}

// ============================================================================
// Send Notification Emails
// ============================================================================

function getNotificationService(): ReturnType<typeof createResendNotificationService> | null {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return null;
  return createResendNotificationService(apiKey);
}

async function getMemberInfo(
  memberId: string,
): Promise<{ full_name: string; email: string; company_name: string } | null> {
  const adminClient = createServiceClient();
  const { data: member } = await adminClient
    .from('members')
    .select('full_name, email')
    .eq('id', memberId)
    .single();
  const { data: profile } = await adminClient
    .from('member_profiles')
    .select('company_name')
    .eq('member_id', memberId)
    .single();
  if (!member) return null;
  return {
    full_name: member.full_name,
    email: member.email,
    company_name: profile?.company_name ?? '',
  };
}

// ============================================================================
// Request Introduction
// ============================================================================

export async function requestIntroduction(
  input: RequestIntroInput,
): Promise<{ data: { id: string } | null; error: string | null }> {
  const member = await getCurrentMemberId();
  if (member.error || !member.data) return { data: null, error: member.error ?? 'Unauthorized' };

  const parsed = RequestIntroSchema.safeParse(input);
  if (!parsed.success) {
    return { data: null, error: parsed.error.issues[0]?.message ?? 'Invalid input' };
  }

  const { targetMemberId, message, askId, matchId } = parsed.data;

  if (targetMemberId === member.data.memberId) {
    return { data: null, error: 'Cannot request introduction to yourself' };
  }

  // Select connector
  const connectorId = await selectConnector(targetMemberId, member.data.memberId);

  const supabase = await createClient();
  const status = connectorId ? 'pending_connector' : 'pending_target';

  const { data: intro, error: insertError } = await supabase
    .from('introductions')
    .insert({
      requester_member_id: member.data.memberId,
      target_member_id: targetMemberId,
      connector_member_id: connectorId,
      ask_id: askId || null,
      match_id: matchId || null,
      message,
      status,
      connector_response: connectorId ? 'pending' : null,
    })
    .select('id')
    .single();

  if (insertError || !intro) {
    return { data: null, error: insertError?.message ?? 'Failed to create introduction' };
  }

  // Send notification email
  const notifier = getNotificationService();
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000';

  if (notifier) {
    const requester = await getMemberInfo(member.data.memberId);
    const target = await getMemberInfo(targetMemberId);

    if (connectorId) {
      // Notify connector
      const connector = await getMemberInfo(connectorId);
      if (connector && requester && target) {
        await notifier.sendEmail({
          to: connector.email,
          subject: `${requester.full_name} is requesting an introduction to ${target.full_name}`,
          html: `
            <h2>Hi ${connector.full_name},</h2>
            <p><strong>${requester.full_name}</strong> (${requester.company_name}) is requesting an introduction to <strong>${target.full_name}</strong>.</p>
            <blockquote style="border-left:3px solid #e2e8f0;padding-left:12px;color:#64748b;">${message}</blockquote>
            <p><a href="${appUrl}/introductions/${intro.id}">Respond to this request</a></p>
          `,
        });
      }
    } else {
      // Direct request — notify target
      if (requester && target) {
        await notifier.sendEmail({
          to: target.email,
          subject: `${requester.full_name} wants to connect with you`,
          html: `
            <h2>Hi ${target.full_name},</h2>
            <p><strong>${requester.full_name}</strong> (${requester.company_name}) wants to connect with you.</p>
            <blockquote style="border-left:3px solid #e2e8f0;padding-left:12px;color:#64748b;">${message}</blockquote>
            <p><a href="${appUrl}/introductions/${intro.id}">View request</a></p>
          `,
        });
      }
    }
  }

  return { data: { id: intro.id }, error: null };
}

// ============================================================================
// Respond to Introduction (connector or target)
// ============================================================================

export async function respondToIntroduction(
  input: RespondIntroInput,
): Promise<{ data: null; error: string | null }> {
  const member = await getCurrentMemberId();
  if (member.error || !member.data) return { data: null, error: member.error ?? 'Unauthorized' };

  const parsed = RespondIntroSchema.safeParse(input);
  if (!parsed.success) {
    return { data: null, error: parsed.error.issues[0]?.message ?? 'Invalid input' };
  }

  const { introductionId, response, note, alternativeMemberId } = parsed.data;

  const adminClient = createServiceClient();
  const { data: intro } = await adminClient
    .from('introductions')
    .select('*')
    .eq('id', introductionId)
    .single();

  if (!intro) return { data: null, error: 'Introduction not found' };

  const isConnector = intro.connector_member_id === member.data.memberId;
  const isTarget = intro.target_member_id === member.data.memberId;

  if (!isConnector && !isTarget) {
    return { data: null, error: 'Not authorized to respond' };
  }

  const supabase = await createClient();
  const notifier = getNotificationService();
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000';

  if (isConnector) {
    if (response === 'accepted') {
      await supabase
        .from('introductions')
        .update({
          connector_response: 'accepted',
          connector_note: note ?? null,
          status: 'connector_accepted',
          intro_sent_at: new Date().toISOString(),
        })
        .eq('id', introductionId);

      // Email both requester and target
      if (notifier) {
        const requester = await getMemberInfo(intro.requester_member_id);
        const target = await getMemberInfo(intro.target_member_id);
        const connector = await getMemberInfo(member.data.memberId);

        if (requester && target && connector) {
          const mailtoSubject = encodeURIComponent(
            `Introduction: ${requester.full_name} meet ${target.full_name}`,
          );
          const mailtoBody = encodeURIComponent(
            `Hi ${target.full_name},\n\n${connector.full_name} is introducing you to ${requester.full_name} (${requester.company_name}).\n\n${requester.full_name} wrote: "${intro.message}"\n\nBest regards`,
          );
          const mailtoLink = `mailto:${target.email}?cc=${requester.email}&subject=${mailtoSubject}&body=${mailtoBody}`;

          // Email requester
          await notifier.sendEmail({
            to: requester.email,
            subject: `${connector.full_name} accepted your introduction request`,
            html: `
              <h2>Great news, ${requester.full_name}!</h2>
              <p>${connector.full_name} has introduced you to <strong>${target.full_name}</strong> (${target.company_name}).</p>
              <p><a href="${mailtoLink}">Send an email to ${target.full_name}</a></p>
              <p><a href="${appUrl}/introductions/${introductionId}">View details</a></p>
            `,
          });

          // Email target
          await notifier.sendEmail({
            to: target.email,
            subject: `${connector.full_name} is introducing you to ${requester.full_name}`,
            html: `
              <h2>Hi ${target.full_name},</h2>
              <p>${connector.full_name} is introducing you to <strong>${requester.full_name}</strong> (${requester.company_name}).</p>
              <blockquote style="border-left:3px solid #e2e8f0;padding-left:12px;color:#64748b;">${intro.message}</blockquote>
              <p><a href="${appUrl}/introductions/${introductionId}">View details</a></p>
            `,
          });
        }
      }
    } else if (response === 'declined') {
      // Connector declined → auto-create direct request to target
      await supabase
        .from('introductions')
        .update({
          connector_response: 'declined',
          connector_note: note ?? null,
          status: 'pending_target',
          connector_member_id: null,
        })
        .eq('id', introductionId);

      // Email target with direct request
      if (notifier) {
        const requester = await getMemberInfo(intro.requester_member_id);
        const target = await getMemberInfo(intro.target_member_id);

        if (requester && target) {
          await notifier.sendEmail({
            to: target.email,
            subject: `${requester.full_name} wants to connect with you`,
            html: `
              <h2>Hi ${target.full_name},</h2>
              <p><strong>${requester.full_name}</strong> (${requester.company_name}) wants to connect with you.</p>
              <blockquote style="border-left:3px solid #e2e8f0;padding-left:12px;color:#64748b;">${intro.message}</blockquote>
              <p><a href="${appUrl}/introductions/${introductionId}">View request</a></p>
            `,
          });
        }
      }
    } else if (response === 'suggested_alternative' && alternativeMemberId) {
      await supabase
        .from('introductions')
        .update({
          connector_response: 'suggested_alternative',
          connector_note: note ?? null,
          alternative_member_id: alternativeMemberId,
        })
        .eq('id', introductionId);
    }
  } else if (isTarget) {
    if (response === 'accepted') {
      await supabase.from('introductions').update({ status: 'completed' }).eq('id', introductionId);
    } else if (response === 'declined') {
      await supabase.from('introductions').update({ status: 'declined' }).eq('id', introductionId);

      // Email requester
      if (notifier) {
        const requester = await getMemberInfo(intro.requester_member_id);
        const target = await getMemberInfo(intro.target_member_id);

        if (requester && target) {
          await notifier.sendEmail({
            to: requester.email,
            subject: `Update on your introduction request`,
            html: `
              <h2>Hi ${requester.full_name},</h2>
              <p>${target.full_name} has declined the introduction request at this time.</p>
              <p><a href="${appUrl}/search">Search for other connections</a></p>
            `,
          });
        }
      }
    }
  }

  return { data: null, error: null };
}

// ============================================================================
// Get My Introductions
// ============================================================================

interface IntroWithNames extends IntroRow {
  requester_name: string;
  target_name: string;
  connector_name: string | null;
}

export async function getMyIntroductions(): Promise<{
  data: IntroWithNames[] | null;
  error: string | null;
}> {
  const member = await getCurrentMemberId();
  if (member.error || !member.data) return { data: null, error: member.error ?? 'Unauthorized' };

  const supabase = await createClient();
  const { data: intros, error } = await supabase
    .from('introductions')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) return { data: null, error: error.message };
  if (!intros || intros.length === 0) return { data: [], error: null };

  // Fetch member names
  const memberIds = new Set<string>();
  intros.forEach((i) => {
    memberIds.add(i.requester_member_id);
    memberIds.add(i.target_member_id);
    if (i.connector_member_id) memberIds.add(i.connector_member_id);
  });

  const adminClient = createServiceClient();
  const { data: members } = await adminClient
    .from('members')
    .select('id, full_name')
    .in('id', Array.from(memberIds));

  const nameMap = new Map(members?.map((m) => [m.id, m.full_name]) ?? []);

  const enriched: IntroWithNames[] = intros.map((i) => ({
    ...i,
    requester_name: nameMap.get(i.requester_member_id) ?? 'Unknown',
    target_name: nameMap.get(i.target_member_id) ?? 'Unknown',
    connector_name: i.connector_member_id ? (nameMap.get(i.connector_member_id) ?? null) : null,
  }));

  return { data: enriched, error: null };
}

// ============================================================================
// Get Single Introduction
// ============================================================================

export async function getIntroduction(introId: string): Promise<{
  data:
    | (IntroRow & {
        requester: { full_name: string; email: string; company_name: string };
        target: { full_name: string; email: string; company_name: string };
        connector: { full_name: string; email: string; company_name: string } | null;
        currentUserRole: 'requester' | 'target' | 'connector';
      })
    | null;
  error: string | null;
}> {
  const member = await getCurrentMemberId();
  if (member.error || !member.data) return { data: null, error: member.error ?? 'Unauthorized' };

  const supabase = await createClient();
  const { data: intro, error } = await supabase
    .from('introductions')
    .select('*')
    .eq('id', introId)
    .single();

  if (error || !intro) return { data: null, error: 'Introduction not found' };

  const requester = await getMemberInfo(intro.requester_member_id);
  const target = await getMemberInfo(intro.target_member_id);
  const connector = intro.connector_member_id
    ? await getMemberInfo(intro.connector_member_id)
    : null;

  if (!requester || !target) return { data: null, error: 'Member data not found' };

  let currentUserRole: 'requester' | 'target' | 'connector' = 'requester';
  if (intro.target_member_id === member.data.memberId) currentUserRole = 'target';
  if (intro.connector_member_id === member.data.memberId) currentUserRole = 'connector';

  return {
    data: {
      ...intro,
      requester,
      target,
      connector,
      currentUserRole,
    },
    error: null,
  };
}
