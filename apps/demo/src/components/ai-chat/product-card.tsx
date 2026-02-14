'use client';

import { ShoppingBag, Check } from 'lucide-react';
import { cn, formatCents } from '@/lib/utils';
import type { DemoProduct } from '@/lib/scenarios';

interface ProductCardProps {
  product: DemoProduct;
  selected?: boolean;
  onSelect?: (product: DemoProduct) => void;
}

export function ProductCard({ product, selected, onSelect }: ProductCardProps) {
  const imageUrl = product.images[0]?.url || 'https://via.placeholder.com/300x200?text=Product';

  return (
    <div
      onClick={() => onSelect?.(product)}
      className={cn(
        'bg-white rounded-xl border overflow-hidden flex flex-col transition-all cursor-pointer hover:shadow-md',
        selected
          ? 'border-accent-500 ring-2 ring-accent-500/20 shadow-md'
          : 'border-warm-200 hover:border-accent-300'
      )}
    >
      <div className="h-32 overflow-hidden relative bg-warm-50 p-2">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={imageUrl}
          alt={product.title}
          className="w-full h-full object-contain"
        />
        {selected && (
          <div className="absolute top-2 right-2 w-6 h-6 bg-accent-500 text-white rounded-full flex items-center justify-center">
            <Check className="w-3.5 h-3.5" />
          </div>
        )}
      </div>
      <div className="p-3 flex-1 flex flex-col">
        <h4 className="font-semibold text-brand-900 text-sm mb-0.5">{product.title}</h4>
        <p className="text-xs text-brand-500 line-clamp-1 mb-2">{product.description}</p>
        <div className="mt-auto flex items-center justify-between">
          <span className="font-bold text-brand-900 text-sm">{formatCents(product.price)}</span>
          <div className="flex items-center gap-1 text-xs text-brand-500">
            <ShoppingBag className="w-3 h-3" />
            {product.inventory.status === 'in_stock' ? 'In stock' : 'Out of stock'}
          </div>
        </div>
      </div>
    </div>
  );
}
