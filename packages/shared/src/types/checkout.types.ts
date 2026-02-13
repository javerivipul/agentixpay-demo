export type Protocol = 'ACP' | 'UCP';

export type CheckoutStatus =
  | 'CREATED'
  | 'ITEMS_ADDED'
  | 'SHIPPING_SET'
  | 'PAYMENT_PENDING'
  | 'COMPLETED'
  | 'CANCELLED'
  | 'EXPIRED'
  | 'FAILED';

export type PaymentStatus =
  | 'PENDING'
  | 'AUTHORIZED'
  | 'CAPTURED'
  | 'FAILED'
  | 'REFUNDED'
  | 'PARTIALLY_REFUNDED';

export interface ShippingAddress {
  name: string;
  address1: string;
  address2?: string;
  city: string;
  state: string;
  zip: string;
  country: string;
  phone?: string;
}

export interface ShippingMethod {
  id: string;
  title: string;
  description?: string;
  carrier?: string;
  price: number;
  currency: string;
  estimatedDays?: string;
}

export interface CheckoutItem {
  id: string;
  checkoutId: string;
  productId: string;
  sku: string;
  title: string;
  price: number;
  quantity: number;
  variantId?: string;
  variantTitle?: string;
  lineTotal: number;
}

export interface Checkout {
  id: string;
  tenantId: string;
  protocol: Protocol;
  externalId?: string;
  status: CheckoutStatus;
  items: CheckoutItem[];
  email?: string;
  shippingAddress?: ShippingAddress;
  shippingMethod?: string;
  shippingCost?: number;
  billingAddress?: ShippingAddress;
  subtotal: number;
  taxAmount: number;
  totalAmount: number;
  currency: string;
  paymentToken?: string;
  paymentStatus?: PaymentStatus;
  paymentMethod?: string;
  metadata?: Record<string, unknown>;
  userAgent?: string;
  ipAddress?: string;
  source?: string;
  expiresAt: Date;
  completedAt?: Date;
  cancelledAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface CheckoutEvent {
  id: string;
  checkoutId: string;
  type: string;
  data?: unknown;
  createdAt: Date;
}

export const VALID_TRANSITIONS: Record<CheckoutStatus, CheckoutStatus[]> = {
  CREATED: ['ITEMS_ADDED', 'CANCELLED', 'EXPIRED'],
  ITEMS_ADDED: ['SHIPPING_SET', 'ITEMS_ADDED', 'CANCELLED', 'EXPIRED'],
  SHIPPING_SET: ['PAYMENT_PENDING', 'SHIPPING_SET', 'CANCELLED', 'EXPIRED'],
  PAYMENT_PENDING: ['COMPLETED', 'FAILED', 'CANCELLED', 'EXPIRED'],
  COMPLETED: [],
  CANCELLED: [],
  EXPIRED: [],
  FAILED: ['PAYMENT_PENDING', 'CANCELLED'],
};

export function canTransition(from: CheckoutStatus, to: CheckoutStatus): boolean {
  return VALID_TRANSITIONS[from]?.includes(to) ?? false;
}
