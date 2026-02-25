import { useState, useCallback, useEffect } from 'react';
import { CARDS } from './lib/constants';
import { useAuth } from './context/AuthContext';
import ImportSidebar from './components/ImportSidebar';
import ResultsView from './components/ResultsView';
import AuthButton from './components/AuthButton';
import CategoryManager from './components/CategoryManager';
import MySpendingPage from './components/MySpendingPage';
import './SpendAnalyzer.css';

export default function SpendAnalyzer() {
  const { user, loading } = useAuth();
  const [loadedData, setLoadedData] = useState({});
  const [results, setResults] = useState(null);
  const [sidebarKey, setSidebarKey] = useState(0);
  const [catMgrOpen, setCatMgrOpen] = useState(false);
  const [page, setPage] = useState('analyzer');

  // Redirect to analyzer if user signs out while on my-spending
  useEffect(() => {
    if (!loading && !user) setPage('analyzer');
  }, [user, loading]);

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
      const cardLabel = card ? card.label : id;
      txns.forEach(tx => all.push({ ...tx, _card: cardLabel, _id: idx++ }));
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
            <nav className="header-nav">
              <button
                className={`nav-tab${page === 'analyzer' ? ' active' : ''}`}
                onClick={() => setPage('analyzer')}
              >
                Analyzer
              </button>
              <button
                className={`nav-tab${page === 'my-spending' ? ' active' : ''}`}
                onClick={() => setPage('my-spending')}
              >
                My Spending
              </button>
            </nav>
          )}
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

      <div className={`main${page === 'my-spending' ? ' main--full' : ''}`}>
        {page === 'analyzer' && (
          <ImportSidebar
            key={sidebarKey}
            loadedCount={Object.keys(loadedData).length}
            onLoad={handleLoad}
            onClear={handleClear}
            onAnalyze={handleAnalyze}
            onStartOver={handleStartOver}
          />
        )}

        <div className="content">
          {page === 'my-spending' ? (
            <MySpendingPage />
          ) : results ? (
            <ResultsView allTransactions={results} onReCategorize={handleReCategorize} onDeleteTransaction={handleDeleteTransaction} />
          ) : (
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
          )}
        </div>
      </div>

      <CategoryManager open={catMgrOpen} onClose={() => setCatMgrOpen(false)} />
    </>
  );
}
