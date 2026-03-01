import '../../globals.css';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { ThemeProvider } from 'next-themes';
import { AuthProvider } from './context/AuthContext';
import { CategoriesProvider } from './context/CategoriesContext';
import { CatRulesProvider } from './context/CatRulesContext';
import { DetailLabelsProvider } from './context/DetailLabelsContext';
import SpendAnalyzer from './SpendAnalyzer';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
    <AuthProvider>
      <CategoriesProvider>
        <CatRulesProvider>
          <DetailLabelsProvider>
            <SpendAnalyzer />
          </DetailLabelsProvider>
        </CatRulesProvider>
      </CategoriesProvider>
    </AuthProvider>
    </ThemeProvider>
  </StrictMode>
);
