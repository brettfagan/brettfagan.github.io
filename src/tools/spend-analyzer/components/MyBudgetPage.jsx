import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { useCategories } from '../context/CategoriesContext';
import { SUBCATEGORIES } from '../lib/constants';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

// Build a composite key for a budget item
function itemKey(category, subcategory) {
  return subcategory ? `${category}::${subcategory}` : category;
}

function parseKey(key) {
  const idx = key.indexOf('::');
  if (idx === -1) return { category: key, subcategory: '' };
  return { category: key.slice(0, idx), subcategory: key.slice(idx + 2) };
}

// Format a subcategory key to a human-readable label, handling all category prefixes
function fmtSubcat(key) {
  if (!key) return '';
  for (const prefix of Object.keys(SUBCATEGORIES)) {
    if (key.startsWith(prefix + '_')) {
      const stripped = key.slice(prefix.length + 1);
      return stripped.replace(/_/g, ' ').replace(/\b\w/g, x => x.toUpperCase());
    }
  }
  return key.replace(/_/g, ' ').replace(/\b\w/g, x => x.toUpperCase());
}

// ── Shared class strings ──────────────────────────────────────────────────────
const rowColsCls  = "grid grid-cols-[20px_1fr_172px_164px] gap-x-3 items-center px-4";
const amountWrapCls = "flex items-center bg-muted border border-border rounded px-2 w-[140px] transition-colors focus-within:border-primary";
const amountInputCls = "bg-transparent border-0 outline-none font-mono text-xs text-foreground w-full text-right py-[7px] pl-1 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none placeholder:text-muted-foreground";
const rowActionsCls = "flex items-center justify-end gap-0.5";
const iconBtnCls  = "flex items-center gap-1 bg-transparent border-0 cursor-pointer font-mono text-[11px] font-semibold text-muted-foreground px-[7px] py-[5px] rounded-[3px] transition-colors hover:bg-muted hover:text-foreground whitespace-nowrap";
const deleteBtnCls = `${iconBtnCls} text-lg font-light leading-none px-[7px] py-1 hover:text-destructive`;

