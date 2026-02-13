import { z } from 'zod';

export const ucpCatalogQuerySchema = z.object({
  query: z.string().optional(),
  category: z.string().optional(),
  min_price: z.coerce.number().int().min(0).optional(),
  max_price: z.coerce.number().int().min(0).optional(),
  page_size: z.coerce.number().int().min(1).max(100).default(20),
  page_token: z.string().optional(),
});

const shippingAddressSchema = z.object({
  recipient_name: z.string().min(1),
  street_address: z.string().min(1),
  street_address_2: z.string().optional(),
  city: z.string().min(1),
  region: z.string().min(1),
  postal_code: z.string().min(1),
  country_code: z.string().min(2).max(3),
  phone: z.string().optional(),
});

const cartItemSchema = z.object({
  product_id: z.string().min(1),
  variant_id: z.string().optional(),
  quantity: z.number().int().min(1),
});

export const ucpCreateCartSchema = z.object({
  items: z.array(cartItemSchema).min(1),
});

export const ucpUpdateCartSchema = z.object({
  items: z.array(cartItemSchema).min(1).optional(),
  shipping_address: shippingAddressSchema.optional(),
  shipping_method_id: z.string().optional(),
});

export const ucpCreateOrderSchema = z.object({
  cart_id: z.string().min(1),
  payment_token: z.string().min(1),
});

export type UCPCatalogQueryInput = z.infer<typeof ucpCatalogQuerySchema>;
export type UCPCreateCartInput = z.infer<typeof ucpCreateCartSchema>;
export type UCPUpdateCartInput = z.infer<typeof ucpUpdateCartSchema>;
export type UCPCreateOrderInput = z.infer<typeof ucpCreateOrderSchema>;
