import { useState } from 'react';
import { useCategories } from '../context/CategoriesContext';
import { COLOR_PALETTE } from '../context/CategoriesContext';

// ── ColorPicker ───────────────────────────────────────────────────────────────
function ColorPicker({ value, onChange }) {
  return (
    <div className="cm-color-picker">
      {COLOR_PALETTE.map(c => (
        <button
          key={c}
          type="button"
          className={`cm-color-swatch${value === c ? ' selected' : ''}`}
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
  const [editing, setEditing] = useState(false);
  const [label, setLabel]     = useState(cat.label);
  const [color, setColor]     = useState(cat.color);
  const [excluded, setExcluded] = useState(cat.excluded);
  const [saving, setSaving]   = useState(false);

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
      <div className="cm-row">
        <span className="cm-swatch" style={{ background: cat.color }} />
        <span className="cm-row-label">{cat.label}</span>
        <span className="cm-row-key">{cat.key}</span>
        <span className={`cm-excluded-badge${cat.excluded ? ' active' : ''}`}>
          {cat.excluded ? 'excluded' : 'included'}
        </span>
        <button className="cm-btn-icon" onClick={() => setEditing(true)} title="Edit">✎</button>
        <button className="cm-btn-icon danger" onClick={() => onDelete(cat.key)} title="Delete">✕</button>
      </div>
    );
  }

  return (
    <div className="cm-row editing">
      <div className="cm-edit-block">
        <div className="cm-edit-row">
          <label className="cm-edit-label">Label</label>
          <input
            className="cm-input"
            value={label}
            onChange={e => setLabel(e.target.value)}
            maxLength={40}
          />
        </div>
        <div className="cm-edit-row">
          <label className="cm-edit-label">Key</label>
          <span className="cm-key-readonly">{cat.key}</span>
        </div>
        <div className="cm-edit-row">
          <label className="cm-edit-label">Color</label>
          <ColorPicker value={color} onChange={setColor} />
        </div>
        <div className="cm-edit-row">
          <label className="cm-edit-label">Exclude from totals</label>
          <input
            type="checkbox"
            checked={excluded}
            onChange={e => setExcluded(e.target.checked)}
          />
        </div>
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

// ── AddCategoryForm ───────────────────────────────────────────────────────────
function AddCategoryForm({ onAdd }) {
  const [open, setOpen]       = useState(false);
  const [label, setLabel]     = useState('');
  const [key, setKey]         = useState('');
  const [color, setColor]     = useState(COLOR_PALETTE[0]);
  const [excluded, setExcluded] = useState(false);
  const [saving, setSaving]   = useState(false);
  const [error, setError]     = useState('');

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
    return (
      <button className="cm-btn add-new" onClick={() => setOpen(true)}>
        + Add Category
      </button>
    );
  }

  return (
    <form className="cm-add-form" onSubmit={handleSubmit}>
      <div className="cm-edit-row">
        <label className="cm-edit-label">Label</label>
        <input
          className="cm-input"
          value={label}
          onChange={handleLabelChange}
          maxLength={40}
          placeholder="e.g. Subscriptions"
          autoFocus
        />
      </div>
      <div className="cm-edit-row">
        <label className="cm-edit-label">Key (auto)</label>
        <input
          className="cm-input"
          value={key}
          onChange={e => setKey(e.target.value.toUpperCase().replace(/[^A-Z0-9_]/g, ''))}
          maxLength={40}
          placeholder="SUBSCRIPTIONS"
        />
      </div>
      <div className="cm-edit-row">
        <label className="cm-edit-label">Color</label>
        <ColorPicker value={color} onChange={setColor} />
      </div>
      <div className="cm-edit-row">
        <label className="cm-edit-label">Exclude from totals</label>
        <input
          type="checkbox"
          checked={excluded}
          onChange={e => setExcluded(e.target.checked)}
        />
      </div>
      {error && <p className="cm-error">{error}</p>}
      <div className="cm-edit-actions">
        <button className="cm-btn primary" type="submit" disabled={saving}>
          {saving ? 'Adding…' : 'Add'}
        </button>
        <button className="cm-btn" type="button" onClick={() => { setOpen(false); setError(''); }}>
          Cancel
        </button>
      </div>
    </form>
  );
}

// ── CategoryManager (slide-out panel) ────────────────────────────────────────
export default function CategoryManager({ open, onClose }) {
  const { categories, loading, saveCategory, deleteCategory, resetToDefaults } = useCategories();
  const [resetting, setResetting] = useState(false);

  async function handleReset() {
    if (!confirm('Reset all categories to defaults? This will delete any custom categories.')) return;
    setResetting(true);
    await resetToDefaults();
    setResetting(false);
  }

  return (
    <>
      {/* Backdrop */}
      <div
        className={`cm-backdrop${open ? ' visible' : ''}`}
        onClick={onClose}
      />

      {/* Panel */}
      <aside className={`cm-panel${open ? ' open' : ''}`}>
        <div className="cm-panel-header">
          <h2>Manage Categories</h2>
          <button className="cm-close-btn" onClick={onClose} title="Close">✕</button>
        </div>

        <div className="cm-panel-body">
          {loading ? (
            <p className="cm-loading">Loading…</p>
          ) : (
            <>
              <div className="cm-list">
                {categories.map(cat => (
                  <CategoryRow
                    key={cat.key}
                    cat={cat}
                    onSave={saveCategory}
                    onDelete={deleteCategory}
                  />
                ))}
              </div>

              <AddCategoryForm onAdd={saveCategory} />

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
          )}
        </div>
      </aside>
    </>
  );
}
