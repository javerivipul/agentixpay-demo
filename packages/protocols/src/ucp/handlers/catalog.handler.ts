import { Request, Response } from 'express';
import { prisma, logger } from '@agentix/core';
import { dollarsToCents } from '@agentix/shared';
import type { UCPCatalogItem, UCPCatalogResponse, UCPImage } from '../types/ucp.types';
import { Prisma } from '@prisma/client';

/**
 * GET /ucp/v1/catalog
 * Search and list products in UCP format.
 * Queries the synced product database directly.
 */
export async function getCatalog(req: Request, res: Response): Promise<void> {
  const tenant = req.tenant!;
  const query = req.query as {
    query?: string;
    category?: string;
    min_price?: number;
    max_price?: number;
    page_size?: number;
    page_token?: string;
  };

  try {
    // page_token is a base64-encoded offset
    let offset = 0;
    if (query.page_token) {
      try {
        offset = parseInt(Buffer.from(query.page_token, 'base64').toString('utf-8'), 10) || 0;
      } catch {
        offset = 0;
      }
    }

    const pageSize = Math.min(Number(query.page_size) || 20, 100);

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
        take: pageSize,
        skip: offset,
      }),
      prisma.product.count({ where }),
    ]);

    const items: UCPCatalogItem[] = dbProducts.map((p) => {
      const images: UCPImage[] = (p.images as Array<{ url: string; alt?: string }>).map((img) => ({
        url: img.url,
        alt_text: img.alt,
      }));

      let availability: 'in_stock' | 'out_of_stock' | 'preorder' = 'in_stock';
      if (p.inventoryQuantity <= 0) {
        availability = p.inventoryPolicy === 'CONTINUE' ? 'preorder' : 'out_of_stock';
      }

      return {
        id: p.id,
        title: p.title,
        description: p.description ?? '',
        images,
        price: {
          amount: dollarsToCents(Number(p.price)),
          currency_code: p.currency,
        },
        availability,
        category: p.productType ?? undefined,
        brand: p.vendor ?? undefined,
      };
    });

    const nextOffset = offset + pageSize;
    const nextPageToken = nextOffset < total
      ? Buffer.from(String(nextOffset)).toString('base64')
      : undefined;

    const response: UCPCatalogResponse = {
      items,
      total_results: total,
      next_page_token: nextPageToken,
    };

    res.json(response);
  } catch (error) {
    logger.error('Failed to get catalog', {
      tenantId: tenant.id,
      error: error instanceof Error ? error.message : String(error),
    });
    res.status(500).json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch catalog' },
    });
  }
}
