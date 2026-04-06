'use server';

import { auth } from '@clerk/nextjs/server';
import { createAnthropicAIService } from '@/lib/services/ai';
import type { ProfileDraft, ProfileDraftParams } from '@/lib/services/ai';

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
