import { useState, useCallback, useEffect } from 'react';
import { useTheme } from 'next-themes';
import { Sun, Moon } from 'lucide-react';
import { CARDS } from './lib/constants';
import { useAuth } from './context/AuthContext';
import { Button } from '@/components/ui/button';
import ImportSidebar from './components/ImportSidebar';
import ResultsView from './components/ResultsView';
import AuthButton from './components/AuthButton';
import CategoryManager from './components/CategoryManager';
import MySpendingPage from './components/MySpendingPage';
import MyBudgetPage from './components/MyBudgetPage';

export default function SpendAnalyzer() {
  const { user, loading } = useAuth();
  const { resolvedTheme, setTheme } = useTheme();
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

  const handleSync = useCallback((cardId, addedNorm, modifiedNorm, removed) => {
    setLoadedData(prev => {
      const existing = prev[cardId] ?? [];
      const byId = new Map(existing.map(tx => [tx.transaction_id, tx]));
      const removedIds = new Set(removed.map(r => r.transaction_id));
      for (const tx of modifiedNorm) byId.set(tx.transaction_id, tx);
      for (const tx of addedNorm)    byId.set(tx.transaction_id, tx);
      return { ...prev, [cardId]: [...byId.values()].filter(tx => !removedIds.has(tx.transaction_id)) };
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

  const handleReCategorize = useCallback((id, cat, catDetail, applyToSimilar) => {
    setResults(prev => {
      const originalTx = prev.find(tx => tx._id === id);
      if (applyToSimilar && originalTx?.merchant) {
        const { merchant, cat: originalCat } = originalTx;
        return prev.map(tx =>
          tx.merchant === merchant && tx.cat === originalCat
            ? { ...tx, cat, cat_detail: catDetail }
            : tx
        );
      }
      return prev.map(tx => tx._id === id ? { ...tx, cat, cat_detail: catDetail } : tx);
    });
  }, []);

  const handleDeleteTransaction = useCallback((id) => {
    setResults(prev => prev.filter(tx => tx._id !== id));
  }, []);

  function handleStartOver() {
    setLoadedData({});
    setResults(null);
    setSidebarKey(k => k + 1);
  }

  const isFull = page === 'my-spending' || page === 'my-budget';

  return (
    <>
      <header className="px-12 py-5 border-b border-border flex items-center justify-between gap-5">
        <div className="flex items-baseline gap-5">
          <h1 className="font-mono text-[28px] font-extrabold tracking-[-0.5px]">Spend Analyzer</h1>
          <span className="text-muted-foreground text-xs">BrettLabs</span>
        </div>
        <div className="flex items-center">
          {user && (
            <nav className="flex gap-0.5 mr-3">
              {[
                { id: 'analyzer', label: 'Analyzer' },
                { id: 'my-spending', label: 'My Spending' },
                { id: 'my-budget', label: 'My Budget' },
              ].map(({ id, label }) => (
                <button
                  key={id}
                  onClick={() => setPage(id)}
                  className={`border-b-2 px-3 py-1.5 font-mono text-xs font-bold tracking-[0.3px] transition-colors bg-transparent border-x-0 border-t-0 cursor-pointer ${
                    page === id
                      ? 'text-primary border-b-primary'
                      : 'text-muted-foreground border-b-transparent hover:text-foreground'
                  }`}
                >
                  {label}
                </button>
              ))}
            </nav>
          )}
          {user && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCatMgrOpen(true)}
              className="font-mono text-[11px] font-bold tracking-[0.5px] mr-3 shadow-none hover:text-primary hover:border-primary"
            >
              ⚙ Settings
            </Button>
          )}
          <AuthButton />
          <button
            onClick={() => setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')}
            className="ml-2 flex items-center justify-center w-8 h-8 rounded-md text-muted-foreground hover:bg-muted transition-colors"
            aria-label="Toggle theme"
          >
            {resolvedTheme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
          </button>
        </div>
      </header>

      <div className={`grid min-h-[calc(100vh-89px)] ${isFull ? 'grid-cols-1' : 'grid-cols-[260px_1fr]'}`}>
        {page === 'analyzer' && (
          <ImportSidebar
            key={sidebarKey}
            loadedCount={Object.keys(loadedData).length}
            onLoad={handleLoad}
            onClear={handleClear}
            onSync={handleSync}
            onAnalyze={handleAnalyze}
            onStartOver={handleStartOver}
          />
        )}

        <div className="px-9 py-7 overflow-y-auto">
          {page === 'my-spending' ? (
            <MySpendingPage />
          ) : page === 'my-budget' ? (
            <MyBudgetPage />
          ) : results ? (
            <ResultsView allTransactions={results} onReCategorize={handleReCategorize} onDeleteTransaction={handleDeleteTransaction} />
          ) : (
            <div className="flex flex-col items-center justify-center h-full gap-3 text-muted-foreground text-center">
              <div className="text-[40px]">◈</div>
              <p style={{ maxWidth: '300px', lineHeight: 1.8 }}>
                Import data from one or more cards via Plaid JSON or CSV, then click Analyze.
              </p>
              {!loading && !user && (
                <p style={{ maxWidth: '300px', lineHeight: 1.8, marginTop: '12px', fontSize: '11px' }}>
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
