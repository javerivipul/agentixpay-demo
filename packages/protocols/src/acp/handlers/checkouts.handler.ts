import { Request, Response } from 'express';
import { getAdapter } from '@agentix/adapters';
import { prisma, decrypt, logger, NotFoundError, ValidationError } from '@agentix/core';
import {
  dollarsToCents,
  minutesFromNow,
  isExpired,
  generateId,
  canTransition,
} from '@agentix/shared';
import type { Platform, PlatformCredentials, ShippingMethod, CheckoutStatus } from '@agentix/shared';
import { CHECKOUT_EXPIRY_MINUTES } from '@agentix/shared';
import type {
  ACPCheckoutResponse,
  ACPLineItem,
  ACPFulfillmentOption,
  ACPTotal,
  ACPMessage,
  ACPAddress,
  ACPBuyer,
  ACPCheckoutStatus,
} from '../types/acp.types';
import type { ACPCreateCheckoutInput, ACPUpdateCheckoutInput, ACPCompleteCheckoutInput } from '../schemas/checkouts.schema';
import { Prisma } from '@prisma/client';

// ============================================
// Helpers
// ============================================

type CheckoutWithItems = Prisma.CheckoutGetPayload<{ include: { items: true } }>;

async function getAdapterForTenant(tenant: Express.Request['tenant']) {
  const t = tenant!;
  let credentials: PlatformCredentials | undefined;
  try {
    credentials = decrypt<PlatformCredentials>(t.platformConfig as string);
  } catch {
    // No valid credentials — adapter will use demo mode
  }
  return getAdapter(t.platform as Platform, credentials);
}

function toInternalStatus(acpStatus: ACPCheckoutStatus): CheckoutStatus {
  switch (acpStatus) {
    case 'not_ready_for_payment': return 'ITEMS_ADDED';
    case 'ready_for_payment': return 'PAYMENT_PENDING';
    case 'in_progress': return 'SHIPPING_SET';
    case 'completed': return 'COMPLETED';
    case 'canceled': return 'CANCELLED';
    default: return 'CREATED';
  }
}

function toACPStatus(internal: string): ACPCheckoutStatus {
  switch (internal) {
    case 'CREATED': return 'not_ready_for_payment';
    case 'ITEMS_ADDED': return 'not_ready_for_payment';
    case 'SHIPPING_SET': return 'not_ready_for_payment';
    case 'PAYMENT_PENDING': return 'ready_for_payment';
    case 'COMPLETED': return 'completed';
    case 'CANCELLED': return 'canceled';
    case 'EXPIRED': return 'canceled';
    case 'FAILED': return 'not_ready_for_payment';
    default: return 'not_ready_for_payment';
  }
}

function buildTotals(
  lineItems: ACPLineItem[],
  shippingOption?: ACPFulfillmentOption,
): ACPTotal[] {
  const subtotal = lineItems.reduce((sum, li) => sum + li.subtotal, 0);
  const discount = lineItems.reduce((sum, li) => sum + li.discount, 0);
  const tax = lineItems.reduce((sum, li) => sum + li.tax, 0);
  const fulfillment = shippingOption?.total ?? 0;
  const total = subtotal - discount + tax + fulfillment;

  const totals: ACPTotal[] = [
    { type: 'subtotal', display_text: 'Subtotal', amount: subtotal },
  ];
  if (discount > 0) {
    totals.push({ type: 'discount', display_text: 'Discount', amount: -discount });
  }
  if (fulfillment > 0) {
    totals.push({ type: 'fulfillment', display_text: shippingOption?.title ?? 'Shipping', amount: fulfillment });
  }
  if (tax > 0) {
    totals.push({ type: 'tax', display_text: 'Tax', amount: tax });
  }
  totals.push({ type: 'total', display_text: 'Total', amount: total });

  return totals;
}

interface DbProduct {
  id: string;
  sku: string;
  title: string;
  price: number;
}

