import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { useCategories } from '../context/CategoriesContext';
import { SUBCATEGORIES } from '../lib/constants';

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

function ConfirmModal({ label, onConfirm, onCancel }) {
  return (
    <>
      <div className="budget-modal-overlay" onClick={onCancel} />
      <div className="budget-modal">
        <div className="budget-modal-inner">
          <p className="budget-modal-text">
            Remove <strong>{label}</strong> from your budget?
          </p>
          <p className="budget-modal-sub">
            You can restore it from the Hidden section at the bottom of the page.
          </p>
          <div className="budget-modal-actions">
            <button className="budget-btn budget-btn--ghost" onClick={onCancel}>
              Cancel
            </button>
            <button className="budget-btn budget-btn--danger" onClick={onConfirm}>
              Remove
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

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
      <div className="budget-header">
        <div>
          <h2 className="budget-title">My Budget</h2>
          <p className="budget-subtitle">Set monthly spending targets for each category.</p>
        </div>
        <div className="budget-header-actions">
          {saveSuccess && <span className="budget-save-success">Saved!</span>}
          {error && <span className="budget-save-error">{error}</span>}
          <button
            className="budget-btn budget-btn--primary"
            onClick={handleSave}
            disabled={saving || !dirty}
          >
            {saving ? 'Saving…' : 'Save Budget'}
          </button>
        </div>
      </div>

      {loading && (
        <div className="budget-empty">Loading…</div>
      )}

      {!loading && (
        <>
          {/* ── Column headers ────────────────────────────────────────── */}
          <div className="budget-col-headers">
            <div />
            <div>Category</div>
            <div className="budget-col-headers-amount">Monthly Budget</div>
            <div />
          </div>

          {/* ── Category list ─────────────────────────────────────────── */}
          <div className="budget-list">
            {visibleCategories.map(cat => {
              const catKey = cat.key;
              const catItem = getItem(catKey);
              const isExpanded = expanded.has(catKey);
              const subcats = SUBCATEGORIES[catKey] || [];
              const visibleSubcats = subcats.filter(
                s => !getItem(itemKey(catKey, s)).hidden
              );

              return (
                <div key={catKey} className="budget-cat-group">
                  {/* Category row */}
                  <div className="budget-row budget-row--cat">
                    <div
                      className="budget-color-dot"
                      style={{ background: getCatColor(catKey) }}
                    />
                    <div className="budget-cat-name">{getCatLabel(catKey)}</div>
                    <div className="budget-col-amount">
                      <div className="budget-amount-wrap">
                        <span className="budget-amount-prefix">$</span>
                        <input
                          type="number"
                          className="budget-amount-input"
                          min="0"
                          step="0.01"
                          placeholder="—"
                          value={catItem.amount}
                          onChange={e => setAmount(catKey, e.target.value)}
                        />
                      </div>
                    </div>
                    <div className="budget-row-actions">
                      {subcats.length > 0 && (
                        <button
                          className="budget-btn-icon"
                          onClick={() => toggleExpanded(catKey)}
                          title={isExpanded ? 'Collapse subcategories' : 'Expand subcategories'}
                        >
                          <span className={`budget-chevron${isExpanded ? ' budget-chevron--open' : ''}`}>›</span>
                          <span className="budget-expand-label">
                            {isExpanded ? 'Less' : 'Subcategories'}
                          </span>
                        </button>
                      )}
                      <button
                        className="budget-btn-icon budget-btn-delete"
                        onClick={() => requestHide(catKey, getCatLabel(catKey))}
                        title="Remove from budget"
                      >
                        ×
                      </button>
                    </div>
                  </div>

                  {/* Subcategory rows */}
                  {isExpanded && (
                    <div className="budget-subcat-list">
                      {visibleSubcats.map(sub => {
                        const subKey = itemKey(catKey, sub);
                        const subItem = getItem(subKey);
                        return (
                          <div key={subKey} className="budget-row budget-row--sub">
                            <div />
                            <div className="budget-subcat-name">{fmtSubcat(sub)}</div>
                            <div className="budget-col-amount">
                              <div className="budget-amount-wrap">
                                <span className="budget-amount-prefix">$</span>
                                <input
                                  type="number"
                                  className="budget-amount-input"
                                  min="0"
                                  step="0.01"
                                  placeholder="—"
                                  value={subItem.amount}
                                  onChange={e => setAmount(subKey, e.target.value)}
                                />
                              </div>
                            </div>
                            <div className="budget-row-actions">
                              <button
                                className="budget-btn-icon budget-btn-delete"
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
                        <div className="budget-row budget-row--sub budget-all-hidden">
                          <div />
                          <div style={{ gridColumn: '2 / -1', color: 'var(--muted)', fontStyle: 'italic', fontSize: '11px' }}>
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
            <div className="budget-hidden-section">
              <button
                className="budget-hidden-toggle"
                onClick={() => setShowHidden(p => !p)}
              >
                <span className={`budget-chevron${showHidden ? ' budget-chevron--open' : ''}`}>›</span>
                Hidden ({hiddenItems.length})
              </button>
              {showHidden && (
                <div className="budget-hidden-list">
                  {hiddenItems.map(key => {
                    const { category, subcategory } = parseKey(key);
                    const label = subcategory
                      ? `${getCatLabel(category)} › ${fmtSubcat(subcategory)}`
                      : getCatLabel(category);
                    return (
                      <div key={key} className="budget-hidden-item">
                        <span>{label}</span>
                        <button
                          className="budget-btn budget-btn--ghost budget-btn--sm"
                          onClick={() => restoreItem(key)}
                        >
                          Restore
                        </button>
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
      {confirmModal && (
        <ConfirmModal
          label={confirmModal.label}
          onConfirm={confirmHide}
          onCancel={() => setConfirmModal(null)}
        />
      )}
    </>
  );
}
