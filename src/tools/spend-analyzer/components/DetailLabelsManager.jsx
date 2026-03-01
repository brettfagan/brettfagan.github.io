import { useState } from 'react';
import { useDetailLabels } from '../context/DetailLabelsContext';
import { fmtDetail } from '../lib/format';
import { Button } from '@/components/ui/button';

// ── Shared class strings ──────────────────────────────────────────────────────
const editingCls  = "bg-muted border border-border rounded-md py-3.5 px-4";
const blockCls    = "flex flex-col gap-2.5";
const editRowCls  = "flex items-center gap-2.5";
const labelCls    = "text-[10px] font-bold tracking-[1px] uppercase text-muted-foreground w-30 shrink-0";
const inputCls    = "flex-1 bg-background border border-border rounded text-xs text-foreground py-1.5 px-2.5 outline-none focus:border-primary transition-colors";
const iconBtnCls  = "bg-transparent border-0 cursor-pointer text-[13px] text-muted-foreground p-0.5 px-1.5 rounded leading-none hover:text-primary hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors";
const dangerBtnCls = "bg-transparent border-0 cursor-pointer text-[13px] text-muted-foreground p-0.5 px-1.5 rounded leading-none hover:text-destructive hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors";
const addNewBtnCls = "w-full border border-dashed border-border rounded text-[11px] font-bold text-muted-foreground py-2 px-3 bg-transparent cursor-pointer tracking-[0.5px] mb-6 hover:text-primary hover:border-primary hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors";
const addFormCls  = "bg-muted border border-border rounded-lg p-4 flex flex-col gap-2.5 mb-6";

// ── DetailLabelRow ────────────────────────────────────────────────────────────
function DetailLabelRow({ entry, onSave, onDelete }) {
  const [editing, setEditing] = useState(false);
  const [label, setLabel]     = useState(entry.label);
  const [saving, setSaving]   = useState(false);

  async function handleSave() {
    if (!label.trim()) return;
    setSaving(true);
    await onSave(entry.cat_detail, label.trim());
    setSaving(false);
    setEditing(false);
  }

  function handleCancel() {
    setLabel(entry.label);
    setEditing(false);
  }

  if (!editing) {
    return (
      <div className="grid grid-cols-[1fr_auto_auto_auto] items-center gap-2.5 px-2.5 py-2 rounded-md border border-transparent hover:bg-muted hover:border-border transition-colors">
        <div className="flex items-center gap-2 min-w-0 overflow-hidden">
          <span className="text-[10px] text-muted-foreground tracking-[0.3px] whitespace-nowrap overflow-hidden text-ellipsis">{entry.cat_detail}</span>
          <span className="text-[11px] text-muted-foreground shrink-0">→</span>
          <span className="text-xs font-semibold overflow-hidden text-ellipsis whitespace-nowrap">{entry.label}</span>
        </div>
        <span className="text-[10px] text-muted-foreground whitespace-nowrap shrink-0 opacity-70">(was: {fmtDetail(entry.cat_detail)})</span>
        <button className={iconBtnCls} onClick={() => setEditing(true)} title="Edit">✎</button>
        <button className={dangerBtnCls} onClick={() => onDelete(entry.cat_detail)} title="Delete">✕</button>
      </div>
    );
  }

  return (
    <div className={editingCls}>
      <div className={blockCls}>
        <div className={editRowCls}>
          <label className={labelCls}>Key</label>
          <span className="text-[11px] text-muted-foreground tracking-[0.5px]">{entry.cat_detail}</span>
        </div>
        <div className={editRowCls}>
          <label className={labelCls}>Display label</label>
          <input
            className={inputCls}
            value={label}
            onChange={e => setLabel(e.target.value)}
            maxLength={60}
            autoFocus
          />
        </div>
        <div className="flex gap-2 mt-1">
          <Button size="sm" onClick={handleSave} disabled={saving || !label.trim()} className="text-[11px] font-bold">
            {saving ? 'Saving…' : 'Save'}
          </Button>
          <Button size="sm" variant="outline" onClick={handleCancel} className="text-[11px] font-bold">Cancel</Button>
        </div>
      </div>
    </div>
  );
}

