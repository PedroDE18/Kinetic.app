import React from 'react';
import { Settings, Moon, Sun } from 'lucide-react';
import { useFitness } from '../context/FitnessContext';
import { useAuth } from '../context/AuthContext';

interface HeaderProps {
  onOpenSettings: () => void;
  onOpenProfile: () => void;
  onOpenHealthSync?: () => void;
  onOpenInstallPwa?: () => void;
}

export function Header({ onOpenSettings, onOpenProfile }: HeaderProps) {
  const { state, updateProfile } = useFitness();
  const { currentUser } = useAuth();
  const isLight = state.profile.theme === 'light';

  const toggleTheme = () => {
    updateProfile((prev) => ({
      ...prev,
      theme: prev.theme === 'dark' ? 'light' : 'dark',
    }));
  };

  const toggleLanguage = () => {
    updateProfile((prev) => ({
      ...prev,
      language: prev.language === 'pt-BR' ? 'en' : 'pt-BR',
    }));
  };

  return (
    <header className="sticky top-0 z-30 bg-[color-mix(in_srgb,var(--color-bg)_94%,transparent)] backdrop-blur-md border-b border-[var(--color-border)] px-4 notch-header-padding pb-2.5 flex items-center justify-between max-w-md mx-auto w-full transition-colors">
      <button
        onClick={onOpenProfile}
        className="flex items-center gap-2.5 text-left active:scale-[0.98] transition-all group"
        title="View & Edit Life Profile"
      >
        <div className="h-7 w-7 rounded-lg bg-gradient-to-b from-[#282A2E] via-[#141517] to-[#040506] text-white flex items-center justify-center font-serif font-semibold text-sm border border-white/15 shadow-xs transition-transform">
          Ε
        </div>
        <div className="flex items-center gap-1.5">
          <span className="text-sm font-semibold tracking-tight text-[var(--color-text)]">
            {state.profile.name || 'Eunoia'}
          </span>
          {currentUser && (
            <span className="w-1.5 h-1.5 rounded-full bg-[var(--color-success)]" title="Cloud synced" />
          )}
        </div>
      </button>

      <div className="flex items-center gap-1">
        {/* Theme Toggle */}
        <button
          onClick={toggleTheme}
          aria-label={isLight ? 'Switch to Dark Mode' : 'Switch to Light Mode'}
          title={isLight ? 'Switch to Dark Mode' : 'Switch to Light Mode'}
          className="min-h-[38px] min-w-[38px] flex items-center justify-center rounded-xl text-[var(--color-text-muted)] hover:text-[var(--color-text)] hover:bg-[var(--color-surface-raised)] active:scale-95 transition-all"
        >
          {isLight ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
        </button>

        {/* Settings & Preferences */}
        <button
          onClick={onOpenSettings}
          aria-label="Open Settings"
          title="Settings, Notifications & Preferences"
          className="min-h-[38px] min-w-[38px] flex items-center justify-center rounded-xl text-[var(--color-text-muted)] hover:text-[var(--color-text)] hover:bg-[var(--color-surface-raised)] active:scale-95 transition-all"
        >
          <Settings className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
}
