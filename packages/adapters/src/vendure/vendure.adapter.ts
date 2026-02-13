import { GraphQLClient } from 'graphql-request';
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
  VendureCredentials,
} from '@agentix/shared';
import { generateId, minutesFromNow } from '@agentix/shared';
import { BaseAdapter } from '../base/base.adapter';
import {
  SEARCH_PRODUCTS,
  GET_PRODUCT,
  GET_PRODUCT_BY_ID,
  ADD_ITEM_TO_ORDER,
  GET_ACTIVE_ORDER,
  SET_CUSTOMER,
  SET_SHIPPING_ADDRESS,
  GET_SHIPPING_METHODS,
  SET_SHIPPING_METHOD,
  TRANSITION_TO_ARRANGING_PAYMENT,
  ADD_PAYMENT,
} from './vendure.queries';

// eslint-disable-next-line @typescript-eslint/no-explicit-any -- Vendure GQL responses are untyped
type VendureResponse = any;

/**
 * Vendure adapter — connects to a Vendure instance via its Shop GraphQL API.
 * Ported from the Demo_2 reference implementation and adapted to the ISVAdapter interface.
 */
export class VendureAdapter extends BaseAdapter {
  readonly platform = 'VENDURE';
  readonly version = '1.0.0';

  private client: GraphQLClient | null = null;
  private apiUrl: string | null = null;
  private sessionToken: string | null = null;
  private reservations: Map<string, Reservation> = new Map();

  // ── Connection ────────────────────────────────────────────

