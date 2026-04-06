import { z } from 'zod';

export const SearchQuerySchema = z.object({
  query: z.string().min(10, 'Describe what you need in at least 10 characters'),
  countryFilter: z.string().optional(),
});

export type SearchQueryInput = z.infer<typeof SearchQuerySchema>;