async function buildLineItems(
  items: Array<{ id?: string; sku?: string; quantity: number }>,
  tenantId: string,
): Promise<{ lineItems: ACPLineItem[]; dbProducts: DbProduct[] }> {
  const lineItems: ACPLineItem[] = [];
  const dbProducts: DbProduct[] = [];

  for (const itemInput of items) {
    // Look up product from database (correct IDs and dollar prices)
    let dbProduct = null;
    if (itemInput.sku) {
      dbProduct = await prisma.product.findFirst({
        where: { tenantId, sku: itemInput.sku, status: 'ACTIVE' },
      });
    } else if (itemInput.id) {
      dbProduct = await prisma.product.findFirst({
        where: { tenantId, id: itemInput.id, status: 'ACTIVE' },
      });
    }

    if (dbProduct) {
      const quantity = itemInput.quantity;
      const priceDollars = Number(dbProduct.price);
      const priceCents = dollarsToCents(priceDollars);
      const baseAmount = priceCents * quantity;

      lineItems.push({
        id: generateId('li'),
        item: { id: dbProduct.id, quantity },
        base_amount: baseAmount,
        discount: 0,
        subtotal: baseAmount,
        tax: 0,
        total: baseAmount,
      });
      dbProducts.push({
        id: dbProduct.id,
        sku: dbProduct.sku,
        title: dbProduct.title,
        price: priceDollars,
      });
    }
  }

  return { lineItems, dbProducts };
}

async function buildFulfillmentOptions(
  adapter: Awaited<ReturnType<typeof getAdapter>>,
): Promise<ACPFulfillmentOption[]> {
  try {
    // Pass a minimal checkout object to get shipping rates
    const methods: ShippingMethod[] = await adapter.getShippingRates({} as never);
    return methods.map((m) => ({
      type: 'shipping' as const,
      id: m.id,
      title: m.title,
      subtitle: m.estimatedDays ? `${m.estimatedDays} days` : undefined,
      carrier: m.carrier,
      subtotal: dollarsToCents(m.price),
      tax: 0,
      total: dollarsToCents(m.price),
    }));
  } catch {
    return [];
  }
}

function toACPCheckoutResponse(
  checkout: CheckoutWithItems,
  lineItems: ACPLineItem[],
  fulfillmentOptions: ACPFulfillmentOption[],
  messages: ACPMessage[] = [],
): ACPCheckoutResponse {
  const selectedOption = checkout.shippingMethod
    ? fulfillmentOptions.find((o) => o.id === checkout.shippingMethod)
    : undefined;
  const totals = buildTotals(lineItems, selectedOption);

  let fulfillmentAddress: ACPAddress | undefined;
  if (checkout.shippingAddress) {
    const addr = checkout.shippingAddress as Record<string, string>;
    fulfillmentAddress = {
      name: addr['name'] ?? '',
      line_one: addr['address1'] ?? '',
      line_two: addr['address2'],
      city: addr['city'] ?? '',
      state: addr['state'] ?? '',
      country: addr['country'] ?? '',
      postal_code: addr['zip'] ?? '',
    };
  }

  let buyer: ACPBuyer | undefined;
  if (checkout.email) {
    const meta = checkout.metadata as Record<string, unknown> | null;
    buyer = {
      first_name: (meta?.['buyer_first_name'] as string) ?? '',
      last_name: (meta?.['buyer_last_name'] as string) ?? '',
      email: checkout.email,
      phone_number: meta?.['buyer_phone'] as string | undefined,
    };
  }

  return {
    id: checkout.id,
    status: toACPStatus(checkout.status),
    currency: checkout.currency.toLowerCase(),
    buyer,
    payment_provider: {
      provider: 'stripe',
      supported_payment_methods: ['card'],
    },
    line_items: lineItems,
    fulfillment_address: fulfillmentAddress,
    fulfillment_options: fulfillmentOptions,
    fulfillment_option_id: checkout.shippingMethod ?? undefined,
    totals,
    messages,
    links: [
      { type: 'terms_of_use', url: 'https://agentix.com/terms' },
      { type: 'privacy_policy', url: 'https://agentix.com/privacy' },
    ],
  };
}

function recordEvent(checkoutId: string, type: string, data?: unknown): void {
  prisma.checkoutEvent.create({
    data: { checkoutId, type, data: data as Prisma.InputJsonValue },
  }).catch((err: unknown) => {
    logger.error('Failed to record checkout event', { checkoutId, type, error: err });
  });
}

// ============================================
// POST /acp/v1/checkouts
// ============================================

