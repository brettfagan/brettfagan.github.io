import { useEffect, useRef, useState } from 'react';
import { motion, useInView } from 'motion/react';

// ── Page design tokens (light theme) ─────────────────────────────────────────
const T = {
  bg:           '#f0f5fb',
  bgCard:       '#ffffff',
  border:       '#dce4f0',
  borderHov:    'rgba(12,189,138,0.38)',
  jade:         '#0cbd8a',
  jadeDim:      '#0aaa7a',
  text:         '#0e1829',
  textMuted:    '#637389',
  textDim:      '#374151',
  cardShadow:   '0 1px 3px rgba(14,24,41,0.06), 0 4px 16px rgba(14,24,41,0.04)',
  cardHoverShadow: '0 8px 32px rgba(14,24,41,0.12)',
};

// ── Mockup tokens — always dark (represents the real app UI) ──────────────────
const M = {
  bg:       '#080a10',
  bgInner:  '#101318',
  bgRow:    '#0f1118',
  border:   '#1d2233',
  jade:     '#10d9a0',
  text:     '#e4eaf4',
  textMuted:'#5e6e8a',
  textDim:  '#8a9ab5',
};

// Category colors matching the real app
const C = {
  food:      '#059669',
  transport: '#0891b2',
  rent:      '#d97706',
  shopping:  '#7c3aed',
  entertain: '#2563eb',
  other:     '#6b7280',
};

// ── Animation variants ────────────────────────────────────────────────────────
const fadeUp = {
  hidden:  { opacity: 0, y: 22 },
  visible: (delay = 0) => ({
    opacity: 1, y: 0,
    transition: { duration: 0.56, ease: [0.22, 1, 0.36, 1], delay },
  }),
};

const staggerContainer = (stagger = 0.09, delay = 0) => ({
  hidden:  {},
  visible: { transition: { staggerChildren: stagger, delayChildren: delay } },
});

// ── Pill label ────────────────────────────────────────────────────────────────
function Pill({ children }) {
  return (
    <div style={{
      display: 'inline-flex', alignItems: 'center', gap: '7px',
      background: `${T.jade}14`, border: `1px solid ${T.jade}30`,
      borderRadius: '100px', padding: '4px 14px', marginBottom: '18px',
    }}>
      <span style={{ width: 5, height: 5, borderRadius: '50%', background: T.jade, display: 'block', flexShrink: 0 }} />
      <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '12px', color: T.jade, letterSpacing: '0.05em', fontWeight: 500 }}>
        {children}
      </span>
    </div>
  );
}

