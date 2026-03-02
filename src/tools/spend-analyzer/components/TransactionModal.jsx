import { useState } from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useCategories } from '../context/CategoriesContext';
import { useDetailLabels } from '../context/DetailLabelsContext';
import { useAuth } from '../context/AuthContext';
import { SUBCATEGORIES } from '../lib/constants';
import { fmt, fmtCat, fmtDetail } from '../lib/format';

export default function TransactionModal({ tx, onClose, onReCategorize, onDelete }) {
  const { role } = useAuth();
  const isLinked = role === 'linked';
  const [editingCat, setEditingCat] = useState(false);
  const [deletePending, setDeletePending] = useState(false);
  const [selectedCat, setSelectedCat] = useState(tx?.cat || '');
  const [selectedDetail, setSelectedDetail] = useState(tx?.cat_detail || '');
  const [applyToSimilar, setApplyToSimilar] = useState(false);
  const [applyToFuture, setApplyToFuture] = useState(false);

  const { getCatColor, getCatLabel, categories } = useCategories();
  const { getDetailLabel } = useDetailLabels();

  if (!tx) return null;

  const isCredit = tx.amount < 0;
  const color = getCatColor(tx.cat);
  const subOptions = SUBCATEGORIES[selectedCat] || [];

  function handleSaveCategory() {
    onReCategorize(tx._id, selectedCat, selectedDetail || null, applyToSimilar, applyToFuture);
    setEditingCat(false);
    onClose();
  }

  function handleCancelEdit() {
    setSelectedCat(tx.cat);
    setSelectedDetail(tx.cat_detail || '');
    setApplyToSimilar(false);
    setApplyToFuture(false);
    setEditingCat(false);
  }

  const Row = ({ label, value }) => {
    if (!value && value !== 0) return null;
    return (
      <div className="flex justify-between items-start gap-4 text-xs">
        <span className="text-muted-foreground whitespace-nowrap shrink-0">{label}</span>
        <span className="text-right wrap-break-word font-medium">{value}</span>
      </div>
    );
  };

  const Section = ({ title, children }) => (
    <div className="flex flex-col gap-2">
      <div className="text-[10px] font-bold tracking-[2px] uppercase text-muted-foreground pb-1.5 border-b border-border">{title}</div>
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

  const selectCls = "flex-1 bg-muted border border-border rounded text-xs py-1.5 px-2.5 outline-none text-foreground cursor-pointer";

  return (
    <Dialog open={!!tx} onOpenChange={open => !open && onClose()}>
      <DialogContent className="p-0 w-130 max-w-[calc(100vw-2rem)] max-h-[calc(100vh-3rem)] overflow-y-auto gap-0">

        {/* ── Header ──────────────────────────────────────────────────────── */}
        <div className="flex items-center gap-3.5 px-6 py-5 pb-4.5 border-b border-border pr-14">
          {(tx.logo_url || tx.cat_icon_url)
            ? <img
                className="w-12 h-12 rounded-[10px] object-contain bg-muted border border-border shrink-0"
                src={tx.logo_url || tx.cat_icon_url}
                alt=""
                onError={e => { e.target.src = ''; e.target.style.background = 'var(--surface)'; }}
              />
            : <div className="w-12 h-12 rounded-[10px] bg-muted border border-border shrink-0" />
          }
          <div className="min-w-0">
            <div className="text-[18px] font-extrabold leading-tight wrap-break-word">{tx.name}</div>
            <div className={`text-sm font-bold mt-1 ${isCredit ? 'text-cyan-600' : ''}`}>
              {isCredit ? '-' : ''}{fmt(Math.abs(tx.amount))}
              {tx.pending && (
                <span className="inline-flex items-center gap-1.5 text-[11px] text-amber-600 font-bold ml-2">
                  ⏳ Pending
                </span>
              )}
            </div>
          </div>
        </div>

        {/* ── Body ────────────────────────────────────────────────────────── */}
        <div className="px-6 py-5 flex flex-col gap-5">

          <Section title="Category">
            {editingCat ? (
              <div className="flex flex-col gap-2.5 py-1">
                <div className="flex justify-between items-center gap-4 text-xs">
                  <span className="text-muted-foreground whitespace-nowrap shrink-0">Primary</span>
                  <select
                    value={selectedCat}
                    onChange={e => { setSelectedCat(e.target.value); setSelectedDetail(''); }}
                    className={selectCls}
                  >
                    {categories.map(c => (
                      <option key={c.key} value={c.key}>{getCatLabel(c.key)}</option>
                    ))}
                  </select>
                </div>
                {subOptions.length > 0 && (
                  <div className="flex justify-between items-center gap-4 text-xs">
                    <span className="text-muted-foreground whitespace-nowrap shrink-0">Detail</span>
                    <select
                      value={selectedDetail}
                      onChange={e => setSelectedDetail(e.target.value)}
                      className={selectCls}
                    >
                      <option value="">— none —</option>
                      {subOptions.map(s => (
                        <option key={s} value={s}>{fmtDetail(s)}</option>
                      ))}
                    </select>
                  </div>
                )}
                <div className="flex flex-col gap-1 pl-22.5">
                  <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                    <input
                      type="checkbox"
                      id="apply-to-similar"
                      checked={applyToSimilar}
                      onChange={e => { setApplyToSimilar(e.target.checked); if (!e.target.checked) setApplyToFuture(false); }}
                      className="cursor-pointer"
                    />
                    <label htmlFor="apply-to-similar" className="cursor-pointer">
                      Apply to all similar transactions (same merchant &amp; category)
                    </label>
                  </div>
                  {applyToSimilar && !isLinked && (
                    <div className="flex items-center gap-1.5 pl-4 text-[11px] text-muted-foreground">
                      <input
                        type="checkbox"
                        id="apply-to-future"
                        checked={applyToFuture}
                        onChange={e => setApplyToFuture(e.target.checked)}
                        className="cursor-pointer"
                      />
                      <label htmlFor="apply-to-future" className="cursor-pointer">
                        Also apply to future imports of this merchant
                      </label>
                    </div>
                  )}
                </div>
                <div className="flex gap-2 pl-22.5">
                  <Button size="sm" onClick={handleSaveCategory} className="text-[11px] font-bold">Save</Button>
                  <Button size="sm" variant="outline" onClick={handleCancelEdit} className="text-[11px] font-bold">Cancel</Button>
                </div>
              </div>
            ) : (
              <>
                <div className="flex justify-between items-start gap-4 text-xs">
                  <span className="text-muted-foreground whitespace-nowrap shrink-0">Primary</span>
                  <span className="text-right wrap-break-word font-medium flex items-center gap-2">
                    <span
                      className="inline-block text-[10px] px-2 py-0.5 rounded-[3px] border"
                      style={{ borderColor: color, color }}
                    >
                      {fmtCat(tx.cat)}
                    </span>
                    {onReCategorize && (
                      <button
                        onClick={() => setEditingCat(true)}
                        title="Edit category"
                        className="bg-transparent border-0 cursor-pointer text-muted-foreground text-sm p-0.5 leading-none hover:text-foreground transition-colors"
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
            <Row label="Website" value={tx.website
              ? <a href={tx.website} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">{tx.website.replace(/^https?:\/\//, '')}</a>
              : null}
            />
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
                ? (mapsUrl
                    ? <a href={mapsUrl} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">{addrParts.join(', ')}</a>
                    : addrParts.join(', '))
                : null}
              />
              <Row label="Store number" value={loc.store_number || null} />
              <Row label="Coordinates" value={(loc.lat && loc.lon) ? `${loc.lat}, ${loc.lon}` : null} />
            </Section>
          )}

          {tx.counterparty?.length > 0 && (
            <Section title={`Counterpart${tx.counterparty.length > 1 ? 'ies' : 'y'}`}>
              {tx.counterparty.map((cp, i) => (
                <div key={i} className="flex items-center gap-2.5">
                  {cp.logo_url
                    ? <img
                        className="w-7 h-7 rounded-[6px] object-contain border border-border bg-background shrink-0"
                        src={cp.logo_url}
                        alt=""
                        onError={e => { e.target.src = ''; e.target.style.background = 'var(--surface)'; }}
                      />
                    : <div className="w-7 h-7 rounded-[6px] border border-border bg-muted shrink-0" />
                  }
                  <div className="min-w-0">
                    <div className="text-xs font-semibold">{cp.name || '—'}</div>
                    {cp.type && <div className="text-[10px] text-muted-foreground mt-0.5">{cp.type.replace(/_/g, ' ').replace(/\b\w/g, x => x.toUpperCase())}</div>}
                  </div>
                </div>
              ))}
            </Section>
          )}

          <Section title="Reference">
            <Row label="Transaction ID" value={tx.transaction_id ? <span className="text-[10px] break-all">{tx.transaction_id}</span> : null} />
            <Row label="Account ID" value={tx.account_id ? <span className="text-[10px] break-all">{tx.account_id}</span> : null} />
          </Section>

          {onDelete && !isLinked && (
            <div className="pt-2 border-t border-border">
              {deletePending ? (
                <div className="flex items-center justify-between gap-3">
                  <span className="text-xs text-muted-foreground">Delete this transaction?</span>
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" onClick={() => setDeletePending(false)}>Cancel</Button>
                    <Button size="sm" variant="destructive" onClick={() => { onDelete(tx._id); onClose(); }}>Delete</Button>
                  </div>
                </div>
              ) : (
                <Button
                  size="sm"
                  variant="ghost"
                  className="text-muted-foreground text-xs hover:text-destructive hover:bg-transparent"
                  onClick={() => setDeletePending(true)}
                >
                  Delete transaction
                </Button>
              )}
            </div>
          )}

        </div>
      </DialogContent>
    </Dialog>
  );
}