// ── AddDetailLabelForm ────────────────────────────────────────────────────────
function AddDetailLabelForm({ onAdd }) {
  const [open, setOpen]           = useState(false);
  const [catDetail, setCatDetail] = useState('');
  const [label, setLabel]         = useState('');
  const [saving, setSaving]       = useState(false);
  const [error, setError]         = useState('');
  const [labelTouched, setLabelTouched] = useState(false);

  function handleKeyChange(val) {
    const upper = val.toUpperCase().replace(/[^A-Z0-9_]/g, '');
    setCatDetail(upper);
    if (!labelTouched) setLabel(fmtDetail(upper));
  }

  function handleLabelChange(val) {
    setLabel(val);
    setLabelTouched(true);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!catDetail.trim()) { setError('Key is required.'); return; }
    if (!label.trim())     { setError('Display label is required.'); return; }
    setSaving(true);
    setError('');
    const ok = await onAdd(catDetail.trim(), label.trim());
    setSaving(false);
    if (ok === false) {
      setError('Failed to save. This key may already have a custom label.');
    } else {
      setCatDetail(''); setLabel(''); setLabelTouched(false); setOpen(false);
    }
  }

  if (!open) {
    return <button className={addNewBtnCls} onClick={() => setOpen(true)}>+ Add Subcategory Label</button>;
  }

  return (
    <form className={addFormCls} onSubmit={handleSubmit}>
      <div className={editRowCls}>
        <label className={labelCls}>Detail key</label>
        <input
          className={inputCls}
          value={catDetail}
          onChange={e => handleKeyChange(e.target.value)}
          maxLength={80}
          placeholder="FOOD_AND_DRINK_GROCERIES"
          spellCheck={false}
          autoFocus
        />
      </div>
      <p className="text-[11px] text-muted-foreground leading-[1.6] mt-1 mb-2 ml-32.5">
        Type the raw key exactly as it appears in your Plaid or CSV data —
        visible in the Subcategory column of your transactions.
      </p>
      <div className={editRowCls}>
        <label className={labelCls}>Display label</label>
        <input
          className={inputCls}
          value={label}
          onChange={e => handleLabelChange(e.target.value)}
          maxLength={60}
          placeholder="Weekly Groceries"
        />
      </div>
      {error && <p className="text-[11px] text-destructive">{error}</p>}
      <div className="flex gap-2 mt-1">
        <Button size="sm" type="submit" disabled={saving} className="text-[11px] font-bold">
          {saving ? 'Adding…' : 'Add Label'}
        </Button>
        <Button
          size="sm"
          variant="outline"
          type="button"
          onClick={() => { setOpen(false); setError(''); setCatDetail(''); setLabel(''); setLabelTouched(false); }}
          className="text-[11px] font-bold"
        >
          Cancel
        </Button>
      </div>
    </form>
  );
}

// ── DetailLabelsManager ───────────────────────────────────────────────────────
export default function DetailLabelsManager() {
  const { detailLabels, loading, saveDetailLabel, deleteDetailLabel } = useDetailLabels();

  if (loading) return <p className="text-muted-foreground py-6 text-xs">Loading…</p>;

  return (
    <>
      <p className="text-[11px] text-muted-foreground leading-[1.7] mb-4 px-3 py-2.5 bg-muted rounded-md border border-border">
        Give any subcategory key a custom display name. The key must match exactly
        what appears in your Plaid or CSV data. Changes apply everywhere in the app.
      </p>

      <div className="flex flex-col gap-0.5 mb-5">
        {detailLabels.length === 0 ? (
          <p className="text-muted-foreground py-6 text-xs">No custom labels yet. Add one below.</p>
        ) : (
          detailLabels.map(entry => (
            <DetailLabelRow
              key={entry.id}
              entry={entry}
              onSave={saveDetailLabel}
              onDelete={deleteDetailLabel}
            />
          ))
        )}
      </div>

      <AddDetailLabelForm onAdd={saveDetailLabel} />
    </>
  );
}