// ── Hero Dashboard Mockup (always dark — represents the real app) ─────────────
function HeroDashboard() {
  const txns = [
    { name: 'Whole Foods Market', cat: 'Groceries',     color: C.food,      amt: '−$86.42',  date: 'Mar 8' },
    { name: 'Uber',               cat: 'Rideshare',     color: C.transport, amt: '−$18.50',  date: 'Mar 7' },
    { name: 'Netflix',            cat: 'Entertainment', color: C.entertain, amt: '−$15.99',  date: 'Mar 7' },
    { name: 'Con Edison',         cat: 'Utilities',     color: C.rent,      amt: '−$124.00', date: 'Mar 6' },
    { name: 'Amazon.com',         cat: 'Shopping',      color: C.shopping,  amt: '−$47.99',  date: 'Mar 5' },
  ];

  const legend = [
    { label: 'Food & Drink',     color: C.food,      pct: 28, amt: '$797' },
    { label: 'Rent & Utilities', color: C.rent,      pct: 24, amt: '$683' },
    { label: 'Shopping',         color: C.shopping,  pct: 16, amt: '$455' },
    { label: 'Transport',        color: C.transport, pct: 12, amt: '$341' },
    { label: 'Other',            color: C.other,     pct: 20, amt: '$571' },
  ];

  return (
    <div style={{
      background: M.bg,
      border: `1px solid ${M.border}`,
      borderRadius: '14px',
      overflow: 'hidden',
      boxShadow: '0 24px 64px rgba(14,24,41,0.18), 0 4px 16px rgba(14,24,41,0.10)',
      width: '100%',
      maxWidth: '540px',
    }}>
      {/* Window chrome */}
      <div style={{ padding: '10px 14px', background: '#0a0c13', borderBottom: `1px solid ${M.border}`, display: 'flex', alignItems: 'center', gap: '6px' }}>
        <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#ff5f57', display: 'block' }} />
        <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#febc2e', display: 'block' }} />
        <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#28c840', display: 'block' }} />
        <div style={{ flex: 1, display: 'flex', justifyContent: 'center' }}>
          <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '11px', color: M.textMuted }}>spend-analyzer · March 2025</span>
        </div>
        <div style={{ width: 60 }} />
      </div>

      {/* Tab bar */}
      <div style={{ padding: '0 16px', background: '#0b0d14', borderBottom: `1px solid ${M.border}`, display: 'flex', alignItems: 'center', gap: '4px' }}>
        {['Analyzer', 'My Spending', 'My Budget'].map((tab, i) => (
          <span key={tab} style={{
            fontFamily: "'DM Sans', sans-serif", fontSize: '12px', padding: '9px 12px',
            color: i === 0 ? M.jade : M.textMuted,
            borderBottom: i === 0 ? `2px solid ${M.jade}` : '2px solid transparent',
            cursor: 'default', whiteSpace: 'nowrap',
          }}>
            {tab}
          </span>
        ))}
      </div>

      {/* Body */}
      <div style={{ padding: '14px' }}>
        {/* Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px', marginBottom: '14px' }}>
          {[
            { label: 'Total Spent', value: '$2,847' },
            { label: 'Transactions', value: '142' },
            { label: 'Categories', value: '8' },
          ].map(s => (
            <div key={s.label} style={{ background: M.bgInner, border: `1px solid ${M.border}`, borderRadius: '8px', padding: '9px 11px' }}>
              <div style={{ fontSize: '10px', color: M.textMuted, fontFamily: "'DM Sans', sans-serif", marginBottom: '3px' }}>{s.label}</div>
              <div style={{ fontSize: '17px', fontWeight: 700, color: M.text, fontFamily: "'Raleway', sans-serif", letterSpacing: '-0.02em' }}>{s.value}</div>
            </div>
          ))}
        </div>

        {/* Chart + legend */}
        <div style={{ display: 'flex', gap: '14px', alignItems: 'center', marginBottom: '14px' }}>
          <div style={{ position: 'relative', width: '88px', height: '88px', flexShrink: 0 }}>
            <div style={{
              width: '88px', height: '88px', borderRadius: '50%',
              background: `conic-gradient(${C.food} 0% 28%, ${C.rent} 28% 52%, ${C.shopping} 52% 68%, ${C.transport} 68% 80%, ${C.other} 80% 100%)`,
              mask: 'radial-gradient(transparent 54%, black 54%)',
              WebkitMask: 'radial-gradient(transparent 54%, black 54%)',
            }} />
            <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
              <div style={{ fontSize: '13px', fontWeight: 700, color: M.text, fontFamily: "'Raleway', sans-serif", letterSpacing: '-0.02em' }}>$2,847</div>
              <div style={{ fontSize: '9px', color: M.textMuted, fontFamily: "'DM Sans', sans-serif" }}>total</div>
            </div>
          </div>
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '5px' }}>
            {legend.map(l => (
              <div key={l.label} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ width: 7, height: 7, borderRadius: '2px', background: l.color, flexShrink: 0 }} />
                <span style={{ flex: 1, fontSize: '10px', color: M.textDim, fontFamily: "'DM Sans', sans-serif" }}>{l.label}</span>
                <div style={{ width: `${l.pct * 1.1}px`, height: '3px', background: l.color, borderRadius: '2px', opacity: 0.7 }} />
                <span style={{ fontSize: '10px', fontWeight: 600, color: M.text, fontFamily: "'DM Sans', sans-serif", minWidth: '34px', textAlign: 'right' }}>{l.amt}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Transaction table */}
        <div style={{ border: `1px solid ${M.border}`, borderRadius: '8px', overflow: 'hidden' }}>
          <div style={{ display: 'flex', alignItems: 'center', padding: '5px 10px', background: M.bgRow, borderBottom: `1px solid ${M.border}` }}>
            <span style={{ flex: 1, fontSize: '9px', color: M.textMuted, fontFamily: "'DM Sans', sans-serif", letterSpacing: '0.08em', textTransform: 'uppercase' }}>Merchant</span>
            <span style={{ fontSize: '9px', color: M.textMuted, fontFamily: "'DM Sans', sans-serif", letterSpacing: '0.08em', textTransform: 'uppercase', marginRight: '48px' }}>Category</span>
            <span style={{ fontSize: '9px', color: M.textMuted, fontFamily: "'DM Sans', sans-serif", letterSpacing: '0.08em', textTransform: 'uppercase', minWidth: '44px', textAlign: 'right' }}>Amount</span>
          </div>
          {txns.map((t, i) => (
            <div key={i} style={{
              display: 'flex', alignItems: 'center', gap: '8px', padding: '6px 10px',
              borderBottom: i < txns.length - 1 ? `1px solid ${M.border}` : 'none',
              background: i % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.01)',
            }}>
              <span style={{ width: 5, height: 5, borderRadius: '50%', background: t.color, flexShrink: 0 }} />
              <span style={{ flex: 1, fontSize: '11px', color: M.text, fontFamily: "'DM Sans', sans-serif", whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{t.name}</span>
              <span style={{ fontSize: '9px', color: t.color, background: `${t.color}18`, padding: '2px 7px', borderRadius: '4px', fontFamily: "'DM Sans', sans-serif", flexShrink: 0, whiteSpace: 'nowrap' }}>{t.cat}</span>
              <span style={{ fontSize: '11px', color: M.text, fontFamily: "'DM Sans', sans-serif", flexShrink: 0, minWidth: '50px', textAlign: 'right' }}>{t.amt}</span>
              <span style={{ fontSize: '9px', color: M.textMuted, fontFamily: "'DM Sans', sans-serif", flexShrink: 0, minWidth: '28px', textAlign: 'right' }}>{t.date}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Feature mini-mockups (always dark) ───────────────────────────────────────
function CategorizationMockup() {
  return (
    <div style={{ padding: '11px', background: M.bg, borderRadius: '7px', border: `1px solid ${M.border}` }}>
      {[
        { name: 'Chipotle Mexican Grill', cat: 'Fast Food', color: C.food,     amt: '−$14.75' },
        { name: 'Amazon.com',             cat: 'Shopping',  color: C.shopping, amt: '−$49.99' },
        { name: 'Whole Foods Market',     cat: 'Groceries', color: C.food,     amt: '−$92.10' },
      ].map((t, i) => (
        <div key={i} style={{
          display: 'flex', alignItems: 'center', gap: '7px',
          paddingTop: i > 0 ? '8px' : 0, marginTop: i > 0 ? '8px' : 0,
          borderTop: i > 0 ? `1px solid ${M.border}` : 'none',
        }}>
          <span style={{ width: 6, height: 6, borderRadius: '50%', background: t.color, flexShrink: 0 }} />
          <span style={{ flex: 1, fontSize: '10px', color: M.text, fontFamily: "'DM Sans', sans-serif", whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{t.name}</span>
          <span style={{ fontSize: '9px', color: t.color, background: `${t.color}18`, padding: '1px 7px', borderRadius: '4px', fontFamily: "'DM Sans', sans-serif", flexShrink: 0 }}>{t.cat}</span>
          <span style={{ fontSize: '10px', color: M.text, fontFamily: "'DM Sans', sans-serif", flexShrink: 0 }}>{t.amt}</span>
        </div>
      ))}
    </div>
  );
}

function ChartMockup() {
  const slices = [
    { l: 'Food',      c: C.food,      p: 28, bar: 80 },
    { l: 'Rent',      c: C.rent,      p: 24, bar: 68 },
    { l: 'Shopping',  c: C.shopping,  p: 16, bar: 46 },
    { l: 'Transport', c: C.transport, p: 12, bar: 34 },
  ];
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '14px', padding: '11px', background: M.bg, borderRadius: '7px', border: `1px solid ${M.border}` }}>
      <div style={{ position: 'relative', width: '64px', height: '64px', flexShrink: 0 }}>
        <div style={{
          width: '64px', height: '64px', borderRadius: '50%',
          background: `conic-gradient(${C.food} 0% 28%, ${C.rent} 28% 52%, ${C.shopping} 52% 68%, ${C.transport} 68% 80%, ${C.other} 80% 100%)`,
          mask: 'radial-gradient(transparent 52%, black 52%)',
          WebkitMask: 'radial-gradient(transparent 52%, black 52%)',
        }} />
        <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ fontSize: '9px', color: M.textMuted, fontFamily: "'DM Sans', sans-serif", textAlign: 'center' }}>Mar<br />2025</div>
        </div>
      </div>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '6px' }}>
        {slices.map(s => (
          <div key={s.l} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ width: 6, height: 6, borderRadius: '1px', background: s.c, flexShrink: 0 }} />
            <span style={{ width: '52px', fontSize: '10px', color: M.textDim, fontFamily: "'DM Sans', sans-serif" }}>{s.l}</span>
            <div style={{ flex: 1, height: '4px', background: M.border, borderRadius: '2px', overflow: 'hidden' }}>
              <div style={{ height: '100%', width: `${s.bar}%`, background: s.c, borderRadius: '2px' }} />
            </div>
            <span style={{ fontSize: '9px', color: M.textMuted, fontFamily: "'DM Sans', sans-serif", minWidth: '22px', textAlign: 'right' }}>{s.p}%</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function BudgetMockup() {
  const items = [
    { label: 'Food & Drink', color: C.food,      spent: 280, budget: 400 },
    { label: 'Shopping',     color: C.shopping,  spent: 390, budget: 300 },
    { label: 'Transport',    color: C.transport, spent: 95,  budget: 200 },
  ];
  return (
    <div style={{ padding: '11px', background: M.bg, borderRadius: '7px', border: `1px solid ${M.border}`, display: 'flex', flexDirection: 'column', gap: '10px' }}>
      {items.map(item => {
        const pct = Math.min(100, (item.spent / item.budget) * 100);
        const over = item.spent > item.budget;
        return (
          <div key={item.label}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
              <span style={{ fontSize: '10px', color: M.textDim, fontFamily: "'DM Sans', sans-serif" }}>{item.label}</span>
              <span style={{ fontSize: '10px', fontFamily: "'DM Sans', sans-serif", color: over ? '#ef4444' : M.textMuted }}>
                ${item.spent} <span style={{ color: M.textMuted }}>/ ${item.budget}</span>
              </span>
            </div>
            <div style={{ height: '5px', background: '#1a2030', borderRadius: '3px', overflow: 'hidden' }}>
              <div style={{ height: '100%', width: `${pct}%`, background: over ? '#ef4444' : item.color, borderRadius: '3px' }} />
            </div>
          </div>
        );
      })}
    </div>
  );
}

function ConnectionsMockup() {
  return (
    <div style={{ display: 'flex', gap: '8px', padding: '11px', background: M.bg, borderRadius: '7px', border: `1px solid ${M.border}` }}>
      {[
        { label: 'Connect Bank', sub: 'via Plaid', icon: '🏦', active: true },
        { label: 'Upload CSV',   sub: 'any card',  icon: '📄', active: false },
      ].map(c => (
        <div key={c.label} style={{
          flex: 1, padding: '10px 8px', textAlign: 'center',
          background: c.active ? `${M.jade}0c` : M.bgInner,
          border: `1px solid ${c.active ? `${M.jade}28` : M.border}`,
          borderRadius: '8px', cursor: 'default',
        }}>
          <div style={{ fontSize: '18px', marginBottom: '5px' }}>{c.icon}</div>
          <div style={{ fontSize: '10px', fontWeight: 600, color: c.active ? M.jade : M.text, fontFamily: "'DM Sans', sans-serif" }}>{c.label}</div>
          <div style={{ fontSize: '9px', color: M.textMuted, fontFamily: "'DM Sans', sans-serif", marginTop: '1px' }}>{c.sub}</div>
        </div>
      ))}
    </div>
  );
}

function SharingMockup() {
  return (
    <div style={{ padding: '14px 11px', background: M.bg, borderRadius: '7px', border: `1px solid ${M.border}`, display: 'flex', alignItems: 'center', gap: '12px' }}>
      <div style={{ width: 38, height: 38, borderRadius: '50%', background: 'linear-gradient(135deg, #3b82f6, #1d4ed8)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px', fontWeight: 600, color: '#fff', fontFamily: "'DM Sans', sans-serif", flexShrink: 0 }}>B</div>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '3px' }}>
        <div style={{ height: '1px', background: `linear-gradient(90deg, ${M.jade}60, ${M.jade}20)` }} />
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <span style={{ fontSize: '11px', color: M.jade, fontFamily: "'DM Sans', sans-serif" }}>read-only →</span>
        </div>
        <div style={{ height: '1px', background: `linear-gradient(90deg, ${M.jade}20, ${M.jade}60)` }} />
      </div>
      <div style={{ width: 38, height: 38, borderRadius: '50%', background: 'linear-gradient(135deg, #ec4899, #be185d)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px', fontWeight: 600, color: '#fff', fontFamily: "'DM Sans', sans-serif", flexShrink: 0 }}>S</div>
    </div>
  );
}

