import { CARDS } from '../lib/constants';
import ImportBlock from './ImportBlock';

export default function ImportSidebar({ loadedCount, onLoad, onClear, onAnalyze, onStartOver }) {
  return (
    <aside className="sidebar">
      <div className="sidebar-title">Import Data</div>
      <div id="slots">
        {CARDS.map(card => (
          <ImportBlock
            key={card.id}
            card={card}
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
