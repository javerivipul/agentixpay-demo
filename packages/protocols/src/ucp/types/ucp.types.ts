/**
 * UCP (Universal Commerce Protocol) types.
 * Google's AI commerce protocol.
 * All monetary amounts are in the smallest currency unit (cents for USD).
 */

// ============================================
// CAPABILITIES
// ============================================

export interface UCPCapabilitiesResponse {
  merchant: {
    name: string;
    description?: string;
    logo_url?: string;
  };
  capabilities: UCPCapability[];
  supported_currencies: string[];
  supported_countries: string[];
}

export interface UCPCapability {
  type: 'catalog' | 'cart' | 'checkout' | 'order_tracking';
  version: string;
}

// ============================================
// CATALOG
// ============================================

export interface UCPCatalogQuery {
  query?: string;
  category?: string;
  min_price?: number;
  max_price?: number;
  page_size?: number;
  page_token?: string;
}

export interface UCPCatalogResponse {
  items: UCPCatalogItem[];
  next_page_token?: string;
  total_results: number;
}

export interface UCPCatalogItem {
  id: string;
  title: string;
  description: string;
  url?: string;
  images: UCPImage[];
  price: UCPMoney;
  availability: 'in_stock' | 'out_of_stock' | 'preorder';
  category?: string;
  brand?: string;
  variants?: UCPVariant[];
}

export interface UCPImage {
  url: string;
  alt_text?: string;
}

export interface UCPMoney {
  amount: number;
  currency_code: string;
}

export interface UCPVariant {
  id: string;
  title: string;
  sku: string;
  price: UCPMoney;
  availability: 'in_stock' | 'out_of_stock';
  attributes?: Record<string, string>;
}

// ============================================
// CART
// ============================================

export interface UCPCreateCartRequest {
  items: UCPCartItemInput[];
}

export interface UCPCartItemInput {
  product_id: string;
  variant_id?: string;
  quantity: number;
}

export interface UCPUpdateCartRequest {
  items?: UCPCartItemInput[];
  shipping_address?: UCPShippingAddress;
  shipping_method_id?: string;
}

export interface UCPShippingAddress {
  recipient_name: string;
  street_address: string;
  street_address_2?: string;
  city: string;
  region: string;
  postal_code: string;
  country_code: string;
  phone?: string;
}

export interface UCPCartResponse {
  id: string;
  status: 'open' | 'ready' | 'completed' | 'cancelled';
  items: UCPCartItem[];
  subtotal: UCPMoney;
  tax: UCPMoney;
  shipping: UCPMoney;
  total: UCPMoney;
  shipping_address?: UCPShippingAddress;
  available_shipping_methods?: UCPShippingMethodOption[];
  selected_shipping_method_id?: string;
  payment_url?: string;
}

export interface UCPCartItem {
  id: string;
  product_id: string;
  variant_id?: string;
  title: string;
  sku: string;
  quantity: number;
  unit_price: UCPMoney;
  line_total: UCPMoney;
  image?: UCPImage;
}

export interface UCPShippingMethodOption {
  id: string;
  title: string;
  description?: string;
  price: UCPMoney;
  estimated_delivery?: string;
}

// ============================================
// ORDER
// ============================================

export interface UCPCreateOrderRequest {
  cart_id: string;
  payment_token: string;
}

export interface UCPOrderResponse {
  id: string;
  cart_id: string;
  status: 'pending' | 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  order_number: string;
  items: UCPCartItem[];
  subtotal: UCPMoney;
  tax: UCPMoney;
  shipping: UCPMoney;
  total: UCPMoney;
  shipping_address: UCPShippingAddress;
  tracking?: {
    carrier: string;
    tracking_number: string;
    tracking_url: string;
  };
  created_at: string;
}
