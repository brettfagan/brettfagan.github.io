import { useState, useCallback, useEffect } from 'react';
import { useTheme } from 'next-themes';
import { Sun, Moon, Settings } from 'lucide-react';
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
import DemoTour from './components/DemoTour';

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
  const [isDemo, setIsDemo] = useState(false);
  const [showTour, setShowTour] = useState(false);

  // ── Invite token detection ────────────────────────────────────────────────
  // On mount: stash any ?invite=<token> in localStorage before OAuth redirect
  // clears query params, then clean the URL.
  // Store a timestamp so stale tokens on shared devices expire after 7 days.
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get('invite');
    if (token) {
      localStorage.setItem('pendingInviteToken', JSON.stringify({ token, storedAt: Date.now() }));
      const url = new URL(window.location.href);
      url.searchParams.delete('invite');
      window.history.replaceState(null, '', url.toString());
    }
  }, []);

  // When a user signs in, check for a pending invite token and accept it.
  useEffect(() => {
    if (!user) return;

    const raw = localStorage.getItem('pendingInviteToken');
    if (!raw) return;

    // Always clear the token immediately — whether valid or stale — so it
    // never leaks to another user signing in later on a shared device.
    localStorage.removeItem('pendingInviteToken');

    let token;
    try {
      const { token: t, storedAt } = JSON.parse(raw);
      const INVITE_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 days
      if (!t || Date.now() - storedAt > INVITE_TTL_MS) return; // expired
      token = t;
    } catch {
      return; // corrupt / legacy plain-string entry, discard
    }

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

  // When a user signs in from demo mode, clear demo state so they get the normal
  // post-login experience (My Spending, Settings, etc.) rather than staying in demo UI.
  useEffect(() => {
    if (user && isDemo) {
      setIsDemo(false);
      setShowTour(false);
      setResults(null);
      setLoadedData({});
    }
  }, [user]);

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

  async function loadDemo(sources) {
    const newData = {};
    if (sources.includes('credit-card')) {
      const { default: txns } = await import('./demo/credit-card.json');
      newData['Demo Credit Card'] = txns;
    }
    if (sources.includes('checking-account')) {
      const { default: txns } = await import('./demo/checking-account.json');
      newData['Demo Checking Account'] = txns;
    }
    const all = [];
    let idx = 0;
    Object.entries(newData).forEach(([id, txns]) => {
      txns.forEach(tx => all.push({ ...tx, _card: id, _id: idx++ }));
    });
    setLoadedData(newData);
    setResults(all);
    setIsDemo(true);
    setShowTour(true);
  }

  function handleStartOver() {
    setLoadedData({});
    setResults(null);
    setSidebarKey(k => k + 1);
    setIsDemo(false);
    setShowTour(false);
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
        ]
    : isDemo
      ? [
          { id: 'analyzer',  label: 'Analyzer' },
          { id: 'my-budget', label: 'Budget'   },
        ]
      : [];

  const isFull = isLinked || (!user && !isDemo) || ['my-spending', 'my-budget', 'settings'].includes(page);

  return (
    <>
      <header className="px-12 py-5 border-b border-border flex items-center justify-between gap-5">
        <div className="flex items-baseline gap-5">
          <h1 className="text-[28px] font-extrabold tracking-[-0.5px]">Spend Analyzer</h1>
          <span className="text-muted-foreground text-xs">BrettLabs</span>
        </div>
        <div className="flex items-center">
          {(user || isDemo) && (
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
          <button
            onClick={() => setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')}
            className="flex items-center justify-center w-8 h-8 rounded-md text-muted-foreground hover:bg-muted transition-colors"
            aria-label="Toggle theme"
          >
            {resolvedTheme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
          </button>
          {user && !isLinked && !isDemo && (
            <button
              onClick={() => setPage('settings')}
              className={`flex items-center justify-center w-8 h-8 rounded-md transition-colors mr-2 ${
                page === 'settings'
                  ? 'text-primary bg-muted'
                  : 'text-muted-foreground hover:bg-muted'
              }`}
              aria-label="Settings"
            >
              <Settings size={16} />
            </button>
          )}
          <AuthButton />
        </div>
      </header>

      {inviteError && (
        <div className="px-12 py-3 bg-destructive/10 border-b border-destructive/20 text-xs text-destructive font-medium flex items-center justify-between">
          <span>Invite error: {inviteError}</span>
          <button onClick={() => setInviteError(null)} className="ml-4 hover:opacity-70">✕</button>
        </div>
      )}

      <div className={`grid min-h-[calc(100vh-89px)] ${isFull ? 'grid-cols-1' : 'grid-cols-[260px_1fr]'}`}>
        {page === 'analyzer' && !isLinked && !isDemo && user && (
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
        {page === 'analyzer' && isDemo && (
          <DemoSidebar loadedData={loadedData} onExit={handleStartOver} />
        )}

        {page === 'my-spending' ? (
          <div className="px-9 py-7 overflow-y-auto">
            <MySpendingPage />
          </div>
        ) : page === 'my-budget' ? (
          <div className="px-9 py-7 overflow-y-auto">
            <MyBudgetPage demoTransactions={isDemo ? results : null} />
          </div>
        ) : page === 'settings' && !isLinked ? (
          <SettingsPage />
        ) : (
          <div className="px-9 py-7 overflow-y-auto">
            {results ? (
              <ResultsView allTransactions={results} onReCategorize={handleReCategorize} onDeleteTransaction={handleDeleteTransaction} />
            ) : (
              <div className="flex flex-col items-center justify-center h-full gap-3 text-muted-foreground text-center">
                {!loading && !user ? (
                  <DemoPanel onLoad={loadDemo} />
                ) : (
                  <>
                    <div className="text-[40px]">◈</div>
                    <p style={{ maxWidth: '300px', lineHeight: 1.8 }}>
                      Import data from one or more cards via Plaid JSON or CSV, then click Analyze.
                    </p>
                  </>
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

      {isDemo && showTour && (
        <DemoTour
          onDismiss={() => setShowTour(false)}
          onNavigate={setPage}
        />
      )}
    </>
  );
}

// ── Demo Panel ── shown in the unauthenticated empty state ────────────────────
function DemoPanel({ onLoad }) {
  const [sources, setSources] = useState(['credit-card', 'checking-account']);
  const [loading, setLoading] = useState(false);

  function toggle(src) {
    setSources(prev =>
      prev.includes(src) ? prev.filter(s => s !== src) : [...prev, src]
    );
  }

  async function handleLoad() {
    if (sources.length === 0) return;
    setLoading(true);
    await onLoad(sources);
    setLoading(false);
  }

  return (
    <div style={{
      maxWidth: '360px', width: '100%', textAlign: 'left',
      border: '1px solid var(--border)', borderRadius: '12px',
      padding: '28px 28px 24px', background: 'var(--background)',
      boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
    }}>
      <div style={{ fontSize: '28px', marginBottom: '14px' }}>🧪</div>
      <h3 style={{ fontSize: '15px', fontWeight: 700, color: 'var(--foreground)', marginBottom: '6px' }}>
        Explore with demo data
      </h3>
      <p style={{ fontSize: '12px', color: 'var(--muted-foreground)', lineHeight: 1.7, marginBottom: '20px' }}>
        See Spend Analyzer in action with 3 months of sample transactions across two accounts.
      </p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '20px' }}>
        {[
          { id: 'credit-card', label: 'Sample Credit Card', count: 175, icon: '💳' },
          { id: 'checking-account', label: 'Sample Checking Account', count: 100, icon: '🏦' },
        ].map(({ id, label, count, icon }) => {
          const checked = sources.includes(id);
          return (
            <button
              key={id}
              onClick={() => toggle(id)}
              style={{
                display: 'flex', alignItems: 'center', gap: '10px',
                padding: '9px 12px', borderRadius: '8px', cursor: 'pointer',
                border: `1px solid ${checked ? 'var(--primary)' : 'var(--border)'}`,
                background: checked ? 'color-mix(in srgb, var(--primary) 6%, transparent)' : 'var(--muted)',
                transition: 'all 0.15s',
                width: '100%', textAlign: 'left',
              }}
            >
              <span style={{ fontSize: '16px' }}>{icon}</span>
              <span style={{ flex: 1, fontSize: '12px', fontWeight: 600, color: 'var(--foreground)' }}>{label}</span>
              <span style={{ fontSize: '11px', color: 'var(--muted-foreground)' }}>{count} txns</span>
              <span style={{
                width: '15px', height: '15px', borderRadius: '4px', flexShrink: 0,
                border: `1.5px solid ${checked ? 'var(--primary)' : 'var(--border)'}`,
                background: checked ? 'var(--primary)' : 'transparent',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: '#fff', fontSize: '9px', fontWeight: 800,
              }}>
                {checked ? '✓' : ''}
              </span>
            </button>
          );
        })}
      </div>

      <button
        onClick={handleLoad}
        disabled={sources.length === 0 || loading}
        style={{
          width: '100%', padding: '10px', borderRadius: '8px', cursor: 'pointer',
          background: sources.length === 0 ? 'var(--muted)' : 'var(--primary)',
          color: sources.length === 0 ? 'var(--muted-foreground)' : 'white',
          border: 'none', fontSize: '13px', fontWeight: 700,
          transition: 'opacity 0.15s', opacity: loading ? 0.7 : 1,
        }}
      >
        {loading ? 'Loading…' : 'Explore Demo →'}
      </button>

    </div>
  );
}

// ── Demo Sidebar ── replaces ImportSidebar in demo mode ───────────────────────
function DemoSidebar({ loadedData, onExit }) {
  return (
    <aside style={{
      borderRight: '1px solid var(--border)', padding: '20px 16px',
      display: 'flex', flexDirection: 'column', gap: '16px', overflowY: 'auto',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <span style={{
          fontSize: '10px', fontWeight: 700, letterSpacing: '0.08em',
          color: 'var(--primary)', background: 'color-mix(in srgb, var(--primary) 12%, transparent)',
          padding: '2px 8px', borderRadius: '100px',
        }}>
          DEMO MODE
        </span>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
        <p style={{ fontSize: '11px', fontWeight: 600, color: 'var(--muted-foreground)', marginBottom: '2px' }}>
          Loaded sources
        </p>
        {Object.entries(loadedData).map(([key, txns]) => (
          <div key={key} style={{
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            padding: '7px 10px', borderRadius: '7px', background: 'var(--muted)',
            border: '1px solid var(--border)',
          }}>
            <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--foreground)' }}>{key}</span>
            <span style={{ fontSize: '10px', color: 'var(--muted-foreground)' }}>{txns.length} txns</span>
          </div>
        ))}
      </div>

      <div style={{
        borderTop: '1px solid var(--border)', paddingTop: '16px',
        display: 'flex', flexDirection: 'column', gap: '10px',
      }}>
        <p style={{ fontSize: '11px', fontWeight: 600, color: 'var(--foreground)' }}>
          Ready for your real data?
        </p>
        <p style={{ fontSize: '11px', color: 'var(--muted-foreground)', lineHeight: 1.6 }}>
          Sign in with Google to connect your bank accounts and save your spending history.
        </p>
        <AuthButton />
      </div>

      <div style={{ marginTop: 'auto', borderTop: '1px solid var(--border)', paddingTop: '14px' }}>
        <button
          onClick={onExit}
          style={{
            background: 'none', border: 'none', cursor: 'pointer', padding: 0,
            fontSize: '11px', color: 'var(--muted-foreground)',
            textDecoration: 'underline', textUnderlineOffset: '2px',
          }}
        >
          Exit demo
        </button>
      </div>
    </aside>
  );
}
