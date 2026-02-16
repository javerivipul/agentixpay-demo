'use client';

import { Package, CheckCircle, Clock } from 'lucide-react';
import { formatCents, cn } from '@/lib/utils';

interface OrderEntry {
  id: string;
  status: string;
  itemCount: number;
  total: number;
  timestamp: string;
  shippingAddress?: string;
  paymentInfo?: string;
}

interface OrderFeedProps {
  orders: OrderEntry[];
}

export function OrderFeed({ orders }: OrderFeedProps) {
  if (orders.length === 0) {
    return (
      <div className="text-center py-8 text-brand-400 text-sm">
        <Package className="w-8 h-8 mx-auto mb-2 opacity-50" />
        No orders yet. Run the demo to see orders appear.
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {orders.map((order) => (
        <div
          key={order.id}
          className="bg-white p-3 rounded-lg border border-warm-200 flex items-center justify-between animate-slide-up shadow-sm"
        >
          <div className="flex items-center gap-3">
            <div
              className={cn(
                'w-8 h-8 rounded-full flex items-center justify-center',
                order.status === 'completed'
                  ? 'bg-green-100 text-green-600'
                  : 'bg-amber-100 text-amber-600'
              )}
            >
              {order.status === 'completed' ? (
                <CheckCircle className="w-4 h-4" />
              ) : (
                <Clock className="w-4 h-4" />
              )}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs text-brand-500 bg-warm-100 px-1.5 py-0.5 rounded">
                  {order.id.slice(0, 12)}...
                </span>
                <span
                  className={cn(
                    'text-xs px-2 py-0.5 rounded-full font-medium',
                    order.status === 'completed'
                      ? 'bg-green-100 text-green-700'
                      : 'bg-amber-100 text-amber-700'
                  )}
                >
                  {order.status}
                </span>
              </div>
              <div className="text-xs text-brand-500 mt-0.5">
                {order.itemCount} item(s) &middot;{' '}
                {new Date(order.timestamp).toLocaleTimeString([], {
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </div>
              {order.shippingAddress && (
                <div className="text-xs text-brand-400 mt-0.5 font-semibold">
                  {order.shippingAddress}
                </div>
              )}
              {order.paymentInfo && (
                <div className="text-xs text-brand-400 mt-0.5 font-medium">
                  Charged to Visa on file ending with - <span className="font-bold">8359</span>
                </div>
              )}
            </div>
          </div>
          <div className="font-bold text-brand-900 text-sm">{formatCents(order.total)}</div>
        </div>
      ))}
    </div>
  );
}
