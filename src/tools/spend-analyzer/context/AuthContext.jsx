import { createContext, useContext, useEffect, useState } from 'react';
import { supabase, sessionGuardReady } from '../lib/supabase';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(undefined); // undefined = loading, null = signed out
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!supabase) {
      setUser(null);
      setLoading(false);
      return;
    }

    // Both the auth state listener and getSession() are deferred behind
    // sessionGuardReady so that the INITIAL_SESSION event fires with the
    // post-guard state. Registering onAuthStateChange before the guard
    // completes would push a stale session into `user` before sign-out runs.
    let subscription;

    sessionGuardReady.then(() => {
      // Set up the listener first (recommended Supabase pattern to avoid races),
      // then confirm the current session.
      const { data: { subscription: sub } } = supabase.auth.onAuthStateChange((_event, session) => {
        setUser(session?.user ?? null);
      });
      subscription = sub;

      supabase.auth.getSession().then(({ data: { session } }) => {
        setUser(session?.user ?? null);
        setLoading(false);
      });
    });

    return () => subscription?.unsubscribe();
  }, []);

  async function signInWithGoogle() {
    if (!supabase) return;
    const redirectTo = `${window.location.origin}${window.location.pathname}`;
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo },
    });
    if (error) console.error('Sign in error:', error.message);
  }

  async function signOut() {
    if (!supabase) return;
    const { error } = await supabase.auth.signOut();
    if (error) console.error('Sign out error:', error.message);
  }

  return (
    <AuthContext.Provider value={{ user, loading, signInWithGoogle, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
}
