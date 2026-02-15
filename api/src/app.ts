import express, { type Express } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { apiKeyMiddleware } from '@agentix/core';
import { createACPRouter, createUCPRouter } from '@agentix/protocols';
import { requestIdMiddleware, errorMiddleware, rateLimitMiddleware } from './middleware';
import { healthRoutes, tenantRoutes } from './routes';
import { config } from './config';

export function createApp(): Express {
  const app = express();

  // --- Global middleware ---
  app.use(helmet());
  app.use(cors({
    origin: [config.dashboardUrl, config.demoUrl, 'http://localhost:3000', 'http://localhost:3002'],
    credentials: true,
  }));
  app.use(express.json());
  app.use(requestIdMiddleware);
  app.use(rateLimitMiddleware);

  // --- Public routes ---
  app.use('/api', healthRoutes);

  // --- Management routes (no API key required for now — dashboard uses Clerk auth) ---
  app.use('/api/tenants', tenantRoutes);

  // --- Protocol routes (require API key) ---
  app.use('/acp/v1', apiKeyMiddleware, createACPRouter());

  if (config.enableUcp) {
    app.use('/ucp/v1', apiKeyMiddleware, createUCPRouter());
  }

  // --- Error handler (must be last) ---
  app.use(errorMiddleware);

  return app;
}
