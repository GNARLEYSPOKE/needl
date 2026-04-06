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

  const { query, countryFilter } = parsed.data;

  // Get requester's chapter IDs and org ID
  const adminClient = createServiceClient();
  const { data: memberships } = await adminClient
    .from('chapter_memberships')
    .select('chapter_id, chapters!inner(organization_id)')
    .eq('member_id', member.data.memberId)
    .eq('status', 'active');

  if (!memberships || memberships.length === 0) {
    return { data: [], error: null };
  }

  const chapterIds = memberships.map((m) => m.chapter_id);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- Supabase join typing limitation
  const orgId = (memberships[0] as any).chapters?.organization_id as string;

  if (!orgId) {
    return { data: null, error: 'Organization not found' };
  }

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
    exclude_chapter_ids: chapterIds,
    geo_filter: geoFilter,
    match_limit: 3,
  });

  if (rpcError) {
    return { data: null, error: rpcError.message };
  }

  if (!results || results.length === 0) {
    return { data: [], error: null };
  }

  // Fetch member names for results
  const memberIds = results.map((r: { member_id: string }) => r.member_id);
  const { data: members } = await adminClient
    .from('members')
    .select('id, full_name, avatar_url')
    .in('id', memberIds);

  const memberMap = new Map(members?.map((m) => [m.id, m]) ?? []);

  // Generate AI match reasons in parallel
  const anthropicKey = process.env.ANTHROPIC_API_KEY;
  const aiService = anthropicKey ? createAnthropicAIService(anthropicKey) : null;

  const matchResults: MatchResult[] = await Promise.all(
    results.map(
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
        };
      },
    ),
  );

  return { data: matchResults, error: null };
}
