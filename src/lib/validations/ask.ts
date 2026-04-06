import { z } from 'zod';

export const CreateAskSchema = z.object({
  body: z.string().min(20, 'Describe what you need in at least 20 characters').max(500),
  visibility: z.enum(['chapter', 'network']),
});

export type CreateAskInput = z.infer<typeof CreateAskSchema>;
