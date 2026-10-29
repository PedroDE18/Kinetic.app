import React from 'react';
import { Settings, Moon, Sun } from 'lucide-react';
import { useFitness } from '../context/FitnessContext';

interface HeaderProps {
  onOpenSettings: () => void;
}

export function Header({ onOpenSettings }: HeaderProps) {
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
    <header className="sticky top-0 z-30 bg-zinc-950/85 backdrop-blur-md border-b border-zinc-800/60 px-4 pt-3 pb-2.5 flex items-center justify-between max-w-md mx-auto w-full">
      <div className="flex items-center gap-2.5">
        <div className="h-7 w-7 rounded-lg bg-teal-500/20 text-teal-400 flex items-center justify-center font-black text-sm tracking-tighter border border-teal-500/30">
          K
        </div>
        <div>
          <div className="flex items-center gap-1.5">
            <h1 className="text-sm font-bold tracking-tight text-zinc-100">Kinetic</h1>
            <span className="text-[10px] font-semibold px-1.5 py-0.2 bg-zinc-800 text-teal-400 rounded-md">
              Adaptive
            </span>
          </div>
          <span className="text-[10px] text-zinc-400 font-medium">
            {goalName} • {state.profile.targets.calories} kcal
          </span>
        </div>
      </div>

      <div className="flex items-center gap-1">
        <button
          onClick={toggleTheme}
          aria-label={isLight ? 'Switch to Dark Mode' : 'Switch to Light Mode'}
          className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-full text-zinc-400 hover:text-zinc-100 active:scale-95 transition-all"
        >
          {isLight ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
        </button>

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
