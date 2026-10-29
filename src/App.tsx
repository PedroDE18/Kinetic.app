import React, { useState } from 'react';
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
import { Play, ChevronRight } from 'lucide-react';
import { MealType } from './types';

function AppContent() {
  const { state, resolveReview } = useFitness();
  const [activeTab, setActiveTab] = useState<TabType>('today');

  // Modals
  const [showAddFoodModal, setShowAddFoodModal] = useState(false);
  const [addFoodInitialMeal, setAddFoodInitialMeal] = useState<MealType>('breakfast');
  const [showWeighInModal, setShowWeighInModal] = useState(false);
  const [showWeeklyReviewModal, setShowWeeklyReviewModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);

  const hasActiveWorkout = !!state.activeWorkout;
  const pendingReview = state.reviews.find((r) => r.status === 'pending');
  const isLight = state.profile.theme === 'light';

  const handleOpenAddFood = (mealType?: MealType) => {
    setAddFoodInitialMeal(mealType || 'breakfast');
    setShowAddFoodModal(true);
  };

  return (
    <div
      className={`min-h-screen bg-zinc-950 text-zinc-100 flex flex-col font-sans antialiased selection:bg-teal-500 selection:text-black ${
        isLight ? 'theme-light' : ''
      }`}
    >
      {/* Top Header */}
      <Header onOpenSettings={() => setShowSettingsModal(true)} />

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
          className="fixed bottom-20 left-4 right-4 max-w-md mx-auto bg-teal-950/90 border border-teal-500/50 backdrop-blur-md rounded-2xl p-3 flex items-center justify-between shadow-xl cursor-pointer z-20 animate-pulse active:scale-[0.98] transition-all"
        >
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-teal-400 text-zinc-950 flex items-center justify-center font-bold">
              <Play className="w-4 h-4 fill-current ml-0.5" />
            </div>
            <div>
              <div className="text-[10px] font-bold text-teal-300 uppercase tracking-wider">
                Workout in Progress
              </div>
              <div className="text-xs font-bold text-white">{state.activeWorkout?.name}</div>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-teal-400" />
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
        <SettingsModal onClose={() => setShowSettingsModal(false)} />
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
