const SHOPIFY_AUTH_URL = 'https://api.shopify.com/auth/access_token';
const SHOPIFY_DISCOVERY_URL = 'https://discover.shopifyapps.com/global/mcp';

type ShopifyOffer = {
  id?: string;
  title?: string;
  description?: string;
  media?: Array<{ url?: string }>;
  attributes?: Array<{ name?: string; values?: string[] }>;
  variants?: Array<{
    id?: string;
    sku?: string;
    price?: { amount?: number; currency?: string };
    media?: Array<{ url?: string }>;
    shop?: { name?: string; onlineStoreUrl?: string };
    variantUrl?: string;
    checkoutUrl?: string;
  }>;
};

export interface DemoProductResult {
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

interface PriceRange {
  minCents?: number;
  maxCents?: number;
}

function dollarsToCents(value: string): number {
  const parsed = Number.parseFloat(value);
  if (!Number.isFinite(parsed) || parsed < 0) {
    return 0;
  }
  return Math.round(parsed * 100);
}

function extractPriceRange(query: string): PriceRange | null {
  const normalized = query.toLowerCase();

  const betweenMatch = normalized.match(/between\s*\$?(\d+(?:\.\d+)?)\s*(?:and|to)\s*\$?(\d+(?:\.\d+)?)/i);
  if (betweenMatch) {
    const a = dollarsToCents(betweenMatch[1] || '0');
    const b = dollarsToCents(betweenMatch[2] || '0');
    return { minCents: Math.min(a, b), maxCents: Math.max(a, b) };
  }

  const underMatch = normalized.match(/(?:under|below|less than|max(?:imum)?|at most)\s*\$?(\d+(?:\.\d+)?)/i);
  if (underMatch) {
    return { maxCents: dollarsToCents(underMatch[1] || '0') };
  }

  const overMatch = normalized.match(/(?:over|above|more than|at least|min(?:imum)?)\s*\$?(\d+(?:\.\d+)?)/i);
  if (overMatch) {
    return { minCents: dollarsToCents(overMatch[1] || '0') };
  }

  return null;
}

function applyPriceFilter(products: DemoProductResult[], range: PriceRange | null): DemoProductResult[] {
  if (!range) {
    return products;
  }

  return products.filter((product) => {
    if (typeof range.minCents === 'number' && product.price < range.minCents) {
      return false;
    }
    if (typeof range.maxCents === 'number' && product.price > range.maxCents) {
      return false;
    }
    return true;
  });
}

function sanitizeSearchQuery(query: string): string {
  return query
    .replace(/between\s*\$?\d+(?:\.\d+)?\s*(?:and|to)\s*\$?\d+(?:\.\d+)?/gi, '')
    .replace(/(?:under|below|less than|max(?:imum)?|at most|over|above|more than|at least|min(?:imum)?)\s*\$?\d+(?:\.\d+)?/gi, '')
    .replace(/\s+/g, ' ')
    .trim();
}

async function getShopifyToken(clientId: string, clientSecret: string): Promise<string> {
  const response = await fetch(SHOPIFY_AUTH_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      client_id: clientId,
      client_secret: clientSecret,
      grant_type: 'client_credentials',
    }),
    cache: 'no-store',
  });

  if (!response.ok) {
    throw new Error(`Shopify auth failed: ${response.status}`);
  }

  const payload = (await response.json()) as { access_token?: string };
  if (!payload.access_token) {
    throw new Error('Shopify auth response missing access_token');
  }
  return payload.access_token;
}

async function searchOffers(token: string, catalogId: string, query: string, limit: number): Promise<ShopifyOffer[]> {
  const response = await fetch(SHOPIFY_DISCOVERY_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      jsonrpc: '2.0',
      method: 'tools/call',
      id: 1,
      params: {
        name: 'search_global_products',
        arguments: {
          query,
          saved_catalog: catalogId,
          limit,
          context: `Looking for ${query}`,
        },
      },
    }),
    cache: 'no-store',
  });

  if (!response.ok) {
    return [];
  }

  const payload = (await response.json()) as {
    result?: { isError?: boolean; content?: Array<{ text?: string }> };
  };

  if (payload.result?.isError) {
    return [];
  }

  const content = payload.result?.content?.[0]?.text;
  if (!content) {
    return [];
  }

  const parsed = JSON.parse(content) as { offers?: ShopifyOffer[] };
  return parsed.offers || [];
}

function toDemoProduct(offer: ShopifyOffer, index: number): DemoProductResult {
  const variant = offer.variants?.[0] || {};
  const offerImage = offer.media?.[0]?.url;
  const variantImage = variant.media?.[0]?.url;
  const imageUrl = offerImage || variantImage || '';
  const priceAmount = typeof variant.price?.amount === 'number' ? variant.price.amount : 0;
  const shopUrl = variant.shop?.onlineStoreUrl || '';
  const shopDomain = shopUrl.replace(/^https?:\/\//, '').split('/')[0] || undefined;

  const category =
    offer.attributes?.find((attr) => attr.name?.toLowerCase() === 'product type')?.values?.[0] || 'T-Shirts';

  return {
    id: offer.id || variant.id || `shopify_${index + 1}`,
    sku: variant.sku || `SHOPIFY-${String(index + 1).padStart(3, '0')}`,
    title: offer.title || 'Shopify Product',
    description: offer.description || 'Live product from Shopify',
    price: Math.max(1, Math.round(priceAmount)),
    currency: (variant.price?.currency || 'USD').toLowerCase(),
    images: [{ url: imageUrl, alt: offer.title || 'Shopify Product' }],
    inventory: { quantity: 100, status: 'in_stock' },
    category,
    product_url: variant.variantUrl || variant.checkoutUrl || undefined,
    shop_name: variant.shop?.name,
    shop_domain: shopDomain,
  };
}

export async function fetchShopifyProducts(query: string, limit: number): Promise<DemoProductResult[]> {
  const clientId = process.env.SHOPIFY_CLIENT_ID;
  const clientSecret = process.env.SHOPIFY_CLIENT_SECRET;
  const catalogId = process.env.CATALOG_ID;

  if (!clientId || !clientSecret || !catalogId) {
    throw new Error('Missing Shopify env vars');
  }

  const token = await getShopifyToken(clientId, clientSecret);
  const baseQuery = sanitizeSearchQuery(query) || query;
  const queries = query
    ? [baseQuery]
    : ['t-shirt', 'graphic tee', 'white tshirt', 'black t-shirt', 'oversized tee'];

  const offersById = new Map<string, ShopifyOffer>();
  for (const q of queries) {
    if (offersById.size >= limit) {
      break;
    }
    const offers = await searchOffers(token, catalogId, q, Math.min(10, limit));
    for (const offer of offers) {
      if (!offer.id || offersById.has(offer.id)) {
        continue;
      }
      offersById.set(offer.id, offer);
      if (offersById.size >= limit) {
        break;
      }
    }
  }

  const mapped = Array.from(offersById.values())
    .map((offer, index) => toDemoProduct(offer, index))
    .filter((product) => Boolean(product.images[0]?.url));

  const filteredByPrice = applyPriceFilter(mapped, extractPriceRange(query));

  return filteredByPrice.slice(0, limit);
}
