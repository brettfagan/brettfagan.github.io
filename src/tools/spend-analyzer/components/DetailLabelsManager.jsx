import { useState } from 'react';
import { useDetailLabels } from '../context/DetailLabelsContext';
import { fmtDetail } from '../lib/format';

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
      <div className="cm-row dl-row">
        <div className="dl-key-col">
          <span className="cm-row-key">{entry.cat_detail}</span>
          <span className="dl-arrow">→</span>
          <span className="cm-row-label">{entry.label}</span>
        </div>
        <span className="dl-default-hint">(was: {fmtDetail(entry.cat_detail)})</span>
        <button className="cm-btn-icon" onClick={() => setEditing(true)} title="Edit">✎</button>
        <button className="cm-btn-icon danger" onClick={() => onDelete(entry.cat_detail)} title="Delete">✕</button>
      </div>
    );
  }

  return (
    <div className="cm-row editing">
      <div className="cm-edit-block">
        <div className="cm-edit-row">
          <label className="cm-edit-label">Key</label>
          <span className="cm-key-readonly">{entry.cat_detail}</span>
        </div>
        <div className="cm-edit-row">
          <label className="cm-edit-label">Display label</label>
          <input
            className="cm-input"
            value={label}
            onChange={e => setLabel(e.target.value)}
            maxLength={60}
            autoFocus
          />
        </div>
        <div className="cm-edit-actions">
          <button className="cm-btn primary" onClick={handleSave} disabled={saving || !label.trim()}>
            {saving ? 'Saving…' : 'Save'}
          </button>
          <button className="cm-btn" onClick={handleCancel}>Cancel</button>
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
  // Track whether the user has manually edited the label field
  const [labelTouched, setLabelTouched] = useState(false);

  function handleKeyChange(val) {
    const upper = val.toUpperCase().replace(/[^A-Z0-9_]/g, '');
    setCatDetail(upper);
    // Auto-fill label with fmtDetail unless the user has already customized it
    if (!labelTouched) {
      setLabel(fmtDetail(upper));
    }
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
      setCatDetail('');
      setLabel('');
      setLabelTouched(false);
      setOpen(false);
    }
  }

  if (!open) {
    return (
      <button className="cm-btn add-new" onClick={() => setOpen(true)}>
        + Add Subcategory Label
      </button>
    );
  }

  return (
    <form className="cm-add-form" onSubmit={handleSubmit}>
      <div className="cm-edit-row">
        <label className="cm-edit-label">Detail key</label>
        <input
          className="cm-input"
          value={catDetail}
          onChange={e => handleKeyChange(e.target.value)}
          maxLength={80}
          placeholder="FOOD_AND_DRINK_GROCERIES"
          spellCheck={false}
          autoFocus
        />
      </div>
      <p className="cm-subcat-hint">
        Type the raw key exactly as it appears in your Plaid or CSV data —
        visible in the Subcategory column of your transactions.
      </p>
      <div className="cm-edit-row">
        <label className="cm-edit-label">Display label</label>
        <input
          className="cm-input"
          value={label}
          onChange={e => handleLabelChange(e.target.value)}
          maxLength={60}
          placeholder="Weekly Groceries"
        />
      </div>
      {error && <p className="cm-error">{error}</p>}
      <div className="cm-edit-actions">
        <button className="cm-btn primary" type="submit" disabled={saving}>
          {saving ? 'Adding…' : 'Add Label'}
        </button>
        <button
          className="cm-btn"
          type="button"
          onClick={() => { setOpen(false); setError(''); setCatDetail(''); setLabel(''); setLabelTouched(false); }}
        >
          Cancel
        </button>
      </div>
    </form>
  );
}

// ── DetailLabelsManager ───────────────────────────────────────────────────────
export default function DetailLabelsManager() {
  const { detailLabels, loading, saveDetailLabel, deleteDetailLabel } = useDetailLabels();

  if (loading) return <p className="cm-loading">Loading…</p>;

  return (
    <>
      <p className="rules-hint">
        Give any subcategory key a custom display name. The key must match exactly
        what appears in your Plaid or CSV data. Changes apply everywhere in the app.
      </p>

      <div className="cm-list">
        {detailLabels.length === 0 ? (
          <p className="cm-loading">No custom labels yet. Add one below.</p>
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
