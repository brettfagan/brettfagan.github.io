import { useEffect } from 'react';
import { useCategories } from '../context/CategoriesContext';
import { useDetailLabels } from '../context/DetailLabelsContext';
import { fmt, fmtCat } from '../lib/format';

export default function TransactionModal({ tx, onClose }) {
  useEffect(() => {
    function onKey(e) { if (e.key === 'Escape') onClose(); }
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [onClose]);

  const { getCatColor } = useCategories();
  const { getDetailLabel } = useDetailLabels();

  if (!tx) return null;

  const isCredit = tx.amount < 0;
  const color = getCatColor(tx.cat);

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
            {tx.logo_url
              ? <img className="tx-modal-logo" src={tx.logo_url} alt="" onError={e => { e.target.src = ''; e.target.style.background = 'var(--surface)'; }} />
              : <div className="tx-modal-logo-placeholder" />
            }
            <div className="tx-modal-title">
              <div className="tx-modal-merchant">{tx.merchant}</div>
              <div className={`tx-modal-amount${isCredit ? ' credit' : ''}`}>
                {isCredit ? '-' : ''}{fmt(Math.abs(tx.amount))}
                {tx.pending && <span className="tx-modal-pending">⏳ Pending</span>}
              </div>
            </div>
          </div>

          <div className="tx-modal-body">
            <Section title="Category">
              <Row label="Primary" value={
                <span className="tx-modal-badge" style={{ borderColor: color, color }}>{fmtCat(tx.cat)}</span>
              } />
              <Row label="Detail" value={tx.cat_detail ? getDetailLabel(tx.cat_detail) : null} />
              <Row label="Confidence" value={tx.cat_confidence ? fmtCat(tx.cat_confidence) : null} />
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
