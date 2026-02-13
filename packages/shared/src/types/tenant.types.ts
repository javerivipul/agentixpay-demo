export type Platform = 'SHOPIFY' | 'WOOCOMMERCE' | 'VENDURE' | 'CUSTOM';

export type TenantStatus =
  | 'ONBOARDING'
  | 'CONNECTING'
  | 'SYNCING'
  | 'ACTIVE'
  | 'SUSPENDED'
  | 'DISCONNECTED';

export interface TenantSettings {
  protocols: ('acp' | 'ucp')[];
  webhookUrl?: string;
  aeoEnabled: boolean;
  rateLimit: number;
}

export interface Tenant {
  id: string;
  name: string;
  email: string;
  companyName?: string;
  apiKey: string;
  apiSecretHash: string;
  platform: Platform;
  platformConfig: unknown;
  platformConnectedAt?: Date;
  settings: TenantSettings;
  status: TenantStatus;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateTenantInput {
  name: string;
  email: string;
  companyName?: string;
  platform: Platform;
}

export interface UpdateTenantInput {
  name?: string;
  companyName?: string;
  platform?: Platform;
  platformConfig?: unknown;
  platformConnectedAt?: Date;
  settings?: Partial<TenantSettings>;
  status?: TenantStatus;
}

export interface PlatformCredentials {
  [key: string]: unknown;
}

export interface ShopifyCredentials extends PlatformCredentials {
  shop: string;
  accessToken: string;
  scope: string;
}

export interface WooCommerceCredentials extends PlatformCredentials {
  storeUrl: string;
  consumerKey: string;
  consumerSecret: string;
}

export interface VendureCredentials extends PlatformCredentials {
  apiUrl: string;
  authToken: string;
  channelToken?: string;
}