function MultiCardMockup() {
  const cards = [
    { name: 'Chase Sapphire', color1: '#0f2b6b', color2: '#1a3d8a' },
    { name: 'Amex Gold',      color1: '#6b3a10', color2: '#8c4d18' },
    { name: 'Fidelity Visa',  color1: '#0d2945', color2: '#163d68' },
  ];
  return (
    <div style={{ padding: '11px', background: M.bg, borderRadius: '7px', border: `1px solid ${M.border}`, position: 'relative', height: '72px', overflow: 'hidden' }}>
      {cards.map((c, i) => (
        <div key={c.name} style={{
          position: 'absolute', left: 11 + i * 18, top: 11 + i * 9,
          width: '108px', height: '60px',
          background: `linear-gradient(135deg, ${c.color1}, ${c.color2})`,
          borderRadius: '7px', border: '1px solid rgba(255,255,255,0.08)',
          boxShadow: '0 4px 12px rgba(0,0,0,0.5)', zIndex: 3 - i,
          display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', padding: '7px 9px',
        }}>
          <div style={{ fontSize: '7px', color: 'rgba(255,255,255,0.5)', fontFamily: "'DM Sans', sans-serif", letterSpacing: '0.03em' }}>{c.name}</div>
          <div style={{ fontSize: '8px', color: 'rgba(255,255,255,0.35)', fontFamily: "'DM Sans', sans-serif", marginTop: '2px' }}>•••• {4000 + i * 1234}</div>
        </div>
      ))}
    </div>
  );
}

