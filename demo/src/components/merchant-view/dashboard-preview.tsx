'use client';

import { ShoppingCart, DollarSign, TrendingUp, Users } from 'lucide-react';
import { formatCents } from '@/lib/utils';

interface DashboardPreviewProps {
  orders: number;
  revenue: number;
}

function StatCard({
  icon: Icon,
  label,
  value,
  iconColor,
  bgColor,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
  iconColor: string;
  bgColor: string;
}) {
  return (
    <div className="bg-white p-4 rounded-xl border border-warm-200 shadow-sm">
      <div className="flex items-center gap-2 mb-1">
        <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${bgColor}`}>
          <Icon className={`w-3.5 h-3.5 ${iconColor}`} />
        </div>
        <span className="text-xs font-medium text-brand-500">{label}</span>
      </div>
      <div className="text-xl font-bold text-brand-900">{value}</div>
    </div>
  );
}

export function DashboardPreview({ orders, revenue }: DashboardPreviewProps) {
  return (
    <div className="grid grid-cols-2 gap-3">
      <StatCard icon={ShoppingCart} label="Orders" value={String(orders)} iconColor="text-blue-600" bgColor="bg-blue-100" />
      <StatCard icon={DollarSign} label="Revenue" value={formatCents(revenue)} iconColor="text-emerald-600" bgColor="bg-emerald-100" />
      <StatCard icon={Users} label="AI Agents" value="1 active" iconColor="text-violet-600" bgColor="bg-violet-100" />
      <StatCard icon={TrendingUp} label="Protocol" value="ACP v1" iconColor="text-amber-600" bgColor="bg-amber-100" />
    </div>
  );
}
