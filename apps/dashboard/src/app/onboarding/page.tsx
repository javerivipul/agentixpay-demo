'use client';

import Link from 'next/link';
import { ShoppingBag, Globe, Server, Sparkles } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';

const platforms = [
  {
    id: 'shopify',
    name: 'Shopify',
    description: 'Connect your Shopify store via OAuth. Best for Shopify app developers.',
    icon: ShoppingBag,
    href: '/onboarding/connect/shopify',
    color: 'text-emerald-600',
    bg: 'bg-emerald-50',
  },
  {
    id: 'woocommerce',
    name: 'WooCommerce',
    description: 'Connect with REST API keys. For WordPress/WooCommerce plugin developers.',
    icon: Globe,
    href: '/onboarding/connect/woocommerce',
    color: 'text-violet-600',
    bg: 'bg-violet-50',
  },
  {
    id: 'vendure',
    name: 'Vendure',
    description: 'Connect via GraphQL API. For headless commerce on Vendure.',
    icon: Server,
    href: '/onboarding/connect/vendure',
    color: 'text-blue-600',
    bg: 'bg-blue-50',
  },
  {
    id: 'demo',
    name: 'Demo Mode',
    description: 'Try Agentix with mock data. No platform connection needed.',
    icon: Sparkles,
    href: '/onboarding/sync',
    color: 'text-amber-600',
    bg: 'bg-amber-50',
  },
];

export default function OnboardingPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <div className="w-full max-w-2xl space-y-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold tracking-tight">Welcome to Agentix</h1>
          <p className="mt-2 text-muted-foreground">
            Choose your e-commerce platform to get started
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          {platforms.map((platform) => (
            <Link key={platform.id} href={platform.href}>
              <Card className="cursor-pointer transition-all hover:border-primary/30 hover:shadow-md">
                <CardHeader className="pb-3">
                  <div className={cn('inline-flex rounded-lg p-2.5 w-fit', platform.bg)}>
                    <platform.icon className={cn('h-5 w-5', platform.color)} />
                  </div>
                  <CardTitle className="text-base">{platform.name}</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-xs leading-relaxed">
                    {platform.description}
                  </CardDescription>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
