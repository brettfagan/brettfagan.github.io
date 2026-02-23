import { useMemo, useState } from 'react';
import { useCategories } from '../context/CategoriesContext';
import { fmt, fmtShortDate } from '../lib/format';
import CategoryBreakdown from './CategoryBreakdown';
import TransactionTable from './TransactionTable';
import TransactionModal from './TransactionModal';

export default function ResultsView({ allTransactions }) {
  const { excludedKeys } = useCategories();
  const [modalTx, setModalTx] = useState(null);
  // catFilter is used to communicate category click → table, but table manages its own filter state
  // We use a key to reset the table when the user clicks a category
  const [tableFilterSignal, setTableFilterSignal] = useState(null);

  const { spending, credits, cats, maxCat, grandTotal, postedTotal, postedSpend, pendingSpend, pendingTotal, totalCredits, dateRange } = useMemo(() => {
    const spending = allTransactions.filter(tx => tx.amount > 0 && !excludedKeys.includes(tx.cat));
    const credits  = allTransactions.filter(tx => tx.amount < 0 && !excludedKeys.includes(tx.cat));

    const catMap = {};
    [...spending.filter(tx => !tx.pending), ...credits].forEach(tx => {
      const c = tx.cat || 'OTHER';
      if (!catMap[c]) catMap[c] = { total: 0, count: 0 };
      catMap[c].total += tx.amount;
      catMap[c].count++;
    });

    const cats = Object.entries(catMap)
      .filter(([, d]) => d.count > 0)
      .sort((a, b) => b[1].total - a[1].total);

    const maxCat = Math.max(...cats.map(([, d]) => Math.abs(d.total))) || 1;
    const postedSpend = spending.filter(t => !t.pending);
    const pendingSpend = spending.filter(t => t.pending);
    const postedTotal = postedSpend.reduce((s, t) => s + t.amount, 0);
    const pendingTotal = pendingSpend.reduce((s, t) => s + t.amount, 0);
    const totalCredits = Math.abs(credits.reduce((s, t) => s + t.amount, 0));
    const grandTotal = postedTotal + credits.reduce((s, t) => s + t.amount, 0);

    const allDates = allTransactions.map(t => t.date).filter(Boolean).sort();
    const dateRange = allDates.length
      ? `${fmtShortDate(allDates[0])} — ${fmtShortDate(allDates[allDates.length - 1])}`
      : null;

    const cardSet = new Set(spending.map(t => t._card));

    return { spending, credits, cats, maxCat, grandTotal, postedTotal, postedSpend, pendingSpend, pendingTotal, totalCredits, dateRange, cardSet };
  }, [allTransactions, excludedKeys]);

  const cardSet = useMemo(() => new Set(allTransactions.map(t => t._card)), [allTransactions]);

  function handleCategoryFilter(cat, detail) {
    setTableFilterSignal({ cat, detail: detail || null, ts: Date.now() });
  }

  return (
    <div className="results-section">
      {dateRange && (
        <div style={{ fontSize: '11px', color: 'var(--muted)', marginBottom: '16px', marginTop: '-8px' }}>
          Transaction date range: <span style={{ fontWeight: 600, color: 'var(--text)' }}>{dateRange}</span>
        </div>
      )}

      <div className="stats-row">
        <div className="stat-card">
          <div className="stat-label">Cards</div>
          <div className="stat-value">{cardSet.size}</div>
          <div className="stat-sub">{[...cardSet].join(' · ')}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Total Posted Spend</div>
          <div className="stat-value">{fmt(postedTotal)}</div>
          <div className="stat-sub">{postedSpend.length} transactions</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Credits / Refunds</div>
          <div className="stat-value" style={{ color: 'var(--accent2)' }}>{fmt(totalCredits)}</div>
          <div className="stat-sub">{credits.length} transaction{credits.length !== 1 ? 's' : ''}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Total Net Spend</div>
          <div className="stat-value" style={{ color: 'var(--text)' }}>{fmt(postedTotal - totalCredits)}</div>
          <div className="stat-sub">posted minus refunds</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Total Pending Spend</div>
          <div className="stat-value" style={{ color: 'var(--warn)' }}>{fmt(pendingTotal)}</div>
          <div className="stat-sub">{pendingSpend.length} transactions</div>
        </div>
      </div>

      <CategoryBreakdown
        cats={cats}
        maxCat={maxCat}
        grandTotal={grandTotal}
        spending={spending}
        credits={credits}
        pendingCount={pendingSpend.length}
        onFilter={handleCategoryFilter}
      />

      <div className="section-title">Transactions</div>
      <TransactionTable
        key={tableFilterSignal ? `${tableFilterSignal.cat}-${tableFilterSignal.ts}` : 'initial'}
        spending={spending}
        credits={credits}
        categories={cats}
        initialCatFilter={tableFilterSignal?.cat || ''}
        initialDetailFilter={tableFilterSignal?.detail || ''}
        onOpenModal={setModalTx}
      />

      {modalTx && <TransactionModal tx={modalTx} onClose={() => setModalTx(null)} />}
    </div>
  );
}
