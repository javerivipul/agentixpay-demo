'use client';

import { Package, ShoppingCart, DollarSign, Zap } from 'lucide-react';
import { Header } from '@/components/dashboard/header';
import { StatsCard } from '@/components/dashboard/stats-card';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

export default function DashboardPage() {
  return (
    <div className="flex flex-col">
      <Header title="Dashboard" description="Overview of your AI commerce integration" />

      <div className="flex-1 space-y-6 p-6">
        {/* Stats grid */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatsCard
            title="Products Synced"
            value="12"
            subtitle="from Mock Store"
            icon={Package}
            trend={{ value: 0, label: 'since last sync' }}
          />
          <StatsCard
            title="Orders Today"
            value="0"
            subtitle="0 this week"
            icon={ShoppingCart}
          />
          <StatsCard
            title="Revenue"
            value="$0.00"
            subtitle="this month"
            icon={DollarSign}
          />
          <StatsCard
            title="Active Checkouts"
            value="0"
            subtitle="across all protocols"
            icon={Zap}
          />
        </div>

        {/* Activity & status */}
        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Recent Activity</CardTitle>
              <CardDescription>Latest events from your integration</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {[
                  { event: 'Product sync completed', time: 'Just now', status: 'success' as const },
                  { event: 'API key created', time: '2 minutes ago', status: 'success' as const },
                  { event: 'Platform connected', time: '5 minutes ago', status: 'success' as const },
                ].map((item, i) => (
                  <div key={i} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="h-2 w-2 rounded-full bg-emerald-500" />
                      <span className="text-sm">{item.event}</span>
                    </div>
                    <span className="text-xs text-muted-foreground">{item.time}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Protocol Status</CardTitle>
              <CardDescription>AI agent protocol endpoints</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium">ACP (Agent Commerce Protocol)</p>
                    <p className="text-xs text-muted-foreground">OpenAI / Stripe protocol</p>
                  </div>
                  <Badge variant="success">Active</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium">UCP (Unified Commerce Protocol)</p>
                    <p className="text-xs text-muted-foreground">Google protocol</p>
                  </div>
                  <Badge variant="success">Active</Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
