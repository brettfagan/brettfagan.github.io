import { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import ResultsView from './ResultsView';

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

const selectStyle = {
  background: 'var(--surface)',
  border: '1px solid var(--border)',
  borderRadius: '4px',
  color: 'var(--text)',
  fontFamily: "'DM Mono', monospace",
  fontSize: '12px',
  padding: '7px 12px',
  outline: 'none',
  cursor: 'pointer',
};

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
  const { user } = useAuth();
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const todayYear  = new Date().getFullYear();
  const todayMonth = new Date().getMonth() + 1;

  const [filterMode, setFilterMode]   = useState('all');
  const [filterMonth, setFilterMonth] = useState({ month: todayMonth, year: todayYear });
  const [filterStart, setFilterStart] = useState('');
  const [filterEnd, setFilterEnd]     = useState('');

  useEffect(() => {
    if (!user) return;
    load();
  }, [user]);

  async function load() {
    setLoading(true);
    setError(null);
    const { data, error } = await supabase
      .from('imported_transactions')
      .select('*')
      .eq('user_id', user.id)
      .order('date', { ascending: false });
    if (error) { setError(error.message); setLoading(false); return; }
    setTransactions((data || []).map(mapRow));
    setLoading(false);
  }

  const handleDeleteTransaction = useCallback(async (id) => {
    const { error } = await supabase
      .from('imported_transactions')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id);
    if (!error) setTransactions(prev => prev.filter(tx => tx._id !== id));
  }, [user]);

  const handleReCategorize = useCallback(async (id, cat, catDetail) => {
    const { error } = await supabase
      .from('imported_transactions')
      .update({ cat, cat_detail: catDetail || null })
      .eq('id', id)
      .eq('user_id', user.id);
    if (!error) setTransactions(prev => prev.map(tx =>
      tx._id === id ? { ...tx, cat, cat_detail: catDetail } : tx
    ));
  }, [user]);

  // Years derived from loaded data, current year always included
  const availableYears = useMemo(() => {
    const yrs = new Set(transactions.map(tx => tx.date?.substring(0, 4)).filter(Boolean));
    const result = [...yrs].sort().reverse();
    if (!result.includes(String(todayYear))) result.unshift(String(todayYear));
    return result;
  }, [transactions, todayYear]);

  const filteredTransactions = useMemo(() => {
    if (filterMode === 'all') return transactions;
    if (filterMode === 'month') {
      const prefix = `${filterMonth.year}-${String(filterMonth.month).padStart(2, '0')}`;
      return transactions.filter(tx => tx.date?.startsWith(prefix));
    }
    // custom
    return transactions.filter(tx => {
      if (!tx.date) return false;
      if (filterStart && tx.date < filterStart) return false;
      if (filterEnd   && tx.date > filterEnd)   return false;
      return true;
    });
  }, [transactions, filterMode, filterMonth, filterStart, filterEnd]);

  return (
    <>
      {/* ── Page heading ────────────────────────────────────────────────── */}
      <div style={{ marginBottom: '20px' }}>
        <h2 style={{ fontFamily: "'DM Mono',monospace", fontSize: '22px', fontWeight: 800, letterSpacing: '-0.3px', color: 'var(--text)' }}>
          My Spending
        </h2>
        <p style={{ fontSize: '12px', color: 'var(--muted)', marginTop: '4px' }}>
          All transactions saved to your account.
        </p>
      </div>

      {/* ── Date range filter ────────────────────────────────────────────── */}
      <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap', marginBottom: '28px', paddingBottom: '20px', borderBottom: '1px solid var(--border)' }}>
        {/* Mode toggle */}
        <div style={{ display: 'flex', border: '1px solid var(--border)', borderRadius: '5px', overflow: 'hidden' }}>
          {[['all', 'All Time'], ['month', 'Month'], ['custom', 'Custom Range']].map(([mode, label], i, arr) => (
            <button
              key={mode}
              onClick={() => setFilterMode(mode)}
              style={{
                fontFamily: "'DM Mono', monospace",
                fontSize: '11px',
                fontWeight: 700,
                padding: '6px 14px',
                background: filterMode === mode ? 'var(--accent)' : 'transparent',
                color: filterMode === mode ? '#fff' : 'var(--muted)',
                border: 'none',
                borderRight: i < arr.length - 1 ? '1px solid var(--border)' : 'none',
                cursor: 'pointer',
                transition: 'background 0.15s, color 0.15s',
                whiteSpace: 'nowrap',
              }}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Month picker */}
        {filterMode === 'month' && (
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <select
              value={filterMonth.month}
              onChange={e => setFilterMonth(p => ({ ...p, month: +e.target.value }))}
              style={selectStyle}
            >
              {MONTHS.map((m, i) => <option key={i} value={i + 1}>{m}</option>)}
            </select>
            <select
              value={filterMonth.year}
              onChange={e => setFilterMonth(p => ({ ...p, year: +e.target.value }))}
              style={selectStyle}
            >
              {availableYears.map(y => <option key={y} value={y}>{y}</option>)}
            </select>
          </div>
        )}

        {/* Custom date range */}
        {filterMode === 'custom' && (
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <input
              type="date"
              value={filterStart}
              onChange={e => setFilterStart(e.target.value)}
              style={selectStyle}
            />
            <span style={{ color: 'var(--muted)', fontSize: '12px' }}>—</span>
            <input
              type="date"
              value={filterEnd}
              onChange={e => setFilterEnd(e.target.value)}
              style={selectStyle}
            />
          </div>
        )}
      </div>

      {/* ── States ──────────────────────────────────────────────────────── */}
      {loading && (
        <div style={{ padding: '48px 0', textAlign: 'center', color: 'var(--muted)', fontFamily: "'DM Mono',monospace", fontSize: '13px' }}>
          Loading transactions…
        </div>
      )}

      {!loading && error && (
        <div style={{ padding: '32px 0', color: 'var(--danger)', fontSize: '13px' }}>
          Error loading transactions: {error}
        </div>
      )}

      {!loading && !error && transactions.length === 0 && (
        <div style={{ padding: '48px 0', textAlign: 'center', color: 'var(--muted)', fontFamily: "'DM Mono',monospace", fontSize: '13px', lineHeight: 2 }}>
          No saved transactions yet.<br />
          Use the Analyzer to import transactions to your account.
        </div>
      )}

      {!loading && !error && transactions.length > 0 && filteredTransactions.length === 0 && (
        <div style={{ padding: '48px 0', textAlign: 'center', color: 'var(--muted)', fontFamily: "'DM Mono',monospace", fontSize: '13px' }}>
          No transactions for this period.
        </div>
      )}

      {!loading && !error && filteredTransactions.length > 0 && (
        <ResultsView
          allTransactions={filteredTransactions}
          onReCategorize={handleReCategorize}
          onDeleteTransaction={handleDeleteTransaction}
          hideImport
        />
      )}
    </>
  );
}
