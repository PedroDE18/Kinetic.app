import React from 'react';
import { Settings, Moon, Sun, Watch, Smartphone, User } from 'lucide-react';
import { useFitness } from '../context/FitnessContext';
import { useAuth } from '../context/AuthContext';

interface HeaderProps {
  onOpenSettings: () => void;
  onOpenProfile: () => void;
  onOpenHealthSync?: () => void;
  onOpenInstallPwa?: () => void;
}

export function Header({ onOpenSettings, onOpenProfile, onOpenHealthSync, onOpenInstallPwa }: HeaderProps) {
  const { state, updateProfile } = useFitness();
  const { currentUser } = useAuth();
  const isLight = state.profile.theme === 'light';

  const toggleTheme = () => {
    updateProfile((prev) => ({
      ...prev,
      theme: prev.theme === 'dark' ? 'light' : 'dark',
    }));
  };

  return (
    <header className="sticky top-0 z-30 bg-[color-mix(in_srgb,var(--color-bg)_94%,transparent)] backdrop-blur-md border-b border-[var(--color-border)] px-4 notch-header-padding pb-2.5 flex items-center justify-between max-w-md mx-auto w-full transition-colors">
      <button
        onClick={onOpenProfile}
        className="flex items-center gap-2.5 text-left active:scale-[0.98] transition-all group"
        title="View & Edit Life Profile"
      >
        <div className="h-8 w-8 rounded-xl bg-[var(--color-accent-soft)] text-[var(--color-accent)] flex items-center justify-center font-serif font-black text-base border border-[var(--color-accent)]/20 shadow-xs group-hover:border-[var(--color-accent)]/40 transition-colors">
          Ε
        </div>
        <div>
          <div className="flex items-center gap-1.5">
            <h1 className="text-sm font-bold tracking-tight text-[var(--color-text)]">
              {state.profile.name || 'Eunoia'}
            </h1>
            <span className="text-[10px] font-semibold px-2 py-0.5 bg-[var(--color-surface-raised)] text-[var(--color-accent)] rounded-full border border-[var(--color-border)]">
              {currentUser ? 'Cloud Sync' : 'Local-First'}
            </span>
          </div>
          <span className="text-[10px] text-[var(--color-text-muted)] font-serif italic block">
            A personal system for living well
          </span>
        </div>
      </button>

      <div className="flex items-center gap-1">
        {/* Theme Toggle */}
        <button
          onClick={toggleTheme}
          aria-label={isLight ? 'Switch to Dark Mode' : 'Switch to Light Mode'}
          title={isLight ? 'Switch to Dark Mode' : 'Switch to Light Mode'}
          className="min-h-[40px] min-w-[40px] flex items-center justify-center rounded-xl text-[var(--color-text-muted)] hover:text-[var(--color-text)] hover:bg-[var(--color-surface-raised)] active:scale-95 transition-all"
        >
          {isLight ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
        </button>

        {/* Profile / Account Button */}
        <button
          onClick={onOpenProfile}
          aria-label="Profile and Cloud Account"
          title={currentUser ? `Signed in as ${currentUser.email || 'Cloud'}` : 'Personal Profile'}
          className="min-h-[40px] min-w-[40px] flex items-center justify-center rounded-xl text-[var(--color-text-muted)] hover:text-[var(--color-accent)] hover:bg-[var(--color-surface-raised)] active:scale-95 transition-all relative"
        >
          {currentUser ? (
            <div className="relative">
              <User className="w-4 h-4 text-[var(--color-accent)]" />
              <span className="w-2 h-2 rounded-full bg-[var(--color-success)] absolute -top-0.5 -right-0.5 border-2 border-[var(--color-surface)]" />
            </div>
          ) : (
            <User className="w-4 h-4" />
          )}
        </button>

        {/* Settings */}
        <button
          onClick={onOpenSettings}
          aria-label="Open Settings"
          title="Settings & Data Management"
          className="min-h-[40px] min-w-[40px] flex items-center justify-center rounded-xl text-[var(--color-text-muted)] hover:text-[var(--color-text)] hover:bg-[var(--color-surface-raised)] active:scale-95 transition-all"
        >
          <Settings className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
}
