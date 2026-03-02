import { createContext, useContext, useEffect, useRef, useState, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from './AuthContext';

// ── Hardcoded defaults (used when signed out or before user cats load) ────────
export const DEFAULT_CATEGORIES = [
  { key: 'FOOD_AND_DRINK',            label: 'Food & Drink',             color: '#059669', excluded: false },
  { key: 'TRANSPORTATION',            label: 'Transportation',            color: '#0891b2', excluded: false },
  { key: 'RENT_AND_UTILITIES',        label: 'Rent & Utilities',          color: '#d97706', excluded: false },
  { key: 'GENERAL_MERCHANDISE',       label: 'General Merchandise',       color: '#7c3aed', excluded: false },
  { key: 'MEDICAL',                   label: 'Medical',                   color: '#dc2626', excluded: false },
  { key: 'ENTERTAINMENT',             label: 'Entertainment',             color: '#2563eb', excluded: false },
  { key: 'TRAVEL',                    label: 'Travel',                    color: '#db2777', excluded: false },
  { key: 'PERSONAL_CARE',             label: 'Personal Care',             color: '#ea580c', excluded: false },
  { key: 'GENERAL_SERVICES',          label: 'General Services',          color: '#4f46e5', excluded: false },
  { key: 'HOME_IMPROVEMENT',          label: 'Home Improvement',          color: '#0d9488', excluded: false },
  { key: 'BANK_FEES',                 label: 'Bank Fees',                 color: '#65a30d', excluded: false },
  { key: 'GOVERNMENT_AND_NON_PROFIT', label: 'Government & Non-Profit',   color: '#9333ea', excluded: false },
  { key: 'OTHER',                     label: 'Other',                     color: '#6b7280', excluded: false },
  { key: 'LOAN_PAYMENTS',             label: 'Loan Payments',             color: '#6b7280', excluded: true  },
  { key: 'LOAN_DISBURSEMENTS',        label: 'Loan Disbursements',        color: '#6b7280', excluded: true  },
  { key: 'INCOME',                    label: 'Income',                    color: '#6b7280', excluded: true  },
  { key: 'TRANSFER_IN',               label: 'Transfer In',               color: '#6b7280', excluded: true  },
  { key: 'TRANSFER_OUT',              label: 'Transfer Out',              color: '#6b7280', excluded: true  },
];

export const COLOR_PALETTE = [
  '#16a34a', // green
  '#059669', // emerald
  '#0d9488', // teal
  '#0f766e', // dark teal
  '#65a30d', // lime
  '#4d7c0f', // dark lime
  '#0891b2', // cyan
  '#0284c7', // sky
  '#2563eb', // blue
  '#1d4ed8', // dark blue
  '#4f46e5', // indigo
  '#4338ca', // dark indigo
  '#6d28d9', // dark violet
  '#7c3aed', // violet
  '#9333ea', // purple
  '#a21caf', // fuchsia
  '#be185d', // dark pink
  '#db2777', // pink
  '#e11d48', // rose
  '#dc2626', // red
  '#b91c1c', // dark red
  '#c2410c', // dark orange
  '#ea580c', // orange
  '#d97706', // amber
  '#b45309', // dark amber
  '#a16207', // yellow-amber
  '#92400e', // brown
  '#57534e', // stone
  '#6b7280', // gray
  '#374151', // dark gray
  '#9d174d', // deep pink
  '#831843', // very deep pink
  '#c026d3', // magenta
  '#86198f', // deep fuchsia
  '#7e22ce', // medium purple
  '#6b21a8', // deep purple
  '#1e3a8a', // navy
  '#075985', // dark sky
  '#15803d', // medium green
  '#166534', // dark green
  '#881337', // burgundy
  '#7f1d1d', // maroon
  '#9a3412', // terracotta
  '#b8860b', // gold
  '#854d0e', // dark gold
  '#78350f', // deep amber
  '#3f6212', // olive
  '#164e63', // dark cyan
  '#475569', // slate
  '#334155', // dark slate
];

const CategoriesContext = createContext(null);

export function CategoriesProvider({ children }) {
  const { user, role, effectiveUserId } = useAuth();
  const [categories, setCategories] = useState(DEFAULT_CATEGORIES);
  const [loading, setLoading] = useState(false);
  // Guard against StrictMode double-invoke seeding the same user twice
  const seedingRef = useRef(false);

  // Fetch from Supabase when user signs in
  useEffect(() => {
    if (!user) {
      setCategories(DEFAULT_CATEGORIES);
      seedingRef.current = false;
      return;
    }
    // Wait until effectiveUserId is resolved (may lag one render behind user)
    if (!effectiveUserId) return;

    let cancelled = false;
    setLoading(true);

    supabase
      .from('categories')
      .select('key, label, color, excluded')
      .eq('user_id', effectiveUserId)
      .order('key')
      .then(({ data, error }) => {
        if (cancelled) return;
        if (error) {
          console.error('Failed to load categories:', error.message);
        } else if (data && data.length > 0) {
          setCategories(data);
        } else if (!seedingRef.current && role !== 'linked') {
          // First sign-in for primary users: seed defaults into Supabase silently
          seedingRef.current = true;
          seedDefaults(effectiveUserId);
          setCategories(DEFAULT_CATEGORIES);
        }
        if (!cancelled) setLoading(false);
      });

    return () => { cancelled = true; };
  }, [user, effectiveUserId, role]);

  async function seedDefaults(userId) {
    const rows = DEFAULT_CATEGORIES.map(c => ({ ...c, user_id: userId }));
    // upsert with ignoreDuplicates as DB-level safety net
    const { error } = await supabase
      .from('categories')
      .upsert(rows, { onConflict: 'user_id,key', ignoreDuplicates: true });
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
    seedingRef.current = false;
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
