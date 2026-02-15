'use client';

import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';

interface UseOrdersParams {
  apiKey: string;
  limit?: number;
  offset?: number;
}

export function useOrders({ apiKey, limit, offset }: UseOrdersParams) {
  return useQuery({
    queryKey: ['orders', apiKey, { limit, offset }],
    queryFn: () => api.orders.list(apiKey, { limit, offset }),
    enabled: !!apiKey,
  });
}
