import { useState } from 'react';
import { useCategories, COLOR_PALETTE } from '../context/CategoriesContext';
import { fmtDetail } from '../lib/format';
import { SUBCATEGORIES } from '../lib/constants';
import CsvRulesManager from './CsvRulesManager';
import { Sheet, SheetContent, SheetTitle, SheetClose } from '@/components/ui/sheet';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';

// ── Shared class strings ──────────────────────────────────────────────────────
const rowCls      = "grid grid-cols-[18px_1fr_auto_auto_auto_auto] items-center gap-2.5 px-2.5 py-2 rounded-md border border-transparent hover:bg-muted hover:border-border transition-colors";
const editingCls  = "bg-muted border border-border rounded-md py-3.5 px-4";
const blockCls    = "flex flex-col gap-2.5";
const editRowCls  = "flex items-center gap-2.5";
const labelCls    = "text-[10px] font-bold tracking-[1px] uppercase text-muted-foreground w-30 shrink-0";
const inputCls    = "flex-1 bg-background border border-border rounded font-mono text-xs text-foreground py-1.5 px-2.5 outline-none focus:border-primary transition-colors";
const iconBtnCls  = "bg-transparent border-0 cursor-pointer text-[13px] text-muted-foreground p-0.5 px-1.5 rounded leading-none hover:text-primary hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors";
const dangerBtnCls = "bg-transparent border-0 cursor-pointer text-[13px] text-muted-foreground p-0.5 px-1.5 rounded leading-none hover:text-destructive hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors";
const addNewBtnCls = "w-full border border-dashed border-border rounded font-mono text-[11px] font-bold text-muted-foreground py-2 px-3 bg-transparent cursor-pointer tracking-[0.5px] mb-6 hover:text-primary hover:border-primary hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors";
const addFormCls  = "bg-muted border border-border rounded-lg p-4 flex flex-col gap-2.5 mb-6";

// ── ColorPicker ───────────────────────────────────────────────────────────────
function ColorPicker({ value, onChange }) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {COLOR_PALETTE.map(c => (
        <button
          key={c}
          type="button"
          className={`w-[22px] h-[22px] rounded-[4px] border-2 cursor-pointer p-0 outline-none transition-transform duration-[120ms] hover:scale-[1.18] ${
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

// ── CategoryRow ───────────────────────────────────────────────────────────────
function CategoryRow({ cat, onSave, onDelete }) {
  const [editing, setEditing]     = useState(false);
  const [label, setLabel]         = useState(cat.label);
  const [color, setColor]         = useState(cat.color);
  const [excluded, setExcluded]   = useState(cat.excluded);
  const [saving, setSaving]       = useState(false);
  const [subOpen, setSubOpen]     = useState(false);

  const subs = SUBCATEGORIES[cat.key] || [];

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
        {subs.length > 0 && (
          <div className="px-2.5 pb-1.5 pl-[38px]">
            <button
              className="bg-transparent border-0 cursor-pointer font-mono text-[10px] text-muted-foreground p-0 tracking-[0.3px] hover:text-foreground transition-colors"
              onClick={() => setSubOpen(o => !o)}
            >
              {subOpen ? '▼' : '▶'} {subs.length} subcategories
            </button>
            {subOpen && (
              <div className="flex flex-wrap gap-1 mt-1.5">
                {subs.map(s => (
                  <span
                    key={s}
                    className="text-[10px] font-mono text-muted-foreground bg-muted border border-border rounded-[3px] px-1.5 py-0.5 whitespace-nowrap"
                  >
                    {fmtDetail(s)}
                  </span>
                ))}
              </div>
            )}
          </div>
        )}
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
          <Button size="sm" onClick={handleSave} disabled={saving} className="font-mono text-[11px] font-bold">
            {saving ? 'Saving…' : 'Save'}
          </Button>
          <Button size="sm" variant="outline" onClick={handleCancel} className="font-mono text-[11px] font-bold">Cancel</Button>
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
        <Button size="sm" type="submit" disabled={saving} className="font-mono text-[11px] font-bold">
          {saving ? 'Adding…' : 'Add'}
        </Button>
        <Button size="sm" variant="outline" type="button" onClick={() => { setOpen(false); setError(''); }} className="font-mono text-[11px] font-bold">
          Cancel
        </Button>
      </div>
    </form>
  );
}

// ── CategoryManager (slide-out panel) ────────────────────────────────────────
export default function CategoryManager({ open, onClose }) {
  const { categories, loading, saveCategory, deleteCategory, resetToDefaults } = useCategories();
  const [resetting, setResetting] = useState(false);
  const [activeTab, setActiveTab] = useState('categories');

  async function handleReset() {
    if (!confirm('Reset all categories to defaults? This will delete any custom categories.')) return;
    setResetting(true);
    await resetToDefaults();
    setResetting(false);
  }

  const triggerCls = "rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:text-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none bg-transparent font-mono text-[11px] font-bold tracking-[0.5px] uppercase px-4 py-2.5 mb-[-1px] text-muted-foreground hover:text-foreground transition-colors";

  return (
    <Sheet open={open} onOpenChange={o => { if (!o) onClose(); }}>
      <SheetContent
        side="right"
        showCloseButton={false}
        className="w-120 max-w-[95vw] p-0 gap-0 flex flex-col"
      >
        {/* ── Header ─────────────────────────────────────────────────────── */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-border shrink-0">
          <SheetTitle className="text-base font-extrabold tracking-tight">
            {activeTab === 'categories' ? 'Manage Categories' : 'CSV Rules'}
          </SheetTitle>
          <SheetClose asChild>
            <button
              className="bg-transparent border-0 cursor-pointer text-muted-foreground text-lg px-2 py-1 leading-none rounded hover:text-foreground hover:bg-muted transition-colors"
              title="Close"
            >✕</button>
          </SheetClose>
        </div>

        {/* ── Tabs ───────────────────────────────────────────────────────── */}
        <Tabs
          value={activeTab}
          onValueChange={setActiveTab}
          className="flex flex-col flex-1 min-h-0"
        >
          <TabsList className="px-6 h-auto rounded-none border-b border-border bg-transparent justify-start gap-0 p-0 shrink-0">
            <TabsTrigger value="categories" className={triggerCls}>Categories</TabsTrigger>
            <TabsTrigger value="rules" className={triggerCls}>CSV Rules</TabsTrigger>
          </TabsList>

          <TabsContent value="categories" className="flex-1 overflow-y-auto px-6 py-4 pb-8 mt-0 data-[state=inactive]:hidden">
            {loading ? (
              <p className="text-muted-foreground py-6 text-xs">Loading…</p>
            ) : (
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
                    className="border-destructive text-destructive hover:bg-destructive/10 hover:text-destructive font-mono text-[11px] font-bold"
                  >
                    {resetting ? 'Resetting…' : 'Reset to Defaults'}
                  </Button>
                </div>
              </>
            )}
          </TabsContent>

          <TabsContent value="rules" className="flex-1 overflow-y-auto px-6 py-4 pb-8 mt-0 data-[state=inactive]:hidden">
            <CsvRulesManager />
          </TabsContent>
        </Tabs>
      </SheetContent>
    </Sheet>
  );
}
