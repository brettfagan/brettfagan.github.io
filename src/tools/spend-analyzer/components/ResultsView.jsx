import { useMemo, useState } from 'react';
import { useCategories } from '../context/CategoriesContext';
import { fmt, fmtCat, fmtDetail, fmtShortDate } from '../lib/format';
import CategoryBreakdown from './CategoryBreakdown';
import TransactionTable from './TransactionTable';
import TransactionModal from './TransactionModal';

export default function ResultsView({ allTransactions }) {
  const { excludedKeys } = useCategories();
  const [modalTx, setModalTx] = useState(null);
  // catFilter is used to communicate category click → table, but table manages its own filter state
  // We use a key to reset the table when the user clicks a category
  const [tableFilterSignal, setTableFilterSignal] = useState(null);
  const [excludedOpen, setExcludedOpen] = useState(true);

  const { spending, credits, excluded, cats, maxCat, grandTotal, postedTotal, postedSpend, pendingSpend, pendingTotal, totalCredits, dateRange } = useMemo(() => {
    const spending = allTransactions.filter(tx => tx.amount > 0 && !excludedKeys.includes(tx.cat));
    const credits  = allTransactions.filter(tx => tx.amount < 0 && !excludedKeys.includes(tx.cat));
    const excluded = allTransactions.filter(tx => excludedKeys.includes(tx.cat));

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

    return { spending, credits, excluded, cats, maxCat, grandTotal, postedTotal, postedSpend, pendingSpend, pendingTotal, totalCredits, dateRange, cardSet };
  }, [allTransactions, excludedKeys]);

  const cardSet = useMemo(() => new Set(allTransactions.map(t => t._card)), [allTransactions]);

  function handleCategoryFilter(cat, detail) {
    setTableFilterSignal({ cat, detail: detail || null, ts: Date.now() });
  }

  return (
    <div className="results-section">
      <div style={{ fontSize: '11px', color: 'var(--muted)', marginBottom: '16px', marginTop: '-8px', display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
        {dateRange
          ? <span>Transaction date range: <span style={{ fontWeight: 600, color: 'var(--text)' }}>{dateRange}</span></span>
          : <span />
        }
        <span>
          Total transactions analyzed:{' '}
          <span style={{ fontWeight: 700, color: 'var(--text)' }}>
            {pendingSpend.length + postedSpend.length + credits.length + excluded.length}
          </span>
        </span>
      </div>

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

      {excluded.length > 0 && (
        <>
          <div
            onClick={() => setExcludedOpen(o => !o)}
            style={{ fontFamily: "'DM Mono',monospace", fontSize: '11px', fontWeight: 700, letterSpacing: '2px', textTransform: 'uppercase', color: 'var(--muted)', marginTop: '32px', marginBottom: excludedOpen ? '10px' : '0', paddingBottom: '8px', borderBottom: '1px solid var(--border)', cursor: 'pointer', userSelect: 'none', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
          >
            <span>
              Excluded{' '}
              <span style={{ fontWeight: 400 }}>{excluded.length} transaction{excluded.length !== 1 ? 's' : ''}</span>
              <span style={{ fontWeight: 400, fontSize: '10px', marginLeft: '8px' }}>— categories marked "excluded" in Settings</span>
              {!excludedOpen && <span style={{ fontWeight: 400, color: 'var(--text)', marginLeft: '12px' }}>{fmt(excluded.reduce((s, t) => s + Math.abs(t.amount), 0))} total</span>}
            </span>
            <span style={{ fontSize: '9px', opacity: 0.6, letterSpacing: 0 }}>{excludedOpen ? '▼ hide' : '▶ show'}</span>
          </div>
          {excludedOpen && <><table>
            <colgroup>
              <col className="c-date" />
              <col className="c-merchant" />
              <col className="c-category" />
              <col className="c-subcat" />
              <col className="c-card" />
              <col className="c-amount" />
            </colgroup>
            <thead>
              <tr>
                <th>Date</th>
                <th>Merchant</th>
                <th>Category</th>
                <th>Subcategory</th>
                <th>Card</th>
                <th style={{ textAlign: 'right' }}>Amount</th>
              </tr>
            </thead>
            <tbody>
              {excluded.sort((a, b) => (a.date < b.date ? 1 : -1)).map((tx, i) => (
                <tr key={i} style={{ opacity: 0.6 }}>
                  <td className="td-date">{tx.date}</td>
                  <td className="td-merchant" title={tx.merchant}>
                    <div className="merchant-cell">
                      {tx.logo_url
                        ? <img className="merchant-logo" src={tx.logo_url} alt="" onError={e => { e.target.classList.add('merchant-logo-placeholder'); e.target.removeAttribute('src'); }} />
                        : <span className="merchant-logo-placeholder" />
                      }
                      <span className="merchant-name">{tx.merchant}</span>
                      {tx.source === 'csv' && <span style={{ fontSize: '9px', color: 'var(--accent2)', marginLeft: '5px' }}>CSV</span>}
                    </div>
                  </td>
                  <td><span className="badge" style={{ borderColor: 'var(--muted)', color: 'var(--muted)' }}>{fmtCat(tx.cat)}</span></td>
                  <td style={{ fontSize: '11px', color: 'var(--muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {tx.cat_detail ? fmtDetail(tx.cat_detail) : ''}
                  </td>
                  <td style={{ color: 'var(--muted)', fontSize: '11px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {tx._card}
                  </td>
                  <td className="td-amount" style={{ color: 'var(--muted)' }}>
                    {tx.amount < 0 ? `-${fmt(Math.abs(tx.amount))}` : fmt(tx.amount)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '11px', padding: '10px 0', color: 'var(--muted)' }}>
            <span>{excluded.length} excluded transaction{excluded.length !== 1 ? 's' : ''}</span>
            <span style={{ fontWeight: 700 }}>{fmt(excluded.reduce((s, t) => s + Math.abs(t.amount), 0))} total</span>
          </div>}</>}
        </>
      )}

    </div>
  );
}