// ── Features data ─────────────────────────────────────────────────────────────
const FEATURES = [
  { icon: '⚡', title: 'Smart Categorization', desc: 'Transactions are categorized automatically by merchant name. Add custom regex rules to fine-tune any edge case.', Mockup: CategorizationMockup },
  { icon: '📊', title: 'Spending Charts',       desc: 'Visual breakdowns by category — donut chart, bar totals, subcategory drill-down. See where money actually goes.', Mockup: ChartMockup },
  { icon: '🎯', title: 'Budget Tracking',       desc: 'Set monthly budgets per category. Remaining amounts update live as you import new transactions.', Mockup: BudgetMockup },
  { icon: '🔗', title: 'Flexible Connections',  desc: 'Connect your bank directly via Plaid for auto-sync, or upload CSV exports from any card issuer.', Mockup: ConnectionsMockup },
  { icon: '👥', title: 'Partner Sharing',       desc: 'Invite a partner with read-only access. Great for couples who want shared financial visibility without shared logins.', Mockup: SharingMockup },
  { icon: '💳', title: 'Multi-Card Support',    desc: 'Track Fidelity, Barclays, Chase, Verizon, and more — all in a single unified spending view.', Mockup: MultiCardMockup },
];

// ── Nav ───────────────────────────────────────────────────────────────────────
function Nav() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <motion.nav
      initial={{ opacity: 0, y: -14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.42, ease: [0.22, 1, 0.36, 1] }}
      style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100,
        backdropFilter: scrolled ? 'blur(18px) saturate(1.5)' : 'none',
        background: scrolled ? 'rgba(240,245,251,0.90)' : 'transparent',
        borderBottom: `1px solid ${scrolled ? T.border : 'transparent'}`,
        transition: 'background 0.3s ease, border-color 0.3s ease',
      }}
    >
      <div style={{ maxWidth: '1120px', margin: '0 auto', padding: '0 28px', height: '62px', display: 'flex', alignItems: 'center', gap: '32px' }}>
        <div style={{ flex: 1 }} />

        <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
          {[['#features', 'Features'], ['#how-it-works', 'How It Works']].map(([href, label]) => (
            <a key={label} href={href} style={{
              fontFamily: "'DM Sans', sans-serif", fontSize: '14px', fontWeight: 400,
              color: T.textMuted, textDecoration: 'none', transition: 'color 0.18s',
            }}
            onMouseEnter={e => { e.target.style.color = T.text; }}
            onMouseLeave={e => { e.target.style.color = T.textMuted; }}>
              {label}
            </a>
          ))}
          <a href="/tools/spend-analyzer/" style={{
            fontFamily: "'DM Sans', sans-serif", fontSize: '13px', fontWeight: 600,
            color: '#ffffff', background: T.jade, padding: '8px 20px',
            borderRadius: '8px', textDecoration: 'none', transition: 'background 0.18s, transform 0.18s',
          }}
          onMouseEnter={e => { e.currentTarget.style.background = T.jadeDim; e.currentTarget.style.transform = 'translateY(-1px)'; }}
          onMouseLeave={e => { e.currentTarget.style.background = T.jade; e.currentTarget.style.transform = 'translateY(0)'; }}>
            Get Started
          </a>
        </div>
      </div>
    </motion.nav>
  );
}

