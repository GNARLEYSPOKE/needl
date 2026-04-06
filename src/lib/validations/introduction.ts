import { z } from 'zod';

export const RequestIntroSchema = z.object({
  targetMemberId: z.string().min(1, 'Invalid target member'),
  message: z.string().min(10, 'Write at least 10 characters'),
  askId: z.string().nullish(),
  matchId: z.string().nullish(),
});

export const RespondIntroSchema = z.object({
  introductionId: z.string().min(1),
  response: z.enum(['accepted', 'declined', 'suggested_alternative']),
  note: z.string().optional(),
  alternativeMemberId: z.string().optional(),
});

export type RequestIntroInput = z.infer<typeof RequestIntroSchema>;
export type RespondIntroInput = z.infer<typeof RespondIntroSchema>;
