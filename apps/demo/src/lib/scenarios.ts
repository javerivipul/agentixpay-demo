import * as api from './api';

export interface DemoMessage {
  id: string;
  sender: 'user' | 'ai';
  text: string;
  products?: DemoProduct[];
  checkout?: Record<string, unknown>;
  typing?: boolean;
}

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
}

export interface JourneyEvent {
  id: string;
  timestamp: string;
  type: string;
  stage: number;
  message: string;
  details?: Record<string, unknown>;
}

export interface ScenarioStep {
  userMessage?: string;
  aiMessage: string;
  action: (ctx: ScenarioContext) => Promise<StepResult>;
  journeyEvents: Array<{ type: string; stage: number; message: string }>;
}

export interface StepResult {
  products?: DemoProduct[];
  checkout?: Record<string, unknown>;
}

export interface ScenarioContext {
  checkoutId?: string;
  selectedProduct?: DemoProduct;
}

let stepCounter = 0;
function nextId(): string {
  return `msg_${++stepCounter}_${Date.now()}`;
}

function eventId(): string {
  return `evt_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
}

export function createDemoScenario(): ScenarioStep[] {
  return [
    // Step 1: Search for products
    {
      userMessage: 'Find me a white t-shirt under $50',
      aiMessage: "I'll search for white t-shirts in your price range. Here's what I found:",
      action: async () => {
        const data = await api.getProducts('white');
        const products: DemoProduct[] = (data.products || []).filter(
          (p: DemoProduct) => p.price <= 5000
        );
        return { products: products.length > 0 ? products : data.products?.slice(0, 3) };
      },
      journeyEvents: [
        { type: 'PRODUCT_SEARCH', stage: 1, message: 'Agent searching catalog: "white t-shirt under $50"' },
        { type: 'PRODUCT_RESULTS', stage: 2, message: 'Catalog returned matching products to agent' },
      ],
    },

    // Step 2: Select product and create checkout
    {
      userMessage: "I'll take the first one. Add it to checkout.",
      aiMessage: "Great choice! I'm creating a checkout for you now...",
      action: async (ctx) => {
        if (!ctx.selectedProduct) return {};
        const checkout = await api.createCheckout([
          { id: ctx.selectedProduct.id, quantity: 1 },
        ]);
        ctx.checkoutId = checkout.id;
        return { checkout };
      },
      journeyEvents: [
        { type: 'CHECKOUT_INIT', stage: 3, message: 'Agent initiated checkout session' },
        { type: 'INVENTORY_CHECK', stage: 3, message: 'Inventory reserved for agent purchase' },
      ],
    },

    // Step 3: Add shipping address
    {
      userMessage: 'Ship it to 123 Tech Blvd, San Francisco, CA 94107',
      aiMessage: "I've added your shipping address. Let me get the shipping options and calculate totals...",
      action: async (ctx) => {
        if (!ctx.checkoutId) return {};
        const checkout = await api.updateCheckout(ctx.checkoutId, {
          buyer: {
            first_name: 'Jane',
            last_name: 'Doe',
            email: 'jane@example.com',
          },
          fulfillment_address: {
            name: 'Jane Doe',
            line_one: '123 Tech Blvd',
            city: 'San Francisco',
            state: 'CA',
            country: 'US',
            postal_code: '94107',
          },
        });
        return { checkout };
      },
      journeyEvents: [
        { type: 'ADDRESS_SET', stage: 4, message: 'Shipping address validated and set' },
        { type: 'TAX_SHIPPING_CALC', stage: 4, message: 'Tax and shipping calculated by ISV' },
      ],
    },

    // Step 4: Confirm and pay
    {
      userMessage: 'Looks good — go ahead and place the order!',
      aiMessage: "Processing your payment now...",
      action: async (ctx) => {
        if (!ctx.checkoutId) return {};
        const checkout = await api.completeCheckout(
          ctx.checkoutId,
          'spt_demo_' + Date.now()
        );
        return { checkout };
      },
      journeyEvents: [
        { type: 'PAYMENT_PENDING', stage: 5, message: 'Payment token submitted for processing' },
        { type: 'ORDER_FINALIZED', stage: 6, message: 'Order confirmed — fulfillment triggered' },
      ],
    },
  ];
}

export function createJourneyEvent(
  type: string,
  stage: number,
  message: string,
  details?: Record<string, unknown>,
): JourneyEvent {
  return {
    id: eventId(),
    timestamp: new Date().toISOString(),
    type,
    stage,
    message,
    details,
  };
}
