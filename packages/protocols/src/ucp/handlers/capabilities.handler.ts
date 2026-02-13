import { Request, Response } from 'express';
import { logger } from '@agentix/core';
import type { UCPCapabilitiesResponse } from '../types/ucp.types';

/**
 * GET /ucp/v1/capabilities
 * Returns merchant capabilities and supported features.
 */
export async function getCapabilities(req: Request, res: Response): Promise<void> {
  const tenant = req.tenant!;

  try {
    const response: UCPCapabilitiesResponse = {
      merchant: {
        name: tenant.companyName ?? tenant.name,
        description: `Products from ${tenant.companyName ?? tenant.name} via Agentix`,
      },
      capabilities: [
        { type: 'catalog', version: '1.0' },
        { type: 'cart', version: '1.0' },
        { type: 'checkout', version: '1.0' },
        { type: 'order_tracking', version: '1.0' },
      ],
      supported_currencies: ['USD'],
      supported_countries: ['US'],
    };

    res.json(response);
  } catch (error) {
    logger.error('Failed to get capabilities', {
      tenantId: tenant.id,
      error: error instanceof Error ? error.message : String(error),
    });
    res.status(500).json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch capabilities' },
    });
  }
}
