export type InventoryPolicy = 'DENY' | 'CONTINUE';
export type ProductStatus = 'ACTIVE' | 'DRAFT' | 'ARCHIVED' | 'DELETED';

export interface ProductImage {
  url: string;
  alt?: string;
  position?: number;
}

export interface ProductVariant {
  id: string;
  sku: string;
  title: string;
  price: number;
  compareAtPrice?: number;
  inventoryQuantity: number;
  options?: Record<string, string>;
}

export interface Product {
  id: string;
  tenantId: string;
  externalId: string;
  externalUrl?: string;
  sku: string;
  title: string;
  description?: string;
  descriptionHtml?: string;
  price: number;
  compareAtPrice?: number;
  currency: string;
  images: ProductImage[];
  inventoryQuantity: number;
  inventoryPolicy: InventoryPolicy;
  trackInventory: boolean;
  productType?: string;
  vendor?: string;
  tags: string[];
  hasVariants: boolean;
  variants?: ProductVariant[];
  aeoEnhanced: boolean;
  aeoData?: unknown;
  metadata?: Record<string, unknown>;
  status: ProductStatus;
  lastSyncedAt: Date;
  syncChecksum?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ProductQueryParams {
  query?: string;
  category?: string;
  minPrice?: number;
  maxPrice?: number;
  inStock?: boolean;
  ids?: string[];
  skus?: string[];
  limit?: number;
  offset?: number;
  orderBy?: 'title' | 'price' | 'created_at' | 'updated_at';
  orderDir?: 'asc' | 'desc';
}

export interface ProductFilters {
  category?: string;
  minPrice?: number;
  maxPrice?: number;
  inStock?: boolean;
  vendor?: string;
  tags?: string[];
}

export interface InventoryStatus {
  sku: string;
  quantity: number;
  available: boolean;
  policy: InventoryPolicy;
}

export interface Reservation {
  id: string;
  sku: string;
  quantity: number;
  expiresAt: Date;
}
