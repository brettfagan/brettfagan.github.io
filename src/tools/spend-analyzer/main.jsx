import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { AuthProvider } from './context/AuthContext';
import SpendAnalyzer from './SpendAnalyzer';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <AuthProvider>
      <SpendAnalyzer />
    </AuthProvider>
  </StrictMode>
);
