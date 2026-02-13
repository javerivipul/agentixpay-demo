'use client';

import { Bot, User } from 'lucide-react';
import { cn } from '@/lib/utils';

interface MessageBubbleProps {
  sender: 'user' | 'ai';
  text: string;
  typing?: boolean;
  children?: React.ReactNode;
}

export function MessageBubble({ sender, text, typing, children }: MessageBubbleProps) {
  const isUser = sender === 'user';

  return (
    <div className={cn('flex gap-3 animate-slide-up', isUser && 'flex-row-reverse')}>
      <div
        className={cn(
          'w-8 h-8 rounded-full flex items-center justify-center shrink-0',
          isUser ? 'bg-brand-800 text-white' : 'bg-accent-600 text-white'
        )}
      >
        {isUser ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
      </div>
      <div className="max-w-[80%] space-y-2">
        <div
          className={cn(
            'px-4 py-2.5 rounded-2xl text-sm leading-relaxed',
            isUser
              ? 'bg-brand-800 text-white rounded-tr-sm'
              : 'bg-accent-50 text-brand-900 rounded-tl-sm border border-accent-200'
          )}
        >
          {typing ? (
            <span className="flex gap-1 py-1">
              <span className="w-1.5 h-1.5 bg-brand-400 rounded-full animate-typing" style={{ animationDelay: '0ms' }} />
              <span className="w-1.5 h-1.5 bg-brand-400 rounded-full animate-typing" style={{ animationDelay: '200ms' }} />
              <span className="w-1.5 h-1.5 bg-brand-400 rounded-full animate-typing" style={{ animationDelay: '400ms' }} />
            </span>
          ) : (
            text
          )}
        </div>
        {children}
      </div>
    </div>
  );
}
