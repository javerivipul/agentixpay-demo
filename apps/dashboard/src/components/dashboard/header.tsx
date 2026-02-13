'use client';

import { Badge } from '@/components/ui/badge';
import { User } from 'lucide-react';

const clerkConfigured = !!process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;

function UserAvatar() {
  if (clerkConfigured) {
    try {
      const { UserButton } = require('@clerk/nextjs');
      return (
        <UserButton
          afterSignOutUrl="/sign-in"
          appearance={{ elements: { avatarBox: 'h-8 w-8' } }}
        />
      );
    } catch {
      // fall through
    }
  }

  return (
    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted">
      <User className="h-4 w-4 text-muted-foreground" />
    </div>
  );
}

interface HeaderProps {
  title: string;
  description?: string;
}

export function Header({ title, description }: HeaderProps) {
  return (
    <header className="flex h-16 items-center justify-between border-b border-border bg-card/50 px-6">
      <div>
        <div className="flex items-center gap-3">
          <h1 className="text-lg font-semibold text-foreground">{title}</h1>
          <Badge variant="secondary" className="text-xs">
            MVP
          </Badge>
        </div>
        {description && (
          <p className="text-sm text-muted-foreground">{description}</p>
        )}
      </div>
      <div className="flex items-center gap-4">
        <UserAvatar />
      </div>
    </header>
  );
}
