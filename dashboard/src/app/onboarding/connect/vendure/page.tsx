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

export default function ConnectVendurePage() {
  const router = useRouter();
  const [apiUrl, setApiUrl] = useState('');
  const [authToken, setAuthToken] = useState('');
  const [channelToken, setChannelToken] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleConnect() {
    if (!apiUrl) {
      toast.error('Please enter the Vendure API URL');
      return;
    }

    setLoading(true);
    toast.info('Vendure connection', {
      description: 'Connecting to your Vendure instance...',
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
            <CardTitle>Connect Vendure</CardTitle>
            <CardDescription>
              Enter your Vendure Shop API URL and authentication details
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="apiUrl">Shop API URL</Label>
              <Input
                id="apiUrl"
                placeholder="https://your-vendure.com/shop-api"
                value={apiUrl}
                onChange={(e) => setApiUrl(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="token">Auth Token (optional)</Label>
              <Input
                id="token"
                type="password"
                placeholder="Bearer token for authentication"
                value={authToken}
                onChange={(e) => setAuthToken(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="channel">Channel Token (optional)</Label>
              <Input
                id="channel"
                placeholder="For multi-channel Vendure setups"
                value={channelToken}
                onChange={(e) => setChannelToken(e.target.value)}
              />
            </div>
          </CardContent>
          <CardFooter className="flex-col gap-3">
            <Button className="w-full" onClick={handleConnect} disabled={loading}>
              {loading ? 'Connecting...' : 'Connect Vendure'}
            </Button>
            <p className="text-xs text-center text-muted-foreground">
              Use the Shop API URL, not the Admin API
            </p>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
