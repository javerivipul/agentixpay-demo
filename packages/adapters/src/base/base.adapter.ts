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
import type { ISVAdapter } from './adapter.interface';

/**
 * Abstract base class for ISV adapters.
 *
 * Provides common logic such as:
 * - Connection state tracking
 * - Demo mode fallback (delegates to MockAdapter when disconnected)
 * - Logging helpers
 */
export abstract class BaseAdapter implements ISVAdapter {
  abstract readonly platform: string;
  abstract readonly version: string;

  protected connected = false;
  protected credentials: PlatformCredentials | null = null;
  protected demoMode = false;

  isConnected(): boolean {
    return this.connected;
  }

  async connect(credentials: PlatformCredentials): Promise<ConnectionResult> {
    this.credentials = credentials;
    try {
      const result = await this.doConnect(credentials);
      this.connected = result.success;
      return result;
    } catch (error) {
      this.connected = false;
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown connection error',
      };
    }
  }

  async disconnect(): Promise<void> {
    await this.doDisconnect();
    this.connected = false;
    this.credentials = null;
  }

  async testConnection(): Promise<TestConnectionResult> {
    if (!this.connected) {
      return { success: false, error: 'Not connected' };
    }
    return this.doTestConnection();
  }

  // ── Abstract methods each adapter must implement ──────────

  protected abstract doConnect(credentials: PlatformCredentials): Promise<ConnectionResult>;
  protected abstract doDisconnect(): Promise<void>;
  protected abstract doTestConnection(): Promise<TestConnectionResult>;

  abstract getProducts(params: ProductQueryParams): Promise<PaginatedResult<Product>>;
  abstract getProduct(id: string): Promise<Product | null>;
  abstract getProductBySku(sku: string): Promise<Product | null>;
  abstract searchProducts(query: string, filters?: ProductFilters): Promise<Product[]>;
  abstract syncProducts(): Promise<SyncResult>;
  abstract checkInventory(sku: string): Promise<InventoryStatus>;
  abstract reserveInventory(sku: string, quantity: number, ttl?: number): Promise<Reservation>;
  abstract releaseInventory(reservationId: string): Promise<void>;
  abstract createOrder(checkout: Checkout): Promise<Order>;
  abstract getOrder(id: string): Promise<Order | null>;
  abstract updateOrderStatus(id: string, status: OrderStatus): Promise<Order>;
  abstract cancelOrder(id: string, reason?: string): Promise<Order>;
  abstract getShippingRates(checkout: Checkout): Promise<ShippingMethod[]>;
  abstract registerWebhooks(callbackUrl: string): Promise<WebhookRegistration[]>;
  abstract handleWebhook(payload: unknown, signature: string): Promise<WebhookResult>;
}
