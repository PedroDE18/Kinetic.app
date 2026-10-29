import React from 'react';
import { Calendar, Flame, Dumbbell, TrendingUp } from 'lucide-react';

export type TabType = 'today' | 'food' | 'train' | 'progress';

interface NavigationProps {
  activeTab: TabType;
  onSelectTab: (tab: TabType) => void;
  hasActiveWorkout: boolean;
  hasPendingReview: boolean;
}

export function Navigation({
  activeTab,
  onSelectTab,
  hasActiveWorkout,
  hasPendingReview,
}: NavigationProps) {
  return (
    <nav
      aria-label="Bottom Navigation"
      className="fixed bottom-0 left-0 right-0 z-30 bg-zinc-950/92 backdrop-blur-xl border-t border-zinc-800/80 px-3 pb-[env(safe-area-inset-bottom,16px)] pt-2 max-w-md mx-auto"
    >
      <div className="grid grid-cols-4 gap-1">
        <NavButton
          active={activeTab === 'today'}
          onClick={() => onSelectTab('today')}
          label="Today"
          icon={<Calendar className="w-5 h-5" />}
        />
        <NavButton
          active={activeTab === 'food'}
          onClick={() => onSelectTab('food')}
          label="Food"
          icon={<Flame className="w-5 h-5" />}
        />
        <NavButton
          active={activeTab === 'train'}
          onClick={() => onSelectTab('train')}
          label="Train"
          icon={<Dumbbell className="w-5 h-5" />}
          badge={hasActiveWorkout ? '•' : undefined}
          badgeColor="bg-teal-400"
        />
        <NavButton
          active={activeTab === 'progress'}
          onClick={() => onSelectTab('progress')}
          label="Progress"
          icon={<TrendingUp className="w-5 h-5" />}
          badge={hasPendingReview ? '1' : undefined}
          badgeColor="bg-teal-500"
        />
      </div>
    </nav>
  );
}

function NavButton({
  active,
  onClick,
  label,
  icon,
  badge,
  badgeColor = 'bg-teal-400',
}: {
  active: boolean;
  onClick: () => void;
  label: string;
  icon: React.ReactNode;
  badge?: string;
  badgeColor?: string;
}) {
  return (
    <button
      onClick={onClick}
      aria-label={label}
      aria-current={active ? 'page' : undefined}
      className={`min-h-[44px] relative flex flex-col items-center justify-center py-1 rounded-xl transition-all ${
        active
          ? 'text-teal-400 font-bold scale-[1.02]'
          : 'text-zinc-500 hover:text-zinc-300 font-medium'
      }`}
    >
      <div className="relative flex items-center justify-center">
        {icon}
        {badge && (
          <span
            className={`absolute -top-1 -right-2.5 px-1 min-w-[14px] h-3.5 flex items-center justify-center text-[10px] font-black text-zinc-950 rounded-full shadow-sm ${badgeColor}`}
          >
            {badge}
          </span>
        )}
      </div>
      <span className="text-[10px] mt-1 tracking-tight leading-none">{label}</span>
    </button>
  );
}
