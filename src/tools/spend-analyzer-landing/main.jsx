import React from 'react';
import { createRoot } from 'react-dom/client';
import '../../globals.css';
import { AuthProvider } from '../spend-analyzer/context/AuthContext';
import LandingPage from './LandingPage';

createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <AuthProvider>
      <LandingPage />
    </AuthProvider>
  </React.StrictMode>
);
