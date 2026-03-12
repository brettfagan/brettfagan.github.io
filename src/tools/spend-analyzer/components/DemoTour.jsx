import { useState } from 'react';
import { X, ChevronRight, ChevronLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';

const STEPS = [
  {
    title: '👋 Welcome to the demo',
    body: "You're exploring 3 months of sample spending across a credit card and checking account. All data is synthetic — nothing real here.",
  },
  {
    title: '📋 Browse your transactions',
    body: 'Use the search bar and category filters to find specific transactions. Click any row to view details or change its category.',
  },
  {
    title: '📊 Explore your spending charts',
    body: 'The charts above break down spending by category. Click a slice of the donut chart to filter transactions by that category.',
  },
  {
    title: '🎯 Set a monthly budget',
    body: 'Head to the Budget tab and click "Auto-Populate" to set monthly targets based on your spending averages — one click.',
    cta: { label: 'Go to Budget', tab: 'my-budget' },
  },
  {
    title: '🔒 Ready to use your real data?',
    body: 'Sign in with Google to connect your real bank accounts via Plaid, import CSVs from any card issuer, and save your spending history.',
    isFinal: true,
  },
];

const navBtnCls = [
  'flex items-center gap-1 bg-transparent border-0 cursor-pointer',
  'text-[12px] font-semibold text-muted-foreground px-2 py-1.5 rounded',
  'hover:bg-muted hover:text-foreground transition-colors disabled:opacity-30 disabled:cursor-not-allowed',
].join(' ');

export default function DemoTour({ onDismiss, onNavigate }) {
  const [step, setStep] = useState(0);
  const current = STEPS[step];

  function handleCta() {
    onNavigate(current.cta.tab);
    setStep(s => s + 1);
  }

  return (
    <div
      style={{
        position: 'fixed', bottom: '24px', left: '50%', transform: 'translateX(-50%)',
        zIndex: 200, width: 'min(460px, calc(100vw - 32px))',
        background: 'var(--background)', border: '1px solid var(--border)',
        borderRadius: '14px', boxShadow: '0 8px 40px rgba(0,0,0,0.20)',
        padding: '20px 22px 18px',
      }}
    >
      {/* Dismiss */}
      <button
        onClick={onDismiss}
        className="absolute top-3 right-3 flex items-center justify-center w-6 h-6 rounded text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
        aria-label="Dismiss tour"
        style={{ background: 'none', border: 'none', cursor: 'pointer' }}
      >
        <X size={13} />
      </button>

      {/* Progress dots */}
      <div className="flex items-center gap-1.5 mb-3.5">
        {STEPS.map((_, i) => (
          <div
            key={i}
            style={{
              height: '5px',
              width: i === step ? '20px' : '5px',
              borderRadius: '3px',
              transition: 'width 0.25s ease',
              background: i === step
                ? 'var(--primary)'
                : i < step
                  ? 'color-mix(in srgb, var(--primary) 35%, transparent)'
                  : 'var(--border)',
            }}
          />
        ))}
        <span className="ml-1 text-[10px] text-muted-foreground font-medium">
          {step + 1} / {STEPS.length}
        </span>
      </div>

      <h3 className="text-[13px] font-bold text-foreground mb-1.5">{current.title}</h3>
      <p className="text-[12px] text-muted-foreground leading-relaxed mb-4">{current.body}</p>

      <div className="flex items-center justify-between">
        <button
          className={navBtnCls}
          onClick={() => setStep(s => s - 1)}
          disabled={step === 0}
        >
          <ChevronLeft size={13} /> Back
        </button>

        <div className="flex gap-2">
          {current.cta && (
            <Button size="sm" variant="outline" className="text-xs h-7" onClick={handleCta}>
              {current.cta.label}
            </Button>
          )}
          {!current.cta && !current.isFinal && (
            <Button size="sm" className="text-xs h-7" onClick={() => setStep(s => s + 1)}>
              Next <ChevronRight size={13} />
            </Button>
          )}
          {current.isFinal && (
            <Button size="sm" className="text-xs h-7" onClick={onDismiss}>
              Start exploring
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
