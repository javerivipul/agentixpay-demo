'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Package, CheckCircle2 } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';

export default function SyncPage() {
  const router = useRouter();
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState('Connecting to platform...');
  const [complete, setComplete] = useState(false);

  useEffect(() => {
    const steps = [
      { progress: 15, status: 'Connecting to platform...' },
      { progress: 30, status: 'Fetching product catalog...' },
      { progress: 55, status: 'Syncing 12 products...' },
      { progress: 75, status: 'Building search index...' },
      { progress: 90, status: 'Configuring protocol endpoints...' },
      { progress: 100, status: 'Sync complete!' },
    ];

    let i = 0;
    const interval = setInterval(() => {
      if (i < steps.length) {
        const step = steps[i]!;
        setProgress(step.progress);
        setStatus(step.status);
        i++;
      } else {
        clearInterval(interval);
        setComplete(true);
        setTimeout(() => {
          router.push('/onboarding/complete');
        }, 1000);
      }
    }, 800);

    return () => clearInterval(interval);
  }, [router]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <div className="w-full max-w-md">
        <Card>
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
              {complete ? (
                <CheckCircle2 className="h-6 w-6 text-primary" />
              ) : (
                <Package className="h-6 w-6 text-primary animate-pulse" />
              )}
            </div>
            <CardTitle>Syncing Products</CardTitle>
            <CardDescription>
              Setting up your AI commerce integration
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Progress value={progress} />
            <p className="text-center text-sm text-muted-foreground">{status}</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
