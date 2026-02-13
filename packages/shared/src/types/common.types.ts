export interface PaginatedResult<T> {
  data: T[];
  total: number;
  limit: number;
  offset: number;
  hasMore: boolean;
}

export interface SyncResult {
  created: number;
  updated: number;
  deleted: number;
  failed: number;
  errors: SyncError[];
  duration: number;
}

export interface SyncError {
  externalId: string;
  error: string;
}

export interface ConnectionResult {
  success: boolean;
  shopName?: string;
  plan?: string;
  error?: string;
}

export interface TestConnectionResult {
  success: boolean;
  shopName?: string;
  plan?: string;
  error?: string;
}

export interface WebhookRegistration {
  id: string;
  event: string;
  callbackUrl: string;
}

export interface WebhookResult {
  event: string;
  processed: boolean;
  data?: unknown;
}

export interface WebhookHeaders {
  [key: string]: string | string[] | undefined;
}

export type SyncType = 'FULL' | 'INCREMENTAL' | 'PRODUCT' | 'INVENTORY' | 'ORDERS';
export type SyncJobStatus = 'PENDING' | 'RUNNING' | 'COMPLETED' | 'FAILED' | 'CANCELLED';
