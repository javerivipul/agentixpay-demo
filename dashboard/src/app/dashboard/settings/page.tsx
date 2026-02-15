'use client';

import { useState } from 'react';
import { Header } from '@/components/dashboard/header';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';

export default function SettingsPage() {
  const [companyName, setCompanyName] = useState('My ISV Company');
  const [contactEmail, setContactEmail] = useState('admin@example.com');
  const [webhookUrl, setWebhookUrl] = useState('');

  function handleSave() {
    toast.success('Settings saved', {
      description: 'Your changes have been saved successfully.',
    });
  }

  return (
    <div className="flex flex-col">
      <Header title="Settings" description="Manage your ISV account settings" />

      <div className="flex-1 space-y-6 p-6 max-w-2xl">
        {/* General */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">General</CardTitle>
            <CardDescription>Basic account information</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="companyName">Company Name</Label>
              <Input
                id="companyName"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Contact Email</Label>
              <Input
                id="email"
                type="email"
                value={contactEmail}
                onChange={(e) => setContactEmail(e.target.value)}
              />
            </div>
          </CardContent>
          <CardFooter>
            <Button onClick={handleSave}>Save Changes</Button>
          </CardFooter>
        </Card>

        {/* Protocols */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Protocols</CardTitle>
            <CardDescription>AI agent protocols enabled for your account</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">ACP (Agent Commerce Protocol)</p>
                <p className="text-xs text-muted-foreground">Used by OpenAI, Stripe</p>
              </div>
              <Badge variant="success">Enabled</Badge>
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">UCP (Unified Commerce Protocol)</p>
                <p className="text-xs text-muted-foreground">Used by Google</p>
              </div>
              <Badge variant="success">Enabled</Badge>
            </div>
          </CardContent>
        </Card>

        {/* Webhooks */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Webhooks</CardTitle>
            <CardDescription>Receive notifications for order and checkout events</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="webhook">Webhook URL</Label>
              <Input
                id="webhook"
                placeholder="https://your-domain.com/webhook"
                value={webhookUrl}
                onChange={(e) => setWebhookUrl(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                We&apos;ll send POST requests for order events to this URL
              </p>
            </div>
          </CardContent>
          <CardFooter>
            <Button onClick={handleSave}>Save Webhook</Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