  protected async doConnect(credentials: PlatformCredentials): Promise<ConnectionResult> {
    const creds = credentials as VendureCredentials;
    this.apiUrl = creds.apiUrl;
    this.client = new GraphQLClient(creds.apiUrl);

    if (creds.authToken) {
      this.client.setHeader('Authorization', `Bearer ${creds.authToken}`);
    }
    if (creds.channelToken) {
      this.client.setHeader('vendure-token', creds.channelToken);
    }

    // Verify connection by fetching a small search
    try {
      await this.gql(SEARCH_PRODUCTS, { term: '', take: 1 });
      return { success: true, shopName: creds.apiUrl };
    } catch (error) {
      throw new Error(
        `Failed to connect to Vendure at ${creds.apiUrl}: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }

  protected async doDisconnect(): Promise<void> {
    this.client = null;
    this.apiUrl = null;
    this.sessionToken = null;
  }

  protected async doTestConnection(): Promise<TestConnectionResult> {
    try {
      await this.gql(SEARCH_PRODUCTS, { term: '', take: 1 });
      return { success: true, shopName: this.apiUrl ?? undefined };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Connection test failed',
      };
    }
  }

  // ── Products ──────────────────────────────────────────────

  async getProducts(params: ProductQueryParams): Promise<PaginatedResult<Product>> {
    const take = params.limit ?? 20;
    const term = params.query ?? '';

    const data: VendureResponse = await this.gql(SEARCH_PRODUCTS, { term, take: take + (params.offset ?? 0) + 10 });
    let items: VendureResponse[] = data.search.items;
    const total = data.search.totalItems;

    // Apply additional filters client-side (Vendure search is limited)
    if (params.minPrice !== undefined) {
      items = items.filter((i: VendureResponse) => this.extractPrice(i) >= params.minPrice!);
    }
    if (params.maxPrice !== undefined) {
      items = items.filter((i: VendureResponse) => this.extractPrice(i) <= params.maxPrice!);
    }

    const offset = params.offset ?? 0;
    const page = items.slice(offset, offset + take);

    return {
      data: page.map((item: VendureResponse) => this.transformSearchItem(item)),
      total,
      limit: take,
      offset,
      hasMore: offset + take < total,
    };
  }

  async getProduct(id: string): Promise<Product | null> {
    // Try by ID first, then by slug
    try {
      const data: VendureResponse = await this.gql(GET_PRODUCT_BY_ID, { id });
      return data.product ? this.transformProduct(data.product) : null;
    } catch {
      // Fall back to slug lookup
      const data: VendureResponse = await this.gql(GET_PRODUCT, { slug: id });
      return data.product ? this.transformProduct(data.product) : null;
    }
  }

  async getProductBySku(sku: string): Promise<Product | null> {
    // Vendure doesn't have a direct SKU lookup — search and filter
    const data: VendureResponse = await this.gql(SEARCH_PRODUCTS, { term: sku, take: 10 });
    const match = data.search.items.find((i: VendureResponse) => i.sku === sku);
    if (!match) return null;
    // Fetch full product details via slug
    return this.getProduct(match.slug);
  }

  async searchProducts(query: string, filters?: ProductFilters): Promise<Product[]> {
    const data: VendureResponse = await this.gql(SEARCH_PRODUCTS, { term: query, take: 50 });
    let items: VendureResponse[] = data.search.items;

    if (filters?.minPrice !== undefined) {
      items = items.filter((i: VendureResponse) => this.extractPrice(i) >= filters.minPrice!);
    }
    if (filters?.maxPrice !== undefined) {
      items = items.filter((i: VendureResponse) => this.extractPrice(i) <= filters.maxPrice!);
    }

    return items.map((item: VendureResponse) => this.transformSearchItem(item));
  }

  async syncProducts(): Promise<SyncResult> {
    // Full sync would iterate all products. For now, return a stub.
    const start = Date.now();
    const data: VendureResponse = await this.gql(SEARCH_PRODUCTS, { term: '', take: 100 });
    const count = data.search.items.length;

    return {
      created: 0,
      updated: count,
      deleted: 0,
      failed: 0,
      errors: [],
      duration: Date.now() - start,
    };
  }

  // ── Inventory ─────────────────────────────────────────────

  async checkInventory(sku: string): Promise<InventoryStatus> {
    const product = await this.getProductBySku(sku);
    if (!product) {
      return { sku, quantity: 0, available: false, policy: 'DENY' };
    }

    const variant = product.variants?.find((v) => v.sku === sku);
    const quantity = variant ? variant.inventoryQuantity : product.inventoryQuantity;

    return {
      sku,
      quantity,
      available: quantity > 0,
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
    // 1. Add items to order
    let vendureOrder: VendureResponse;
    for (const item of checkout.items) {
      // Resolve variant ID — use variantId if provided, else search by SKU
      const variantId = item.variantId ?? (await this.resolveVariantId(item.sku));
      if (!variantId) {
        throw new Error(`Could not resolve variant for SKU ${item.sku}`);
      }

      const data: VendureResponse = await this.gql(ADD_ITEM_TO_ORDER, {
        productVariantId: variantId,
        quantity: item.quantity,
      });
      vendureOrder = this.handleMutationResult(data.addItemToOrder);
    }

    // 2. Set customer
    if (checkout.email) {
      const setCustomerData: VendureResponse = await this.gql(SET_CUSTOMER, {
        input: {
          emailAddress: checkout.email,
          firstName: checkout.shippingAddress?.name?.split(' ')[0] ?? 'Guest',
          lastName: checkout.shippingAddress?.name?.split(' ').slice(1).join(' ') ?? '',
        },
      });
      this.handleMutationResult(setCustomerData.setCustomerForOrder);
    }

    // 3. Set shipping address
    if (checkout.shippingAddress) {
      const addr = checkout.shippingAddress;
      const setAddrData: VendureResponse = await this.gql(SET_SHIPPING_ADDRESS, {
        input: {
          fullName: addr.name || 'Guest',
          streetLine1: addr.address1,
          streetLine2: addr.address2 || '',
          city: addr.city,
          province: addr.state,
          postalCode: addr.zip,
          countryCode: addr.country || 'US',
        },
      });
      this.handleMutationResult(setAddrData.setOrderShippingAddress);
    }

    // 4. Set shipping method
    if (checkout.shippingMethod) {
      const setShipData: VendureResponse = await this.gql(SET_SHIPPING_METHOD, {
        shippingMethodId: [checkout.shippingMethod],
      });
      this.handleMutationResult(setShipData.setOrderShippingMethod);
    }

    // 5. Transition to payment & add payment
    const transitionData: VendureResponse = await this.gql(TRANSITION_TO_ARRANGING_PAYMENT);
    this.handleMutationResult(transitionData.transitionOrderToState);

    const paymentData: VendureResponse = await this.gql(ADD_PAYMENT, {
      input: {
        method: checkout.paymentMethod ?? 'standard-payment',
        metadata: { checkoutId: checkout.id },
      },
    });
    const finalOrder = this.handleMutationResult(paymentData.addPaymentToOrder);

    return this.transformOrder(finalOrder, checkout);
  }

  async getOrder(id: string): Promise<Order | null> {
    // Vendure Shop API doesn't expose order-by-id for guests easily.
    // The active order is the best we can do in a session context.
    const data: VendureResponse = await this.gql(GET_ACTIVE_ORDER);
    if (!data.activeOrder || data.activeOrder.id !== id) return null;
    return this.transformOrder(data.activeOrder, null);
  }

  async updateOrderStatus(_id: string, _status: OrderStatus): Promise<Order> {
    // Order status transitions are managed via Vendure Admin API, not Shop API.
    throw new Error('VendureAdapter.updateOrderStatus: Requires Admin API — not yet implemented');
  }

  async cancelOrder(_id: string, _reason?: string): Promise<Order> {
    throw new Error('VendureAdapter.cancelOrder: Requires Admin API — not yet implemented');
  }

  // ── Shipping ──────────────────────────────────────────────

  async getShippingRates(_checkout: Checkout): Promise<ShippingMethod[]> {
    const data: VendureResponse = await this.gql(GET_SHIPPING_METHODS);
    return data.eligibleShippingMethods.map((m: VendureResponse) => ({
      id: String(m.id),
      title: m.name,
      description: m.description ?? undefined,
      price: m.priceWithTax,
      currency: 'USD',
    }));
  }

  // ── Webhooks ──────────────────────────────────────────────

  async registerWebhooks(_callbackUrl: string): Promise<WebhookRegistration[]> {
    // Vendure uses its event system / plugins for webhooks.
    return [];
  }

  async handleWebhook(_payload: unknown, _signature: string): Promise<WebhookResult> {
    return { event: 'unknown', processed: false };
  }

  // ── Private helpers ───────────────────────────────────────

  private async gql(query: string, variables?: Record<string, unknown>): Promise<VendureResponse> {
    if (!this.client) {
      throw new Error('VendureAdapter: Not connected. Call connect() first.');
    }

    const response = await this.client.rawRequest(query, variables);

    // Capture session token from response headers (for session-based auth)
    const headers = response.headers;
    let newToken: string | null = null;
    if (headers && typeof headers.get === 'function') {
      newToken = headers.get('vendure-auth-token');
    }
    if (newToken && newToken !== this.sessionToken) {
      this.sessionToken = newToken;
      this.client.setHeader('Authorization', `Bearer ${newToken}`);
    }

    return response.data;
  }

  private handleMutationResult(result: VendureResponse): VendureResponse {
    if (result.__typename === 'Order') {
      return result;
    }
    throw new Error(`Vendure mutation error: ${result.message} (${result.errorCode})`);
  }

  private extractPrice(searchItem: VendureResponse): number {
    const p = searchItem.priceWithTax;
    return p.value ?? p.min ?? 0;
  }

  private async resolveVariantId(sku: string): Promise<string | null> {
    const data: VendureResponse = await this.gql(SEARCH_PRODUCTS, { term: sku, take: 10 });
    const match = data.search.items.find((i: VendureResponse) => i.sku === sku);
    return match ? String(match.productVariantId) : null;
  }

  private transformSearchItem(item: VendureResponse): Product {
    const now = new Date();
    const price = this.extractPrice(item);

    return {
      id: String(item.productId),
      tenantId: '',
      externalId: String(item.productId),
      sku: item.sku ?? '',
      title: item.productName,
      description: item.description ?? undefined,
      price,
      currency: item.currencyCode ?? 'USD',
      images: item.productAsset
        ? [{ url: item.productAsset.preview, alt: item.productName }]
        : [],
      inventoryQuantity: 0, // not available from search
      inventoryPolicy: 'DENY',
      trackInventory: true,
      tags: [],
      hasVariants: false,
      aeoEnhanced: false,
      status: 'ACTIVE',
      lastSyncedAt: now,
      createdAt: now,
      updatedAt: now,
    };
  }

  private transformProduct(product: VendureResponse): Product {
    const now = new Date();
    const variants = product.variants?.map((v: VendureResponse) => ({
      id: String(v.id),
      sku: v.sku ?? '',
      title: v.name,
      price: v.priceWithTax ?? 0,
      inventoryQuantity: typeof v.stockLevel === 'number' ? v.stockLevel : parseInt(v.stockLevel, 10) || 0,
    })) ?? [];

    const firstVariant = variants[0];

    return {
      id: String(product.id),
      tenantId: '',
      externalId: String(product.id),
      sku: firstVariant?.sku ?? '',
      title: product.name,
      description: product.description ?? undefined,
      price: firstVariant?.price ?? 0,
      currency: product.variants?.[0]?.currencyCode ?? 'USD',
      images: [
        ...(product.featuredAsset ? [{ url: product.featuredAsset.preview, alt: product.name }] : []),
        ...(product.assets?.map((a: VendureResponse) => ({ url: a.preview, alt: product.name })) ?? []),
      ],
      inventoryQuantity: firstVariant?.inventoryQuantity ?? 0,
      inventoryPolicy: 'DENY',
      trackInventory: true,
      tags: [],
      hasVariants: variants.length > 1,
      variants: variants.length > 1 ? variants : undefined,
      aeoEnhanced: false,
      status: 'ACTIVE',
      lastSyncedAt: now,
      createdAt: now,
      updatedAt: now,
    };
  }

  private transformOrder(vendureOrder: VendureResponse, checkout: Checkout | null): Order {
    const now = new Date();
    const orderId = String(vendureOrder.id);

    return {
      id: orderId,
      tenantId: checkout?.tenantId ?? '',
      checkoutId: checkout?.id ?? '',
      externalId: vendureOrder.code ?? orderId,
      orderNumber: vendureOrder.code,
      status: this.mapVendureState(vendureOrder.state),
      items: (vendureOrder.lines ?? []).map((line: VendureResponse) => ({
        id: String(line.id),
        orderId,
        productId: String(line.productVariant?.id ?? ''),
        sku: line.productVariant?.sku ?? '',
        title: line.productVariant?.name ?? '',
        price: line.productVariant?.priceWithTax ?? 0,
        quantity: line.quantity,
        lineTotal: line.linePriceWithTax,
      })),
      email: vendureOrder.customer?.emailAddress ?? checkout?.email ?? '',
      shippingAddress: vendureOrder.shippingAddress ?? {},
      shippingMethod: vendureOrder.shippingLines?.[0]?.shippingMethod?.name,
      shippingCost: vendureOrder.shippingWithTax ?? 0,
      subtotal: vendureOrder.subTotalWithTax ?? 0,
      taxAmount: 0,
      totalAmount: vendureOrder.totalWithTax ?? 0,
      currency: vendureOrder.currencyCode ?? 'USD',
      paymentMethod: checkout?.paymentMethod,
      fulfillmentStatus: 'UNFULFILLED',
      source: 'agentix',
      protocol: checkout?.protocol ?? 'ACP',
      createdAt: now,
      updatedAt: now,
    };
  }

  private mapVendureState(state: string): OrderStatus {
    const map: Record<string, OrderStatus> = {
      AddingItems: 'PENDING',
      ArrangingPayment: 'PENDING',
      PaymentAuthorized: 'CONFIRMED',
      PaymentSettled: 'CONFIRMED',
      Shipped: 'SHIPPED',
      Delivered: 'DELIVERED',
      Cancelled: 'CANCELLED',
    };
    return map[state] ?? 'PENDING';
  }
}
