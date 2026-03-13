import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { useCategories } from '../context/CategoriesContext';
import { SUBCATEGORIES, EXCLUDED } from '../lib/constants';
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
const amountInputCls = "bg-transparent border-0 outline-none text-xs text-foreground w-full text-right py-[7px] pl-1 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none placeholder:text-muted-foreground";
const rowActionsCls = "flex items-center justify-end gap-0.5";
const iconBtnCls  = "flex items-center gap-1 bg-transparent border-0 cursor-pointer text-[11px] font-semibold text-muted-foreground px-[7px] py-[5px] rounded-[3px] transition-colors hover:bg-muted hover:text-foreground whitespace-nowrap";
const deleteBtnCls = `${iconBtnCls} text-lg font-light leading-none px-[7px] py-1 hover:text-destructive`;

export default function MyBudgetPage({ demoTransactions = null }) {
  const { user } = useAuth();
  const { categories, getCatColor, getCatLabel } = useCategories();
  const isDemo = demoTransactions !== null;

  // budgetMap: key -> { amount: string, hidden: boolean }
  const [budgetMap, setBudgetMap] = useState({});
  // Set of category keys whose subcategories are currently shown
  const [expanded, setExpanded] = useState(new Set());
  const [loading, setLoading] = useState(!isDemo); // demo mode starts ready
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [error, setError] = useState(null);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [showHidden, setShowHidden] = useState(false);
  const [confirmModal, setConfirmModal] = useState(null); // { key, label }
  const [totalBudget, setTotalBudget] = useState('');
  const [editingTotal, setEditingTotal] = useState(true);
  const [autoPopModal, setAutoPopModal] = useState(false);
  const [autoPopMode, setAutoPopMode] = useState('3'); // '3' | '6' | 'custom'
  const [autoPopCustom, setAutoPopCustom] = useState('12');
  const [autoPopulating, setAutoPopulating] = useState(false);

  useEffect(() => {
    if (isDemo) return; // demo mode: no DB load
    if (!user) return;
    load();
  }, [user, isDemo]);

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
      if (row.category === '__total__') {
        if (row.amount != null) {
          setTotalBudget(String(row.amount));
          setEditingTotal(false);
        }
        continue;
      }
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
    // Persist the total budget amount as a special sentinel row
    if (totalBudget !== '') {
      rows.push({
        user_id: user.id,
        category: '__total__',
        subcategory: '',
        amount: parseFloat(totalBudget),
        hidden: false,
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
    if (totalBudget !== '') setEditingTotal(false);
    setTimeout(() => setSaveSuccess(false), 2500);
  }

  async function handleAutoPopulate() {
    const months = autoPopMode === 'custom' ? Math.max(1, parseInt(autoPopCustom) || 1) : parseInt(autoPopMode);
    setAutoPopulating(true);
    setError(null);

    let txData;

    if (isDemo) {
      // Demo mode: always use the 3 most recent months of demo data regardless
      // of the user's month-picker selection (modal is bypassed for demo).
      const allMonths = [...new Set(demoTransactions.map(t => t.date.slice(0, 7)))].sort().reverse();
      const recentMonths = new Set(allMonths.slice(0, 3));
      txData = demoTransactions.filter(t => recentMonths.has(t.date.slice(0, 7)));
      setAutoPopulating(false);
    } else {
      // Date range: last N complete calendar months (exclude current month-in-progress)
      const now = new Date();
      const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
      const rangeStart = new Date(currentMonthStart);
      rangeStart.setMonth(rangeStart.getMonth() - months);
      // Format using local date parts to avoid UTC shift in positive-offset timezones
      const pad = n => String(n).padStart(2, '0');
      const toDateStr = d => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
      const startStr = toDateStr(rangeStart);
      // End = last day of previous month (subtract one day in local time)
      const rangeEnd = new Date(currentMonthStart);
      rangeEnd.setDate(rangeEnd.getDate() - 1);
      const endStr = toDateStr(rangeEnd);

      const { data, error: fetchErr } = await supabase
        .from('imported_transactions')
        .select('cat, amount')
        .eq('user_id', user.id)
        .gte('date', startStr)
        .lte('date', endStr);

      setAutoPopulating(false);
      if (fetchErr) { setError(fetchErr.message); return; }
      txData = data;
    }

    // Sum spending per category (positive amounts = spending), skip excluded cats
    const catTotals = {};
    const monthSet = new Set();
    for (const tx of txData || []) {
      if (!tx.cat || EXCLUDED.includes(tx.cat)) continue;
      if ((tx.amount || 0) <= 0) continue;
      catTotals[tx.cat] = (catTotals[tx.cat] || 0) + tx.amount;
      if (isDemo && tx.date) monthSet.add(tx.date.slice(0, 7));
    }

    if (Object.keys(catTotals).length === 0) {
      setError(`No spending data found for the last ${months} month${months !== 1 ? 's' : ''}.`);
      setAutoPopModal(false);
      return;
    }

    // In demo mode txData was already sliced to the 3 most recent months, so
    // divide by the actual number of distinct months in that slice.
    const effectiveMonths = isDemo ? (monthSet.size || 1) : months;

    // Average over N months, round to 2 decimal places.
    // Skip hidden categories and any cat key not present in the user's category list
    // (deleted/renamed cats would otherwise create invisible phantom budget rows).
    const knownCatKeys = new Set(categories.map(c => c.key));
    setBudgetMap(prev => {
      const next = { ...prev };
      for (const [cat, total] of Object.entries(catTotals)) {
        if (!knownCatKeys.has(cat)) continue;
        const existing = next[cat] ?? { amount: '', hidden: false };
        if (existing.hidden) continue;
        const avg = Math.round((total / effectiveMonths) * 100) / 100;
        next[cat] = { ...existing, amount: String(avg) };
      }
      return next;
    });

    setDirty(true);
    setAutoPopModal(false);
  }

  const visibleCategories = categories.filter(c => !getItem(c.key).hidden);
  const hiddenItems = Object.entries(budgetMap)
    .filter(([, v]) => v.hidden)
    .map(([key]) => key);

  // Sum of all non-hidden amounts entered across categories and subcategories.
  // Also exclude subcategory rows whose parent category is hidden, since hiding
  // a category only marks the category key itself — subcategory entries keep
  // hidden: false but are no longer visible or meaningful.
  const budgetedTotal = Object.entries(budgetMap)
    .filter(([key, v]) => {
      if (v.hidden || v.amount === '') return false;
      const { category } = parseKey(key);
      if (key.includes('::') && getItem(category).hidden) return false;
      return true;
    })
    .reduce((sum, [, v]) => sum + parseFloat(v.amount || 0), 0);

  const remaining = totalBudget !== '' ? parseFloat(totalBudget) - budgetedTotal : null;

  return (
    <>
      {/* ── Page heading ──────────────────────────────────────────────── */}
      <div className="mb-6">
        <h2 className="text-[22px] font-extrabold tracking-[-0.3px] text-foreground">My Budget</h2>
        <p className="text-xs text-muted-foreground mt-1">Set monthly spending targets for each category.</p>
      </div>

      {loading && (
        <div className="py-12 text-center text-muted-foreground text-[13px]">Loading…</div>
      )}

      {!loading && (
        <div className="flex items-start gap-6">
          {/* ── Left: category list ───────────────────────────────────── */}
          <div className="flex-1 min-w-0 bg-card rounded-lg border border-border p-4">
            {/* ── Column headers ──────────────────────────────────────── */}
            <div className={`${rowColsCls} pb-1.5 text-[10px] font-bold uppercase tracking-[1px] text-muted-foreground`}>
              <div />
              <div>Category</div>
              <div className="text-right">Monthly Budget</div>
              <div />
            </div>

            {/* ── Category list ───────────────────────────────────────── */}
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
                    <div className={`${rowColsCls} bg-card min-h-11`}>
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

            {/* ── Hidden items ────────────────────────────────────────── */}
            {hiddenItems.length > 0 && (
              <div className="mt-4 pt-4 border-t border-border">
                <button
                  className="flex items-center gap-1.5 bg-transparent border-0 cursor-pointer text-[11px] font-bold uppercase tracking-[0.5px] text-muted-foreground p-0 hover:text-foreground transition-colors"
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
                            className="text-[10px] font-bold py-1 px-2.5 h-auto"
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
          </div>

          {/* ── Right: budget summary card ────────────────────────────── */}
          <div className="w-56 shrink-0 flex flex-col">
            {/* Invisible spacer matches column header height so card aligns with table body */}
            <div className="pb-1.5 text-[10px] invisible select-none" aria-hidden="true">X</div>
            <div className="sticky top-4">
            <div className="border border-border rounded-lg bg-card p-4 flex flex-col gap-4">
              {/* Total Budget Amount */}
              <div className="flex flex-col gap-1.5">
                <span className="text-[10px] font-bold uppercase tracking-[1px] text-muted-foreground">
                  Total Budget
                </span>
                {editingTotal ? (
                  <div className={amountWrapCls}>
                    <span className="text-xs text-muted-foreground shrink-0 select-none">$</span>
                    <input
                      type="number"
                      className={amountInputCls}
                      min="0"
                      step="0.01"
                      placeholder="—"
                      value={totalBudget}
                      onChange={e => { setTotalBudget(e.target.value); setDirty(true); }}
                      autoFocus
                    />
                  </div>
                ) : (
                  <div className="flex items-baseline gap-2">
                    <span className="text-sm font-bold text-foreground">
                      ${parseFloat(totalBudget).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                    <button
                      className="text-[10px] text-muted-foreground hover:text-foreground transition-colors bg-transparent border-0 cursor-pointer p-0 underline underline-offset-2"
                      onClick={() => setEditingTotal(true)}
                    >
                      Edit
                    </button>
                  </div>
                )}
              </div>

              {/* Divider */}
              <div className="border-t border-border" />

              {/* Budgeted total */}
              <div className="flex flex-col gap-1">
                <span className="text-[10px] font-bold uppercase tracking-[1px] text-muted-foreground">Budgeted</span>
                <span className="text-sm font-bold text-foreground">
                  ${budgetedTotal.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              </div>

              {/* Remaining (only shown when total is set) */}
              {remaining !== null && (
                <div className="flex flex-col gap-1">
                  <span className="text-[10px] font-bold uppercase tracking-[1px] text-muted-foreground">Remaining</span>
                  <span className={`text-sm font-bold ${remaining < 0 ? 'text-destructive' : 'text-emerald-600'}`}>
                    ${Math.abs(remaining).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    {remaining < 0 ? ' over' : ''}
                  </span>
                </div>
              )}

              {/* Auto-populate — demo skips the modal and always uses 3 months */}
              <button
                className="text-[10px] text-muted-foreground hover:text-foreground transition-colors bg-transparent border-0 cursor-pointer p-0 text-left underline underline-offset-2"
                onClick={() => isDemo ? handleAutoPopulate() : setAutoPopModal(true)}
              >
                Auto-populate from spending
              </button>

              {/* Feedback */}
              {!isDemo && saveSuccess && <span className="text-xs font-bold text-emerald-600">Saved!</span>}
              {error && <span className="text-[11px] text-destructive">{error}</span>}

              {/* Save button — hidden in demo mode */}
              {isDemo ? (
                <p className="text-[11px] text-muted-foreground text-center leading-relaxed">
                  Sign in to save your budget.
                </p>
              ) : (
                <Button
                  onClick={handleSave}
                  disabled={saving || !dirty}
                  className="w-full text-[11px] font-bold"
                >
                  {saving ? 'Saving…' : 'Save Budget'}
                </Button>
              )}
            </div>
          </div>
          </div>
        </div>
      )}

      {/* ── Auto-populate modal ───────────────────────────────────────── */}
      <Dialog open={autoPopModal} onOpenChange={open => { if (!open) setAutoPopModal(false); }}>
        <DialogContent className="w-90 max-w-[calc(100vw-32px)]">
          <DialogHeader>
            <DialogTitle className="text-sm font-bold">Auto-populate Budget</DialogTitle>
            <DialogDescription>
              Fill in category amounts based on your average monthly spending over a recent period.
              Hidden categories will not be changed.
            </DialogDescription>
          </DialogHeader>

          <div className="flex flex-col gap-3 py-1">
            <p className="text-[10px] font-bold uppercase tracking-[1px] text-muted-foreground">Time period</p>
            <div className="flex gap-2">
              {[['3', 'Last 3 months'], ['6', 'Last 6 months']].map(([val, label]) => (
                <button
                  key={val}
                  onClick={() => setAutoPopMode(val)}
                  className={`flex-1 text-[11px] font-semibold px-3 py-2 rounded-md border transition-colors cursor-pointer ${
                    autoPopMode === val
                      ? 'bg-primary text-primary-foreground border-primary'
                      : 'bg-background text-foreground border-border hover:border-primary/50'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setAutoPopMode('custom')}
                className={`text-[11px] font-semibold px-3 py-2 rounded-md border transition-colors cursor-pointer whitespace-nowrap ${
                  autoPopMode === 'custom'
                    ? 'bg-primary text-primary-foreground border-primary'
                    : 'bg-background text-foreground border-border hover:border-primary/50'
                }`}
              >
                Custom
              </button>
              <div className={`flex items-center gap-1 transition-opacity ${autoPopMode === 'custom' ? 'opacity-100' : 'opacity-40 pointer-events-none'}`}>
                <input
                  type="number"
                  min="1"
                  max="36"
                  value={autoPopCustom}
                  onChange={e => setAutoPopCustom(e.target.value)}
                  onFocus={() => setAutoPopMode('custom')}
                  className="w-14 text-[11px] text-right bg-muted border border-border rounded px-2 py-1.75 outline-none focus:border-primary [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                />
                <span className="text-[11px] text-muted-foreground">months</span>
              </div>
            </div>
          </div>

          <DialogFooter className="flex gap-2.5 justify-end">
            <Button variant="outline" onClick={() => setAutoPopModal(false)} className="text-[11px] font-bold">
              Cancel
            </Button>
            <Button onClick={handleAutoPopulate} disabled={autoPopulating} className="text-[11px] font-bold">
              {autoPopulating ? 'Loading…' : 'Apply'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

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
            <Button variant="outline" onClick={() => setConfirmModal(null)} className="text-[11px] font-bold">
              Cancel
            </Button>
            <Button variant="destructive" onClick={confirmHide} className="text-[11px] font-bold">
              Remove
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
