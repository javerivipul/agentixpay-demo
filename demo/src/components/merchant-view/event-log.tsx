'use client';

import { useRef, useEffect } from 'react';
import {
  Search,
  Package,
  ShoppingCart,
  Truck,
  CreditCard,
  CheckCircle,
  AlertCircle,
  Activity,
  MapPin,
  Box,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { JourneyEvent } from '@/lib/scenarios';

interface EventLogProps {
  events: JourneyEvent[];
}

const EVENT_CONFIG: Record<string, { icon: React.ElementType; color: string; label: string }> = {
  PRODUCT_SEARCH:  { icon: Search,      color: 'text-blue-400',   label: 'product.search' },
  PRODUCT_RESULTS: { icon: Package,     color: 'text-cyan-400',   label: 'product.results' },
  CHECKOUT_INIT:   { icon: ShoppingCart, color: 'text-purple-400', label: 'checkout.created' },
  INVENTORY_CHECK: { icon: Box,         color: 'text-indigo-400', label: 'inventory.reserved' },
  ADDRESS_SET:     { icon: MapPin,      color: 'text-teal-400',   label: 'checkout.address_set' },
  TAX_SHIPPING_CALC: { icon: Truck,     color: 'text-yellow-400', label: 'tax.calculated' },
  PAYMENT_PENDING: { icon: CreditCard,  color: 'text-orange-400', label: 'payment.processing' },
  ORDER_FINALIZED: { icon: CheckCircle, color: 'text-green-400',  label: 'order.completed' },
  CHECKOUT_UPDATED: { icon: Activity,   color: 'text-indigo-400', label: 'checkout.updated' },
  ERROR:           { icon: AlertCircle, color: 'text-red-400',    label: 'error' },
};

const STAGE_LABELS = ['', 'Search', 'Results', 'Checkout', 'Shipping', 'Payment', 'Complete'];

export function EventLog({ events }: EventLogProps) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [events]);

  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
    });
  };

  const maxStage = events.reduce((max, e) => Math.max(max, e.stage), 0);

  return (
    <div className="h-full flex flex-col bg-gray-950 rounded-xl overflow-hidden border border-gray-800">
      {/* Header */}
      <div className="px-4 py-2.5 border-b border-gray-800 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Activity className="w-4 h-4 text-green-400" />
          <span className="font-mono text-xs font-semibold text-gray-200">Protocol Events</span>
          <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse-dot" />
        </div>
        <div className="flex items-center gap-1">
          {STAGE_LABELS.slice(1).map((label, i) => (
            <div
              key={label}
              className={cn(
                'px-1.5 py-0.5 rounded text-[10px] font-mono transition-colors',
                maxStage >= i + 1
                  ? 'bg-green-600/80 text-white'
                  : 'bg-gray-800 text-gray-600'
              )}
            >
              {i + 1}
            </div>
          ))}
        </div>
      </div>

      {/* Log entries */}
      <div className="flex-1 overflow-y-auto p-3 font-mono text-xs scrollbar-dark">
        {events.length === 0 ? (
          <div className="text-gray-600 text-center py-6">
            Waiting for protocol events...
          </div>
        ) : (
          <div className="space-y-1">
            {events.map((event) => {
              const config = EVENT_CONFIG[event.type] ?? {
                icon: Activity,
                color: 'text-gray-400',
                label: event.type.toLowerCase(),
              };
              const Icon = config.icon;

              return (
                <div
                  key={event.id}
                  className="flex items-start gap-2 px-2 py-1.5 rounded hover:bg-gray-900 animate-fade-in"
                >
                  <span className="text-gray-600 shrink-0 w-16">{formatTime(event.timestamp)}</span>
                  <Icon className={cn('w-3.5 h-3.5 shrink-0 mt-0.5', config.color)} />
                  <span className={cn('shrink-0', config.color)}>{config.label}</span>
                  <span className="text-gray-400 truncate">{event.message}</span>
                </div>
              );
            })}
            <div ref={bottomRef} />
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="px-4 py-1.5 border-t border-gray-800 flex items-center justify-between">
        <span className="text-[10px] text-gray-600 font-mono">{events.length} events</span>
        <span className="text-[10px] text-purple-500 font-mono">ACP v1 &middot; Agentix</span>
      </div>
    </div>
  );
}
