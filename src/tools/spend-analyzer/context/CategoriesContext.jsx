import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from './AuthContext';

// ── Hardcoded defaults (used when signed out or before user cats load) ────────
export const DEFAULT_CATEGORIES = [
  { key: 'FOOD_AND_DRINK',     label: 'Food & Drink',       color: '#059669', excluded: false },
  { key: 'TRANSPORTATION',     label: 'Transportation',      color: '#0891b2', excluded: false },
  { key: 'RENT_AND_UTILITIES', label: 'Rent & Utilities',    color: '#d97706', excluded: false },
  { key: 'GENERAL_MERCHANDISE',label: 'General Merchandise', color: '#7c3aed', excluded: false },
  { key: 'MEDICAL',            label: 'Medical',             color: '#dc2626', excluded: false },
  { key: 'ENTERTAINMENT',      label: 'Entertainment',       color: '#2563eb', excluded: false },
  { key: 'TRAVEL',             label: 'Travel',              color: '#db2777', excluded: false },
  { key: 'PERSONAL_CARE',      label: 'Personal Care',       color: '#ea580c', excluded: false },
  { key: 'GENERAL_SERVICES',   label: 'General Services',    color: '#4f46e5', excluded: false },
  { key: 'LOAN_PAYMENTS',      label: 'Loan Payments',       color: '#6b7280', excluded: true  },
  { key: 'INCOME',             label: 'Income',              color: '#6b7280', excluded: true  },
];

export const COLOR_PALETTE = [
  '#059669', // emerald
  '#0891b2', // cyan
  '#2563eb', // blue
  '#4f46e5', // indigo
  '#7c3aed', // violet
  '#db2777', // pink
  '#dc2626', // red
  '#ea580c', // orange
  '#d97706', // amber
  '#65a30d', // lime
  '#0d9488', // teal
  '#6b7280', // gray
];

const CategoriesContext = createContext(null);

export function CategoriesProvider({ children }) {
  const { user } = useAuth();
  const [categories, setCategories] = useState(DEFAULT_CATEGORIES);
  const [loading, setLoading] = useState(false);

  // Fetch from Supabase when user signs in
  useEffect(() => {
    if (!user) {
      setCategories(DEFAULT_CATEGORIES);
      return;
    }
    setLoading(true);
    supabase
      .from('categories')
      .select('key, label, color, excluded')
      .order('key')
      .then(({ data, error }) => {
        if (error) {
          console.error('Failed to load categories:', error.message);
        } else if (data && data.length > 0) {
          setCategories(data);
        } else {
          // First sign-in: seed defaults into Supabase silently
          seedDefaults(user.id);
          setCategories(DEFAULT_CATEGORIES);
        }
        setLoading(false);
      });
  }, [user]);

  async function seedDefaults(userId) {
    const rows = DEFAULT_CATEGORIES.map(c => ({ ...c, user_id: userId }));
    const { error } = await supabase.from('categories').insert(rows);
    if (error) console.error('Failed to seed default categories:', error.message);
  }

  // Upsert a single category (add or update)
  const saveCategory = useCallback(async (cat) => {
    if (!user) return;
    const row = { user_id: user.id, key: cat.key, label: cat.label, color: cat.color, excluded: cat.excluded };
    const { error } = await supabase
      .from('categories')
      .upsert(row, { onConflict: 'user_id,key' });
    if (error) {
      console.error('Failed to save category:', error.message);
      return false;
    }
    setCategories(prev => {
      const existing = prev.find(c => c.key === cat.key);
      if (existing) return prev.map(c => c.key === cat.key ? { ...c, ...cat } : c);
      return [...prev, cat];
    });
    return true;
  }, [user]);

  // Delete a category by key
  const deleteCategory = useCallback(async (key) => {
    if (!user) return;
    const { error } = await supabase
      .from('categories')
      .delete()
      .eq('user_id', user.id)
      .eq('key', key);
    if (error) {
      console.error('Failed to delete category:', error.message);
      return false;
    }
    setCategories(prev => prev.filter(c => c.key !== key));
    return true;
  }, [user]);

  // Reset to defaults — deletes all user categories and reseeds
  const resetToDefaults = useCallback(async () => {
    if (!user) return;
    const { error } = await supabase
      .from('categories')
      .delete()
      .eq('user_id', user.id);
    if (error) {
      console.error('Failed to reset categories:', error.message);
      return false;
    }
    await seedDefaults(user.id);
    setCategories(DEFAULT_CATEGORIES);
    return true;
  }, [user]);

  // Convenience lookups used throughout the app
  const getCatColor = useCallback((key) => {
    return categories.find(c => c.key === key)?.color || '#6b6b75';
  }, [categories]);

  const getCatLabel = useCallback((key) => {
    return categories.find(c => c.key === key)?.label
      || (key || 'OTHER').replace(/_/g, ' ').replace(/\b\w/g, x => x.toUpperCase());
  }, [categories]);

  const excludedKeys = categories.filter(c => c.excluded).map(c => c.key);

  return (
    <CategoriesContext.Provider value={{
      categories,
      loading,
      excludedKeys,
      getCatColor,
      getCatLabel,
      saveCategory,
      deleteCategory,
      resetToDefaults,
    }}>
      {children}
    </CategoriesContext.Provider>
  );
}

export function useCategories() {
  const ctx = useContext(CategoriesContext);
  if (!ctx) throw new Error('useCategories must be used within a CategoriesProvider');
  return ctx;
}
