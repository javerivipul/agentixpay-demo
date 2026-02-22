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

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

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
  const idRef = useRef(0);
  const checkoutInFlightRef = useRef(false);
  const sendInFlightRef = useRef(false);

  const nextId = useCallback((prefix: string) => {
    idRef.current += 1;
    return `${prefix}_${idRef.current}`;
  }, []);

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
  const [isCheckoutRunning, setIsCheckoutRunning] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const statsRef = useRef({ orders: 0, revenue: 0 });

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const selectedModelLabel =
    LLM_MODELS.find((model) => model.value === selectedModel)?.label || selectedModel;

  const handleSend = useCallback(async () => {
    const input = draft.trim();
    if (!input || isLoading || isCheckoutRunning || sendInFlightRef.current) {
      return;
    }

    sendInFlightRef.current = true;

    const history: Array<{ role: 'user' | 'assistant'; content: string }> = messages
      .filter((m) => !m.typing)
      .map((m) => ({ role: m.sender === 'ai' ? 'assistant' : 'user', content: m.text }));

    setDraft('');
    setIsLoading(true);
    setMessages((prev) => [
      ...prev,
      { id: nextId('user'), sender: 'user', text: input },
      { id: nextId('typing'), sender: 'ai', text: '', typing: true },
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
            id: nextId('ai'),
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
            id: nextId('ai_error'),
            sender: 'ai',
            text: error instanceof Error ? error.message : 'Failed to process your request.',
          },
        ];
      });
    } finally {
      setIsLoading(false);
      sendInFlightRef.current = false;
    }
  }, [draft, isLoading, isCheckoutRunning, messages, nextId, onJourneyEvent, selectedModel]);

  const handleSelectProduct = useCallback(async (product: DemoProduct) => {
    if (isLoading || isCheckoutRunning || checkoutInFlightRef.current) {
      return;
    }

    // Open product page immediately (avoids popup blockers).
    if (product.product_url) {
      window.open(product.product_url, '_blank', 'noopener,noreferrer');
      onJourneyEvent(createJourneyEvent('PRODUCT_VIEW', 3, `Opened product page for ${product.title}`));
    }

    checkoutInFlightRef.current = true;
    setIsCheckoutRunning(true);
    setMessages((prev) => [
      ...prev,
      { id: nextId('user_buy'), sender: 'user', text: `Buy: ${product.title}` },
      { id: nextId('typing_checkout'), sender: 'ai', text: '', typing: true },
    ]);

    try {
      onJourneyEvent(createJourneyEvent('CHECKOUT_INIT', 3, `Creating checkout for ${product.title}`));
      await sleep(600);

      setMessages((prev) => {
        const filtered = prev.filter((m) => !m.typing);
        return [
          ...filtered,
          {
            id: nextId('ai_checkout_1'),
            sender: 'ai',
            text: 'Great choice. Creating a checkout now...',
          },
          { id: nextId('typing_checkout_2'), sender: 'ai', text: '', typing: true },
        ];
      });

      onJourneyEvent(createJourneyEvent('ADDRESS_SET', 4, 'Adding shipping details')); 
      await sleep(800);

      setMessages((prev) => {
        const filtered = prev.filter((m) => !m.typing);
        return [
          ...filtered,
          {
            id: nextId('ai_checkout_2'),
            sender: 'ai',
            text: 'Shipping address added. Calculating taxes and shipping...',
          },
          { id: nextId('typing_checkout_3'), sender: 'ai', text: '', typing: true },
        ];
      });

      onJourneyEvent(createJourneyEvent('PAYMENT_PENDING', 5, 'Submitting payment token')); 
      await sleep(900);

      setMessages((prev) => {
        const filtered = prev.filter((m) => !m.typing);
        return [
          ...filtered,
          {
            id: nextId('ai_checkout_3'),
            sender: 'ai',
            text: 'Processing payment...',
          },
          { id: nextId('typing_checkout_4'), sender: 'ai', text: '', typing: true },
        ];
      });

      onJourneyEvent(createJourneyEvent('ORDER_FINALIZED', 6, 'Order confirmed - fulfillment triggered')); 
      await sleep(800);

      const checkout = {
        id: nextId('demo_checkout'),
        status: 'completed',
        totals: [{ type: 'total', amount: product.price }],
        currency: product.currency,
        line_items: [
          {
            id: product.id,
            sku: product.sku,
            title: product.title,
            quantity: 1,
            amount: product.price,
          },
        ],
      };

      statsRef.current = {
        orders: statsRef.current.orders + 1,
        revenue: statsRef.current.revenue + product.price,
      };

      onOrderComplete(checkout);
      onStatsUpdate({ ...statsRef.current });

      setMessages((prev) => {
        const filtered = prev.filter((m) => !m.typing);
        return [
          ...filtered,
          {
            id: nextId('ai_checkout_done'),
            sender: 'ai',
            text: 'Order confirmed. Your item is on its way.',
          },
        ];
      });
    } catch (error) {
      setMessages((prev) => {
        const filtered = prev.filter((m) => !m.typing);
        return [
          ...filtered,
          {
            id: nextId('ai_checkout_error'),
            sender: 'ai',
            text: error instanceof Error ? error.message : 'Checkout demo flow failed.',
          },
        ];
      });
    } finally {
      setMessages((prev) => prev.filter((m) => !m.typing));
      setIsCheckoutRunning(false);
      checkoutInFlightRef.current = false;
    }
  }, [isCheckoutRunning, isLoading, nextId, onJourneyEvent, onOrderComplete, onStatsUpdate]);

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
    setIsCheckoutRunning(false);
    statsRef.current = { orders: 0, revenue: 0 };
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
          <span className="font-mono text-xs text-accent-200 truncate">AI Agent - Agentic Commerce Protocol</span>
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
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 mt-3">
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
        <div className="flex flex-wrap items-center gap-2 mb-2">
          <select
            value={selectedModel}
            onChange={(e) => setSelectedModel(e.target.value)}
            className="w-full sm:w-52 rounded-lg border border-warm-300 bg-white px-3 py-2 text-sm text-brand-700"
          >
            {LLM_MODELS.map((model) => (
              <option key={model.value} value={model.value}>
                {model.label}
              </option>
            ))}
          </select>
          <button
            onClick={handleReset}
            className="sm:ml-auto flex items-center gap-2 px-3 py-2 bg-accent-100 text-accent-700 rounded-lg font-medium text-sm hover:bg-accent-200 transition-all"
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
            disabled={isLoading || isCheckoutRunning}
          />
          <button
            type="submit"
            disabled={isLoading || isCheckoutRunning || !draft.trim()}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-accent-600 text-white text-sm font-medium hover:bg-accent-700 disabled:bg-accent-300"
          >
            {isLoading || isCheckoutRunning ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            Send
          </button>
        </form>
      </div>
    </div>
  );
}