export async function createCheckout(req: Request, res: Response): Promise<void> {
  const tenant = req.tenant!;
  const body = req.body as ACPCreateCheckoutInput;

  try {
    const adapter = await getAdapterForTenant(tenant);
    const { lineItems, dbProducts } = await buildLineItems(body.items, tenant.id);

    if (lineItems.length === 0) {
      res.status(400).json({
        success: false,
        error: { code: 'INVALID_ITEMS', message: 'No valid products found for the given items' },
      });
      return;
    }

    const fulfillmentOptions = await buildFulfillmentOptions(adapter);
    const selectedOptionId = body.fulfillment_option_id ?? fulfillmentOptions[0]?.id;
    const selectedOption = fulfillmentOptions.find((o) => o.id === selectedOptionId);

    const totals = buildTotals(lineItems, selectedOption);
    const totalEntry = totals.find((t) => t.type === 'total');
    const subtotalEntry = totals.find((t) => t.type === 'subtotal');

    // Determine initial status based on whether address is provided
    const hasAddress = !!body.fulfillment_address;
    const internalStatus: CheckoutStatus = hasAddress ? 'PAYMENT_PENDING' : 'ITEMS_ADDED';

    // Store buyer info in metadata
    const metadata: Record<string, unknown> = { ...(body.metadata ?? {}) };
    if (body.buyer) {
      metadata['buyer_first_name'] = body.buyer.first_name;
      metadata['buyer_last_name'] = body.buyer.last_name;
      metadata['buyer_phone'] = body.buyer.phone_number;
    }

    // Build shipping address JSON
    let shippingAddress: Prisma.InputJsonValue | undefined;
    if (body.fulfillment_address) {
      shippingAddress = {
        name: body.fulfillment_address.name,
        address1: body.fulfillment_address.line_one,
        address2: body.fulfillment_address.line_two ?? '',
        city: body.fulfillment_address.city,
        state: body.fulfillment_address.state,
        zip: body.fulfillment_address.postal_code,
        country: body.fulfillment_address.country,
      };
    }

    const checkout = await prisma.checkout.create({
      data: {
        tenantId: tenant.id,
        protocol: 'ACP',
        status: internalStatus,
        email: body.buyer?.email,
        shippingAddress: shippingAddress ?? Prisma.JsonNull,
        shippingMethod: selectedOptionId,
        shippingCost: selectedOption ? selectedOption.total / 100 : 0,
        subtotal: (subtotalEntry?.amount ?? 0) / 100,
        taxAmount: 0,
        totalAmount: (totalEntry?.amount ?? 0) / 100,
        currency: 'USD',
        metadata: metadata as Prisma.InputJsonValue,
        expiresAt: minutesFromNow(CHECKOUT_EXPIRY_MINUTES),
        items: {
          create: lineItems.map((li, i) => {
            const dbProd = dbProducts[i]!;
            return {
              productId: dbProd.id,
              sku: dbProd.sku,
              title: dbProd.title,
              price: dbProd.price,
              quantity: li.item.quantity,
              lineTotal: (li.total / 100),
            };
          }),
        },
      },
      include: { items: true },
    });

    recordEvent(checkout.id, 'CHECKOUT_CREATED', { itemCount: lineItems.length });

    logger.info('Checkout created', { tenantId: tenant.id, checkoutId: checkout.id });

    const response = toACPCheckoutResponse(checkout, lineItems, fulfillmentOptions);
    res.status(201).json(response);
  } catch (error) {
    logger.error('Failed to create checkout', {
      tenantId: tenant.id,
      error: error instanceof Error ? error.message : String(error),
    });
    res.status(500).json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: 'Failed to create checkout' },
    });
  }
}

// ============================================
// GET /acp/v1/checkouts/:id
// ============================================

export async function getCheckout(req: Request, res: Response): Promise<void> {
  const tenant = req.tenant!;
  const id = req.params['id']!;

  try {
    const checkout = await prisma.checkout.findFirst({
      where: { id, tenantId: tenant.id },
      include: { items: true },
    });

    if (!checkout) {
      res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: `Checkout '${id}' not found` },
      });
      return;
    }

    // Check expiry
    if (isExpired(checkout.expiresAt) && !['COMPLETED', 'CANCELLED', 'EXPIRED'].includes(checkout.status)) {
      await prisma.checkout.update({
        where: { id: checkout.id },
        data: { status: 'EXPIRED' },
      });
      checkout.status = 'EXPIRED';
    }

    const adapter = await getAdapterForTenant(tenant);
    const fulfillmentOptions = await buildFulfillmentOptions(adapter);

    // Rebuild line items from stored checkout items
    const lineItems: ACPLineItem[] = checkout.items.map((item) => {
      const priceCents = dollarsToCents(Number(item.price));
      const baseAmount = priceCents * item.quantity;
      return {
        id: item.id,
        item: { id: item.productId, quantity: item.quantity },
        base_amount: baseAmount,
        discount: 0,
        subtotal: baseAmount,
        tax: 0,
        total: baseAmount,
      };
    });

    const response = toACPCheckoutResponse(checkout, lineItems, fulfillmentOptions);
    res.json(response);
  } catch (error) {
    logger.error('Failed to get checkout', {
      tenantId: tenant.id,
      checkoutId: id,
      error: error instanceof Error ? error.message : String(error),
    });
    res.status(500).json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch checkout' },
    });
  }
}

