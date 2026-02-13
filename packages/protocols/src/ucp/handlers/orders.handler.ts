import { Request, Response } from 'express';
import { prisma, decrypt, logger } from '@agentix/core';
import {
  dollarsToCents,
  generateId,
  isExpired,
  canTransition,
} from '@agentix/shared';
import type { CheckoutStatus } from '@agentix/shared';
import type {
  UCPOrderResponse,
  UCPCartItem,
  UCPShippingAddress,
  UCPMoney,
} from '../types/ucp.types';
import type { UCPCreateOrderInput } from '../schemas/ucp.schemas';
import { Prisma } from '@prisma/client';

function money(amount: number, currency = 'USD'): UCPMoney {
  return { amount, currency_code: currency };
}

function toUCPOrderResponse(
  order: Prisma.OrderGetPayload<{ include: { items: true } }>,
): UCPOrderResponse {
  const currency = order.currency;

  const items: UCPCartItem[] = order.items.map((item) => ({
    id: item.id,
    product_id: item.productId,
    variant_id: item.variantId ?? undefined,
    title: item.title,
    sku: item.sku,
    quantity: item.quantity,
    unit_price: money(dollarsToCents(Number(item.price)), currency),
    line_total: money(dollarsToCents(Number(item.lineTotal)), currency),
  }));

  const addr = order.shippingAddress as Record<string, string>;
  const shippingAddress: UCPShippingAddress = {
    recipient_name: addr['name'] ?? '',
    street_address: addr['address1'] ?? '',
    street_address_2: addr['address2'],
    city: addr['city'] ?? '',
    region: addr['state'] ?? '',
    postal_code: addr['zip'] ?? '',
    country_code: addr['country'] ?? '',
  };

  let status: UCPOrderResponse['status'] = 'pending';
  switch (order.status) {
    case 'CONFIRMED': status = 'confirmed'; break;
    case 'PROCESSING': status = 'processing'; break;
    case 'SHIPPED': status = 'shipped'; break;
    case 'DELIVERED': status = 'delivered'; break;
    case 'CANCELLED':
    case 'REFUNDED':
      status = 'cancelled'; break;
    default: status = 'pending';
  }

  const response: UCPOrderResponse = {
    id: order.id,
    cart_id: order.checkoutId,
    status,
    order_number: order.orderNumber ?? order.externalId,
    items,
    subtotal: money(dollarsToCents(Number(order.subtotal)), currency),
    tax: money(dollarsToCents(Number(order.taxAmount)), currency),
    shipping: money(dollarsToCents(Number(order.shippingCost)), currency),
    total: money(dollarsToCents(Number(order.totalAmount)), currency),
    shipping_address: shippingAddress,
    created_at: order.createdAt.toISOString(),
  };

  if (order.trackingNumber && order.trackingUrl) {
    response.tracking = {
      carrier: order.shippingMethod ?? 'Unknown',
      tracking_number: order.trackingNumber,
      tracking_url: order.trackingUrl,
    };
  }

  return response;
}

// ============================================
// POST /ucp/v1/orders
// ============================================

export async function createOrder(req: Request, res: Response): Promise<void> {
  const tenant = req.tenant!;
  const body = req.body as UCPCreateOrderInput;

  try {
    const checkout = await prisma.checkout.findFirst({
      where: { id: body.cart_id, tenantId: tenant.id, protocol: 'UCP' },
      include: { items: true },
    });

    if (!checkout) {
      res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: `Cart '${body.cart_id}' not found` },
      });
      return;
    }

    if (isExpired(checkout.expiresAt) && checkout.status !== 'COMPLETED') {
      await prisma.checkout.update({ where: { id: checkout.id }, data: { status: 'EXPIRED' } });
      res.status(409).json({
        success: false,
        error: { code: 'CART_EXPIRED', message: 'Cart has expired' },
      });
      return;
    }

    if (!canTransition(checkout.status as CheckoutStatus, 'COMPLETED')) {
      res.status(409).json({
        success: false,
        error: {
          code: 'INVALID_STATE',
          message: `Cannot create order from cart in '${checkout.status}' status`,
        },
      });
      return;
    }

    // Validate payment token
    if (!body.payment_token.startsWith('spt_')) {
      res.status(400).json({
        success: false,
        error: { code: 'INVALID_PAYMENT', message: "Invalid payment token. Token must start with 'spt_'." },
      });
      return;
    }

    // Complete the checkout
    await prisma.checkout.update({
      where: { id: checkout.id },
      data: {
        status: 'COMPLETED',
        paymentToken: body.payment_token,
        paymentStatus: 'CAPTURED',
        paymentMethod: 'card',
        completedAt: new Date(),
      },
    });

    // Create the order
    const order = await prisma.order.create({
      data: {
        tenantId: tenant.id,
        checkoutId: checkout.id,
        externalId: generateId('ord'),
        orderNumber: `ORD-${checkout.id.substring(0, 8).toUpperCase()}`,
        status: 'CONFIRMED',
        email: checkout.email ?? '',
        shippingAddress: checkout.shippingAddress ?? {},
        shippingMethod: checkout.shippingMethod,
        shippingCost: checkout.shippingCost ?? 0,
        subtotal: checkout.subtotal,
        taxAmount: checkout.taxAmount,
        totalAmount: checkout.totalAmount,
        currency: checkout.currency,
        paymentMethod: 'card',
        paymentReference: body.payment_token,
        source: 'ucp',
        protocol: 'UCP',
        items: {
          create: checkout.items.map((item) => ({
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
      include: { items: true },
    });

    // Record event
    prisma.checkoutEvent.create({
      data: { checkoutId: checkout.id, type: 'ORDER_CREATED', data: { orderId: order.id } as Prisma.InputJsonValue },
    }).catch(() => {});

    logger.info('Order created via UCP', { tenantId: tenant.id, orderId: order.id });

    const response = toUCPOrderResponse(order);
    res.status(201).json(response);
  } catch (error) {
    logger.error('Failed to create order', {
      tenantId: tenant.id,
      error: error instanceof Error ? error.message : String(error),
    });
    res.status(500).json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: 'Failed to create order' },
    });
  }
}

// ============================================
// GET /ucp/v1/orders/:id
// ============================================

export async function getOrder(req: Request, res: Response): Promise<void> {
  const tenant = req.tenant!;
  const id = req.params['id']!;

  try {
    const order = await prisma.order.findFirst({
      where: { id, tenantId: tenant.id, protocol: 'UCP' },
      include: { items: true },
    });

    if (!order) {
      res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: `Order '${id}' not found` },
      });
      return;
    }

    const response = toUCPOrderResponse(order);
    res.json(response);
  } catch (error) {
    logger.error('Failed to get order', {
      tenantId: tenant.id,
      orderId: id,
      error: error instanceof Error ? error.message : String(error),
    });
    res.status(500).json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch order' },
    });
  }
}
