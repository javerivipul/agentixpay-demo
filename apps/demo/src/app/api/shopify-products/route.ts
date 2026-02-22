import { NextRequest, NextResponse } from 'next/server';
import { fetchShopifyProducts, type DemoProtocol } from '../_shopify';

export async function GET(request: NextRequest) {
  try {
    const query = request.nextUrl.searchParams.get('query') || '';
    const limit = Math.min(Number(request.nextUrl.searchParams.get('limit') || '20'), 50);
    const protocol = (request.nextUrl.searchParams.get('protocol') || 'ucp') as DemoProtocol;
    const store = request.nextUrl.searchParams.get('store') || undefined;
    const products = await fetchShopifyProducts(query, limit, { protocol, store });

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
