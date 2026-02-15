'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, ExternalLink } from 'lucide-react';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

export default function ConnectShopifyPage() {
  const router = useRouter();
  const [shopDomain, setShopDomain] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleConnect() {
    if (!shopDomain) {
      toast.error('Please enter your Shopify store domain');
      return;
    }

    setLoading(true);
    // In production, this would initiate OAuth flow
    toast.info('Shopify OAuth', {
      description: 'OAuth integration coming soon. Using demo mode for now.',
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
            <CardTitle>Connect Shopify</CardTitle>
            <CardDescription>
              Enter your Shopify store domain to begin the OAuth connection
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="shop">Store Domain</Label>
              <div className="flex items-center gap-2">
                <Input
                  id="shop"
                  placeholder="your-store"
                  value={shopDomain}
                  onChange={(e) => setShopDomain(e.target.value)}
                />
                <span className="whitespace-nowrap text-sm text-muted-foreground">.myshopify.com</span>
              </div>
            </div>
          </CardContent>
          <CardFooter className="flex-col gap-3">
            <Button className="w-full" onClick={handleConnect} disabled={loading}>
              {loading ? 'Connecting...' : 'Connect with Shopify'}
              <ExternalLink className="ml-2 h-4 w-4" />
            </Button>
            <p className="text-xs text-center text-muted-foreground">
              You&apos;ll be redirected to Shopify to authorize the connection
            </p>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
