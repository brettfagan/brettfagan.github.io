import React, { useEffect } from 'react';
import ReactDOM from 'react-dom/client';
import { inject } from '@vercel/analytics';
import App from './App';
import { supabase, sessionGuardReady } from './tools/spend-analyzer/lib/supabase';
import './globals.css';

inject();

// When this window is the OAuth popup callback, skip rendering the full app.
// Just exchange the auth code and close — the parent picks up the session
// via Supabase's cross-tab localStorage sync.
function PopupAuthHandler() {
  useEffect(() => {
    sessionGuardReady.then(() =>
      supabase.auth.getSession().then(() => window.close())
    );
  }, []);
  return null;
}

const isPopupAuth = new URLSearchParams(window.location.search).has('popup_auth');

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    {isPopupAuth ? <PopupAuthHandler /> : <App />}
  </React.StrictMode>
);
