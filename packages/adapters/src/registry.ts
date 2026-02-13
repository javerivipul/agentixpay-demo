import type { Platform, PlatformCredentials } from '@agentix/shared';
import type { ISVAdapter } from './base/adapter.interface';
import { MockAdapter } from './mock/mock.adapter';
import { ShopifyAdapter } from './shopify/shopify.adapter';
import { WooCommerceAdapter } from './woocommerce/woocommerce.adapter';
import { VendureAdapter } from './vendure/vendure.adapter';

/**
 * Factory function that returns the appropriate ISVAdapter for a given platform.
 * Falls back to MockAdapter for unknown platforms or when credentials are missing.
 *
 * If credentials are provided, the adapter will be connected before returning.
 */
export async function getAdapter(
  platform: Platform | string,
  credentials?: PlatformCredentials,
): Promise<ISVAdapter> {
  let adapter: ISVAdapter;

  switch (platform) {
    case 'SHOPIFY':
      adapter = new ShopifyAdapter();
      break;
    case 'WOOCOMMERCE':
      adapter = new WooCommerceAdapter();
      break;
    case 'VENDURE':
      adapter = new VendureAdapter();
      break;
    case 'CUSTOM':
    default:
      adapter = new MockAdapter();
      break;
  }

  if (credentials) {
    await adapter.connect(credentials);
  }

  return adapter;
}

/**
 * Creates an adapter without connecting. Useful when you want to
 * manage the connection lifecycle yourself.
 */
export function createAdapter(platform: Platform | string): ISVAdapter {
  switch (platform) {
    case 'SHOPIFY':
      return new ShopifyAdapter();
    case 'WOOCOMMERCE':
      return new WooCommerceAdapter();
    case 'VENDURE':
      return new VendureAdapter();
    case 'CUSTOM':
    default:
      return new MockAdapter();
  }
}
