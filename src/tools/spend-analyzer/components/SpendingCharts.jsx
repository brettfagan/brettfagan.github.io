import { useMemo } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell,
} from 'recharts';
import { useCategories } from '../context/CategoriesContext';
import { fmt, fmtCat } from '../lib/format';

const MONTH_ABBR = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

const TOOLTIP_STYLE = {
  background: 'var(--bg)',
  border: '1px solid var(--border)',
  borderRadius: '6px',
  padding: '8px 12px',
  fontFamily: "'DM Mono', monospace",
  fontSize: '11px',
  lineHeight: 1.8,
  boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
};

function BarTooltipContent({ active, payload }) {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  return (
    <div style={TOOLTIP_STYLE}>
      <div style={{ fontWeight: 700, color: '#1a1b1e' }}>{d.label}</div>
      <div style={{ color: '#1a1b1e' }}>Spend: {fmt(d.spend)}</div>
      {d.credits > 0 && <div style={{ color: '#0891b2' }}>Credits: -{fmt(d.credits)}</div>}
    </div>
  );
}

function DonutTooltipContent({ active, payload }) {
  if (!active || !payload?.length) return null;
  const d = payload[0];
  return (
    <div style={TOOLTIP_STYLE}>
      <div style={{ fontWeight: 700, color: d.payload.color }}>{d.name}</div>
      <div style={{ color: '#1a1b1e' }}>{fmt(d.value)}</div>
      <div style={{ color: '#6b7280' }}>{d.payload.pct.toFixed(1)}%</div>
    </div>
  );
}

export default function SpendingCharts({ spending, credits, cats }) {
  const { getCatColor } = useCategories();

  const monthlyData = useMemo(() => {
    const map = {};
    spending.filter(t => !t.pending).forEach(tx => {
      if (!tx.date) return;
      const key = tx.date.substring(0, 7);
      if (!map[key]) map[key] = { spend: 0, credits: 0 };
      map[key].spend += tx.amount;
    });
    credits.forEach(tx => {
      if (!tx.date) return;
      const key = tx.date.substring(0, 7);
      if (!map[key]) map[key] = { spend: 0, credits: 0 };
      map[key].credits += Math.abs(tx.amount);
    });
    return Object.entries(map)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, d]) => {
        const [y, m] = key.split('-');
        return { key, label: `${MONTH_ABBR[+m - 1]} '${y.slice(2)}`, spend: d.spend, credits: d.credits };
      });
  }, [spending, credits]);

  const donutData = useMemo(() => {
    const posEntries = cats.filter(([, d]) => d.total > 0);
    const total = posEntries.reduce((s, [, d]) => s + d.total, 0) || 1;
    return posEntries.map(([cat, d]) => ({
      name: fmtCat(cat),
      key: cat,
      value: d.total,
      color: getCatColor(cat),
      pct: (d.total / total) * 100,
    }));
  }, [cats, getCatColor]);

  const showMonthly = monthlyData.length > 1;
  const showDonut   = donutData.length >= 2;

  if (!showMonthly && !showDonut) return null;

  const tickStyle = { fontFamily: "'DM Mono', monospace", fontSize: 10, fill: '#6b7280' };
  const fmtY = v => v >= 1000 ? `$${(v / 1000).toFixed(0)}k` : `$${v.toFixed(0)}`;
  const barSize = monthlyData.length <= 6 ? 28 : monthlyData.length <= 12 ? 18 : undefined;

  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: showMonthly && showDonut ? 'minmax(0,1fr) minmax(0,1fr)' : 'minmax(0,1fr)',
      gap: '24px',
      marginBottom: '28px',
    }}>

      {/* ── Category donut ─────────────────────────────────────────────── */}
      {showDonut && (
        <div>
          <div style={{ fontFamily: "'DM Mono',monospace", fontSize: '11px', fontWeight: 700, letterSpacing: '1.5px', textTransform: 'uppercase', color: '#6b7280', marginBottom: '12px' }}>
            Category Mix
          </div>
          <ResponsiveContainer width="100%" height={240}>
            <PieChart>
              <Pie
                data={donutData}
                cx="50%"
                cy="50%"
                innerRadius={58}
                outerRadius={90}
                paddingAngle={1}
                dataKey="value"
                startAngle={90}
                endAngle={-270}
              >
                {donutData.map(d => <Cell key={d.key} fill={d.color} stroke="none" />)}
              </Pie>
              <Tooltip content={<DonutTooltipContent />} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* ── Monthly bar chart ──────────────────────────────────────────── */}
      {showMonthly && (
        <div>
          <div style={{ fontFamily: "'DM Mono',monospace", fontSize: '11px', fontWeight: 700, letterSpacing: '1.5px', textTransform: 'uppercase', color: '#6b7280', marginBottom: '12px' }}>
            Monthly Spend
          </div>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart
              data={monthlyData}
              margin={{ top: 4, right: 8, bottom: 0, left: 0 }}
              barSize={barSize}
            >
              <XAxis
                dataKey="label"
                tick={tickStyle}
                axisLine={false}
                tickLine={false}
                interval={monthlyData.length > 12 ? 'preserveStartEnd' : 0}
              />
              <YAxis
                tickFormatter={fmtY}
                tick={tickStyle}
                axisLine={false}
                tickLine={false}
                width={44}
              />
              <Tooltip content={<BarTooltipContent />} cursor={{ fill: 'rgba(0,0,0,0.04)' }} />
              <Bar dataKey="spend" fill="#2563eb" radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

    </div>
  );
}
