'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

function ClerkSignIn() {
  try {
    // Dynamic import to avoid build errors when Clerk key is missing
    const { SignIn } = require('@clerk/nextjs');
    return (
      <SignIn
        appearance={{
          elements: {
            rootBox: 'w-full',
            card: 'bg-card border border-border shadow-sm rounded-lg',
            headerTitle: 'text-foreground',
            headerSubtitle: 'text-muted-foreground',
            formButtonPrimary: 'bg-primary hover:bg-primary/90 text-primary-foreground',
            formFieldInput: 'border-input bg-background',
            footerActionLink: 'text-primary hover:text-primary/80',
          },
        }}
      />
    );
  } catch {
    return null;
  }
}

export default function SignInPage() {
  const clerkConfigured = !!process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;

  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="w-full max-w-md space-y-8 px-4">
        <div className="text-center">
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Agentix</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Sign in to your ISV dashboard
          </p>
        </div>
        {clerkConfigured ? (
          <ClerkSignIn />
        ) : (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Development Mode</CardTitle>
              <CardDescription>
                Clerk is not configured. Set NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY to enable auth.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button className="w-full" asChild>
                <Link href="/dashboard">Continue to Dashboard</Link>
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
