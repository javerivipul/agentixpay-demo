'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

export default function ConnectWooCommercePage() {
  const router = useRouter();
  const [storeUrl, setStoreUrl] = useState('');
  const [consumerKey, setConsumerKey] = useState('');
  const [consumerSecret, setConsumerSecret] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleConnect() {
    if (!storeUrl || !consumerKey || !consumerSecret) {
      toast.error('Please fill in all fields');
      return;
    }

    setLoading(true);
    // In production, this would validate & store credentials
    toast.info('WooCommerce connection', {
      description: 'API key integration coming soon. Using demo mode for now.',
    });

    setTimeout(() => {
      setLoading(false);
      router.push('/onboarding/sync');
    }, 1500);
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <div className="w-full max-w-md space-y-6">
        <Link
          href="/onboarding"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to platform selection
        </Link>

        <Card>
          <CardHeader>
            <CardTitle>Connect WooCommerce</CardTitle>
            <CardDescription>
              Enter your WooCommerce REST API credentials
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="url">Store URL</Label>
              <Input
                id="url"
                placeholder="https://your-store.com"
                value={storeUrl}
                onChange={(e) => setStoreUrl(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="key">Consumer Key</Label>
              <Input
                id="key"
                placeholder="ck_..."
                value={consumerKey}
                onChange={(e) => setConsumerKey(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="secret">Consumer Secret</Label>
              <Input
                id="secret"
                type="password"
                placeholder="cs_..."
                value={consumerSecret}
                onChange={(e) => setConsumerSecret(e.target.value)}
              />
            </div>
          </CardContent>
          <CardFooter className="flex-col gap-3">
            <Button className="w-full" onClick={handleConnect} disabled={loading}>
              {loading ? 'Connecting...' : 'Connect WooCommerce'}
            </Button>
            <p className="text-xs text-center text-muted-foreground">
              Generate API keys in WooCommerce &gt; Settings &gt; Advanced &gt; REST API
            </p>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
