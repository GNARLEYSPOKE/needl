'use server';

import { getCurrentMemberId } from '@/lib/actions/auth';
import { createClient } from '@/lib/supabase/server';
import { createServiceClient } from '@/lib/supabase/admin';
import { createAnthropicAIService } from '@/lib/services/ai';
import { CreateAskSchema } from '@/lib/validations/ask';
import type { CreateAskInput } from '@/lib/validations/ask';
import type { Database } from '@/types/database';

type AskRow = Database['public']['Tables']['asks']['Row'];
type MatchRow = Database['public']['Tables']['matches']['Row'];

// ============================================================================
// Create Ask
// ============================================================================

export async function createAsk(
  input: CreateAskInput,
): Promise<{ data: { id: string } | null; error: string | null }> {
  const member = await getCurrentMemberId();
  if (member.error || !member.data) return { data: null, error: member.error ?? 'Unauthorized' };

  const parsed = CreateAskSchema.safeParse(input);
  if (!parsed.success) {
    return { data: null, error: parsed.error.issues[0]?.message ?? 'Invalid input' };
  }

  const supabase = await createClient();

  // Insert the ask
  const { data: ask, error: insertError } = await supabase
    .from('asks')
    .insert({
      member_id: member.data.memberId,
      body: parsed.data.body,
      visibility: parsed.data.visibility,
    })
    .select('id')
    .single();

  if (insertError || !ask) {
    return { data: null, error: insertError?.message ?? 'Failed to create ask' };
  }

  // Extract geography from ask body (non-blocking — update async)
  const anthropicKey = process.env.ANTHROPIC_API_KEY;
  if (anthropicKey) {
    const aiService = createAnthropicAIService(anthropicKey);
    const geoResult = await aiService.extractGeography(parsed.data.body);
    if (geoResult.data && geoResult.data.length > 0) {
      await supabase.from('asks').update({ geography_filter: geoResult.data }).eq('id', ask.id);
    }
  }

  // Track first ask milestone
  const adminClient = createServiceClient();
  await adminClient
    .from('members')
    .update({ first_ask_posted_at: new Date().toISOString() })
    .eq('id', member.data.memberId)
    .is('first_ask_posted_at', null);

  return { data: { id: ask.id }, error: null };
}

// ============================================================================
// Get My Asks (with match counts)
// ============================================================================

export async function getMyAsks(): Promise<{
  data: (AskRow & { match_count: number })[] | null;
  error: string | null;
}> {
  const member = await getCurrentMemberId();
  if (member.error || !member.data) return { data: null, error: member.error ?? 'Unauthorized' };

  const supabase = await createClient();
  const { data: asks, error } = await supabase
    .from('asks')
    .select('*')
    .eq('member_id', member.data.memberId)
    .order('created_at', { ascending: false });

  if (error) return { data: null, error: error.message };
  if (!asks || asks.length === 0) return { data: [], error: null };

  // Get match counts per ask
  const adminClient = createServiceClient();
  const askIds = asks.map((a) => a.id);
  const { data: matchCounts } = await adminClient
    .from('matches')
    .select('ask_id')
    .in('ask_id', askIds);

  const countMap = new Map<string, number>();
  matchCounts?.forEach((m) => {
    countMap.set(m.ask_id, (countMap.get(m.ask_id) ?? 0) + 1);
  });

  const asksWithCounts = asks.map((ask) => ({
    ...ask,
    match_count: countMap.get(ask.id) ?? 0,
  }));

  return { data: asksWithCounts, error: null };
}

// ============================================================================
// Get Ask with Matches
// ============================================================================

interface MatchWithProfile extends MatchRow {
  member_name: string;
  company_name: string;
  tagline: string;
  avatar_url: string | null;
}

export async function getAskWithMatches(askId: string): Promise<{
  data: { ask: AskRow; matches: MatchWithProfile[] } | null;
  error: string | null;
}> {
  const member = await getCurrentMemberId();
  if (member.error || !member.data) return { data: null, error: member.error ?? 'Unauthorized' };

  const supabase = await createClient();
  const { data: ask, error: askError } = await supabase
    .from('asks')
    .select('*')
    .eq('id', askId)
    .eq('member_id', member.data.memberId)
    .single();

  if (askError || !ask) return { data: null, error: 'Ask not found' };

  // Get matches via service client (matches INSERT is service_role only)
  const adminClient = createServiceClient();
  const { data: matches } = await adminClient
    .from('matches')
    .select('*')
    .eq('ask_id', askId)
    .order('match_score', { ascending: false });

  if (!matches || matches.length === 0) {
    return { data: { ask, matches: [] }, error: null };
  }

  // Fetch member profiles for matches
  const memberIds = matches.map((m) => m.matched_member_id);
  const { data: profiles } = await adminClient
    .from('member_profiles')
    .select('member_id, company_name, tagline')
    .in('member_id', memberIds);

  const { data: members } = await adminClient
    .from('members')
    .select('id, full_name, avatar_url')
    .in('id', memberIds);

  const profileMap = new Map(profiles?.map((p) => [p.member_id, p]) ?? []);
  const memberMap = new Map(members?.map((m) => [m.id, m]) ?? []);

  const matchesWithProfiles: MatchWithProfile[] = matches.map((m) => ({
    ...m,
    member_name: memberMap.get(m.matched_member_id)?.full_name ?? 'Unknown',
    company_name: profileMap.get(m.matched_member_id)?.company_name ?? '',
    tagline: profileMap.get(m.matched_member_id)?.tagline ?? '',
    avatar_url: memberMap.get(m.matched_member_id)?.avatar_url ?? null,
  }));

  return { data: { ask, matches: matchesWithProfiles }, error: null };
}

// ============================================================================
// Close Ask (pause)
// ============================================================================

export async function closeAsk(askId: string): Promise<{ data: null; error: string | null }> {
  const member = await getCurrentMemberId();
  if (member.error || !member.data) return { data: null, error: member.error ?? 'Unauthorized' };

  const supabase = await createClient();
  const { error } = await supabase
    .from('asks')
    .update({ status: 'paused' })
    .eq('id', askId)
    .eq('member_id', member.data.memberId);

  if (error) return { data: null, error: error.message };
  return { data: null, error: null };
}

// ============================================================================
// Fulfill Ask
// ============================================================================

export async function fulfillAsk(
  askId: string,
  fulfilledByMemberId: string,
): Promise<{ data: null; error: string | null }> {
  const member = await getCurrentMemberId();
  if (member.error || !member.data) return { data: null, error: member.error ?? 'Unauthorized' };

  const supabase = await createClient();
  const { error } = await supabase
    .from('asks')
    .update({
      status: 'fulfilled',
      fulfilled_by_member_id: fulfilledByMemberId,
      fulfilled_at: new Date().toISOString(),
    })
    .eq('id', askId)
    .eq('member_id', member.data.memberId);

  if (error) return { data: null, error: error.message };
  return { data: null, error: null };
}

// ============================================================================
// Update Match Action (dismiss, request intro, etc.)
// ============================================================================

export async function updateMatchAction(
  matchId: string,
  action: 'dismissed' | 'intro_requested' | 'connected',
): Promise<{ data: null; error: string | null }> {
  const member = await getCurrentMemberId();
  if (member.error || !member.data) return { data: null, error: member.error ?? 'Unauthorized' };

  const supabase = await createClient();
  const { error } = await supabase
    .from('matches')
    .update({ asker_action: action })
    .eq('id', matchId);

  if (error) return { data: null, error: error.message };
  return { data: null, error: null };
}
