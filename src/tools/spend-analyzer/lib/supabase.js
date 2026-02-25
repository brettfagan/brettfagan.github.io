import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY environment variables.');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Session guard: sign out when no app tab has been open for >15 min.
//
// AuthContext awaits sessionGuardReady before calling getSession(), so the
// existing `loading` state covers the guard window — no stale session is ever
// hydrated into app state and no data fetches fire against a cleared session.
//
// BroadcastChannel is used to verify whether another tab is alive before acting
// on a stale heartbeat. This prevents false sign-outs when JS timers are paused
// by system sleep or background throttling while a tab is still open.
export const sessionGuardReady = new Promise((resolve) => {
  const _HEARTBEAT_KEY = 'sb-heartbeat';
  const _TAB_KEY = 'sb-tab-init';
  const _STALE_MS = 15 * 60 * 1000; // 15 minutes

  try {
    // Read the previous heartbeat before this tab writes its own.
    const _lastBeat = parseInt(localStorage.getItem(_HEARTBEAT_KEY) || '0', 10);

    // Keep heartbeat alive while this tab is open.
    const _writeHeartbeat = () => localStorage.setItem(_HEARTBEAT_KEY, Date.now().toString());
    _writeHeartbeat();
    setInterval(_writeHeartbeat, 5 * 60 * 1000);

    // Whether this tab was genuinely open before this page load.
    // Only previously-open tabs answer liveness queries — tabs on their first load
    // (including all tabs in a concurrent session restore) must not reply, which
    // prevents them from mutually confirming each other as active when none was.
    const _wasAlreadyOpen = !!sessionStorage.getItem(_TAB_KEY);
    const _bc = new BroadcastChannel('sb-session');
    if (_wasAlreadyOpen) {
      _bc.addEventListener('message', (e) => {
        if (e.data === 'alive?') _bc.postMessage('alive');
      });
    }

    if (!_wasAlreadyOpen) {
      sessionStorage.setItem(_TAB_KEY, '1');

      if (Date.now() - _lastBeat > _STALE_MS) {
        // Heartbeat is stale — ask other tabs if the browser session is still active.
        let _confirmed = false;
        const _onAlive = (e) => { if (e.data === 'alive') _confirmed = true; };
        _bc.addEventListener('message', _onAlive);
        _bc.postMessage('alive?');

        setTimeout(async () => {
          _bc.removeEventListener('message', _onAlive);
          if (!_confirmed) {
            await supabase.auth.signOut({ scope: 'local' });
          }
          resolve();
        }, 100);
        return;
      }
    }
  } catch {
    // Storage or BroadcastChannel unavailable — proceed without guard.
  }

  resolve();
});
