import { Router } from 'express';
import { validateQuery, validateBody } from '../shared/validation';
import { acpProductsQuerySchema } from './schemas/products.schema';
import { acpCreateCheckoutSchema, acpUpdateCheckoutSchema, acpCompleteCheckoutSchema } from './schemas/checkouts.schema';
import { getProducts } from './handlers/products.handler';
import { createCheckout, getCheckout, updateCheckout, completeCheckout, cancelCheckout } from './handlers/checkouts.handler';

export function createACPRouter(): Router {
  const router = Router();

  // Products
  router.get('/products', validateQuery(acpProductsQuerySchema), getProducts);

  // Checkouts
  router.post('/checkouts', validateBody(acpCreateCheckoutSchema), createCheckout);
  router.get('/checkouts/:id', getCheckout);
  router.put('/checkouts/:id', validateBody(acpUpdateCheckoutSchema), updateCheckout);
  router.post('/checkouts/:id/complete', validateBody(acpCompleteCheckoutSchema), completeCheckout);
  router.delete('/checkouts/:id', cancelCheckout);

  return router;
}
