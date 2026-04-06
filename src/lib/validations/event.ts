import { z } from 'zod';

export const CreateEventSchema = z.object({
  chapterId: z.string().min(1),
  title: z.string().min(3, 'Title is required'),
  format: z.enum(['in_person', 'virtual', 'hybrid']),
  location: z.string().optional(),
  scheduledAt: z.string().min(1, 'Date and time required'),
  durationMinutes: z.number().min(15).max(480).default(90),
});

export type CreateEventInput = z.infer<typeof CreateEventSchema>;
