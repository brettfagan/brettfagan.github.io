import { useState } from 'react';
import { useCsvRules } from '../context/CsvRulesContext';
import { useCategories } from '../context/CategoriesContext';
import { useDetailLabels } from '../context/DetailLabelsContext';
import { Button } from '@/components/ui/button';

// ── Shared class strings ──────────────────────────────────────────────────────
const editingCls  = "bg-muted border border-border rounded-md py-3.5 px-4";
const blockCls    = "flex flex-col gap-2.5";
const editRowCls  = "flex items-center gap-2.5";
const labelCls    = "text-[10px] font-bold tracking-[1px] uppercase text-muted-foreground w-30 shrink-0";
const inputCls    = "flex-1 bg-background border border-border rounded font-mono text-xs text-foreground py-1.5 px-2.5 outline-none focus:border-primary transition-colors";
const iconBtnCls  = "bg-transparent border-0 cursor-pointer text-[13px] text-muted-foreground p-0.5 px-1.5 rounded leading-none hover:text-primary hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors";
const dangerBtnCls = "bg-transparent border-0 cursor-pointer text-[13px] text-muted-foreground p-0.5 px-1.5 rounded leading-none hover:text-destructive hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors";
const addNewBtnCls = "w-full border border-dashed border-border rounded font-mono text-[11px] font-bold text-muted-foreground py-2 px-3 bg-transparent cursor-pointer tracking-[0.5px] mb-6 hover:text-primary hover:border-primary hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors";
const addFormCls  = "bg-muted border border-border rounded-lg p-4 flex flex-col gap-2.5 mb-6";

const matchFieldColors = {
  category: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
  merchant: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300',
  both:     'bg-violet-100 text-violet-800 dark:bg-violet-900/30 dark:text-violet-300',
};

