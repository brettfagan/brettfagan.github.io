import { useState } from 'react';
import { useCategories, COLOR_PALETTE } from '../context/CategoriesContext';
import { useDetailLabels } from '../context/DetailLabelsContext';
import { SUBCATEGORIES } from '../lib/constants';
import { Button } from '@/components/ui/button';

// ── Shared class strings ──────────────────────────────────────────────────────
const rowCls       = "grid grid-cols-[18px_1fr_auto_auto_auto_auto] items-center gap-2.5 px-2.5 py-2 rounded-md border border-transparent hover:bg-muted hover:border-border transition-colors";
const editingCls   = "bg-muted border border-border rounded-md py-3.5 px-4";
const blockCls     = "flex flex-col gap-2.5";
const editRowCls   = "flex items-center gap-2.5";
const labelCls     = "text-[10px] font-bold tracking-[1px] uppercase text-muted-foreground w-30 shrink-0";
const inputCls     = "flex-1 bg-background border border-border rounded text-xs text-foreground py-1.5 px-2.5 outline-none focus:border-primary transition-colors";
const iconBtnCls   = "bg-transparent border-0 cursor-pointer text-[13px] text-muted-foreground p-0.5 px-1.5 rounded leading-none hover:text-primary hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors";
const dangerBtnCls = "bg-transparent border-0 cursor-pointer text-[13px] text-muted-foreground p-0.5 px-1.5 rounded leading-none hover:text-destructive hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors";
const addNewBtnCls = "w-full border border-dashed border-border rounded text-[11px] font-bold text-muted-foreground py-2 px-3 bg-transparent cursor-pointer tracking-[0.5px] mb-6 hover:text-primary hover:border-primary hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors";
const addFormCls   = "bg-muted border border-border rounded-lg p-4 flex flex-col gap-2.5 mb-6";

// ── ColorPicker ───────────────────────────────────────────────────────────────
function ColorPicker({ value, onChange }) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {COLOR_PALETTE.map(c => (
        <button
          key={c}
          type="button"
          className={`w-5.5 h-5.5 rounded-lg border-2 cursor-pointer p-0 outline-none transition-transform duration-120 hover:scale-[1.18] ${
            value === c ? 'border-foreground scale-[1.18]' : 'border-transparent'
          }`}
          style={{ background: c }}
          onClick={() => onChange(c)}
          title={c}
        />
      ))}
    </div>
  );
}

// ── SubcategoryRow ────────────────────────────────────────────────────────────
function SubcategoryRow({ subKey, displayName, isCustom, onSave, onDelete }) {
  const [editing, setEditing] = useState(false);
  const [label, setLabel]     = useState(displayName);
  const [saving, setSaving]   = useState(false);

  async function handleSave() {
    if (!label.trim()) return;
    setSaving(true);
    await onSave(subKey, label.trim());
    setSaving(false);
    setEditing(false);
  }

  function handleCancel() {
    setLabel(displayName);
    setEditing(false);
  }

  if (!editing) {
    return (
      <div className="grid grid-cols-[1fr_auto_auto] items-center gap-1.5 px-2 py-1 rounded hover:bg-background transition-colors">
        <div className="flex items-center gap-2 min-w-0">
          <span className="text-xs font-medium overflow-hidden text-ellipsis whitespace-nowrap">{displayName}</span>
          {isCustom && (
            <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 whitespace-nowrap shrink-0">
              custom
            </span>
          )}
        </div>
        <button className={iconBtnCls} onClick={() => setEditing(true)} title="Rename">✎</button>
        {isCustom
          ? <button className={dangerBtnCls} onClick={() => onDelete(subKey)} title="Delete">✕</button>
          : <span className="w-6" />
        }
      </div>
    );
  }

  return (
    <div className="px-2 py-2 bg-background rounded border border-border">
      <div className="flex items-center gap-2">
        <input
          className={inputCls}
          value={label}
          onChange={e => setLabel(e.target.value)}
          maxLength={60}
          autoFocus
          onKeyDown={e => {
            if (e.key === 'Enter') handleSave();
            if (e.key === 'Escape') handleCancel();
          }}
        />
        <Button size="sm" onClick={handleSave} disabled={saving || !label.trim()} className="text-[11px] font-bold shrink-0">
          {saving ? '…' : 'Save'}
        </Button>
        <Button size="sm" variant="outline" onClick={handleCancel} className="text-[11px] font-bold shrink-0">Cancel</Button>
      </div>
    </div>
  );
}

