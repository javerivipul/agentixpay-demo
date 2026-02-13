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
import {
  generateId,
  minutesFromNow,
  isExpired,
  calculateLineTotal,
} from '@agentix/shared';
import { BaseAdapter } from '../base/base.adapter';
import { MOCK_PRODUCTS, MOCK_SHIPPING_METHODS } from './mock.data';

/**
 * In-memory mock adapter for demos and testing.
 * Provides full working product search, inventory, checkout, and order flows
 * without any external dependencies.
 */
export class MockAdapter extends BaseAdapter {
  readonly platform = 'MOCK';
  readonly version = '1.0.0';

  private products: Product[];
  private orders: Map<string, Order> = new Map();
  private reservations: Map<string, Reservation> = new Map();
  private inventoryOverrides: Map<string, number> = new Map();

  constructor() {
    super();
    this.products = structuredClone(MOCK_PRODUCTS);
    this.connected = true;
    this.demoMode = true;
  }

  // ── Connection ────────────────────────────────────────────

  protected async doConnect(_credentials: PlatformCredentials): Promise<ConnectionResult> {
    return { success: true, shopName: 'Mock Store' };
  }

  protected async doDisconnect(): Promise<void> {
    // no-op
  }

  protected async doTestConnection(): Promise<TestConnectionResult> {
    return { success: true, shopName: 'Mock Store' };
  }

  // ── Products ──────────────────────────────────────────────

  async getProducts(params: ProductQueryParams): Promise<PaginatedResult<Product>> {
    let filtered = this.applyFilters(this.products, params);

    // Sorting
    if (params.orderBy) {
      filtered = this.sortProducts(filtered, params.orderBy, params.orderDir ?? 'asc');
    }

    const total = filtered.length;
    const offset = params.offset ?? 0;
    const limit = params.limit ?? 20;
    const page = filtered.slice(offset, offset + limit);

    return {
      data: page,
      total,
      limit,
      offset,
      hasMore: offset + limit < total,
    };
  }

  async getProduct(id: string): Promise<Product | null> {
    return this.products.find((p) => p.id === id) ?? null;
  }

  async getProductBySku(sku: string): Promise<Product | null> {
    // Check top-level SKU
    const direct = this.products.find((p) => p.sku === sku);
    if (direct) return direct;

    // Check variant SKUs
    for (const p of this.products) {
      if (p.variants?.some((v) => v.sku === sku)) {
        return p;
      }
    }
    return null;
  }

  async searchProducts(query: string, filters?: ProductFilters): Promise<Product[]> {
    const q = query.toLowerCase();
    let results = this.products.filter((p) => {
      const text = `${p.title} ${p.description ?? ''} ${p.tags.join(' ')} ${p.productType ?? ''} ${p.vendor ?? ''}`.toLowerCase();
      return text.includes(q);
    });

    if (filters) {
      results = this.applyProductFilters(results, filters);
    }

    return results;
  }

  async syncProducts(): Promise<SyncResult> {
    return {
      created: 0,
      updated: this.products.length,
      deleted: 0,
      failed: 0,
      errors: [],
      duration: 0,
    };
  }

  // ── Inventory ─────────────────────────────────────────────

  async checkInventory(sku: string): Promise<InventoryStatus> {
    const product = await this.getProductBySku(sku);
    if (!product) {
      return { sku, quantity: 0, available: false, policy: 'DENY' };
    }

    // Check variant-level inventory first
    const variant = product.variants?.find((v) => v.sku === sku);
    const baseQty = variant ? variant.inventoryQuantity : product.inventoryQuantity;
    const overrideQty = this.inventoryOverrides.get(sku);
    const quantity = overrideQty ?? baseQty;

    // Subtract active reservations for this SKU
    let reserved = 0;
    for (const r of this.reservations.values()) {
      if (r.sku === sku && !isExpired(r.expiresAt)) {
        reserved += r.quantity;
      }
    }

    const available = quantity - reserved;

    return {
      sku,
      quantity: available,
      available: available > 0,
      policy: product.inventoryPolicy,
    };
  }

  async reserveInventory(sku: string, quantity: number, ttl = 15): Promise<Reservation> {
    const status = await this.checkInventory(sku);
    if (status.quantity < quantity) {
      throw new Error(`Insufficient stock for ${sku}: requested ${quantity}, available ${status.quantity}`);
    }

    const reservation: Reservation = {
      id: generateId('rsv'),
      sku,
      quantity,
      expiresAt: minutesFromNow(ttl),
    };

    this.reservations.set(reservation.id, reservation);
    return reservation;
  }

  async releaseInventory(reservationId: string): Promise<void> {
    this.reservations.delete(reservationId);
  }

  // ── Orders ────────────────────────────────────────────────

