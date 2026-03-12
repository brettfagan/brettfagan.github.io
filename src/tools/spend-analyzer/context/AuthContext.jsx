import { createContext, useContext, useEffect, useState } from 'react';
import { supabase, sessionGuardReady } from '../lib/supabase';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(undefined); // undefined = loading, null = signed out
  const [loading, setLoading] = useState(true);
  // 'primary' = account owner, 'linked' = partner with delegated access
  const [role, setRole] = useState('primary');
  // For linked users: the master's user_id used in all data queries
  const [effectiveUserId, setEffectiveUserId] = useState(null);
  // For primary users: info about their linked partner (if any)
  const [linkedPartnerEmail, setLinkedPartnerEmail] = useState(null);
  // For primary users: email address of a pending invite (if any)
  const [pendingInviteEmail, setPendingInviteEmail] = useState(null);

  async function loadPartnerStatus(currentUser) {
    if (!currentUser) {
      setRole('primary');
      setEffectiveUserId(null);
      setLinkedPartnerEmail(null);
      setPendingInviteEmail(null);
      return;
    }

    // Check if this user is a linked partner
    const { data: partnerRow } = await supabase
      .from('partner_access')
      .select('master_user_id')
      .eq('partner_user_id', currentUser.id)
      .maybeSingle();

    if (partnerRow) {
      setRole('linked');
      setEffectiveUserId(partnerRow.master_user_id);
      return;
    }

    // This user is a primary — check if they have a linked partner
    setRole('primary');
    setEffectiveUserId(currentUser.id);

    const [accessRes, inviteRes] = await Promise.all([
      supabase
        .from('partner_access')
        .select('partner_email')
        .eq('master_user_id', currentUser.id)
        .maybeSingle(),
      supabase
        .from('partner_invites')
        .select('invited_email')
        .eq('master_user_id', currentUser.id)
        .maybeSingle(),
    ]);

    setLinkedPartnerEmail(accessRes.data?.partner_email ?? null);
    setPendingInviteEmail(inviteRes.data?.invited_email ?? null);
  }

  useEffect(() => {
    let subscription;

    sessionGuardReady.then(() => {
      const { data: { subscription: sub } } = supabase.auth.onAuthStateChange((_event, session) => {
        const currentUser = session?.user ?? null;
        setUser(currentUser);
        // Optimistically set effectiveUserId = user.id for primary users so
        // data contexts don't wait on the partner status query. loadPartnerStatus
        // will override this if the user turns out to be a linked partner.
        setEffectiveUserId(currentUser?.id ?? null);
        loadPartnerStatus(currentUser);
      });
      subscription = sub;

      supabase.auth.getSession().then(({ data: { session } }) => {
        const currentUser = session?.user ?? null;
        setUser(currentUser);
        setEffectiveUserId(currentUser?.id ?? null);
        loadPartnerStatus(currentUser).then(() => {
          setLoading(false);
          // If this window is the OAuth popup callback, close it so the
          // parent window (which stays open) picks up the session via
          // Supabase's cross-tab localStorage sync / onAuthStateChange.
          if (new URLSearchParams(window.location.search).has('popup_auth')) {
            window.close();
          }
        });
      });
    });

    return () => subscription?.unsubscribe();
  }, []);

  async function signInWithGoogle() {
    const redirectTo = `${window.location.origin}${window.location.pathname}?popup_auth=1`;
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo, skipBrowserRedirect: true },
    });
    if (error) { console.error('Sign in error:', error.message); return; }
    const w = 500, h = 640;
    const left = Math.round(window.screenX + (window.outerWidth - w) / 2);
    const top  = Math.round(window.screenY + (window.outerHeight - h) / 2);
    window.open(data.url, 'google-signin', `width=${w},height=${h},left=${left},top=${top},scrollbars=yes`);
  }

  async function signOut() {
    const { error } = await supabase.auth.signOut();
    if (error) console.error('Sign out error:', error.message);
  }

  // Called from SettingsPage after successfully sending/cancelling an invite
  // or removing a partner link — refreshes partner status without full reload.
  async function refreshPartnerStatus() {
    if (user) await loadPartnerStatus(user);
  }

  return (
    <AuthContext.Provider value={{
      user,
      loading,
      role,
      effectiveUserId,
      linkedPartnerEmail,
      pendingInviteEmail,
      signInWithGoogle,
      signOut,
      refreshPartnerStatus,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
}