// ── AddSubcategoryForm ────────────────────────────────────────────────────────
function AddSubcategoryForm({ catKey, onAdd }) {
  const [open, setOpen]     = useState(false);
  const [label, setLabel]   = useState('');
  const [key, setKey]       = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError]   = useState('');

  function deriveSubKey(lbl) {
    const part = lbl.trim().toUpperCase().replace(/[^A-Z0-9]+/g, '_').replace(/^_|_$/g, '');
    return part ? `${catKey}_${part}` : '';
  }

  function handleLabelChange(val) {
    setLabel(val);
    setKey(deriveSubKey(val));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!label.trim()) { setError('Display name is required.'); return; }
    if (!key) { setError('Could not derive a key from the name.'); return; }
    setSaving(true);
    setError('');
    const ok = await onAdd(key, label.trim());
    setSaving(false);
    if (ok === false) {
      setError('Failed to save. This subcategory may already exist.');
    } else {
      setLabel(''); setKey(''); setOpen(false);
    }
  }

  if (!open) {
    return (
      <button
        className="mt-2 w-full text-[10px] font-bold text-muted-foreground border border-dashed border-border rounded px-2 py-1.5 bg-transparent cursor-pointer hover:text-primary hover:border-primary hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors"
        onClick={() => setOpen(true)}
      >
        + Add Subcategory
      </button>
    );
  }

  return (
    <form className="mt-2 bg-background border border-border rounded-md p-3 flex flex-col gap-2" onSubmit={handleSubmit}>
      <div className="flex items-center gap-2">
        <label className="text-[10px] font-bold tracking-[1px] uppercase text-muted-foreground w-12 shrink-0">Name</label>
        <input
          className={inputCls}
          value={label}
          onChange={e => handleLabelChange(e.target.value)}
          maxLength={50}
          placeholder="e.g. Streaming"
          autoFocus
        />
      </div>
      {key && (
        <p className="text-[10px] text-muted-foreground ml-14">
          Key: <span className="font-mono">{key}</span>
        </p>
      )}
      {error && <p className="text-[11px] text-destructive">{error}</p>}
      <div className="flex gap-2">
        <Button size="sm" type="submit" disabled={saving || !label.trim()} className="text-[11px] font-bold">
          {saving ? 'Adding…' : 'Add'}
        </Button>
        <Button
          size="sm"
          variant="outline"
          type="button"
          onClick={() => { setOpen(false); setError(''); setLabel(''); setKey(''); }}
          className="text-[11px] font-bold"
        >
          Cancel
        </Button>
      </div>
    </form>
  );
}

