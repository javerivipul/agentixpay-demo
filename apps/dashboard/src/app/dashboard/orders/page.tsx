'use client';

import { Header } from '@/components/dashboard/header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { ShoppingCart } from 'lucide-react';

// Demo orders
const DEMO_ORDERS = [
  {
    id: 'ord_001',
    orderNumber: 'MK-A1B2C3',
    email: 'alice@example.com',
    items: 2,
    total: 229.98,
    status: 'CONFIRMED',
    protocol: 'ACP',
    createdAt: '2 hours ago',
  },
  {
    id: 'ord_002',
    orderNumber: 'MK-D4E5F6',
    email: 'bob@example.com',
    items: 1,
    total: 299.99,
    status: 'PROCESSING',
    protocol: 'ACP',
    createdAt: '5 hours ago',
  },
  {
    id: 'ord_003',
    orderNumber: 'MK-G7H8I9',
    email: 'carol@example.com',
    items: 3,
    total: 83.97,
    status: 'SHIPPED',
    protocol: 'UCP',
    createdAt: 'Yesterday',
  },
];

function statusBadgeVariant(status: string) {
  switch (status) {
    case 'CONFIRMED':
    case 'DELIVERED':
      return 'success' as const;
    case 'PROCESSING':
    case 'SHIPPED':
      return 'warning' as const;
    case 'CANCELLED':
    case 'REFUNDED':
      return 'destructive' as const;
    default:
      return 'secondary' as const;
  }
}

export default function OrdersPage() {
  return (
    <div className="flex flex-col">
      <Header title="Orders" description="Orders placed through AI agent protocols" />

      <div className="flex-1 space-y-4 p-6">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <ShoppingCart className="h-4 w-4" />
          <span>{DEMO_ORDERS.length} orders</span>
          <Badge variant="secondary" className="text-xs">Demo Data</Badge>
        </div>

        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Order</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead className="text-center">Items</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Protocol</TableHead>
                  <TableHead>Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {DEMO_ORDERS.map((order) => (
                  <TableRow key={order.id}>
                    <TableCell className="font-medium">
                      <code className="rounded bg-muted px-1.5 py-0.5 text-xs">{order.orderNumber}</code>
                    </TableCell>
                    <TableCell>{order.email}</TableCell>
                    <TableCell className="text-center">{order.items}</TableCell>
                    <TableCell className="text-right">${order.total.toFixed(2)}</TableCell>
                    <TableCell>
                      <Badge variant={statusBadgeVariant(order.status)}>{order.status}</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-xs">{order.protocol}</Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground">{order.createdAt}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
