import { Request, Response, NextFunction } from 'express';
import { prisma } from '../db/client';
import { AuthenticationError } from '../errors';
import type { Tenant } from '@prisma/client';

// Extend Express Request to include tenant
declare global {
  namespace Express {
    interface Request {
      tenant?: Tenant;
    }
  }
}

export async function apiKeyMiddleware(
  req: Request,
  _res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const apiKey = req.headers['x-api-key'] as string | undefined;

    if (!apiKey) {
      throw new AuthenticationError('Missing X-API-Key header');
    }

    const tenant = await prisma.tenant.findUnique({
      where: { apiKey },
    });

    if (!tenant) {
      throw new AuthenticationError('Invalid API key');
    }

    if (tenant.status === 'SUSPENDED') {
      throw new AuthenticationError('Account is suspended');
    }

    if (tenant.status === 'DISCONNECTED') {
      throw new AuthenticationError('Account is disconnected');
    }

    req.tenant = tenant;
    next();
  } catch (error) {
    next(error);
  }
}
