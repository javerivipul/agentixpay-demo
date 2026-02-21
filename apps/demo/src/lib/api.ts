const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
const API_KEY = process.env.NEXT_PUBLIC_DEMO_API_KEY || 'demo_key';

async function apiFetch(path: string, init?: RequestInit) {
  const res = await fetch(`${API_BASE}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      'X-API-Key': API_KEY,
      ...init?.headers,
    },
  });
  return res.json();
}

export async function getProducts(query?: string) {
  const params = new URLSearchParams();
  if (query) params.set('query', query);
  params.set('limit', '20');
  const res = await fetch(`/api/shopify-products?${params.toString()}`, {
    method: 'GET',
    cache: 'no-store',
  });
  return res.json();
}

export async function createCheckout(items: Array<{ id?: string; sku?: string; quantity: number }>) {
  return apiFetch('/acp/v1/checkouts', {
    method: 'POST',
    body: JSON.stringify({ items }),
  });
}

export async function updateCheckout(id: string, data: Record<string, unknown>) {
  return apiFetch(`/acp/v1/checkouts/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

export async function completeCheckout(id: string, token: string) {
  return apiFetch(`/acp/v1/checkouts/${id}/complete`, {
    method: 'POST',
    body: JSON.stringify({
      payment_token: { type: 'stripe_spt', token },
    }),
  });
}

export async function getCheckout(id: string) {
  return apiFetch(`/acp/v1/checkouts/${id}`);
}
