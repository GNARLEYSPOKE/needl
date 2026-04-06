// Edge Function: embed-ask
// Triggered by database webhook on asks INSERT/UPDATE.
// Embeds the ask body, runs similarity search against member_profiles,
// inserts top 3 matches, and creates notifications for the asker.
//
// Deploy: supabase functions deploy embed-ask
// Webhook: Configure in Supabase dashboard to fire on asks changes.

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const OPENAI_API_URL = 'https://api.openai.com/v1/embeddings';
const EMBEDDING_MODEL = 'text-embedding-3-small';
const EMBEDDING_DIMENSIONS = 1536;

interface AskRecord {
  id: string;
  member_id: string;
  body: string;
  visibility: string;
  geography_filter: string[];
  embedding: string | null;
}

interface WebhookPayload {
  type: 'INSERT' | 'UPDATE';
  table: string;
  record: AskRecord;
  old_record: AskRecord | null;
}

Deno.serve(async (req: Request) => {
  try {
    const payload: WebhookPayload = await req.json();
    const { record, old_record } = payload;

    // Guard: skip if body unchanged (prevents infinite loop from embedding write-back)
    if (payload.type === 'UPDATE' && old_record && old_record.body === record.body) {
      return new Response(JSON.stringify({ message: 'Body unchanged, skipping' }), { status: 200 });
    }

    if (!record.body?.trim()) {
      return new Response(JSON.stringify({ message: 'No body to embed' }), { status: 200 });
    }

    // 1. Embed the ask body
    const openaiKey = Deno.env.get('OPENAI_API_KEY');
    if (!openaiKey) {
      return new Response(JSON.stringify({ error: 'OPENAI_API_KEY not set' }), { status: 500 });
    }

    const embeddingResponse = await fetch(OPENAI_API_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${openaiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: EMBEDDING_MODEL,
        input: record.body,
        dimensions: EMBEDDING_DIMENSIONS,
      }),
    });

    if (!embeddingResponse.ok) {
      const errorText = await embeddingResponse.text();
      console.error('OpenAI API error:', errorText);
      return new Response(JSON.stringify({ error: 'Embedding API failed' }), { status: 500 });
    }

    const embeddingData = await embeddingResponse.json();
    const embedding = embeddingData.data?.[0]?.embedding;
    if (!embedding) {
      return new Response(JSON.stringify({ error: 'No embedding in response' }), { status: 500 });
    }

    // 2. Write embedding back to asks
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    await supabase
      .from('asks')
      .update({ embedding: JSON.stringify(embedding) })
      .eq('id', record.id);

    // 3. Get asker's organization ID
    const { data: member } = await supabase
      .from('members')
      .select('organization_id')
      .eq('id', record.member_id)
      .single();

    if (!member) {
      return new Response(JSON.stringify({ error: 'Member not found' }), { status: 500 });
    }

    // 4. Run similarity search against member_profiles
    const { data: results } = await supabase.rpc('search_members', {
      query_embedding: JSON.stringify(embedding),
      search_org_id: member.organization_id,
      geo_filter: record.geography_filter.length > 0 ? record.geography_filter : null,
      match_limit: 3,
    });

    if (!results || results.length === 0) {
      return new Response(JSON.stringify({ message: 'No matches found', ask_id: record.id }), {
        status: 200,
      });
    }

    // 5. Insert matches
    const matchRows = results.map(
      (r: { member_id: string; match_score: number; company_name: string; tagline: string }) => ({
        ask_id: record.id,
        matched_member_id: r.member_id,
        match_score: r.match_score,
        match_reason: `${r.company_name} — ${r.tagline}`,
        notified_at: new Date().toISOString(),
      }),
    );

    const { error: matchError } = await supabase.from('matches').insert(matchRows);
    if (matchError) {
      console.error('Failed to insert matches:', matchError.message);
    }

    return new Response(
      JSON.stringify({
        message: 'Ask embedded and matched',
        ask_id: record.id,
        match_count: results.length,
      }),
      { status: 200 },
    );
  } catch (err) {
    console.error('embed-ask error:', err);
    return new Response(JSON.stringify({ error: 'Internal error' }), { status: 500 });
  }
});