// ── Hero ──────────────────────────────────────────────────────────────────────
function Hero() {
  return (
    <section id="top" style={{ paddingTop: '132px', paddingBottom: '96px', position: 'relative', overflow: 'hidden' }}>
      <div style={{ position: 'absolute', top: '-60px', right: '-40px', width: '560px', height: '560px', background: `radial-gradient(ellipse at center, ${T.jade}0e 0%, transparent 62%)`, pointerEvents: 'none' }} />
      <div style={{ position: 'absolute', bottom: '-100px', left: '-80px', width: '440px', height: '440px', background: 'radial-gradient(ellipse at center, rgba(37,99,235,0.06) 0%, transparent 62%)', pointerEvents: 'none' }} />

      <div className="hero-layout" style={{ maxWidth: '1120px', margin: '0 auto', padding: '0 28px', display: 'flex', alignItems: 'center', gap: '56px', flexWrap: 'wrap' }}>
        {/* Left */}
        <div className="hero-left" style={{ flex: '1 1 300px', maxWidth: '460px' }}>
          <motion.div custom={0} variants={fadeUp} initial="hidden" animate="visible" style={{ marginBottom: '28px' }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '12px' }}>
              <span style={{ fontSize: '36px', lineHeight: 1 }}>💳</span>
              <span style={{ fontFamily: "'Raleway', sans-serif", fontWeight: 800, fontSize: '36px', letterSpacing: '-0.04em', color: T.text, lineHeight: 1 }}>
                Spend<span style={{ color: T.jade }}>Analyzer</span>
              </span>
            </div>
          </motion.div>

          <motion.h1
            custom={0.1} variants={fadeUp} initial="hidden" animate="visible"
            style={{
              fontFamily: "'Raleway', sans-serif", fontWeight: 800,
              fontSize: 'clamp(38px, 4.8vw, 60px)', lineHeight: 1.08,
              color: T.text, letterSpacing: '-0.03em', marginBottom: '22px',
            }}
          >
            Finally know<br />
            <span style={{
              background: `linear-gradient(90deg, ${T.jade}, #0891b2)`,
              WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
            }}>
              where your
            </span><br />
            money goes.
          </motion.h1>

          <motion.p
            custom={0.22} variants={fadeUp} initial="hidden" animate="visible"
            style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '17px', lineHeight: 1.7, color: T.textMuted, marginBottom: '36px' }}
          >
            Connect your bank or upload a CSV and get instant category breakdowns,
            interactive spending charts, and monthly budget tracking — all in one private, no-frills tool.
          </motion.p>

          <motion.div custom={0.32} variants={fadeUp} initial="hidden" animate="visible" style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
            <a href="/tools/spend-analyzer/" style={{
              fontFamily: "'DM Sans', sans-serif", fontWeight: 600, fontSize: '15px',
              color: '#ffffff', background: T.jade, padding: '13px 30px', borderRadius: '10px',
              textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '7px',
              boxShadow: `0 4px 20px ${T.jade}30`, transition: 'all 0.2s',
            }}
            onMouseEnter={e => { e.currentTarget.style.background = T.jadeDim; e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = `0 8px 28px ${T.jade}30`; }}
            onMouseLeave={e => { e.currentTarget.style.background = T.jade; e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = `0 4px 20px ${T.jade}30`; }}>
              Try the App →
            </a>
            <a href="#features" style={{
              fontFamily: "'DM Sans', sans-serif", fontWeight: 400, fontSize: '15px',
              color: T.textDim, background: 'transparent', border: `1px solid ${T.border}`,
              padding: '13px 26px', borderRadius: '10px', textDecoration: 'none', transition: 'all 0.2s',
            }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = T.textMuted; e.currentTarget.style.color = T.text; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = T.border; e.currentTarget.style.color = T.textDim; }}>
              See Features ↓
            </a>
          </motion.div>

          <motion.div custom={0.44} variants={fadeUp} initial="hidden" animate="visible" style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '28px' }}>
            <div style={{ display: 'flex' }}>
              {['#3b82f6', '#10b981', '#f59e0b', '#ec4899'].map((c, i) => (
                <div key={i} style={{ width: 22, height: 22, borderRadius: '50%', background: c, border: `2px solid ${T.bg}`, marginLeft: i > 0 ? '-6px' : '0', zIndex: 4 - i, position: 'relative' }} />
              ))}
            </div>
            <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '13px', color: T.textMuted }}>
              Sign in with Google — no password needed
            </span>
          </motion.div>
        </div>

        {/* Right — dashboard mockup */}
        <motion.div
          initial={{ opacity: 0, x: 36, y: 8 }} animate={{ opacity: 1, x: 0, y: 0 }}
          transition={{ duration: 0.72, ease: [0.22, 1, 0.36, 1], delay: 0.28 }}
          className="hero-mockup"
          style={{ flex: '1 1 400px', minWidth: 0, display: 'flex', justifyContent: 'flex-end' }}
        >
          <HeroDashboard />
        </motion.div>
      </div>
    </section>
  );
}

