import { z } from 'zod';

export const acpProductsQuerySchema = z.object({
  query: z.string().optional(),
  category: z.string().optional(),
  min_price: z.coerce.number().int().min(0).optional(),
  max_price: z.coerce.number().int().min(0).optional(),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  offset: z.coerce.number().int().min(0).default(0),
});

export type ACPProductsQueryInput = z.infer<typeof acpProductsQuerySchema>;
