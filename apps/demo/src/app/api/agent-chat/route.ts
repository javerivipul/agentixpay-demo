import { NextRequest, NextResponse } from 'next/server';
import { fetchShopifyProducts, type DemoProductResult, type DemoProtocol } from '../_shopify';

type ChatMessage = { role: 'user' | 'assistant'; content: string };

type AgentChatBody = {
  message?: string;
  model?: string;
  history?: ChatMessage[];
  protocol?: DemoProtocol;
  store?: string;
};

const SUPPORTED_MODELS = [
  'none',
  'gemini-2.0-flash',
  'gemini-1.5-pro',
  'gpt-4o-mini',
  'gpt-4.1-mini',
] as const;

function normalizeModel(model: string | undefined): string {
  if (!model) {
    return 'none';
  }
  return SUPPORTED_MODELS.includes(model as (typeof SUPPORTED_MODELS)[number]) ? model : 'none';
}

async function callGeminiModel(model: string, message: string, products: DemoProductResult[]): Promise<string | null> {
  const apiKey = process.env.GOOGLE_API_KEY;
  if (!apiKey) {
    return null;
  }

  const productContext = products
    .slice(0, 5)
    .map((p, idx) => `${idx + 1}. ${p.title} - ${p.price / 100} ${p.currency.toUpperCase()}`)
    .join('\n');

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [
          {
            role: 'user',
            parts: [
              {
                text: `User query: ${message}\n\nProducts:\n${productContext}\n\nReply in a concise shopping-assistant tone and mention 2-4 best matches.`,
              },
            ],
          },
        ],
      }),
      cache: 'no-store',
    }
  );

  if (!response.ok) {
    return null;
  }

  const payload = (await response.json()) as {
    candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
  };
  return payload.candidates?.[0]?.content?.parts?.[0]?.text || null;
}

async function callOpenAIModel(model: string, message: string, products: DemoProductResult[]): Promise<string | null> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return null;
  }

  const response = await fetch('https://api.openai.com/v1/responses', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model,
      input: [
        {
          role: 'system',
          content:
            'You are a shopping assistant. Recommend products from provided data only. Keep response concise and practical.',
        },
        {
          role: 'user',
          content: JSON.stringify({
            query: message,
            products: products.slice(0, 5).map((p) => ({ title: p.title, price: p.price, currency: p.currency })),
          }),
        },
      ],
      temperature: 0.4,
    }),
  });

  if (!response.ok) {
    return null;
  }

  const payload = (await response.json()) as { output_text?: string };
  return payload.output_text || null;
}

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
    const model = normalizeModel(body.model);
    const protocol: DemoProtocol = body.protocol === 'acp' ? 'acp' : 'ucp';
    const store = body.store;

    if (!message) {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 });
    }

    const products = await fetchShopifyProducts(message, 8, { protocol, store });
    let reply: string | null = null;

    if (model.startsWith('gemini-')) {
      reply = await callGeminiModel(model, message, products);
    } else if (model.startsWith('gpt-')) {
      reply = await callOpenAIModel(model, message, products);
    }

    if (!reply) {
      reply = buildFallbackReply(message, products);
    }

    return NextResponse.json({
      reply,
      products,
      model_used: model,
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to process chat request' },
      { status: 500 }
    );
  }
}
