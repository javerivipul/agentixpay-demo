import { Protocol } from './checkout.types';

export type OrderStatus =
  | 'PENDING'
  | 'CONFIRMED'
  | 'PROCESSING'
  | 'SHIPPED'
  | 'DELIVERED'
  | 'CANCELLED'
  | 'REFUNDED';

export type FulfillmentStatus =
  | 'UNFULFILLED'
  | 'PARTIALLY_FULFILLED'
  | 'FULFILLED';

export interface OrderItem {
  id: string;
  orderId: string;
  productId: string;
  sku: string;
  title: string;
  price: number;
  quantity: number;
  variantId?: string;
  variantTitle?: string;
  lineTotal: number;
}

export interface Order {
  id: string;
  tenantId: string;
  checkoutId: string;
  externalId: string;
  externalUrl?: string;
  orderNumber?: string;
  status: OrderStatus;
  items: OrderItem[];
  email: string;
  shippingAddress: Record<string, unknown>;
  shippingMethod?: string;
  shippingCost: number;
  subtotal: number;
  taxAmount: number;
  totalAmount: number;
  currency: string;
  paymentMethod?: string;
  paymentReference?: string;
  fulfillmentStatus: FulfillmentStatus;
  trackingNumber?: string;
  trackingUrl?: string;
  source: string;
  protocol: Protocol;
  metadata?: Record<string, unknown>;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}
