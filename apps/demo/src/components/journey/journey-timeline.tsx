'use client';

import { Search, Package, ShoppingCart, Truck, CreditCard, CheckCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { JourneyEvent } from '@/lib/scenarios';

interface JourneyTimelineProps {
  events: JourneyEvent[];
}

const STAGES = [
  { num: 1, label: 'Search', icon: Search, color: 'bg-blue-500', lightBg: 'bg-blue-100', lightText: 'text-blue-600' },
  { num: 2, label: 'Results', icon: Package, color: 'bg-cyan-500', lightBg: 'bg-cyan-100', lightText: 'text-cyan-600' },
  { num: 3, label: 'Checkout', icon: ShoppingCart, color: 'bg-violet-500', lightBg: 'bg-violet-100', lightText: 'text-violet-600' },
  { num: 4, label: 'Shipping', icon: Truck, color: 'bg-amber-500', lightBg: 'bg-amber-100', lightText: 'text-amber-600' },
  { num: 5, label: 'Payment', icon: CreditCard, color: 'bg-orange-500', lightBg: 'bg-orange-100', lightText: 'text-orange-600' },
  { num: 6, label: 'Complete', icon: CheckCircle, color: 'bg-emerald-500', lightBg: 'bg-emerald-100', lightText: 'text-emerald-600' },
];

export function JourneyTimeline({ events }: JourneyTimelineProps) {
  const maxStage = events.reduce((max, e) => Math.max(max, e.stage), 0);

  return (
    <div className="flex items-center gap-1 w-full">
      {STAGES.map((stage, i) => {
        const reached = maxStage >= stage.num;
        const active = maxStage === stage.num;
        const Icon = stage.icon;

        return (
          <div key={stage.num} className="flex items-center gap-1 flex-1">
            <div
              className={cn(
                'flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-medium transition-all w-full justify-center',
                reached
                  ? active
                    ? `${stage.color} text-white shadow-sm`
                    : `${stage.lightBg} ${stage.lightText}`
                  : 'bg-warm-100 text-brand-400'
              )}
            >
              <Icon className="w-3 h-3 shrink-0" />
              <span className="hidden lg:inline">{stage.label}</span>
            </div>
            {i < STAGES.length - 1 && (
              <div
                className={cn(
                  'w-3 h-0.5 shrink-0 rounded-full transition-colors',
                  maxStage > stage.num ? 'bg-emerald-400' : 'bg-warm-200'
                )}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}
