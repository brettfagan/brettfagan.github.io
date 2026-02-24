import { useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { fmt } from '../lib/format';

// ── Breakdown row helper ──────────────────────────────────────────────────────
function BreakdownRow({ label, count, sum, color, sign = '' }) {
  if (count === 0) return null;
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', padding: '6px 0', borderBottom: '1px solid var(--border)' }}>
      <span style={{ fontFamily: "'DM Mono',monospace", fontSize: '11px', color: 'var(--muted)' }}>{label}</span>
      <span style={{ display: 'flex', gap: '20px', alignItems: 'baseline' }}>
        <span style={{ fontFamily: "'DM Mono',monospace", fontSize: '11px', color: 'var(--muted)' }}>
          {count} transaction{count !== 1 ? 's' : ''}
        </span>
        <span style={{ fontFamily: "'DM Mono',monospace", fontSize: '13px', fontWeight: 700, color: color || 'var(--text)', minWidth: '80px', textAlign: 'right' }}>
          {sign}{fmt(sum)}
        </span>
      </span>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────
export default function ImportToDbModal({ spending, credits, excluded, onClose }) {
  const { user } = useAuth();
  const [includePending, setIncludePending] = useState(false);
  const [step, setStep] = useState('preview'); // 'preview' | 'importing' | 'done' | 'error'
  const [errorMsg, setErrorMsg] = useState('');
  const [summary, setSummary] = useState(null);

  const posted  = spending.filter(t => !t.pending);
  const pending = spending.filter(t =>  t.pending);

  const toImport = [
    ...posted,
    ...(includePending ? pending : []),
    ...credits,
    ...excluded,
  ];

  async function handleImport() {
    setStep('importing');
    setErrorMsg('');

    const rows = toImport.map(tx => ({
      user_id:              user.id,
      date:                 tx.date || null,
      merchant:             tx.merchant || null,
      name:                 tx.name || null,
      amount:               tx.amount,
      cat:                  tx.cat || null,
      cat_detail:           tx.cat_detail || null,
      cat_confidence:       tx.cat_confidence || null,
      pending:              tx.pending || false,
      source:               tx.source || null,
      card_label:           tx._card || null,
      logo_url:             tx.logo_url || null,
      cat_icon_url:         tx.cat_icon_url || null,
      website:              tx.website || null,
      payment_channel:      tx.payment_channel || null,
      plaid_transaction_id: tx.transaction_id || null,
      account_id:           tx.account_id || null,
      authorized_date:      tx.authorized_date || null,
      authorized_datetime:  tx.authorized_datetime || null,
      tx_datetime:          tx.datetime || null,
      location:             tx.location && Object.values(tx.location).some(Boolean) ? tx.location : null,
      counterparty:         tx.counterparty?.length ? tx.counterparty : null,
    }));

    const { error } = await supabase.from('imported_transactions').insert(rows);

    if (error) {
      setErrorMsg(error.message);
      setStep('error');
      return;
    }

    setSummary({
      posted:          posted.length,
      postedSum:       posted.reduce((s, t) => s + t.amount, 0),
      credits:         credits.length,
      creditsSum:      Math.abs(credits.reduce((s, t) => s + t.amount, 0)),
      excluded:        excluded.length,
      excludedSum:     excluded.reduce((s, t) => s + Math.abs(t.amount), 0),
      pending:         pending.length,
      pendingSum:      pending.reduce((s, t) => s + t.amount, 0),
      includedPending: includePending,
      total:           toImport.length,
    });
    setStep('done');
  }

  const overlay = (
    <div
      style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', zIndex: 400 }}
      onClick={step !== 'importing' ? onClose : undefined}
    />
  );

  const modalBox = (children) => (
    <div style={{
      position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%,-50%)',
      background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: '12px',
      padding: '28px 28px 24px', zIndex: 401, width: '460px', maxWidth: '94vw',
      boxShadow: '0 12px 40px rgba(0,0,0,0.2)',
    }}>
      {children}
    </div>
  );

  const sectionLabel = (text) => (
    <div style={{ fontFamily: "'DM Mono',monospace", fontSize: '11px', fontWeight: 700, letterSpacing: '1.5px', textTransform: 'uppercase', color: 'var(--muted)', marginBottom: '4px' }}>
      {text}
    </div>
  );

  // ── Preview step ─────────────────────────────────────────────────────────────
  if (step === 'preview') return (
    <>
      {overlay}
      {modalBox(
        <>
          {sectionLabel('Import to Database')}
          <p style={{ fontSize: '13px', color: 'var(--muted)', margin: '4px 0 20px', lineHeight: 1.6 }}>
            Save this session's transactions to your account for future reference.
          </p>

          <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', marginBottom: '20px', fontSize: '13px', color: 'var(--text)' }}>
            <input
              type="checkbox"
              checked={includePending}
              onChange={e => setIncludePending(e.target.checked)}
              style={{ width: '15px', height: '15px', cursor: 'pointer' }}
            />
            Include pending transactions
          </label>

          <div style={{ background: 'var(--surface)', borderRadius: '8px', padding: '4px 12px', marginBottom: '20px' }}>
            <BreakdownRow label="Posted"           count={posted.length}   sum={posted.reduce((s, t) => s + t.amount, 0)}                        color="var(--text)" />
            <BreakdownRow label="Credits / Refunds" count={credits.length}  sum={Math.abs(credits.reduce((s, t) => s + t.amount, 0))}             color="var(--accent2)" sign="-" />
            <BreakdownRow label="Excluded"          count={excluded.length} sum={excluded.reduce((s, t) => s + Math.abs(t.amount), 0)}            color="var(--muted)" />
            {includePending && (
              <BreakdownRow label="Pending" count={pending.length} sum={pending.reduce((s, t) => s + t.amount, 0)} color="var(--warn)" />
            )}
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0 2px', fontFamily: "'DM Mono',monospace", fontSize: '12px', fontWeight: 700 }}>
              <span>Total</span>
              <span>{toImport.length} transaction{toImport.length !== 1 ? 's' : ''}</span>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
            <button className="cm-btn" onClick={onClose}>Cancel</button>
            <button className="cm-btn primary" onClick={handleImport} disabled={toImport.length === 0}>
              Import {toImport.length} Transaction{toImport.length !== 1 ? 's' : ''}
            </button>
          </div>
        </>
      )}
    </>
  );

  // ── Importing step ───────────────────────────────────────────────────────────
  if (step === 'importing') return (
    <>
      {overlay}
      {modalBox(
        <div style={{ textAlign: 'center', padding: '16px 0' }}>
          <div style={{ fontFamily: "'DM Mono',monospace", fontSize: '13px', color: 'var(--muted)', marginBottom: '8px' }}>Importing…</div>
          <div style={{ fontSize: '11px', color: 'var(--muted)' }}>Saving {toImport.length} transactions to your account</div>
        </div>
      )}
    </>
  );

  // ── Error step ───────────────────────────────────────────────────────────────
  if (step === 'error') return (
    <>
      {overlay}
      {modalBox(
        <>
          {sectionLabel('Import Failed')}
          <p style={{ fontSize: '13px', color: 'var(--danger)', margin: '8px 0 20px', lineHeight: 1.6 }}>{errorMsg}</p>
          <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
            <button className="cm-btn" onClick={onClose}>Close</button>
            <button className="cm-btn primary" onClick={() => setStep('preview')}>Try Again</button>
          </div>
        </>
      )}
    </>
  );

  // ── Done step ────────────────────────────────────────────────────────────────
  return (
    <>
      {overlay}
      {modalBox(
        <>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
            <span style={{ fontSize: '20px', color: 'var(--accent2)' }}>✓</span>
            <div>
              {sectionLabel('Import Complete')}
              <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text)' }}>
                {summary.total} transaction{summary.total !== 1 ? 's' : ''} saved
              </div>
            </div>
          </div>

          <div style={{ background: 'var(--surface)', borderRadius: '8px', padding: '4px 12px', marginBottom: '20px' }}>
            <BreakdownRow label="Posted"            count={summary.posted}   sum={summary.postedSum}   color="var(--text)" />
            <BreakdownRow label="Credits / Refunds" count={summary.credits}  sum={summary.creditsSum}  color="var(--accent2)" sign="-" />
            <BreakdownRow label="Excluded"          count={summary.excluded} sum={summary.excludedSum} color="var(--muted)" />
            {summary.includedPending && (
              <BreakdownRow label="Pending" count={summary.pending} sum={summary.pendingSum} color="var(--warn)" />
            )}
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <button className="cm-btn primary" onClick={onClose}>Done</button>
          </div>
        </>
      )}
    </>
  );
}
