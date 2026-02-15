const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public code?: string,
    public details?: unknown,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const url = `${API_URL}${path}`;

  const res = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });

  if (res.status === 204) {
    return undefined as T;
  }

  const body = await res.json();

  if (!res.ok) {
    throw new ApiError(
      body?.error?.message || res.statusText,
      res.status,
      body?.error?.code,
      body?.error?.details,
    );
  }

  return body;
}

// ── Tenant endpoints ────────────────────────────────────────

export interface CreateTenantPayload {
  name: string;
  email: string;
  companyName?: string;
  platform: string;
}

export interface UpdateTenantPayload {
  name?: string;
  companyName?: string;
  platform?: string;
  platformConfig?: unknown;
  settings?: Record<string, unknown>;
  status?: string;
}

export const api = {
  // Health
  health: () => request<{ status: string; database: string; redis: string }>('/api/health'),

  // Tenants
  tenants: {
    create: (data: CreateTenantPayload) =>
      request<{ success: boolean; data: { tenant: Record<string, unknown>; credentials: { apiKey: string; apiSecret: string } } }>(
        '/api/tenants',
        { method: 'POST', body: JSON.stringify(data) },
      ),

    list: (params?: { limit?: number; offset?: number }) => {
      const qs = new URLSearchParams();
      if (params?.limit) qs.set('limit', String(params.limit));
      if (params?.offset) qs.set('offset', String(params.offset));
      const query = qs.toString() ? `?${qs.toString()}` : '';
      return request<{ success: boolean; data: Record<string, unknown>[]; total: number; limit: number; offset: number; hasMore: boolean }>(
        `/api/tenants${query}`,
      );
    },

    get: (id: string) =>
      request<{ success: boolean; data: Record<string, unknown> }>(`/api/tenants/${id}`),

    update: (id: string, data: UpdateTenantPayload) =>
      request<{ success: boolean; data: Record<string, unknown> }>(
        `/api/tenants/${id}`,
        { method: 'PATCH', body: JSON.stringify(data) },
      ),

    delete: (id: string) =>
      request<void>(`/api/tenants/${id}`, { method: 'DELETE' }),
  },

  // Products (ACP - requires API key)
  products: {
    list: (apiKey: string, params?: { query?: string; category?: string; min_price?: number; max_price?: number; limit?: number; offset?: number }) => {
      const qs = new URLSearchParams();
      if (params?.query) qs.set('query', params.query);
      if (params?.category) qs.set('category', params.category);
      if (params?.min_price) qs.set('min_price', String(params.min_price));
      if (params?.max_price) qs.set('max_price', String(params.max_price));
      if (params?.limit) qs.set('limit', String(params.limit));
      if (params?.offset) qs.set('offset', String(params.offset));
      const query = qs.toString() ? `?${qs.toString()}` : '';
      return request<{ products: Record<string, unknown>[]; total: number; limit: number; offset: number; has_more: boolean }>(
        `/acp/v1/products${query}`,
        { headers: { 'X-API-Key': apiKey } },
      );
    },
  },

  // Orders (via tenant management - read from API)
  orders: {
    list: (apiKey: string, params?: { limit?: number; offset?: number }) => {
      const qs = new URLSearchParams();
      if (params?.limit) qs.set('limit', String(params.limit));
      if (params?.offset) qs.set('offset', String(params.offset));
      const query = qs.toString() ? `?${qs.toString()}` : '';
      return request<{ products: Record<string, unknown>[]; total: number }>(
        `/acp/v1/products${query}`,
        { headers: { 'X-API-Key': apiKey } },
      );
    },
  },
};
