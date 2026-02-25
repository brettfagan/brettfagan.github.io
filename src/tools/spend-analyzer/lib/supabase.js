import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY environment variables.');
}

// Session guard: clear stored auth when the browser is reopened after being closed.
// A heartbeat timestamp is written to localStorage every 5 minutes while the app
// is open in any tab. On first load in a new tab, if the heartbeat is stale (>8 h)
// it indicates the browser was closed (not merely that this tab was closed while
// the browser remained open), and the stored session is cleared.
const _HEARTBEAT_KEY = 'sb-heartbeat';
const _TAB_KEY = 'sb-tab-init';
const _STALE_MS = 8 * 60 * 60 * 1000; // 8 hours

try {
  if (!sessionStorage.getItem(_TAB_KEY)) {
    const lastBeat = parseInt(localStorage.getItem(_HEARTBEAT_KEY) || '0', 10);
    if (Date.now() - lastBeat > _STALE_MS) {
      Object.keys(localStorage)
        .filter(k => k.startsWith('sb-') && k !== _HEARTBEAT_KEY)
        .forEach(k => localStorage.removeItem(k));
    }
    sessionStorage.setItem(_TAB_KEY, '1');
  }

  const _writeHeartbeat = () => localStorage.setItem(_HEARTBEAT_KEY, Date.now().toString());
  _writeHeartbeat();
  setInterval(_writeHeartbeat, 5 * 60 * 1000); // every 5 minutes
} catch {
  // Storage unavailable (e.g. strict privacy settings) — skip session guard
  // and let Supabase initialize normally without persistent session support.
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
