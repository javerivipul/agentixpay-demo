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
  shippingAddress?: string;
  paymentInfo?: string;
}

export function DemoClient({ protocol, store }: { protocol: 'acp' | 'ucp'; store: string }) {
  const [events, setEvents] = useState<JourneyEvent[]>([]);
  const [orders, setOrders] = useState<OrderEntry[]>([]);
  const [stats, setStats] = useState({ orders: 0, revenue: 0 });

  const handleJourneyEvent = useCallback((event: JourneyEvent) => {
    setEvents((prev) => [...prev, event]);
  }, []);

  const handleOrderComplete = useCallback((checkout: Record<string, unknown>) => {
    const totals = checkout.totals as Array<{ type: string; amount: number }> | undefined;
    let total = totals?.find((t) => t.type === 'total')?.amount ?? 0;
    if (total === 0) {
      total = typeof checkout.total === 'number' ? checkout.total : 0;
    }
    const lineItems = checkout.line_items as Array<unknown> | undefined;

    const shippingAddress = '145 Peachtree Ave, Atlanta, GA, 30303';
    const paymentInfo = 'Charged to Visa on file ending with - 8359';

    setOrders((prev) => [
      {
        id: checkout.id as string,
        status: checkout.status as string,
        itemCount: lineItems?.length ?? 1,
        total,
        timestamp: new Date().toISOString(),
        shippingAddress,
        paymentInfo,
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

  if (!store) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-warm-100 px-6">
        <div className="max-w-md w-full bg-white rounded-2xl border border-warm-200 shadow-lg p-6 text-center">
          <div className="text-lg font-semibold text-brand-900">Store Not Selected</div>
          <div className="text-sm text-brand-600 mt-2">
            Please go back to the landing page and select a protocol + store.
          </div>
          <div className="mt-5">
            <a
              href="/"
              className="inline-flex items-center justify-center px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700"
            >
              Back to Home
            </a>
          </div>
        </div>
      </div>
    );
  }

  return (
    <SplitScreen
      left={
        <ChatInterface
          onJourneyEvent={handleJourneyEvent}
          onOrderComplete={handleOrderComplete}
          onStatsUpdate={handleStatsUpdate}
          onReset={handleReset}
          protocol={protocol}
          store={store}
        />
      }
      right={
        <>
          <div className="bg-white rounded-xl border border-warm-200 shadow-lg overflow-hidden flex flex-col flex-1 min-h-0">
            <div className="px-5 py-3.5 border-b border-warm-200 bg-gradient-to-r from-brand-900 to-brand-800">
              <h2 className="font-bold text-white text-base">Merchant Dashboard</h2>
              <p className="text-xs text-brand-300">Real-time view of your AI commerce activity</p>
            </div>

            <div className="p-4 space-y-4 overflow-y-auto scrollbar-thin flex-1">
              <DashboardPreview orders={stats.orders} revenue={stats.revenue} />

              <div>
                <h3 className="text-xs font-semibold text-brand-600 uppercase tracking-wider mb-2">Checkout Journey</h3>
                <JourneyTimeline events={events} />
              </div>

              <div>
                <h3 className="text-xs font-semibold text-brand-600 uppercase tracking-wider mb-2">Recent Orders</h3>
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
