import { z } from 'zod';

export const RequestIntroSchema = z.object({
  targetMemberId: z.string().uuid('Invalid target member'),
  message: z.string().min(10, 'Write at least 10 characters'),
  askId: z.string().uuid().optional(),
  matchId: z.string().uuid().optional(),
});

export const RespondIntroSchema = z.object({
  introductionId: z.string().uuid(),
  response: z.enum(['accepted', 'declined', 'suggested_alternative']),
  note: z.string().optional(),
  alternativeMemberId: z.string().uuid().optional(),
});

export type RequestIntroInput = z.infer<typeof RequestIntroSchema>;
export type RespondIntroInput = z.infer<typeof RespondIntroSchema>;
