import React, { useState, useEffect } from 'react';
import {
  X,
  FileDown,
  RotateCcw,
  Shield,
  Check,
  Moon,
  Sun,
  Cloud,
  CloudUpload,
  Bug,
  Sparkles,
  RefreshCw,
  AlertCircle,
  Loader2,
  Clock,
  Watch,
  Smartphone,
  LogOut,
  User as UserIcon,
} from 'lucide-react';
import { useFitness } from '../../context/FitnessContext';
import { useAuth } from '../../context/AuthContext';
import { FitnessGoal, UnitSystem } from '../../types';
import { useBodyScrollLock } from '../../utils/useBodyScrollLock';
import {
  submitFeedbackIssue,
  fetchFeedbackIssues,
  FeedbackIssue,
} from '../../services/firebase';

interface SettingsModalProps {
  onClose: () => void;
  onOpenHealthSync?: () => void;
  onOpenInstallPwa?: () => void;
}

export function SettingsModal({ onClose, onOpenHealthSync, onOpenInstallPwa }: SettingsModalProps) {
  useBodyScrollLock(true);
  const { currentUser, signOut } = useAuth();
  const { state, updateProfile, resetAllData, exportAllJson, exportCsv, importAllJson, forceSyncCloud, syncStatus } = useFitness();
  const { profile } = state;

  const [name, setName] = useState(profile.name);
  const [unitSystem, setUnitSystem] = useState<UnitSystem>(profile.unitSystem);
  const [goal, setGoal] = useState<FitnessGoal>(profile.goal);
  const [targetRate, setTargetRate] = useState<number>(profile.targetRateKgPerWeek);
  const [calories, setCalories] = useState<number>(profile.targets.calories);
  const [protein, setProtein] = useState<number>(profile.targets.proteinGrams);
  const [carbs, setCarbs] = useState<number>(profile.targets.carbsGrams);
  const [fat, setFat] = useState<number>(profile.targets.fatGrams);
  const [waterMl, setWaterMl] = useState<number>(profile.targets.waterMl);

  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [importStatus, setImportStatus] = useState<string | null>(null);

  // Firebase Bug & Fix Tracker state
  const [feedbackType, setFeedbackType] = useState<'bug' | 'fix' | 'suggestion' | 'feature'>('bug');
  const [feedbackSeverity, setFeedbackSeverity] = useState<'low' | 'medium' | 'high'>('medium');
  const [feedbackTitle, setFeedbackTitle] = useState('');
  const [feedbackDesc, setFeedbackDesc] = useState('');
  const [isSubmittingFeedback, setIsSubmittingFeedback] = useState(false);
  const [feedbackSubmitted, setFeedbackSubmitted] = useState(false);
  const [feedbackError, setFeedbackError] = useState<string | null>(null);

  // Cloud Backup Sync state
  const [isSyncingCloud, setIsSyncingCloud] = useState(false);
  const [cloudSyncSuccess, setCloudSyncSuccess] = useState(false);

  // Existing issues from Firestore
  const [issuesList, setIssuesList] = useState<FeedbackIssue[]>([]);
  const [isLoadingIssues, setIsLoadingIssues] = useState(false);

  // Load issues on mount
  const loadIssues = async () => {
    setIsLoadingIssues(true);
    try {
      const items = await fetchFeedbackIssues();
      setIssuesList(items);
    } catch {
      // offline or silent fallback
    } finally {
      setIsLoadingIssues(false);
    }
  };

  useEffect(() => {
    loadIssues();
  }, []);

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    updateProfile({
      name,
      unitSystem,
      goal,
      targetRateKgPerWeek: targetRate,
      targets: {
        calories,
        proteinGrams: protein,
        carbsGrams: carbs,
        fatGrams: fat,
        waterMl,
      },
    });
    setSaveSuccess(true);
    setTimeout(() => {
      setSaveSuccess(false);
      onClose();
    }, 600);
  };

  // Submit bug / fix to Firestore
  const handleSubmitFeedback = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!feedbackDesc.trim()) return;

    setIsSubmittingFeedback(true);
    setFeedbackError(null);

    try {
      const newIssue = await submitFeedbackIssue({
        type: feedbackType,
        title: feedbackTitle.trim() || undefined,
        description: feedbackDesc.trim(),
        severity: feedbackSeverity,
      });

      setFeedbackSubmitted(true);
      setFeedbackTitle('');
      setFeedbackDesc('');
      setIssuesList((prev) => [newIssue, ...prev]);

      setTimeout(() => {
        setFeedbackSubmitted(false);
      }, 3000);
    } catch (err: any) {
      setFeedbackError(err?.message || 'Failed to submit to Firebase. Please try again.');
    } finally {
      setIsSubmittingFeedback(false);
    }
  };

  // Cloud Sync Handler (per-user sync to Firestore)
  const handleCloudSync = async () => {
    setIsSyncingCloud(true);
    try {
      const ok = await forceSyncCloud();
      if (ok) {
        setCloudSyncSuccess(true);
        setTimeout(() => setCloudSyncSuccess(false), 2500);
      }
    } finally {
      setIsSyncingCloud(false);
    }
  };


  const handleImportFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const text = await file.text();
    const res = importAllJson(text);
    if (res.ok) {
      setImportStatus('Imported successfully');
    } else {
      setImportStatus(`Import failed: ${res.error}`);
    }
    setTimeout(() => setImportStatus(null), 3000);
    e.target.value = '';
  };

  const handleSignOut = async () => {
    try {
      await signOut();
      onClose();
    } catch (err) {
      console.error('Sign out error:', err);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
      <div className="bg-zinc-900 border border-zinc-800 rounded-3xl max-w-sm w-full p-6 space-y-4 max-h-[92vh] overflow-y-auto shadow-2xl">
        <div className="flex justify-between items-center">
          <div>
            <h3 className="font-bold text-white text-base">Settings & Data</h3>
            <span className="text-xs text-zinc-400">Manage targets, cloud database & exports</span>
          </div>
          <button
            onClick={onClose}
            aria-label="Close settings"
            className="min-h-[44px] min-w-[44px] flex items-center justify-center text-zinc-400 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Authenticated User Account Card */}
        {currentUser && (
          <div className="p-3.5 rounded-2xl bg-zinc-950 border border-zinc-800/80 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5 overflow-hidden">
              <div className="h-8 w-8 rounded-full bg-[#E07A5F]/20 text-[#E07A5F] flex items-center justify-center shrink-0 border border-[#E07A5F]/30">
                <UserIcon className="w-4 h-4" />
              </div>
              <div className="overflow-hidden">
                <div className="text-xs font-semibold text-zinc-200 truncate">
                  {currentUser.displayName || profile.name || 'Kinetic Athlete'}
                </div>
                <div className="text-[11px] text-zinc-500 truncate">{currentUser.email}</div>
              </div>
            </div>
            <button
              type="button"
              onClick={handleSignOut}
              title="Sign Out"
              className="px-2.5 py-1.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-red-400 text-[11px] font-medium flex items-center gap-1.5 border border-zinc-800 transition-colors shrink-0"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Sign Out</span>
            </button>
          </div>
        )}

        <form onSubmit={handleSaveProfile} className="space-y-4">
          {/* User Name */}
          <div>
            <label className="text-xs font-semibold text-zinc-300 block mb-1">Display Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="min-h-[44px] w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-teal-500"
            />
          </div>

          {/* Unit System */}
          <div>
            <label className="text-xs font-semibold text-zinc-300 block mb-1">Unit System</label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setUnitSystem('metric')}
                className={`min-h-[40px] py-2 rounded-xl text-xs font-semibold transition-all border ${
                  unitSystem === 'metric'
                    ? 'bg-teal-500/20 border-teal-500/60 text-teal-300'
                    : 'bg-zinc-950 border-zinc-800 text-zinc-400'
                }`}
              >
                Metric (kg / cm)
              </button>
              <button
                type="button"
                onClick={() => setUnitSystem('imperial')}
                className={`min-h-[40px] py-2 rounded-xl text-xs font-semibold transition-all border ${
                  unitSystem === 'imperial'
                    ? 'bg-teal-500/20 border-teal-500/60 text-teal-300'
                    : 'bg-zinc-950 border-zinc-800 text-zinc-400'
                }`}
              >
                Imperial (lb / in)
              </button>
            </div>
          </div>

          {/* Goal & Rate */}
          <div>
            <label className="text-xs font-semibold text-zinc-300 block mb-1">Primary Goal</label>
            <select
              value={goal}
              onChange={(e) => setGoal(e.target.value as FitnessGoal)}
              className="min-h-[44px] w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
            >
              <option value="fat_loss">Fat Loss (Sustainable Deficit)</option>
              <option value="recomp">Body Recomposition</option>
              <option value="maintenance">Maintenance</option>
              <option value="muscle_gain">Lean Muscle Gain (Controlled Surplus)</option>
            </select>
          </div>

          {/* Calorie & Macro Targets */}
          <div className="bg-zinc-950 p-3.5 rounded-2xl border border-zinc-800 space-y-3">
            <span className="text-[10px] font-bold uppercase tracking-wider text-teal-400 block">
              Nutrition Targets
            </span>

            <div className="flex justify-between items-center text-xs">
              <span className="text-zinc-400">Daily Calories:</span>
              <input
                type="number"
                step="25"
                value={calories}
                onChange={(e) => setCalories(parseInt(e.target.value) || 2000)}
                className="w-20 bg-zinc-900 border border-zinc-700 rounded-lg p-1 text-center font-bold text-white focus:outline-none"
              />
            </div>

            <div className="grid grid-cols-3 gap-2 text-center pt-1">
              <div>
                <label className="text-[10px] text-emerald-400 font-semibold block">Protein (g)</label>
                <input
                  type="number"
                  value={protein}
                  onChange={(e) => setProtein(parseInt(e.target.value) || 150)}
                  className="w-full bg-zinc-900 border border-zinc-700 rounded-lg p-1 text-center text-xs font-bold text-white"
                />
              </div>
              <div>
                <label className="text-[10px] text-amber-400 font-semibold block">Carbs (g)</label>
                <input
                  type="number"
                  value={carbs}
                  onChange={(e) => setCarbs(parseInt(e.target.value) || 200)}
                  className="w-full bg-zinc-900 border border-zinc-700 rounded-lg p-1 text-center text-xs font-bold text-white"
                />
              </div>
              <div>
                <label className="text-[10px] text-rose-400 font-semibold block">Fat (g)</label>
                <input
                  type="number"
                  value={fat}
                  onChange={(e) => setFat(parseInt(e.target.value) || 60)}
                  className="w-full bg-zinc-900 border border-zinc-700 rounded-lg p-1 text-center text-xs font-bold text-white"
                />
              </div>
            </div>

            <div className="flex justify-between items-center text-xs pt-1">
              <span className="text-zinc-400">Water Goal (ml):</span>
              <input
                type="number"
                step="250"
                value={waterMl}
                onChange={(e) => setWaterMl(parseInt(e.target.value) || 3000)}
                className="w-20 bg-zinc-900 border border-zinc-700 rounded-lg p-1 text-center font-bold text-white focus:outline-none"
              />
            </div>
          </div>

          <button
            type="submit"
            className="min-h-[48px] w-full py-2.5 bg-teal-500 hover:bg-teal-400 text-zinc-950 font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 active:scale-95 transition-all shadow-sm"
          >
            {saveSuccess ? (
              <>
                <Check className="w-4 h-4 stroke-[3]" />
                <span>Saved Successfully!</span>
              </>
            ) : (
              <span>Save Target Changes</span>
            )}
          </button>
        </form>

        {/* ======================================================== */}
        {/* DATA OWNERSHIP & EXPORTS */}
        {/* ======================================================== */}
        <div className="pt-3 border-t border-zinc-800 space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-xs font-bold text-zinc-300">
              <Shield className="w-4 h-4 text-teal-400" />
              <span>Data Ownership & Exports</span>
            </div>
            <span className="text-[10px] text-teal-400 font-semibold bg-teal-500/10 px-2 py-0.5 rounded-full border border-teal-500/30">
              Zero Lock-in
            </span>
          </div>

          <p className="text-[11px] text-zinc-400 leading-relaxed">
            All records persist locally in your browser. You can export backups in JSON/CSV, or sync
            to your cloud Firebase database.
          </p>

          <div className="grid grid-cols-2 gap-2 pt-1">
            <label className="min-h-[44px] py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-semibold rounded-xl flex items-center justify-center gap-1.5 active:scale-95 transition-all cursor-pointer">
              <FileDown className="w-3.5 h-3.5 text-teal-400 rotate-180" />
              <span>Import Backup (JSON)</span>
              <input type="file" accept="application/json,.json" className="hidden" onChange={handleImportFile} />
            </label>
            <button
              onClick={exportAllJson}
              className="min-h-[44px] py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-semibold rounded-xl flex items-center justify-center gap-1.5 active:scale-95 transition-all"
            >
              <FileDown className="w-3.5 h-3.5 text-teal-400" />
              <span>Full Backup (JSON)</span>
            </button>
            <button
              onClick={handleCloudSync}
              disabled={isSyncingCloud}
              className="min-h-[44px] py-2 bg-zinc-800 hover:bg-zinc-700 text-teal-300 text-xs font-semibold rounded-xl flex items-center justify-center gap-1.5 active:scale-95 transition-all border border-teal-500/20"
            >
              {isSyncingCloud ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : cloudSyncSuccess ? (
                <Check className="w-3.5 h-3.5 text-teal-400 stroke-[3]" />
              ) : (
                <CloudUpload className="w-3.5 h-3.5 text-teal-400" />
              )}
              <span>{cloudSyncSuccess ? 'Synced to Cloud!' : 'Sync to Firebase'}</span>
            </button>
          </div>

          <div className="grid grid-cols-3 gap-2">
            <button
              onClick={() => exportCsv('weights')}
              className="min-h-[44px] py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-[11px] font-semibold rounded-xl flex items-center justify-center gap-1 active:scale-95 transition-all"
            >
              <FileDown className="w-3 h-3 text-teal-400" />
              <span>Weights</span>
            </button>
            <button
              onClick={() => exportCsv('foods')}
              className="min-h-[44px] py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-[11px] font-semibold rounded-xl flex items-center justify-center gap-1 active:scale-95 transition-all"
            >
              <FileDown className="w-3 h-3 text-teal-400" />
              <span>Nutrition</span>
            </button>
            <button
              onClick={() => exportCsv('workouts')}
              className="min-h-[44px] py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-[11px] font-semibold rounded-xl flex items-center justify-center gap-1 active:scale-95 transition-all"
            >
              <FileDown className="w-3 h-3 text-teal-400" />
              <span>Workouts</span>
            </button>
          </div>
        </div>

        {/* ======================================================== */}
        {/* HEALTH & WEARABLE INTEGRATION (APPLE HEALTH & GARMIN)   */}
        {/* ======================================================== */}
        <div className="pt-4 border-t border-zinc-800 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-xs font-bold text-white">
              <Watch className="w-4 h-4 text-[#E07A5F]" />
              <span>Apple Health & Garmin Sync</span>
            </div>
            <span className="text-[10px] text-teal-400 font-semibold bg-teal-500/10 px-2 py-0.5 rounded-full border border-teal-500/30">
              Active
            </span>
          </div>

          <p className="text-[11px] text-zinc-400 leading-relaxed">
            Directly ingest workouts, cardio, and weigh-ins from Apple Health (XML/Shortcuts) and Garmin Connect (.TCX/.GPX/.CSV).
          </p>

          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => onOpenHealthSync?.()}
              className="min-h-[44px] py-2.5 px-3 bg-[#FAF3EA] dark:bg-[#2C241E] hover:border-[#E07A5F] border border-[#EBE1D3] dark:border-[#42362C] text-[#28221D] dark:text-[#F7F2EC] rounded-2xl flex items-center gap-2 text-xs font-semibold text-left transition-all active:scale-95"
            >
              <div className="w-7 h-7 rounded-xl bg-[#E07A5F]/15 text-[#E07A5F] flex items-center justify-center shrink-0">
                <Watch className="w-4 h-4" />
              </div>
              <div>
                <p className="font-bold text-xs">Sync Devices</p>
                <p className="text-[10px] text-[#8A7B6E] dark:text-[#A8988B]">Apple & Garmin</p>
              </div>
            </button>

            <button
              type="button"
              onClick={() => onOpenInstallPwa?.()}
              className="min-h-[44px] py-2.5 px-3 bg-[#FAF3EA] dark:bg-[#2C241E] hover:border-[#E07A5F] border border-[#EBE1D3] dark:border-[#42362C] text-[#28221D] dark:text-[#F7F2EC] rounded-2xl flex items-center gap-2 text-xs font-semibold text-left transition-all active:scale-95"
            >
              <div className="w-7 h-7 rounded-xl bg-[#2D6C96]/15 text-[#2D6C96] flex items-center justify-center shrink-0">
                <Smartphone className="w-4 h-4" />
              </div>
              <div>
                <p className="font-bold text-xs">Install PWA</p>
                <p className="text-[10px] text-[#8A7B6E] dark:text-[#A8988B]">iPhone Home Screen</p>
              </div>
            </button>
          </div>
        </div>

        {/* ======================================================== */}
        {/* FIREBASE DEVELOPER BUG & FIX TRACKER (USER REQUEST) */}
        {/* ======================================================== */}
        <div className="pt-4 border-t border-zinc-800 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-xs font-bold text-white">
              <Bug className="w-4 h-4 text-rose-400" />
              <span>Developer Fixes & Bug Tracker</span>
            </div>
            <div className="flex items-center gap-1 text-[10px] text-teal-400 font-semibold bg-teal-500/10 px-2 py-0.5 rounded-full border border-teal-500/30">
              <span className="w-1.5 h-1.5 rounded-full bg-teal-400 animate-pulse" />
              <span>Firebase Cloud</span>
            </div>
          </div>

          <p className="text-[11px] text-zinc-400 leading-relaxed">
            Record bugs, UI fixes, or requested features here. They are automatically saved to your
            shared Firebase database so whenever you return, the AI developer will review your recorded
            fixes and apply them directly.
          </p>

          {/* Feedback Form */}
          <form onSubmit={handleSubmitFeedback} className="space-y-2.5 bg-zinc-950 p-3.5 rounded-2xl border border-zinc-800">
            {/* Category Pills */}
            <div className="grid grid-cols-4 gap-1">
              {(
                [
                  { type: 'bug', label: '🐛 Bug' },
                  { type: 'fix', label: '💡 Fix' },
                  { type: 'feature', label: '✨ Feature' },
                  { type: 'suggestion', label: '💭 Idea' },
                ] as const
              ).map((cat) => (
                <button
                  key={cat.type}
                  type="button"
                  onClick={() => setFeedbackType(cat.type)}
                  className={`min-h-[34px] py-1 text-[10px] font-bold rounded-lg border transition-all ${
                    feedbackType === cat.type
                      ? 'bg-teal-500/20 border-teal-500 text-teal-300'
                      : 'bg-zinc-900 border-zinc-800 text-zinc-400'
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>

            {/* Severity and Title */}
            <div className="grid grid-cols-3 gap-2">
              <div className="col-span-1">
                <select
                  value={feedbackSeverity}
                  onChange={(e) => setFeedbackSeverity(e.target.value as any)}
                  className="min-h-[38px] w-full bg-zinc-900 border border-zinc-800 rounded-xl px-2 py-1 text-[11px] text-zinc-300 font-semibold focus:outline-none"
                >
                  <option value="low">Low Priority</option>
                  <option value="medium">Medium Priority</option>
                  <option value="high">High / Urgent</option>
                </select>
              </div>

              <div className="col-span-2">
                <input
                  type="text"
                  placeholder="Subject (e.g. Timer sound on iPhone)"
                  value={feedbackTitle}
                  onChange={(e) => setFeedbackTitle(e.target.value)}
                  className="min-h-[38px] w-full bg-zinc-900 border border-zinc-800 rounded-xl px-2.5 py-1 text-xs text-white focus:outline-none focus:border-teal-500"
                />
              </div>
            </div>

            {/* Detailed Description */}
            <div>
              <textarea
                required
                rows={3}
                placeholder="Describe the bug, calculation issue, or suggestion in detail..."
                value={feedbackDesc}
                onChange={(e) => setFeedbackDesc(e.target.value)}
                className="w-full bg-zinc-900 border border-zinc-800 rounded-xl p-2.5 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-teal-500 resize-none"
              />
            </div>

            {feedbackError && (
              <div className="text-[11px] text-rose-400 flex items-center gap-1">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                <span>{feedbackError}</span>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isSubmittingFeedback || !feedbackDesc.trim()}
              className="min-h-[44px] w-full py-2 bg-teal-500 hover:bg-teal-400 disabled:opacity-50 text-zinc-950 font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 transition-all active:scale-95 shadow-sm"
            >
              {isSubmittingFeedback ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Uploading to Firebase...</span>
                </>
              ) : feedbackSubmitted ? (
                <>
                  <Check className="w-3.5 h-3.5 stroke-[3]" />
                  <span>Recorded in Firebase Database!</span>
                </>
              ) : (
                <>
                  <CloudUpload className="w-3.5 h-3.5 stroke-[2.5]" />
                  <span>Upload Fix / Bug to Firebase</span>
                </>
              )}
            </button>
          </form>

          {/* List of previously logged bugs from Firestore */}
          <div className="space-y-2 pt-1">
            <div className="flex justify-between items-center text-xs">
              <span className="font-bold text-zinc-400 text-[11px] uppercase tracking-wider">
                Recorded Database Entries ({issuesList.length})
              </span>
              <button
                type="button"
                onClick={loadIssues}
                disabled={isLoadingIssues}
                className="text-zinc-500 hover:text-teal-400 flex items-center gap-1 text-[11px]"
              >
                <RefreshCw className={`w-3 h-3 ${isLoadingIssues ? 'animate-spin' : ''}`} />
                <span>Refresh</span>
              </button>
            </div>

            {issuesList.length === 0 ? (
              <div className="p-3 text-center text-xs text-zinc-500 bg-zinc-950 rounded-xl border border-zinc-800/80">
                No bugs or fixes recorded yet. Write your first feedback above.
              </div>
            ) : (
              <div className="space-y-1.5 max-h-44 overflow-y-auto pr-1">
                {issuesList.map((item) => (
                  <div
                    key={item.id}
                    className="p-2.5 rounded-xl bg-zinc-950 border border-zinc-800 space-y-1"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <span
                          className={`px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider ${
                            item.type === 'bug'
                              ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                              : item.type === 'fix'
                              ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                              : 'bg-teal-500/20 text-teal-300 border border-teal-500/30'
                          }`}
                        >
                          {item.type}
                        </span>
                        {item.title && (
                          <span className="text-xs font-bold text-white truncate max-w-[170px]">
                            {item.title}
                          </span>
                        )}
                      </div>

                      <span className="text-[10px] text-zinc-500 flex items-center gap-1">
                        <Clock className="w-2.5 h-2.5" />
                        {new Date(item.createdAt).toLocaleDateString()}
                      </span>
                    </div>

                    <p className="text-[11px] text-zinc-300 leading-snug">{item.description}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Reset State Action */}
        <div className="pt-2 border-t border-zinc-800">
          <button
            onClick={() => setShowResetConfirm(true)}
            className="min-h-[44px] w-full py-2 bg-rose-950/40 hover:bg-rose-900/60 border border-rose-800/40 text-rose-300 font-semibold rounded-xl text-xs flex items-center justify-center gap-1.5 transition-all"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset to Initial Mock Data</span>
          </button>
        </div>
      </div>

      {/* Reset Confirmation Dialog */}
      {showResetConfirm && (
        <div className="fixed inset-0 z-60 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-zinc-900 border border-zinc-800 rounded-3xl max-w-xs w-full p-5 space-y-4 shadow-2xl">
            <h4 className="font-bold text-white text-sm">Reset App Data?</h4>
            <p className="text-xs text-zinc-400 leading-relaxed">
              This will restore all 28-day sample weigh-ins, workout templates, and food logs to default
              state. Any changes made will be cleared.
            </p>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => setShowResetConfirm(false)}
                className="min-h-[44px] py-2 bg-zinc-800 rounded-xl text-xs font-semibold text-zinc-300"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  resetAllData();
                  setShowResetConfirm(false);
                  onClose();
                }}
                className="min-h-[44px] py-2 bg-rose-600 hover:bg-rose-500 text-white font-bold rounded-xl text-xs"
              >
                Reset All
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
