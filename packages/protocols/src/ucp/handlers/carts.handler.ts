import { Request, Response } from 'express';
import { getAdapter } from '@agentix/adapters';
import { prisma, decrypt, logger } from '@agentix/core';
import {
  dollarsToCents,
  minutesFromNow,
  isExpired,
  generateId,
  canTransition,
} from '@agentix/shared';
import { CHECKOUT_EXPIRY_MINUTES } from '@agentix/shared';
import type { Platform, PlatformCredentials, ShippingMethod, CheckoutStatus } from '@agentix/shared';
import type {
  UCPCartResponse,
  UCPCartItem,
  UCPShippingMethodOption,
  UCPShippingAddress,
  UCPMoney,
} from '../types/ucp.types';
import type { UCPCreateCartInput, UCPUpdateCartInput } from '../schemas/ucp.schemas';
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
    // demo mode
  }
  return getAdapter(t.platform as Platform, credentials);
}

function money(amount: number, currency = 'USD'): UCPMoney {
  return { amount, currency_code: currency };
}

async function getShippingOptions(
  adapter: Awaited<ReturnType<typeof getAdapter>>,
  currency: string,
): Promise<UCPShippingMethodOption[]> {
  try {
    const methods: ShippingMethod[] = await adapter.getShippingRates({} as never);
    return methods.map((m) => ({
      id: m.id,
      title: m.title,
      description: m.estimatedDays ? `${m.estimatedDays} delivery` : undefined,
      price: money(dollarsToCents(m.price), currency),
      estimated_delivery: m.estimatedDays,
    }));
  } catch {
    return [];
  }
}

function toUCPCartResponse(
  checkout: CheckoutWithItems,
  shippingOptions: UCPShippingMethodOption[],
): UCPCartResponse {
  const currency = checkout.currency;

  const items: UCPCartItem[] = checkout.items.map((item) => ({
    id: item.id,
    product_id: item.productId,
    variant_id: item.variantId ?? undefined,
    title: item.title,
    sku: item.sku,
    quantity: item.quantity,
    unit_price: money(dollarsToCents(Number(item.price)), currency),
    line_total: money(dollarsToCents(Number(item.lineTotal)), currency),
  }));

  let ucpStatus: 'open' | 'ready' | 'completed' | 'cancelled' = 'open';
  switch (checkout.status) {
    case 'PAYMENT_PENDING':
      ucpStatus = 'ready';
      break;
    case 'COMPLETED':
      ucpStatus = 'completed';
      break;
    case 'CANCELLED':
    case 'EXPIRED':
      ucpStatus = 'cancelled';
      break;
    default:
      ucpStatus = 'open';
  }

  let shippingAddress: UCPShippingAddress | undefined;
  if (checkout.shippingAddress) {
    const addr = checkout.shippingAddress as Record<string, string>;
    shippingAddress = {
      recipient_name: addr['name'] ?? '',
      street_address: addr['address1'] ?? '',
      street_address_2: addr['address2'],
      city: addr['city'] ?? '',
      region: addr['state'] ?? '',
      postal_code: addr['zip'] ?? '',
      country_code: addr['country'] ?? '',
    };
  }

  return {
    id: checkout.id,
    status: ucpStatus,
    items,
    subtotal: money(dollarsToCents(Number(checkout.subtotal)), currency),
    tax: money(dollarsToCents(Number(checkout.taxAmount)), currency),
    shipping: money(dollarsToCents(Number(checkout.shippingCost ?? 0)), currency),
    total: money(dollarsToCents(Number(checkout.totalAmount)), currency),
    shipping_address: shippingAddress,
    available_shipping_methods: shippingOptions,
    selected_shipping_method_id: checkout.shippingMethod ?? undefined,
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
// POST /ucp/v1/carts
// ============================================

export async function createCart(req: Request, res: Response): Promise<void> {
  const tenant = req.tenant!;
  const body = req.body as UCPCreateCartInput;

  try {
    const adapter = await getAdapterForTenant(tenant);

    // Look up products from database by ID
    const dbProducts = await prisma.product.findMany({
      where: {
        tenantId: tenant.id,
        id: { in: body.items.map((i) => i.product_id) },
        status: 'ACTIVE',
      },
    });

    if (dbProducts.length === 0) {
      res.status(400).json({
        success: false,
        error: { code: 'INVALID_ITEMS', message: 'No valid products found' },
      });
      return;
    }

    const productMap = new Map(dbProducts.map((p) => [p.id, p]));

    // Calculate subtotal
    let subtotal = 0;
    const itemsData = body.items
      .filter((input) => productMap.has(input.product_id))
      .map((input) => {
        const dbProd = productMap.get(input.product_id)!;
        const price = Number(dbProd.price);
        const lineTotal = price * input.quantity;
        subtotal += lineTotal;
        return {
          productId: dbProd.id,
          sku: dbProd.sku,
          title: dbProd.title,
          price,
          quantity: input.quantity,
          variantId: input.variant_id,
          lineTotal,
        };
      });

    const checkout = await prisma.checkout.create({
      data: {
        tenantId: tenant.id,
        protocol: 'UCP',
        status: 'ITEMS_ADDED',
        subtotal,
        taxAmount: 0,
        totalAmount: subtotal,
        currency: 'USD',
        expiresAt: minutesFromNow(CHECKOUT_EXPIRY_MINUTES),
        items: { create: itemsData },
      },
      include: { items: true },
    });

    recordEvent(checkout.id, 'CART_CREATED', { itemCount: itemsData.length });

    const shippingOptions = await getShippingOptions(adapter, 'USD');
    const response = toUCPCartResponse(checkout, shippingOptions);

    res.status(201).json(response);
  } catch (error) {
    logger.error('Failed to create cart', {
      tenantId: tenant.id,
      error: error instanceof Error ? error.message : String(error),
    });
    res.status(500).json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: 'Failed to create cart' },
    });
  }
}

