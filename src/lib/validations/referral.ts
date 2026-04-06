import { z } from 'zod';

export const LogReferralSchema = z.object({
  receivingMemberId: z.string().min(1, 'Select a receiving member'),
  referredContactName: z.string().min(2, 'Contact name is required'),
  referredContactEmail: z.string().email().optional().or(z.literal('')),
  notes: z.string().optional(),
  estimatedValue: z.number().positive().optional(),
});

export type LogReferralInput = z.infer<typeof LogReferralSchema>;
