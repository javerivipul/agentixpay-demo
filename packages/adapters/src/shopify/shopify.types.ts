/**
 * Shopify-specific types for the adapter.
 * These map Shopify REST Admin API responses to our internal types.
 */

export interface ShopifyProduct {
  id: number;
  title: string;
  body_html: string;
  vendor: string;
  product_type: string;
  handle: string;
  status: string;
  tags: string;
  variants: ShopifyVariant[];
  images: ShopifyImage[];
  created_at: string;
  updated_at: string;
}

export interface ShopifyVariant {
  id: number;
  product_id: number;
  title: string;
  sku: string;
  price: string;
  compare_at_price: string | null;
  inventory_quantity: number;
  inventory_policy: string;
  inventory_management: string | null;
  option1: string | null;
  option2: string | null;
  option3: string | null;
}

export interface ShopifyImage {
  id: number;
  src: string;
  alt: string | null;
  position: number;
}

export interface ShopifyOrder {
  id: number;
  order_number: number;
  email: string;
  financial_status: string;
  fulfillment_status: string | null;
  total_price: string;
  subtotal_price: string;
  total_tax: string;
  currency: string;
  line_items: ShopifyLineItem[];
  shipping_address: ShopifyAddress | null;
  shipping_lines: ShopifyShippingLine[];
  created_at: string;
  updated_at: string;
}

export interface ShopifyLineItem {
  id: number;
  variant_id: number;
  title: string;
  sku: string;
  quantity: number;
  price: string;
}

export interface ShopifyAddress {
  first_name: string;
  last_name: string;
  address1: string;
  address2: string;
  city: string;
  province: string;
  zip: string;
  country: string;
  phone: string;
}

export interface ShopifyShippingLine {
  id: number;
  title: string;
  price: string;
  code: string;
}
