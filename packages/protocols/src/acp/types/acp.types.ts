/**
 * ACP (AI Commerce Protocol) types.
 * All monetary amounts are in CENTS (e.g., $89.99 = 8999).
 */

// ============================================
// SHARED ACP TYPES
// ============================================

export interface ACPBuyer {
  first_name: string;
  last_name: string;
  email: string;
  phone_number?: string;
}

export interface ACPAddress {
  name: string;
  line_one: string;
  line_two?: string;
  city: string;
  state: string;
  country: string;
  postal_code: string;
}

export interface ACPLineItem {
  id: string;
  item: {
    id: string;
    quantity: number;
  };
  base_amount: number;
  discount: number;
  subtotal: number;
  tax: number;
  total: number;
}

export interface ACPFulfillmentOption {
  type: 'shipping' | 'digital';
  id: string;
  title: string;
  subtitle?: string;
  carrier?: string;
  subtotal: number;
  tax: number;
  total: number;
}

export interface ACPTotal {
  type: 'subtotal' | 'discount' | 'fulfillment' | 'tax' | 'total';
  display_text: string;
  amount: number;
}

export interface ACPMessage {
  type: 'info' | 'error';
  code?: string;
  content_type?: 'plain' | 'markdown';
  content: string;
}

export interface ACPLink {
  type: 'terms_of_use' | 'privacy_policy' | 'seller_shop_policies';
  url: string;
}

export interface ACPPaymentProvider {
  provider: string;
  supported_payment_methods: string[];
}

// ============================================
// PRODUCT TYPES
// ============================================

export interface ACPProduct {
  id: string;
  sku: string;
  title: string;
  description: string;
  price: number;
  compare_at_price?: number;
  currency: string;
  images: ACPProductImage[];
  inventory: {
    quantity: number;
    status: 'in_stock' | 'out_of_stock' | 'low_stock';
  };
  category?: string;
  variants?: ACPProductVariant[];
  metadata?: Record<string, unknown>;
}

export interface ACPProductImage {
  url: string;
  alt?: string;
}

export interface ACPProductVariant {
  id: string;
  sku: string;
  title: string;
  price: number;
  inventory_quantity: number;
  options?: Record<string, string>;
}

// ============================================
// REQUEST TYPES
// ============================================

export interface ACPProductsQuery {
  query?: string;
  category?: string;
  min_price?: number;
  max_price?: number;
  limit?: number;
  offset?: number;
}

export interface ACPCreateCheckoutRequest {
  items: ACPCheckoutItemInput[];
  buyer?: ACPBuyer;
  fulfillment_address?: ACPAddress;
  fulfillment_option_id?: string;
  metadata?: Record<string, unknown>;
}

export interface ACPCheckoutItemInput {
  id?: string;
  sku?: string;
  quantity: number;
}

export interface ACPUpdateCheckoutRequest {
  items?: ACPCheckoutItemInput[];
  buyer?: ACPBuyer;
  fulfillment_address?: ACPAddress;
  fulfillment_option_id?: string;
}

export interface ACPCompleteCheckoutRequest {
  payment_token: {
    type: 'stripe_spt';
    token: string;
  };
}

// ============================================
// RESPONSE TYPES
// ============================================

export interface ACPProductsResponse {
  products: ACPProduct[];
  total: number;
  limit: number;
  offset: number;
  has_more: boolean;
}

export interface ACPCheckoutResponse {
  id: string;
  status: ACPCheckoutStatus;
  currency: string;
  buyer?: ACPBuyer;
  payment_provider?: ACPPaymentProvider;
  line_items: ACPLineItem[];
  fulfillment_address?: ACPAddress;
  fulfillment_options: ACPFulfillmentOption[];
  fulfillment_option_id?: string;
  totals: ACPTotal[];
  messages: ACPMessage[];
  links: ACPLink[];
}

export type ACPCheckoutStatus =
  | 'not_ready_for_payment'
  | 'ready_for_payment'
  | 'in_progress'
  | 'completed'
  | 'canceled';
