import Link from 'next/link';
import Image from 'next/image';
import { ArrowRight, Bot, ShoppingBag, Zap } from 'lucide-react';

export default function Home() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-b from-warm-50 via-warm-100 to-brand-100 px-6">
      <div className="max-w-2xl text-center space-y-8">
        {/* Logo */}
        <div className="flex justify-center">
          <Image
            src="/agentix-circle.png"
            alt="AgentixPay Logo"
            width={200}
            height={200}
            className="rounded-full"
          />
        </div>

        <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-brand-900/5 border border-brand-200 rounded-full text-sm text-brand-700 font-medium">
          <Zap className="w-3.5 h-3.5" />
          Live Demo
        </div>

        <h1 className="text-5xl font-bold tracking-tight text-brand-950">
          AI Agents Meet
          <br />
          <span className="text-blue-800">E-Commerce</span>
        </h1>

        <p className="text-lg text-brand-700 max-w-lg mx-auto leading-relaxed">
          Watch an AI agent browse products, create a checkout, and complete a
          purchase — all through the Agentic Commerce Protocol. Real API calls,
          real-time events.
        </p>

        <div className="flex items-center justify-center gap-6 text-sm text-brand-600">
          <div className="flex items-center gap-2">
            <Bot className="w-4 h-4" />
            <span>AI Chat Simulation</span>
          </div>
          <div className="w-1 h-1 bg-brand-400 rounded-full" />
          <div className="flex items-center gap-2">
            <ShoppingBag className="w-4 h-4" />
            <span>Live Merchant View</span>
          </div>
        </div>

        <Link
          href="/demo"
          className="inline-flex items-center gap-2 px-8 py-3.5 bg-blue-600 text-white rounded-full text-base font-semibold hover:bg-blue-700 transition-colors shadow-lg shadow-blue-600/20"
        >
          Launch Demo
          <ArrowRight className="w-4 h-4" />
        </Link>

        <p className="text-xs text-brand-400">
          Best experienced on desktop. Uses mock data — no real payments.
        </p>
      </div>
    </main>
  );
}
