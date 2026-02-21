import * as api from './api';

export interface DemoMessage {
  id: string;
  sender: 'user' | 'ai';
  text: string;
  products?: DemoProduct[];
  checkout?: Record<string, unknown>;
  choices?: Array<{ label: string; value: string }>;
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
  filterQuery?: string;
}

export const STYLE_FILTERS = [
  { label: 'White Tees', value: 'white' },
  { label: 'Black Tees', value: 'black' },
  { label: 'Oversized', value: 'oversized' },
  { label: 'Graphic Tees', value: 'graphic' },
  { label: 'Browse All', value: '' },
];

function eventId(): string {
  return `evt_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
}

/** Search products by filter query. Filtered = 6 results, Browse All = 12. */
export async function searchProducts(query: string): Promise<DemoProduct[]> {
  try {
    const data = await api.getProducts(query || undefined);
    const all: DemoProduct[] = data.products || [];
    const affordable = all.filter((p: DemoProduct) => p.price <= 5000);
    const results = affordable.length > 0 ? affordable : all;
    const limit = query ? 6 : 12;
    return results.slice(0, limit);
  } catch (error) {
    console.error('Product search failed', error);
    return [];
  }
}

/** Checkout steps that auto-advance after product selection. */
export function createCheckoutSteps(): ScenarioStep[] {
  return [
    {
      aiMessage: "Great choice! Creating a checkout for you now...",
      action: async (ctx) => {
        if (!ctx.selectedProduct) return {};
        try {
          const checkout = await api.createCheckout([
            { id: ctx.selectedProduct.id, quantity: 1 },
          ]);
          ctx.checkoutId = checkout.id;
          return { checkout };
        } catch (error) {
          // Mock checkout for demo mode (when API unavailable)
          ctx.checkoutId = 'mock_checkout_' + Date.now();
          return {
            checkout: {
              id: ctx.checkoutId,
              status: 'pending',
              total: ctx.selectedProduct.price,
              currency: ctx.selectedProduct.currency,
            }
          };
        }
      },
      journeyEvents: [
        { type: 'CHECKOUT_INIT', stage: 3, message: 'Agent initiated checkout session' },
        { type: 'INVENTORY_CHECK', stage: 3, message: 'Inventory reserved for agent purchase' },
      ],
    },
    {
      aiMessage: "Adding shipping address and calculating totals...",
      action: async (ctx) => {
        if (!ctx.checkoutId) return {};
        try {
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
        } catch (error) {
          // Mock checkout update for demo mode
          return {
            checkout: {
              id: ctx.checkoutId,
              status: 'address_set',
              buyer: { first_name: 'Jane', last_name: 'Doe' },
            }
          };
        }
      },
      journeyEvents: [
        { type: 'ADDRESS_SET', stage: 4, message: 'Shipping address validated and set' },
        { type: 'TAX_SHIPPING_CALC', stage: 4, message: 'Tax and shipping calculated by ISV' },
      ],
    },
    {
      aiMessage: "Processing payment...",
      action: async (ctx) => {
        if (!ctx.checkoutId) return {};
        try {
          const checkout = await api.completeCheckout(
            ctx.checkoutId,
            'spt_demo_' + Date.now()
          );
          return { checkout };
        } catch (error) {
          // Mock checkout completion for demo mode
          return {
            checkout: {
              id: ctx.checkoutId,
              status: 'completed',
              total: ctx.selectedProduct?.price || 0,
              currency: ctx.selectedProduct?.currency || 'usd',
            }
          };
        }
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
