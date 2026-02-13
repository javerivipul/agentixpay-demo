/**
 * WooCommerce-specific types for the adapter.
 * These map WooCommerce REST API v3 responses to our internal types.
 */

export interface WooProduct {
  id: number;
  name: string;
  slug: string;
  type: string;
  status: string;
  description: string;
  short_description: string;
  sku: string;
  price: string;
  regular_price: string;
  sale_price: string;
  stock_quantity: number | null;
  stock_status: string;
  manage_stock: boolean;
  categories: WooCategory[];
  tags: WooTag[];
  images: WooImage[];
  variations: number[];
  date_created: string;
  date_modified: string;
}

export interface WooCategory {
  id: number;
  name: string;
  slug: string;
}

export interface WooTag {
  id: number;
  name: string;
  slug: string;
}

export interface WooImage {
  id: number;
  src: string;
  alt: string;
}

export interface WooOrder {
  id: number;
  number: string;
  status: string;
  total: string;
  subtotal: string;
  total_tax: string;
  currency: string;
  billing: WooAddress;
  shipping: WooAddress;
  line_items: WooLineItem[];
  shipping_lines: WooShippingLine[];
  date_created: string;
  date_modified: string;
}

export interface WooAddress {
  first_name: string;
  last_name: string;
  address_1: string;
  address_2: string;
  city: string;
  state: string;
  postcode: string;
  country: string;
  phone: string;
  email?: string;
}

export interface WooLineItem {
  id: number;
  name: string;
  product_id: number;
  variation_id: number;
  sku: string;
  quantity: number;
  price: number;
  total: string;
}

export interface WooShippingLine {
  id: number;
  method_title: string;
  method_id: string;
  total: string;
}
