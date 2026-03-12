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

// window.name is set to 'google-signin' when we open the popup via window.open()
// and persists across all navigations (Google OAuth → back to our app).
const isPopupAuth = window.name === 'google-signin';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    {isPopupAuth ? <PopupAuthHandler /> : <App />}
  </React.StrictMode>
);
