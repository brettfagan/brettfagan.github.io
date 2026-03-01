import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { fmtCat } from '../lib/format';

// ── BulkUpdateDialog ──────────────────────────────────────────────────────────
// Pre-action confirmation and post-action result for "Apply to all similar".
//
// Steps:
//   'confirm'  — show count + merchant + category change, let user proceed or cancel
//   'updating' — async operation in progress (MySpendingPage only)
//   'done'     — show success count
//
// Props:
//   step       'confirm' | 'updating' | 'done'
//   merchant   string
//   fromCat    string  (original category key)
//   toCat      string  (new category key)
//   count      number  (transactions affected)
//   onConfirm  () => void
//   onClose    () => void

export default function BulkUpdateDialog({ step, merchant, fromCat, toCat, count, onConfirm, onClose }) {
  const txLabel = `${count} transaction${count !== 1 ? 's' : ''}`;

  return (
    <Dialog open onOpenChange={open => { if (!open && step !== 'updating') onClose(); }}>
      <DialogContent className="sm:max-w-[400px]" showCloseButton={step !== 'updating'}>

        {/* ── Confirm ─────────────────────────────────────────────────────── */}
        {step === 'confirm' && (
          <>
            <div className="font-mono text-[11px] font-bold tracking-[1.5px] uppercase text-muted-foreground mb-1">
              Apply to all similar?
            </div>
            <p className="text-[13px] text-muted-foreground mt-1 mb-5 leading-relaxed">
              This will recategorize{' '}
              <span className="font-semibold text-foreground">{txLabel}</span>{' '}
              for{' '}
              <span className="font-semibold text-foreground">{merchant}</span>.
            </p>

            <div className="bg-muted rounded-lg px-3 py-2.5 mb-5 flex items-center gap-2 text-xs font-mono">
              <span className="text-muted-foreground">{fmtCat(fromCat)}</span>
              <span className="text-muted-foreground">→</span>
              <span className="font-bold text-foreground">{fmtCat(toCat)}</span>
            </div>

            <div className="flex gap-2 justify-end">
              <Button variant="outline" size="sm" onClick={onClose} className="font-mono text-[11px] font-bold">
                Cancel
              </Button>
              <Button size="sm" onClick={onConfirm} className="font-mono text-[11px] font-bold">
                Apply to {txLabel}
              </Button>
            </div>
          </>
        )}

        {/* ── Updating ────────────────────────────────────────────────────── */}
        {step === 'updating' && (
          <div className="text-center py-4">
            <div className="font-mono text-[13px] text-muted-foreground mb-2">Updating…</div>
            <div className="text-[11px] text-muted-foreground">Saving changes to {txLabel}</div>
          </div>
        )}

        {/* ── Done ────────────────────────────────────────────────────────── */}
        {step === 'done' && (
          <>
            <div className="flex items-center gap-2.5 mb-4">
              <span className="text-[20px] text-cyan-600">✓</span>
              <div>
                <div className="font-mono text-[11px] font-bold tracking-[1.5px] uppercase text-muted-foreground">
                  Update complete
                </div>
                <div className="text-[13px] font-semibold mt-0.5">
                  {txLabel} updated
                </div>
              </div>
            </div>

            <div className="bg-muted rounded-lg px-3 py-2.5 mb-5 flex items-center gap-2 text-xs font-mono">
              <span className="text-muted-foreground truncate">{merchant}</span>
              <span className="text-muted-foreground shrink-0">→</span>
              <span className="font-bold text-foreground shrink-0">{fmtCat(toCat)}</span>
            </div>

            <div className="flex justify-end">
              <Button size="sm" onClick={onClose} className="font-mono text-[11px] font-bold">Done</Button>
            </div>
          </>
        )}

      </DialogContent>
    </Dialog>
  );
}
