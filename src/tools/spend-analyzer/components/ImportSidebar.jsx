import { CARDS } from '../lib/constants';
import { useCsvRules } from '../context/CsvRulesContext';
import ImportBlock from './ImportBlock';
import PlaidConnectionsSection from './PlaidConnectionsSection';

export default function ImportSidebar({ loadedCount, onLoad, onClear, onSync, onAnalyze, onStartOver }) {
  const { rules } = useCsvRules();

  return (
    <aside className="sidebar">
      <div className="sidebar-title">Import Data</div>
      <PlaidConnectionsSection onLoad={onLoad} onClear={onClear} onSync={onSync} />
      <div id="slots">
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

      <button
        className="analyze-btn"
        disabled={loadedCount === 0}
        onClick={onAnalyze}
      >
        Analyze →
      </button>

      {loadedCount > 0 && (
        <button className="start-over-btn" onClick={onStartOver}>
          Start Over
        </button>
      )}

      <div className="sidebar-footer">
        Auto-filtered: credit card payments<br />
        ✓ JSON and CSV both supported<br />
        ✓ Multi-card import supported
      </div>
    </aside>
  );
}
