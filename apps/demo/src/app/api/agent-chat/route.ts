import { NextRequest, NextResponse } from 'next/server';
import { fetchShopifyProducts, type DemoProductResult, type DemoProtocol } from '../_shopify';

type ChatMessage = { role: 'user' | 'assistant'; content: string };

type AgentChatBody = {
  message?: string;
  history?: ChatMessage[];
  protocol?: DemoProtocol;
  store?: string;
};

function buildFallbackReply(query: string, products: DemoProductResult[]): string {
  if (products.length === 0) {
    return `I could not find live Shopify products for "${query}". Try another description like "black oversized tee" or "graphic cotton t-shirt".`;
  }

  const names = products.slice(0, 3).map((p) => p.title).join(', ');
  return `I found ${products.length} live matches for "${query}". Top picks: ${names}. You can click any product card to view details.`;
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as AgentChatBody;
    const message = body.message?.trim();
    const protocol: DemoProtocol = body.protocol === 'acp' ? 'acp' : 'ucp';
    const store = body.store;

    if (!message) {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 });
    }

    const products = await fetchShopifyProducts(message, 8, { protocol, store });
    const reply = buildFallbackReply(message, products);

    return NextResponse.json({
      reply,
      products,
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to process chat request' },
      { status: 500 }
    );
  }
}
