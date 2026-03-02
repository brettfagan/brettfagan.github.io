import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import { Button } from '@/components/ui/button';

export default function LinkedAccessManager() {
  const { user, linkedPartnerEmail, pendingInviteEmail, refreshPartnerStatus } = useAuth();
  const [email, setEmail] = useState('');
  const [sending, setSending] = useState(false);
  const [removing, setRemoving] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  async function handleSendInvite(e) {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    const trimmed = email.trim();
    if (!trimmed) return;

    setSending(true);
    const { data: { session } } = await supabase.auth.getSession();
    const res = await fetch(
      `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/send-invite`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ invitedEmail: trimmed }),
      },
    );
    const json = await res.json();
    setSending(false);

    if (!res.ok) {
      setError(json.error || 'Failed to send invitation.');
    } else {
      setEmail('');
      setSuccess(`Invitation sent to ${trimmed}.`);
      await refreshPartnerStatus();
    }
  }

  async function handleCancelInvite() {
    setError(null);
    setCancelling(true);
    const { error: dbError } = await supabase
      .from('partner_invites')
      .delete()
      .eq('master_user_id', user.id);
    setCancelling(false);
    if (dbError) {
      setError('Failed to cancel the invitation.');
    } else {
      await refreshPartnerStatus();
    }
  }

  async function handleRemoveAccess() {
    setError(null);
    setRemoving(true);
    const { error: dbError } = await supabase
      .from('partner_access')
      .delete()
      .eq('master_user_id', user.id);
    setRemoving(false);
    if (dbError) {
      setError('Failed to remove partner access.');
    } else {
      await refreshPartnerStatus();
    }
  }

  return (
    <div className="flex flex-col gap-6">

      {/* ── Active link ──────────────────────────────────────────────────── */}
      {linkedPartnerEmail && (
        <div className="flex items-center justify-between gap-4 bg-muted border border-border rounded-lg px-5 py-4">
          <div>
            <div className="text-[11px] font-bold tracking-[1px] uppercase text-muted-foreground mb-1">Partner access active</div>
            <div className="text-sm font-semibold">{linkedPartnerEmail}</div>
            <div className="text-[11px] text-muted-foreground mt-0.5">This person can view your spending data.</div>
          </div>
          <Button
            size="sm"
            variant="outline"
            onClick={handleRemoveAccess}
            disabled={removing}
            className="text-xs shrink-0"
          >
            {removing ? 'Removing…' : 'Remove Access'}
          </Button>
        </div>
      )}

      {/* ── Pending invite ────────────────────────────────────────────────── */}
      {!linkedPartnerEmail && pendingInviteEmail && (
        <div className="flex items-center justify-between gap-4 bg-muted border border-border rounded-lg px-5 py-4">
          <div>
            <div className="text-[11px] font-bold tracking-[1px] uppercase text-muted-foreground mb-1">Invitation pending</div>
            <div className="text-sm font-semibold">{pendingInviteEmail}</div>
            <div className="text-[11px] text-muted-foreground mt-0.5">Waiting for them to accept via the emailed link.</div>
          </div>
          <Button
            size="sm"
            variant="outline"
            onClick={handleCancelInvite}
            disabled={cancelling}
            className="text-xs shrink-0"
          >
            {cancelling ? 'Cancelling…' : 'Cancel Invite'}
          </Button>
        </div>
      )}

      {/* ── Invite form (shown only when no active link or pending invite) ── */}
      {!linkedPartnerEmail && !pendingInviteEmail && (
        <form onSubmit={handleSendInvite} className="flex flex-col gap-3">
          <div className="text-xs text-muted-foreground leading-relaxed">
            Enter your partner's Google account email address. They'll receive an invitation to view your spending data with limited access — they can browse transactions and recategorize, but cannot import data, delete transactions, or access settings.
          </div>
          <div className="flex gap-2 items-center">
            <input
              type="email"
              placeholder="partner@example.com"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              className="flex-1 bg-muted border border-border rounded text-xs py-2 px-3 outline-none text-foreground placeholder:text-muted-foreground focus:border-primary transition-colors"
            />
            <Button type="submit" size="sm" disabled={sending || !email.trim()} className="text-xs font-bold shrink-0">
              {sending ? 'Sending…' : 'Send Invite'}
            </Button>
          </div>
        </form>
      )}

      {/* ── Feedback messages ─────────────────────────────────────────────── */}
      {error && (
        <p className="text-xs text-destructive">{error}</p>
      )}
      {success && (
        <p className="text-xs text-emerald-600">{success}</p>
      )}

    </div>
  );
}