// ── Features ──────────────────────────────────────────────────────────────────
function FeaturesSection() {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-100px' });

  return (
    <section id="features" ref={ref} style={{ padding: '96px 0', position: 'relative', background: T.bgCard }}>
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '1px', background: T.border }} />
      <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '1px', background: T.border }} />

      <div style={{ maxWidth: '1120px', margin: '0 auto', padding: '0 28px' }}>
        <motion.div initial="hidden" animate={inView ? 'visible' : 'hidden'} variants={staggerContainer(0, 0)} style={{ textAlign: 'center', marginBottom: '60px' }}>
          <motion.div variants={fadeUp}><Pill>Everything you need</Pill></motion.div>
          <motion.h2 variants={fadeUp} style={{ fontFamily: "'Raleway', sans-serif", fontWeight: 700, fontSize: 'clamp(30px, 4vw, 44px)', color: T.text, letterSpacing: '-0.025em', marginBottom: '14px' }}>
            Powerful features,<br />zero complexity.
          </motion.h2>
          <motion.p variants={fadeUp} style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '16px', color: T.textMuted, maxWidth: '460px', margin: '0 auto', lineHeight: 1.72 }}>
            Built for people who want real financial clarity without the overhead of enterprise budgeting apps.
          </motion.p>
        </motion.div>

        <motion.div
          initial="hidden" animate={inView ? 'visible' : 'hidden'}
          variants={staggerContainer(0.07, 0.2)}
          className="features-grid"
          style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}
        >
          {FEATURES.map(f => (
            <motion.div key={f.title} variants={fadeUp} style={{
              background: T.bg, border: `1px solid ${T.border}`, borderRadius: '12px', padding: '22px',
              boxShadow: T.cardShadow,
              transition: 'border-color 0.22s ease, transform 0.22s ease, box-shadow 0.22s ease',
              cursor: 'default',
            }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = T.borderHov; e.currentTarget.style.transform = 'translateY(-3px)'; e.currentTarget.style.boxShadow = T.cardHoverShadow; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = T.border; e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = T.cardShadow; }}
            >
              <div style={{ fontSize: '22px', marginBottom: '10px', lineHeight: 1 }}>{f.icon}</div>
              <h3 style={{ fontFamily: "'Raleway', sans-serif", fontWeight: 600, fontSize: '15px', color: T.text, letterSpacing: '-0.01em', marginBottom: '7px' }}>{f.title}</h3>
              <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '13px', color: T.textMuted, lineHeight: 1.68, marginBottom: '16px' }}>{f.desc}</p>
              <f.Mockup />
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}

