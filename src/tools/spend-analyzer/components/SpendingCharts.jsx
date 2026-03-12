import { useMemo } from "react";
import { useTheme } from "next-themes";
import {
  ComposedChart,
  Line,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { useCategories } from "../context/CategoriesContext";
import { fmt, fmtCat } from "../lib/format";

const MONTH_ABBR = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

const TOOLTIP_STYLE = {
  background: "var(--background)",
  border: "1px solid var(--border)",
  borderRadius: "6px",
  padding: "8px 12px",
  fontFamily: "Inter, sans-serif",
  fontSize: "11px",
  lineHeight: 1.8,
  boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
};

function BarTooltipContent({ active, payload }) {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  return (
    <div style={TOOLTIP_STYLE}>
      <div style={{ fontWeight: 700, color: "var(--foreground)" }}>
        {d.label}
      </div>
      <div style={{ color: "var(--foreground)" }}>Spend: {fmt(d.spend)}</div>
      {d.credits > 0 && (
        <div style={{ color: "#0891b2" }}>Credits: -{fmt(d.credits)}</div>
      )}
    </div>
  );
}

function DonutTooltipContent({ active, payload }) {
  if (!active || !payload?.length) return null;
  const d = payload[0];
  return (
    <div style={TOOLTIP_STYLE}>
      <div style={{ fontWeight: 700, color: d.payload.color }}>{d.name}</div>
      <div style={{ color: "var(--foreground)" }}>{fmt(d.value)}</div>
      <div style={{ color: "var(--muted-foreground)" }}>
        {d.payload.pct.toFixed(1)}%
      </div>
    </div>
  );
}

export default function SpendingCharts({ spending, credits, cats }) {
  const { getCatColor } = useCategories();
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";

  const monthlyData = useMemo(() => {
    const map = {};
    spending
      .filter((t) => !t.pending)
      .forEach((tx) => {
        if (!tx.date) return;
        const key = tx.date.substring(0, 7);
        if (!map[key]) map[key] = { spend: 0, credits: 0 };
        map[key].spend += tx.amount;
      });
    credits.forEach((tx) => {
      if (!tx.date) return;
      const key = tx.date.substring(0, 7);
      if (!map[key]) map[key] = { spend: 0, credits: 0 };
      map[key].credits += Math.abs(tx.amount);
    });
    return Object.entries(map)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, d]) => {
        const [y, m] = key.split("-");
        return {
          key,
          label: `${MONTH_ABBR[+m - 1]} '${y.slice(2)}`,
          spend: d.spend,
          credits: d.credits,
        };
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
  const showDonut = donutData.length >= 2;

  if (!showMonthly && !showDonut) return null;

  const tickStyle = {
    fontFamily: "Inter, sans-serif",
    fontSize: 10,
    fill: isDark ? "#9ca3af" : "#6b7280",
  };
  const fmtY = (v) =>
    v >= 1000 ? `$${(v / 1000).toFixed(0)}k` : `$${v.toFixed(0)}`;

  return (
    <div
      className={`grid gap-6 mb-7 ${showMonthly && showDonut ? "grid-cols-2" : "grid-cols-1"}`}
    >
      {/* ── Category donut ─────────────────────────────────────────────── */}
      {showDonut && (
        <div className="bg-card border border-border rounded-lg p-5">
          <div className="text-[11px] font-bold tracking-[1.5px] uppercase text-muted-foreground mb-3">
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
                {donutData.map((d) => (
                  <Cell key={d.key} fill={d.color} stroke="none" />
                ))}
              </Pie>
              <Tooltip
                content={<DonutTooltipContent />}
                isAnimationActive={false}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* ── Monthly line chart ──────────────────────────────────────────── */}
      {showMonthly && (
        <div className="bg-card border border-border rounded-lg p-5">
          <div className="flex items-baseline gap-3 mb-3">
            <div className="text-[11px] font-bold tracking-[1.5px] uppercase text-muted-foreground">
              Monthly Spend
            </div>
            <div className="text-[11px] text-muted-foreground">
              avg{" "}
              {fmt(
                monthlyData.reduce((s, d) => s + d.spend, 0) /
                  monthlyData.length,
              )}
              /mo
            </div>
          </div>
          <ResponsiveContainer width="100%" height={240}>
            <ComposedChart
              data={monthlyData}
              margin={{ top: 4, right: 8, bottom: 0, left: 0 }}
            >
              <defs>
                <linearGradient id="spendGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10d9a0" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#10d9a0" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis
                dataKey="label"
                tick={tickStyle}
                axisLine={false}
                tickLine={false}
                interval={monthlyData.length > 12 ? "preserveStartEnd" : 0}
              />
              <YAxis
                tickFormatter={fmtY}
                tick={tickStyle}
                axisLine={false}
                tickLine={false}
                width={44}
                domain={["dataMin - 100", "dataMax + 100"]}
              />
              <Tooltip
                content={<BarTooltipContent />}
                cursor={{
                  fill: isDark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.04)",
                }}
                isAnimationActive={false}
              />
              <Area
                type="monotone"
                dataKey="spend"
                stroke="none"
                fill="url(#spendGradient)"
                baseValue="dataMin"
              />
              <Line
                type="monotone"
                dataKey="spend"
                stroke="#10d9a0"
                strokeWidth={2}
                dot={{ fill: "#10d9a0", r: 3 }}
                activeDot={{ r: 5 }}
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
