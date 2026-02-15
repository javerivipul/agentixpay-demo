import { Router, Request, Response, NextFunction } from 'express';
import {
  createTenant,
  getTenantById,
  updateTenant,
  listTenants,
  deleteTenant,
  logger,
} from '@agentix/core';
import type { Platform } from '@prisma/client';

const router: Router = Router();

// POST /api/tenants - Create a new tenant
router.post('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { name, email, companyName, platform } = req.body as {
      name: string;
      email: string;
      companyName?: string;
      platform: Platform;
    };

    if (!name || !email || !platform) {
      res.status(400).json({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'name, email, and platform are required' },
      });
      return;
    }

    const result = await createTenant({ name, email, companyName, platform });

    logger.info({ tenantId: result.tenant.id, platform }, 'Tenant created');

    res.status(201).json({
      success: true,
      data: {
        tenant: {
          id: result.tenant.id,
          name: result.tenant.name,
          email: result.tenant.email,
          platform: result.tenant.platform,
          status: result.tenant.status,
          createdAt: result.tenant.createdAt,
        },
        credentials: {
          apiKey: result.apiKey,
          apiSecret: result.apiSecret,
        },
      },
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/tenants - List tenants
router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const limit = parseInt(req.query['limit'] as string) || 20;
    const offset = parseInt(req.query['offset'] as string) || 0;

    const result = await listTenants({ limit, offset });

    res.json({
      success: true,
      data: result.data.map((t) => ({
        id: t.id,
        name: t.name,
        email: t.email,
        platform: t.platform,
        status: t.status,
        createdAt: t.createdAt,
      })),
      total: result.total,
      limit: result.limit,
      offset: result.offset,
      hasMore: result.hasMore,
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/tenants/:id - Get tenant by ID
router.get('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const tenant = await getTenantById(req.params['id']!);
    res.json({
      success: true,
      data: {
        id: tenant.id,
        name: tenant.name,
        email: tenant.email,
        companyName: tenant.companyName,
        platform: tenant.platform,
        status: tenant.status,
        platformConnectedAt: tenant.platformConnectedAt,
        settings: tenant.settings,
        createdAt: tenant.createdAt,
        updatedAt: tenant.updatedAt,
      },
    });
  } catch (error) {
    next(error);
  }
});

// PATCH /api/tenants/:id - Update tenant
router.patch('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const tenant = await updateTenant(req.params['id']!, req.body);
    res.json({
      success: true,
      data: {
        id: tenant.id,
        name: tenant.name,
        email: tenant.email,
        platform: tenant.platform,
        status: tenant.status,
        updatedAt: tenant.updatedAt,
      },
    });
  } catch (error) {
    next(error);
  }
});

// DELETE /api/tenants/:id - Delete tenant
router.delete('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    await deleteTenant(req.params['id']!);
    res.status(204).send();
  } catch (error) {
    next(error);
  }
});

export { router as tenantRoutes };
