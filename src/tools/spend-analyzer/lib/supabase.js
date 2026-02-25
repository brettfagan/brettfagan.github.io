import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY environment variables.');
}

// Session guard: clear stored auth when the browser is reopened after being closed.
// Each tab writes a heartbeat to localStorage every 30 s while the app is open.
// On first load in a new tab, if the heartbeat is stale (>90 s) it means no tabs
// were open — i.e. the browser was closed — and the session should be cleared.
// If the heartbeat is fresh, a new tab was opened within an active browser session
// and auth is preserved normally (cross-tab sharing continues to work).
const _HEARTBEAT_KEY = 'sb-heartbeat';
const _TAB_KEY = 'sb-tab-init';

try {
  if (!sessionStorage.getItem(_TAB_KEY)) {
    const lastBeat = parseInt(localStorage.getItem(_HEARTBEAT_KEY) || '0', 10);
    if (Date.now() - lastBeat > 90_000) {
      Object.keys(localStorage)
        .filter(k => k.startsWith('sb-') && k !== _HEARTBEAT_KEY)
        .forEach(k => localStorage.removeItem(k));
    }
    sessionStorage.setItem(_TAB_KEY, '1');
  }

  const _writeHeartbeat = () => localStorage.setItem(_HEARTBEAT_KEY, Date.now().toString());
  _writeHeartbeat();
  setInterval(_writeHeartbeat, 30_000);
} catch {
  // Storage unavailable (e.g. strict privacy settings) — skip session guard
  // and let Supabase initialize normally without persistent session support.
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
