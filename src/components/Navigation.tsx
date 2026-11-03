import React from 'react';
import { TrendingUp, Sliders, Compass, Activity, Feather } from 'lucide-react';
import { useFitness } from '../context/FitnessContext';
import { getTranslations, resolveInitialLanguage } from '../utils/i18n';

export type TabType = 'progress' | 'systems' | 'today' | 'body' | 'mind';

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
  const { state } = useFitness();
  const lang = state.profile.language || resolveInitialLanguage();
  const t = getTranslations(lang);

  return (
    <nav
      aria-label="Eunoia Navigation"
      className="fixed bottom-4 sm:bottom-6 left-3 right-3 z-40 max-w-md mx-auto stoic-glass rounded-full p-1.5 shadow-lg transition-all select-none"
    >
      <div className="flex items-center justify-between">
        {/* 1. Mind (Leftmost tab) */}
        <NavButton
          active={activeTab === 'mind'}
          onClick={() => onSelectTab('mind')}
          label={t.nav.mind}
          icon={<Feather className="w-4 h-4" />}
        />

        {/* 2. Systems */}
        <NavButton
          active={activeTab === 'systems'}
          onClick={() => onSelectTab('systems')}
          label={t.nav.systems}
          icon={<Sliders className="w-4 h-4" />}
        />

        {/* 3. Today (Center Hero Pill) */}
        <button
          onClick={() => onSelectTab('today')}
          aria-label={t.nav.today}
          aria-current={activeTab === 'today' ? 'page' : undefined}
          className={`flex items-center justify-center gap-1.5 px-4 py-2 rounded-full transition-all active:scale-95 ${
            activeTab === 'today'
              ? 'bg-[var(--color-accent)] text-[var(--color-on-accent)] font-bold shadow-sm'
              : 'text-[var(--color-text)] hover:bg-[var(--color-surface-raised)] font-medium'
          }`}
        >
          <Compass className="w-4 h-4" />
          <span className="text-xs tracking-tight">{t.nav.today}</span>
        </button>

        {/* 4. Body */}
        <NavButton
          active={activeTab === 'body'}
          onClick={() => onSelectTab('body')}
          label={t.nav.body}
          icon={<Activity className="w-4 h-4" />}
          badge={hasActiveWorkout ? '•' : undefined}
          badgeColor="bg-emerald-500 text-white"
        />

        {/* 5. Progress (Rightmost tab) */}
        <NavButton
          active={activeTab === 'progress'}
          onClick={() => onSelectTab('progress')}
          label={t.nav.progress}
          icon={<TrendingUp className="w-4 h-4" />}
          badge={hasPendingReview ? '!' : undefined}
          badgeColor="bg-[var(--color-accent)] text-[var(--color-on-accent)]"
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
  badgeColor = 'bg-[var(--color-accent)] text-[var(--color-on-accent)]',
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
      className={`min-h-[40px] px-2.5 py-1.5 relative flex flex-col items-center justify-center rounded-full transition-all active:scale-95 ${
        active
          ? 'text-[var(--color-text)] font-semibold'
          : 'text-[var(--color-text-muted)] hover:text-[var(--color-text)] font-medium'
      }`}
    >
      <div
        className={`relative flex items-center justify-center p-1 rounded-full transition-all ${
          active ? 'bg-[var(--color-accent-soft)]' : ''
        }`}
      >
        {icon}
        {badge && (
          <span
            className={`absolute -top-1 -right-1 px-1 min-w-[12px] h-3 flex items-center justify-center text-[9px] font-black rounded-full shadow-xs ${badgeColor}`}
          >
            {badge}
          </span>
        )}
      </div>
      <span className="text-[10px] tracking-tight leading-none mt-0.5">{label}</span>
    </button>
  );
}
