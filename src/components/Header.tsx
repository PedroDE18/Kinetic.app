import React from 'react';
import { Settings, Moon, Sun, Watch, Smartphone, Cloud, Check, Loader2, AlertCircle } from 'lucide-react';
import { useFitness } from '../context/FitnessContext';

interface HeaderProps {
  onOpenSettings: () => void;
  onOpenHealthSync?: () => void;
  onOpenInstallPwa?: () => void;
}

export function Header({ onOpenSettings, onOpenHealthSync, onOpenInstallPwa }: HeaderProps) {
  const { state, updateProfile, syncStatus, forceSyncCloud } = useFitness();
  const isLight = state.profile.theme === 'light';

  const toggleTheme = () => {
    updateProfile((prev) => ({
      ...prev,
      theme: prev.theme === 'dark' ? 'light' : 'dark',
    }));
  };

  const goalName = {
    fat_loss: 'Fat Loss',
    recomp: 'Recomposition',
    maintenance: 'Maintenance',
    muscle_gain: 'Lean Gain',
  }[state.profile.goal];

  return (
    <header className="sticky top-0 z-30 bg-[var(--color-surface-sunken)] dark:bg-[var(--color-surface-sunken)] backdrop-blur-md border-b border-[var(--color-border)] px-4 notch-header-padding pb-2.5 flex items-center justify-between max-w-md mx-auto w-full transition-colors">
      <div className="flex items-center gap-2.5">
        <div className="h-7 w-7 rounded-xl bg-[var(--color-accent)]/20 text-[var(--color-accent)] flex items-center justify-center font-black text-sm tracking-tighter border border-[#E07A5F]/30 shadow-xs">
          K
        </div>
        <div>
          <div className="flex items-center gap-1.5">
            <h1 className="text-sm font-bold tracking-tight text-[var(--color-text)]">Kinetic</h1>
            <span className="text-[10px] font-semibold px-2 py-0.5 bg-[var(--color-surface-raised)] dark:bg-[#2C241E] text-[#C85A32] dark:text-[var(--color-accent)] rounded-full border border-[var(--color-border)] dark:border-[#42362C]">
              Adaptive
            </span>
          </div>
          <span className="text-[10px] text-[var(--color-text-muted)] font-medium">
            {goalName} • {state.profile.targets.calories} kcal
          </span>
        </div>
      </div>

      <div className="flex items-center gap-0.5">
        {/* Health & Garmin Sync */}
        {onOpenHealthSync && (
          <button
            onClick={onOpenHealthSync}
            aria-label="Health & Garmin Sync"
            title="Sync Apple Health & Garmin"
            className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-full text-[var(--color-text-muted)] hover:text-[var(--color-accent)] active:scale-95 transition-all"
          >
            <Watch className="w-4 h-4" />
          </button>
        )}

        {/* Install on iPhone PWA Guide */}
        {onOpenInstallPwa && (
          <button
            onClick={onOpenInstallPwa}
            aria-label="Install App on iPhone"
            title="Install App"
            className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-full text-[var(--color-text-muted)] hover:text-[var(--color-text)] active:scale-95 transition-all"
          >
            <Smartphone className="w-4 h-4" />
          </button>
        )}

        {/* Firebase Cloud Sync Status */}
        <button
          onClick={() => forceSyncCloud()}
          aria-label={
            syncStatus === 'syncing'
              ? 'Syncing with Firestore...'
              : syncStatus === 'saved'
              ? 'Synced with Firebase'
              : syncStatus === 'error'
              ? 'Cloud Sync Error - Tap to retry'
              : 'Tap to sync with Firestore'
          }
          title={
            syncStatus === 'syncing'
              ? 'Syncing with Firestore...'
              : syncStatus === 'saved'
              ? 'Saved to Cloud'
              : syncStatus === 'error'
              ? 'Sync failed - Tap to retry'
              : 'Cloud Synced'
          }
          className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-full text-[var(--color-text-muted)] hover:text-[var(--color-text)] active:scale-95 transition-all relative"
        >
          {syncStatus === 'syncing' ? (
            <Loader2 className="w-4 h-4 text-[var(--color-accent)] animate-spin" />
          ) : syncStatus === 'saved' ? (
            <div className="relative">
              <Cloud className="w-4 h-4 text-[var(--color-success)]" />
              <Check className="w-2.5 h-2.5 text-[var(--color-success)] absolute -bottom-1 -right-1 stroke-[3]" />
            </div>
          ) : syncStatus === 'error' ? (
            <AlertCircle className="w-4 h-4 text-[var(--color-warning)]" />
          ) : (
            <Cloud className="w-4 h-4 text-[var(--color-text-subtle)] hover:text-[var(--color-text-muted)]" />
          )}
        </button>

        {/* Theme Toggle (Cozy Light vs Cozy Dark) */}
        <button
          onClick={toggleTheme}
          aria-label={isLight ? 'Switch to Dark Mode' : 'Switch to Light Mode'}
          className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-full text-[var(--color-text-muted)] hover:text-[var(--color-text)] active:scale-95 transition-all"
        >
          {isLight ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
        </button>

        {/* Settings */}
        <button
          onClick={onOpenSettings}
          aria-label="Open Settings"
          className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-full text-[var(--color-text-muted)] hover:text-[var(--color-text)] active:scale-95 transition-all"
        >
          <Settings className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
}
