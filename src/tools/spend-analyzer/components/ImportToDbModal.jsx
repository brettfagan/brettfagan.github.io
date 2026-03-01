import { useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { useCsvRules } from '../context/CsvRulesContext';
import { fmt, fmtCat } from '../lib/format';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

// Apply user-defined rules to a transaction, falling back to existing category.
// Unlike guessCat(), this does NOT apply hardcoded fallback patterns — it only
// honours rules the user has explicitly configured.
function applyRules(tx, rules) {
  const catStr  = (tx.cat      || '').toUpperCase();
  const descStr = (tx.merchant || '').toUpperCase();
  for (const rule of rules) {
    let re;
    try { re = new RegExp(rule.pattern, 'i'); } catch { continue; }
    const matchesCat  = rule.match_field !== 'merchant'  && re.test(catStr);
    const matchesDesc = rule.match_field !== 'category' && re.test(descStr);
    if (matchesCat || matchesDesc) {
      return { cat: rule.cat, cat_detail: rule.cat_detail || null };
    }
  }
  return { cat: tx.cat || null, cat_detail: tx.cat_detail || null };
}

// ── Breakdown row helper ──────────────────────────────────────────────────────
function BreakdownRow({ label, count, sum, colorClass = 'text-foreground', sign = '' }) {
  if (count === 0) return null;
  return (
    <div className="flex justify-between items-baseline py-1.5 border-b border-border">
      <span className="text-[11px] text-muted-foreground">{label}</span>
      <span className="flex gap-5 items-baseline">
        <span className="text-[11px] text-muted-foreground">
          {count} transaction{count !== 1 ? 's' : ''}
        </span>
        <span className={`text-[13px] font-bold min-w-20 text-right ${colorClass}`}>
          {sign}{fmt(sum)}
        </span>
      </span>
    </div>
  );
}

const SectionLabel = ({ children }) => (
  <div className="text-[11px] font-bold tracking-[1.5px] uppercase text-muted-foreground mb-1">
    {children}
  </div>
);

// ── Main component ────────────────────────────────────────────────────────────
export default function ImportToDbModal({ spending, credits, onClose }) {
  const { user } = useAuth();
  const { rules } = useCsvRules();
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
  ];

  async function handleImport() {
    setStep('importing');
    setErrorMsg('');

    // ── Duplicate detection ───────────────────────────────────────────────────
    const hasPlaid = toImport.some(tx => tx.transaction_id);
    const hasCsv   = toImport.some(tx => !tx.transaction_id);

    // For Plaid: fetch existing IDs *and* all existing fingerprints as a safety
    // net — if a prior import stored rows with plaid_transaction_id = null the
    // ID check alone would miss them, causing double-imports.
    const [plaidIdResult, plaidFpResult, csvResult] = await Promise.all([
      hasPlaid
        ? supabase.from('imported_transactions').select('plaid_transaction_id').eq('user_id', user.id).not('plaid_transaction_id', 'is', null)
        : Promise.resolve({ data: [] }),
      hasPlaid
        ? supabase.from('imported_transactions').select('date, merchant, amount').eq('user_id', user.id)
        : Promise.resolve({ data: [] }),
      hasCsv
        ? supabase.from('imported_transactions').select('date, merchant, amount').eq('user_id', user.id).is('plaid_transaction_id', null)
        : Promise.resolve({ data: [] }),
    ]);

    const existingPlaidIds = new Set((plaidIdResult.data || []).map(r => r.plaid_transaction_id));
    const existingPlaidFps = new Set((plaidFpResult.data || []).map(r => `${r.date}|${r.merchant}|${r.amount}`));
    const existingCsvPrints = new Set((csvResult.data || []).map(r => `${r.date}|${r.merchant}|${r.amount}`));

    const fp = tx => `${tx.date}|${tx.merchant}|${tx.amount}`;

    const isDupe = tx => tx.transaction_id
      ? existingPlaidIds.has(tx.transaction_id) || existingPlaidFps.has(fp(tx))
      : existingCsvPrints.has(fp(tx));

    const duplicates = toImport.filter(isDupe);
    const newTxns    = toImport.filter(tx => !isDupe(tx));

    if (newTxns.length === 0) {
      setSummary({
        posted:          posted.length,
        postedSum:       posted.reduce((s, t) => s + t.amount, 0),
        credits:         credits.length,
        creditsSum:      Math.abs(credits.reduce((s, t) => s + t.amount, 0)),
        pending:         pending.length,
        pendingSum:      pending.reduce((s, t) => s + t.amount, 0),
        includedPending: includePending,
        total:           0,
        duplicateCount:  duplicates.length,
        duplicateList:   duplicates.map(t => ({ merchant: t.merchant, date: t.date, amount: t.amount })),
      });
      setStep('done');
      return;
    }

    const ruleCatCounts = {};
    const rows = newTxns.map(tx => {
      const { cat, cat_detail } = applyRules(tx, rules);
      if (cat !== tx.cat) ruleCatCounts[cat] = (ruleCatCounts[cat] || 0) + 1;
      return {
      user_id:              user.id,
      date:                 tx.date || null,
      merchant:             tx.merchant || null,
      name:                 tx.name || null,
      amount:               tx.amount,
      cat:                  cat,
      cat_detail:           cat_detail,
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
      };
    });

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
      pending:         pending.length,
      pendingSum:      pending.reduce((s, t) => s + t.amount, 0),
      includedPending: includePending,
      total:           newTxns.length,
      duplicateCount:  duplicates.length,
      duplicateList:   duplicates.map(t => ({ merchant: t.merchant, date: t.date, amount: t.amount })),
      rulesApplied:    Object.entries(ruleCatCounts).map(([cat, count]) => ({ cat, count })),
    });
    setStep('done');
  }

  return (
    <Dialog open onOpenChange={open => { if (!open && step !== 'importing') onClose(); }}>
      <DialogContent className="sm:max-w-115" showCloseButton={step !== 'importing'}>

        {/* ── Preview ───────────────────────────────────────────────────────── */}
        {step === 'preview' && (
          <>
            <SectionLabel>Import to Database</SectionLabel>
            <p className="text-[13px] text-muted-foreground mt-1 mb-5 leading-relaxed">
              Save this session's transactions to your account for future reference.
            </p>

            <label className="flex items-center gap-2.5 cursor-pointer mb-5 text-sm">
              <input
                type="checkbox"
                checked={includePending}
                onChange={e => setIncludePending(e.target.checked)}
                className="w-3.75 h-3.75 cursor-pointer"
              />
              Include pending transactions
            </label>

            <div className="bg-muted rounded-lg px-3 py-1 mb-5">
              <BreakdownRow label="Posted"            count={posted.length}  sum={posted.reduce((s, t) => s + t.amount, 0)} />
              <BreakdownRow label="Credits / Refunds" count={credits.length} sum={Math.abs(credits.reduce((s, t) => s + t.amount, 0))} colorClass="text-cyan-600" sign="-" />
              {includePending && (
                <BreakdownRow label="Pending" count={pending.length} sum={pending.reduce((s, t) => s + t.amount, 0)} colorClass="text-amber-600" />
              )}
              <div className="flex justify-between py-2 text-xs font-bold">
                <span>Total</span>
                <span>{toImport.length} transaction{toImport.length !== 1 ? 's' : ''}</span>
              </div>
            </div>

            <div className="flex gap-2 justify-end">
              <Button variant="outline" size="sm" onClick={onClose} className="text-[11px] font-bold">Cancel</Button>
              <Button size="sm" onClick={handleImport} disabled={toImport.length === 0} className="text-[11px] font-bold">
                Import {toImport.length} Transaction{toImport.length !== 1 ? 's' : ''}
              </Button>
            </div>
          </>
        )}

        {/* ── Importing ─────────────────────────────────────────────────────── */}
        {step === 'importing' && (
          <div className="text-center py-4">
            <div className="text-[13px] text-muted-foreground mb-2">Importing…</div>
            <div className="text-[11px] text-muted-foreground">Saving {toImport.length} transactions to your account</div>
          </div>
        )}

        {/* ── Error ─────────────────────────────────────────────────────────── */}
        {step === 'error' && (
          <>
            <SectionLabel>Import Failed</SectionLabel>
            <p className="text-[13px] text-destructive mt-2 mb-5 leading-relaxed">{errorMsg}</p>
            <div className="flex gap-2 justify-end">
              <Button variant="outline" size="sm" onClick={onClose} className="text-[11px] font-bold">Close</Button>
              <Button size="sm" onClick={() => setStep('preview')} className="text-[11px] font-bold">Try Again</Button>
            </div>
          </>
        )}

        {/* ── Done ──────────────────────────────────────────────────────────── */}
        {step === 'done' && summary && (
          <>
            <div className="flex items-center gap-2.5 mb-4">
              <span className="text-[20px] text-cyan-600">✓</span>
              <div>
                <SectionLabel>Import Complete</SectionLabel>
                <div className="text-[13px] font-semibold">
                  {summary.total} transaction{summary.total !== 1 ? 's' : ''} saved
                  {summary.duplicateCount > 0 && (
                    <span className="font-normal text-muted-foreground ml-2">
                      · {summary.duplicateCount} skipped
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div className="bg-muted rounded-lg px-3 py-1 mb-4">
              <BreakdownRow label="Posted"            count={summary.posted}  sum={summary.postedSum} />
              <BreakdownRow label="Credits / Refunds" count={summary.credits} sum={summary.creditsSum} colorClass="text-cyan-600" sign="-" />
              {summary.includedPending && (
                <BreakdownRow label="Pending" count={summary.pending} sum={summary.pendingSum} colorClass="text-amber-600" />
              )}
            </div>

            {summary.rulesApplied?.length > 0 && (
              <div className="mb-4">
                <div className="text-[11px] font-bold tracking-[1px] uppercase text-muted-foreground mb-1.5">
                  Rules applied — {summary.rulesApplied.reduce((s, r) => s + r.count, 0)} transaction{summary.rulesApplied.reduce((s, r) => s + r.count, 0) !== 1 ? 's' : ''} recategorized
                </div>
                <div className="bg-muted rounded-lg px-3 py-1">
                  {summary.rulesApplied.map((r, i) => (
                    <div key={r.cat} className={`flex justify-between items-baseline py-1.5 ${i < summary.rulesApplied.length - 1 ? 'border-b border-border' : ''}`}>
                      <span className="text-[11px] text-muted-foreground">{fmtCat(r.cat)}</span>
                      <span className="text-[11px] font-bold text-foreground">{r.count}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {summary.duplicateCount > 0 && (
              <div className="mb-5">
                <div className="text-[11px] font-bold tracking-[1px] uppercase text-muted-foreground mb-1.5">
                  Skipped — already in database ({summary.duplicateCount})
                </div>
                <div className="bg-muted rounded-lg px-3 py-1 max-h-35 overflow-y-auto">
                  {summary.duplicateList.map((t, i) => (
                    <div key={i} className={`flex justify-between items-baseline py-1.5 ${i < summary.duplicateList.length - 1 ? 'border-b border-border' : ''}`}>
                      <span className="text-xs text-muted-foreground overflow-hidden text-ellipsis whitespace-nowrap max-w-60">{t.merchant}</span>
                      <span className="flex gap-3 items-baseline shrink-0">
                        <span className="text-[11px] text-muted-foreground">{t.date}</span>
                        <span className="text-xs font-bold text-muted-foreground">{fmt(Math.abs(t.amount))}</span>
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="flex justify-end">
              <Button size="sm" onClick={onClose} className="text-[11px] font-bold">Done</Button>
            </div>
          </>
        )}

      </DialogContent>
    </Dialog>
  );
}
