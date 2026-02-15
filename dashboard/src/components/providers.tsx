'use client';

import { ClerkProvider } from '@clerk/nextjs';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'sonner';
import { TooltipProvider } from '@/components/ui/tooltip';
import { useState } from 'react';

const clerkKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;

function AuthProvider({ children }: { children: React.ReactNode }) {
  if (!clerkKey) {
    // Skip Clerk in dev when key is not configured
    return <>{children}</>;
  }
  return <ClerkProvider publishableKey={clerkKey}>{children}</ClerkProvider>;
}

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 30 * 1000,
            retry: 1,
          },
        },
      }),
  );

  return (
    <AuthProvider>
      <QueryClientProvider client={queryClient}>
        <TooltipProvider delayDuration={300}>
          {children}
          <Toaster
            position="bottom-right"
            toastOptions={{
              className: 'border border-border bg-card text-card-foreground shadow-lg',
            }}
          />
        </TooltipProvider>
      </QueryClientProvider>
    </AuthProvider>
  );
}
