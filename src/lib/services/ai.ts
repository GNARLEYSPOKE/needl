import Anthropic from '@anthropic-ai/sdk';

const AI_MODEL = 'claude-sonnet-4-6-20250514';

export interface ProfileDraftParams {
  fullName: string;
  headline: string | null;
  summary: string | null;
  positions: Array<{
    title: string;
    company: string;
    description: string | null;
  }>;
}

export interface ProfileDraft {
  bio: string;
  whatIDo: string;
  whoIServe: string;
  resultsIDeliver: string;
  tagline: string;
}

export interface MatchReasonParams {
  askBody: string;
  memberProfile: {
    companyName: string;
    tagline: string;
    whatIDo: string;
    whoIServe: string;
    geographyServed: string[];
  };
}

export interface AskNudgeParams {
  askBody: string;
  createdAt: string;
}

export interface AIService {
  draftProfile(
    params: ProfileDraftParams,
  ): Promise<{ data: ProfileDraft | null; error: string | null }>;
  generateMatchReason(
    params: MatchReasonParams,
  ): Promise<{ data: string | null; error: string | null }>;
  generateAskNudge(params: AskNudgeParams): Promise<{ data: string | null; error: string | null }>;
  extractGeography(text: string): Promise<{ data: string[] | null; error: string | null }>;
}

export function createAnthropicAIService(apiKey: string): AIService {
  const client = new Anthropic({ apiKey });

  async function ask(
    systemPrompt: string,
    userMessage: string,
  ): Promise<{ text: string | null; error: string | null }> {
    try {
      const response = await client.messages.create({
        model: AI_MODEL,
        max_tokens: 1024,
        system: systemPrompt,
        messages: [{ role: 'user', content: userMessage }],
      });

      const textBlock = response.content.find((block) => block.type === 'text');
      if (!textBlock || textBlock.type !== 'text') {
        return { text: null, error: 'No text response from Claude' };
      }

      return { text: textBlock.text, error: null };
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown AI error';
      return { text: null, error: message };
    }
  }

  return {
    async draftProfile(
      params: ProfileDraftParams,
    ): Promise<{ data: ProfileDraft | null; error: string | null }> {
      const systemPrompt = `You are a professional profile writer for a business networking platform.
Given LinkedIn profile data, draft a compelling member profile. Return valid JSON with these fields:
- bio: 2-3 paragraphs about the person's professional story
- whatIDo: 1-2 sentences in plain language
- whoIServe: 1-2 sentences describing target clients
- resultsIDeliver: 1-2 sentences about outcomes, not features
- tagline: one compelling sentence

Write in first person. Be specific, not generic. No buzzwords.`;

      const userMessage = JSON.stringify(params);
      const { text, error } = await ask(systemPrompt, userMessage);
      if (error || !text) return { data: null, error: error ?? 'No response' };

      try {
        const parsed = JSON.parse(text) as ProfileDraft;
        return { data: parsed, error: null };
      } catch {
        return { data: null, error: 'Failed to parse profile draft response' };
      }
    },

    async generateMatchReason(
      params: MatchReasonParams,
    ): Promise<{ data: string | null; error: string | null }> {
      const systemPrompt = `You write one-sentence match explanations for a business networking platform.
Given a member's ask and another member's profile, explain why they're a good match.
Keep it under 30 words. Be specific — mention the company name and relevant expertise.`;

      const userMessage = `Ask: "${params.askBody}"
Profile: ${params.memberProfile.companyName} — ${params.memberProfile.tagline}
What they do: ${params.memberProfile.whatIDo}
Who they serve: ${params.memberProfile.whoIServe}
Geography: ${params.memberProfile.geographyServed.join(', ')}`;

      const { text, error } = await ask(systemPrompt, userMessage);
      if (error || !text) return { data: null, error: error ?? 'No response' };
      return { data: text.trim(), error: null };
    },

    async generateAskNudge(
      params: AskNudgeParams,
    ): Promise<{ data: string | null; error: string | null }> {
      const systemPrompt = `You help members of a business networking platform improve their standing asks.
Their ask has had zero matches for 30+ days. Suggest a brief, specific edit to broaden their reach.
One sentence only.`;

      const userMessage = `Ask posted on ${params.createdAt}: "${params.askBody}"`;
      const { text, error } = await ask(systemPrompt, userMessage);
      if (error || !text) return { data: null, error: error ?? 'No response' };
      return { data: text.trim(), error: null };
    },

    async extractGeography(text: string): Promise<{ data: string[] | null; error: string | null }> {
      const systemPrompt = `Extract geographic references from the text. Return a JSON array of strings.
Include countries, provinces/states, and cities mentioned. If none found, return an empty array.
Examples: ["Canada", "Ontario", "Toronto"] or ["United States", "California"]`;

      const { text: responseText, error } = await ask(systemPrompt, text);
      if (error || !responseText) return { data: null, error: error ?? 'No response' };

      try {
        const parsed = JSON.parse(responseText) as string[];
        return { data: parsed, error: null };
      } catch {
        return { data: null, error: 'Failed to parse geography extraction response' };
      }
    },
  };
}
