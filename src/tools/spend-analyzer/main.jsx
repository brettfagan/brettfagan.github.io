import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { AuthProvider } from './context/AuthContext';
import { CategoriesProvider } from './context/CategoriesContext';
import { CsvRulesProvider } from './context/CsvRulesContext';
import SpendAnalyzer from './SpendAnalyzer';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <AuthProvider>
      <CategoriesProvider>
        <CsvRulesProvider>
          <SpendAnalyzer />
        </CsvRulesProvider>
      </CategoriesProvider>
    </AuthProvider>
  </StrictMode>
);
