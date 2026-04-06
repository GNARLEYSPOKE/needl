import { z } from 'zod';

export const InviteVisitorSchema = z.object({
  eventId: z.string().min(1),
  visitorName: z.string().min(2, 'Visitor name is required'),
  visitorEmail: z.string().email('Valid email required'),
  visitorCompany: z.string().optional(),
  visitorRole: z.string().optional(),
});

export const RsvpSchema = z.object({
  token: z.string().min(1),
  response: z.enum(['confirmed', 'declined']),
});

export type InviteVisitorInput = z.infer<typeof InviteVisitorSchema>;
export type RsvpInput = z.infer<typeof RsvpSchema>;