// ── How It Works ──────────────────────────────────────────────────────────────
function HowItWorksSection() {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-80px' });

  const steps = [
    { num: '01', icon: '🔗', title: 'Connect or Upload',  desc: 'Link your bank via Plaid for automatic syncing, or drag-and-drop a CSV export from any card issuer.' },
    { num: '02', icon: '⚡', title: 'Auto-Categorize',    desc: 'Every transaction is instantly assigned a category. Refine with custom rules to match your exact workflow.' },
    { num: '03', icon: '📈', title: 'Analyze & Budget',   desc: 'Explore interactive charts, drill into subcategories, set monthly budgets, and track your progress.' },
  ];

  return (
    <section id="how-it-works" ref={ref} style={{ padding: '96px 0' }}>
      <div style={{ maxWidth: '1120px', margin: '0 auto', padding: '0 28px' }}>
        <motion.div initial="hidden" animate={inView ? 'visible' : 'hidden'} variants={staggerContainer(0, 0)} style={{ textAlign: 'center', marginBottom: '60px' }}>
          <motion.div variants={fadeUp}><Pill>Simple process</Pill></motion.div>
          <motion.h2 variants={fadeUp} style={{ fontFamily: "'Raleway', sans-serif", fontWeight: 700, fontSize: 'clamp(30px, 4vw, 44px)', color: T.text, letterSpacing: '-0.025em' }}>
            Up and running in minutes.
          </motion.h2>
        </motion.div>

        <motion.div
          initial="hidden" animate={inView ? 'visible' : 'hidden'}
          variants={staggerContainer(0.14, 0.2)}
          className="how-it-works-grid"
          style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', position: 'relative' }}
        >
          <div style={{ position: 'absolute', top: '27px', left: 'calc(16.7% + 8px)', right: 'calc(16.7% + 8px)', height: '1px', background: `linear-gradient(90deg, ${T.jade}40, ${T.jade}40)`, pointerEvents: 'none', zIndex: 0 }} />

          {steps.map(s => (
            <motion.div key={s.num} variants={fadeUp} style={{ textAlign: 'center', padding: '0 12px', position: 'relative', zIndex: 1 }}>
              <div style={{ width: '54px', height: '54px', borderRadius: '14px', background: `${T.jade}14`, border: `1px solid ${T.jade}28`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '22px', margin: '0 auto 18px' }}>
                {s.icon}
              </div>
              <div style={{ fontFamily: "'Raleway', sans-serif", fontSize: '11px', color: T.jade, fontWeight: 700, letterSpacing: '0.12em', marginBottom: '8px' }}>{s.num}</div>
              <h3 style={{ fontFamily: "'Raleway', sans-serif", fontWeight: 600, fontSize: '18px', color: T.text, letterSpacing: '-0.015em', marginBottom: '12px' }}>{s.title}</h3>
              <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '14px', color: T.textMuted, lineHeight: 1.72 }}>{s.desc}</p>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}

// ── Bottom CTA ────────────────────────────────────────────────────────────────
function CtaSection() {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-80px' });

  return (
    <section ref={ref} style={{ padding: '80px 0 120px' }}>
      <div style={{ maxWidth: '1120px', margin: '0 auto', padding: '0 28px' }}>
        <motion.div
          initial="hidden" animate={inView ? 'visible' : 'hidden'} variants={fadeUp}
          style={{
            background: T.text,
            borderRadius: '20px', padding: '72px 48px', textAlign: 'center',
            position: 'relative', overflow: 'hidden',
          }}
        >
          <div style={{ position: 'absolute', inset: 0, background: `radial-gradient(ellipse at 50% -20%, ${T.jade}22 0%, transparent 60%)`, pointerEvents: 'none' }} />
          <div style={{ position: 'absolute', top: 0, left: '25%', right: '25%', height: '1px', background: `linear-gradient(90deg, transparent, ${T.jade}60, transparent)` }} />

          <div style={{ position: 'relative' }}>
            <h2 style={{ fontFamily: "'Raleway', sans-serif", fontWeight: 800, fontSize: 'clamp(30px, 4.5vw, 50px)', color: '#ffffff', letterSpacing: '-0.03em', marginBottom: '16px', lineHeight: 1.08 }}>
              Ready to understand<br />your spending?
            </h2>
            <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '16px', color: 'rgba(255,255,255,0.6)', maxWidth: '380px', margin: '0 auto 40px', lineHeight: 1.72 }}>
              Sign in with Google and start analyzing your transactions in under two minutes. Free to use.
            </p>
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
              <a href="/tools/spend-analyzer/" style={{
                fontFamily: "'DM Sans', sans-serif", fontWeight: 600, fontSize: '15px',
                color: T.text, background: T.jade, padding: '14px 36px', borderRadius: '10px',
                textDecoration: 'none', boxShadow: `0 4px 24px ${T.jade}40`, transition: 'all 0.2s',
              }}
              onMouseEnter={e => { e.currentTarget.style.background = T.jadeDim; e.currentTarget.style.transform = 'translateY(-2px)'; }}
              onMouseLeave={e => { e.currentTarget.style.background = T.jade; e.currentTarget.style.transform = 'translateY(0)'; }}>
                Open the App
              </a>
              <a href="#features" style={{
                fontFamily: "'DM Sans', sans-serif", fontWeight: 400, fontSize: '15px',
                color: 'rgba(255,255,255,0.65)', border: '1px solid rgba(255,255,255,0.2)',
                padding: '14px 30px', borderRadius: '10px', textDecoration: 'none', transition: 'all 0.2s',
              }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.5)'; e.currentTarget.style.color = '#ffffff'; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.2)'; e.currentTarget.style.color = 'rgba(255,255,255,0.65)'; }}>
                Learn More
              </a>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

// ── Footer ────────────────────────────────────────────────────────────────────
function Footer() {
  return (
    <footer style={{ borderTop: `1px solid ${T.border}`, padding: '28px 28px', background: T.bgCard }}>
      <div style={{ maxWidth: '1120px', margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', flexWrap: 'wrap' }}>
        <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '13px', color: T.textMuted }}>
          © 2025{' '}
          <a href="/" style={{ color: T.textMuted, textDecoration: 'none', transition: 'color 0.15s' }}
            onMouseEnter={e => { e.target.style.color = T.text; }}
            onMouseLeave={e => { e.target.style.color = T.textMuted; }}>
            BrettLabs
          </a>
        </span>
        <div style={{ display: 'flex', gap: '20px' }}>
          {[['/', 'Portfolio'], ['/tools/spend-analyzer/', 'Open App']].map(([href, label]) => (
            <a key={label} href={href} style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '13px', color: T.textMuted, textDecoration: 'none', transition: 'color 0.15s' }}
              onMouseEnter={e => { e.target.style.color = T.text; }}
              onMouseLeave={e => { e.target.style.color = T.textMuted; }}>
              {label}
            </a>
          ))}
        </div>
      </div>
    </footer>
  );
}

