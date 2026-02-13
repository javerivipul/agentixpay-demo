import type {
  Product,
  ProductQueryParams,
  ProductFilters,
  PaginatedResult,
  InventoryStatus,
  Reservation,
  SyncResult,
  ConnectionResult,
  TestConnectionResult,
  Checkout,
  Order,
  OrderStatus,
  ShippingMethod,
  PlatformCredentials,
  WebhookRegistration,
  WebhookResult,
} from '@agentix/shared';

/**
 * Core adapter interface that all ISV platform adapters must implement.
 * Protocol handlers interact with ISV platforms exclusively through this interface.
 */
export interface ISVAdapter {
  // ── Identity ──────────────────────────────────────────────
  readonly platform: string;
  readonly version: string;

  // ── Connection ────────────────────────────────────────────
  connect(credentials: PlatformCredentials): Promise<ConnectionResult>;
  disconnect(): Promise<void>;
  testConnection(): Promise<TestConnectionResult>;
  isConnected(): boolean;

  // ── Products ──────────────────────────────────────────────
  getProducts(params: ProductQueryParams): Promise<PaginatedResult<Product>>;
  getProduct(id: string): Promise<Product | null>;
  getProductBySku(sku: string): Promise<Product | null>;
  searchProducts(query: string, filters?: ProductFilters): Promise<Product[]>;
  syncProducts(): Promise<SyncResult>;

  // ── Inventory ─────────────────────────────────────────────
  checkInventory(sku: string): Promise<InventoryStatus>;
  reserveInventory(sku: string, quantity: number, ttl?: number): Promise<Reservation>;
  releaseInventory(reservationId: string): Promise<void>;

  // ── Orders ────────────────────────────────────────────────
  createOrder(checkout: Checkout): Promise<Order>;
  getOrder(id: string): Promise<Order | null>;
  updateOrderStatus(id: string, status: OrderStatus): Promise<Order>;
  cancelOrder(id: string, reason?: string): Promise<Order>;

  // ── Shipping ──────────────────────────────────────────────
  getShippingRates(checkout: Checkout): Promise<ShippingMethod[]>;

  // ── Webhooks ──────────────────────────────────────────────
  registerWebhooks(callbackUrl: string): Promise<WebhookRegistration[]>;
  handleWebhook(payload: unknown, signature: string): Promise<WebhookResult>;
}