// ============================================
// GET /ucp/v1/carts/:id
// ============================================

export async function getCart(req: Request, res: Response): Promise<void> {
  const tenant = req.tenant!;
  const id = req.params['id']!;

  try {
    const checkout = await prisma.checkout.findFirst({
      where: { id, tenantId: tenant.id, protocol: 'UCP' },
      include: { items: true },
    });

    if (!checkout) {
      res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: `Cart '${id}' not found` },
      });
      return;
    }

    if (isExpired(checkout.expiresAt) && !['COMPLETED', 'CANCELLED', 'EXPIRED'].includes(checkout.status)) {
      await prisma.checkout.update({ where: { id }, data: { status: 'EXPIRED' } });
      checkout.status = 'EXPIRED';
    }

    const adapter = await getAdapterForTenant(tenant);
    const shippingOptions = await getShippingOptions(adapter, checkout.currency);
    const response = toUCPCartResponse(checkout, shippingOptions);

    res.json(response);
  } catch (error) {
    logger.error('Failed to get cart', {
      tenantId: tenant.id,
      cartId: id,
      error: error instanceof Error ? error.message : String(error),
    });
    res.status(500).json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch cart' },
    });
  }
}

// ============================================
// PUT /ucp/v1/carts/:id
// ============================================

export async function updateCart(req: Request, res: Response): Promise<void> {
  const tenant = req.tenant!;
  const id = req.params['id']!;
  const body = req.body as UCPUpdateCartInput;

  try {
    const existing = await prisma.checkout.findFirst({
      where: { id, tenantId: tenant.id, protocol: 'UCP' },
      include: { items: true },
    });

    if (!existing) {
      res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: `Cart '${id}' not found` },
      });
      return;
    }

    if (['COMPLETED', 'CANCELLED', 'EXPIRED'].includes(existing.status)) {
      res.status(409).json({
        success: false,
        error: { code: 'CART_CLOSED', message: 'Cannot update a closed cart' },
      });
      return;
    }

    if (isExpired(existing.expiresAt)) {
      await prisma.checkout.update({ where: { id }, data: { status: 'EXPIRED' } });
      res.status(409).json({
        success: false,
        error: { code: 'CART_EXPIRED', message: 'Cart has expired' },
      });
      return;
    }

    const adapter = await getAdapterForTenant(tenant);
    const updateData: Prisma.CheckoutUpdateInput = {};
    let subtotal = Number(existing.subtotal);

    // Update items
    if (body.items) {
      const dbProducts = await prisma.product.findMany({
        where: {
          tenantId: tenant.id,
          id: { in: body.items.map((i) => i.product_id) },
          status: 'ACTIVE',
        },
      });
      const productMap = new Map(dbProducts.map((p) => [p.id, p]));

      await prisma.checkoutItem.deleteMany({ where: { checkoutId: id } });

      subtotal = 0;
      const itemsData = body.items
        .filter((input) => productMap.has(input.product_id))
        .map((input) => {
          const dbProd = productMap.get(input.product_id)!;
          const price = Number(dbProd.price);
          const lineTotal = price * input.quantity;
          subtotal += lineTotal;
          return {
            checkoutId: id,
            productId: dbProd.id,
            sku: dbProd.sku,
            title: dbProd.title,
            price,
            quantity: input.quantity,
            variantId: input.variant_id,
            lineTotal,
          };
        });

      await prisma.checkoutItem.createMany({ data: itemsData });
      updateData.subtotal = subtotal;
    }

    // Update shipping address
    if (body.shipping_address) {
      updateData.shippingAddress = {
        name: body.shipping_address.recipient_name,
        address1: body.shipping_address.street_address,
        address2: body.shipping_address.street_address_2 ?? '',
        city: body.shipping_address.city,
        state: body.shipping_address.region,
        zip: body.shipping_address.postal_code,
        country: body.shipping_address.country_code,
        phone: body.shipping_address.phone,
      };
    }

    // Update shipping method
    let shippingCost = Number(existing.shippingCost ?? 0);
    if (body.shipping_method_id) {
      updateData.shippingMethod = body.shipping_method_id;
      const shippingOptions = await getShippingOptions(adapter, existing.currency);
      const selected = shippingOptions.find((o) => o.id === body.shipping_method_id);
      if (selected) {
        shippingCost = selected.price.amount / 100;
        updateData.shippingCost = shippingCost;
      }
    }

    // Determine status
    const hasAddress = body.shipping_address || existing.shippingAddress;
    let newStatus = existing.status as CheckoutStatus;
    if (hasAddress && canTransition(newStatus, 'PAYMENT_PENDING')) {
      newStatus = 'PAYMENT_PENDING';
    }
    updateData.status = newStatus;

    // Recalculate total
    updateData.totalAmount = subtotal + shippingCost;

    const updated = await prisma.checkout.update({
      where: { id },
      data: updateData,
      include: { items: true },
    });

    recordEvent(id, 'CART_UPDATED');

    const shippingOptions = await getShippingOptions(adapter, updated.currency);
    const response = toUCPCartResponse(updated, shippingOptions);

    res.json(response);
  } catch (error) {
    logger.error('Failed to update cart', {
      tenantId: tenant.id,
      cartId: id,
      error: error instanceof Error ? error.message : String(error),
    });
    res.status(500).json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: 'Failed to update cart' },
    });
  }
}
