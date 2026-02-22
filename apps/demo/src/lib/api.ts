const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
const API_KEY = process.env.NEXT_PUBLIC_DEMO_API_KEY || 'demo_key';

export interface DemoProduct {
  id: string;
  sku: string;
  title: string;
  description: string;
  price: number;
  currency: string;
  images: Array<{ url: string; alt?: string }>;
  inventory: { quantity: number; status: string };
  category?: string;
  product_url?: string;
  shop_name?: string;
  shop_domain?: string;
}

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

export async function sendAgentChat(
  message: string,
  history: Array<{ role: 'user' | 'assistant'; content: string }>,
  opts?: { protocol?: 'acp' | 'ucp'; store?: string }
): Promise<{ reply: string; products: DemoProduct[] }> {
  const res = await fetch('/api/agent-chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message, history, protocol: opts?.protocol, store: opts?.store }),
    cache: 'no-store',
  });

  if (!res.ok) {
    const contentType = res.headers.get('content-type') || '';
    if (contentType.includes('application/json')) {
      const errorBody = (await res.json().catch(() => ({}))) as { error?: string };
      throw new Error(errorBody.error || `Agent chat failed (${res.status})`);
    }

    const text = await res.text().catch(() => '');
    throw new Error(`Agent chat failed (${res.status}): ${text.slice(0, 140) || res.statusText}`);
  }

  const okContentType = res.headers.get('content-type') || '';
  if (!okContentType.includes('application/json')) {
    const text = await res.text().catch(() => '');
    throw new Error(`Agent chat returned non-JSON response: ${text.slice(0, 140)}`);
  }

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
