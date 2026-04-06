'use server';

import { auth } from '@clerk/nextjs/server';
import { createClient } from '@/lib/supabase/server';
import { getCurrentMemberId } from '@/lib/actions/auth';
import { createAnthropicAIService } from '@/lib/services/ai';
import { FullProfileSchema } from '@/lib/validations/profile';
import type { ProfileDraft, ProfileDraftParams } from '@/lib/services/ai';
import type { FullProfileInput } from '@/lib/validations/profile';
import type { Database } from '@/types/database';

type MemberProfileRow = Database['public']['Tables']['member_profiles']['Row'];

// ============================================================================
// Profile Completeness Scoring
// ============================================================================

interface CompletenessInput {
  company_name?: string | null;
  tagline?: string | null;
  what_i_do?: string | null;
  who_i_serve?: string | null;
  results_i_deliver?: string | null;
  bio?: string | null;
  geography_served?: string[] | null;
  clients_served?: string[] | null;
  avatar_url?: string | null;
}

function calculateProfileCompleteness(profile: CompletenessInput): number {
  let score = 0;
  if (profile.company_name && profile.company_name.length > 0) score += 15;
  if (profile.tagline && profile.tagline.length > 0) score += 15;
  if (profile.what_i_do && profile.what_i_do.length > 0) score += 15;
  if (profile.who_i_serve && profile.who_i_serve.length > 0) score += 10;
  if (profile.results_i_deliver && profile.results_i_deliver.length > 0) score += 10;
  if (profile.bio && profile.bio.length >= 50) score += 15;
  if (profile.geography_served && profile.geography_served.length > 0) score += 10;
  if (profile.clients_served && profile.clients_served.length > 0) score += 5;
  if (profile.avatar_url && profile.avatar_url.length > 0) score += 5;
  return Math.min(score, 100);
}

// ============================================================================
// Save Profile (upsert)
// ============================================================================

export async function saveProfile(
  input: FullProfileInput,
): Promise<{ data: { profile_completeness: number } | null; error: string | null }> {
  const member = await getCurrentMemberId();
  if (member.error || !member.data) return { data: null, error: member.error ?? 'Unauthorized' };

  const parsed = FullProfileSchema.safeParse(input);
  if (!parsed.success) {
    return { data: null, error: parsed.error.issues[0]?.message ?? 'Invalid input' };
  }

  const profile = parsed.data;
  const completeness = calculateProfileCompleteness(profile);

  const supabase = await createClient();

  const { error } = await supabase.from('member_profiles').upsert(
    {
      member_id: member.data.memberId,
      company_name: profile.company_name,
      company_url: profile.company_url || null,
      tagline: profile.tagline,
      bio: profile.bio,
      what_i_do: profile.what_i_do,
      who_i_serve: profile.who_i_serve,
      results_i_deliver: profile.results_i_deliver,
      clients_served: profile.clients_served,
      geography_served: profile.geography_served,
      profile_completeness: completeness,
    },
    { onConflict: 'member_id' },
  );

  if (error) return { data: null, error: error.message };

  return { data: { profile_completeness: completeness }, error: null };
}

// ============================================================================
// Complete Onboarding
// ============================================================================

export async function completeOnboarding(
  input: FullProfileInput,
): Promise<{ data: { profile_completeness: number } | null; error: string | null }> {
  const member = await getCurrentMemberId();
  if (member.error || !member.data) return { data: null, error: member.error ?? 'Unauthorized' };

  // Save the profile first
  const result = await saveProfile(input);
  if (result.error) return result;

  // Mark onboarding as completed
  const supabase = await createClient();
  const { error } = await supabase
    .from('members')
    .update({ onboarding_completed_at: new Date().toISOString() })
    .eq('id', member.data.memberId);

  if (error) return { data: null, error: error.message };

  return result;
}

// ============================================================================
// Get Profile
// ============================================================================

const SUMMARY_COLUMNS =
  'id, member_id, company_name, tagline, what_i_do, who_i_serve, geography_served, profile_completeness' as const;

export async function getProfile(
  memberId: string,
): Promise<{ data: (MemberProfileRow & { is_summary: boolean }) | null; error: string | null }> {
  const member = await getCurrentMemberId();
  if (member.error || !member.data) return { data: null, error: member.error ?? 'Unauthorized' };

  const supabase = await createClient();

  // Check if requester shares a chapter with the target
  const { data: requesterChapters } = await supabase
    .from('chapter_memberships')
    .select('chapter_id')
    .eq('member_id', member.data.memberId)
    .eq('status', 'active');

  const { data: targetChapters } = await supabase
    .from('chapter_memberships')
    .select('chapter_id')
    .eq('member_id', memberId)
    .eq('status', 'active');

  const requesterChapterIds = new Set(requesterChapters?.map((c) => c.chapter_id) ?? []);
  const isSameChapter = targetChapters?.some((c) => requesterChapterIds.has(c.chapter_id)) ?? false;
  const isOwnProfile = member.data.memberId === memberId;

  if (isOwnProfile || isSameChapter) {
    const { data, error } = await supabase
      .from('member_profiles')
      .select('*')
      .eq('member_id', memberId)
      .single();

    if (error) return { data: null, error: error.message };
    return { data: data ? { ...data, is_summary: false } : null, error: null };
  }

  // Cross-chapter: summary only
  const { data, error } = await supabase
    .from('member_profiles')
    .select(SUMMARY_COLUMNS)
    .eq('member_id', memberId)
    .single();

  if (error) return { data: null, error: error.message };

  const summaryProfile: MemberProfileRow & { is_summary: boolean } = {
    id: data.id,
    member_id: data.member_id,
    company_name: data.company_name,
    company_url: null,
    tagline: data.tagline,
    bio: '',
    what_i_do: data.what_i_do,
    who_i_serve: data.who_i_serve,
    results_i_deliver: '',
    clients_served: [],
    geography_served: data.geography_served,
    industry_tags: [],
    linkedin_imported_at: null,
    embedding: null,
    embedding_updated_at: null,
    profile_completeness: data.profile_completeness,
    created_at: '',
    updated_at: '',
    is_summary: true,
  };

  return { data: summaryProfile, error: null };
}

export async function getMyProfile(): Promise<{
  data: MemberProfileRow | null;
  error: string | null;
}> {
  const member = await getCurrentMemberId();
  if (member.error || !member.data) return { data: null, error: member.error ?? 'Unauthorized' };

  const supabase = await createClient();
  const { data, error } = await supabase
    .from('member_profiles')
    .select('*')
    .eq('member_id', member.data.memberId)
    .single();

  if (error && error.code !== 'PGRST116') return { data: null, error: error.message };
  return { data: data ?? null, error: null };
}

// ============================================================================
// LinkedIn Import
// ============================================================================

interface LinkedInImportData {
  fullName: string;
  headline: string | null;
  summary: string | null;
  positions: Array<{
    title: string;
    company: string;
    description: string | null;
  }>;
}

export async function draftProfileFromLinkedIn(
  input: LinkedInImportData,
): Promise<{ data: ProfileDraft | null; error: string | null }> {
  const { userId } = await auth();
  if (!userId) return { data: null, error: 'Unauthorized' };

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return { data: null, error: 'AI service not configured' };

  const aiService = createAnthropicAIService(apiKey);

  const params: ProfileDraftParams = {
    fullName: input.fullName,
    headline: input.headline,
    summary: input.summary,
    positions: input.positions,
  };

  return aiService.draftProfile(params);
}
