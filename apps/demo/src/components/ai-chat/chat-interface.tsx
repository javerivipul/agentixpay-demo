'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { RotateCcw, CheckCircle, Loader2 } from 'lucide-react';
import { MessageBubble } from './message-bubble';
import { ProductCard } from './product-card';
import {
  STYLE_FILTERS,
  searchProducts,
  createCheckoutSteps,
  createJourneyEvent,
  type DemoMessage,
  type DemoProduct,
  type ScenarioContext,
  type JourneyEvent,
} from '@/lib/scenarios';

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

type Phase = 'filter' | 'browsing' | 'running' | 'complete';

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
      text: "Welcome to Agentix! We're connected to a live Shopify catalog via the Agentic Commerce Protocol.\n\nPick a style to browse:",
      choices: STYLE_FILTERS,
    },
  ]);
  const [phase, setPhase] = useState<Phase>('filter');
  const [selectedProduct, setSelectedProduct] = useState<DemoProduct | null>(null);

  // Use refs for stats to avoid stale closures in async callbacks
  const statsRef = useRef({ orders: 0, revenue: 0 });
  const ctxRef = useRef<ScenarioContext>({});
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  /** User clicked a style filter button */
  const handleFilterSelect = useCallback(async (value: string) => {
    if (phase !== 'filter') return;
    setPhase('running');

    const filterObj = STYLE_FILTERS.find((f) => f.value === value);
    const label = filterObj?.label ?? 'Browse All';

    // Disable the filter buttons by removing choices from welcome message
    setMessages((prev) =>
      prev.map((m) => (m.id === 'welcome' ? { ...m, choices: undefined } : m))
    );

    // Show user message
    setMessages((prev) => [
      ...prev,
      { id: 'user_filter', sender: 'user', text: `Show me ${label}` },
    ]);
    await sleep(500);

    // Show typing
    setMessages((prev) => [
      ...prev,
      { id: 'typing_search', sender: 'ai', text: '', typing: true },
    ]);

    // Fire search journey events
    onJourneyEvent(createJourneyEvent('PRODUCT_SEARCH', 1, `Agent searching catalog: "${value || 'all t-shirts'}"`));
    await sleep(600);
    onJourneyEvent(createJourneyEvent('PRODUCT_RESULTS', 2, 'Catalog returned matching products to agent'));

    // Search
    let products: DemoProduct[] = [];
    try {
      products = await searchProducts(value);
    } catch (err) {
      console.error('Search failed:', err);
    }

    await sleep(400);

    // Remove typing, show results
    const resultText = products.length > 0
      ? `Here are ${products.length} ${label.toLowerCase()} under $50. Click one to purchase!`
      : `No products found for "${label}". Try another style!`;

    setMessages((prev) => {
      const filtered = prev.filter((m) => m.id !== 'typing_search');
      return [
        ...filtered,
        {
          id: 'ai_results',
          sender: 'ai',
          text: resultText,
          products,
        },
      ];
    });

    setPhase(products.length > 0 ? 'browsing' : 'filter');

    // If no products, re-show filter buttons
    if (products.length === 0) {
      setMessages((prev) => [
        ...prev,
        {
          id: 'retry_filter',
          sender: 'ai',
          text: 'Pick another style:',
          choices: STYLE_FILTERS,
        },
      ]);
    }
  }, [phase, onJourneyEvent]);

  /** User clicked a product card */
  const handleSelectProduct = useCallback(async (product: DemoProduct) => {
    if (phase !== 'browsing') return;
    setPhase('running');
    setSelectedProduct(product);
    ctxRef.current.selectedProduct = product;

    // Show user message
    setMessages((prev) => [
      ...prev,
      { id: 'user_select', sender: 'user', text: `I'll take the ${product.title}` },
    ]);
    await sleep(600);

    // Auto-advance through checkout steps
    const steps = createCheckoutSteps();
    for (let i = 0; i < steps.length; i++) {
      const step = steps[i]!;

      // Show typing
      setMessages((prev) => [
        ...prev,
        { id: `typing_step_${i}`, sender: 'ai', text: '', typing: true },
      ]);

      // Fire journey events with longer delays so investors can watch the right panel
      for (const evt of step.journeyEvents) {
        await sleep(500);
        onJourneyEvent(createJourneyEvent(evt.type, evt.stage, evt.message));
      }

      // Execute action
      let result: { products?: DemoProduct[]; checkout?: Record<string, unknown> } = {};
      try {
        result = await step.action(ctxRef.current);
      } catch (err) {
        console.error(`Checkout step ${i} failed:`, err);
      }

      await sleep(800);

      // Remove typing, show AI message
      setMessages((prev) => {
        const filtered = prev.filter((m) => m.id !== `typing_step_${i}`);
        const aiMsg: DemoMessage = {
          id: `ai_step_${i}`,
          sender: 'ai',
          text: step.aiMessage,
          checkout: result.checkout,
        };
        return [...filtered, aiMsg];
      });

      // Check if order completed — use ref to avoid stale closure
      if (result.checkout && (result.checkout as Record<string, unknown>).status === 'completed') {
        const checkout = result.checkout as Record<string, unknown>;
        // Try totals array first (real API), then fall back to direct total (mock)
        const totals = checkout.totals as Array<{ type: string; amount: number }> | undefined;
        let total = totals?.find((t) => t.type === 'total')?.amount ?? 0;
        if (total === 0) {
          // Fallback for mock checkout - get total directly
          total = typeof checkout.total === 'number' ? checkout.total : 0;
        }
        statsRef.current = {
          orders: statsRef.current.orders + 1,
          revenue: statsRef.current.revenue + total,
        };
        onOrderComplete(result.checkout);
        onStatsUpdate({ ...statsRef.current });
      }

      await sleep(500);
    }

    // Show completion message
    setMessages((prev) => [
      ...prev,
      {
        id: 'ai_complete',
        sender: 'ai',
        text: "Order confirmed! Your t-shirt is on its way. That's the full ACP flow — from product discovery to payment — all through a single protocol.",
      },
    ]);

    setPhase('complete');
  }, [phase, onJourneyEvent, onOrderComplete, onStatsUpdate]);

  const handleReset = useCallback(() => {
    setMessages([
      {
        id: 'welcome',
        sender: 'ai',
        text: "Welcome to Agentix! We're connected to a live Shopify catalog via the Agentic Commerce Protocol.\n\nPick a style to browse:",
        choices: STYLE_FILTERS,
      },
    ]);
    setPhase('filter');
    setSelectedProduct(null);
    statsRef.current = { orders: 0, revenue: 0 };
    ctxRef.current = {};
    onReset();
  }, [onReset]);

  const phaseLabel = () => {
    switch (phase) {
      case 'filter': return 'Choose a style above';
      case 'browsing': return 'Click a product to purchase';
      case 'running': return 'Processing...';
      case 'complete': return 'Demo complete';
    }
  };

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
          {phaseLabel()}
        </span>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin">
        {messages.map((msg) => (
          <div key={msg.id}>
            <MessageBubble sender={msg.sender} text={msg.text} typing={msg.typing}>
              {/* Filter choice buttons */}
              {msg.choices && msg.choices.length > 0 && (
                <div className="flex flex-wrap justify-center gap-3 mt-3">
                  {msg.choices.map((c) => (
                    <button
                      key={c.value}
                      onClick={() => handleFilterSelect(c.value)}
                      className="px-4 py-2 bg-accent-100 text-accent-700 rounded-full text-sm font-semibold hover:bg-accent-600 hover:text-white transition-all border border-accent-200 hover:border-accent-600 shadow-sm"
                    >
                      {c.label}
                    </button>
                  ))}
                </div>
              )}

              {/* Product cards */}
              {msg.products && msg.products.length > 0 && (
                <div className="grid grid-cols-2 gap-2.5 mt-3">
                  {msg.products.map((p) => (
                    <ProductCard
                      key={p.id}
                      product={p}
                      selected={selectedProduct?.id === p.id}
                      onSelect={phase === 'browsing' ? handleSelectProduct : undefined}
                    />
                  ))}
                </div>
              )}

              {/* Order confirmed badge */}
              {msg.checkout && (msg.checkout as Record<string, unknown>).status === 'completed' && (
                <div className="mt-2 p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-2 text-emerald-700 text-sm">
                  <CheckCircle className="w-4 h-4" />
                  <span className="font-medium">Order confirmed!</span>
                </div>
              )}
            </MessageBubble>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      {/* Action Bar */}
      <div className="px-4 py-3 border-t border-warm-200 bg-warm-50">
        <div className="flex items-center gap-2">
          {phase === 'running' ? (
            <div className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-accent-50 text-accent-600 rounded-full text-sm font-medium animate-pulse border border-accent-200">
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
              Processing order...
            </div>
          ) : phase === 'complete' ? (
            <button
              onClick={handleReset}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-accent-100 text-accent-700 rounded-full font-medium text-sm hover:bg-accent-200 transition-all"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Run Demo Again
            </button>
          ) : phase === 'browsing' ? (
            <div className="flex-1 text-center text-sm text-brand-400 py-2.5">
              Click a product above to purchase it
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
