import { useState, useMemo, useEffect } from 'react';
import { useCategories } from '../context/CategoriesContext';
import { fmt, fmtCat } from '../lib/format';
import { useDetailLabels } from '../context/DetailLabelsContext';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';

export default function TransactionTable({ spending, credits, categories, initialCatFilter = '', initialDetailFilter = '', onOpenModal, onDeleteTransaction, onBulkDelete, onClearFilters }) {
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
  const [selectedIds, setSelectedIds] = useState(() => new Set());
  const [bulkDeletePending, setBulkDeletePending] = useState(false);

  const showCheckboxes = !!onBulkDelete;

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

  // Selection helpers
  const allVisibleIds = useMemo(
    () => [...pending, ...posted, ...filteredCredits].map(tx => tx._id),
    [pending, posted, filteredCredits]
  );
  const allSelected = allVisibleIds.length > 0 && allVisibleIds.every(id => selectedIds.has(id));
  const someSelected = selectedIds.size > 0 && !allSelected;

  function toggleSelect(id) {
    setSelectedIds(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  function toggleSelectAll() {
    setSelectedIds(allSelected ? new Set() : new Set(allVisibleIds));
  }

  // Clear selection when filters change
  useEffect(() => { setSelectedIds(new Set()); }, [initialCatFilter, initialDetailFilter]);

  // ── Shared class strings ───────────────────────────────────────────────────
  const ctrlCls = "bg-muted border border-border rounded text-xs py-1.5 px-3 outline-none cursor-pointer text-foreground";
  const thCls   = "text-[10px] font-bold tracking-[1.5px] uppercase text-muted-foreground text-left px-3 py-2 border-b border-border cursor-pointer select-none whitespace-nowrap overflow-hidden hover:text-foreground";
  const tdCls   = "px-3 py-1.5 border-b border-border align-middle overflow-hidden group-hover:bg-black/2 dark:group-hover:bg-white/3";

  const colgroup = (
    <colgroup>
      {showCheckboxes && <col style={{ width: '36px' }} />}
      <col style={{ width: '100px' }} />
      <col style={{ width: '180px' }} />
      <col style={{ width: '160px' }} />
      <col style={{ width: '190px' }} />
      <col style={{ width: '90px' }} />
      <col style={{ width: '110px' }} />
      <col style={{ width: '90px' }} />
    </colgroup>
  );

  const thead = (
    <thead>
      <tr>
        {showCheckboxes && (
          <th className="px-3 py-2 border-b border-border">
            <input
              type="checkbox"
              checked={allSelected}
              ref={el => { if (el) el.indeterminate = someSelected; }}
              onChange={toggleSelectAll}
              className="cursor-pointer"
            />
          </th>
        )}
        <th className={thCls} onClick={() => handleSort('date')}>Date{sortArrow('date')}</th>
        <th className={thCls} onClick={() => handleSort('merchant')}>Merchant{sortArrow('merchant')}</th>
        <th className={thCls}>Category</th>
        <th className={thCls}>Subcategory</th>
        <th className={thCls}>Channel</th>
        <th className={thCls}>Card</th>
        <th className={`${thCls} text-right`} onClick={() => handleSort('amount')}>Amount{sortArrow('amount')}</th>
      </tr>
    </thead>
  );

  function TxRow({ tx, creditStyle }) {
    const color = getCatColor(tx.cat);
    return (
      <tr onClick={() => onOpenModal(tx)} className="cursor-pointer even:bg-[#f7f8fa] dark:even:bg-white/3 group">
        {showCheckboxes && (
          <td className={`${tdCls} text-center`}>
            <input
              type="checkbox"
              checked={selectedIds.has(tx._id)}
              onChange={() => toggleSelect(tx._id)}
              onClick={e => e.stopPropagation()}
              className="cursor-pointer"
            />
          </td>
        )}
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

      {/* ── Bulk action bar ───────────────────────────────────────────────── */}
      {showCheckboxes && selectedIds.size > 0 && (
        <div className="flex items-center gap-3 px-3 py-2.5 border border-border rounded-md bg-muted/40 mb-4">
          <span className="text-muted-foreground text-xs">{selectedIds.size} selected</span>
          <Button size="sm" variant="destructive" onClick={() => setBulkDeletePending(true)}>
            Delete Selected
          </Button>
          <Button
            size="sm"
            variant="ghost"
            className="text-xs text-muted-foreground"
            onClick={() => setSelectedIds(new Set())}
          >
            Clear
          </Button>
        </div>
      )}

      {/* ── Legend ────────────────────────────────────────────────────────── */}
      <div className="text-muted-foreground text-[10px] py-2 flex gap-4">
        <span>
          <span className="border border-destructive rounded-[3px] px-0.5 text-[10px]">ABC</span>
          {' '}Low categorization confidence
        </span>
      </div>

      {/* ── Bulk delete confirmation dialog ───────────────────────────────── */}
      <Dialog open={bulkDeletePending} onOpenChange={setBulkDeletePending}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete {selectedIds.size} transaction{selectedIds.size !== 1 ? 's' : ''}?</DialogTitle>
            <DialogDescription>This cannot be undone.</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setBulkDeletePending(false)}>Cancel</Button>
            <Button variant="destructive" onClick={async () => {
              await onBulkDelete([...selectedIds]);
              setSelectedIds(new Set());
              setBulkDeletePending(false);
            }}>Delete</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
