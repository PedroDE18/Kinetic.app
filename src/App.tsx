import React, { useState, useEffect } from 'react';
import { FitnessProvider, useFitness } from './context/FitnessContext';
import { Header } from './components/Header';
import { Navigation, TabType } from './components/Navigation';
import { TodayView } from './components/today/TodayView';
import { FoodView } from './components/food/FoodView';
import { TrainView } from './components/train/TrainView';
import { ProgressView } from './components/progress/ProgressView';
import { AddFoodModal } from './components/food/AddFoodModal';
import { WeighInModal } from './components/weighin/WeighInModal';
import { WeeklyReviewModal } from './components/progress/WeeklyReviewModal';
import { SettingsModal } from './components/settings/SettingsModal';
import { HealthSyncModal } from './components/sync/HealthSyncModal';
import { InstallPwaModal } from './components/pwa/InstallPwaModal';
import { checkUrlForHealthSync } from './services/healthSync';
import { Play, ChevronRight, CheckCircle2 } from 'lucide-react';
import { MealType } from './types';

function AppContent() {
  const { state, resolveReview, importHealthBatch } = useFitness();
  const [activeTab, setActiveTab] = useState<TabType>('today');

  // Modals
  const [showAddFoodModal, setShowAddFoodModal] = useState(false);
  const [addFoodInitialMeal, setAddFoodInitialMeal] = useState<MealType>('breakfast');
  const [showWeighInModal, setShowWeighInModal] = useState(false);
  const [showWeeklyReviewModal, setShowWeeklyReviewModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [showHealthSyncModal, setShowHealthSyncModal] = useState(false);
  const [showInstallPwaModal, setShowInstallPwaModal] = useState(false);
  const [healthSyncToast, setHealthSyncToast] = useState<string | null>(null);

  const hasActiveWorkout = !!state.activeWorkout;
  const pendingReview = state.reviews.find((r) => r.status === 'pending');
  const isLight = state.profile.theme === 'light';

  // Check URL query for iOS Health Shortcut ?health_sync=...
  useEffect(() => {
    const shortcutResult = checkUrlForHealthSync();
    if (shortcutResult) {
      const { addedCardio, addedWorkouts, addedWeights } = importHealthBatch(shortcutResult);
      setHealthSyncToast(
        `Synced from Apple Health Shortcut: +${addedCardio} cardio, +${addedWorkouts} workouts, +${addedWeights} weigh-ins!`
      );
      setTimeout(() => setHealthSyncToast(null), 5000);
    }
  }, [importHealthBatch]);

  const handleOpenAddFood = (mealType?: MealType) => {
    setAddFoodInitialMeal(mealType || 'breakfast');
    setShowAddFoodModal(true);
  };

  return (
    <div
      className={`min-h-screen bg-zinc-950 text-zinc-100 flex flex-col font-sans antialiased selection:bg-[#E07A5F] selection:text-white transition-colors duration-200 ${
        isLight ? 'theme-light' : 'theme-dark'
      }`}
    >
      {/* Top Header */}
      <Header 
        onOpenSettings={() => setShowSettingsModal(true)} 
        onOpenHealthSync={() => setShowHealthSyncModal(true)}
        onOpenInstallPwa={() => setShowInstallPwaModal(true)}
      />

      {/* Health Sync Auto Toast */}
      {healthSyncToast && (
        <div className="fixed top-14 left-4 right-4 z-40 max-w-md mx-auto p-3.5 rounded-2xl bg-[#EEF5EE] dark:bg-[#1E2E22] border border-[#CDE3CD] dark:border-[#2C4933] text-[#245330] dark:text-[#9DD2A7] shadow-lg flex items-center gap-2.5 text-xs animate-fade-in">
          <CheckCircle2 className="w-4 h-4 text-[#3B7A4C] dark:text-[#81B29A] shrink-0" />
          <span className="font-medium">{healthSyncToast}</span>
        </div>
      )}

      {/* Main Viewport Container (iOS mobile-first frame) */}
      <main className="flex-1 pb-28 px-4 pt-3.5 max-w-md mx-auto w-full overflow-x-hidden">
        {activeTab === 'today' && (
          <TodayView
            onOpenFoodModal={() => handleOpenAddFood('breakfast')}
            onOpenWeighInModal={() => setShowWeighInModal(true)}
            onOpenWeeklyReview={() => setShowWeeklyReviewModal(true)}
            onNavigateTab={(tab) => setActiveTab(tab)}
          />
        )}

        {activeTab === 'food' && (
          <FoodView onOpenAddModal={(mealType) => handleOpenAddFood(mealType)} />
        )}

        {activeTab === 'train' && <TrainView />}

        {activeTab === 'progress' && (
          <ProgressView
            onOpenWeeklyReview={() => setShowWeeklyReviewModal(true)}
            onOpenWeighInModal={() => setShowWeighInModal(true)}
          />
        )}
      </main>

      {/* Floating Active Workout Pill (if working out while on another tab) */}
      {hasActiveWorkout && activeTab !== 'train' && (
        <aside
          aria-label="Active Workout in progress"
          onClick={() => setActiveTab('train')}
          className="fixed bottom-20 left-4 right-4 max-w-md mx-auto bg-[#2E201B] border border-[#E07A5F]/50 backdrop-blur-md rounded-2xl p-3 flex items-center justify-between shadow-xl cursor-pointer z-20 animate-pulse active:scale-[0.98] transition-all"
        >
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-[#E07A5F] text-white flex items-center justify-center font-bold">
              <Play className="w-4 h-4 fill-current ml-0.5" />
            </div>
            <div>
              <div className="text-[10px] font-bold text-[#E07A5F] uppercase tracking-wider">
                Workout in Progress
              </div>
              <div className="text-xs font-bold text-white">{state.activeWorkout?.name}</div>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-[#E07A5F]" />
        </aside>
      )}

      {/* Persistent iOS Bottom Tab Navigation */}
      <Navigation
        activeTab={activeTab}
        onSelectTab={(tab) => setActiveTab(tab)}
        hasActiveWorkout={hasActiveWorkout}
        hasPendingReview={!!pendingReview}
      />

      {/* MODALS */}
      {showAddFoodModal && (
        <AddFoodModal
          initialMealType={addFoodInitialMeal}
          onClose={() => setShowAddFoodModal(false)}
        />
      )}

      {showWeighInModal && (
        <WeighInModal onClose={() => setShowWeighInModal(false)} />
      )}

      {showWeeklyReviewModal && (
        <WeeklyReviewModal
          review={pendingReview || state.reviews[0]}
          onClose={() => setShowWeeklyReviewModal(false)}
          onAccept={(id) => {
            resolveReview(id, 'accepted');
            setShowWeeklyReviewModal(false);
          }}
          onReject={(id) => {
            resolveReview(id, 'rejected');
            setShowWeeklyReviewModal(false);
          }}
        />
      )}

      {showSettingsModal && (
        <SettingsModal 
          onClose={() => setShowSettingsModal(false)} 
          onOpenHealthSync={() => {
            setShowSettingsModal(false);
            setShowHealthSyncModal(true);
          }}
          onOpenInstallPwa={() => {
            setShowSettingsModal(false);
            setShowInstallPwaModal(true);
          }}
        />
      )}

      {showHealthSyncModal && (
        <HealthSyncModal onClose={() => setShowHealthSyncModal(false)} isOpen={showHealthSyncModal} />
      )}

      {showInstallPwaModal && (
        <InstallPwaModal onClose={() => setShowInstallPwaModal(false)} isOpen={showInstallPwaModal} />
      )}
    </div>
  );
}

export default function App() {
  return (
    <FitnessProvider>
      <AppContent />
    </FitnessProvider>
  );
}