// ── Root ──────────────────────────────────────────────────────────────────────
export default function LandingPage() {
  return (
    <div style={{
      background: T.bg,
      minHeight: '100vh',
      color: T.text,
      backgroundImage: 'radial-gradient(circle, #ccd6e6 1px, transparent 1px)',
      backgroundSize: '28px 28px',
    }}>
      <style>{`
        html { scroll-behavior: smooth; }
        *, *::before, *::after { box-sizing: border-box; }
        body { margin: 0; background: ${T.bg}; }
        ::selection { background: ${T.jade}28; color: ${T.jade}; }

        @media (max-width: 767px) {
          .hero-layout { flex-direction: column !important; align-items: flex-start !important; gap: 40px !important; }
          .hero-left { max-width: 100% !important; }
          .hero-mockup { display: none !important; }
          .features-grid { grid-template-columns: 1fr !important; }
          .how-it-works-grid { grid-template-columns: 1fr !important; }
        }
        @media (min-width: 768px) and (max-width: 1023px) {
          .hero-mockup { flex: 1 1 100% !important; justify-content: center !important; }
          .features-grid { grid-template-columns: repeat(2, 1fr) !important; }
          .how-it-works-grid { grid-template-columns: repeat(2, 1fr) !important; }
        }
      `}</style>

      <Nav />

      <main>
        <Hero />
        <FeaturesSection />
        <HowItWorksSection />
        <CtaSection />
      </main>

      <Footer />
    </div>
  );
}
