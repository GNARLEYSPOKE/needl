'use server';

import { getCurrentMemberId } from '@/lib/actions/auth';
import { createClient } from '@/lib/supabase/server';
import { createServiceClient } from '@/lib/supabase/admin';
import { createOpenAIEmbeddingService } from '@/lib/services/embedding';
import { createAnthropicAIService } from '@/lib/services/ai';
import { SearchQuerySchema } from '@/lib/validations/search';
import type { SearchQueryInput } from '@/lib/validations/search';

export interface MatchResult {
  member_id: string;
  company_name: string;
  tagline: string;
  what_i_do: string;
  geography_served: string[];
  match_score: number;
  match_reason: string;
  member_name: string;
  avatar_url: string | null;
  chapter_name: string;
}

export async function searchMembers(
  input: SearchQueryInput,
): Promise<{ data: MatchResult[] | null; error: string | null }> {
  const member = await getCurrentMemberId();
  if (member.error || !member.data) return { data: null, error: member.error ?? 'Unauthorized' };

  const parsed = SearchQuerySchema.safeParse(input);
  if (!parsed.success) {
    return { data: null, error: parsed.error.issues[0]?.message ?? 'Invalid input' };
  }

  const { query, countryFilter, chapterOnly } = parsed.data;

  // Get requester's org ID
  const adminClient = createServiceClient();
  const { data: memberRow } = await adminClient
    .from('members')
    .select('organization_id')
    .eq('id', member.data.memberId)
    .single();

  if (!memberRow) {
    return { data: null, error: 'Organization not found' };
  }

  const orgId = memberRow.organization_id;

  // Embed the search query
  const openaiKey = process.env.OPENAI_API_KEY;
  if (!openaiKey) return { data: null, error: 'Embedding service not configured' };

  const embeddingService = createOpenAIEmbeddingService(openaiKey);
  const embedResult = await embeddingService.embed(query);
  if (embedResult.error || !embedResult.data) {
    return { data: null, error: embedResult.error ?? 'Failed to embed query' };
  }

  // Run pgvector similarity search via RPC
  const supabase = await createClient();
  const geoFilter = countryFilter ? [countryFilter] : null;

  const { data: results, error: rpcError } = await supabase.rpc('search_members', {
    query_embedding: JSON.stringify(embedResult.data.embedding),
    search_org_id: orgId,
    geo_filter: geoFilter,
    match_limit: 3,
  });

  if (rpcError) {
    return { data: null, error: rpcError.message };
  }

  if (!results || results.length === 0) {
    return { data: [], error: null };
  }

  // Filter to chapter members only if requested
  let filteredResults = results;
  if (chapterOnly) {
    const { data: myChapters } = await adminClient
      .from('chapter_memberships')
      .select('chapter_id')
      .eq('member_id', member.data.memberId)
      .eq('status', 'active');

    if (myChapters && myChapters.length > 0) {
      const chapterIds = myChapters.map((c) => c.chapter_id);
      const { data: chapterMembers } = await adminClient
        .from('chapter_memberships')
        .select('member_id')
        .in('chapter_id', chapterIds)
        .eq('status', 'active');

      const chapterMemberIds = new Set(chapterMembers?.map((m) => m.member_id) ?? []);
      filteredResults = results.filter((r: { member_id: string }) =>
        chapterMemberIds.has(r.member_id),
      );
    }
  }

  if (filteredResults.length === 0) {
    return { data: [], error: null };
  }

  // Fetch member names for results
  const memberIds = filteredResults.map((r: { member_id: string }) => r.member_id);
  const { data: members } = await adminClient
    .from('members')
    .select('id, full_name, avatar_url')
    .in('id', memberIds);

  const memberMap = new Map(members?.map((m) => [m.id, m]) ?? []);

  // Resolve each result member's chapter name
  const { data: resultMemberships } = await adminClient
    .from('chapter_memberships')
    .select('member_id, chapter_id')
    .in('member_id', memberIds)
    .eq('status', 'active');

  const resultChapterIds = Array.from(new Set(resultMemberships?.map((m) => m.chapter_id) ?? []));
  const { data: resultChapters } = resultChapterIds.length
    ? await adminClient.from('chapters').select('id, name').in('id', resultChapterIds)
    : { data: [] };

  const chapterNameMap = new Map(resultChapters?.map((c) => [c.id, c.name]) ?? []);
  const memberChapterNameMap = new Map(
    resultMemberships?.map((m) => [m.member_id, chapterNameMap.get(m.chapter_id) ?? '']) ?? [],
  );

  // Generate AI match reasons in parallel
  const anthropicKey = process.env.ANTHROPIC_API_KEY;
  const aiService = anthropicKey ? createAnthropicAIService(anthropicKey) : null;

  const matchResults: MatchResult[] = await Promise.all(
    filteredResults.map(
      async (r: {
        member_id: string;
        company_name: string;
        tagline: string;
        what_i_do: string;
        who_i_serve: string;
        geography_served: string[];
        match_score: number;
      }) => {
        const memberInfo = memberMap.get(r.member_id);
        let matchReason = `${r.company_name} may be a good match based on their expertise.`;

        if (aiService) {
          const reasonResult = await aiService.generateMatchReason({
            askBody: query,
            memberProfile: {
              companyName: r.company_name,
              tagline: r.tagline,
              whatIDo: r.what_i_do,
              whoIServe: r.who_i_serve,
              geographyServed: r.geography_served,
            },
          });
          if (reasonResult.data) {
            matchReason = reasonResult.data;
          }
        }

        return {
          member_id: r.member_id,
          company_name: r.company_name,
          tagline: r.tagline,
          what_i_do: r.what_i_do,
          geography_served: r.geography_served,
          match_score: r.match_score,
          match_reason: matchReason,
          member_name: memberInfo?.full_name ?? 'Unknown',
          avatar_url: memberInfo?.avatar_url ?? null,
          chapter_name: memberChapterNameMap.get(r.member_id) ?? '',
        };
      },
    ),
  );

  // Track first search milestone
  await adminClient
    .from('members')
    .update({ first_search_at: new Date().toISOString() })
    .eq('id', member.data.memberId)
    .is('first_search_at', null);

  return { data: matchResults, error: null };
}

