import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY environment variables.');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Session guard: sign the user out when the browser is reopened after being closed.
//
// Each tab writes a heartbeat to localStorage every 5 min while the app is open.
// On first load in a new tab, a BroadcastChannel query asks any other open app
// tabs if the browser session is still active. If a response arrives within 100 ms,
// auth is preserved (the browser session is confirmed live). If no response arrives,
// the pre-load heartbeat is checked: stale (>15 min) means the browser was closed
// and supabase.auth.signOut() is called to clear the local session.
//
// This distinguishes "app tab closed, browser still running" (BC response or fresh
// heartbeat) from "browser was closed" (no BC response + stale heartbeat).
try {
  const _HEARTBEAT_KEY = 'sb-heartbeat';
  const _TAB_KEY = 'sb-tab-init';
  const _STALE_MS = 15 * 60 * 1000; // 15 minutes

  // Capture the heartbeat written by previous tabs before this tab updates it.
  const _lastBeat = parseInt(localStorage.getItem(_HEARTBEAT_KEY) || '0', 10);

  // Keep the heartbeat alive while this tab is open.
  const _writeHeartbeat = () => localStorage.setItem(_HEARTBEAT_KEY, Date.now().toString());
  _writeHeartbeat();
  setInterval(_writeHeartbeat, 5 * 60 * 1000);

  const _bc = new BroadcastChannel('sb-session');

  // Answer liveness queries from newly opened tabs.
  _bc.addEventListener('message', (e) => {
    if (e.data === 'alive?') _bc.postMessage('alive');
  });

  if (!sessionStorage.getItem(_TAB_KEY)) {
    sessionStorage.setItem(_TAB_KEY, '1');

    // Ask other open tabs if the browser session is still active.
    let _confirmed = false;
    const _onAlive = (e) => { if (e.data === 'alive') _confirmed = true; };
    _bc.addEventListener('message', _onAlive);
    _bc.postMessage('alive?');

    setTimeout(() => {
      _bc.removeEventListener('message', _onAlive);
      if (!_confirmed && Date.now() - _lastBeat > _STALE_MS) {
        supabase.auth.signOut({ scope: 'local' });
      }
    }, 100);
  }
} catch {
  // BroadcastChannel or Web Storage unavailable — skip session guard.
}