// ============================================
// PUT /acp/v1/checkouts/:id
// ============================================

export async function updateCheckout(req: Request, res: Response): Promise<void> {
  const tenant = req.tenant!;
  const id = req.params['id']!;
  const body = req.body as ACPUpdateCheckoutInput;

  try {
    const existing = await prisma.checkout.findFirst({
      where: { id, tenantId: tenant.id },
      include: { items: true },
    });

    if (!existing) {
      res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: `Checkout '${id}' not found` },
      });
      return;
    }

    if (['COMPLETED', 'CANCELLED', 'EXPIRED'].includes(existing.status)) {
      res.status(409).json({
        success: false,
        error: { code: 'CHECKOUT_CLOSED', message: 'Cannot update a completed, cancelled, or expired checkout' },
      });
      return;
    }

    if (isExpired(existing.expiresAt)) {
      await prisma.checkout.update({ where: { id }, data: { status: 'EXPIRED' } });
      res.status(409).json({
        success: false,
        error: { code: 'CHECKOUT_EXPIRED', message: 'Checkout has expired' },
      });
      return;
    }

    const adapter = await getAdapterForTenant(tenant);
    const updateData: Prisma.CheckoutUpdateInput = {};
    let lineItems: ACPLineItem[];

    // Update items if provided
    if (body.items) {
      const result = await buildLineItems(body.items, tenant.id);
      lineItems = result.lineItems;

      // Delete old items and create new ones
      await prisma.checkoutItem.deleteMany({ where: { checkoutId: id } });
      await prisma.checkoutItem.createMany({
        data: result.lineItems.map((li, i) => {
          const dbProd = result.dbProducts[i]!;
          return {
            checkoutId: id,
            productId: dbProd.id,
            sku: dbProd.sku,
            title: dbProd.title,
            price: dbProd.price,
            quantity: li.item.quantity,
            lineTotal: li.total / 100,
          };
        }),
      });
    } else {
      lineItems = existing.items.map((item) => {
        const priceCents = dollarsToCents(Number(item.price));
        const baseAmount = priceCents * item.quantity;
        return {
          id: item.id,
          item: { id: item.productId, quantity: item.quantity },
          base_amount: baseAmount,
          discount: 0,
          subtotal: baseAmount,
          tax: 0,
          total: baseAmount,
        };
      });
    }

    // Update buyer
    if (body.buyer) {
      updateData.email = body.buyer.email;
      const existingMeta = (existing.metadata as Record<string, unknown>) ?? {};
      updateData.metadata = {
        ...existingMeta,
        buyer_first_name: body.buyer.first_name,
        buyer_last_name: body.buyer.last_name,
        buyer_phone: body.buyer.phone_number,
      } as Prisma.InputJsonValue;
    }

    // Update fulfillment address
    if (body.fulfillment_address) {
      updateData.shippingAddress = {
        name: body.fulfillment_address.name,
        address1: body.fulfillment_address.line_one,
        address2: body.fulfillment_address.line_two ?? '',
        city: body.fulfillment_address.city,
        state: body.fulfillment_address.state,
        zip: body.fulfillment_address.postal_code,
        country: body.fulfillment_address.country,
      };
    }

    // Update fulfillment option
    if (body.fulfillment_option_id) {
      updateData.shippingMethod = body.fulfillment_option_id;
    }

    // Determine new status — advance through intermediate states
    const hasAddress = body.fulfillment_address || existing.shippingAddress;
    let newStatus = existing.status as CheckoutStatus;
    if (body.items && canTransition(newStatus, 'ITEMS_ADDED')) {
      newStatus = 'ITEMS_ADDED';
    }
    if (hasAddress && canTransition(newStatus, 'SHIPPING_SET')) {
      newStatus = 'SHIPPING_SET';
    }
    if (hasAddress && canTransition(newStatus, 'PAYMENT_PENDING')) {
      newStatus = 'PAYMENT_PENDING';
    }
    updateData.status = newStatus;

    // Recalculate totals
    const fulfillmentOptions = await buildFulfillmentOptions(adapter);
    const selectedOptionId = body.fulfillment_option_id ?? existing.shippingMethod;
    const selectedOption = selectedOptionId
      ? fulfillmentOptions.find((o) => o.id === selectedOptionId)
      : undefined;
    const totals = buildTotals(lineItems, selectedOption);
    const totalEntry = totals.find((t) => t.type === 'total');
    const subtotalEntry = totals.find((t) => t.type === 'subtotal');

    updateData.subtotal = (subtotalEntry?.amount ?? 0) / 100;
    updateData.totalAmount = (totalEntry?.amount ?? 0) / 100;
    if (selectedOption) {
      updateData.shippingCost = selectedOption.total / 100;
    }

    const updated = await prisma.checkout.update({
      where: { id },
      data: updateData,
      include: { items: true },
    });

    recordEvent(id, 'CHECKOUT_UPDATED', {
      hasNewItems: !!body.items,
      hasNewAddress: !!body.fulfillment_address,
    });

    const response = toACPCheckoutResponse(updated, lineItems, fulfillmentOptions);
    res.json(response);
  } catch (error) {
    logger.error('Failed to update checkout', {
      tenantId: tenant.id,
      checkoutId: id,
      error: error instanceof Error ? error.message : String(error),
    });
    res.status(500).json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: 'Failed to update checkout' },
    });
  }
}

