import { CheckoutStatus, TenantStatus, OrderStatus, FulfillmentStatus, ProductStatus } from '../types';

export const TENANT_STATUS_LABELS: Record<TenantStatus, string> = {
  ONBOARDING: 'Onboarding',
  CONNECTING: 'Connecting',
  SYNCING: 'Syncing Products',
  ACTIVE: 'Active',
  SUSPENDED: 'Suspended',
  DISCONNECTED: 'Disconnected',
};

export const CHECKOUT_STATUS_LABELS: Record<CheckoutStatus, string> = {
  CREATED: 'Created',
  ITEMS_ADDED: 'Items Added',
  SHIPPING_SET: 'Shipping Set',
  PAYMENT_PENDING: 'Payment Pending',
  COMPLETED: 'Completed',
  CANCELLED: 'Cancelled',
  EXPIRED: 'Expired',
  FAILED: 'Failed',
};

export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  PENDING: 'Pending',
  CONFIRMED: 'Confirmed',
  PROCESSING: 'Processing',
  SHIPPED: 'Shipped',
  DELIVERED: 'Delivered',
  CANCELLED: 'Cancelled',
  REFUNDED: 'Refunded',
};

export const FULFILLMENT_STATUS_LABELS: Record<FulfillmentStatus, string> = {
  UNFULFILLED: 'Unfulfilled',
  PARTIALLY_FULFILLED: 'Partially Fulfilled',
  FULFILLED: 'Fulfilled',
};

export const PRODUCT_STATUS_LABELS: Record<ProductStatus, string> = {
  ACTIVE: 'Active',
  DRAFT: 'Draft',
  ARCHIVED: 'Archived',
  DELETED: 'Deleted',
};
