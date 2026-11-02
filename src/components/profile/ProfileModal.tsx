import React, { useState, useMemo } from 'react';
import {
  X,
  User,
  Activity,
  Award,
  Flame,
  Scale,
  Sparkles,
  Cloud,
  CloudOff,
  Check,
  RefreshCw,
  LogOut,
  ShieldCheck,
  Zap,
} from 'lucide-react';
import { useFitness } from '../../context/FitnessContext';
import { useAuth } from '../../context/AuthContext';
import { FitnessGoal, SexType, ActivityLevel, ExperienceLevel, UnitSystem } from '../../types';
import { useBodyScrollLock } from '../../utils/useBodyScrollLock';
import { calculateRecommendedNutrition } from '../../utils/profileCalculator';
import { saveUserFitnessState } from '../../services/firebase';

interface ProfileModalProps {
  onClose: () => void;
  onOpenAuth: () => void;
}

export function ProfileModal({ onClose, onOpenAuth }: ProfileModalProps) {
  useBodyScrollLock(true);
  const { state, updateProfile } = useFitness();
  const { currentUser, signOut } = useAuth();
  const { profile, weights } = state;

  const latestWeight = weights.length > 0 ? weights[weights.length - 1].weightKg : profile.weightKg || 75;

  const [name, setName] = useState(profile.name || 'Athlete');
  const [age, setAge] = useState<number>(profile.age || 26);
  const [sex, setSex] = useState<SexType>(profile.sex || 'male');
  const [heightCm, setHeightCm] = useState<number>(profile.heightCm || 175);
  const [weightKg, setWeightKg] = useState<number>(profile.weightKg || latestWeight);
  const [targetWeightKg, setTargetWeightKg] = useState<number>(profile.targetWeightKg || profile.weightKg || latestWeight);
  const [activityLevel, setActivityLevel] = useState<ActivityLevel>(profile.activityLevel || 'moderate');
  const [experienceLevel, setExperienceLevel] = useState<ExperienceLevel>(profile.experienceLevel || 'intermediate');
  const [goal, setGoal] = useState<FitnessGoal>(profile.goal || 'fat_loss');
  const [targetRate, setTargetRate] = useState<number>(profile.targetRateKgPerWeek ?? -0.4);

  const [syncingCloud, setSyncingCloud] = useState(false);
  const [cloudMessage, setCloudMessage] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Live Mifflin-St Jeor metabolic calculations
  const recommended = useMemo(() => {
    return calculateRecommendedNutrition({
      weightKg,
      heightCm,
      age,
      sex,
      activityLevel,
      goal,
      targetRateKgPerWeek: targetRate,
    });
  }, [weightKg, heightCm, age, sex, activityLevel, goal, targetRate]);

  const handleApplyRecommendedTargets = () => {
    updateProfile((prev) => ({
      ...prev,
      targets: {
        calories: recommended.targetCalories,
        proteinGrams: recommended.macros.proteinGrams,
        carbsGrams: recommended.macros.carbsGrams,
        fatGrams: recommended.macros.fatGrams,
        waterMl: recommended.macros.waterMl,
      },
    }));
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 2000);
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    const updatedProfile = {
      name: name.trim() || 'Athlete',
      age,
      sex,
      heightCm,
      weightKg,
      targetWeightKg,
      activityLevel,
      experienceLevel,
      goal,
      targetRateKgPerWeek: targetRate,
      onboardingCompleted: true,
    };

    updateProfile(updatedProfile);

    // If user is authenticated, sync to Firestore
    if (currentUser?.uid) {
      setSyncingCloud(true);
      try {
        await saveUserFitnessState(currentUser.uid, {
          ...state,
          profile: {
            ...state.profile,
            ...updatedProfile,
          },
        });
        setCloudMessage('Profile synced to cloud!');
      } catch {
        setCloudMessage('Saved locally. Will sync to cloud once online.');
      } finally {
        setSyncingCloud(false);
        setTimeout(() => setCloudMessage(null), 3000);
      }
    }

    setSaveSuccess(true);
    setTimeout(() => {
      setSaveSuccess(false);
      onClose();
    }, 600);
  };

  const handleManualCloudSync = async () => {
    if (!currentUser?.uid) return;
    setSyncingCloud(true);
    setCloudMessage(null);
    try {
      await saveUserFitnessState(currentUser.uid, state);
      setCloudMessage('Everything synced to Firebase Cloud!');
    } catch (err: any) {
      setCloudMessage(err?.message || 'Sync failed. Please check internet connection.');
    } finally {
      setSyncingCloud(false);
      setTimeout(() => setCloudMessage(null), 4000);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in">
      <div className="bg-[var(--color-bg-elevated)] border border-[var(--color-border)] rounded-t-3xl sm:rounded-3xl max-w-md w-full p-5 sm:p-6 space-y-4 max-h-[92vh] overflow-y-auto shadow-2xl">
        {/* Header */}
        <div className="flex justify-between items-center pb-2 border-b border-[var(--color-border)]">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-[var(--color-accent)]/15 text-[var(--color-accent)] flex items-center justify-center font-bold">
              <User className="w-5 h-5 stroke-[2.5]" />
            </div>
            <div>
              <h3 className="k-display text-base text-[var(--color-text)]">Athletic Profile</h3>
              <span className="text-xs text-[var(--color-text-muted)]">Biological stats & expenditure</span>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Close profile"
            className="w-8 h-8 rounded-full bg-[var(--color-surface-raised)] border border-[var(--color-border)] text-[var(--color-text-muted)] hover:text-[var(--color-text)] flex items-center justify-center transition-all"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Cloud Sync Status Pill */}
        <div className="p-3 bg-[var(--color-surface-sunken)] border border-[var(--color-border)] rounded-2xl flex items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2.5">
            {currentUser ? (
              <div className="w-7 h-7 rounded-xl bg-[var(--color-success)]/15 text-[var(--color-success)] flex items-center justify-center shrink-0">
                <Cloud className="w-4 h-4" />
              </div>
            ) : (
              <div className="w-7 h-7 rounded-xl bg-[var(--color-surface-raised)] text-[var(--color-text-muted)] flex items-center justify-center shrink-0">
                <CloudOff className="w-4 h-4" />
              </div>
            )}
            <div>
              <div className="font-bold text-[var(--color-text)]">
                {currentUser ? currentUser.email || 'Cloud Account Connected' : 'Local-First (Offline)'}
              </div>
              <div className="text-[10px] text-[var(--color-text-muted)]">
                {currentUser ? 'Automatic multi-device synchronization active' : 'Data is stored privately in browser storage'}
              </div>
            </div>
          </div>

          {currentUser ? (
            <div className="flex items-center gap-1.5 shrink-0">
              <button
                type="button"
                onClick={handleManualCloudSync}
                disabled={syncingCloud}
                className="px-2.5 py-1.5 rounded-xl bg-[var(--color-surface-raised)] border border-[var(--color-border)] text-[var(--color-accent)] font-semibold text-[11px] flex items-center gap-1 active:scale-95 transition-all disabled:opacity-50"
                title="Sync now"
              >
                <RefreshCw className={`w-3 h-3 ${syncingCloud ? 'animate-spin' : ''}`} />
                <span>Sync</span>
              </button>
              <button
                type="button"
                onClick={() => signOut()}
                className="w-7 h-7 rounded-xl bg-[var(--color-surface-raised)] border border-[var(--color-border)] text-[var(--color-text-muted)] hover:text-[var(--color-danger)] flex items-center justify-center transition-all"
                title="Sign out"
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => {
                onClose();
                onOpenAuth();
              }}
              className="px-3 py-1.5 rounded-xl bg-[var(--color-accent)] text-[var(--color-on-accent)] font-semibold text-[11px] shrink-0 active:scale-95 transition-all shadow-sm"
            >
              Sign In
            </button>
          )}
        </div>

        {cloudMessage && (
          <div className="p-2.5 rounded-xl bg-[var(--color-success-soft)] border border-[var(--color-success)]/30 text-[var(--color-success)] text-xs font-semibold flex items-center gap-1.5">
            <Check className="w-3.5 h-3.5" />
            <span>{cloudMessage}</span>
          </div>
        )}

        <form onSubmit={handleSaveProfile} className="space-y-4">
          {/* Display Name */}
          <div className="space-y-1">
            <label className="text-[11px] font-semibold text-[var(--color-text-muted)] uppercase tracking-wider">
              Athlete Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-[var(--color-surface-sunken)] border border-[var(--color-border)] rounded-xl px-3.5 py-2 text-xs font-semibold text-[var(--color-text)] focus:outline-none focus:border-[var(--color-accent)]"
            />
          </div>

          {/* Biological Metrics Grid */}
          <div className="grid grid-cols-3 gap-2">
            <div>
              <label className="text-[10px] font-semibold text-[var(--color-text-muted)] uppercase tracking-wider block mb-1">
                Age
              </label>
              <input
                type="number"
                min="14"
                max="100"
                value={age}
                onChange={(e) => setAge(parseInt(e.target.value) || 25)}
                className="w-full bg-[var(--color-surface-sunken)] border border-[var(--color-border)] rounded-xl p-2 text-center text-xs font-bold text-[var(--color-text)] focus:outline-none"
              />
            </div>
            <div>
              <label className="text-[10px] font-semibold text-[var(--color-text-muted)] uppercase tracking-wider block mb-1">
                Sex
              </label>
              <select
                value={sex}
                onChange={(e) => setSex(e.target.value as SexType)}
                className="w-full bg-[var(--color-surface-sunken)] border border-[var(--color-border)] rounded-xl p-2 text-xs font-bold text-[var(--color-text)] focus:outline-none"
              >
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Other</option>
              </select>
            </div>
            <div>
              <label className="text-[10px] font-semibold text-[var(--color-text-muted)] uppercase tracking-wider block mb-1">
                Height (cm)
              </label>
              <input
                type="number"
                min="120"
                max="240"
                value={heightCm}
                onChange={(e) => setHeightCm(parseInt(e.target.value) || 175)}
                className="w-full bg-[var(--color-surface-sunken)] border border-[var(--color-border)] rounded-xl p-2 text-center text-xs font-bold text-[var(--color-text)] focus:outline-none"
              />
            </div>
          </div>

          {/* Current vs Target Weight */}
          <div className="grid grid-cols-2 gap-2">
            <div className="bg-[var(--color-surface-sunken)] p-3 rounded-2xl border border-[var(--color-border)]">
              <span className="text-[10px] text-[var(--color-text-muted)] uppercase font-semibold block">
                Current Weight (kg)
              </span>
              <input
                type="number"
                step="0.1"
                min="35"
                max="250"
                value={weightKg}
                onChange={(e) => setWeightKg(parseFloat(e.target.value) || 75)}
                className="w-full bg-transparent text-left font-bold text-base text-[var(--color-text)] focus:outline-none mt-1"
              />
            </div>
            <div className="bg-[var(--color-surface-sunken)] p-3 rounded-2xl border border-[var(--color-border)]">
              <span className="text-[10px] text-[var(--color-accent)] uppercase font-semibold block">
                Target Weight (kg)
              </span>
              <input
                type="number"
                step="0.1"
                min="35"
                max="250"
                value={targetWeightKg}
                onChange={(e) => setTargetWeightKg(parseFloat(e.target.value) || 70)}
                className="w-full bg-transparent text-left font-bold text-base text-[var(--color-text)] focus:outline-none mt-1"
              />
            </div>
          </div>

          {/* Activity & Experience Level */}
          <div className="space-y-2">
            <div>
              <label className="text-[10px] font-semibold text-[var(--color-text-muted)] uppercase tracking-wider block mb-1">
                Activity Level
              </label>
              <select
                value={activityLevel}
                onChange={(e) => setActivityLevel(e.target.value as ActivityLevel)}
                className="w-full bg-[var(--color-surface-sunken)] border border-[var(--color-border)] rounded-xl px-3 py-2 text-xs font-medium text-[var(--color-text)] focus:outline-none"
              >
                <option value="sedentary">Sedentary (Desk work, minimal exercise)</option>
                <option value="light">Lightly Active (1-2 workouts / week)</option>
                <option value="moderate">Moderately Active (3-5 workouts / week)</option>
                <option value="very_active">Very Active (6-7 intense training sessions)</option>
                <option value="athlete">Athletic / Two-a-day Training (High energy)</option>
              </select>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[10px] font-semibold text-[var(--color-text-muted)] uppercase tracking-wider block mb-1">
                  Primary Goal
                </label>
                <select
                  value={goal}
                  onChange={(e) => setGoal(e.target.value as FitnessGoal)}
                  className="w-full bg-[var(--color-surface-sunken)] border border-[var(--color-border)] rounded-xl p-2 text-xs font-semibold text-[var(--color-text)] focus:outline-none"
                >
                  <option value="fat_loss">Fat Loss</option>
                  <option value="recomp">Recomposition</option>
                  <option value="maintenance">Maintenance</option>
                  <option value="muscle_gain">Lean Muscle Gain</option>
                </select>
              </div>

              <div>
                <label className="text-[10px] font-semibold text-[var(--color-text-muted)] uppercase tracking-wider block mb-1">
                  Weekly Rate ({targetRate > 0 ? `+${targetRate}` : targetRate} kg)
                </label>
                <select
                  value={targetRate}
                  onChange={(e) => setTargetRate(parseFloat(e.target.value) || 0)}
                  className="w-full bg-[var(--color-surface-sunken)] border border-[var(--color-border)] rounded-xl p-2 text-xs font-semibold text-[var(--color-text)] focus:outline-none"
                >
                  <option value="-0.6">-0.6 kg / wk (Aggressive cut)</option>
                  <option value="-0.4">-0.4 kg / wk (Standard cut)</option>
                  <option value="-0.2">-0.2 kg / wk (Mild deficit)</option>
                  <option value="0">0.0 kg / wk (Maintenance)</option>
                  <option value="0.2">+0.2 kg / wk (Lean bulk)</option>
                  <option value="0.35">+0.35 kg / wk (Hypertrophy surplus)</option>
                </select>
              </div>
            </div>
          </div>

          {/* Personalized Energy & Macro Engine Recommendations */}
          <div className="p-4 bg-[var(--color-surface-sunken)] border border-[var(--color-accent)]/30 rounded-2xl space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-[var(--color-accent)] flex items-center gap-1.5 uppercase tracking-wide">
                <Sparkles className="w-3.5 h-3.5" />
                Mifflin-St Jeor Metabolic Analysis
              </span>
              <span className="text-[10px] font-semibold text-[var(--color-text-muted)]">
                BMR: {recommended.bmr} kcal
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2 text-center">
              <div className="bg-[var(--color-surface-raised)] rounded-xl p-2">
                <span className="text-[10px] text-[var(--color-text-muted)] block uppercase font-medium">
                  Maintenance TDEE
                </span>
                <span className="text-sm font-bold text-[var(--color-text)]">
                  {recommended.maintenanceCalories} kcal
                </span>
              </div>
              <div className="bg-[var(--color-surface-raised)] rounded-xl p-2 border border-[var(--color-accent)]/40">
                <span className="text-[10px] text-[var(--color-accent)] block uppercase font-bold">
                  Recommended Target
                </span>
                <span className="text-sm font-black text-[var(--color-accent)]">
                  {recommended.targetCalories} kcal
                </span>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-1.5 text-center text-xs">
              <div className="bg-[var(--color-surface-raised)] p-1.5 rounded-lg">
                <span className="text-[9px] text-[var(--color-success)] uppercase font-semibold block">Protein</span>
                <span className="font-bold text-[var(--color-text)]">{recommended.macros.proteinGrams}g</span>
              </div>
              <div className="bg-[var(--color-surface-raised)] p-1.5 rounded-lg">
                <span className="text-[9px] text-[var(--color-warning)] uppercase font-semibold block">Carbs</span>
                <span className="font-bold text-[var(--color-text)]">{recommended.macros.carbsGrams}g</span>
              </div>
              <div className="bg-[var(--color-surface-raised)] p-1.5 rounded-lg">
                <span className="text-[9px] text-[var(--color-danger)] uppercase font-semibold block">Fat</span>
                <span className="font-bold text-[var(--color-text)]">{recommended.macros.fatGrams}g</span>
              </div>
            </div>

            <button
              type="button"
              onClick={handleApplyRecommendedTargets}
              className="w-full py-2 bg-[var(--color-accent)]/15 hover:bg-[var(--color-accent)]/25 text-[var(--color-accent)] border border-[var(--color-accent)]/40 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 active:scale-95 transition-all"
            >
              <Zap className="w-3.5 h-3.5" />
              <span>Apply Recommended Macros to Daily Targets</span>
            </button>
          </div>

          {/* Submit Action */}
          <button
            type="submit"
            className="w-full py-3 bg-[var(--color-accent)] hover:bg-[var(--color-accent-hover)] text-[var(--color-on-accent)] font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 active:scale-95 transition-all shadow-sm"
          >
            {saveSuccess ? (
              <>
                <Check className="w-4 h-4 stroke-[3]" />
                <span>Profile Saved!</span>
              </>
            ) : (
              <span>Save Profile & Targets</span>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
