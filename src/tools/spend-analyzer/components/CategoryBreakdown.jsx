import { useMemo, useState } from "react";
import { useCategories } from "../context/CategoriesContext";
import { useDetailLabels } from "../context/DetailLabelsContext";
import { fmt, fmtCat } from "../lib/format";

export default function CategoryBreakdown({
  cats,
  maxCat,
  grandTotal,
  spending,
  credits,
  pendingCount,
  onFilter,
  showMonthlyAvg = false,
}) {
  const { getCatColor } = useCategories();
  const { getDetailLabel } = useDetailLabels();
  const [openCat, setOpenCat] = useState(null);

  const numMonths = useMemo(() => {
    const months = new Set(
      [...spending, ...credits].map(tx => tx.date?.slice(0, 7)).filter(Boolean)
    );
    return Math.max(months.size, 1);
  }, [spending, credits]);

  function handleCatClick(cat) {
    setOpenCat((prev) => (prev === cat ? null : cat));
    onFilter(cat);
  }

  return (
    <div className="mb-9">
      <div className="font-mono text-[11px] font-bold tracking-[2px] uppercase text-muted-foreground mb-3.5 pb-2.5 border-b border-border">
        Spending by Category
        {pendingCount > 0 && (
          <span className="font-normal text-[10px] tracking-normal text-amber-600">
            {" "}({pendingCount} pending transaction{pendingCount !== 1 ? "s" : ""} excluded)
          </span>
        )}
      </div>

      {cats.map(([cat, d]) => {
        const color = getCatColor(cat);
        const allTx = [...spending.filter((tx) => !tx.pending), ...credits];
        const subMap = {};
        allTx
          .filter((tx) => tx.cat === cat && tx.cat_detail)
          .forEach((tx) => {
            if (!subMap[tx.cat_detail])
              subMap[tx.cat_detail] = { total: 0, count: 0 };
            subMap[tx.cat_detail].total += tx.amount;
            subMap[tx.cat_detail].count++;
          });
        const subs = Object.entries(subMap).sort(
          (a, b) => b[1].total - a[1].total,
        );
        const isOpen = openCat === cat;

        const catCreditAbs = Math.abs(
          credits
            .filter((tx) => tx.cat === cat)
            .reduce((s, tx) => s + tx.amount, 0),
        );

        return (
          <div key={cat}>
            <div
              className={`grid ${showMonthlyAvg ? 'grid-cols-[200px_1fr_80px_90px_80px]' : 'grid-cols-[200px_1fr_90px_80px]'} items-center gap-4 py-2.5 border-b border-border cursor-pointer rounded transition-colors hover:bg-black/2.5 dark:hover:bg-white/4 hover:px-2 hover:-mx-2`}
              onClick={() => handleCatClick(cat)}
            >
              <div className="font-mono text-xs font-semibold whitespace-nowrap overflow-hidden text-ellipsis" style={{ color }}>
                {fmtCat(cat)}
                {subs.length > 0 && (
                  <span className="text-[9px] opacity-60"> {isOpen ? "▼" : "▶"}</span>
                )}
              </div>
              <div className="bg-muted rounded-sm h-1.5 overflow-hidden">
                <div
                  className="h-full rounded-sm transition-[width] duration-600 ease-[cubic-bezier(0.16,1,0.3,1)]"
                  style={{
                    width: `${((Math.abs(d.total) / maxCat) * 100).toFixed(1)}%`,
                    background: color,
                  }}
                />
              </div>
              {showMonthlyAvg && (
                <div className="text-right font-medium">
                  {fmt(d.total / numMonths)}<span className="text-[9px] font-normal text-muted-foreground">/mo</span>
                </div>
              )}
              <div className={`text-right ${showMonthlyAvg ? 'text-muted-foreground text-[11px]' : 'font-medium'}`}>
                {fmt(d.total)}
                {catCreditAbs > 0 && (
                  <div className="text-[9px] text-cyan-600 font-normal">
                    -{fmt(catCreditAbs)} refund{catCreditAbs !== 1 ? "s" : ""}
                  </div>
                )}
              </div>
              <div className="text-right text-muted-foreground text-[11px]">
                {d.count} txn{d.count !== 1 ? "s" : ""}
              </div>
            </div>

            <div className={`overflow-hidden transition-[max-height] duration-350 ease-in-out ${isOpen ? 'max-h-150' : 'max-h-0'}`}>
              {subs.map(([detail, sd]) => (
                <div
                  key={detail}
                  className={`grid ${showMonthlyAvg ? 'grid-cols-[200px_1fr_80px_90px_80px]' : 'grid-cols-[200px_1fr_90px_80px]'} items-center gap-4 py-1.5 pl-4 border-b border-border cursor-pointer hover:bg-black/2.5 dark:hover:bg-white/4`}
                  onClick={(e) => {
                    e.stopPropagation();
                    onFilter(cat, detail);
                  }}
                >
                  <div className="font-mono text-[11px] font-medium text-muted-foreground whitespace-nowrap overflow-hidden text-ellipsis">
                    {getDetailLabel(detail)}
                  </div>
                  <div className="bg-muted rounded-sm h-1.5 overflow-hidden">
                    <div
                      className="h-full rounded-sm transition-[width] duration-600 ease-[cubic-bezier(0.16,1,0.3,1)]"
                      style={{
                        width: `${((Math.abs(sd.total) / Math.abs(maxCat)) * 100).toFixed(1)}%`,
                        background: color,
                        opacity: 0.6,
                      }}
                    />
                  </div>
                  {showMonthlyAvg && (
                    <div className="font-mono text-[11px] font-semibold text-right" style={{ color }}>
                      {fmt(sd.total / numMonths)}<span className="text-[9px] font-normal text-muted-foreground">/mo</span>
                    </div>
                  )}
                  <div className={`text-right ${showMonthlyAvg ? 'text-muted-foreground text-[11px]' : 'font-mono text-[11px] font-semibold'}`} style={showMonthlyAvg ? undefined : { color }}>
                    {fmt(sd.total)}
                  </div>
                  <div className="text-[10px] text-muted-foreground text-right">
                    {sd.count} txn{sd.count !== 1 ? "s" : ""}
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      })}

      <div className={`grid ${showMonthlyAvg ? 'grid-cols-[200px_1fr_80px_90px_80px]' : 'grid-cols-[200px_1fr_90px_80px]'} items-center gap-4 py-3 border-t-2 border-border`}>
        <div className="font-mono text-xs font-bold">Total</div>
        <div />
        {showMonthlyAvg && (
          <div className="text-right font-mono text-[13px] font-extrabold">
            {fmt(grandTotal / numMonths)}<span className="text-[10px] font-normal text-muted-foreground">/mo</span>
          </div>
        )}
        <div className={`text-right ${showMonthlyAvg ? 'text-muted-foreground text-[11px]' : 'font-mono text-[13px] font-extrabold'}`}>{fmt(grandTotal)}</div>
        <div className="text-right text-muted-foreground text-[11px]">
          {spending.filter((t) => !t.pending).length} posted · {credits.length} refund{credits.length !== 1 ? "s" : ""}
        </div>
      </div>
    </div>
  );
}
