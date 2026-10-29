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
      className="fixed bottom-0 left-0 right-0 z-30 bg-[#FFFDF9]/95 dark:bg-[#1C1815]/95 backdrop-blur-xl border-t border-[#EBE3D7] dark:border-[#38302A] px-3 pb-[env(safe-area-inset-bottom,16px)] pt-2 max-w-md mx-auto shadow-lg transition-colors"
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
          badgeColor="bg-[#E07A5F]"
        />
        <NavButton
          active={activeTab === 'progress'}
          onClick={() => onSelectTab('progress')}
          label="Progress"
          icon={<TrendingUp className="w-5 h-5" />}
          badge={hasPendingReview ? '1' : undefined}
          badgeColor="bg-[#E07A5F]"
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
  badgeColor = 'bg-[#E07A5F]',
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
      className={`min-h-[44px] relative flex flex-col items-center justify-center py-1 rounded-2xl transition-all ${
        active
          ? 'text-[#C85A32] dark:text-[#E07A5F] font-bold'
          : 'text-[#8A7B6E] dark:text-[#A8988B] hover:text-[#28221D] dark:hover:text-[#F7F2EC] font-medium'
      }`}
    >
      <div className={`relative flex items-center justify-center px-3 py-1 rounded-2xl transition-all ${
        active ? 'bg-[#FCE8E4] dark:bg-[#32231E]' : ''
      }`}>
        {icon}
        {badge && (
          <span
            className={`absolute -top-0.5 -right-1 px-1 min-w-[14px] h-3.5 flex items-center justify-center text-[10px] font-black text-white rounded-full shadow-xs ${badgeColor}`}
          >
            {badge}
          </span>
        )}
      </div>
      <span className="text-[10px] mt-0.5 tracking-tight leading-none">{label}</span>
    </button>
  );
}
