import { useState, useCallback } from 'react';
import { CARDS } from './lib/constants';
import { useAuth } from './context/AuthContext';
import ImportSidebar from './components/ImportSidebar';
import ResultsView from './components/ResultsView';
import AuthButton from './components/AuthButton';
import CategoryManager from './components/CategoryManager';
import './SpendAnalyzer.css';

export default function SpendAnalyzer() {
  const { user, loading } = useAuth();
  const [loadedData, setLoadedData] = useState({});
  const [results, setResults] = useState(null);
  const [sidebarKey, setSidebarKey] = useState(0);
  const [catMgrOpen, setCatMgrOpen] = useState(false);

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
    let idx = 0;
    Object.entries(loadedData).forEach(([id, txns]) => {
      const card = CARDS.find(c => c.id === id);
      txns.forEach(tx => all.push({ ...tx, _card: card.label, _id: idx++ }));
    });
    setResults(all);
  }

  const handleReCategorize = useCallback((id, cat, catDetail) => {
    setResults(prev => prev.map(tx => tx._id === id ? { ...tx, cat, cat_detail: catDetail } : tx));
  }, []);

  const handleDeleteTransaction = useCallback((id) => {
    setResults(prev => prev.filter(tx => tx._id !== id));
  }, []);

  function handleStartOver() {
    setLoadedData({});
    setResults(null);
    setSidebarKey(k => k + 1);
  }

  return (
    <>
      <header>
        <div className="header-left">
          <h1>Spend Analyzer</h1>
          <span>BrettLabs</span>
        </div>
        <div className="header-right">
          {user && (
            <button
              className="manage-cats-btn"
              onClick={() => setCatMgrOpen(true)}
            >
              ⚙ Settings
            </button>
          )}
          <AuthButton />
        </div>
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
            ? <ResultsView allTransactions={results} onReCategorize={handleReCategorize} onDeleteTransaction={handleDeleteTransaction} />
            : (
              <div className="empty-state">
                <div className="empty-icon">◈</div>
                <p style={{ maxWidth: '300px', lineHeight: 1.8 }}>
                  Import data from one or more cards via Plaid JSON or CSV, then click Analyze.
                </p>
                {!loading && !user && (
                  <p style={{ maxWidth: '300px', lineHeight: 1.8, marginTop: '12px', fontSize: '11px', color: 'var(--muted)' }}>
                    Sign in to save imports and manage categories.
                  </p>
                )}
              </div>
            )
          }
        </div>
      </div>

      <CategoryManager open={catMgrOpen} onClose={() => setCatMgrOpen(false)} />
    </>
  );
}
