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

export type DemoProtocol = 'acp' | 'ucp';

function parseStoreList(raw: string | undefined): string[] {
  return (raw || '')
    .split(',')
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean)
    .map((s) => s.replace(/^https?:\/\//, '').replace(/\/$/, ''))
    .filter((s) => s.includes('.'));
}

function enabledStoresForProtocol(protocol: DemoProtocol): string[] {
  if (protocol === 'acp') {
    return parseStoreList(process.env.ACP_ENABLED_STORES);
  }
  return parseStoreList(process.env.UCP_ENABLED_STORES);
}

function stripHtml(html: string): string {
  return String(html || '')
    .replace(/<[^>]*>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function matchesText(haystack: string, needle: string): boolean {
  if (!needle) {
    return true;
  }
  return haystack.toLowerCase().includes(needle.toLowerCase());
}

type StorefrontProduct = {
  id?: number;
  title?: string;
  handle?: string;
  body_html?: string;
  vendor?: string;
  product_type?: string;
  tags?: string | string[];
  images?: Array<{ src?: string }>;
  variants?: Array<{
    id?: number;
    sku?: string;
    price?: string;
    available?: boolean;
  }>;
};

async function fetchStorefrontProducts(domain: string, desiredCount: number): Promise<StorefrontProduct[]> {
  const results: StorefrontProduct[] = [];
  const perPage = 250;

  for (let page = 1; page <= 10; page += 1) {
    const url = `https://${domain}/products.json?limit=${perPage}&page=${page}`;
    const res = await fetch(url, {
      method: 'GET',
      headers: { accept: 'application/json', 'user-agent': 'agentixpay-demo' },
      cache: 'no-store',
    });

    if (!res.ok) {
      break;
    }

    const payload = (await res.json()) as { products?: StorefrontProduct[] };
    const products = payload.products || [];
    if (products.length === 0) {
      break;
    }

    results.push(...products);
    if (results.length >= desiredCount) {
      break;
    }
  }

  return results;
}

function storefrontToDemoProduct(domain: string, product: StorefrontProduct, index: number): DemoProductResult | null {
  const variant = product.variants?.[0];
  if (!variant) {
    return null;
  }

  const title = product.title || 'Shopify Product';
  const handle = product.handle || '';
  const imageUrl = product.images?.[0]?.src || '';

  const priceDollars = variant.price ? Number.parseFloat(variant.price) : 0;
  const priceCents = Number.isFinite(priceDollars) ? Math.round(priceDollars * 100) : 0;

  const description = product.body_html ? stripHtml(product.body_html) : '';
  const tags = Array.isArray(product.tags) ? product.tags.join(',') : String(product.tags || '');
  const sku = variant.sku || `STORE-${domain}-${String(index + 1).padStart(3, '0')}`;

  const productUrl = handle ? `https://${domain}/products/${handle}` : `https://${domain}`;

  return {
    id: `${domain}:${variant.id || product.id || index}`,
    sku,
    title,
    description: description || `From ${domain}`,
    price: Math.max(1, priceCents),
    currency: 'usd',
    images: [{ url: imageUrl, alt: title }],
    inventory: { quantity: 100, status: variant.available ? 'in_stock' : 'out_of_stock' },
    category: product.product_type || undefined,
    product_url: productUrl,
    shop_name: product.vendor || domain,
    shop_domain: domain,
  };
}

async function fetchProductsFromStore(domain: string, query: string, limit: number): Promise<DemoProductResult[]> {
  const range = extractPriceRange(query);
  const q = sanitizeSearchQuery(query);
  const desiredCount = Math.max(limit * 6, 80);

  const products = await fetchStorefrontProducts(domain, desiredCount);
  const mapped = products
    .filter((p) => {
      if (!q) {
        return true;
      }
      const hay = `${p.title || ''} ${p.handle || ''} ${stripHtml(p.body_html || '')} ${p.vendor || ''} ${p.product_type || ''} ${Array.isArray(p.tags) ? p.tags.join(',') : String(p.tags || '')}`;
      return matchesText(hay, q);
    })
    .map((p, idx) => storefrontToDemoProduct(domain, p, idx))
    .filter((p): p is DemoProductResult => Boolean(p && p.images[0]?.url));

  return applyPriceFilter(mapped, range).slice(0, limit);
}

async function fetchProductsFromEnabledStores(protocol: DemoProtocol, store: string, query: string, limit: number): Promise<DemoProductResult[]> {
  const stores = enabledStoresForProtocol(protocol);
  const normalizedStore = store.trim().toLowerCase().replace(/^https?:\/\//, '').replace(/\/$/, '');

  if (!stores.includes(normalizedStore)) {
    return [];
  }

  try {
    return await fetchProductsFromStore(normalizedStore, query, limit);
  } catch (error) {
    console.error(`[shopify-store] failed fetching from ${normalizedStore}:`, error);
    return [];
  }
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

export async function fetchShopifyProducts(
  query: string,
  limit: number,
  opts?: { protocol?: DemoProtocol; store?: string }
): Promise<DemoProductResult[]> {
  const protocol: DemoProtocol = opts?.protocol === 'acp' ? 'acp' : 'ucp';
  const store = opts?.store;

  // If stores are configured for this protocol and a store was selected, fetch only from that store.
  const enabled = enabledStoresForProtocol(protocol);
  if (enabled.length > 0 && store) {
    const storeProducts = await fetchProductsFromEnabledStores(protocol, store, query, limit);
    return storeProducts;
  }

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
