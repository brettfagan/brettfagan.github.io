import { useState } from 'react';
import CategoryContent from './CategoryManager';
import CsvRulesManager from './CsvRulesManager';

const SECTIONS = [
  { id: 'categories', label: 'Categories' },
  { id: 'rules',      label: 'Rules'      },
];

export default function SettingsPage() {
  const [activeSection, setActiveSection] = useState('categories');

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
            <CsvRulesManager />
          </>
        )}
      </div>

    </div>
  );
}
