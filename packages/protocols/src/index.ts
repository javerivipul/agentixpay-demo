// ACP (AI Commerce Protocol - OpenAI/Stripe)
export { createACPRouter } from './acp/router';
export type * from './acp/types/acp.types';
export { acpProductsQuerySchema } from './acp/schemas/products.schema';
export {
  acpCreateCheckoutSchema,
  acpUpdateCheckoutSchema,
  acpCompleteCheckoutSchema,
} from './acp/schemas/checkouts.schema';

// UCP (Universal Commerce Protocol - Google)
export { createUCPRouter } from './ucp/router';
export type * from './ucp/types/ucp.types';
export {
  ucpCatalogQuerySchema,
  ucpCreateCartSchema,
  ucpUpdateCartSchema,
  ucpCreateOrderSchema,
} from './ucp/schemas/ucp.schemas';

// Shared utilities
export { validateQuery, validateBody } from './shared/validation';
export { successResponse, errorResponse } from './shared/formatting';