// ── CategoryRow ───────────────────────────────────────────────────────────────
function CategoryRow({ cat, onSave, onDelete }) {
  const { detailLabels, getDetailLabel, saveDetailLabel, deleteDetailLabel } = useDetailLabels();
  const [editing, setEditing]   = useState(false);
  const [label, setLabel]       = useState(cat.label);
  const [color, setColor]       = useState(cat.color);
  const [excluded, setExcluded] = useState(cat.excluded);
  const [saving, setSaving]     = useState(false);
  const [subOpen, setSubOpen]   = useState(false);

  const hardcodedSubs = SUBCATEGORIES[cat.key] || [];
  const customSubs = detailLabels.filter(
    dl => dl.cat_detail.startsWith(cat.key + '_') && !hardcodedSubs.includes(dl.cat_detail)
  );
  const totalSubCount = hardcodedSubs.length + customSubs.length;

  async function handleSave() {
    setSaving(true);
    await onSave({ ...cat, label, color, excluded });
    setSaving(false);
    setEditing(false);
  }

  function handleCancel() {
    setLabel(cat.label);
    setColor(cat.color);
    setExcluded(cat.excluded);
    setEditing(false);
  }

  if (!editing) {
    return (
      <div className="flex flex-col">
        <div className={rowCls}>
          <span className="w-3.5 h-3.5 rounded-[3px] shrink-0 inline-block" style={{ background: cat.color }} />
          <span className="text-xs font-semibold overflow-hidden text-ellipsis whitespace-nowrap">{cat.label}</span>
          <span className="text-[10px] text-muted-foreground tracking-[0.3px] whitespace-nowrap">{cat.key}</span>
          <span className={`text-[9px] px-1.5 py-0.5 rounded-full whitespace-nowrap tracking-[0.3px] ${
            cat.excluded ? 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400' : 'bg-muted text-muted-foreground'
          }`}>
            {cat.excluded ? 'excluded' : 'included'}
          </span>
          <button className={iconBtnCls} onClick={() => setEditing(true)} title="Edit">✎</button>
          <button className={dangerBtnCls} onClick={() => onDelete(cat.key)} title="Delete">✕</button>
        </div>

        {/* ── Subcategories panel ── */}
        <div className="px-2.5 pb-1.5 pl-9.5">
          <button
            className="bg-transparent border-0 cursor-pointer text-[10px] text-muted-foreground p-0 tracking-[0.3px] hover:text-foreground transition-colors"
            onClick={() => setSubOpen(o => !o)}
          >
            {subOpen ? '▼' : '▶'} {totalSubCount} subcategor{totalSubCount === 1 ? 'y' : 'ies'}
          </button>

          {subOpen && (
            <div className="mt-2 border border-border rounded-md bg-muted/40 p-1.5 flex flex-col gap-0.5">
              {hardcodedSubs.map(s => (
                <SubcategoryRow
                  key={s}
                  subKey={s}
                  displayName={getDetailLabel(s)}
                  isCustom={false}
                  onSave={saveDetailLabel}
                  onDelete={deleteDetailLabel}
                />
              ))}
              {customSubs.map(dl => (
                <SubcategoryRow
                  key={dl.cat_detail}
                  subKey={dl.cat_detail}
                  displayName={dl.label}
                  isCustom={true}
                  onSave={saveDetailLabel}
                  onDelete={deleteDetailLabel}
                />
              ))}
              {totalSubCount === 0 && (
                <p className="text-[10px] text-muted-foreground px-2 py-1">No subcategories yet.</p>
              )}
              <AddSubcategoryForm catKey={cat.key} onAdd={saveDetailLabel} />
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className={editingCls}>
      <div className={blockCls}>
        <div className={editRowCls}>
          <label className={labelCls}>Label</label>
          <input className={inputCls} value={label} onChange={e => setLabel(e.target.value)} maxLength={40} />
        </div>
        <div className={editRowCls}>
          <label className={labelCls}>Key</label>
          <span className="text-[11px] text-muted-foreground tracking-[0.5px]">{cat.key}</span>
        </div>
        <div className={editRowCls}>
          <label className={labelCls}>Color</label>
          <ColorPicker value={color} onChange={setColor} />
        </div>
        <div className={editRowCls}>
          <label className={labelCls}>Exclude from totals</label>
          <input type="checkbox" checked={excluded} onChange={e => setExcluded(e.target.checked)} />
        </div>
        <div className="flex gap-2 mt-1">
          <Button size="sm" onClick={handleSave} disabled={saving} className="text-[11px] font-bold">
            {saving ? 'Saving…' : 'Save'}
          </Button>
          <Button size="sm" variant="outline" onClick={handleCancel} className="text-[11px] font-bold">Cancel</Button>
        </div>
      </div>
    </div>
  );
}

// ── AddCategoryForm ───────────────────────────────────────────────────────────
function AddCategoryForm({ onAdd }) {
  const [open, setOpen]         = useState(false);
  const [label, setLabel]       = useState('');
  const [key, setKey]           = useState('');
  const [color, setColor]       = useState(COLOR_PALETTE[0]);
  const [excluded, setExcluded] = useState(false);
  const [saving, setSaving]     = useState(false);
  const [error, setError]       = useState('');

  function deriveKey(lbl) {
    return lbl.trim().toUpperCase().replace(/[^A-Z0-9]+/g, '_').replace(/^_|_$/g, '');
  }

  function handleLabelChange(e) {
    const v = e.target.value;
    setLabel(v);
    setKey(deriveKey(v));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!label.trim()) { setError('Label is required.'); return; }
    if (!key.trim())   { setError('Key is required.');   return; }
    setSaving(true);
    setError('');
    const ok = await onAdd({ key, label: label.trim(), color, excluded });
    setSaving(false);
    if (ok === false) {
      setError('Failed to save. Key may already exist.');
    } else {
      setLabel(''); setKey(''); setColor(COLOR_PALETTE[0]); setExcluded(false);
      setOpen(false);
    }
  }

  if (!open) {
    return <button className={addNewBtnCls} onClick={() => setOpen(true)}>+ Add Category</button>;
  }

  return (
    <form className={addFormCls} onSubmit={handleSubmit}>
      <div className={editRowCls}>
        <label className={labelCls}>Label</label>
        <input className={inputCls} value={label} onChange={handleLabelChange} maxLength={40} placeholder="e.g. Subscriptions" autoFocus />
      </div>
      <div className={editRowCls}>
        <label className={labelCls}>Key (auto)</label>
        <input
          className={inputCls}
          value={key}
          onChange={e => setKey(e.target.value.toUpperCase().replace(/[^A-Z0-9_]/g, ''))}
          maxLength={40}
          placeholder="SUBSCRIPTIONS"
        />
      </div>
      <div className={editRowCls}>
        <label className={labelCls}>Color</label>
        <ColorPicker value={color} onChange={setColor} />
      </div>
      <div className={editRowCls}>
        <label className={labelCls}>Exclude from totals</label>
        <input type="checkbox" checked={excluded} onChange={e => setExcluded(e.target.checked)} />
      </div>
      {error && <p className="text-[11px] text-destructive">{error}</p>}
      <div className="flex gap-2 mt-1">
        <Button size="sm" type="submit" disabled={saving} className="text-[11px] font-bold">
          {saving ? 'Adding…' : 'Add'}
        </Button>
        <Button size="sm" variant="outline" type="button" onClick={() => { setOpen(false); setError(''); }} className="text-[11px] font-bold">
          Cancel
        </Button>
      </div>
    </form>
  );
}

// ── CategoryContent ───────────────────────────────────────────────────────────
export default function CategoryContent() {
  const { categories, loading, saveCategory, deleteCategory, resetToDefaults } = useCategories();
  const [resetting, setResetting] = useState(false);

  async function handleReset() {
    if (!confirm('Reset all categories to defaults? This will delete any custom categories.')) return;
    setResetting(true);
    await resetToDefaults();
    setResetting(false);
  }

  if (loading) return <p className="text-muted-foreground py-6 text-xs">Loading…</p>;

  return (
    <>
      <div className="flex flex-col gap-0.5 mb-5">
        {categories.map(cat => (
          <CategoryRow key={cat.key} cat={cat} onSave={saveCategory} onDelete={deleteCategory} />
        ))}
      </div>

      <AddCategoryForm onAdd={saveCategory} />

      <div className="border-t border-border pt-5">
        <Button
          variant="outline"
          size="sm"
          onClick={handleReset}
          disabled={resetting}
          className="border-destructive text-destructive hover:bg-destructive/10 hover:text-destructive text-[11px] font-bold"
        >
          {resetting ? 'Resetting…' : 'Reset to Defaults'}
        </Button>
      </div>
    </>
  );
}
