import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import SpendAnalyzer from './SpendAnalyzer';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <SpendAnalyzer />
  </StrictMode>
);
