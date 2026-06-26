import { z } from 'zod';

/**
 * Zod schema for semantic search requests.
 * Ensures query is non-empty and topK is within safe bounds.
 */
export const searchSchema = z.object({
  query: z
    .string({ message: 'Search query is required' })
    .min(1, 'Search query must not be empty')
    .max(1000, 'Search query must not exceed 1000 characters')
    .trim(),
  topK: z
    .number()
    .int('topK must be a whole number')
    .min(1, 'topK must be at least 1')
    .max(50, 'topK must not exceed 50')
    .optional()
    .default(10),
});

export type SearchInput = z.infer<typeof searchSchema>;
