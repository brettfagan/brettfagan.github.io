import { useState, useMemo } from 'react';
import { useCategories } from '../context/CategoriesContext';
import { fmt, fmtCat } from '../lib/format';
import { useDetailLabels } from '../context/DetailLabelsContext';

export default function TransactionTable({ spending, credits, categories, initialCatFilter = '', initialDetailFilter = '', onOpenModal }) {
  const { getCatColor } = useCategories();
  const { getDetailLabel } = useDetailLabels();
  const [search, setSearch] = useState('');
  const [catFilter, setCatFilter] = useState(initialCatFilter);
  const [detailFilter, setDetailFilter] = useState(initialDetailFilter);
  const [cardFilter, setCardFilter] = useState('');
  const [sortCol, setSortCol] = useState('date');
  const [sortDir, setSortDir] = useState(1);
  const [pendingOpen, setPendingOpen] = useState(true);
  const [postedOpen, setPostedOpen] = useState(true);
  const [creditsOpen, setCreditsOpen] = useState(true);

  const cardSet = useMemo(() => [...new Set(spending.map(t => t._card))], [spending]);

  const detailOptions = useMemo(() => {
    if (!catFilter) return [];
    const all = [...spending, ...credits];
    return [...new Set(all.filter(tx => tx.cat === catFilter && tx.cat_detail).map(tx => tx.cat_detail))].sort();
  }, [catFilter, spending, credits]);

  function handleCatChange(val) {
    setCatFilter(val);
    setDetailFilter('');
  }

  function handleSort(col) {
    if (sortCol === col) setSortDir(d => d * -1);
    else { setSortCol(col); setSortDir(-1); }
  }

  const sortArrow = col => sortCol === col ? (sortDir > 0 ? ' ↑' : ' ↓') : '';

  const sortFn = (a, b) => {
    const av = sortCol === 'date' ? a.date : sortCol === 'amount' ? a.amount : a.merchant.toLowerCase();
    const bv = sortCol === 'date' ? b.date : sortCol === 'amount' ? b.amount : b.merchant.toLowerCase();
    return av < bv ? sortDir : av > bv ? -sortDir : 0;
  };

  const q = search.toLowerCase();
  const filtered = spending.filter(tx =>
    (!q || tx.merchant.toLowerCase().includes(q)) &&
    (!catFilter || tx.cat === catFilter) &&
    (!detailFilter || tx.cat_detail === detailFilter) &&
    (!cardFilter || tx._card === cardFilter)
  );

  const pending = filtered.filter(tx => tx.pending).sort(sortFn);
  const posted = filtered.filter(tx => !tx.pending).sort(sortFn);

  const filteredCredits = credits.filter(tx =>
    (!q || tx.merchant.toLowerCase().includes(q)) &&
    (!catFilter || tx.cat === catFilter) &&
    (!detailFilter || tx.cat_detail === detailFilter) &&
    (!cardFilter || tx._card === cardFilter)
  ).sort(sortFn);

  const hasFilters = q || catFilter || detailFilter || cardFilter;

  const colgroup = (
    <colgroup>
      <col className="c-date" />
      <col className="c-merchant" />
      <col className="c-category" />
      <col className="c-subcat" />
      <col className="c-channel" />
      <col className="c-card" />
      <col className="c-amount" />
    </colgroup>
  );

  const thead = (
    <thead>
      <tr>
        <th onClick={() => handleSort('date')}>Date{sortArrow('date')}</th>
        <th onClick={() => handleSort('merchant')}>Merchant{sortArrow('merchant')}</th>
        <th>Category</th>
        <th>Subcategory</th>
        <th>Channel</th>
        <th>Card</th>
        <th onClick={() => handleSort('amount')} style={{ textAlign: 'right' }}>Amount{sortArrow('amount')}</th>
      </tr>
    </thead>
  );

  function TxRow({ tx, creditStyle }) {
    const color = getCatColor(tx.cat);
    return (
      <tr onClick={() => onOpenModal(tx)} style={{ cursor: 'pointer' }}>
        <td className="td-date">{tx.date}</td>
        <td className="td-merchant" title={tx.merchant}>
          <div className="merchant-cell">
            {(tx.logo_url || tx.cat_icon_url)
              ? <img className="merchant-logo" src={tx.logo_url || tx.cat_icon_url} alt="" onError={e => { e.target.classList.add('merchant-logo-placeholder'); e.target.removeAttribute('src'); }} />
              : <span className="merchant-logo-placeholder" />
            }
            <span className={`merchant-name${tx.cat_confidence === 'LOW' ? ' low-confidence' : ''}`}
              title={tx.cat_confidence === 'LOW' ? 'Low categorization confidence' : undefined}>
              {tx.merchant}
            </span>
            {tx.source === 'csv' && <span style={{ fontSize: '9px', color: 'var(--accent2)', marginLeft: '5px' }}>CSV</span>}
          </div>
        </td>
        <td><span className="badge" style={{ borderColor: color, color }}>{fmtCat(tx.cat)}</span></td>
        <td style={{ fontSize: '11px', color: 'var(--muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {tx.cat_detail ? getDetailLabel(tx.cat_detail) : ''}
        </td>
        <td>
          {tx.payment_channel && (
            <span className="channel-tag">{tx.payment_channel.replace(/_/g, ' ')}</span>
          )}
        </td>
        <td style={{ color: 'var(--muted)', fontSize: '11px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {tx._card}
        </td>
        <td className="td-amount" style={creditStyle ? { color: 'var(--accent2)' } : undefined}>
          {creditStyle ? `-${fmt(Math.abs(tx.amount))}` : fmt(tx.amount)}
        </td>
      </tr>
    );
  }

  return (
    <>
      <div className="table-controls">
        <input
          className="search-input"
          placeholder="Search merchant..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
        <select value={catFilter} onChange={e => handleCatChange(e.target.value)}>
          <option value="">All categories</option>
          {categories.map(([c]) => <option key={c} value={c}>{fmtCat(c)}</option>)}
        </select>
        {detailOptions.length > 0 && (
          <select value={detailFilter} onChange={e => setDetailFilter(e.target.value)}>
            <option value="">All sub-categories</option>
            {detailOptions.map(d => <option key={d} value={d}>{getDetailLabel(d)}</option>)}
          </select>
        )}
        <select value={cardFilter} onChange={e => setCardFilter(e.target.value)}>
          <option value="">All cards</option>
          {cardSet.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
        {hasFilters && (
          <button
            style={{ padding: '7px 14px', background: 'transparent', border: '1px solid #d0d3db', borderRadius: '4px', color: '#6b7280', fontFamily: "'DM Mono',monospace", fontSize: '11px', fontWeight: 700, cursor: 'pointer', whiteSpace: 'nowrap' }}
            onClick={() => { setSearch(''); setCatFilter(''); setDetailFilter(''); setCardFilter(''); }}
          >
            ✕ Clear filters
          </button>
        )}
      </div>

      {!filtered.length
        ? <div style={{ color: 'var(--muted)', padding: '24px 0' }}>No transactions match.</div>
        : <>
          {pending.length > 0 && (
            <>
              <div
                onClick={() => setPendingOpen(o => !o)}
                style={{ fontFamily: "'DM Mono',monospace", fontSize: '11px', fontWeight: 700, letterSpacing: '2px', textTransform: 'uppercase', color: 'var(--warn)', marginBottom: pendingOpen ? '10px' : '24px', paddingBottom: '8px', borderBottom: '1px solid var(--border)', cursor: 'pointer', userSelect: 'none', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
              >
                <span>
                  Pending <span style={{ fontWeight: 400, color: 'var(--muted)' }}>{pending.length} transaction{pending.length !== 1 ? 's' : ''}</span>
                  {!pendingOpen && <span style={{ fontWeight: 400, color: 'var(--text)', marginLeft: '12px' }}>{fmt(pending.reduce((s, t) => s + t.amount, 0))}</span>}
                </span>
                <span style={{ fontSize: '9px', opacity: 0.6, letterSpacing: 0 }}>{pendingOpen ? '▼ hide' : '▶ show'}</span>
              </div>
              {pendingOpen && (
                <>
                  <table>{colgroup}{thead}<tbody>{pending.map((tx, i) => <TxRow key={i} tx={tx} />)}</tbody></table>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: 'var(--muted)', fontSize: '11px', padding: '10px 0 24px' }}>
                    <span>{pending.length} pending transaction{pending.length !== 1 ? 's' : ''}</span>
                    <span style={{ fontWeight: 700, color: 'var(--text)' }}>{fmt(pending.reduce((s, t) => s + t.amount, 0))}</span>
                  </div>
                </>
              )}
            </>
          )}

          <div
            onClick={() => setPostedOpen(o => !o)}
            style={{ fontFamily: "'DM Mono',monospace", fontSize: '11px', fontWeight: 700, letterSpacing: '2px', textTransform: 'uppercase', color: 'var(--accent)', marginBottom: postedOpen ? '10px' : '0', paddingBottom: '8px', borderBottom: '1px solid var(--border)', cursor: 'pointer', userSelect: 'none', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
          >
            <span>
              Posted <span style={{ fontWeight: 400, color: 'var(--muted)' }}>{posted.length} transaction{posted.length !== 1 ? 's' : ''}</span>
              {!postedOpen && <span style={{ fontWeight: 400, color: 'var(--text)', marginLeft: '12px' }}>{fmt(posted.reduce((s, t) => s + t.amount, 0))}</span>}
            </span>
            <span style={{ fontSize: '9px', opacity: 0.6, letterSpacing: 0 }}>{postedOpen ? '▼ hide' : '▶ show'}</span>
          </div>
          {postedOpen && <>
            {posted.length
              ? <table>{colgroup}{thead}<tbody>{posted.map((tx, i) => <TxRow key={i} tx={tx} />)}</tbody></table>
              : <div style={{ color: 'var(--muted)', padding: '16px 0' }}>No posted transactions match.</div>
            }
            <div style={{ fontSize: '11px', padding: '10px 0' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: 'var(--muted)', marginBottom: '2px' }}>
                <span>{posted.length} posted transaction{posted.length !== 1 ? 's' : ''}</span>
                <span style={{ fontWeight: 700, color: 'var(--text)' }}>{fmt(posted.reduce((s, t) => s + t.amount, 0))}</span>
              </div>
              <div style={{ color: 'var(--muted)' }}>{filtered.length} of {spending.length} total transactions</div>
            </div>
          </>}
        </>
      }

      {filteredCredits.length > 0 && (
        <>
          <div
            onClick={() => setCreditsOpen(o => !o)}
            style={{ fontFamily: "'DM Mono',monospace", fontSize: '11px', fontWeight: 700, letterSpacing: '2px', textTransform: 'uppercase', color: 'var(--accent2)', marginTop: '32px', marginBottom: creditsOpen ? '10px' : '0', paddingBottom: '8px', borderBottom: '1px solid var(--border)', cursor: 'pointer', userSelect: 'none', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
          >
            <span>
              Credits / Refunds <span style={{ fontWeight: 400, color: 'var(--muted)' }}>{filteredCredits.length} transaction{filteredCredits.length !== 1 ? 's' : ''}</span>
              {!creditsOpen && <span style={{ fontWeight: 400, color: 'var(--accent2)', marginLeft: '12px' }}>{fmt(filteredCredits.reduce((s, t) => s + Math.abs(t.amount), 0))} credited</span>}
            </span>
            <span style={{ fontSize: '9px', opacity: 0.6, letterSpacing: 0 }}>{creditsOpen ? '▼ hide' : '▶ show'}</span>
          </div>
          {creditsOpen && <>
            <table>{colgroup}{thead}<tbody>{filteredCredits.map((tx, i) => <TxRow key={i} tx={tx} creditStyle />)}</tbody></table>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '11px', padding: '10px 0' }}>
              <span style={{ color: 'var(--muted)' }}>{filteredCredits.length} refund{filteredCredits.length !== 1 ? 's' : ''}</span>
              <span style={{ fontWeight: 700, color: 'var(--accent2)' }}>{fmt(filteredCredits.reduce((s, t) => s + Math.abs(t.amount), 0))} credited</span>
            </div>
          </>}
        </>
      )}

      <div style={{ color: 'var(--muted)', fontSize: '10px', padding: '8px 0', display: 'flex', gap: '16px' }}>
        <span><span className="low-confidence" style={{ fontSize: '10px' }}>ABC</span> Low categorization confidence</span>
      </div>
    </>
  );
}
