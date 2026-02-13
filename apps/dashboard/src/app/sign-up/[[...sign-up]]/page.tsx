'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

function ClerkSignUp() {
  try {
    const { SignUp } = require('@clerk/nextjs');
    return (
      <SignUp
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

export default function SignUpPage() {
  const clerkConfigured = !!process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;

  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="w-full max-w-md space-y-8 px-4">
        <div className="text-center">
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Agentix</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Create your ISV account
          </p>
        </div>
        {clerkConfigured ? (
          <ClerkSignUp />
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
                <Link href="/onboarding">Start Onboarding</Link>
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
