import React, { useState, useMemo } from 'react';
import {
  Utensils,
  Dumbbell,
  Moon,
  Plus,
  BatteryCharging,
  Clock,
  Trash2,
  Sparkles,
  Calendar,
  BedDouble,
} from 'lucide-react';
import { useFitness } from '../../context/FitnessContext';
import { MealType } from '../../types';
import { FoodView } from '../food/FoodView';
import { TrainView } from '../train/TrainView';
import { SleepModal } from '../recovery/SleepModal';
import { getLocalDateString } from '../../utils/engine';
import { getTranslations, resolveInitialLanguage } from '../../utils/i18n';

export type BodySubTab = 'nutrition' | 'training' | 'recovery';

interface BodyViewProps {
  initialSubTab?: BodySubTab;
  onOpenAddFoodModal: (mealType?: MealType, targetDate?: string) => void;
  onOpenWeighInModal?: () => void;
  onOpenWeeklyReview?: () => void;
}

export function BodyView({
  initialSubTab = 'nutrition',
  onOpenAddFoodModal,
  onOpenWeighInModal,
  onOpenWeeklyReview,
}: BodyViewProps) {
  const { state, deleteSleepRecord } = useFitness();
  const { sleepRecords, activeWorkout } = state;

  const [activeSubTab, setActiveSubTab] = useState<BodySubTab>(initialSubTab);
  const [showSleepModal, setShowSleepModal] = useState(false);

  const todayStr = useMemo(() => getLocalDateString(), []);
  const recentSleep = sleepRecords[0];

  const lang = state.profile.language || resolveInitialLanguage();
  const t = getTranslations(lang);

  const avgSleepHours = useMemo(() => {
    if (sleepRecords.length === 0) return 0;
    const slice = sleepRecords.slice(0, 7);
    const sum = slice.reduce((acc, s) => acc + s.durationMinutes, 0);
    return Number((sum / slice.length / 60).toFixed(1));
  }, [sleepRecords]);

  return (
    <div className="space-y-4 animate-in fade-in duration-200">
      {/* Editorial Header */}
      <div className="px-1 pt-1 pb-0.5">
        <h1 className="stoic-title text-2xl font-bold tracking-tight text-[var(--color-text)]">
          {t.body.title}
        </h1>
        <p className="text-xs text-[var(--color-text-muted)] mt-0.5">
          {t.body.subtitle}
        </p>
      </div>

      {/* Sub-tab Navigation */}
      <div className="grid grid-cols-3 gap-1 p-1 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl shadow-xs">
        <button
          onClick={() => setActiveSubTab('nutrition')}
          className={`flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-semibold transition-all ${
            activeSubTab === 'nutrition'
              ? 'bg-[var(--color-accent)] text-[var(--color-on-accent)] shadow-xs'
              : 'text-[var(--color-text-muted)] hover:text-[var(--color-text)]'
          }`}
        >
          <Utensils className="w-3.5 h-3.5" />
          <span>{t.body.nutrition}</span>
        </button>

        <button
          onClick={() => setActiveSubTab('training')}
          className={`flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-semibold relative transition-all ${
            activeSubTab === 'training'
              ? 'bg-[var(--color-accent)] text-[var(--color-on-accent)] shadow-xs'
              : 'text-[var(--color-text-muted)] hover:text-[var(--color-text)]'
          }`}
        >
          <Dumbbell className="w-3.5 h-3.5" />
          <span>{t.body.training}</span>
          {activeWorkout && (
            <span className="w-2 h-2 rounded-full bg-emerald-500 absolute top-1.5 right-1.5" />
          )}
        </button>

        <button
          onClick={() => setActiveSubTab('recovery')}
          className={`flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-semibold transition-all ${
            activeSubTab === 'recovery'
              ? 'bg-[var(--color-accent)] text-[var(--color-on-accent)] shadow-xs'
              : 'text-[var(--color-text-muted)] hover:text-[var(--color-text)]'
          }`}
        >
          <Moon className="w-3.5 h-3.5" />
          <span>{t.body.recovery}</span>
        </button>
      </div>

      {/* RENDER ACTIVE SUB-TAB CONTENT */}
      {activeSubTab === 'nutrition' && (
        <FoodView onOpenAddModal={(meal, date) => onOpenAddFoodModal(meal, date)} />
      )}

      {activeSubTab === 'training' && <TrainView />}

      {activeSubTab === 'recovery' && (
        <div className="space-y-4">
          {/* Recovery Overview Card */}
          <div className="p-5 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-3xl space-y-3 shadow-xs">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[var(--color-accent)]">
                <BatteryCharging className="w-4 h-4" />
                <span>Biological Restoration</span>
              </div>
              <button
                onClick={() => setShowSleepModal(true)}
                className="flex items-center gap-1 px-3 py-1.5 bg-[var(--color-accent)] hover:bg-[var(--color-accent-hover)] text-[var(--color-on-accent)] rounded-2xl text-xs font-bold transition-all shadow-sm"
              >
                <Plus className="w-3.5 h-3.5 stroke-[3]" />
                <span>Log Sleep</span>
              </button>
            </div>

            <p className="text-xs text-[var(--color-text-muted)] font-serif italic">
              "Sleep is the biological foundation of mental clarity, emotional regulation, and athletic adaptation."
            </p>

            <div className="grid grid-cols-2 gap-3 pt-2">
              <div className="p-3.5 bg-[var(--color-surface-sunken)] rounded-2xl border border-[var(--color-border)]">
                <span className="text-[10px] uppercase font-bold text-[var(--color-text-subtle)] tracking-wider block mb-1">
                  Last Recorded Sleep
                </span>
                <div className="text-xl font-bold text-[var(--color-text)]">
                  {recentSleep ? `${(recentSleep.durationMinutes / 60).toFixed(1)} hrs` : 'No logs'}
                </div>
                {recentSleep && (
                  <div className="text-[11px] text-[var(--color-text-muted)] mt-0.5">
                    {recentSleep.bedTime} → {recentSleep.wakeTime} • Quality {recentSleep.qualityRating}/5
                  </div>
                )}
              </div>

              <div className="p-3.5 bg-[var(--color-surface-sunken)] rounded-2xl border border-[var(--color-border)]">
                <span className="text-[10px] uppercase font-bold text-[var(--color-text-subtle)] tracking-wider block mb-1">
                  7-Day Mean Duration
                </span>
                <div className="text-xl font-bold text-[var(--color-text)]">
                  {avgSleepHours > 0 ? `${avgSleepHours} hrs` : '—'}
                </div>
                <div className="text-[11px] text-[var(--color-text-muted)] mt-0.5">
                  Target: 7.5–8.5 hrs
                </div>
              </div>
            </div>
          </div>

          {/* Sleep Log History */}
          <section className="space-y-2">
            <div className="flex items-center justify-between px-1">
              <span className="k-section-title flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-[var(--color-accent)]" />
                <span>Recent Nights</span>
              </span>
              <span className="text-[11px] text-[var(--color-text-muted)] font-medium">
                {sleepRecords.length} records
              </span>
            </div>

            {sleepRecords.length === 0 ? (
              <div className="p-8 text-center bg-[var(--color-surface)] border border-[var(--color-border)] rounded-3xl text-xs text-[var(--color-text-muted)]">
                No sleep records yet. Tap 'Log Sleep' to record last night's rest.
              </div>
            ) : (
              <div className="space-y-2.5">
                {sleepRecords.map((record) => {
                  const hrs = (record.durationMinutes / 60).toFixed(1);
                  return (
                    <div
                      key={record.id}
                      className="p-4 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-3xl flex items-center justify-between gap-3 shadow-xs hover:border-[var(--color-border-hover)] transition-all"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-2xl bg-[var(--color-accent)]/10 text-[var(--color-accent)] flex items-center justify-center font-bold text-sm shrink-0">
                          <BedDouble className="w-5 h-5" />
                        </div>
                        <div className="space-y-0.5">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-[var(--color-text)]">
                              {record.date} • {hrs} hrs
                            </span>
                            <span className="px-1.5 py-0.5 bg-[var(--color-surface-raised)] text-[var(--color-text-muted)] rounded-md text-[10px] font-semibold capitalize">
                              {record.restfulness} rest
                            </span>
                          </div>
                          <div className="text-[11px] text-[var(--color-text-muted)] flex items-center gap-2">
                            <span>
                              {record.bedTime} → {record.wakeTime}
                            </span>
                            <span>•</span>
                            <span>{'★'.repeat(record.qualityRating)}</span>
                          </div>
                          {record.notes && (
                            <p className="text-[11px] text-[var(--color-text-muted)] font-serif italic pt-0.5">
                              "{record.notes}"
                            </p>
                          )}
                        </div>
                      </div>

                      <button
                        onClick={() => deleteSleepRecord(record.id)}
                        className="p-2 text-[var(--color-text-muted)] hover:text-red-500 rounded-xl hover:bg-[var(--color-surface-raised)] transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </section>
        </div>
      )}

      {/* Sleep Modal */}
      {showSleepModal && <SleepModal onClose={() => setShowSleepModal(false)} />}
    </div>
  );
}
