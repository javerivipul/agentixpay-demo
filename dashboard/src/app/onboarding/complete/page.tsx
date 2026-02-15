'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Copy, CheckCircle2, ArrowRight } from 'lucide-react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';

export default function OnboardingCompletePage() {
  // In production, these would come from the tenant creation API response
  const apiKey = 'agx_demo_1234567890abcdef1234567890abcdef1234567890abcdef';
  const apiSecret = 'a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2';
  const [copiedKey, setCopiedKey] = useState(false);
  const [copiedSecret, setCopiedSecret] = useState(false);

  function handleCopy(text: string, type: 'key' | 'secret') {
    navigator.clipboard.writeText(text);
    if (type === 'key') setCopiedKey(true);
    else setCopiedSecret(true);
    toast.success(`${type === 'key' ? 'API Key' : 'API Secret'} copied`);
    setTimeout(() => {
      if (type === 'key') setCopiedKey(false);
      else setCopiedSecret(false);
    }, 2000);
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <div className="w-full max-w-lg space-y-6">
        <div className="text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100">
            <CheckCircle2 className="h-8 w-8 text-emerald-600" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight">You&apos;re all set!</h1>
          <p className="mt-2 text-muted-foreground">
            Your platform is connected and products are synced. Here are your API credentials.
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">API Credentials</CardTitle>
            <CardDescription>
              Save these now — the API secret won&apos;t be shown again
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>API Key</Label>
              <div className="flex gap-2">
                <Input readOnly value={apiKey} className="font-mono text-xs" />
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => handleCopy(apiKey, 'key')}
                >
                  {copiedKey ? (
                    <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>

            <Separator />

            <div className="space-y-2">
              <Label>API Secret</Label>
              <div className="flex gap-2">
                <Input readOnly value={apiSecret} className="font-mono text-xs" />
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => handleCopy(apiSecret, 'secret')}
                >
                  {copiedSecret ? (
                    <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </Button>
              </div>
              <p className="text-xs text-destructive font-medium">
                Copy this now. It cannot be retrieved later.
              </p>
            </div>
          </CardContent>
          <CardFooter>
            <Button className="w-full" asChild>
              <Link href="/dashboard">
                Go to Dashboard
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
