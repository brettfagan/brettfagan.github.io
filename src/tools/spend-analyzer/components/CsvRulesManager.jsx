import { useState } from 'react';
import { useCsvRules } from '../context/CsvRulesContext';
import { useCategories } from '../context/CategoriesContext';
import { useDetailLabels } from '../context/DetailLabelsContext';

// ── MatchFieldToggle ──────────────────────────────────────────────────────────
function MatchFieldToggle({ value, onChange }) {
  const opts = [
    { value: 'category', label: 'Category col' },
    { value: 'merchant', label: 'Merchant' },
    { value: 'both',     label: 'Both' },
  ];
  return (
    <div className="match-field-toggle">
      {opts.map(o => (
        <button
          key={o.value}
          type="button"
          className={`mft-btn${value === o.value ? ' active' : ''}`}
          onClick={() => onChange(o.value)}
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
    <select className="cm-input rule-cat-select" value={value} onChange={e => onChange(e.target.value)}>
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

  const matchBadgeLabel = { category: 'cat', merchant: 'merchant', both: 'both' }[rule.match_field] || 'both';
  const catColor = getCatColor(rule.cat);
  const catLabel = getCatLabel(rule.cat);

  if (!editing) {
    return (
      <div className="cm-row rule-row">
        <div className="rule-reorder">
          <button
            className="cm-btn-icon reorder"
            onClick={() => onMove(rule.id, 'up')}
            disabled={index === 0}
            title="Move up"
          >↑</button>
          <span className="rule-priority">{index + 1}</span>
          <button
            className="cm-btn-icon reorder"
            onClick={() => onMove(rule.id, 'down')}
            disabled={index === total - 1}
            title="Move down"
          >↓</button>
        </div>
        <div className="rule-pattern-col">
          <span className="rule-pattern" title={rule.pattern}>{rule.pattern}</span>
          {rule.cat_detail && (
            <span className="rule-cat-detail-badge" title={rule.cat_detail}>
              ↳ {getDetailLabel(rule.cat_detail)}
            </span>
          )}
        </div>
        <span className={`rule-match-field mf-${rule.match_field}`}>{matchBadgeLabel}</span>
        <span className="rule-arrow">→</span>
        <span className="cm-swatch" style={{ background: catColor }} />
        <span className="cm-row-label">{catLabel}</span>
        <button className="cm-btn-icon" onClick={() => setEditing(true)} title="Edit">✎</button>
        <button className="cm-btn-icon danger" onClick={() => onDelete(rule.id)} title="Delete">✕</button>
      </div>
    );
  }

  return (
    <div className="cm-row editing">
      <div className="cm-edit-block">
        <div className="cm-edit-row">
          <label className="cm-edit-label">Pattern</label>
          <input
            className="cm-input"
            value={pattern}
            onChange={e => { setPattern(e.target.value); setPatternErr(''); }}
            placeholder="AMAZON|WHOLE FOODS"
            spellCheck={false}
          />
        </div>
        {patternErr && <p className="cm-error" style={{ marginLeft: '130px' }}>{patternErr}</p>}
        <div className="cm-edit-row">
          <label className="cm-edit-label">Match against</label>
          <MatchFieldToggle value={matchField} onChange={setMatchField} />
        </div>
        <div className="cm-edit-row">
          <label className="cm-edit-label">Category</label>
          <CategorySelect value={cat} onChange={v => { setCat(v); setCatDetail(''); }} />
        </div>
        <div className="cm-edit-row">
          <label className="cm-edit-label">Subcategory</label>
          <input
            className="cm-input"
            value={catDetail}
            onChange={e => setCatDetail(e.target.value)}
            placeholder={`${cat}_SUBCATEGORY (optional)`}
            spellCheck={false}
          />
        </div>
        <p className="cm-subcat-hint">
          Optional. Use Plaid detail keys like <code>{cat}_GROCERIES</code> for drill-down in charts.
          Leave blank to use the raw CSV category value.
        </p>
        <div className="cm-edit-actions">
          <button className="cm-btn primary" onClick={handleSave} disabled={saving}>
            {saving ? 'Saving…' : 'Save'}
          </button>
          <button className="cm-btn" onClick={handleCancel}>Cancel</button>
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
    return (
      <button className="cm-btn add-new" onClick={() => setOpen(true)}>
        + Add Rule
      </button>
    );
  }

  return (
    <form className="cm-add-form" onSubmit={handleSubmit}>
      <div className="cm-edit-row">
        <label className="cm-edit-label">Pattern</label>
        <input
          className="cm-input"
          value={pattern}
          onChange={e => { setPattern(e.target.value); setError(''); }}
          placeholder="WHOLE FOODS|TRADER JOE"
          autoFocus
          spellCheck={false}
        />
      </div>
      <div className="cm-edit-row">
        <label className="cm-edit-label">Match against</label>
        <MatchFieldToggle value={matchField} onChange={setMatchField} />
      </div>
      <div className="cm-edit-row">
        <label className="cm-edit-label">Category</label>
        <CategorySelect value={cat} onChange={v => { setCat(v); setCatDetail(''); }} />
      </div>
      <div className="cm-edit-row">
        <label className="cm-edit-label">Subcategory</label>
        <input
          className="cm-input"
          value={catDetail}
          onChange={e => setCatDetail(e.target.value)}
          placeholder={`${cat}_SUBCATEGORY (optional)`}
          spellCheck={false}
        />
      </div>
      <p className="cm-subcat-hint">
        Optional. Use Plaid detail keys like <code>{cat}_GROCERIES</code> for drill-down in charts.
        Leave blank to use the raw CSV category value.
      </p>
      {error && <p className="cm-error">{error}</p>}
      <div className="cm-edit-actions">
        <button className="cm-btn primary" type="submit" disabled={saving}>
          {saving ? 'Adding…' : 'Add Rule'}
        </button>
        <button className="cm-btn" type="button" onClick={() => { setOpen(false); setError(''); }}>
          Cancel
        </button>
      </div>
    </form>
  );
}

// ── CsvRulesManager ───────────────────────────────────────────────────────────
export default function CsvRulesManager() {
  const { rules, loading, saveRule, deleteRule, moveRule, resetToDefaults } = useCsvRules();
  const [resetting, setResetting] = useState(false);

  async function handleReset() {
    if (!confirm('Reset all CSV rules to defaults? This will delete any custom rules.')) return;
    setResetting(true);
    await resetToDefaults();
    setResetting(false);
  }

  if (loading) return <p className="cm-loading">Loading rules…</p>;

  return (
    <>
      <p className="rules-hint">
        Rules are tested in order — first match wins. Each rule tests the CSV
        category column, merchant description, or both using a regex pattern.
      </p>

      <div className="cm-list">
        {rules.length === 0
          ? <p className="cm-loading">No rules yet. Add one below.</p>
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

      <div className="cm-reset-section">
        <button
          className="cm-btn danger-outline"
          onClick={handleReset}
          disabled={resetting}
        >
          {resetting ? 'Resetting…' : 'Reset to Defaults'}
        </button>
      </div>
    </>
  );
}
