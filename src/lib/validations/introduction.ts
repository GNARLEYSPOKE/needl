import { z } from 'zod';

// Transform empty strings to undefined so .uuid().optional() doesn't reject them
const optionalUuid = z
  .string()
  .transform((v) => (v === '' ? undefined : v))
  .pipe(z.string().uuid().optional());

export const RequestIntroSchema = z.object({
  targetMemberId: z.string().min(1, 'Invalid target member'),
  message: z.string().min(10, 'Write at least 10 characters'),
  askId: optionalUuid,
  matchId: optionalUuid,
});

export const RespondIntroSchema = z.object({
  introductionId: z.string().uuid(),
  response: z.enum(['accepted', 'declined', 'suggested_alternative']),
  note: z.string().optional(),
  alternativeMemberId: z.string().uuid().optional(),
});

export type RequestIntroInput = z.infer<typeof RequestIntroSchema>;
export type RespondIntroInput = z.infer<typeof RespondIntroSchema>;
