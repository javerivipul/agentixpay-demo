'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { ArrowRight, RotateCcw, CheckCircle } from 'lucide-react';
import { MessageBubble } from './message-bubble';
import { ProductCard } from './product-card';
import {
  createDemoScenario,
  createJourneyEvent,
  type DemoMessage,
  type DemoProduct,
  type ScenarioContext,
  type JourneyEvent,
} from '@/lib/scenarios';
import { cn } from '@/lib/utils';
import { sleep } from '@/lib/utils';

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
      text: "Hi! I'm an AI shopping assistant connected through the Agentic Commerce Protocol. Click \"Next Step\" to walk through a purchase.",
    },
  ]);
  const [currentStep, setCurrentStep] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<DemoProduct | null>(null);
  const [isComplete, setIsComplete] = useState(false);
  const [orderCount, setOrderCount] = useState(0);
  const [totalRevenue, setTotalRevenue] = useState(0);

  const ctxRef = useRef<ScenarioContext>({});
  const scenario = useRef(createDemoScenario());
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSelectProduct = useCallback((product: DemoProduct) => {
    setSelectedProduct(product);
    ctxRef.current.selectedProduct = product;
  }, []);

  const advanceStep = useCallback(async () => {
    const step = scenario.current[currentStep];
    if (!step || isProcessing) return;

    setIsProcessing(true);

    // 1. Show user message
    if (step.userMessage) {
      setMessages((prev) => [
        ...prev,
        { id: `user_${currentStep}`, sender: 'user', text: step.userMessage! },
      ]);
      await sleep(400);
    }

    // 2. Show typing indicator
    setMessages((prev) => [
      ...prev,
      { id: `typing_${currentStep}`, sender: 'ai', text: '', typing: true },
    ]);

    // 3. Fire journey events with stagger
    for (const evt of step.journeyEvents) {
      await sleep(300);
      onJourneyEvent(createJourneyEvent(evt.type, evt.stage, evt.message));
    }

    // 4. Execute the action (real API call)
    let result: { products?: DemoProduct[]; checkout?: Record<string, unknown> } = {};
    try {
      result = await step.action(ctxRef.current);
    } catch (err) {
      console.error('Scenario step failed:', err);
    }

    await sleep(600);

    // 5. Remove typing indicator and show AI response
    setMessages((prev) => {
      const filtered = prev.filter((m) => m.id !== `typing_${currentStep}`);
      const aiMsg: DemoMessage = {
        id: `ai_${currentStep}`,
        sender: 'ai',
        text: step.aiMessage,
        products: result.products,
        checkout: result.checkout,
      };
      return [...filtered, aiMsg];
    });

    // Auto-select first product if this step returned products and none selected
    if (result.products && result.products.length > 0 && !selectedProduct) {
      const first = result.products[0]!;
      setSelectedProduct(first);
      ctxRef.current.selectedProduct = first;
    }

    // If order completed, update stats
    if (result.checkout && (result.checkout as Record<string, unknown>).status === 'completed') {
      const totals = (result.checkout as Record<string, unknown>).totals as Array<{ type: string; amount: number }> | undefined;
      const total = totals?.find((t) => t.type === 'total')?.amount ?? 0;
      const newOrderCount = orderCount + 1;
      const newRevenue = totalRevenue + total;
      setOrderCount(newOrderCount);
      setTotalRevenue(newRevenue);
      onOrderComplete(result.checkout);
      onStatsUpdate({ orders: newOrderCount, revenue: newRevenue });
      setIsComplete(true);
    }

    const nextStep = currentStep + 1;
    setCurrentStep(nextStep);
    setIsProcessing(false);

    if (nextStep >= scenario.current.length) {
      setIsComplete(true);
    }
  }, [currentStep, isProcessing, onJourneyEvent, onOrderComplete, onStatsUpdate, selectedProduct, orderCount, totalRevenue]);

  const handleReset = useCallback(() => {
    setMessages([
      {
        id: 'welcome',
        sender: 'ai',
        text: "Hi! I'm an AI shopping assistant connected through the Agentic Commerce Protocol. Click \"Next Step\" to walk through a purchase.",
      },
    ]);
    setCurrentStep(0);
    setIsComplete(false);
    setSelectedProduct(null);
    ctxRef.current = {};
    scenario.current = createDemoScenario();
    onReset();
  }, [onReset]);

  const nextStepLabel = scenario.current[currentStep]?.userMessage ?? 'Next Step';

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
          Step {Math.min(currentStep + 1, scenario.current.length)}/{scenario.current.length}
        </span>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin">
        {messages.map((msg) => (
          <div key={msg.id}>
            <MessageBubble sender={msg.sender} text={msg.text} typing={msg.typing}>
              {msg.products && msg.products.length > 0 && (
                <div className="grid grid-cols-2 gap-2 mt-2">
                  {msg.products.map((p) => (
                    <ProductCard
                      key={p.id}
                      product={p}
                      selected={selectedProduct?.id === p.id}
                      onSelect={handleSelectProduct}
                    />
                  ))}
                </div>
              )}
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
          {!isComplete ? (
            <button
              onClick={advanceStep}
              disabled={isProcessing}
              className={cn(
                'flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-full font-medium text-sm transition-all',
                isProcessing
                  ? 'bg-accent-100 text-accent-400 cursor-not-allowed'
                  : 'bg-accent-600 text-white hover:bg-accent-700 shadow-sm shadow-accent-600/25'
              )}
            >
              {isProcessing ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-accent-300 border-t-transparent rounded-full animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <span className="truncate max-w-[200px]">&quot;{nextStepLabel}&quot;</span>
                  <ArrowRight className="w-3.5 h-3.5 shrink-0" />
                </>
              )}
            </button>
          ) : (
            <button
              onClick={handleReset}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-accent-100 text-accent-700 rounded-full font-medium text-sm hover:bg-accent-200 transition-all"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Run Demo Again
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
