'use client';

import { CheckCircle2, XCircle, RefreshCw, ExternalLink } from 'lucide-react';
import { Header } from '@/components/dashboard/header';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';

export default function ConnectionPage() {
  // Demo state
  const platform = 'Mock Store (Demo)';
  const isConnected = true;
  const lastSyncAt = new Date().toLocaleString();

  function handleTestConnection() {
    toast.success('Connection test passed', {
      description: 'Your platform is reachable and responding correctly.',
    });
  }

  function handleResync() {
    toast.info('Sync started', {
      description: 'Re-syncing products from your platform...',
    });
  }

  return (
    <div className="flex flex-col">
      <Header title="Connection" description="Platform connection and sync status" />

      <div className="flex-1 space-y-6 p-6 max-w-2xl">
        {/* Connection status */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base">Platform Connection</CardTitle>
                <CardDescription>Your ISV platform integration</CardDescription>
              </div>
              {isConnected ? (
                <Badge variant="success" className="flex items-center gap-1">
                  <CheckCircle2 className="h-3 w-3" />
                  Connected
                </Badge>
              ) : (
                <Badge variant="destructive" className="flex items-center gap-1">
                  <XCircle className="h-3 w-3" />
                  Disconnected
                </Badge>
              )}
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-muted-foreground">Platform</p>
                <p className="font-medium">{platform}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Status</p>
                <p className="font-medium">Active</p>
              </div>
              <div>
                <p className="text-muted-foreground">Connected Since</p>
                <p className="font-medium">{lastSyncAt}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Last Sync</p>
                <p className="font-medium">{lastSyncAt}</p>
              </div>
            </div>
          </CardContent>
          <CardFooter className="gap-3">
            <Button variant="outline" size="sm" onClick={handleTestConnection}>
              <RefreshCw className="mr-2 h-4 w-4" />
              Test Connection
            </Button>
            <Button variant="outline" size="sm" onClick={handleResync}>
              Re-sync Products
            </Button>
          </CardFooter>
        </Card>

        {/* Supported platforms */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Available Platforms</CardTitle>
            <CardDescription>Switch or add a platform connection</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {[
              { name: 'Shopify', desc: 'Connect via OAuth', status: 'Available', url: '/onboarding/connect/shopify' },
              { name: 'WooCommerce', desc: 'Connect with API keys', status: 'Available', url: '/onboarding/connect/woocommerce' },
              { name: 'Vendure', desc: 'Connect with API URL + token', status: 'Available', url: '/onboarding/connect/vendure' },
            ].map((p) => (
              <div key={p.name}>
                <div className="flex items-center justify-between py-2">
                  <div>
                    <p className="text-sm font-medium">{p.name}</p>
                    <p className="text-xs text-muted-foreground">{p.desc}</p>
                  </div>
                  <Button variant="ghost" size="sm" asChild>
                    <a href={p.url}>
                      Connect
                      <ExternalLink className="ml-2 h-3 w-3" />
                    </a>
                  </Button>
                </div>
                <Separator />
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
