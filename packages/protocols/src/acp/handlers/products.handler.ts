import { Request, Response } from 'express';
import { prisma, logger } from '@agentix/core';
import { dollarsToCents } from '@agentix/shared';
import type { ACPProduct, ACPProductsResponse, ACPProductImage } from '../types/acp.types';
import { Prisma } from '@prisma/client';

/**
 * GET /acp/v1/products
 * Search and list products for the tenant's connected store.
 * Queries the synced product database directly (not the adapter).
 */
export async function getProducts(req: Request, res: Response): Promise<void> {
  const tenant = req.tenant!;
  const query = req.query as {
    query?: string;
    category?: string;
    min_price?: number;
    max_price?: number;
    limit?: number;
    offset?: number;
  };

  try {
    const limit = Math.min(Number(query.limit) || 20, 100);
    const offset = Number(query.offset) || 0;

    // Build where clause
    const where: Prisma.ProductWhereInput = {
      tenantId: tenant.id,
      status: 'ACTIVE',
    };

    if (query.query) {
      where.OR = [
        { title: { contains: query.query, mode: 'insensitive' } },
        { description: { contains: query.query, mode: 'insensitive' } },
        { tags: { has: query.query.toLowerCase() } },
      ];
    }

    if (query.category) {
      where.productType = { equals: query.category, mode: 'insensitive' };
    }

    if (query.min_price != null) {
      where.price = { ...(where.price as Prisma.DecimalFilter || {}), gte: Number(query.min_price) / 100 };
    }

    if (query.max_price != null) {
      where.price = { ...(where.price as Prisma.DecimalFilter || {}), lte: Number(query.max_price) / 100 };
    }

    const [dbProducts, total] = await Promise.all([
      prisma.product.findMany({
        where,
        orderBy: { title: 'asc' },
        take: limit,
        skip: offset,
      }),
      prisma.product.count({ where }),
    ]);

    const products: ACPProduct[] = dbProducts.map((p) => {
      const quantity = p.inventoryQuantity;
      let status: 'in_stock' | 'out_of_stock' | 'low_stock' = 'in_stock';
      if (quantity <= 0) status = 'out_of_stock';
      else if (quantity <= 5) status = 'low_stock';

      const images: ACPProductImage[] = (p.images as Array<{ url: string; alt?: string }>).map((img) => ({
        url: img.url,
        alt: img.alt,
      }));

      return {
        id: p.id,
        sku: p.sku,
        title: p.title,
        description: p.description ?? '',
        price: dollarsToCents(Number(p.price)),
        compare_at_price: p.compareAtPrice != null ? dollarsToCents(Number(p.compareAtPrice)) : undefined,
        currency: p.currency.toLowerCase(),
        images,
        inventory: { quantity, status },
        category: p.productType ?? undefined,
      };
    });

    const response: ACPProductsResponse = {
      products,
      total,
      limit,
      offset,
      has_more: offset + limit < total,
    };

    res.json(response);
  } catch (error) {
    logger.error('Failed to get products', {
      tenantId: tenant.id,
      error: error instanceof Error ? error.message : String(error),
    });
    res.status(500).json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch products' },
    });
  }
}
