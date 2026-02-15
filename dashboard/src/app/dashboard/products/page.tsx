'use client';

import { useState } from 'react';
import { Search, Filter, Package } from 'lucide-react';
import { Header } from '@/components/dashboard/header';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { useProducts } from '@/hooks/use-products';

// Demo data for when API is not connected
const DEMO_PRODUCTS = [
  { id: 'prod_001', title: 'Wireless Noise-Canceling Headphones', sku: 'HEADPHONES-WL-BK', price: 199.99, inventory: 42, status: 'ACTIVE' },
  { id: 'prod_002', title: 'Organic Cotton T-Shirt', sku: 'TSHIRT-ORG-M', price: 29.99, inventory: 200, status: 'ACTIVE' },
  { id: 'prod_003', title: 'Pour-Over Coffee Maker', sku: 'COFFEEMKR-DRP', price: 44.99, inventory: 75, status: 'ACTIVE' },
  { id: 'prod_004', title: 'Urban Commuter Backpack', sku: 'BACKPACK-URBAN', price: 79.99, inventory: 38, status: 'ACTIVE' },
  { id: 'prod_005', title: 'Smartwatch Pro', sku: 'WATCH-SMART-SLV', price: 299.99, inventory: 25, status: 'ACTIVE' },
  { id: 'prod_006', title: 'Non-Slip Yoga Mat', sku: 'YOGA-MAT-PRO', price: 34.99, inventory: 90, status: 'ACTIVE' },
  { id: 'prod_007', title: 'Lavender Soy Candle', sku: 'CANDLE-SOY-LVN', price: 18.99, inventory: 150, status: 'ACTIVE' },
  { id: 'prod_008', title: 'Lightweight Running Sneakers', sku: 'SNEAKERS-RUN-WH', price: 119.99, inventory: 60, status: 'ACTIVE' },
  { id: 'prod_009', title: 'Leather-Bound Journal', sku: 'NOTEBOOK-LTH', price: 24.99, inventory: 110, status: 'ACTIVE' },
  { id: 'prod_010', title: 'Succulent Trio Set', sku: 'PLANT-SUCCULENT', price: 32.99, inventory: 35, status: 'ACTIVE' },
  { id: 'prod_011', title: 'USB-C Fast Charger (65W)', sku: 'CHARGER-USB-C', price: 39.99, inventory: 180, status: 'ACTIVE' },
  { id: 'prod_012', title: 'Insulated Water Bottle (32 oz)', sku: 'WATERBOTTLE-INS', price: 27.99, inventory: 95, status: 'ACTIVE' },
];

export default function ProductsPage() {
  const [search, setSearch] = useState('');
  const [useDemo] = useState(true);

  // In production this would use the hook:
  // const { data, isLoading } = useProducts({ apiKey: tenant.apiKey, query: search });

  const filtered = DEMO_PRODUCTS.filter(
    (p) =>
      p.title.toLowerCase().includes(search.toLowerCase()) ||
      p.sku.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <div className="flex flex-col">
      <Header title="Products" description="Products synced from your platform" />

      <div className="flex-1 space-y-4 p-6">
        {/* Search & Filters */}
        <div className="flex items-center gap-3">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search products..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <Button variant="outline" size="sm">
            <Filter className="mr-2 h-4 w-4" />
            Filters
          </Button>
        </div>

        {/* Product count */}
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Package className="h-4 w-4" />
          <span>{filtered.length} products</span>
          {useDemo && (
            <Badge variant="secondary" className="text-xs">Demo Data</Badge>
          )}
        </div>

        {/* Products table */}
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Product</TableHead>
                  <TableHead>SKU</TableHead>
                  <TableHead className="text-right">Price</TableHead>
                  <TableHead className="text-right">Inventory</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((product) => (
                  <TableRow key={product.id}>
                    <TableCell className="font-medium">{product.title}</TableCell>
                    <TableCell>
                      <code className="rounded bg-muted px-1.5 py-0.5 text-xs">{product.sku}</code>
                    </TableCell>
                    <TableCell className="text-right">${product.price.toFixed(2)}</TableCell>
                    <TableCell className="text-right">{product.inventory}</TableCell>
                    <TableCell>
                      <Badge variant="success">{product.status}</Badge>
                    </TableCell>
                  </TableRow>
                ))}
                {filtered.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={5} className="py-8 text-center text-muted-foreground">
                      No products found
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
