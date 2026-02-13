import { Platform } from '../types';

export interface PlatformInfo {
  id: Platform;
  name: string;
  description: string;
  connectType: 'oauth' | 'api_keys';
  docsUrl: string;
}

export const PLATFORMS: Record<Platform, PlatformInfo> = {
  SHOPIFY: {
    id: 'SHOPIFY',
    name: 'Shopify',
    description: 'Connect your Shopify store via OAuth',
    connectType: 'oauth',
    docsUrl: 'https://shopify.dev/docs/api/admin-rest',
  },
  WOOCOMMERCE: {
    id: 'WOOCOMMERCE',
    name: 'WooCommerce',
    description: 'Connect your WooCommerce site with API keys',
    connectType: 'api_keys',
    docsUrl: 'https://woocommerce.github.io/woocommerce-rest-api-docs/',
  },
  VENDURE: {
    id: 'VENDURE',
    name: 'Vendure',
    description: 'Connect your Vendure instance with API credentials',
    connectType: 'api_keys',
    docsUrl: 'https://docs.vendure.io/reference/graphql-api/',
  },
  CUSTOM: {
    id: 'CUSTOM',
    name: 'Custom / Demo',
    description: 'Use mock data for demos and testing',
    connectType: 'api_keys',
    docsUrl: '',
  },
};

export const SUPPORTED_PROTOCOLS = ['acp', 'ucp'] as const;
export type SupportedProtocol = (typeof SUPPORTED_PROTOCOLS)[number];

export const DEFAULT_RATE_LIMIT = 100; // requests per minute
export const CHECKOUT_EXPIRY_MINUTES = 30;
export const DEFAULT_PAGE_LIMIT = 20;
export const MAX_PAGE_LIMIT = 100;
