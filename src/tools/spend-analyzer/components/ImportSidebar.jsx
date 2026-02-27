import { CARDS } from '../lib/constants';
import { useCsvRules } from '../context/CsvRulesContext';
import { Button } from '@/components/ui/button';
import ImportBlock from './ImportBlock';
import PlaidConnectionsSection from './PlaidConnectionsSection';

export default function ImportSidebar({ loadedCount, onLoad, onClear, onSync, onAnalyze, onStartOver }) {
  const { rules } = useCsvRules();

  return (
    <aside className="border-r border-border p-5 flex flex-col gap-2.5 overflow-y-auto">
      <div className="font-mono text-[11px] font-bold tracking-[2px] uppercase text-muted-foreground">
        Import Data
      </div>
      <PlaidConnectionsSection onLoad={onLoad} onClear={onClear} onSync={onSync} />
      <div className="flex flex-col gap-2.5">
        {CARDS.map(card => (
          <ImportBlock
            key={card.id}
            card={card}
            rules={rules}
            onLoad={onLoad}
            onClear={onClear}
          />
        ))}
      </div>

      <Button
        disabled={loadedCount === 0}
        onClick={onAnalyze}
        className="w-full font-mono text-[13px] font-extrabold shadow-none disabled:opacity-30 hover:-translate-y-px hover:shadow-[0_4px_20px_rgba(37,99,235,0.25)]"
      >
        Analyze →
      </Button>

      {loadedCount > 0 && (
        <Button
          variant="outline"
          onClick={onStartOver}
          className="w-full font-mono text-xs font-bold tracking-[0.5px] text-muted-foreground shadow-none hover:border-destructive hover:text-destructive hover:bg-transparent"
        >
          Start Over
        </Button>
      )}

      <div className="mt-4 pt-3 border-t border-border text-muted-foreground text-[11px] leading-[1.9]">
        Transfers &amp; payments auto-excluded<br />
        ✓ JSON and CSV both supported<br />
        ✓ Multi-card import supported
      </div>
    </aside>
  );
}