// ============================================
// POST /acp/v1/checkouts/:id/complete
// ============================================

export async function completeCheckout(req: Request, res: Response): Promise<void> {
  const tenant = req.tenant!;
  const id = req.params['id']!;
  const body = req.body as ACPCompleteCheckoutInput;

  try {
    const existing = await prisma.checkout.findFirst({
      where: { id, tenantId: tenant.id },
      include: { items: true },
    });

    if (!existing) {
      res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: `Checkout '${id}' not found` },
      });
      return;
    }

    if (isExpired(existing.expiresAt) && existing.status !== 'COMPLETED') {
      await prisma.checkout.update({ where: { id }, data: { status: 'EXPIRED' } });
      res.status(409).json({
        success: false,
        error: { code: 'CHECKOUT_EXPIRED', message: 'Checkout has expired' },
      });
      return;
    }

    if (!canTransition(existing.status as CheckoutStatus, 'COMPLETED')) {
      res.status(409).json({
        success: false,
        error: {
          code: 'INVALID_STATE',
          message: `Cannot complete checkout in '${existing.status}' status`,
        },
      });
      return;
    }

    // Validate payment token (simulated SPT validation)
    const token = body.payment_token.token;
    if (!token.startsWith('spt_')) {
      const adapter = await getAdapterForTenant(tenant);
      const fulfillmentOptions = await buildFulfillmentOptions(adapter);
      const lineItems: ACPLineItem[] = existing.items.map((item) => {
        const priceCents = dollarsToCents(Number(item.price));
        const baseAmount = priceCents * item.quantity;
        return {
          id: item.id,
          item: { id: item.productId, quantity: item.quantity },
          base_amount: baseAmount,
          discount: 0,
          subtotal: baseAmount,
          tax: 0,
          total: baseAmount,
        };
      });

      const messages: ACPMessage[] = [{
        type: 'error',
        code: 'payment_declined',
        content_type: 'plain',
        content: "Invalid payment token. Token must start with 'spt_'.",
      }];

      const response = toACPCheckoutResponse(existing, lineItems, fulfillmentOptions, messages);
      res.status(400).json(response);
      return;
    }

    // Complete the checkout
    const updated = await prisma.checkout.update({
      where: { id },
      data: {
        status: 'COMPLETED',
        paymentToken: token,
        paymentStatus: 'CAPTURED',
        paymentMethod: 'card',
        completedAt: new Date(),
      },
      include: { items: true },
    });

    // Create order from checkout
    try {
      await prisma.order.create({
        data: {
          tenantId: tenant.id,
          checkoutId: id,
          externalId: generateId('ord'),
          orderNumber: `ORD-${id.substring(0, 8).toUpperCase()}`,
          status: 'CONFIRMED',
          email: updated.email ?? '',
          shippingAddress: updated.shippingAddress ?? {},
          shippingMethod: updated.shippingMethod,
          shippingCost: updated.shippingCost ?? 0,
          subtotal: updated.subtotal,
          taxAmount: updated.taxAmount,
          totalAmount: updated.totalAmount,
          currency: updated.currency,
          paymentMethod: 'card',
          paymentReference: token,
          source: 'acp',
          protocol: 'ACP',
          items: {
            create: updated.items.map((item) => ({
              productId: item.productId,
              sku: item.sku,
              title: item.title,
              price: item.price,
              quantity: item.quantity,
              variantId: item.variantId,
              variantTitle: item.variantTitle,
              lineTotal: item.lineTotal,
            })),
          },
        },
      });
    } catch (orderError) {
      logger.error('Failed to create order from checkout', {
        checkoutId: id,
        error: orderError instanceof Error ? orderError.message : String(orderError),
      });
    }

    recordEvent(id, 'CHECKOUT_COMPLETED', { paymentMethod: 'card' });

    const adapter = await getAdapterForTenant(tenant);
    const fulfillmentOptions = await buildFulfillmentOptions(adapter);
    const lineItems: ACPLineItem[] = updated.items.map((item) => {
      const priceCents = dollarsToCents(Number(item.price));
      const baseAmount = priceCents * item.quantity;
      return {
        id: item.id,
        item: { id: item.productId, quantity: item.quantity },
        base_amount: baseAmount,
        discount: 0,
        subtotal: baseAmount,
        tax: 0,
        total: baseAmount,
      };
    });

    const messages: ACPMessage[] = [{
      type: 'info',
      content_type: 'plain',
      content: `Order confirmed! Order #ORD-${id.substring(0, 8).toUpperCase()}`,
    }];

    const response = toACPCheckoutResponse(updated, lineItems, fulfillmentOptions, messages);
    res.json(response);
  } catch (error) {
    logger.error('Failed to complete checkout', {
      tenantId: tenant.id,
      checkoutId: id,
      error: error instanceof Error ? error.message : String(error),
    });
    res.status(500).json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: 'Failed to complete checkout' },
    });
  }
}

