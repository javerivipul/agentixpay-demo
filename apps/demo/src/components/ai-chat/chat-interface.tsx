'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { RotateCcw, Loader2, Send } from 'lucide-react';
import { MessageBubble } from './message-bubble';
import { ProductCard } from './product-card';
import {
  createJourneyEvent,
  type JourneyEvent,
} from '@/lib/scenarios';
import { LLM_MODELS, sendAgentChat, type DemoProduct } from '@/lib/api';

type DemoMessage = {
  id: string;
  sender: 'user' | 'ai';
  text: string;
  typing?: boolean;
  products?: DemoProduct[];
};

interface ChatInterfaceProps {
  onJourneyEvent: (event: JourneyEvent) => void;
  onOrderComplete: (checkout: Record<string, unknown>) => void;
  onStatsUpdate: (stats: { orders: number; revenue: number }) => void;
  onReset: () => void;
}

export function ChatInterface({ onJourneyEvent, onOrderComplete, onStatsUpdate, onReset }: ChatInterfaceProps) {
  const [messages, setMessages] = useState<DemoMessage[]>([
    {
      id: 'welcome',
      sender: 'ai',
      text: "Welcome to Agentix! Ask for any product in plain English, and I will fetch live Shopify results.",
    },
  ]);
  const [selectedModel, setSelectedModel] = useState<string>('none');
  const [draft, setDraft] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const selectedModelLabel =
    LLM_MODELS.find((model) => model.value === selectedModel)?.label || selectedModel;

  const handleSend = useCallback(async () => {
    const input = draft.trim();
    if (!input || isLoading) {
      return;
    }

    const history: Array<{ role: 'user' | 'assistant'; content: string }> = messages
      .filter((m) => !m.typing)
      .map((m) => ({ role: m.sender === 'ai' ? 'assistant' : 'user', content: m.text }));

    setDraft('');
    setIsLoading(true);
    setMessages((prev) => [
      ...prev,
      { id: `user_${Date.now()}`, sender: 'user', text: input },
      { id: `typing_${Date.now()}`, sender: 'ai', text: '', typing: true },
    ]);

    onJourneyEvent(createJourneyEvent('PRODUCT_SEARCH', 1, `Agent searching live catalog: "${input}"`));

    try {
      const result = await sendAgentChat(input, selectedModel, history);
      onJourneyEvent(createJourneyEvent('PRODUCT_RESULTS', 2, `Returned ${result.products.length} live results`));

      setMessages((prev) => {
        const filtered = prev.filter((m) => !m.typing);
        return [
          ...filtered,
          {
            id: `ai_${Date.now()}`,
            sender: 'ai',
            text: result.reply,
            products: result.products,
          },
        ];
      });
    } catch (error) {
      setMessages((prev) => {
        const filtered = prev.filter((m) => !m.typing);
        return [
          ...filtered,
          {
            id: `ai_error_${Date.now()}`,
            sender: 'ai',
            text: error instanceof Error ? error.message : 'Failed to process your request.',
          },
        ];
      });
    } finally {
      setIsLoading(false);
    }
  }, [draft, isLoading, messages, onJourneyEvent, selectedModel]);

  const handleSelectProduct = useCallback((product: DemoProduct) => {
    if (product.product_url) {
      window.open(product.product_url, '_blank', 'noopener,noreferrer');
      onJourneyEvent(createJourneyEvent('CHECKOUT_INIT', 3, `Opened product page for ${product.title}`));
    }
  }, [onJourneyEvent]);

  const handleReset = useCallback(() => {
    setMessages([
      {
        id: 'welcome',
        sender: 'ai',
        text: "Welcome to Agentix! Ask for any product in plain English, and I will fetch live Shopify results.",
      },
    ]);
    setDraft('');
    setIsLoading(false);
    onReset();
  }, [onReset]);

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="px-4 py-3 border-b border-accent-700 bg-gradient-to-r from-accent-900 to-accent-800 text-white flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full bg-red-400" />
            <div className="w-2.5 h-2.5 rounded-full bg-yellow-400" />
            <div className="w-2.5 h-2.5 rounded-full bg-green-400" />
          </div>
          <span className="font-mono text-xs text-accent-200">AI Agent — Agentic Commerce Protocol</span>
        </div>
        <span className="text-xs bg-accent-700/50 text-accent-200 font-mono px-2 py-0.5 rounded-full">
          {isLoading ? 'Thinking...' : selectedModelLabel}
        </span>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin">
        {messages.map((msg) => (
          <div key={msg.id}>
            <MessageBubble sender={msg.sender} text={msg.text} typing={msg.typing}>
              {/* Product cards */}
              {msg.products && msg.products.length > 0 && (
                <div className="grid grid-cols-2 gap-2.5 mt-3">
                  {msg.products.map((p) => (
                    <ProductCard
                      key={p.id}
                      product={p}
                      onSelect={handleSelectProduct}
                    />
                  ))}
                </div>
              )}
            </MessageBubble>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      {/* Action Bar */}
      <div className="px-4 py-3 border-t border-warm-200 bg-warm-50">
        <div className="flex items-center gap-2 mb-2">
          <select
            value={selectedModel}
            onChange={(e) => setSelectedModel(e.target.value)}
            className="w-52 rounded-lg border border-warm-300 bg-white px-3 py-2 text-sm text-brand-700"
          >
            {LLM_MODELS.map((model) => (
              <option key={model.value} value={model.value}>
                {model.label}
              </option>
            ))}
          </select>
          <button
            onClick={handleReset}
            className="ml-auto flex items-center gap-2 px-3 py-2 bg-accent-100 text-accent-700 rounded-lg font-medium text-sm hover:bg-accent-200 transition-all"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Reset
          </button>
        </div>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            void handleSend();
          }}
          className="flex items-center gap-2"
        >
          <input
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder="Ask for products in plain text..."
            className="flex-1 rounded-lg border border-warm-300 bg-white px-3 py-2 text-sm text-brand-800 outline-none focus:border-accent-500"
            disabled={isLoading}
          />
          <button
            type="submit"
            disabled={isLoading || !draft.trim()}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-accent-600 text-white text-sm font-medium hover:bg-accent-700 disabled:bg-accent-300"
          >
            {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            Send
          </button>
        </form>
      </div>
    </div>
  );
}
