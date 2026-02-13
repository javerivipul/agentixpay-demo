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
  WooCommerceCredentials,
} from '@agentix/shared';
import { BaseAdapter } from '../base/base.adapter';

/**
 * WooCommerce adapter — connects via the WooCommerce REST API v3.
 *
 * Currently a skeleton. Method implementations will be added
 * when WooCommerce API key integration is built.
 */
export class WooCommerceAdapter extends BaseAdapter {
  readonly platform = 'WOOCOMMERCE';
  readonly version = '1.0.0';

  private storeUrl: string | null = null;

  // ── Connection ────────────────────────────────────────────

  protected async doConnect(credentials: PlatformCredentials): Promise<ConnectionResult> {
    const creds = credentials as WooCommerceCredentials;
    this.storeUrl = creds.storeUrl;
    return { success: true, shopName: creds.storeUrl };
  }

  protected async doDisconnect(): Promise<void> {
    this.storeUrl = null;
  }

  protected async doTestConnection(): Promise<TestConnectionResult> {
    return { success: true, shopName: this.storeUrl ?? undefined };
  }

  // ── Products ──────────────────────────────────────────────

  async getProducts(_params: ProductQueryParams): Promise<PaginatedResult<Product>> {
    throw new Error('WooCommerceAdapter.getProducts: Not implemented');
  }

  async getProduct(_id: string): Promise<Product | null> {
    throw new Error('WooCommerceAdapter.getProduct: Not implemented');
  }

  async getProductBySku(_sku: string): Promise<Product | null> {
    throw new Error('WooCommerceAdapter.getProductBySku: Not implemented');
  }

  async searchProducts(_query: string, _filters?: ProductFilters): Promise<Product[]> {
    throw new Error('WooCommerceAdapter.searchProducts: Not implemented');
  }

  async syncProducts(): Promise<SyncResult> {
    throw new Error('WooCommerceAdapter.syncProducts: Not implemented');
  }

  // ── Inventory ─────────────────────────────────────────────

  async checkInventory(_sku: string): Promise<InventoryStatus> {
    throw new Error('WooCommerceAdapter.checkInventory: Not implemented');
  }

  async reserveInventory(_sku: string, _quantity: number, _ttl?: number): Promise<Reservation> {
    throw new Error('WooCommerceAdapter.reserveInventory: Not implemented');
  }

  async releaseInventory(_reservationId: string): Promise<void> {
    throw new Error('WooCommerceAdapter.releaseInventory: Not implemented');
  }

  // ── Orders ────────────────────────────────────────────────

  async createOrder(_checkout: Checkout): Promise<Order> {
    throw new Error('WooCommerceAdapter.createOrder: Not implemented');
  }

  async getOrder(_id: string): Promise<Order | null> {
    throw new Error('WooCommerceAdapter.getOrder: Not implemented');
  }

  async updateOrderStatus(_id: string, _status: OrderStatus): Promise<Order> {
    throw new Error('WooCommerceAdapter.updateOrderStatus: Not implemented');
  }

  async cancelOrder(_id: string, _reason?: string): Promise<Order> {
    throw new Error('WooCommerceAdapter.cancelOrder: Not implemented');
  }

  // ── Shipping ──────────────────────────────────────────────

  async getShippingRates(_checkout: Checkout): Promise<ShippingMethod[]> {
    throw new Error('WooCommerceAdapter.getShippingRates: Not implemented');
  }

  // ── Webhooks ──────────────────────────────────────────────

  async registerWebhooks(_callbackUrl: string): Promise<WebhookRegistration[]> {
    throw new Error('WooCommerceAdapter.registerWebhooks: Not implemented');
  }

  async handleWebhook(_payload: unknown, _signature: string): Promise<WebhookResult> {
    throw new Error('WooCommerceAdapter.handleWebhook: Not implemented');
  }
}
