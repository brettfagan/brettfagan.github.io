import { useState, useMemo } from 'react';
import { useCategories } from '../context/CategoriesContext';
import { fmt, fmtCat } from '../lib/format';
import { useDetailLabels } from '../context/DetailLabelsContext';
import { Button } from '@/components/ui/button';

export default function TransactionTable({ spending, credits, categories, initialCatFilter = '', initialDetailFilter = '', onOpenModal, onDeleteTransaction, onClearFilters }) {
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
  const [pendingDelete, setPendingDelete] = useState(null);

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

  // ── Shared class strings ───────────────────────────────────────────────────
  const ctrlCls = "bg-muted border border-border rounded text-xs py-1.5 px-3 outline-none cursor-pointer text-foreground";
  const thCls   = "text-[10px] font-bold tracking-[1.5px] uppercase text-muted-foreground text-left px-3 py-2 border-b border-border cursor-pointer select-none whitespace-nowrap overflow-hidden hover:text-foreground";
  const tdCls   = "px-3 py-1.5 border-b border-border align-middle overflow-hidden group-hover:bg-black/2 dark:group-hover:bg-white/3";

  const colgroup = (
    <colgroup>
      <col style={{ width: '100px' }} />
      <col style={{ width: '180px' }} />
      <col style={{ width: '160px' }} />
      <col style={{ width: '190px' }} />
      <col style={{ width: '90px' }} />
      <col style={{ width: '110px' }} />
      <col style={{ width: '90px' }} />
      <col style={{ width: '28px' }} />
    </colgroup>
  );

  const thead = (
    <thead>
      <tr>
        <th className={thCls} onClick={() => handleSort('date')}>Date{sortArrow('date')}</th>
        <th className={thCls} onClick={() => handleSort('merchant')}>Merchant{sortArrow('merchant')}</th>
        <th className={thCls}>Category</th>
        <th className={thCls}>Subcategory</th>
        <th className={thCls}>Channel</th>
        <th className={thCls}>Card</th>
        <th className={`${thCls} text-right`} onClick={() => handleSort('amount')}>Amount{sortArrow('amount')}</th>
        <th className={thCls} />
      </tr>
    </thead>
  );

  function TxRow({ tx, creditStyle }) {
    const color = getCatColor(tx.cat);
    return (
      <tr onClick={() => onOpenModal(tx)} className="cursor-pointer even:bg-[#f7f8fa] dark:even:bg-white/3 group">
        <td className={`${tdCls} text-muted-foreground whitespace-nowrap text-xs`}>{tx.date}</td>
        <td className={`${tdCls} font-medium`} title={tx.merchant}>
          <div className="flex items-center gap-2 min-w-0 w-full">
            {(tx.logo_url || tx.cat_icon_url)
              ? <img
                  className="w-7.5 h-7.5 rounded object-contain shrink-0 bg-muted border border-border"
                  src={tx.logo_url || tx.cat_icon_url}
                  alt=""
                  onError={e => e.target.removeAttribute('src')}
                />
              : <span className="w-7.5 h-7.5 rounded shrink-0 inline-block bg-muted border border-border" />
            }
            <span
              className={`overflow-hidden text-ellipsis whitespace-nowrap flex-1 min-w-0 text-xs${tx.cat_confidence === 'LOW' ? ' border border-destructive rounded-[3px] px-0.5' : ''}`}
              title={tx.cat_confidence === 'LOW' ? 'Low categorization confidence' : undefined}
            >
              {tx.merchant}
            </span>
            {tx.source === 'csv' && <span className="text-[9px] text-cyan-600 ml-1">CSV</span>}
          </div>
        </td>
        <td className={tdCls}>
          <span
            className="inline-block text-[10px] px-1.75 py-0.5 rounded-[3px] border whitespace-nowrap"
            style={{ borderColor: color, color }}
          >
            {fmtCat(tx.cat)}
          </span>
        </td>
        <td className={`${tdCls} text-[11px] text-muted-foreground text-ellipsis whitespace-nowrap`}>
          {tx.cat_detail ? getDetailLabel(tx.cat_detail) : ''}
        </td>
        <td className={tdCls}>
          {tx.payment_channel && (
            <span className="inline-block text-[9px] px-1 py-0.5 rounded-[3px] bg-muted border border-border text-muted-foreground whitespace-nowrap">
              {tx.payment_channel.replace(/_/g, ' ')}
            </span>
          )}
        </td>
        <td className={`${tdCls} text-muted-foreground text-[11px] text-ellipsis whitespace-nowrap`}>
          {tx._card}
        </td>
        <td className={`${tdCls} text-right font-medium whitespace-nowrap`} style={creditStyle ? { color: 'var(--accent2)' } : undefined}>
          {creditStyle ? `-${fmt(Math.abs(tx.amount))}` : fmt(tx.amount)}
        </td>
        <td className={`${tdCls} pr-1.5 text-right`}>
          <button
            onClick={e => { e.stopPropagation(); setPendingDelete(tx); }}
            title="Delete transaction"
            className="bg-transparent border-0 cursor-pointer text-muted-foreground text-[11px] p-1 leading-none opacity-50 hover:opacity-100"
          >✕</button>
        </td>
      </tr>
    );
  }

  return (
    <>
      {/* ── Filters ───────────────────────────────────────────────────────── */}
      <div className="flex gap-2.5 mb-3.5 items-center flex-wrap">
        <input
          className={`${ctrlCls} flex-1 min-w-45 transition-colors focus:border-primary`}
          placeholder="Search merchant..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
        <select className={ctrlCls} value={catFilter} onChange={e => handleCatChange(e.target.value)}>
          <option value="">All categories</option>
          {categories.map(([c]) => <option key={c} value={c}>{fmtCat(c)}</option>)}
        </select>
        {detailOptions.length > 0 && (
          <select className={ctrlCls} value={detailFilter} onChange={e => setDetailFilter(e.target.value)}>
            <option value="">All sub-categories</option>
            {detailOptions.map(d => <option key={d} value={d}>{getDetailLabel(d)}</option>)}
          </select>
        )}
        <select className={ctrlCls} value={cardFilter} onChange={e => setCardFilter(e.target.value)}>
          <option value="">All cards</option>
          {cardSet.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
        {hasFilters && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => { setSearch(''); setCatFilter(''); setDetailFilter(''); setCardFilter(''); onClearFilters?.(); }}
            className="text-[11px] font-bold whitespace-nowrap"
          >
            ✕ Clear filters
          </Button>
        )}
      </div>

      {!filtered.length
        ? <div className="text-muted-foreground py-6">No transactions match.</div>
        : <>
          {/* ── Pending section ─────────────────────────────────────────── */}
          {pending.length > 0 && (
            <>
              <div
                onClick={() => setPendingOpen(o => !o)}
                className={`text-[11px] font-bold tracking-[2px] uppercase text-amber-600 pb-2 border-b border-border cursor-pointer select-none flex justify-between items-center ${pendingOpen ? 'mb-2.5' : 'mb-6'}`}
              >
                <span>
                  Pending{' '}
                  <span className="font-normal text-muted-foreground">{pending.length} transaction{pending.length !== 1 ? 's' : ''}</span>
                  {!pendingOpen && <span className="font-normal text-foreground ml-3">{fmt(pending.reduce((s, t) => s + t.amount, 0))}</span>}
                </span>
                <span className="text-[9px] opacity-60 tracking-normal">{pendingOpen ? '▼ hide' : '▶ show'}</span>
              </div>
              {pendingOpen && (
                <>
                  <table className="w-full border-collapse table-fixed">{colgroup}{thead}<tbody>{pending.map((tx, i) => <TxRow key={i} tx={tx} />)}</tbody></table>
                  <div className="flex justify-between items-center text-muted-foreground text-[11px] py-2.5 pb-6">
                    <span>{pending.length} pending transaction{pending.length !== 1 ? 's' : ''}</span>
                    <span className="font-bold text-foreground">{fmt(pending.reduce((s, t) => s + t.amount, 0))}</span>
                  </div>
                </>
              )}
            </>
          )}

          {/* ── Posted section ──────────────────────────────────────────── */}
          <div
            onClick={() => setPostedOpen(o => !o)}
            className={`text-[11px] font-bold tracking-[2px] uppercase text-primary pb-2 border-b border-border cursor-pointer select-none flex justify-between items-center ${postedOpen ? 'mb-2.5' : 'mb-0'}`}
          >
            <span>
              Posted{' '}
              <span className="font-normal text-muted-foreground">{posted.length} transaction{posted.length !== 1 ? 's' : ''}</span>
              {!postedOpen && <span className="font-normal text-foreground ml-3">{fmt(posted.reduce((s, t) => s + t.amount, 0))}</span>}
            </span>
            <span className="text-[9px] opacity-60 tracking-normal">{postedOpen ? '▼ hide' : '▶ show'}</span>
          </div>
          {postedOpen && <>
            {posted.length
              ? <table className="w-full border-collapse table-fixed">{colgroup}{thead}<tbody>{posted.map((tx, i) => <TxRow key={i} tx={tx} />)}</tbody></table>
              : <div className="text-muted-foreground py-4">No posted transactions match.</div>
            }
            <div className="text-[11px] py-2.5">
              <div className="flex justify-between items-center text-muted-foreground mb-0.5">
                <span>{posted.length} posted transaction{posted.length !== 1 ? 's' : ''}</span>
                <span className="font-bold text-foreground">{fmt(posted.reduce((s, t) => s + t.amount, 0))}</span>
              </div>
              <div className="text-muted-foreground">{filtered.length} of {spending.length} total transactions</div>
            </div>
          </>}
        </>
      }

      {/* ── Credits section ───────────────────────────────────────────────── */}
      {filteredCredits.length > 0 && (
        <>
          <div
            onClick={() => setCreditsOpen(o => !o)}
            className={`text-[11px] font-bold tracking-[2px] uppercase text-cyan-600 mt-8 pb-2 border-b border-border cursor-pointer select-none flex justify-between items-center ${creditsOpen ? 'mb-2.5' : 'mb-0'}`}
          >
            <span>
              Credits / Refunds{' '}
              <span className="font-normal text-muted-foreground">{filteredCredits.length} transaction{filteredCredits.length !== 1 ? 's' : ''}</span>
              {!creditsOpen && <span className="font-normal text-cyan-600 ml-3">{fmt(filteredCredits.reduce((s, t) => s + Math.abs(t.amount), 0))} credited</span>}
            </span>
            <span className="text-[9px] opacity-60 tracking-normal">{creditsOpen ? '▼ hide' : '▶ show'}</span>
          </div>
          {creditsOpen && <>
            <table className="w-full border-collapse table-fixed">{colgroup}{thead}<tbody>{filteredCredits.map((tx, i) => <TxRow key={i} tx={tx} creditStyle />)}</tbody></table>
            <div className="flex justify-between items-center text-[11px] py-2.5">
              <span className="text-muted-foreground">{filteredCredits.length} refund{filteredCredits.length !== 1 ? 's' : ''}</span>
              <span className="font-bold text-cyan-600">{fmt(filteredCredits.reduce((s, t) => s + Math.abs(t.amount), 0))} credited</span>
            </div>
          </>}
        </>
      )}

      {/* ── Legend ────────────────────────────────────────────────────────── */}
      <div className="text-muted-foreground text-[10px] py-2 flex gap-4">
        <span>
          <span className="border border-destructive rounded-[3px] px-0.5 text-[10px]">ABC</span>
          {' '}Low categorization confidence
        </span>
      </div>

      {/* ── Delete confirm modal ──────────────────────────────────────────── */}
      {pendingDelete && (
        <>
          <div className="fixed inset-0 bg-black/45 z-300" onClick={() => setPendingDelete(null)} />
          <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-background border border-border rounded-[10px] p-7 z-301 min-w-[320px] max-w-[90vw] shadow-2xl">
            <div className="text-xs font-bold tracking-[1px] uppercase text-muted-foreground mb-3">Delete Transaction</div>
            <div className="font-semibold text-sm mb-1">{pendingDelete.merchant}</div>
            <div className="text-xs text-muted-foreground mb-5">{pendingDelete.date} · {fmt(Math.abs(pendingDelete.amount))}</div>
            <div className="flex gap-2 justify-end">
              <Button variant="outline" size="sm" onClick={() => setPendingDelete(null)}>Cancel</Button>
              <Button variant="destructive" size="sm" onClick={() => { onDeleteTransaction(pendingDelete._id); setPendingDelete(null); }}>Delete</Button>
            </div>
          </div>
        </>
      )}
    </>
  );
}