// ============================================================================
// Search by Name/Company (ILIKE — non-semantic, direct people lookup)
// ============================================================================

export interface PersonResult {
  member_id: string;
  full_name: string;
  avatar_url: string | null;
  company_name: string;
  tagline: string;
  what_i_do: string;
  geography_served: string[];
  chapter_name: string;
  is_same_chapter: boolean;
}

export async function searchByName(
  query: string,
): Promise<{ data: PersonResult[] | null; error: string | null }> {
  const member = await getCurrentMemberId();
  if (member.error || !member.data) return { data: null, error: member.error ?? 'Unauthorized' };

  if (!query || query.trim().length < 2) {
    return { data: [], error: null };
  }

  const adminClient = createServiceClient();

  // Get requester's org
  const { data: memberRow } = await adminClient
    .from('members')
    .select('organization_id')
    .eq('id', member.data.memberId)
    .single();

  if (!memberRow) return { data: null, error: 'Organization not found' };

  // ILIKE pattern
  const pattern = `%${query.trim()}%`;

  // Find members in same org with name match
  const { data: nameMatches } = await adminClient
    .from('members')
    .select('id, full_name, avatar_url')
    .eq('organization_id', memberRow.organization_id)
    .eq('is_active', true)
    .ilike('full_name', pattern)
    .neq('id', member.data.memberId)
    .limit(5);

  // Find profiles with company match (in same org)
  const { data: orgMembers } = await adminClient
    .from('members')
    .select('id')
    .eq('organization_id', memberRow.organization_id)
    .eq('is_active', true)
    .neq('id', member.data.memberId);

  const orgMemberIds = orgMembers?.map((m) => m.id) ?? [];

  const { data: companyMatches } = orgMemberIds.length
    ? await adminClient
        .from('member_profiles')
        .select('member_id, company_name, tagline, what_i_do, geography_served')
        .in('member_id', orgMemberIds)
        .ilike('company_name', pattern)
        .limit(5)
    : { data: [] };

  // Collect unique member IDs
  const memberIds = new Set<string>();
  nameMatches?.forEach((m) => memberIds.add(m.id));
  companyMatches?.forEach((m) => memberIds.add(m.member_id));

  if (memberIds.size === 0) return { data: [], error: null };

  const idArray = Array.from(memberIds);

  // Fetch full member info
  const { data: members } = await adminClient
    .from('members')
    .select('id, full_name, avatar_url')
    .in('id', idArray);

  const { data: profiles } = await adminClient
    .from('member_profiles')
    .select('member_id, company_name, tagline, what_i_do, geography_served')
    .in('member_id', idArray);

  const profileMap = new Map(profiles?.map((p) => [p.member_id, p]) ?? []);

  // Active chapter memberships → chapter names
  const { data: memberships } = await adminClient
    .from('chapter_memberships')
    .select('member_id, chapter_id')
    .in('member_id', idArray)
    .eq('status', 'active');

  const chapterIds = [...new Set(memberships?.map((m) => m.chapter_id) ?? [])];
  const { data: chapters } = chapterIds.length
    ? await adminClient.from('chapters').select('id, name').in('id', chapterIds)
    : { data: [] };

  const chapterNameMap = new Map(chapters?.map((c) => [c.id, c.name]) ?? []);
  const memberChapterMap = new Map(
    memberships?.map((m) => [m.member_id, chapterNameMap.get(m.chapter_id) ?? '']) ?? [],
  );
  const memberChapterIdMap = new Map(memberships?.map((m) => [m.member_id, m.chapter_id]) ?? []);

  // Current user's active chapters
  const { data: myMemberships } = await adminClient
    .from('chapter_memberships')
    .select('chapter_id')
    .eq('member_id', member.data.memberId)
    .eq('status', 'active');
  const myChapterIds = new Set(myMemberships?.map((m) => m.chapter_id) ?? []);

  const results: PersonResult[] = (members ?? [])
    .filter((m) => profileMap.has(m.id))
    .map((m) => {
      const profile = profileMap.get(m.id)!;
      const theirChapterId = memberChapterIdMap.get(m.id);
      return {
        member_id: m.id,
        full_name: m.full_name,
        avatar_url: m.avatar_url,
        company_name: profile.company_name,
        tagline: profile.tagline,
        what_i_do: profile.what_i_do,
        geography_served: profile.geography_served,
        chapter_name: memberChapterMap.get(m.id) ?? '',
        is_same_chapter: !!theirChapterId && myChapterIds.has(theirChapterId),
      };
    });

  return { data: results, error: null };
}