  async createOrder(checkout: Checkout): Promise<Order> {
    const orderId = generateId('ord');
    const order: Order = {
      id: orderId,
      tenantId: checkout.tenantId,
      checkoutId: checkout.id,
      externalId: orderId,
      orderNumber: `MK-${Date.now().toString(36).toUpperCase()}`,
      status: 'CONFIRMED',
      items: checkout.items.map((item) => ({
        id: generateId('oi'),
        orderId,
        productId: item.productId,
        sku: item.sku,
        title: item.title,
        price: item.price,
        quantity: item.quantity,
        variantId: item.variantId,
        variantTitle: item.variantTitle,
        lineTotal: calculateLineTotal(item.price, item.quantity),
      })),
      email: checkout.email ?? 'guest@example.com',
      shippingAddress: checkout.shippingAddress ? { ...checkout.shippingAddress } : {},
      shippingMethod: checkout.shippingMethod,
      shippingCost: checkout.shippingCost ?? 0,
      subtotal: checkout.subtotal,
      taxAmount: checkout.taxAmount,
      totalAmount: checkout.totalAmount,
      currency: checkout.currency,
      paymentMethod: checkout.paymentMethod,
      paymentReference: generateId('pay'),
      fulfillmentStatus: 'UNFULFILLED',
      source: 'agentix',
      protocol: checkout.protocol,
      metadata: checkout.metadata,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    // Deduct inventory
    for (const item of checkout.items) {
      const current = this.inventoryOverrides.get(item.sku)
        ?? (await this.getProductBySku(item.sku))?.inventoryQuantity
        ?? 0;
      this.inventoryOverrides.set(item.sku, Math.max(0, current - item.quantity));
    }

    this.orders.set(order.id, order);
    return order;
  }

  async getOrder(id: string): Promise<Order | null> {
    return this.orders.get(id) ?? null;
  }

  async updateOrderStatus(id: string, status: OrderStatus): Promise<Order> {
    const order = this.orders.get(id);
    if (!order) throw new Error(`Order ${id} not found`);
    order.status = status;
    order.updatedAt = new Date();
    return order;
  }

  async cancelOrder(id: string, reason?: string): Promise<Order> {
    const order = this.orders.get(id);
    if (!order) throw new Error(`Order ${id} not found`);
    order.status = 'CANCELLED';
    order.notes = reason;
    order.updatedAt = new Date();
    return order;
  }

  // ── Shipping ──────────────────────────────────────────────

  async getShippingRates(_checkout: Checkout): Promise<ShippingMethod[]> {
    return MOCK_SHIPPING_METHODS;
  }

  // ── Webhooks ──────────────────────────────────────────────

  async registerWebhooks(_callbackUrl: string): Promise<WebhookRegistration[]> {
    return [];
  }

  async handleWebhook(_payload: unknown, _signature: string): Promise<WebhookResult> {
    return { event: 'unknown', processed: false };
  }

  // ── Private helpers ───────────────────────────────────────

  private applyFilters(products: Product[], params: ProductQueryParams): Product[] {
    let result = products;

    if (params.query) {
      const q = params.query.toLowerCase();
      result = result.filter((p) => {
        const text = `${p.title} ${p.description ?? ''} ${p.tags.join(' ')}`.toLowerCase();
        return text.includes(q);
      });
    }

    if (params.category) {
      const cat = params.category.toLowerCase();
      result = result.filter(
        (p) => p.productType?.toLowerCase() === cat || p.tags.some((t) => t.toLowerCase() === cat),
      );
    }

    if (params.minPrice !== undefined) {
      result = result.filter((p) => p.price >= params.minPrice!);
    }

    if (params.maxPrice !== undefined) {
      result = result.filter((p) => p.price <= params.maxPrice!);
    }

    if (params.inStock) {
      result = result.filter((p) => p.inventoryQuantity > 0);
    }

    if (params.ids && params.ids.length > 0) {
      const idSet = new Set(params.ids);
      result = result.filter((p) => idSet.has(p.id));
    }

    if (params.skus && params.skus.length > 0) {
      const skuSet = new Set(params.skus);
      result = result.filter((p) => skuSet.has(p.sku));
    }

    return result;
  }

  private applyProductFilters(products: Product[], filters: ProductFilters): Product[] {
    let result = products;

    if (filters.category) {
      const cat = filters.category.toLowerCase();
      result = result.filter(
        (p) => p.productType?.toLowerCase() === cat || p.tags.some((t) => t.toLowerCase() === cat),
      );
    }

    if (filters.minPrice !== undefined) {
      result = result.filter((p) => p.price >= filters.minPrice!);
    }

    if (filters.maxPrice !== undefined) {
      result = result.filter((p) => p.price <= filters.maxPrice!);
    }

    if (filters.inStock) {
      result = result.filter((p) => p.inventoryQuantity > 0);
    }

    if (filters.vendor) {
      result = result.filter((p) => p.vendor?.toLowerCase() === filters.vendor!.toLowerCase());
    }

    if (filters.tags && filters.tags.length > 0) {
      const tagSet = new Set(filters.tags.map((t) => t.toLowerCase()));
      result = result.filter((p) => p.tags.some((t) => tagSet.has(t.toLowerCase())));
    }

    return result;
  }

  private sortProducts(
    products: Product[],
    orderBy: NonNullable<ProductQueryParams['orderBy']>,
    orderDir: 'asc' | 'desc',
  ): Product[] {
    const sorted = [...products];
    const dir = orderDir === 'asc' ? 1 : -1;

    sorted.sort((a, b) => {
      switch (orderBy) {
        case 'title':
          return dir * a.title.localeCompare(b.title);
        case 'price':
          return dir * (a.price - b.price);
        case 'created_at':
          return dir * (a.createdAt.getTime() - b.createdAt.getTime());
        case 'updated_at':
          return dir * (a.updatedAt.getTime() - b.updatedAt.getTime());
        default:
          return 0;
      }
    });

    return sorted;
  }
}
