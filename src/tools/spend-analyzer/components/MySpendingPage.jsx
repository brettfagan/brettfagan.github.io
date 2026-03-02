import { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { useCatRules } from '../context/CatRulesContext';
import { fmtShortDate } from '../lib/format';
import { useURLParam } from '../lib/useURLParam';
import ResultsView from './ResultsView';
import BulkUpdateDialog from './BulkUpdateDialog';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

function mapRow(row) {
  return {
    _id:             row.id,
    _card:           row.card_label || '',
    date:            row.date,
    merchant:        row.merchant || '',
    name:            row.name,
    amount:          row.amount,
    cat:             row.cat,
    cat_detail:      row.cat_detail,
    cat_confidence:  row.cat_confidence,
    pending:         row.pending || false,
    source:          row.source,
    logo_url:        row.logo_url,
    cat_icon_url:    row.cat_icon_url,
    payment_channel: row.payment_channel,
    website:         row.website,
    transaction_id:  row.plaid_transaction_id,
    account_id:      row.account_id,
    authorized_date: row.authorized_date,
    location:        row.location,
    counterparty:    row.counterparty,
  };
}

export default function MySpendingPage() {
  const { user, role, effectiveUserId } = useAuth();
  const isLinked = role === 'linked';
  const { rules, saveRule } = useCatRules();
  const [transactions, setTransactions] = useState([]);
  const [bulkDialog, setBulkDialog] = useState(null);
  const [deleteResult, setDeleteResult] = useState(null);
  // deleteResult shape: { success: boolean, count: number }
  // bulkDialog shape: { step, id, merchant, originalCat, cat, catDetail, applyToFuture, count }
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const todayYear  = new Date().getFullYear();
  const todayMonth = new Date().getMonth() + 1;

  const [filterMode, setFilterMode]   = useURLParam('mode', 'all');
  const [filterMonth, setFilterMonth] = useState(() => {
    const params = new URLSearchParams(window.location.search);
    const m = parseInt(params.get('m'));
    const y = parseInt(params.get('y'));
    return { month: !isNaN(m) ? m : todayMonth, year: !isNaN(y) ? y : todayYear };
  });
  const [filterStart, setFilterStart] = useURLParam('start', '');
  const [filterEnd, setFilterEnd]     = useURLParam('end', '');

  useEffect(() => {
    const url = new URL(window.location.href);
    if (filterMode === 'month') {
      url.searchParams.set('m', String(filterMonth.month));
      url.searchParams.set('y', String(filterMonth.year));
    } else {
      url.searchParams.delete('m');
      url.searchParams.delete('y');
    }
    window.history.replaceState(null, '', url.toString());
  }, [filterMonth, filterMode]);

  useEffect(() => {
    if (!user || !effectiveUserId) return;
    load();
  }, [user, effectiveUserId]);

  async function load() {
    setLoading(true);
    setError(null);
    const { data, error } = await supabase
      .from('imported_transactions')
      .select('*')
      .eq('user_id', effectiveUserId)
      .order('date', { ascending: false });
    if (error) { setError(error.message); setLoading(false); return; }
    setTransactions((data || []).map(mapRow));
    setLoading(false);
  }

  const handleDeleteTransaction = useCallback(async (id) => {
    const { data, error } = await supabase
      .from('imported_transactions')
      .delete()
      .select('id')
      .eq('id', id)
      .eq('user_id', user.id);
    if (!error && data?.length > 0) setTransactions(prev => prev.filter(tx => tx._id !== id));
  }, [user]);

  const handleBulkDelete = useCallback(async (ids) => {
    const CHUNK = 100;
    const deletedIds = [];

    for (let i = 0; i < ids.length; i += CHUNK) {
      const chunk = ids.slice(i, i + CHUNK);
      const { data, error } = await supabase
        .from('imported_transactions')
        .delete()
        .select('id')
        .in('id', chunk)
        .eq('user_id', user.id);
      if (error) {
        if (deletedIds.length > 0) {
          setTransactions(prev => prev.filter(tx => !deletedIds.includes(tx._id)));
        }
        setDeleteResult({ success: false, count: ids.length, deleted: deletedIds.length });
        return false;
      }
      (data || []).forEach(r => deletedIds.push(r.id));
    }

    setTransactions(prev => prev.filter(tx => !deletedIds.includes(tx._id)));
    const allDeleted = deletedIds.length === ids.length;
    setDeleteResult({ success: allDeleted, count: ids.length, deleted: deletedIds.length });
    return allDeleted;
  }, [user]);

  const handleReCategorize = useCallback(async (id, cat, catDetail, applyToSimilar, applyToFuture) => {
    if (applyToSimilar) {
      const originalTx = transactions.find(tx => tx._id === id);
      if (!originalTx?.merchant) return;
      const { merchant, cat: originalCat } = originalTx;
      const count = transactions.filter(tx => tx.merchant === merchant && tx.cat === originalCat).length;
      setBulkDialog({ step: 'confirm', id, merchant, originalCat, cat, catDetail, applyToFuture, count });
      return;
    }
    const { error } = await supabase
      .from('imported_transactions')
      .update({ cat, cat_detail: catDetail || null })
      .eq('id', id)
      .eq('user_id', effectiveUserId);
    if (!error) setTransactions(prev => prev.map(tx =>
      tx._id === id ? { ...tx, cat, cat_detail: catDetail } : tx
    ));
  }, [user, effectiveUserId, transactions]);

  const handleBulkConfirm = useCallback(async () => {
    if (!bulkDialog) return;
    const { id, merchant, originalCat, cat, catDetail, applyToFuture, count } = bulkDialog;
    setBulkDialog(d => ({ ...d, step: 'updating' }));
    const { error } = await supabase
      .from('imported_transactions')
      .update({ cat, cat_detail: catDetail || null })
      .eq('user_id', effectiveUserId)
      .eq('merchant', merchant)
      .eq('cat', originalCat);
    if (!error) {
      setTransactions(prev => prev.map(tx =>
        tx.merchant === merchant && tx.cat === originalCat
          ? { ...tx, cat, cat_detail: catDetail }
          : tx
      ));
    }
    if (applyToFuture) {
      const escaped = merchant.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const pattern = `^${escaped}$`;
      const existing = rules.find(r => r.match_field === 'merchant' && r.pattern === pattern);
      await saveRule({ ...existing, pattern, match_field: 'merchant', cat, cat_detail: catDetail || null });
    }
    setBulkDialog(d => ({ ...d, step: 'done' }));
  }, [bulkDialog, user, effectiveUserId, rules, saveRule]);

  const availableYears = useMemo(() => {
    const yrs = new Set(transactions.map(tx => tx.date?.substring(0, 4)).filter(Boolean));
    const result = [...yrs].sort().reverse();
    if (!result.includes(String(todayYear))) result.unshift(String(todayYear));
    return result;
  }, [transactions, todayYear]);

  const cardSummary = useMemo(() => {
    const map = {};
    for (const tx of transactions) {
      const card = tx._card || 'Unknown';
      if (!map[card]) map[card] = { count: 0, minDate: tx.date, maxDate: tx.date };
      map[card].count++;
      if (tx.date < map[card].minDate) map[card].minDate = tx.date;
      if (tx.date > map[card].maxDate) map[card].maxDate = tx.date;
    }
    return Object.entries(map).sort((a, b) => b[1].count - a[1].count);
  }, [transactions]);

  const filteredTransactions = useMemo(() => {
    if (filterMode === 'all') return transactions;
    if (filterMode === 'month') {
      const prefix = `${filterMonth.year}-${String(filterMonth.month).padStart(2, '0')}`;
      return transactions.filter(tx => tx.date?.startsWith(prefix));
    }
    return transactions.filter(tx => {
      if (!tx.date) return false;
      if (filterStart && tx.date < filterStart) return false;
      if (filterEnd   && tx.date > filterEnd)   return false;
      return true;
    });
  }, [transactions, filterMode, filterMonth, filterStart, filterEnd]);

  const controlCls = "bg-muted border border-border rounded text-xs py-1.5 px-3 outline-none cursor-pointer text-foreground";

  return (
    <>
      {/* ── Page heading ────────────────────────────────────────────────── */}
      <div className="mb-5">
        <h2 className="text-[22px] font-extrabold tracking-[-0.3px]">My Spending</h2>
        <p className="text-xs text-muted-foreground mt-1">All transactions saved to your account.</p>
      </div>

      {/* ── Saved data card summary ──────────────────────────────────────── */}
      {cardSummary.length > 0 && (
        <div className="mb-6 pb-6 border-b border-border">
          <div className="text-[10px] tracking-[1.5px] uppercase text-muted-foreground mb-2.5">Saved Data</div>
          <div className="grid gap-3" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(185px, 1fr))' }}>
            {cardSummary.map(([card, { count, minDate, maxDate }]) => (
              <div key={card} className="bg-muted border border-border rounded-lg px-5 py-4.5">
                <div className="text-[10px] tracking-[1.5px] uppercase text-muted-foreground mb-2">{card}</div>
                <div className="text-[22px] font-extrabold text-primary">{count}</div>
                <div className="text-[11px] text-muted-foreground mt-1">transactions</div>
                <div className="text-[11px] text-muted-foreground mt-1">{fmtShortDate(minDate)} – {fmtShortDate(maxDate)}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Date range filter ────────────────────────────────────────────── */}
      <div className="flex gap-3 items-center flex-wrap mb-7">
        <div className="flex border border-border rounded-md overflow-hidden">
          {[['all', 'All Time'], ['month', 'Month'], ['custom', 'Custom Range']].map(([mode, label], i, arr) => (
            <button
              key={mode}
              onClick={() => setFilterMode(mode)}
              className={`text-[11px] font-bold px-3.5 py-1.5 cursor-pointer transition-colors border-0 whitespace-nowrap ${i < arr.length - 1 ? 'border-r border-border' : ''} ${filterMode === mode ? 'bg-primary text-primary-foreground' : 'bg-transparent text-muted-foreground hover:text-foreground'}`}
            >
              {label}
            </button>
          ))}
        </div>

        {filterMode === 'month' && (
          <div className="flex gap-2 items-center">
            <select className={controlCls} value={filterMonth.month} onChange={e => setFilterMonth(p => ({ ...p, month: +e.target.value }))}>
              {MONTHS.map((m, i) => <option key={i} value={i + 1}>{m}</option>)}
            </select>
            <select className={controlCls} value={filterMonth.year} onChange={e => setFilterMonth(p => ({ ...p, year: +e.target.value }))}>
              {availableYears.map(y => <option key={y} value={y}>{y}</option>)}
            </select>
          </div>
        )}

        {filterMode === 'custom' && (
          <div className="flex gap-2 items-center">
            <input type="date" className={controlCls} value={filterStart} onChange={e => setFilterStart(e.target.value)} />
            <span className="text-muted-foreground text-xs">—</span>
            <input type="date" className={controlCls} value={filterEnd} onChange={e => setFilterEnd(e.target.value)} />
          </div>
        )}
      </div>

      {/* ── States ──────────────────────────────────────────────────────── */}
      {loading && (
        <div className="py-12 text-center text-muted-foreground text-[13px]">
          Loading transactions…
        </div>
      )}

      {!loading && error && (
        <div className="py-8 text-destructive text-[13px]">
          Error loading transactions: {error}
        </div>
      )}

      {!loading && !error && transactions.length === 0 && (
        <div className="py-12 text-center text-muted-foreground text-[13px] leading-loose">
          No saved transactions yet.<br />
          Use the Analyzer to import transactions to your account.
        </div>
      )}

      {!loading && !error && transactions.length > 0 && filteredTransactions.length === 0 && (
        <div className="py-12 text-center text-muted-foreground text-[13px]">
          No transactions for this period.
        </div>
      )}

      {!loading && !error && filteredTransactions.length > 0 && (
        <ResultsView
          allTransactions={filteredTransactions}
          onReCategorize={handleReCategorize}
          onDeleteTransaction={isLinked ? undefined : handleDeleteTransaction}
          onBulkDelete={isLinked ? undefined : handleBulkDelete}
          hideImport
          hideExcluded
          syncFiltersToURL
        />
      )}

      {deleteResult && (
        <Dialog open onOpenChange={() => setDeleteResult(null)}>
          <DialogContent>
            {deleteResult.success ? (<>
              <DialogHeader>
                <DialogTitle>Deleted</DialogTitle>
                <DialogDescription>
                  {deleteResult.count} transaction{deleteResult.count !== 1 ? 's' : ''} removed successfully.
                </DialogDescription>
              </DialogHeader>
              <DialogFooter>
                <Button onClick={() => setDeleteResult(null)}>Done</Button>
              </DialogFooter>
            </>) : (<>
              <DialogHeader>
                <DialogTitle>Delete incomplete</DialogTitle>
                <DialogDescription>
                  {deleteResult.deleted > 0
                    ? `${deleteResult.deleted} of ${deleteResult.count} transaction${deleteResult.count !== 1 ? 's' : ''} were deleted. The rest could not be removed — this may be a permissions issue.`
                    : `None of the ${deleteResult.count} transaction${deleteResult.count !== 1 ? 's' : ''} were deleted. Check your database permissions or try again.`
                  }
                </DialogDescription>
              </DialogHeader>
              <DialogFooter>
                <Button variant="outline" onClick={() => setDeleteResult(null)}>Close</Button>
              </DialogFooter>
            </>)}
          </DialogContent>
        </Dialog>
      )}

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
