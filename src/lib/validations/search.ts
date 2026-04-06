import { z } from 'zod';

export const SearchQuerySchema = z.object({
  query: z.string().min(3, 'Enter at least 3 characters'),
  countryFilter: z.string().optional(),
});

export type SearchQueryInput = z.infer<typeof SearchQuerySchema>;
