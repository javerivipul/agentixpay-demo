'use client';

import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';

interface UseProductsParams {
  apiKey: string;
  query?: string;
  category?: string;
  minPrice?: number;
  maxPrice?: number;
  limit?: number;
  offset?: number;
}

export function useProducts({ apiKey, query, category, minPrice, maxPrice, limit, offset }: UseProductsParams) {
  return useQuery({
    queryKey: ['products', apiKey, { query, category, minPrice, maxPrice, limit, offset }],
    queryFn: () =>
      api.products.list(apiKey, {
        query,
        category,
        min_price: minPrice,
        max_price: maxPrice,
        limit,
        offset,
      }),
    enabled: !!apiKey,
  });
}
