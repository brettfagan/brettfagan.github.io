import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import ResultsView from './ResultsView';

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

  return (
    <>
      <div style={{ marginBottom: '28px' }}>
        <h2 style={{ fontFamily: "'DM Mono',monospace", fontSize: '22px', fontWeight: 800, letterSpacing: '-0.3px', color: 'var(--text)' }}>
          My Spending
        </h2>
        <p style={{ fontSize: '12px', color: 'var(--muted)', marginTop: '4px' }}>
          All transactions saved to your account.
        </p>
      </div>

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

      {!loading && !error && transactions.length > 0 && (
        <ResultsView
          allTransactions={transactions}
          onReCategorize={handleReCategorize}
          onDeleteTransaction={handleDeleteTransaction}
          hideImport
        />
      )}
    </>
  );
}
