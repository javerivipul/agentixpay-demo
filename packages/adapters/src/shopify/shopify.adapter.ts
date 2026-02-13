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
  ShopifyCredentials,
} from '@agentix/shared';
import { BaseAdapter } from '../base/base.adapter';

/**
 * Shopify adapter — connects to the Shopify Admin REST API.
 *
 * Currently a skeleton. Method implementations will be added
 * when Shopify OAuth integration is built.
 */
export class ShopifyAdapter extends BaseAdapter {
  readonly platform = 'SHOPIFY';
  readonly version = '1.0.0';

  private shop: string | null = null;
  private accessToken: string | null = null;

  // ── Connection ────────────────────────────────────────────

  protected async doConnect(credentials: PlatformCredentials): Promise<ConnectionResult> {
    const creds = credentials as ShopifyCredentials;
    this.shop = creds.shop;
    this.accessToken = creds.accessToken;
    return { success: true, shopName: creds.shop };
  }

  protected async doDisconnect(): Promise<void> {
    this.shop = null;
    this.accessToken = null;
  }

  protected async doTestConnection(): Promise<TestConnectionResult> {
    return { success: true, shopName: this.shop ?? undefined };
  }

  // ── Products ──────────────────────────────────────────────

  async getProducts(_params: ProductQueryParams): Promise<PaginatedResult<Product>> {
    throw new Error('ShopifyAdapter.getProducts: Not implemented');
  }

  async getProduct(_id: string): Promise<Product | null> {
    throw new Error('ShopifyAdapter.getProduct: Not implemented');
  }

  async getProductBySku(_sku: string): Promise<Product | null> {
    throw new Error('ShopifyAdapter.getProductBySku: Not implemented');
  }

  async searchProducts(_query: string, _filters?: ProductFilters): Promise<Product[]> {
    throw new Error('ShopifyAdapter.searchProducts: Not implemented');
  }

  async syncProducts(): Promise<SyncResult> {
    throw new Error('ShopifyAdapter.syncProducts: Not implemented');
  }

  // ── Inventory ─────────────────────────────────────────────

  async checkInventory(_sku: string): Promise<InventoryStatus> {
    throw new Error('ShopifyAdapter.checkInventory: Not implemented');
  }

  async reserveInventory(_sku: string, _quantity: number, _ttl?: number): Promise<Reservation> {
    throw new Error('ShopifyAdapter.reserveInventory: Not implemented');
  }

  async releaseInventory(_reservationId: string): Promise<void> {
    throw new Error('ShopifyAdapter.releaseInventory: Not implemented');
  }

  // ── Orders ────────────────────────────────────────────────

  async createOrder(_checkout: Checkout): Promise<Order> {
    throw new Error('ShopifyAdapter.createOrder: Not implemented');
  }

  async getOrder(_id: string): Promise<Order | null> {
    throw new Error('ShopifyAdapter.getOrder: Not implemented');
  }

  async updateOrderStatus(_id: string, _status: OrderStatus): Promise<Order> {
    throw new Error('ShopifyAdapter.updateOrderStatus: Not implemented');
  }

  async cancelOrder(_id: string, _reason?: string): Promise<Order> {
    throw new Error('ShopifyAdapter.cancelOrder: Not implemented');
  }

  // ── Shipping ──────────────────────────────────────────────

  async getShippingRates(_checkout: Checkout): Promise<ShippingMethod[]> {
    throw new Error('ShopifyAdapter.getShippingRates: Not implemented');
  }

  // ── Webhooks ──────────────────────────────────────────────

  async registerWebhooks(_callbackUrl: string): Promise<WebhookRegistration[]> {
    throw new Error('ShopifyAdapter.registerWebhooks: Not implemented');
  }

  async handleWebhook(_payload: unknown, _signature: string): Promise<WebhookResult> {
    throw new Error('ShopifyAdapter.handleWebhook: Not implemented');
  }
}
