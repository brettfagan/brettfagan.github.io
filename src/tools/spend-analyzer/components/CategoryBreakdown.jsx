import { useState } from 'react';
import { CAT_COLORS } from '../lib/constants';
import { fmt, fmtCat, fmtDetail } from '../lib/format';

export default function CategoryBreakdown({ cats, maxCat, grandTotal, spending, credits, pendingCount, onFilter }) {
  const [openCat, setOpenCat] = useState(null);

  function handleCatClick(cat) {
    setOpenCat(prev => prev === cat ? null : cat);
    onFilter(cat);
  }

  return (
    <div className="categories">
      <div className="section-title">
        Spending by Category — posted only · click to filter
        {pendingCount > 0 && (
          <span style={{ fontWeight: 400, fontSize: '10px', color: 'var(--warn)', letterSpacing: 0 }}>
            {' '}({pendingCount} pending transaction{pendingCount !== 1 ? 's' : ''} excluded)
          </span>
        )}
      </div>

      {cats.map(([cat, d]) => {
        const color = CAT_COLORS[cat] || '#6b6b75';
        const allTx = [...spending.filter(tx => !tx.pending), ...credits];
        const subMap = {};
        allTx.filter(tx => tx.cat === cat && tx.cat_detail).forEach(tx => {
          if (!subMap[tx.cat_detail]) subMap[tx.cat_detail] = { total: 0, count: 0 };
          subMap[tx.cat_detail].total += tx.amount;
          subMap[tx.cat_detail].count++;
        });
        const subs = Object.entries(subMap).sort((a, b) => b[1].total - a[1].total);
        const isOpen = openCat === cat;

        return (
          <div key={cat}>
            <div className="category-row" onClick={() => handleCatClick(cat)}>
              <div className="cat-name" style={{ color }}>
                {fmtCat(cat)}
                {subs.length > 0 && <span style={{ fontSize: '9px', opacity: 0.6 }}> {isOpen ? '▼' : '▶'}</span>}
              </div>
              <div className="cat-bar-wrap">
                <div className="cat-bar" style={{ width: `${(d.total / maxCat * 100).toFixed(1)}%`, background: color }} />
              </div>
              <div className="cat-total">{fmt(d.total)}</div>
              <div className="cat-count">{d.count} txn{d.count !== 1 ? 's' : ''}</div>
            </div>

            <div className={`subcat-panel${isOpen ? ' open' : ''}`}>
              {subs.map(([detail, sd]) => (
                <div key={detail} className="subcat-row" onClick={e => { e.stopPropagation(); onFilter(cat, detail); }}>
                  <div className="subcat-name">{fmtDetail(detail)}</div>
                  <div className="cat-bar-wrap">
                    <div className="cat-bar" style={{ width: `${(Math.abs(sd.total) / Math.abs(maxCat) * 100).toFixed(1)}%`, background: color, opacity: 0.6 }} />
                  </div>
                  <div className="subcat-total" style={{ color }}>{fmt(sd.total)}</div>
                  <div className="subcat-count">{sd.count} txn{sd.count !== 1 ? 's' : ''}</div>
                </div>
              ))}
            </div>
          </div>
        );
      })}

      <div style={{ display: 'grid', gridTemplateColumns: '200px 1fr 90px 80px', alignItems: 'center', gap: '16px', padding: '12px 0', borderTop: '2px solid var(--border)' }}>
        <div style={{ fontFamily: "'DM Mono',monospace", fontSize: '12px', fontWeight: 700 }}>Total</div>
        <div />
        <div style={{ textAlign: 'right', fontFamily: "'DM Mono',monospace", fontSize: '13px', fontWeight: 800 }}>{fmt(grandTotal)}</div>
        <div style={{ textAlign: 'right', color: 'var(--muted)', fontSize: '11px' }}>
          {spending.filter(t => !t.pending).length + credits.length} txns
        </div>
      </div>
    </div>
  );
}
