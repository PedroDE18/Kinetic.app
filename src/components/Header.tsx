import React from 'react';
import { Settings, Moon, Sun, Watch, Smartphone } from 'lucide-react';
import { useFitness } from '../context/FitnessContext';

interface HeaderProps {
  onOpenSettings: () => void;
  onOpenHealthSync?: () => void;
  onOpenInstallPwa?: () => void;
}

export function Header({ onOpenSettings, onOpenHealthSync, onOpenInstallPwa }: HeaderProps) {
  const { state, updateProfile } = useFitness();
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
    <header className="sticky top-0 z-30 bg-zinc-950/85 backdrop-blur-md border-b border-zinc-800/60 px-4 pt-3 pb-2.5 flex items-center justify-between max-w-md mx-auto w-full transition-colors">
      <div className="flex items-center gap-2.5">
        <div className="h-7 w-7 rounded-xl bg-[#E07A5F]/20 text-[#E07A5F] flex items-center justify-center font-black text-sm tracking-tighter border border-[#E07A5F]/30 shadow-xs">
          K
        </div>
        <div>
          <div className="flex items-center gap-1.5">
            <h1 className="text-sm font-bold tracking-tight text-zinc-100">Kinetic</h1>
            <span className="text-[10px] font-semibold px-2 py-0.5 bg-[#FAF3EA] dark:bg-[#2C241E] text-[#C85A32] dark:text-[#E07A5F] rounded-full border border-[#EBE1D3] dark:border-[#42362C]">
              Adaptive
            </span>
          </div>
          <span className="text-[10px] text-zinc-400 font-medium">
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
            className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-full text-zinc-400 hover:text-[#E07A5F] active:scale-95 transition-all"
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
            className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-full text-zinc-400 hover:text-zinc-100 active:scale-95 transition-all"
          >
            <Smartphone className="w-4 h-4" />
          </button>
        )}

        {/* Theme Toggle (Cozy Light vs Cozy Dark) */}
        <button
          onClick={toggleTheme}
          aria-label={isLight ? 'Switch to Dark Mode' : 'Switch to Light Mode'}
          className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-full text-zinc-400 hover:text-zinc-100 active:scale-95 transition-all"
        >
          {isLight ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
        </button>

        {/* Settings */}
        <button
          onClick={onOpenSettings}
          aria-label="Open Settings"
          className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-full text-zinc-400 hover:text-zinc-100 active:scale-95 transition-all"
        >
          <Settings className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
}
