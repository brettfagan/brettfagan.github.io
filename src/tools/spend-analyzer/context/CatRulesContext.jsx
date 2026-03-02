import { createContext, useContext, useEffect, useRef, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from './AuthContext';
import { validatePattern } from '../lib/parse';

// ── Default rules (mirrors guessCat() hardcoded patterns) ────────────────────
export const DEFAULT_RULES = [
  { pattern: 'FOOD|DINING|RESTAURANT|GROCERY|GROC|COFFEE|CAFE', match_field: 'both', cat: 'FOOD_AND_DRINK',      cat_detail: null,                              priority: 0 },
  { pattern: 'GAS|FUEL|AUTO|UBER|LYFT|PARKING|TRANSIT',         match_field: 'both', cat: 'TRANSPORTATION',      cat_detail: null,                              priority: 1 },
  { pattern: 'UTIL|PHONE|INTERNET|ELECTRIC|CABLE|WATER',        match_field: 'both', cat: 'RENT_AND_UTILITIES',   cat_detail: null,                              priority: 2 },
  { pattern: 'MEDICAL|HEALTH|PHARMACY|DRUG|DOCTOR',             match_field: 'both', cat: 'MEDICAL',             cat_detail: null,                              priority: 3 },
  { pattern: 'ENTERTAIN|MOVIE|SPORT|THEATER',                   match_field: 'both', cat: 'ENTERTAINMENT',       cat_detail: null,                              priority: 4 },
  { pattern: 'HOTEL|FLIGHT|AIRLINE|TRAVEL|AIRBNB',              match_field: 'both', cat: 'TRAVEL',              cat_detail: null,                              priority: 5 },
  { pattern: 'SHOP|AMAZON|WALMART|TARGET|MERCHANDISE',          match_field: 'both', cat: 'GENERAL_MERCHANDISE', cat_detail: null,                              priority: 6 },
  { pattern: 'PERSONAL|SPA|SALON|GYM|FITNESS',                  match_field: 'both', cat: 'PERSONAL_CARE',       cat_detail: null,                              priority: 7 },
];

// ── Context ───────────────────────────────────────────────────────────────────
const CatRulesContext = createContext(null);

export function CatRulesProvider({ children }) {
  const { user, role, effectiveUserId } = useAuth();
  const [rules, setRules] = useState(DEFAULT_RULES);
  const [loading, setLoading] = useState(false);
  // Guard against StrictMode double-invoke seeding the same user twice
  const seedingRef = useRef(false);

  // ── Fetch or seed on sign-in ────────────────────────────────────────────────
  useEffect(() => {
    if (!user) {
      setRules(DEFAULT_RULES);
      seedingRef.current = false;
      return;
    }
    // Wait until effectiveUserId is resolved
    if (!effectiveUserId) return;

    let cancelled = false;

    async function load() {
      setLoading(true);
      const { data, error } = await supabase
        .from('cat_rules')
        .select('*')
        .eq('user_id', effectiveUserId)
        .order('priority', { ascending: true });

      if (cancelled) return;

      if (error) {
        console.error('CatRulesContext fetch error:', error);
        setRules(DEFAULT_RULES);
        setLoading(false);
        return;
      }

      if (!data || data.length === 0) {
        // Only seed defaults for primary users on their first sign-in
        if (!seedingRef.current && role !== 'linked') {
          seedingRef.current = true;
          await seedDefaults(effectiveUserId);
        }
      } else {
        setRules(data);
      }
      if (!cancelled) setLoading(false);
    }

    load();
    // Cleanup: mark this invocation as stale if effect re-runs (StrictMode / user change)
    return () => { cancelled = true; };
  }, [user, effectiveUserId, role]);

  async function seedDefaults(userId) {
    const rows = DEFAULT_RULES.map(r => ({ ...r, user_id: userId }));
    // ON CONFLICT DO NOTHING is the DB-level safety net against any duplicate inserts
    const { data, error } = await supabase
      .from('cat_rules')
      .upsert(rows, { onConflict: 'user_id,priority', ignoreDuplicates: true })
      .select()
      .order('priority', { ascending: true });
    if (!error && data && data.length > 0) setRules(data);
  }

  // ── Re-fetch helper (after reorder) ─────────────────────────────────────────
  async function refetch() {
    if (!user || !effectiveUserId) return;
    const { data } = await supabase
      .from('cat_rules')
      .select('*')
      .eq('user_id', effectiveUserId)
      .order('priority', { ascending: true });
    if (data) setRules(data);
  }

  // ── Save (insert new or update existing) ────────────────────────────────────
  async function saveRule(rule) {
    if (!user) return false;
    if (validatePattern(rule.pattern)) return false; // defense-in-depth: UI validates first

    if (!rule.id) {
      // New rule — append at end
      const maxPriority = rules.length > 0 ? Math.max(...rules.map(r => r.priority)) + 1 : 0;
      const { data, error } = await supabase
        .from('cat_rules')
        .insert({ ...rule, user_id: user.id, priority: maxPriority })
        .select()
        .single();
      if (error) { console.error('saveRule insert error:', error); return false; }
      setRules(prev => [...prev, data]);
      return true;
    }

    // Update existing
    const { data, error } = await supabase
      .from('cat_rules')
      .update({ pattern: rule.pattern, match_field: rule.match_field, cat: rule.cat, cat_detail: rule.cat_detail || null })
      .eq('id', rule.id)
      .eq('user_id', user.id)
      .select()
      .single();
    if (error) { console.error('saveRule update error:', error); return false; }
    setRules(prev => prev.map(r => r.id === rule.id ? data : r));
    return true;
  }

  // ── Delete ───────────────────────────────────────────────────────────────────
  async function deleteRule(id) {
    if (!user) return false;
    const { error } = await supabase
      .from('cat_rules')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id);
    if (error) { console.error('deleteRule error:', error); return false; }
    setRules(prev => prev.filter(r => r.id !== id));
    return true;
  }

  // ── Move (swap priority with neighbour) ──────────────────────────────────────
  async function moveRule(id, direction) {
    if (!user) return;
    const sorted = [...rules].sort((a, b) => a.priority - b.priority);
    const idx = sorted.findIndex(r => r.id === id);
    const swapIdx = direction === 'up' ? idx - 1 : idx + 1;
    if (swapIdx < 0 || swapIdx >= sorted.length) return;

    const a = sorted[idx];
    const b = sorted[swapIdx];

    // Swap priorities optimistically in local state first
    setRules(prev => prev.map(r => {
      if (r.id === a.id) return { ...r, priority: b.priority };
      if (r.id === b.id) return { ...r, priority: a.priority };
      return r;
    }).sort((x, y) => x.priority - y.priority));

    // Persist to DB
    const { error } = await supabase.from('cat_rules').upsert([
      { ...a, priority: b.priority },
      { ...b, priority: a.priority },
    ]);
    if (error) {
      console.error('moveRule error:', error);
      await refetch(); // revert on failure
    }
  }

  // ── Reset to defaults ────────────────────────────────────────────────────────
  async function resetToDefaults() {
    if (!user) return false;
    const { error: delErr } = await supabase
      .from('cat_rules')
      .delete()
      .eq('user_id', user.id);
    if (delErr) { console.error('resetToDefaults delete error:', delErr); return false; }
    seedingRef.current = false;
    await seedDefaults(user.id);
    return true;
  }

  return (
    <CatRulesContext.Provider value={{ rules, loading, saveRule, deleteRule, moveRule, resetToDefaults }}>
      {children}
    </CatRulesContext.Provider>
  );
}

export function useCatRules() {
  const ctx = useContext(CatRulesContext);
  if (!ctx) throw new Error('useCatRules must be used inside CatRulesProvider');
  return ctx;
}
