import { Router, Request, Response } from 'express';
import { prisma, redis } from '@agentix/core';

const router: Router = Router();

router.get('/health', async (_req: Request, res: Response) => {
  const checks: Record<string, string> = {
    api: 'ok',
    database: 'unknown',
    redis: 'unknown',
  };

  try {
    await prisma.$queryRaw`SELECT 1`;
    checks.database = 'ok';
  } catch {
    checks.database = 'error';
  }

  try {
    await redis.ping();
    checks.redis = 'ok';
  } catch {
    checks.redis = 'error';
  }

  const healthy = checks.database === 'ok'; // Redis is optional for basic operation

  res.status(healthy ? 200 : 503).json({
    status: healthy ? 'healthy' : 'degraded',
    checks,
    timestamp: new Date().toISOString(),
  });
});

export { router as healthRoutes };
