// @agentix/adapters - ISV platform adapters

// Base
export { type ISVAdapter } from './base/adapter.interface';
export { BaseAdapter } from './base/base.adapter';

// Mock
export { MockAdapter } from './mock/mock.adapter';
export { MOCK_PRODUCTS, MOCK_SHIPPING_METHODS } from './mock/mock.data';

// Shopify
export { ShopifyAdapter } from './shopify/shopify.adapter';
export type * from './shopify/shopify.types';

// WooCommerce
export { WooCommerceAdapter } from './woocommerce/woocommerce.adapter';
export type * from './woocommerce/woocommerce.types';

// Vendure
export { VendureAdapter } from './vendure/vendure.adapter';

// Registry
export { getAdapter, createAdapter } from './registry';
