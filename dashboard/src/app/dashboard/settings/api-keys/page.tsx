'use client';

import { useState } from 'react';
import { Copy, Eye, EyeOff, RefreshCw, Key } from 'lucide-react';
import { Header } from '@/components/dashboard/header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';

export default function ApiKeysPage() {
  const [showSecret, setShowSecret] = useState(false);

  // Demo values
  const apiKey = 'agx_demo_1234567890abcdef1234567890abcdef1234567890abcdef';
  const apiSecret = '0a1b2c3d4e5f...hidden';

  function handleCopy(text: string, label: string) {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copied to clipboard`);
  }

  return (
    <div className="flex flex-col">
      <Header title="API Keys" description="Manage your API credentials" />

      <div className="flex-1 space-y-6 p-6 max-w-2xl">
        {/* Current keys */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base">API Credentials</CardTitle>
                <CardDescription>Use these to authenticate protocol requests</CardDescription>
              </div>
              <Badge variant="success">Active</Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* API Key */}
            <div className="space-y-2">
              <Label>API Key</Label>
              <div className="flex items-center gap-2">
                <Input
                  readOnly
                  value={apiKey}
                  className="font-mono text-xs"
                />
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => handleCopy(apiKey, 'API Key')}
                >
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Send as <code className="rounded bg-muted px-1 py-0.5">X-API-Key</code> header
              </p>
            </div>

            <Separator />

            {/* API Secret */}
            <div className="space-y-2">
              <Label>API Secret</Label>
              <div className="flex items-center gap-2">
                <Input
                  readOnly
                  type={showSecret ? 'text' : 'password'}
                  value={apiSecret}
                  className="font-mono text-xs"
                />
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setShowSecret(!showSecret)}
                >
                  {showSecret ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => handleCopy(apiSecret, 'API Secret')}
                >
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Keep this secret safe. It cannot be retrieved after this page is closed.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Rotate keys */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Rotate Keys</CardTitle>
            <CardDescription>
              Generate new API credentials. Your old keys will be invalidated immediately.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant="outline" className="text-destructive hover:text-destructive">
              <RefreshCw className="mr-2 h-4 w-4" />
              Rotate API Keys
            </Button>
          </CardContent>
        </Card>

        {/* Usage */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Quick Start</CardTitle>
            <CardDescription>Test your integration with a simple cURL command</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="relative">
              <pre className="overflow-x-auto rounded-lg bg-foreground/5 p-4 text-xs leading-relaxed">
                <code>{`curl ${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/acp/v1/products \\
  -H "X-API-Key: ${apiKey}"`}</code>
              </pre>
              <Button
                variant="ghost"
                size="sm"
                className="absolute right-2 top-2"
                onClick={() =>
                  handleCopy(
                    `curl ${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/acp/v1/products -H "X-API-Key: ${apiKey}"`,
                    'cURL command',
                  )
                }
              >
                <Copy className="h-3 w-3" />
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
