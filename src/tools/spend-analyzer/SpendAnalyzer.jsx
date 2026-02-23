import { useState, useCallback } from 'react';
import { CARDS } from './lib/constants';
import ImportSidebar from './components/ImportSidebar';
import ResultsView from './components/ResultsView';
import './SpendAnalyzer.css';

export default function SpendAnalyzer() {
  const [loadedData, setLoadedData] = useState({});
  const [results, setResults] = useState(null);
  // sidebarKey resets all ImportBlock components when startOver is called
  const [sidebarKey, setSidebarKey] = useState(0);

  const handleLoad = useCallback((cardId, txns) => {
    setLoadedData(prev => ({ ...prev, [cardId]: txns }));
  }, []);

  const handleClear = useCallback((cardId) => {
    setLoadedData(prev => {
      const next = { ...prev };
      delete next[cardId];
      return next;
    });
  }, []);

  function handleAnalyze() {
    const all = [];
    Object.entries(loadedData).forEach(([id, txns]) => {
      const card = CARDS.find(c => c.id === id);
      txns.forEach(tx => all.push({ ...tx, _card: card.label }));
    });
    setResults(all);
  }

  function handleStartOver() {
    setLoadedData({});
    setResults(null);
    setSidebarKey(k => k + 1);
  }

  return (
    <>
      <header>
        <h1>Spend Analyzer</h1>
        <span>BrettLabs</span>
      </header>

      <div className="main">
        <ImportSidebar
          key={sidebarKey}
          loadedCount={Object.keys(loadedData).length}
          onLoad={handleLoad}
          onClear={handleClear}
          onAnalyze={handleAnalyze}
          onStartOver={handleStartOver}
        />

        <div className="content">
          {results
            ? <ResultsView allTransactions={results} />
            : (
              <div className="empty-state">
                <div className="empty-icon">◈</div>
                <p style={{ maxWidth: '300px', lineHeight: 1.8 }}>
                  Import data from one or more cards via Plaid JSON or CSV, then click Analyze.
                </p>
              </div>
            )
          }
        </div>
      </div>
    </>
  );
}
