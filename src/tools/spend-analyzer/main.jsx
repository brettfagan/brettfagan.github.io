import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { AuthProvider } from './context/AuthContext';
import { CategoriesProvider } from './context/CategoriesContext';
import { CsvRulesProvider } from './context/CsvRulesContext';
import { DetailLabelsProvider } from './context/DetailLabelsContext';
import SpendAnalyzer from './SpendAnalyzer';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <AuthProvider>
      <CategoriesProvider>
        <CsvRulesProvider>
          <DetailLabelsProvider>
            <SpendAnalyzer />
          </DetailLabelsProvider>
        </CsvRulesProvider>
      </CategoriesProvider>
    </AuthProvider>
  </StrictMode>
);
