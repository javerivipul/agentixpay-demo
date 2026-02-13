import { Router } from 'express';
import { validateQuery, validateBody } from '../shared/validation';
import { ucpCatalogQuerySchema, ucpCreateCartSchema, ucpUpdateCartSchema, ucpCreateOrderSchema } from './schemas/ucp.schemas';
import { getCapabilities } from './handlers/capabilities.handler';
import { getCatalog } from './handlers/catalog.handler';
import { createCart, getCart, updateCart } from './handlers/carts.handler';
import { createOrder, getOrder } from './handlers/orders.handler';

export function createUCPRouter(): Router {
  const router = Router();

  // Capabilities
  router.get('/capabilities', getCapabilities);

  // Catalog
  router.get('/catalog', validateQuery(ucpCatalogQuerySchema), getCatalog);

  // Carts
  router.post('/carts', validateBody(ucpCreateCartSchema), createCart);
  router.get('/carts/:id', getCart);
  router.put('/carts/:id', validateBody(ucpUpdateCartSchema), updateCart);

  // Orders
  router.post('/orders', validateBody(ucpCreateOrderSchema), createOrder);
  router.get('/orders/:id', getOrder);

  return router;
}
