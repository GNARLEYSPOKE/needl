// Edge Function: embed-profile
// Triggered by database webhook on member_profiles INSERT/UPDATE.
// Combines profile text fields into an embedding document,
// calls OpenAI text-embedding-3-small, and writes the embedding back.
//
// Deploy: supabase functions deploy embed-profile
// Webhook: Configure in Supabase dashboard to fire on member_profiles changes.

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const OPENAI_API_URL = 'https://api.openai.com/v1/embeddings';
const EMBEDDING_MODEL = 'text-embedding-3-small';
const EMBEDDING_DIMENSIONS = 1536;

interface WebhookPayload {
  type: 'INSERT' | 'UPDATE';
  table: string;
  record: {
    id: string;
    member_id: string;
    tagline: string;
    bio: string;
    what_i_do: string;
    who_i_serve: string;
    results_i_deliver: string;
    clients_served: string[];
  };
}

Deno.serve(async (req: Request) => {
  try {
    const payload: WebhookPayload = await req.json();
    const { record } = payload;

    // Compose embedding document per ECOSYSTEM.md spec
    const embeddingText = [
      record.tagline,
      record.bio,
      record.what_i_do,
      record.who_i_serve,
      record.results_i_deliver,
      (record.clients_served || []).join(', '),
    ]
      .filter(Boolean)
      .join('\n');

    if (!embeddingText.trim()) {
      return new Response(JSON.stringify({ message: 'No text to embed' }), { status: 200 });
    }

    // Call OpenAI embedding API
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
        input: embeddingText,
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

    // Write embedding back to member_profiles using service_role
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { error } = await supabase
      .from('member_profiles')
      .update({
        embedding: JSON.stringify(embedding),
        embedding_updated_at: new Date().toISOString(),
      })
      .eq('id', record.id);

    if (error) {
      console.error('Failed to write embedding:', error.message);
      return new Response(JSON.stringify({ error: error.message }), { status: 500 });
    }

    return new Response(
      JSON.stringify({ message: 'Embedding updated', member_id: record.member_id }),
      { status: 200 },
    );
  } catch (err) {
    console.error('embed-profile error:', err);
    return new Response(JSON.stringify({ error: 'Internal error' }), { status: 500 });
  }
});
