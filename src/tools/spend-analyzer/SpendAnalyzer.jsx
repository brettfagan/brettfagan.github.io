import { useState, useCallback, useEffect } from 'react';
import { useTheme } from 'next-themes';
import { Sun, Moon } from 'lucide-react';
import { CARDS } from './lib/constants';
import { useAuth } from './context/AuthContext';
import { useCatRules } from './context/CatRulesContext';
import { useURLParam } from './lib/useURLParam';
import { supabase } from './lib/supabase';
import ImportSidebar from './components/ImportSidebar';
import ResultsView from './components/ResultsView';
import AuthButton from './components/AuthButton';
import SettingsPage from './components/SettingsPage';
import MySpendingPage from './components/MySpendingPage';
import MyBudgetPage from './components/MyBudgetPage';
import BulkUpdateDialog from './components/BulkUpdateDialog';

export default function SpendAnalyzer() {
  const { user, loading, role } = useAuth();
  const { rules, saveRule } = useCatRules();
  const { resolvedTheme, setTheme } = useTheme();
  const [loadedData, setLoadedData] = useState({});
  const [results, setResults] = useState(null);
  const [sidebarKey, setSidebarKey] = useState(0);
  const [bulkDialog, setBulkDialog] = useState(null);
  const [page, setPage] = useURLParam('tab', 'analyzer');
  const [inviteError, setInviteError] = useState(null);

  const isLinked = role === 'linked';

  // ── Invite token detection ────────────────────────────────────────────────
  // On mount: stash any ?invite=<token> in localStorage before OAuth redirect
  // clears query params, then clean the URL.
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get('invite');
    if (token) {
      localStorage.setItem('pendingInviteToken', token);
      const url = new URL(window.location.href);
      url.searchParams.delete('invite');
      window.history.replaceState(null, '', url.toString());
    }
  }, []);

  // When a user signs in, check for a pending invite token and accept it.
  useEffect(() => {
    if (!user) return;
    const token = localStorage.getItem('pendingInviteToken');
    if (!token) return;
    localStorage.removeItem('pendingInviteToken');

    (async () => {
      const { data: { session } } = await supabase.auth.getSession();
      const res = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/accept-invite`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({ token }),
        },
      );
      const json = await res.json();
      if (!res.ok) {
        setInviteError(json.error || 'Failed to accept invitation.');
      }
      // Reload the page so AuthContext re-runs loadPartnerStatus with the new link
      if (res.ok) window.location.reload();
    })();
  }, [user]);

  // ── Tab guards ────────────────────────────────────────────────────────────
  // Redirect to 'my-spending' (not analyzer) if linked user somehow has analyzer/settings active
  useEffect(() => {
    if (!loading && user && isLinked && (page === 'analyzer' || page === 'settings')) {
      setPage('my-spending');
    }
  }, [user, loading, isLinked, page]);

  // Redirect to analyzer if user signs out while on an auth-only page
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

  const handleReCategorize = useCallback((id, cat, catDetail, applyToSimilar, applyToFuture) => {
    const originalTx = (results || []).find(tx => tx._id === id);
    if (applyToSimilar && originalTx?.merchant) {
      const { merchant, cat: originalCat } = originalTx;
      const count = (results || []).filter(tx => tx.merchant === merchant && tx.cat === originalCat).length;
      setBulkDialog({ step: 'confirm', id, merchant, originalCat, cat, catDetail, applyToFuture, count });
      return;
    }
    setResults(prev => prev.map(tx => tx._id === id ? { ...tx, cat, cat_detail: catDetail } : tx));
    if (applyToFuture && originalTx?.merchant) {
      const escaped = originalTx.merchant.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const pattern = `^${escaped}$`;
      const existing = rules.find(r => r.match_field === 'merchant' && r.pattern === pattern);
      saveRule({ ...existing, pattern, match_field: 'merchant', cat, cat_detail: catDetail || null });
    }
  }, [results, rules, saveRule]);

  const handleBulkConfirm = useCallback(() => {
    if (!bulkDialog) return;
    const { merchant, originalCat, cat, catDetail, applyToFuture } = bulkDialog;
    const count = (results || []).filter(tx => tx.merchant === merchant && tx.cat === originalCat).length;
    setResults(prev => prev.map(tx =>
      tx.merchant === merchant && tx.cat === originalCat
        ? { ...tx, cat, cat_detail: catDetail }
        : tx
    ));
    if (applyToFuture) {
      const escaped = merchant.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const pattern = `^${escaped}$`;
      const existing = rules.find(r => r.match_field === 'merchant' && r.pattern === pattern);
      saveRule({ ...existing, pattern, match_field: 'merchant', cat, cat_detail: catDetail || null });
    }
    setBulkDialog(d => ({ ...d, step: 'done', count }));
  }, [bulkDialog, results, rules, saveRule]);

  const handleDeleteTransaction = useCallback((id) => {
    setResults(prev => prev.filter(tx => tx._id !== id));
  }, []);

  function handleStartOver() {
    setLoadedData({});
    setResults(null);
    setSidebarKey(k => k + 1);
  }

  // Linked users only see my-spending and my-budget
  const visibleTabs = user
    ? isLinked
      ? [
          { id: 'my-spending', label: 'My Spending' },
          { id: 'my-budget',   label: 'My Budget'   },
        ]
      : [
          { id: 'analyzer',    label: 'Analyzer'    },
          { id: 'my-spending', label: 'My Spending' },
          { id: 'my-budget',   label: 'My Budget'   },
          { id: 'settings',    label: 'Settings'    },
        ]
    : [];

  const isFull = isLinked || ['my-spending', 'my-budget', 'settings'].includes(page);

  return (
    <>
      <header className="px-12 py-5 border-b border-border flex items-center justify-between gap-5">
        <div className="flex items-baseline gap-5">
          <h1 className="text-[28px] font-extrabold tracking-[-0.5px]">Spend Analyzer</h1>
          <span className="text-muted-foreground text-xs">BrettLabs</span>
        </div>
        <div className="flex items-center">
          {user && (
            <nav className="flex gap-0.5 mr-3">
              {visibleTabs.map(({ id, label }) => (
                <button
                  key={id}
                  onClick={() => setPage(id)}
                  className={`border-b-2 px-3 py-1.5 text-xs font-bold tracking-[0.3px] transition-colors bg-transparent border-x-0 border-t-0 cursor-pointer ${
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

      {inviteError && (
        <div className="px-12 py-3 bg-destructive/10 border-b border-destructive/20 text-xs text-destructive font-medium">
          Invite error: {inviteError}
        </div>
      )}

      <div className={`grid min-h-[calc(100vh-89px)] ${isFull ? 'grid-cols-1' : 'grid-cols-[260px_1fr]'}`}>
        {page === 'analyzer' && !isLinked && (
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

        {page === 'my-spending' ? (
          <div className="px-9 py-7 overflow-y-auto">
            <MySpendingPage />
          </div>
        ) : page === 'my-budget' ? (
          <div className="px-9 py-7 overflow-y-auto">
            <MyBudgetPage />
          </div>
        ) : page === 'settings' && !isLinked ? (
          <SettingsPage />
        ) : (
          <div className="px-9 py-7 overflow-y-auto">
            {results ? (
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
        )}
      </div>

      <footer className="border-t border-border px-12 py-3 flex gap-4 text-[11px] text-muted-foreground">
        <a href="/privacy" className="hover:text-foreground transition-colors">Privacy Policy</a>
        <a href="/terms" className="hover:text-foreground transition-colors">Terms of Service</a>
      </footer>

      {bulkDialog && (
        <BulkUpdateDialog
          step={bulkDialog.step}
          merchant={bulkDialog.merchant}
          fromCat={bulkDialog.originalCat}
          toCat={bulkDialog.cat}
          count={bulkDialog.count}
          onConfirm={handleBulkConfirm}
          onClose={() => setBulkDialog(null)}
        />
      )}
    </>
  );
}
