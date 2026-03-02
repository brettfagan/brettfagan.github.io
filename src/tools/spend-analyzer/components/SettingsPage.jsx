import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import { Button } from '@/components/ui/button';
import CategoryContent from './CategoryManager';
import CatRulesManager from './CatRulesManager';
import LinkedAccessManager from './LinkedAccessManager';

const SECTIONS = [
  { id: 'categories',     label: 'Categories'      },
  { id: 'rules',          label: 'Rules'            },
  { id: 'linked-access',  label: 'Linked Access'    },
];

export default function SettingsPage() {
  const { role } = useAuth();
  const [activeSection, setActiveSection] = useState('categories');

  // Guard: linked users should never reach this page (tab is hidden),
  // but add a safety render-null just in case.
  if (role === 'linked') return null;

  return (
    <div className="flex min-h-[calc(100vh-89px)]">

      {/* ── Left nav ──────────────────────────────────────────────────────── */}
      <nav className="w-48 shrink-0 border-r border-border px-3 py-6">
        <div className="text-[10px] font-bold tracking-[1.5px] uppercase text-muted-foreground px-3 mb-2">
          Settings
        </div>
        <ul className="flex flex-col gap-0.5">
          {SECTIONS.map(({ id, label }) => (
            <li key={id}>
              <button
                onClick={() => setActiveSection(id)}
                className={`w-full text-left px-3 py-1.5 rounded-md text-[12px] font-bold tracking-[0.3px] cursor-pointer border-0 transition-colors ${
                  activeSection === id
                    ? 'bg-primary/8 text-primary'
                    : 'bg-transparent text-muted-foreground hover:text-foreground hover:bg-muted'
                }`}
              >
                {label}
              </button>
            </li>
          ))}
        </ul>
      </nav>

      {/* ── Content area ──────────────────────────────────────────────────── */}
      <div className="flex-1 px-9 py-7 overflow-y-auto">
        <div className="max-w-2xl">
        {activeSection === 'categories' && (
          <>
            <div className="mb-6">
              <h2 className="text-[22px] font-extrabold tracking-[-0.3px]">Categories</h2>
              <p className="text-xs text-muted-foreground mt-1">Manage the categories used to classify your transactions.</p>
            </div>
            <CategoryContent />
          </>
        )}

        {activeSection === 'rules' && (
          <>
            <div className="mb-6">
              <h2 className="text-[22px] font-extrabold tracking-[-0.3px]">Rules</h2>
              <p className="text-xs text-muted-foreground mt-1">Automatically categorize transactions on import using regex patterns.</p>
            </div>
            <CatRulesManager />
          </>
        )}

        {activeSection === 'linked-access' && (
          <>
            <div className="mb-6">
              <h2 className="text-[22px] font-extrabold tracking-[-0.3px]">Linked Access</h2>
              <p className="text-xs text-muted-foreground mt-1">Invite a partner to view your spending data with limited access.</p>
            </div>
            <LinkedAccessManager />
          </>
        )}
        </div>
      </div>

    </div>
  );
}
