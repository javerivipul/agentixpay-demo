import { NextRequest, NextResponse } from 'next/server';

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
  }>;
};

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

async function searchOffers(token: string, catalogId: string, query: string): Promise<ShopifyOffer[]> {
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
          limit: 10,
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

function toDemoProduct(offer: ShopifyOffer, index: number) {
  const variant = offer.variants?.[0] || {};
  const offerImage = offer.media?.[0]?.url;
  const variantImage = variant.media?.[0]?.url;
  const imageUrl = offerImage || variantImage || '';
  const priceAmount = typeof variant.price?.amount === 'number' ? variant.price.amount : 0;

  const category = offer.attributes?.find((attr) => attr.name?.toLowerCase() === 'product type')?.values?.[0] || 'T-Shirts';

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
  };
}

export async function GET(request: NextRequest) {
  try {
    const clientId = process.env.SHOPIFY_CLIENT_ID;
    const clientSecret = process.env.SHOPIFY_CLIENT_SECRET;
    const catalogId = process.env.CATALOG_ID;

    if (!clientId || !clientSecret || !catalogId) {
      return NextResponse.json({ products: [], total: 0, error: 'Missing Shopify env vars' }, { status: 500 });
    }

    const query = request.nextUrl.searchParams.get('query') || '';
    const limit = Math.min(Number(request.nextUrl.searchParams.get('limit') || '20'), 50);

    const token = await getShopifyToken(clientId, clientSecret);
    const queries = query
      ? [query]
      : ['t-shirt', 'graphic tee', 'white tshirt', 'black t-shirt', 'oversized tee'];

    const offersById = new Map<string, ShopifyOffer>();
    for (const q of queries) {
      if (offersById.size >= limit) {
        break;
      }
      const offers = await searchOffers(token, catalogId, q);
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

    const products = Array.from(offersById.values())
      .map((offer, index) => toDemoProduct(offer, index))
      .filter((p) => p.images[0]?.url)
      .slice(0, limit);

    return NextResponse.json({
      products,
      total: products.length,
      limit,
      offset: 0,
      has_more: false,
    });
  } catch (error) {
    return NextResponse.json(
      { products: [], total: 0, error: error instanceof Error ? error.message : 'Shopify fetch failed' },
      { status: 500 }
    );
  }
}