// ── MatchFieldToggle ──────────────────────────────────────────────────────────
function MatchFieldToggle({ value, onChange }) {
  const opts = [
    { value: 'category', label: 'Category col' },
    { value: 'merchant', label: 'Merchant' },
    { value: 'both',     label: 'Both' },
  ];
  return (
    <div className="flex gap-1 flex-nowrap">
      {opts.map(o => (
        <button
          key={o.value}
          type="button"
          onClick={() => onChange(o.value)}
          className={`border rounded-lg cursor-pointer font-mono text-[10px] font-semibold px-2 py-1 transition-colors whitespace-nowrap ${
            value === o.value
              ? 'bg-primary border-primary text-white'
              : 'bg-transparent border-border text-muted-foreground hover:border-primary hover:text-primary'
          }`}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

// ── CategorySelect ────────────────────────────────────────────────────────────
function CategorySelect({ value, onChange }) {
  const { categories } = useCategories();
  return (
    <select className={inputCls} value={value} onChange={e => onChange(e.target.value)}>
      {categories.map(cat => (
        <option key={cat.key} value={cat.key}>{cat.label}</option>
      ))}
    </select>
  );
}

// ── RuleRow ───────────────────────────────────────────────────────────────────
function RuleRow({ rule, index, total, onSave, onDelete, onMove }) {
  const { getCatColor, getCatLabel } = useCategories();
  const { getDetailLabel } = useDetailLabels();
  const [editing, setEditing]       = useState(false);
  const [pattern, setPattern]       = useState(rule.pattern);
  const [matchField, setMatchField] = useState(rule.match_field);
  const [cat, setCat]               = useState(rule.cat);
  const [catDetail, setCatDetail]   = useState(rule.cat_detail || '');
  const [saving, setSaving]         = useState(false);
  const [patternErr, setPatternErr] = useState('');

  function validatePattern(p) {
    try { new RegExp(p); return true; }
    catch { return false; }
  }

  async function handleSave() {
    if (!validatePattern(pattern)) { setPatternErr('Invalid regex pattern.'); return; }
    setSaving(true);
    await onSave({ ...rule, pattern, match_field: matchField, cat, cat_detail: catDetail.trim() || null });
    setSaving(false);
    setEditing(false);
    setPatternErr('');
  }

  function handleCancel() {
    setPattern(rule.pattern);
    setMatchField(rule.match_field);
    setCat(rule.cat);
    setCatDetail(rule.cat_detail || '');
    setEditing(false);
    setPatternErr('');
  }

  const catColor = getCatColor(rule.cat);
  const catLabel = getCatLabel(rule.cat);
  const matchBadgeLabel = { category: 'cat', merchant: 'merchant', both: 'both' }[rule.match_field] || 'both';

  if (!editing) {
    return (
      <div className="grid grid-cols-[auto_1fr_auto_auto_auto_auto_auto_auto] items-center gap-2.5 px-2.5 py-2 rounded-md border border-transparent hover:bg-muted hover:border-border transition-colors">
        {/* Reorder */}
        <div className="flex flex-col items-center gap-px shrink-0">
          <button
            className="bg-transparent border-0 cursor-pointer text-[10px] text-muted-foreground px-1 py-px leading-none disabled:opacity-20 disabled:cursor-not-allowed hover:text-primary transition-colors"
            onClick={() => onMove(rule.id, 'up')}
            disabled={index === 0}
            title="Move up"
          >↑</button>
          <span className="text-[9px] font-bold text-muted-foreground text-center min-w-3 tracking-[0]">{index + 1}</span>
          <button
            className="bg-transparent border-0 cursor-pointer text-[10px] text-muted-foreground px-1 py-px leading-none disabled:opacity-20 disabled:cursor-not-allowed hover:text-primary transition-colors"
            onClick={() => onMove(rule.id, 'down')}
            disabled={index === total - 1}
            title="Move down"
          >↓</button>
        </div>
        {/* Pattern */}
        <div className="flex flex-col gap-0.5 min-w-0 overflow-hidden">
          <span className="font-mono text-[10px] text-foreground overflow-hidden text-ellipsis whitespace-nowrap tracking-[0.2px]" title={rule.pattern}>
            {rule.pattern}
          </span>
          {rule.cat_detail && (
            <span className="font-mono text-[9px] text-muted-foreground whitespace-nowrap overflow-hidden text-ellipsis tracking-[0.2px]" title={rule.cat_detail}>
              ↳ {getDetailLabel(rule.cat_detail)}
            </span>
          )}
        </div>
        {/* Match field badge */}
        <span className={`text-[9px] px-1.5 py-0.5 rounded-full whitespace-nowrap tracking-[0.3px] font-bold uppercase ${matchFieldColors[rule.match_field] || matchFieldColors.both}`}>
          {matchBadgeLabel}
        </span>
        <span className="text-[11px] text-muted-foreground shrink-0">→</span>
        {/* Category swatch + label */}
        <span className="w-3.5 h-3.5 rounded-[3px] shrink-0 inline-block" style={{ background: catColor }} />
        <span className="text-xs font-semibold overflow-hidden text-ellipsis whitespace-nowrap">{catLabel}</span>
        <button className={iconBtnCls} onClick={() => setEditing(true)} title="Edit">✎</button>
        <button className={dangerBtnCls} onClick={() => onDelete(rule.id)} title="Delete">✕</button>
      </div>
    );
  }

  return (
    <div className={editingCls}>
      <div className={blockCls}>
        <div className={editRowCls}>
          <label className={labelCls}>Pattern</label>
          <input
            className={inputCls}
            value={pattern}
            onChange={e => { setPattern(e.target.value); setPatternErr(''); }}
            placeholder="AMAZON|WHOLE FOODS"
            spellCheck={false}
          />
        </div>
        {patternErr && <p className="text-[11px] text-destructive ml-32.5">{patternErr}</p>}
        <div className={editRowCls}>
          <label className={labelCls}>Match against</label>
          <MatchFieldToggle value={matchField} onChange={setMatchField} />
        </div>
        <div className={editRowCls}>
          <label className={labelCls}>Category</label>
          <CategorySelect value={cat} onChange={v => { setCat(v); setCatDetail(''); }} />
        </div>
        <div className={editRowCls}>
          <label className={labelCls}>Subcategory</label>
          <input
            className={inputCls}
            value={catDetail}
            onChange={e => setCatDetail(e.target.value)}
            placeholder={`${cat}_SUBCATEGORY (optional)`}
            spellCheck={false}
          />
        </div>
        <p className="text-[11px] text-muted-foreground leading-[1.6] mt-1 mb-2 ml-32.5">
          Optional. Use Plaid detail keys like <code className="font-mono text-[10px] bg-background border border-border rounded-[3px] px-1 py-px text-foreground">{cat}_GROCERIES</code> for drill-down in charts.
          Leave blank to use the raw CSV category value.
        </p>
        <div className="flex gap-2 mt-1">
          <Button size="sm" onClick={handleSave} disabled={saving} className="font-mono text-[11px] font-bold">
            {saving ? 'Saving…' : 'Save'}
          </Button>
          <Button size="sm" variant="outline" onClick={handleCancel} className="font-mono text-[11px] font-bold">Cancel</Button>
        </div>
      </div>
    </div>
  );
}

// ── AddRuleForm ───────────────────────────────────────────────────────────────
function AddRuleForm({ onAdd }) {
  const { categories } = useCategories();
  const [open, setOpen]             = useState(false);
  const [pattern, setPattern]       = useState('');
  const [matchField, setMatchField] = useState('both');
  const [cat, setCat]               = useState(categories[0]?.key || '');
  const [catDetail, setCatDetail]   = useState('');
  const [saving, setSaving]         = useState(false);
  const [error, setError]           = useState('');

  function validatePattern(p) {
    try { new RegExp(p); return true; }
    catch { return false; }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!pattern.trim()) { setError('Pattern is required.'); return; }
    if (!validatePattern(pattern)) { setError('Invalid regex pattern.'); return; }
    setSaving(true);
    setError('');
    const ok = await onAdd({
      pattern: pattern.trim(),
      match_field: matchField,
      cat,
      cat_detail: catDetail.trim() || null,
    });
    setSaving(false);
    if (ok === false) {
      setError('Failed to save. Please try again.');
    } else {
      setPattern(''); setMatchField('both');
      setCat(categories[0]?.key || '');
      setCatDetail('');
      setOpen(false);
    }
  }

  if (!open) {
    return <button className={addNewBtnCls} onClick={() => setOpen(true)}>+ Add Rule</button>;
  }

  return (
    <form className={addFormCls} onSubmit={handleSubmit}>
      <div className={editRowCls}>
        <label className={labelCls}>Pattern</label>
        <input
          className={inputCls}
          value={pattern}
          onChange={e => { setPattern(e.target.value); setError(''); }}
          placeholder="WHOLE FOODS|TRADER JOE"
          autoFocus
          spellCheck={false}
        />
      </div>
      <div className={editRowCls}>
        <label className={labelCls}>Match against</label>
        <MatchFieldToggle value={matchField} onChange={setMatchField} />
      </div>
      <div className={editRowCls}>
        <label className={labelCls}>Category</label>
        <CategorySelect value={cat} onChange={v => { setCat(v); setCatDetail(''); }} />
      </div>
      <div className={editRowCls}>
        <label className={labelCls}>Subcategory</label>
        <input
          className={inputCls}
          value={catDetail}
          onChange={e => setCatDetail(e.target.value)}
          placeholder={`${cat}_SUBCATEGORY (optional)`}
          spellCheck={false}
        />
      </div>
      <p className="text-[11px] text-muted-foreground leading-[1.6] mt-1 mb-2 ml-32.5">
        Optional. Use Plaid detail keys like <code className="font-mono text-[10px] bg-background border border-border rounded-[3px] px-1 py-px text-foreground">{cat}_GROCERIES</code> for drill-down in charts.
        Leave blank to use the raw CSV category value.
      </p>
      {error && <p className="text-[11px] text-destructive">{error}</p>}
      <div className="flex gap-2 mt-1">
        <Button size="sm" type="submit" disabled={saving} className="font-mono text-[11px] font-bold">
          {saving ? 'Adding…' : 'Add Rule'}
        </Button>
        <Button size="sm" variant="outline" type="button" onClick={() => { setOpen(false); setError(''); }} className="font-mono text-[11px] font-bold">
          Cancel
        </Button>
      </div>
    </form>
  );
}

// ── CsvRulesManager ───────────────────────────────────────────────────────────
export default function CsvRulesManager() {
  const { rules, loading, saveRule, deleteRule, moveRule, resetToDefaults } = useCsvRules();
  const [resetting, setResetting] = useState(false);

  async function handleReset() {
    if (!confirm('Reset all rules to defaults? This will delete any custom rules.')) return;
    setResetting(true);
    await resetToDefaults();
    setResetting(false);
  }

  if (loading) return <p className="text-muted-foreground py-6 text-xs">Loading rules…</p>;

  return (
    <>
      <p className="text-[11px] text-muted-foreground leading-[1.7] mb-4 px-3 py-2.5 bg-muted rounded-md border border-border">
        Rules are tested in order — first match wins. Each rule tests the
        transaction category, merchant description, or both using a regex pattern.
      </p>

      <div className="flex flex-col gap-0.5 mb-5">
        {rules.length === 0
          ? <p className="text-muted-foreground py-6 text-xs">No rules yet. Add one below.</p>
          : rules.map((rule, i) => (
            <RuleRow
              key={rule.id || i}
              rule={rule}
              index={i}
              total={rules.length}
              onSave={saveRule}
              onDelete={deleteRule}
              onMove={moveRule}
            />
          ))
        }
      </div>

      <AddRuleForm onAdd={saveRule} />

      <div className="border-t border-border pt-5">
        <Button
          variant="outline"
          size="sm"
          onClick={handleReset}
          disabled={resetting}
          className="border-destructive text-destructive hover:bg-destructive/10 hover:text-destructive font-mono text-[11px] font-bold"
        >
          {resetting ? 'Resetting…' : 'Reset to Defaults'}
        </Button>
      </div>
    </>
  );
}
