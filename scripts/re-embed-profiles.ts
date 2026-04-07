/**
 * One-time script to generate real OpenAI embeddings for all member profiles.
 * Run: npx tsx scripts/re-embed-profiles.ts
 *
 * Requires: OPENAI_API_KEY, NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY in .env.local
 */

import { config } from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import OpenAI from 'openai';

config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const openaiKey = process.env.OPENAI_API_KEY!;

if (!supabaseUrl || !supabaseKey || !openaiKey) {
  console.error(
    'Missing env vars. Need NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, OPENAI_API_KEY',
  );
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);
const openai = new OpenAI({ apiKey: openaiKey });

async function embedText(text: string): Promise<number[]> {
  const response = await openai.embeddings.create({
    model: 'text-embedding-3-small',
    input: text,
    dimensions: 1536,
  });
  return response.data[0].embedding;
}

async function main() {
  // Fetch all profiles
  const { data: profiles, error } = await supabase
    .from('member_profiles')
    .select(
      'id, member_id, tagline, bio, what_i_do, who_i_serve, results_i_deliver, clients_served',
    );

  if (error || !profiles) {
    console.error('Failed to fetch profiles:', error?.message);
    process.exit(1);
  }

  console.log(`Found ${profiles.length} profiles to embed`);

  let success = 0;
  let failed = 0;

  for (const profile of profiles) {
    // Compose embedding text per ECOSYSTEM.md spec
    const text = [
      profile.tagline,
      profile.bio,
      profile.what_i_do,
      profile.who_i_serve,
      profile.results_i_deliver,
      (profile.clients_served || []).join(', '),
    ]
      .filter(Boolean)
      .join('\n');

    if (!text.trim()) {
      console.log(`  Skipping ${profile.member_id} — no text`);
      continue;
    }

    try {
      const embedding = await embedText(text);

      const { error: updateError } = await supabase
        .from('member_profiles')
        .update({
          embedding: JSON.stringify(embedding),
          embedding_updated_at: new Date().toISOString(),
        })
        .eq('id', profile.id);

      if (updateError) {
        console.error(`  Failed ${profile.member_id}: ${updateError.message}`);
        failed++;
      } else {
        success++;
        process.stdout.write(`\r  Embedded ${success}/${profiles.length}`);
      }

      // Rate limit: ~3 requests per second to stay under OpenAI limits
      await new Promise((resolve) => setTimeout(resolve, 350));
    } catch (err) {
      console.error(`\n  Error embedding ${profile.member_id}:`, err);
      failed++;
    }
  }

  console.log(
    `\n\nDone. ${success} succeeded, ${failed} failed out of ${profiles.length} profiles.`,
  );
}

main();
