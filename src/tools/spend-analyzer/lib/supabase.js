import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY environment variables.');
}

// Session guard: synchronously clear stale auth before the Supabase client
// initializes, so no stale session is ever hydrated into app state.
//
// A heartbeat is written to localStorage every 5 min while any app tab is open.
// On first load in a new tab, if the heartbeat is stale (>15 min) the stored
// Supabase auth keys are removed before createClient() runs. This covers both
// browser-close and all-tabs-closed scenarios; distinguishing the two is not
// possible in client-side JS without a service worker, and the stricter behavior
// (sign out after 15 min of no open tabs) is acceptable for a personal financial app.
const _HEARTBEAT_KEY = 'sb-heartbeat';
const _TAB_KEY = 'sb-tab-init';
const _STALE_MS = 15 * 60 * 1000; // 15 minutes

try {
  const _lastBeat = parseInt(localStorage.getItem(_HEARTBEAT_KEY) || '0', 10);

  if (!sessionStorage.getItem(_TAB_KEY)) {
    sessionStorage.setItem(_TAB_KEY, '1');
    if (Date.now() - _lastBeat > _STALE_MS) {
      Object.keys(localStorage)
        .filter(k => k.startsWith('sb-') && k !== _HEARTBEAT_KEY)
        .forEach(k => localStorage.removeItem(k));
    }
  }

  const _writeHeartbeat = () => localStorage.setItem(_HEARTBEAT_KEY, Date.now().toString());
  _writeHeartbeat();
  setInterval(_writeHeartbeat, 5 * 60 * 1000);
} catch {
  // Storage unavailable (e.g. strict privacy settings) — skip session guard.
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