export default function MyBudgetPage() {
  const { user } = useAuth();
  const { categories, getCatColor, getCatLabel } = useCategories();

  // budgetMap: key -> { amount: string, hidden: boolean }
  const [budgetMap, setBudgetMap] = useState({});
  // Set of category keys whose subcategories are currently shown
  const [expanded, setExpanded] = useState(new Set());
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [error, setError] = useState(null);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [showHidden, setShowHidden] = useState(false);
  const [confirmModal, setConfirmModal] = useState(null); // { key, label }

  useEffect(() => {
    if (!user) return;
    load();
  }, [user]);

  async function load() {
    setLoading(true);
    setError(null);
    const { data, error } = await supabase
      .from('budget_items')
      .select('category, subcategory, amount, hidden')
      .eq('user_id', user.id);
    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }
    const map = {};
    for (const row of data || []) {
      const key = itemKey(row.category, row.subcategory);
      map[key] = {
        amount: row.amount != null ? String(row.amount) : '',
        hidden: row.hidden || false,
      };
    }
    setBudgetMap(map);
    setLoading(false);
  }

  function getItem(key) {
    return budgetMap[key] ?? { amount: '', hidden: false };
  }

  function setAmount(key, value) {
    setBudgetMap(prev => ({
      ...prev,
      [key]: { ...(prev[key] ?? { hidden: false }), amount: value },
    }));
    setDirty(true);
  }

  function requestHide(key, label) {
    setConfirmModal({ key, label });
  }

  function confirmHide() {
    if (!confirmModal) return;
    const { key } = confirmModal;
    setBudgetMap(prev => ({ ...prev, [key]: { amount: '', hidden: true } }));
    // Collapse the category if it was expanded
    if (!key.includes('::')) {
      setExpanded(prev => {
        const next = new Set(prev);
        next.delete(key);
        return next;
      });
    }
    setDirty(true);
    setConfirmModal(null);
  }

  function restoreItem(key) {
    setBudgetMap(prev => ({
      ...prev,
      [key]: { ...(prev[key] ?? { amount: '' }), hidden: false },
    }));
    setDirty(true);
  }

  function toggleExpanded(catKey) {
    setExpanded(prev => {
      const next = new Set(prev);
      if (next.has(catKey)) next.delete(catKey);
      else next.add(catKey);
      return next;
    });
  }

  async function handleSave() {
    setSaving(true);
    setSaveSuccess(false);
    setError(null);

    const rows = [];
    for (const [key, { amount, hidden }] of Object.entries(budgetMap)) {
      // Skip visible items with no amount — nothing meaningful to persist
      if (!hidden && amount === '') continue;
      const { category, subcategory } = parseKey(key);
      rows.push({
        user_id: user.id,
        category,
        subcategory,
        amount: hidden ? null : (amount !== '' ? parseFloat(amount) : null),
        hidden,
      });
    }

    // Replace all budget items for this user atomically
    const { error: delErr } = await supabase
      .from('budget_items')
      .delete()
      .eq('user_id', user.id);
    if (delErr) { setError(delErr.message); setSaving(false); return; }

    if (rows.length > 0) {
      const { error: insErr } = await supabase.from('budget_items').insert(rows);
      if (insErr) { setError(insErr.message); setSaving(false); return; }
    }

    setSaving(false);
    setDirty(false);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 2500);
  }

  const visibleCategories = categories.filter(c => !getItem(c.key).hidden);
  const hiddenItems = Object.entries(budgetMap)
    .filter(([, v]) => v.hidden)
    .map(([key]) => key);

  return (
    <>
      {/* ── Page heading ──────────────────────────────────────────────── */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h2 className="font-mono text-[22px] font-extrabold tracking-[-0.3px] text-foreground">My Budget</h2>
          <p className="text-xs text-muted-foreground mt-1">Set monthly spending targets for each category.</p>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          {saveSuccess && <span className="text-xs font-bold text-emerald-600">Saved!</span>}
          {error && <span className="text-[11px] text-destructive max-w-55">{error}</span>}
          <Button
            onClick={handleSave}
            disabled={saving || !dirty}
            className="font-mono text-[11px] font-bold"
          >
            {saving ? 'Saving…' : 'Save Budget'}
          </Button>
        </div>
      </div>

      {loading && (
        <div className="py-12 text-center text-muted-foreground text-[13px]">Loading…</div>
      )}

      {!loading && (
        <>
          {/* ── Column headers ────────────────────────────────────────── */}
          <div className={`${rowColsCls} pb-1.5 text-[10px] font-bold uppercase tracking-[1px] text-muted-foreground`}>
            <div />
            <div>Category</div>
            <div className="text-right">Monthly Budget</div>
            <div />
          </div>

          {/* ── Category list ─────────────────────────────────────────── */}
          <div className="flex flex-col gap-1">
            {visibleCategories.map(cat => {
              const catKey = cat.key;
              const catItem = getItem(catKey);
              const isExpanded = expanded.has(catKey);
              const subcats = SUBCATEGORIES[catKey] || [];
              const visibleSubcats = subcats.filter(
                s => !getItem(itemKey(catKey, s)).hidden
              );

              return (
                <div key={catKey} className="border border-border rounded-md overflow-hidden">
                  {/* Category row */}
                  <div className={`${rowColsCls} bg-background min-h-11`}>
                    <div
                      className="w-2.5 h-2.5 rounded-full shrink-0"
                      style={{ background: getCatColor(catKey) }}
                    />
                    <div className="text-[13px] font-semibold">{getCatLabel(catKey)}</div>
                    <div className="flex justify-end">
                      <div className={amountWrapCls}>
                        <span className="text-xs text-muted-foreground shrink-0 select-none">$</span>
                        <input
                          type="number"
                          className={amountInputCls}
                          min="0"
                          step="0.01"
                          placeholder="—"
                          value={catItem.amount}
                          onChange={e => setAmount(catKey, e.target.value)}
                        />
                      </div>
                    </div>
                    <div className={rowActionsCls}>
                      {subcats.length > 0 && (
                        <button
                          className={iconBtnCls}
                          onClick={() => toggleExpanded(catKey)}
                          title={isExpanded ? 'Collapse subcategories' : 'Expand subcategories'}
                        >
                          <span className={`inline-block text-[14px] transition-transform duration-200${isExpanded ? ' rotate-90' : ''}`}>›</span>
                          <span className="text-[10px] uppercase tracking-[0.5px]">
                            {isExpanded ? 'Less' : 'Subcategories'}
                          </span>
                        </button>
                      )}
                      <button
                        className={deleteBtnCls}
                        onClick={() => requestHide(catKey, getCatLabel(catKey))}
                        title="Remove from budget"
                      >
                        ×
                      </button>
                    </div>
                  </div>

                  {/* Subcategory rows */}
                  {isExpanded && (
                    <div>
                      {visibleSubcats.map(sub => {
                        const subKey = itemKey(catKey, sub);
                        const subItem = getItem(subKey);
                        return (
                          <div key={subKey} className={`${rowColsCls} bg-muted border-t border-border min-h-11`}>
                            <div />
                            <div className="text-xs text-muted-foreground pl-2.5">{fmtSubcat(sub)}</div>
                            <div className="flex justify-end">
                              <div className={amountWrapCls}>
                                <span className="text-xs text-muted-foreground shrink-0 select-none">$</span>
                                <input
                                  type="number"
                                  className={amountInputCls}
                                  min="0"
                                  step="0.01"
                                  placeholder="—"
                                  value={subItem.amount}
                                  onChange={e => setAmount(subKey, e.target.value)}
                                />
                              </div>
                            </div>
                            <div className={rowActionsCls}>
                              <button
                                className={deleteBtnCls}
                                onClick={() =>
                                  requestHide(
                                    subKey,
                                    `${getCatLabel(catKey)} › ${fmtSubcat(sub)}`
                                  )
                                }
                                title="Remove from budget"
                              >
                                ×
                              </button>
                            </div>
                          </div>
                        );
                      })}

                      {visibleSubcats.length === 0 && (
                        <div className={`${rowColsCls} bg-muted border-t border-border min-h-11`}>
                          <div />
                          <div className="col-span-3 text-[11px] text-muted-foreground italic">
                            All subcategories hidden.
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* ── Hidden items ──────────────────────────────────────────── */}
          {hiddenItems.length > 0 && (
            <div className="mt-4 pt-4 border-t border-border">
              <button
                className="flex items-center gap-1.5 bg-transparent border-0 cursor-pointer font-mono text-[11px] font-bold uppercase tracking-[0.5px] text-muted-foreground p-0 hover:text-foreground transition-colors"
                onClick={() => setShowHidden(p => !p)}
              >
                <span className={`inline-block text-[14px] transition-transform duration-200${showHidden ? ' rotate-90' : ''}`}>›</span>
                Hidden ({hiddenItems.length})
              </button>
              {showHidden && (
                <div className="mt-2.5 flex flex-col">
                  {hiddenItems.map(key => {
                    const { category, subcategory } = parseKey(key);
                    const label = subcategory
                      ? `${getCatLabel(category)} › ${fmtSubcat(subcategory)}`
                      : getCatLabel(category);
                    return (
                      <div key={key} className="flex items-center justify-between py-2 text-xs text-muted-foreground border-b border-border last:border-b-0">
                        <span>{label}</span>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => restoreItem(key)}
                          className="font-mono text-[10px] font-bold py-1 px-2.5 h-auto"
                        >
                          Restore
                        </Button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </>
      )}

      {/* ── Confirmation modal ────────────────────────────────────────── */}
      <Dialog open={!!confirmModal} onOpenChange={open => { if (!open) setConfirmModal(null); }}>
        <DialogContent className="w-90 max-w-[calc(100vw-32px)]">
          <DialogHeader>
            <DialogTitle className="text-sm font-bold">
              Remove <strong>{confirmModal?.label}</strong> from your budget?
            </DialogTitle>
            <DialogDescription>
              You can restore it from the Hidden section at the bottom of the page.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex gap-2.5 justify-end">
            <Button variant="outline" onClick={() => setConfirmModal(null)} className="font-mono text-[11px] font-bold">
              Cancel
            </Button>
            <Button variant="destructive" onClick={confirmHide} className="font-mono text-[11px] font-bold">
              Remove
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
