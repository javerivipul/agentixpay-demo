'use client';

interface SplitScreenProps {
  left: React.ReactNode;
  right: React.ReactNode;
  bottom: React.ReactNode;
}

export function SplitScreen({ left, right, bottom }: SplitScreenProps) {
  return (
    <div className="h-screen w-screen flex flex-col bg-warm-100 overflow-hidden">
      {/* Main panels */}
      <div className="flex-1 flex gap-3 p-3 pb-0 min-h-0">
        {/* Left: AI Chat */}
        <div className="w-1/2 flex flex-col bg-white rounded-xl shadow-lg border border-warm-200 overflow-hidden">
          {left}
        </div>

        {/* Right: Merchant View */}
        <div className="w-1/2 flex flex-col gap-3 min-h-0">
          {right}
        </div>
      </div>

      {/* Bottom: Event Log */}
      <div className="h-[240px] shrink-0 p-3">
        {bottom}
      </div>

      {/* Footer */}
      <div className="h-8 shrink-0 px-3 pb-3 flex items-center justify-center">
        <p className="text-xs text-brand-400">
          Powered by <span className="font-semibold text-brand-600">AgentixPay</span>
        </p>
      </div>
    </div>
  );
}
