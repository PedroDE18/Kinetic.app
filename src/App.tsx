import React, { useState, useEffect, useRef } from 'react';
import { FitnessProvider, useFitness } from './context/FitnessContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Header } from './components/Header';
import { Navigation, TabType } from './components/Navigation';
import { TodayView } from './components/today/TodayView';
import { SystemsView } from './components/systems/SystemsView';
import { BodyView } from './components/body/BodyView';
import { MindView } from './components/mind/MindView';
import { ProgressView } from './components/progress/ProgressView';
import { AddFoodModal } from './components/food/AddFoodModal';
import { WeighInModal } from './components/weighin/WeighInModal';
import { WeeklyReviewModal } from './components/progress/WeeklyReviewModal';
import { SettingsModal } from './components/settings/SettingsModal';
import { HealthSyncModal } from './components/sync/HealthSyncModal';
import { InstallPwaModal } from './components/pwa/InstallPwaModal';
import { ProfileModal } from './components/profile/ProfileModal';
import { AuthModal } from './components/auth/AuthModal';
import { SleepModal } from './components/recovery/SleepModal';
import { ReflectionModal } from './components/mind/ReflectionModal';
import { MoodCheckInModal } from './components/mind/MoodCheckInModal';
import { FrictionFeedbackModal } from './components/feedback/FrictionFeedbackModal';
import { checkUrlForHealthSync } from './services/healthSync';
import { saveUserFitnessState, loadUserFitnessState } from './services/firebase';
import { buildInitialWeeklyReview } from './utils/mockData';
import { Play, ChevronRight, CheckCircle2 } from 'lucide-react';
import { MealType } from './types';

