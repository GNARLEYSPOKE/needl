import OpenAI from 'openai';

const EMBEDDING_MODEL = 'text-embedding-3-small';
const EMBEDDING_DIMENSIONS = 1536;

export interface EmbeddingResult {
  embedding: number[];
}

export interface EmbeddingService {
  embed(text: string): Promise<{ data: EmbeddingResult | null; error: string | null }>;
}

export function createOpenAIEmbeddingService(apiKey: string): EmbeddingService {
  const client = new OpenAI({ apiKey });

  return {
    async embed(text: string): Promise<{ data: EmbeddingResult | null; error: string | null }> {
      try {
        const response = await client.embeddings.create({
          model: EMBEDDING_MODEL,
          input: text,
          dimensions: EMBEDDING_DIMENSIONS,
        });

        const embedding = response.data[0]?.embedding;
        if (!embedding) {
          return { data: null, error: 'No embedding returned from OpenAI' };
        }

        return { data: { embedding }, error: null };
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Unknown embedding error';
        return { data: null, error: message };
      }
    },
  };
}