// ============================================
// DELETE /acp/v1/checkouts/:id
// ============================================

export async function cancelCheckout(req: Request, res: Response): Promise<void> {
  const tenant = req.tenant!;
  const id = req.params['id']!;

  try {
    const existing = await prisma.checkout.findFirst({
      where: { id, tenantId: tenant.id },
      include: { items: true },
    });

    if (!existing) {
      res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: `Checkout '${id}' not found` },
      });
      return;
    }

    if (!canTransition(existing.status as CheckoutStatus, 'CANCELLED')) {
      res.status(409).json({
        success: false,
        error: {
          code: 'INVALID_STATE',
          message: `Cannot cancel checkout in '${existing.status}' status`,
        },
      });
      return;
    }

    const updated = await prisma.checkout.update({
      where: { id },
      data: { status: 'CANCELLED', cancelledAt: new Date() },
      include: { items: true },
    });

    recordEvent(id, 'CHECKOUT_CANCELLED');

    const adapter = await getAdapterForTenant(tenant);
    const fulfillmentOptions = await buildFulfillmentOptions(adapter);
    const lineItems: ACPLineItem[] = updated.items.map((item) => {
      const priceCents = dollarsToCents(Number(item.price));
      const baseAmount = priceCents * item.quantity;
      return {
        id: item.id,
        item: { id: item.productId, quantity: item.quantity },
        base_amount: baseAmount,
        discount: 0,
        subtotal: baseAmount,
        tax: 0,
        total: baseAmount,
      };
    });

    const messages: ACPMessage[] = [{
      type: 'info',
      content_type: 'plain',
      content: 'Checkout cancelled',
    }];

    const response = toACPCheckoutResponse(updated, lineItems, fulfillmentOptions, messages);
    res.json(response);
  } catch (error) {
    logger.error('Failed to cancel checkout', {
      tenantId: tenant.id,
      checkoutId: id,
      error: error instanceof Error ? error.message : String(error),
    });
    res.status(500).json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: 'Failed to cancel checkout' },
    });
  }
}
