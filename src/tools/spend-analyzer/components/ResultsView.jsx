import { useMemo, useState } from 'react';
import { useCategories } from '../context/CategoriesContext';
import { useAuth } from '../context/AuthContext';
import { fmt, fmtCat, fmtDetail, fmtShortDate } from '../lib/format';
import CategoryBreakdown from './CategoryBreakdown';
import SpendingCharts from './SpendingCharts';
import TransactionTable from './TransactionTable';
import TransactionModal from './TransactionModal';
import ImportToDbModal from './ImportToDbModal';
import { Button } from '@/components/ui/button';

export default function ResultsView({ allTransactions, onReCategorize, onDeleteTransaction, onBulkDelete, hideImport = false, hideExcluded = false, syncFiltersToURL = false }) {
  const { user } = useAuth();
  const { excludedKeys } = useCategories();
  const [modalTx, setModalTx] = useState(null);
  const [importModalOpen, setImportModalOpen] = useState(false);
  // catFilter is used to communicate category click → table, but table manages its own filter state
  // We use a key to reset the table when the user clicks a category
  const [tableFilterSignal, setTableFilterSignal] = useState(() => {
    if (!syncFiltersToURL) return null;
    const params = new URLSearchParams(window.location.search);
    const cat = params.get('cat') || '';
    const detail = params.get('detail') || '';
    return cat ? { cat, detail: detail || null, ts: 0 } : null;
  });
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
    if (syncFiltersToURL) {
      const url = new URL(window.location.href);
      if (cat) {
        url.searchParams.set('cat', cat);
        detail ? url.searchParams.set('detail', detail) : url.searchParams.delete('detail');
      } else {
        url.searchParams.delete('cat');
        url.searchParams.delete('detail');
      }
      window.history.replaceState(null, '', url.toString());
    }
  }

  return (
    <div>
      {/* ── Date range / totals bar ──────────────────────────────────────── */}
      <div className="flex justify-between items-baseline text-[11px] text-muted-foreground mb-4 -mt-2">
        {dateRange
          ? <span>Transaction date range: <span className="font-semibold text-foreground">{dateRange}</span></span>
          : <span />
        }
        <span>
          Total transactions analyzed:{' '}
          <span className="font-bold text-foreground">
            {pendingSpend.length + postedSpend.length + credits.length + excluded.length}
          </span>
        </span>
      </div>

      {/* ── Stat cards ───────────────────────────────────────────────────── */}
      <div className={`grid gap-4 mb-8 ${hideExcluded ? 'grid-cols-5' : 'grid-cols-6'}`}>
        <div className="bg-muted border border-border rounded-lg px-5 py-4.5">
          <div className="text-[10px] tracking-[1.5px] uppercase text-muted-foreground mb-2">Cards</div>
          <div className="text-[24px] font-extrabold text-primary">{cardSet.size}</div>
          <div className="text-[11px] text-muted-foreground mt-1">{[...cardSet].join(' · ')}</div>
        </div>
        <div className="bg-muted border border-border rounded-lg px-5 py-4.5">
          <div className="text-[10px] tracking-[1.5px] uppercase text-muted-foreground mb-2">Total Posted Spend</div>
          <div className="text-[24px] font-extrabold text-primary">{fmt(postedTotal)}</div>
          <div className="text-[11px] text-muted-foreground mt-1">{postedSpend.length} transactions</div>
        </div>
        <div className="bg-muted border border-border rounded-lg px-5 py-4.5">
          <div className="text-[10px] tracking-[1.5px] uppercase text-muted-foreground mb-2">Credits / Refunds</div>
          <div className="text-[24px] font-extrabold text-cyan-600">{fmt(totalCredits)}</div>
          <div className="text-[11px] text-muted-foreground mt-1">{credits.length} transaction{credits.length !== 1 ? 's' : ''}</div>
        </div>
        <div className="bg-muted border border-border rounded-lg px-5 py-4.5">
          <div className="text-[10px] tracking-[1.5px] uppercase text-muted-foreground mb-2">Total Net Spend</div>
          <div className="text-[24px] font-extrabold text-foreground">{fmt(postedTotal - totalCredits)}</div>
          <div className="text-[11px] text-muted-foreground mt-1">posted minus refunds</div>
        </div>
        <div className="bg-muted border border-border rounded-lg px-5 py-4.5">
          <div className="text-[10px] tracking-[1.5px] uppercase text-muted-foreground mb-2">Total Pending Spend</div>
          <div className="text-[24px] font-extrabold text-amber-600">{fmt(pendingTotal)}</div>
          <div className="text-[11px] text-muted-foreground mt-1">{pendingSpend.length} transactions</div>
        </div>
        {!hideExcluded && (
          <div className="bg-muted border border-border rounded-lg px-5 py-4.5">
            <div className="text-[10px] tracking-[1.5px] uppercase text-muted-foreground mb-2">Excluded Transactions</div>
            <div className="text-[24px] font-extrabold text-muted-foreground">{fmt(excluded.reduce((s, t) => s + Math.abs(t.amount), 0))}</div>
            <div className="text-[11px] text-muted-foreground mt-1">{excluded.length} transaction{excluded.length !== 1 ? 's' : ''}</div>
          </div>
        )}
      </div>

      {/* ── Save to Database button ──────────────────────────────────────── */}
      {user && !hideImport && (
        <div className="flex justify-end -mt-1 mb-5">
          <Button variant="outline" size="sm" onClick={() => setImportModalOpen(true)} className="text-[11px] font-bold">
            ↑ Save to Database
          </Button>
        </div>
      )}

      <SpendingCharts spending={spending} credits={credits} cats={cats} />

      <CategoryBreakdown
        cats={cats}
        maxCat={maxCat}
        grandTotal={grandTotal}
        spending={spending}
        credits={credits}
        pendingCount={pendingSpend.length}
        onFilter={handleCategoryFilter}
        showMonthlyAvg={!!user}
      />

      {/* ── Transactions heading ─────────────────────────────────────────── */}
      <div className="text-[11px] font-bold tracking-[2px] uppercase text-muted-foreground mb-3.5 pb-2.5 border-b border-border">
        Transactions
      </div>
      <TransactionTable
        key={tableFilterSignal ? `${tableFilterSignal.cat}-${tableFilterSignal.ts}` : 'initial'}
        spending={spending}
        credits={credits}
        categories={cats}
        initialCatFilter={tableFilterSignal?.cat || ''}
        initialDetailFilter={tableFilterSignal?.detail || ''}
        onOpenModal={setModalTx}
        onDeleteTransaction={onDeleteTransaction}
        onBulkDelete={onBulkDelete}
        onClearFilters={syncFiltersToURL ? () => {
          const url = new URL(window.location.href);
          url.searchParams.delete('cat');
          url.searchParams.delete('detail');
          window.history.replaceState(null, '', url.toString());
        } : undefined}
      />

      {modalTx && (
        <TransactionModal
          tx={modalTx}
          onClose={() => setModalTx(null)}
          onReCategorize={onReCategorize}
          onDelete={onDeleteTransaction}
        />
      )}

      {/* ── Excluded transactions ────────────────────────────────────────── */}
      {excluded.length > 0 && (
        <>
          <div
            onClick={() => setExcludedOpen(o => !o)}
            className={`text-[11px] font-bold tracking-[2px] uppercase text-muted-foreground mt-8 pb-2 border-b border-border cursor-pointer select-none flex justify-between items-center ${excludedOpen ? 'mb-2.5' : 'mb-0'}`}
          >
            <span>
              Excluded{' '}
              <span className="font-normal">{excluded.length} transaction{excluded.length !== 1 ? 's' : ''}</span>
              <span className="font-normal text-[10px] ml-2">— categories marked "excluded" in Settings</span>
              {!excludedOpen && <span className="font-normal text-foreground ml-3">{fmt(excluded.reduce((s, t) => s + Math.abs(t.amount), 0))} total</span>}
            </span>
            <span className="text-[9px] opacity-60 tracking-normal">{excludedOpen ? '▼ hide' : '▶ show'}</span>
          </div>
          {excludedOpen && <><table className="w-full border-collapse table-fixed">
            <colgroup>
              <col style={{ width: '100px' }} />
              <col style={{ width: '180px' }} />
              <col style={{ width: '160px' }} />
              <col style={{ width: '190px' }} />
              <col style={{ width: '110px' }} />
              <col style={{ width: '90px' }} />
            </colgroup>
            <thead>
              <tr>
                <th className="text-[10px] font-bold tracking-[1.5px] uppercase text-muted-foreground text-left px-3 py-2 border-b border-border whitespace-nowrap overflow-hidden">Date</th>
                <th className="text-[10px] font-bold tracking-[1.5px] uppercase text-muted-foreground text-left px-3 py-2 border-b border-border whitespace-nowrap overflow-hidden">Merchant</th>
                <th className="text-[10px] font-bold tracking-[1.5px] uppercase text-muted-foreground text-left px-3 py-2 border-b border-border whitespace-nowrap overflow-hidden">Category</th>
                <th className="text-[10px] font-bold tracking-[1.5px] uppercase text-muted-foreground text-left px-3 py-2 border-b border-border whitespace-nowrap overflow-hidden">Subcategory</th>
                <th className="text-[10px] font-bold tracking-[1.5px] uppercase text-muted-foreground text-left px-3 py-2 border-b border-border whitespace-nowrap overflow-hidden">Card</th>
                <th className="text-[10px] font-bold tracking-[1.5px] uppercase text-muted-foreground text-right px-3 py-2 border-b border-border whitespace-nowrap overflow-hidden">Amount</th>
              </tr>
            </thead>
            <tbody>
              {excluded.sort((a, b) => (a.date < b.date ? 1 : -1)).map((tx, i) => (
                <tr key={i} className="opacity-60 cursor-pointer even:bg-[#f7f8fa] dark:even:bg-white/3 group" onClick={() => setModalTx(tx)}>
                  <td className="px-3 py-1.5 border-b border-border align-middle overflow-hidden text-muted-foreground whitespace-nowrap text-xs group-hover:bg-black/2 dark:group-hover:bg-white/3">{tx.date}</td>
                  <td className="px-3 py-1.5 border-b border-border align-middle overflow-hidden font-medium group-hover:bg-black/2 dark:group-hover:bg-white/3" title={tx.merchant}>
                    <div className="flex items-center gap-2 min-w-0 w-full">
                      {(tx.logo_url || tx.cat_icon_url)
                        ? <img className="w-7.5 h-7.5 rounded object-contain shrink-0 bg-muted border border-border" src={tx.logo_url || tx.cat_icon_url} alt="" onError={e => e.target.removeAttribute('src')} />
                        : <span className="w-7.5 h-7.5 rounded shrink-0 inline-block bg-muted border border-border" />
                      }
                      <span className="overflow-hidden text-ellipsis whitespace-nowrap flex-1 min-w-0 text-xs">{tx.merchant}</span>
                      {tx.source === 'csv' && <span className="text-[9px] text-cyan-600 ml-1">CSV</span>}
                    </div>
                  </td>
                  <td className="px-3 py-1.5 border-b border-border align-middle overflow-hidden group-hover:bg-black/2 dark:group-hover:bg-white/3">
                    <span className="inline-block text-[10px] px-1.75 py-0.5 rounded-[3px] border whitespace-nowrap text-muted-foreground border-muted-foreground/40">{fmtCat(tx.cat)}</span>
                  </td>
                  <td className="px-3 py-1.5 border-b border-border align-middle overflow-hidden text-[11px] text-muted-foreground text-ellipsis whitespace-nowrap group-hover:bg-black/2 dark:group-hover:bg-white/3">
                    {tx.cat_detail ? fmtDetail(tx.cat_detail) : ''}
                  </td>
                  <td className="px-3 py-1.5 border-b border-border align-middle overflow-hidden text-muted-foreground text-[11px] text-ellipsis whitespace-nowrap group-hover:bg-black/2 dark:group-hover:bg-white/3">
                    {tx._card}
                  </td>
                  <td className="px-3 py-1.5 border-b border-border align-middle overflow-hidden text-right font-medium whitespace-nowrap text-muted-foreground group-hover:bg-black/2 dark:group-hover:bg-white/3">
                    {tx.amount < 0 ? `-${fmt(Math.abs(tx.amount))}` : fmt(tx.amount)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="flex justify-between items-center text-[11px] py-2.5 text-muted-foreground">
            <span>{excluded.length} excluded transaction{excluded.length !== 1 ? 's' : ''}</span>
            <span className="font-bold">{fmt(excluded.reduce((s, t) => s + Math.abs(t.amount), 0))} total</span>
          </div>
          </>}


</>
      )}

      {importModalOpen && (
        <ImportToDbModal
          spending={spending}
          credits={credits}
          onClose={() => setImportModalOpen(false)}
        />
      )}
    </div>
  );
}
