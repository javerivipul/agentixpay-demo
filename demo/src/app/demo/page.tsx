'use client';

import { useState, useCallback } from 'react';
import { SplitScreen } from '@/components/split-screen';
import { ChatInterface } from '@/components/ai-chat/chat-interface';
import { DashboardPreview } from '@/components/merchant-view/dashboard-preview';
import { OrderFeed } from '@/components/merchant-view/order-feed';
import { EventLog } from '@/components/merchant-view/event-log';
import { JourneyTimeline } from '@/components/journey/journey-timeline';
import type { JourneyEvent } from '@/lib/scenarios';

interface OrderEntry {
  id: string;
  status: string;
  itemCount: number;
  total: number;
  timestamp: string;
}

export default function DemoPage() {
  const [events, setEvents] = useState<JourneyEvent[]>([]);
  const [orders, setOrders] = useState<OrderEntry[]>([]);
  const [stats, setStats] = useState({ orders: 0, revenue: 0 });

  const handleJourneyEvent = useCallback((event: JourneyEvent) => {
    setEvents((prev) => [...prev, event]);
  }, []);

  const handleOrderComplete = useCallback((checkout: Record<string, unknown>) => {
    const totals = checkout.totals as Array<{ type: string; amount: number }> | undefined;
    const total = totals?.find((t) => t.type === 'total')?.amount ?? 0;
    const lineItems = checkout.line_items as Array<unknown> | undefined;

    setOrders((prev) => [
      {
        id: checkout.id as string,
        status: checkout.status as string,
        itemCount: lineItems?.length ?? 0,
        total,
        timestamp: new Date().toISOString(),
      },
      ...prev,
    ]);
  }, []);

  const handleStatsUpdate = useCallback((newStats: { orders: number; revenue: number }) => {
    setStats(newStats);
  }, []);

  const handleReset = useCallback(() => {
    setEvents([]);
    setOrders([]);
    setStats({ orders: 0, revenue: 0 });
  }, []);

  return (
    <SplitScreen
      left={
        <ChatInterface
          onJourneyEvent={handleJourneyEvent}
          onOrderComplete={handleOrderComplete}
          onStatsUpdate={handleStatsUpdate}
          onReset={handleReset}
        />
      }
      right={
        <>
          {/* Merchant Dashboard Header */}
          <div className="bg-white rounded-xl border border-warm-200 shadow-lg overflow-hidden flex flex-col flex-1 min-h-0">
            <div className="px-5 py-3.5 border-b border-warm-200 bg-gradient-to-r from-brand-900 to-brand-800">
              <h2 className="font-bold text-white text-base">Merchant Dashboard</h2>
              <p className="text-xs text-brand-300">Real-time view of your AI commerce activity</p>
            </div>

            <div className="p-4 space-y-4 overflow-y-auto scrollbar-thin flex-1">
              {/* Stats */}
              <DashboardPreview orders={stats.orders} revenue={stats.revenue} />

              {/* Journey Progress */}
              <div>
                <h3 className="text-xs font-semibold text-brand-600 uppercase tracking-wider mb-2">
                  Checkout Journey
                </h3>
                <JourneyTimeline events={events} />
              </div>

              {/* Recent Orders */}
              <div>
                <h3 className="text-xs font-semibold text-brand-600 uppercase tracking-wider mb-2">
                  Recent Orders
                </h3>
                <OrderFeed orders={orders} />
              </div>
            </div>
          </div>
        </>
      }
      bottom={<EventLog events={events} />}
    />
  );
}