function AppContent() {
  const { state, resolveReview, importHealthBatch, replaceFitnessState } = useFitness();
  const { currentUser } = useAuth();
  const [activeTab, setActiveTab] = useState<TabType>('today');

  // Modals
  const [showAddFoodModal, setShowAddFoodModal] = useState(false);
  const [addFoodInitialMeal, setAddFoodInitialMeal] = useState<MealType>('breakfast');
  const [addFoodTargetDate, setAddFoodTargetDate] = useState<string | undefined>(undefined);
  const [showWeighInModal, setShowWeighInModal] = useState(false);
  const [showWeeklyReviewModal, setShowWeeklyReviewModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [showHealthSyncModal, setShowHealthSyncModal] = useState(false);
  const [showInstallPwaModal, setShowInstallPwaModal] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showSleepModal, setShowSleepModal] = useState(false);
  const [showReflectionModal, setShowReflectionModal] = useState(false);
  const [showMoodCheckInModal, setShowMoodCheckInModal] = useState(false);
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [healthSyncToast, setHealthSyncToast] = useState<string | null>(null);

  const hasActiveWorkout = !!state.activeWorkout;
  const pendingReview = state.reviews.find((r) => r.status === 'pending');
  const isLight = state.profile.theme === 'light';
  const hasHydratedFromCloud = useRef(false);

  // Synchronize theme to document root and body to prevent viewport/overscroll color mismatches
  useEffect(() => {
    const root = document.documentElement;
    const body = document.body;
    if (isLight) {
      root.classList.add('theme-light');
      root.classList.remove('theme-dark');
      body.classList.add('theme-light');
      body.classList.remove('theme-dark');
    } else {
      root.classList.add('theme-dark');
      root.classList.remove('theme-light');
      body.classList.add('theme-dark');
      body.classList.remove('theme-light');
    }
  }, [isLight]);

  // Cloud Sync Hydration upon login
  useEffect(() => {
    if (!currentUser?.uid || hasHydratedFromCloud.current) return;
    let isMounted = true;

    async function checkCloudData() {
      try {
        const cloudState = await loadUserFitnessState(currentUser!.uid);
        if (cloudState && isMounted) {
          hasHydratedFromCloud.current = true;
          const cloudWeightsCount = Array.isArray(cloudState.weights) ? cloudState.weights.length : 0;
          const localWeightsCount = state.weights.length;
          const cloudFoodsCount = Array.isArray(cloudState.loggedFoods) ? cloudState.loggedFoods.length : 0;
          const localFoodsCount = state.loggedFoods.length;
          const cloudCardioCount = Array.isArray(cloudState.cardioSessions) ? cloudState.cardioSessions.length : 0;
          const localCardioCount = state.cardioSessions.length;
          const cloudSleepCount = Array.isArray(cloudState.sleepRecords) ? cloudState.sleepRecords.length : 0;
          const localSleepCount = state.sleepRecords.length;

          // If cloud has more data or local has empty records, hydrate from cloud
          if (
            cloudWeightsCount > localWeightsCount ||
            cloudFoodsCount > localFoodsCount ||
            cloudCardioCount > localCardioCount ||
            cloudSleepCount > localSleepCount ||
            (localWeightsCount === 0 && localFoodsCount === 0)
          ) {
            replaceFitnessState(cloudState);
            setHealthSyncToast('Restored your life data from Firebase Cloud!');
            setTimeout(() => setHealthSyncToast(null), 4000);
          }
        }
      } catch (e) {
        console.warn('Cloud hydration check skipped:', e);
      }
    }

    checkCloudData();
    return () => {
      isMounted = false;
    };
  }, [
    currentUser?.uid,
    replaceFitnessState,
    state.weights.length,
    state.loggedFoods.length,
    state.cardioSessions.length,
    state.sleepRecords.length,
  ]);

  // Debounced Auto-sync to Firebase Firestore whenever state changes
  useEffect(() => {
    if (!currentUser?.uid) return;
    const timer = setTimeout(async () => {
      try {
        await saveUserFitnessState(currentUser.uid, state);
      } catch (e) {
        console.warn('Background auto-sync to Firestore failed:', e);
      }
    }, 2500);

    return () => clearTimeout(timer);
  }, [state, currentUser?.uid]);

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

  const handleOpenAddFood = (mealType?: MealType, targetDate?: string) => {
    setAddFoodInitialMeal(mealType || 'breakfast');
    setAddFoodTargetDate(targetDate);
    setShowAddFoodModal(true);
  };

  return (
    <div
      className={`min-h-screen bg-[var(--color-bg)] text-[var(--color-text)] flex flex-col font-sans antialiased selection:bg-[var(--color-accent)] selection:text-[var(--color-on-accent)] transition-colors duration-200 ${
        isLight ? 'theme-light' : 'theme-dark'
      }`}
    >
      {/* Top Header */}
      <Header
        onOpenSettings={() => setShowSettingsModal(true)}
        onOpenProfile={() => setShowProfileModal(true)}
        onOpenFeedback={() => setShowFeedbackModal(true)}
        onOpenHealthSync={() => setShowHealthSyncModal(true)}
        onOpenInstallPwa={() => setShowInstallPwaModal(true)}
      />

      {/* Health Sync Auto Toast */}
      {healthSyncToast && (
        <div className="fixed top-[calc(max(env(safe-area-inset-top,0px),16px)+56px)] left-4 right-4 z-40 max-w-md mx-auto p-3.5 rounded-2xl bg-[var(--color-success-soft)] border border-[var(--color-success)]/30 text-[var(--color-success)] shadow-lg flex items-center gap-2.5 text-xs animate-fade-in">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span className="font-medium">{healthSyncToast}</span>
        </div>
      )}

      {/* Main Viewport Container */}
      <main className="flex-1 pb-32 px-4 pt-3.5 max-w-md mx-auto w-full overflow-x-hidden">
        {activeTab === 'progress' && (
          <ProgressView
            onOpenWeeklyReview={() => setShowWeeklyReviewModal(true)}
            onOpenWeighInModal={() => setShowWeighInModal(true)}
            onOpenHealthSync={() => setShowHealthSyncModal(true)}
          />
        )}

        {activeTab === 'systems' && <SystemsView />}

        {activeTab === 'today' && (
          <TodayView
            onOpenFoodModal={() => handleOpenAddFood('breakfast')}
            onOpenWeighInModal={() => setShowWeighInModal(true)}
            onOpenWeeklyReview={() => setShowWeeklyReviewModal(true)}
            onOpenProfile={() => setShowProfileModal(true)}
            onNavigateTab={(tab) => setActiveTab(tab)}
            onOpenSleepModal={() => setShowSleepModal(true)}
            onOpenReflectionModal={() => setShowReflectionModal(true)}
            onOpenMoodCheckIn={() => setShowMoodCheckInModal(true)}
          />
        )}

        {activeTab === 'body' && (
          <BodyView
            onOpenAddFoodModal={(mealType, targetDate) => handleOpenAddFood(mealType, targetDate)}
            onOpenWeighInModal={() => setShowWeighInModal(true)}
            onOpenWeeklyReview={() => setShowWeeklyReviewModal(true)}
          />
        )}

        {activeTab === 'mind' && <MindView />}
      </main>

      {/* Floating Active Workout Pill (if working out while on another tab) */}
      {hasActiveWorkout && activeTab !== 'body' && (
        <aside
          aria-label="Active Workout in progress"
          onClick={() => setActiveTab('body')}
          className="fixed bottom-20 left-4 right-4 max-w-md mx-auto bg-[var(--color-surface-raised)] border border-[var(--color-accent)]/50 backdrop-blur-md rounded-2xl p-3 flex items-center justify-between shadow-xl cursor-pointer z-20 active:scale-[0.98] transition-all"
        >
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-[var(--color-accent)] text-[var(--color-on-accent)] flex items-center justify-center font-bold">
              <Play className="w-4 h-4 fill-current ml-0.5" />
            </div>
            <div>
              <div className="text-[10px] font-bold text-[var(--color-accent)] uppercase tracking-wider">
                Workout in Progress
              </div>
              <div className="text-xs font-bold text-[var(--color-text)]">{state.activeWorkout?.name}</div>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-[var(--color-accent)]" />
        </aside>
      )}

      {/* Persistent Bottom Tab Navigation */}
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
          targetDate={addFoodTargetDate}
          onClose={() => setShowAddFoodModal(false)}
        />
      )}

      {showWeighInModal && (
        <WeighInModal onClose={() => setShowWeighInModal(false)} />
      )}

      {showWeeklyReviewModal && (
        <WeeklyReviewModal
          review={
            pendingReview ||
            state.reviews[0] ||
            (state.weights.length > 0
              ? buildInitialWeeklyReview(state.weights, state.loggedFoods, state.profile)
              : undefined)
          }
          onClose={() => setShowWeeklyReviewModal(false)}
          onAccept={(id, customTarget) => {
            resolveReview(id, 'accepted', customTarget);
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
          onOpenProfile={() => {
            setShowSettingsModal(false);
            setShowProfileModal(true);
          }}
          onOpenFeedback={() => {
            setShowSettingsModal(false);
            setShowFeedbackModal(true);
          }}
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

      {showProfileModal && (
        <ProfileModal
          onClose={() => setShowProfileModal(false)}
          onOpenAuth={() => setShowAuthModal(true)}
        />
      )}

      {showAuthModal && (
        <AuthModal
          onClose={() => setShowAuthModal(false)}
          onSuccess={() => setShowAuthModal(false)}
        />
      )}

      {showSleepModal && (
        <SleepModal onClose={() => setShowSleepModal(false)} />
      )}

      {showReflectionModal && (
        <ReflectionModal initialType="morning" onClose={() => setShowReflectionModal(false)} />
      )}

      {showMoodCheckInModal && (
        <MoodCheckInModal onClose={() => setShowMoodCheckInModal(false)} />
      )}

      {showHealthSyncModal && (
        <HealthSyncModal onClose={() => setShowHealthSyncModal(false)} isOpen={showHealthSyncModal} />
      )}

      {showInstallPwaModal && (
        <InstallPwaModal onClose={() => setShowInstallPwaModal(false)} isOpen={showInstallPwaModal} />
      )}

      {showFeedbackModal && (
        <FrictionFeedbackModal onClose={() => setShowFeedbackModal(false)} />
      )}
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <FitnessProvider>
        <AppContent />
      </FitnessProvider>
    </AuthProvider>
  );
}
