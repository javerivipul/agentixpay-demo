import { z } from 'zod';

const buyerSchema = z.object({
  first_name: z.string().min(1),
  last_name: z.string().min(1),
  email: z.string().email(),
  phone_number: z.string().optional(),
});

const addressSchema = z.object({
  name: z.string().min(1),
  line_one: z.string().min(1),
  line_two: z.string().optional(),
  city: z.string().min(1),
  state: z.string().min(1),
  country: z.string().min(1),
  postal_code: z.string().min(1),
});

const checkoutItemSchema = z.object({
  id: z.string().optional(),
  sku: z.string().optional(),
  quantity: z.number().int().min(1),
}).refine(
  (item) => item.id !== undefined || item.sku !== undefined,
  { message: 'Either id or sku must be provided' }
);

export const acpCreateCheckoutSchema = z.object({
  items: z.array(checkoutItemSchema).min(1),
  buyer: buyerSchema.optional(),
  fulfillment_address: addressSchema.optional(),
  fulfillment_option_id: z.string().optional(),
  metadata: z.record(z.unknown()).optional(),
});

export const acpUpdateCheckoutSchema = z.object({
  items: z.array(checkoutItemSchema).min(1).optional(),
  buyer: buyerSchema.optional(),
  fulfillment_address: addressSchema.optional(),
  fulfillment_option_id: z.string().optional(),
});

export const acpCompleteCheckoutSchema = z.object({
  payment_token: z.object({
    type: z.literal('stripe_spt'),
    token: z.string().min(1),
  }),
});

export type ACPCreateCheckoutInput = z.infer<typeof acpCreateCheckoutSchema>;
export type ACPUpdateCheckoutInput = z.infer<typeof acpUpdateCheckoutSchema>;
export type ACPCompleteCheckoutInput = z.infer<typeof acpCompleteCheckoutSchema>;
