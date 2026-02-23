import { createContext, useContext, useEffect, useRef, useState, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from './AuthContext';
import { fmtDetail } from '../lib/format';

const DetailLabelsContext = createContext(null);

export function DetailLabelsProvider({ children }) {
  const { user } = useAuth();
  const [detailLabels, setDetailLabels] = useState([]);
  const [loading, setLoading] = useState(false);
  // StrictMode safety — prevents duplicate load race conditions
  const cancelledRef = useRef(false);

  useEffect(() => {
    if (!user) {
      setDetailLabels([]);
      return;
    }

    let cancelled = false;
    setLoading(true);

    supabase
      .from('detail_labels')
      .select('id, cat_detail, label')
      .eq('user_id', user.id)
      .order('cat_detail')
      .then(({ data, error }) => {
        if (cancelled) return;
        if (error) {
          console.error('Failed to load detail labels:', error.message);
        } else {
          setDetailLabels(data || []);
        }
        if (!cancelled) setLoading(false);
      });

    return () => { cancelled = true; };
  }, [user]);

  // Upsert a single label. Returns true on success, false on failure.
  const saveDetailLabel = useCallback(async (cat_detail, label) => {
    if (!user) return false;
    const row = { user_id: user.id, cat_detail: cat_detail.trim(), label: label.trim() };
    const { data, error } = await supabase
      .from('detail_labels')
      .upsert(row, { onConflict: 'user_id,cat_detail' })
      .select('id, cat_detail, label')
      .single();
    if (error) {
      console.error('Failed to save detail label:', error.message);
      return false;
    }
    setDetailLabels(prev => {
      const existing = prev.find(dl => dl.cat_detail === cat_detail.trim());
      if (existing) return prev.map(dl => dl.cat_detail === cat_detail.trim() ? data : dl);
      return [...prev, data].sort((a, b) => a.cat_detail.localeCompare(b.cat_detail));
    });
    return true;
  }, [user]);

  // Delete a label by cat_detail key.
  const deleteDetailLabel = useCallback(async (cat_detail) => {
    if (!user) return false;
    const { error } = await supabase
      .from('detail_labels')
      .delete()
      .eq('user_id', user.id)
      .eq('cat_detail', cat_detail);
    if (error) {
      console.error('Failed to delete detail label:', error.message);
      return false;
    }
    setDetailLabels(prev => prev.filter(dl => dl.cat_detail !== cat_detail));
    return true;
  }, [user]);

  // Convenience lookup used throughout results views.
  // Returns custom label if found, else falls back to fmtDetail().
  const getDetailLabel = useCallback((cat_detail) => {
    if (!cat_detail) return '';
    const found = detailLabels.find(dl => dl.cat_detail === cat_detail);
    return found ? found.label : fmtDetail(cat_detail);
  }, [detailLabels]);

  return (
    <DetailLabelsContext.Provider value={{
      detailLabels,
      loading,
      saveDetailLabel,
      deleteDetailLabel,
      getDetailLabel,
    }}>
      {children}
    </DetailLabelsContext.Provider>
  );
}

export function useDetailLabels() {
  const ctx = useContext(DetailLabelsContext);
  if (!ctx) throw new Error('useDetailLabels must be used within a DetailLabelsProvider');
  return ctx;
}
