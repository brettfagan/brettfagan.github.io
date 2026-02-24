import { useEffect, useState } from 'react';
import { useCategories } from '../context/CategoriesContext';
import { useDetailLabels } from '../context/DetailLabelsContext';
import { SUBCATEGORIES } from '../lib/constants';
import { fmt, fmtCat, fmtDetail } from '../lib/format';

export default function TransactionModal({ tx, onClose, onReCategorize }) {
  const [editingCat, setEditingCat] = useState(false);
  const [selectedCat, setSelectedCat] = useState(tx?.cat || '');
  const [selectedDetail, setSelectedDetail] = useState(tx?.cat_detail || '');

  useEffect(() => {
    function onKey(e) { if (e.key === 'Escape') onClose(); }
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [onClose]);

  const { getCatColor, getCatLabel, categories } = useCategories();
  const { getDetailLabel } = useDetailLabels();

  if (!tx) return null;

  const isCredit = tx.amount < 0;
  const color = getCatColor(tx.cat);

  const subOptions = SUBCATEGORIES[selectedCat] || [];

  function handleSaveCategory() {
    onReCategorize(tx._id, selectedCat, selectedDetail || null);
    setEditingCat(false);
    onClose();
  }

  function handleCancelEdit() {
    setSelectedCat(tx.cat);
    setSelectedDetail(tx.cat_detail || '');
    setEditingCat(false);
  }

  const Row = ({ label, value }) => {
    if (!value && value !== 0) return null;
    return (
      <div className="tx-modal-row">
        <span className="tx-modal-label">{label}</span>
        <span className="tx-modal-value">{value}</span>
      </div>
    );
  };

  const Section = ({ title, children }) => (
    <div className="tx-modal-section">
      <div className="tx-modal-section-title">{title}</div>
      {children}
    </div>
  );

  const loc = tx.location;
  const hasLocation = loc && Object.values(loc).some(v => v);
  let addrParts = [];
  let mapsUrl = '';
  if (hasLocation) {
    addrParts = [loc.address, loc.city, loc.region, loc.postal_code, loc.country].filter(Boolean);
    mapsUrl = (loc.lat && loc.lon)
      ? `https://www.google.com/maps?q=${loc.lat},${loc.lon}`
      : addrParts.length
        ? `https://www.google.com/maps/search/${encodeURIComponent(addrParts.join(', '))}`
        : '';
  }

  return (
    <>
      <div id="tx-modal-overlay" onClick={onClose} />
      <div id="tx-modal" role="dialog" aria-modal="true">
        <div id="tx-modal-inner">
          <button className="tx-modal-close" onClick={onClose} aria-label="Close">×</button>

          <div className="tx-modal-header">
            {(tx.logo_url || tx.cat_icon_url)
              ? <img className="tx-modal-logo" src={tx.logo_url || tx.cat_icon_url} alt="" onError={e => { e.target.src = ''; e.target.style.background = 'var(--surface)'; }} />
              : <div className="tx-modal-logo-placeholder" />
            }
            <div className="tx-modal-title">
              <div className="tx-modal-merchant">{tx.name}</div>
              <div className={`tx-modal-amount${isCredit ? ' credit' : ''}`}>
                {isCredit ? '-' : ''}{fmt(Math.abs(tx.amount))}
                {tx.pending && <span className="tx-modal-pending">⏳ Pending</span>}
              </div>
            </div>
          </div>

          <div className="tx-modal-body">
            <Section title="Category">
              {editingCat ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', padding: '4px 0' }}>
                  <div className="tx-modal-row">
                    <span className="tx-modal-label">Primary</span>
                    <select
                      value={selectedCat}
                      onChange={e => { setSelectedCat(e.target.value); setSelectedDetail(''); }}
                      style={{ flex: 1, fontFamily: "'DM Mono',monospace", fontSize: '12px', padding: '5px 8px', border: '1px solid var(--border)', borderRadius: '4px', background: 'var(--surface)', color: 'var(--text)' }}
                    >
                      {categories.map(c => (
                        <option key={c.key} value={c.key}>{getCatLabel(c.key)}</option>
                      ))}
                    </select>
                  </div>
                  {subOptions.length > 0 && (
                    <div className="tx-modal-row">
                      <span className="tx-modal-label">Detail</span>
                      <select
                        value={selectedDetail}
                        onChange={e => setSelectedDetail(e.target.value)}
                        style={{ flex: 1, fontFamily: "'DM Mono',monospace", fontSize: '12px', padding: '5px 8px', border: '1px solid var(--border)', borderRadius: '4px', background: 'var(--surface)', color: 'var(--text)' }}
                      >
                        <option value="">— none —</option>
                        {subOptions.map(s => (
                          <option key={s} value={s}>{fmtDetail(s)}</option>
                        ))}
                      </select>
                    </div>
                  )}
                  <div style={{ display: 'flex', gap: '8px', paddingLeft: '90px' }}>
                    <button onClick={handleSaveCategory} className="cm-btn primary" style={{ fontSize: '11px', padding: '5px 14px' }}>Save</button>
                    <button onClick={handleCancelEdit} className="cm-btn" style={{ fontSize: '11px', padding: '5px 14px' }}>Cancel</button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="tx-modal-row">
                    <span className="tx-modal-label">Primary</span>
                    <span className="tx-modal-value" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span className="tx-modal-badge" style={{ borderColor: color, color }}>{fmtCat(tx.cat)}</span>
                      {onReCategorize && (
                        <button
                          onClick={() => setEditingCat(true)}
                          title="Edit category"
                          style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--muted)', fontSize: '13px', padding: '2px 4px', lineHeight: 1 }}
                        >✎</button>
                      )}
                    </span>
                  </div>
                  <Row label="Detail" value={tx.cat_detail ? getDetailLabel(tx.cat_detail) : null} />
                  <Row label="Confidence" value={tx.cat_confidence ? fmtCat(tx.cat_confidence) : null} />
                </>
              )}
            </Section>

            <Section title="Payment">
              <Row label="Card" value={tx._card} />
              <Row label="Channel" value={tx.payment_channel ? tx.payment_channel.replace(/_/g, ' ').replace(/\b\w/g, x => x.toUpperCase()) : null} />
              <Row label="Website" value={tx.website ? <a href={tx.website} target="_blank" rel="noopener noreferrer">{tx.website.replace(/^https?:\/\//, '')}</a> : null} />
            </Section>

            <Section title="Dates">
              <Row label="Posted" value={tx.date} />
              <Row label="Datetime" value={tx.datetime ? tx.datetime.replace('T', ' ').replace('Z', ' UTC') : null} />
              <Row label="Authorized date" value={tx.authorized_date || null} />
              <Row label="Authorized datetime" value={tx.authorized_datetime ? tx.authorized_datetime.replace('T', ' ').replace('Z', ' UTC') : null} />
            </Section>

            {hasLocation && (
              <Section title="Location">
                <Row label="Address" value={addrParts.length
                  ? (mapsUrl ? <a href={mapsUrl} target="_blank" rel="noopener noreferrer">{addrParts.join(', ')}</a> : addrParts.join(', '))
                  : null}
                />
                <Row label="Store number" value={loc.store_number || null} />
                <Row label="Coordinates" value={(loc.lat && loc.lon) ? `${loc.lat}, ${loc.lon}` : null} />
              </Section>
            )}

            {tx.counterparty?.length > 0 && (
              <Section title={`Counterpart${tx.counterparty.length > 1 ? 'ies' : 'y'}`}>
                {tx.counterparty.map((cp, i) => (
                  <div key={i} className="tx-modal-counterparty">
                    {cp.logo_url
                      ? <img className="tx-modal-cp-logo" src={cp.logo_url} alt="" onError={e => { e.target.src = ''; e.target.style.background = 'var(--surface)'; }} />
                      : <div className="tx-modal-cp-logo" style={{ background: 'var(--surface)' }} />
                    }
                    <div className="tx-modal-cp-info">
                      <div className="tx-modal-cp-name">{cp.name || '—'}</div>
                      {cp.type && <div className="tx-modal-cp-type">{cp.type.replace(/_/g, ' ').replace(/\b\w/g, x => x.toUpperCase())}</div>}
                    </div>
                  </div>
                ))}
              </Section>
            )}

            <Section title="Reference">
              <Row label="Transaction ID" value={tx.transaction_id ? <span style={{ fontSize: '10px', wordBreak: 'break-all' }}>{tx.transaction_id}</span> : null} />
              <Row label="Account ID" value={tx.account_id ? <span style={{ fontSize: '10px', wordBreak: 'break-all' }}>{tx.account_id}</span> : null} />
            </Section>
          </div>
        </div>
      </div>
    </>
  );
}
