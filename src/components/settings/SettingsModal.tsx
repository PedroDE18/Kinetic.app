import React, { useState } from 'react';
import {
  X,
  FileDown,
  RotateCcw,
  Shield,
  Check,
  Watch,
  Smartphone,
  Sparkles,
  User,
  Database,
  Trash2,
  Play,
  Bell,
  BellRing,
  Send,
  AlertCircle,
  Cloud,
  CloudUpload,
  CloudDownload,
  MessageSquarePlus,
} from 'lucide-react';
import { useFitness } from '../../context/FitnessContext';
import { useAuth } from '../../context/AuthContext';
import { saveUserFitnessState, loadUserFitnessState } from '../../services/firebase';
import { FitnessGoal, UnitSystem } from '../../types';
import { useBodyScrollLock } from '../../utils/useBodyScrollLock';
import { resolveInitialLanguage, SupportedLanguage } from '../../utils/i18n';
import {
  isIOS,
  isStandalone,
  isNotificationSupported,
  getNotificationPermission,
  requestNotificationPermission,
  sendTestNotification,
  loadReminderConfig,
  saveReminderConfig,
  ReminderConfig,
} from '../../services/notificationService';

interface SettingsModalProps {
  onClose: () => void;
  onOpenProfile?: () => void;
  onOpenHealthSync?: () => void;
  onOpenInstallPwa?: () => void;
  onOpenFeedback?: () => void;
}

export function SettingsModal({ onClose, onOpenProfile, onOpenHealthSync, onOpenInstallPwa, onOpenFeedback }: SettingsModalProps) {
  useBodyScrollLock(true);
  const {
    state,
    updateProfile,
    resetAllData,
    loadDemoData,
    clearAllHistory,
    exportAllJson,
    exportCsv,
    importAllJson,
    replaceFitnessState,
  } = useFitness();
  const { currentUser } = useAuth();
  const { profile } = state;

  const [name, setName] = useState(profile.name);
  const [unitSystem, setUnitSystem] = useState<UnitSystem>(profile.unitSystem);
  const [language, setLanguage] = useState<SupportedLanguage>(profile.language || resolveInitialLanguage());
  const [goal, setGoal] = useState<FitnessGoal>(profile.goal);
  const [targetRate, setTargetRate] = useState<number>(profile.targetRateKgPerWeek);
  const [calories, setCalories] = useState<number>(profile.targets.calories);
  const [protein, setProtein] = useState<number>(profile.targets.proteinGrams);
  const [carbs, setCarbs] = useState<number>(profile.targets.carbsGrams);
  const [fat, setFat] = useState<number>(profile.targets.fatGrams);
  const [waterMl, setWaterMl] = useState<number>(profile.targets.waterMl);
  const [geminiApiKey, setGeminiApiKey] = useState<string>(profile.geminiApiKey || '');
  const [macroCyclingEnabled, setMacroCyclingEnabled] = useState<boolean>(profile.macroCycling?.enabled ?? false);
  const [trainingOffset, setTrainingOffset] = useState<number>(profile.macroCycling?.trainingDaysOffsetCalories ?? 250);
  const [restOffset, setRestOffset] = useState<number>(profile.macroCycling?.restDaysOffsetCalories ?? -250);

  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [importStatus, setImportStatus] = useState<string | null>(null);
  const [cloudStatusMsg, setCloudStatusMsg] = useState<string | null>(null);
  const [isSyncingCloud, setIsSyncingCloud] = useState(false);

  const handleManualCloudBackup = async () => {
    if (!currentUser?.uid) return;
    setIsSyncingCloud(true);
    setCloudStatusMsg(null);
    try {
      await saveUserFitnessState(currentUser.uid, state);
      setCloudStatusMsg('Successfully backed up all records to Firebase Cloud!');
      setTimeout(() => setCloudStatusMsg(null), 4000);
    } catch (err: any) {
      setCloudStatusMsg(`Cloud backup failed: ${err?.message || 'Error'}`);
    } finally {
      setIsSyncingCloud(false);
    }
  };

  const handleManualCloudRestore = async () => {
    if (!currentUser?.uid) return;
    setIsSyncingCloud(true);
    setCloudStatusMsg(null);
    try {
      const cloudData = await loadUserFitnessState(currentUser.uid);
      if (cloudData) {
        replaceFitnessState(cloudData);
        const weightsCount = Array.isArray(cloudData.weights) ? cloudData.weights.length : 0;
        setCloudStatusMsg(`Restored cloud state (${weightsCount} weigh-ins, ${cloudData.loggedFoods?.length || 0} meals)!`);
        setTimeout(() => setCloudStatusMsg(null), 4000);
      } else {
        setCloudStatusMsg('No cloud backup found for this account.');
      }
    } catch (err: any) {
      setCloudStatusMsg(`Cloud restore failed: ${err?.message || 'Error'}`);
    } finally {
      setIsSyncingCloud(false);
    }
  };

  // Notification & iPhone Web App states
  const [reminderConfig, setReminderConfig] = useState<ReminderConfig>(() => loadReminderConfig());
  const [notificationPermission, setNotificationPermission] = useState(getNotificationPermission());
  const [testNotificationSent, setTestNotificationSent] = useState(false);
  const [notificationError, setNotificationError] = useState<string | null>(null);

  const handleRequestPermission = async () => {
    setNotificationError(null);
    try {
      const perm = await requestNotificationPermission();
      setNotificationPermission(perm);
      if (perm === 'granted') {
        const updated = { ...reminderConfig, enabled: true };
        setReminderConfig(updated);
        saveReminderConfig(updated);
      }
    } catch (err: any) {
      setNotificationError(err?.message || 'Could not request notification permission');
    }
  };

  const handleToggleReminderConfig = (field: keyof ReminderConfig, value: any) => {
    const updated = { ...reminderConfig, [field]: value };
    setReminderConfig(updated);
    saveReminderConfig(updated);
  };

  const handleSendTest = async () => {
    setTestNotificationSent(false);
    setNotificationError(null);
    const ok = await sendTestNotification(language === 'pt-BR');
    if (ok) {
      setTestNotificationSent(true);
      setTimeout(() => setTestNotificationSent(false), 3500);
    } else {
      setNotificationError(
        isIOS() && !isStandalone()
          ? 'Add Eunoia to your iPhone Home Screen first to enable notifications.'
          : 'Could not send notification. Please enable permissions first.'
      );
    }
  };

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    updateProfile({
      name,
      unitSystem,
      language,
      goal,
      targetRateKgPerWeek: targetRate,
      geminiApiKey: geminiApiKey.trim(),
      targets: {
        calories,
        proteinGrams: protein,
        carbsGrams: carbs,
        fatGrams: fat,
        waterMl,
      },
      macroCycling: {
        enabled: macroCyclingEnabled,
        trainingDaysOffsetCalories: trainingOffset,
        restDaysOffsetCalories: restOffset,
      },
    });
    setSaveSuccess(true);
    setTimeout(() => {
      setSaveSuccess(false);
      onClose();
    }, 600);
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

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
      <div className="bg-[var(--color-bg-elevated)] border border-[var(--color-border)] rounded-3xl max-w-sm w-full p-6 space-y-4 max-h-[92vh] overflow-y-auto shadow-2xl">
        <div className="flex justify-between items-center">
          <div>
            <h3 className="k-display text-lg text-[var(--color-text)]">Settings</h3>
            <span className="text-xs text-[var(--color-text-muted)]">Targets, backup & data</span>
          </div>
          <button
            onClick={onClose}
            aria-label="Close settings"
            className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl text-[var(--color-text-muted)] hover:text-[var(--color-text)] active:scale-95 transition-transform"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Athletic Profile Quick Card */}
        {onOpenProfile && (
          <div className="p-3.5 bg-[var(--color-surface-sunken)] border border-[var(--color-accent)]/40 rounded-2xl flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-[var(--color-accent)]/15 text-[var(--color-accent)] flex items-center justify-center shrink-0 font-bold">
                <User className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-[var(--color-text)]">Athletic Profile & Stats</h4>
                <p className="text-[10px] text-[var(--color-text-muted)]">
                  {profile.heightCm} cm • {profile.age || 26} yo • {profile.goal.replace('_', ' ')}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => {
                onClose();
                onOpenProfile();
              }}
              className="px-3 py-1.5 bg-[var(--color-accent)] text-[var(--color-on-accent)] font-semibold rounded-xl text-[11px] active:scale-95 transition-all shadow-sm shrink-0"
            >
              Open
            </button>
          </div>
        )}

        <form onSubmit={handleSaveProfile} className="space-y-4">
          {/* User Name */}
          <div>
            <label className="text-xs font-semibold text-[var(--color-text-muted)] block mb-1">Display Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="min-h-[44px] w-full bg-[var(--color-surface-sunken)] border border-[var(--color-border)] rounded-xl px-3 py-2 text-xs text-[var(--color-text)] focus:outline-none focus:border-[var(--color-accent)]"
            />
          </div>

          {/* Unit System */}
          <div>
            <label className="text-xs font-semibold text-[var(--color-text-muted)] block mb-1">
              {language === 'pt-BR' ? 'Sistema de Unidades' : 'Unit System'}
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setUnitSystem('metric')}
                className={`min-h-[40px] py-2 rounded-xl text-xs font-semibold transition-all border ${
                  unitSystem === 'metric'
                    ? 'bg-[var(--color-accent)] border-[var(--color-accent)] text-[var(--color-on-accent)]'
                    : 'bg-[var(--color-surface-sunken)] border-[var(--color-border)] text-[var(--color-text-muted)]'
                }`}
              >
                Metric (kg / cm)
              </button>
              <button
                type="button"
                onClick={() => setUnitSystem('imperial')}
                className={`min-h-[40px] py-2 rounded-xl text-xs font-semibold transition-all border ${
                  unitSystem === 'imperial'
                    ? 'bg-[var(--color-accent)] border-[var(--color-accent)] text-[var(--color-on-accent)]'
                    : 'bg-[var(--color-surface-sunken)] border-[var(--color-border)] text-[var(--color-text-muted)]'
                }`}
              >
                Imperial (lb / in)
              </button>
            </div>
          </div>

          {/* System Language */}
          <div>
            <label className="text-xs font-semibold text-[var(--color-text-muted)] block mb-1">
              {language === 'pt-BR' ? 'Idioma do Sistema' : 'System Language'}
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setLanguage('pt-BR')}
                className={`min-h-[40px] py-2 rounded-xl text-xs font-semibold transition-all border ${
                  language === 'pt-BR'
                    ? 'bg-[var(--color-accent)] border-[var(--color-accent)] text-[var(--color-on-accent)]'
                    : 'bg-[var(--color-surface-sunken)] border-[var(--color-border)] text-[var(--color-text-muted)]'
                }`}
              >
                🇧🇷 Português (Brasil)
              </button>
              <button
                type="button"
                onClick={() => setLanguage('en')}
                className={`min-h-[40px] py-2 rounded-xl text-xs font-semibold transition-all border ${
                  language === 'en'
                    ? 'bg-[var(--color-accent)] border-[var(--color-accent)] text-[var(--color-on-accent)]'
                    : 'bg-[var(--color-surface-sunken)] border-[var(--color-border)] text-[var(--color-text-muted)]'
                }`}
              >
                🇺🇸 English
              </button>
            </div>
          </div>

          {/* Goal & Rate */}
          <div>
            <label className="text-xs font-semibold text-[var(--color-text-muted)] block mb-1">Primary Goal</label>
            <select
              value={goal}
              onChange={(e) => setGoal(e.target.value as FitnessGoal)}
              className="min-h-[44px] w-full bg-[var(--color-surface-sunken)] border border-[var(--color-border)] rounded-xl px-3 py-2 text-xs text-[var(--color-text)] focus:outline-none"
            >
              <option value="fat_loss">Fat Loss (Sustainable Deficit)</option>
              <option value="recomp">Body Recomposition</option>
              <option value="maintenance">Maintenance</option>
              <option value="muscle_gain">Lean Muscle Gain (Controlled Surplus)</option>
            </select>
          </div>

          {/* Calorie & Macro Targets */}
          <div className="bg-[var(--color-surface-sunken)] p-3.5 rounded-2xl border border-[var(--color-border)] space-y-3">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--color-accent)] block">
              Nutrition Targets
            </span>

            <div className="flex justify-between items-center text-xs">
              <span className="text-[var(--color-text-muted)]">Daily Calories:</span>
              <input
                type="number"
                step="25"
                value={calories}
                onChange={(e) => setCalories(parseInt(e.target.value) || 2000)}
                className="w-20 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-lg p-1 text-center font-bold text-[var(--color-text)] focus:outline-none"
              />
            </div>

            <div className="grid grid-cols-3 gap-2 text-center pt-1">
              <div>
                <label className="text-[10px] text-[var(--color-success)] font-semibold block">Protein (g)</label>
                <input
                  type="number"
                  value={protein}
                  onChange={(e) => setProtein(parseInt(e.target.value) || 150)}
                  className="w-full bg-[var(--color-surface)] border border-[var(--color-border)] rounded-lg p-1 text-center text-xs font-bold text-[var(--color-text)]"
                />
              </div>
              <div>
                <label className="text-[10px] text-[var(--color-warning)] font-semibold block">Carbs (g)</label>
                <input
                  type="number"
                  value={carbs}
                  onChange={(e) => setCarbs(parseInt(e.target.value) || 200)}
                  className="w-full bg-[var(--color-surface)] border border-[var(--color-border)] rounded-lg p-1 text-center text-xs font-bold text-[var(--color-text)]"
                />
              </div>
              <div>
                <label className="text-[10px] text-[var(--color-danger)] font-semibold block">Fat (g)</label>
                <input
                  type="number"
                  value={fat}
                  onChange={(e) => setFat(parseInt(e.target.value) || 60)}
                  className="w-full bg-[var(--color-surface)] border border-[var(--color-border)] rounded-lg p-1 text-center text-xs font-bold text-[var(--color-text)]"
                />
              </div>
            </div>

            <div className="flex justify-between items-center text-xs pt-1">
              <span className="text-[var(--color-text-muted)]">Water Goal (ml):</span>
              <input
                type="number"
                step="250"
                value={waterMl}
                onChange={(e) => setWaterMl(parseInt(e.target.value) || 3000)}
                className="w-20 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-lg p-1 text-center font-bold text-[var(--color-text)] focus:outline-none"
              />
            </div>
          </div>

          {/* Calorie & Macro Cycling */}
          <div className="bg-[var(--color-surface-sunken)] p-3.5 rounded-2xl border border-[var(--color-border)] space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--color-accent)] block">
                  {language === 'pt-BR' ? 'Ciclagem de Calorias & Macros' : 'Calorie & Macro Cycling'}
                </span>
                <span className="text-[11px] text-[var(--color-text-muted)]">
                  {language === 'pt-BR' ? 'Ajusta calorias em dias de treino vs descanso' : 'Dynamic fuel for training vs rest days'}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setMacroCyclingEnabled(!macroCyclingEnabled)}
                className={`w-11 h-6 flex items-center rounded-full p-1 transition-colors ${
                  macroCyclingEnabled ? 'bg-[var(--color-accent)]' : 'bg-[var(--color-border)]'
                }`}
              >
                <div
                  className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform ${
                    macroCyclingEnabled ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

            {macroCyclingEnabled && (
              <div className="grid grid-cols-2 gap-3 pt-1 border-t border-[var(--color-border)]">
                <div>
                  <label className="text-[10px] text-[var(--color-text-muted)] font-medium block">
                    {language === 'pt-BR' ? 'Dias de Treino' : 'Training Days'}
                  </label>
                  <div className="flex items-center gap-1 mt-1">
                    <span className="text-xs text-[var(--color-success)] font-bold">+</span>
                    <input
                      type="number"
                      step="50"
                      min="0"
                      max="1000"
                      value={trainingOffset}
                      onChange={(e) => setTrainingOffset(Math.abs(parseInt(e.target.value) || 0))}
                      className="w-full bg-[var(--color-surface)] border border-[var(--color-border)] rounded-lg p-1.5 text-center text-xs font-bold text-[var(--color-text)] focus:outline-none"
                    />
                    <span className="text-[10px] text-[var(--color-text-muted)]">kcal</span>
                  </div>
                </div>

                <div>
                  <label className="text-[10px] text-[var(--color-text-muted)] font-medium block">
                    {language === 'pt-BR' ? 'Dias de Descanso' : 'Rest Days'}
                  </label>
                  <div className="flex items-center gap-1 mt-1">
                    <span className="text-xs text-[var(--color-danger)] font-bold">-</span>
                    <input
                      type="number"
                      step="50"
                      min="0"
                      max="1000"
                      value={Math.abs(restOffset)}
                      onChange={(e) => setRestOffset(-Math.abs(parseInt(e.target.value) || 0))}
                      className="w-full bg-[var(--color-surface)] border border-[var(--color-border)] rounded-lg p-1.5 text-center text-xs font-bold text-[var(--color-text)] focus:outline-none"
                    />
                    <span className="text-[10px] text-[var(--color-text-muted)]">kcal</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* AI Intelligence (Free Tier / Offline) */}
          <div className="pt-2 border-t border-[var(--color-border)] space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-[var(--color-text-muted)] flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-[var(--color-accent)]" />
                <span>Google AI Studio API Key (Free)</span>
              </label>
              <span className="text-[10px] text-[var(--color-accent)] font-semibold bg-[var(--color-accent)]/10 px-2 py-0.5 rounded-full border border-[var(--color-accent)]/30">
                $0 / Zero Cost
              </span>
            </div>
            <input
              type="password"
              placeholder="AIzaSy... (leave empty to use free offline engine)"
              value={geminiApiKey}
              onChange={(e) => setGeminiApiKey(e.target.value)}
              className="w-full bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl p-2.5 text-xs text-[var(--color-text)] focus:outline-none focus:border-[var(--color-accent)] font-mono"
            />
            <p className="text-[10px] text-[var(--color-text-subtle)] leading-relaxed">
              Kinetic uses Google’s Free Tier Gemini models. You can get an API key at{' '}
              <a
                href="https://aistudio.google.com/app/apikey"
                target="_blank"
                rel="noreferrer"
                className="text-[var(--color-accent)] underline hover:text-[var(--color-accent-hover)]"
              >
                aistudio.google.com
              </a>{' '}
              with zero cost. If blank, Kinetic automatically uses the built-in free offline engine.
            </p>
          </div>

          <button
            type="submit"
            className="min-h-[48px] w-full py-2.5 bg-[var(--color-accent)] hover:bg-[var(--color-accent-hover)] text-[var(--color-on-accent)] font-semibold rounded-xl text-xs flex items-center justify-center gap-1.5 active:scale-95 transition-all shadow-sm"
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
        <div className="pt-3 border-t border-[var(--color-border)] space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-xs font-bold text-[var(--color-text-muted)]">
              <Shield className="w-4 h-4 text-[var(--color-accent)]" />
              <span>Data Ownership & Exports</span>
            </div>
            <span className="text-[10px] text-[var(--color-accent)] font-semibold bg-[var(--color-accent-soft)] px-2.5 py-0.5 rounded-full border border-[var(--color-accent)]/30">
              Zero Lock-in
            </span>
          </div>

          <p className="text-[11px] text-[var(--color-text-muted)] leading-relaxed">
            All records persist privately in your browser storage. You can export full JSON backups or
            per-topic CSV files at any time — no account required.
          </p>

          <div className="grid grid-cols-2 gap-2 pt-1">
            <label className="min-h-[44px] py-2 bg-[var(--color-surface-raised)] hover:bg-[var(--color-surface-raised)] text-[var(--color-text)] text-xs font-semibold rounded-xl flex items-center justify-center gap-1.5 active:scale-95 transition-all cursor-pointer">
              <FileDown className="w-3.5 h-3.5 text-[var(--color-accent)] rotate-180" />
              <span>Import Backup (JSON)</span>
              <input type="file" accept="application/json,.json" className="hidden" onChange={handleImportFile} />
            </label>
            <button
              onClick={exportAllJson}
              className="min-h-[44px] py-2 bg-[var(--color-surface-raised)] hover:bg-[var(--color-surface-raised)] text-[var(--color-text)] text-xs font-semibold rounded-xl flex items-center justify-center gap-1.5 active:scale-95 transition-all"
            >
              <FileDown className="w-3.5 h-3.5 text-[var(--color-accent)]" />
              <span>Full Backup (JSON)</span>
            </button>
          </div>

          {importStatus && (
            <div className="text-[11px] text-[var(--color-text-muted)]">{importStatus}</div>
          )}

          <div className="grid grid-cols-3 gap-2">
            <button
              onClick={() => exportCsv('weights')}
              className="min-h-[44px] py-2 bg-[var(--color-surface-raised)] hover:bg-[var(--color-surface-raised)] text-[var(--color-text)] text-[11px] font-semibold rounded-xl flex items-center justify-center gap-1 active:scale-95 transition-all"
            >
              <FileDown className="w-3 h-3 text-[var(--color-accent)]" />
              <span>Weights</span>
            </button>
            <button
              onClick={() => exportCsv('foods')}
              className="min-h-[44px] py-2 bg-[var(--color-surface-raised)] hover:bg-[var(--color-surface-raised)] text-[var(--color-text)] text-[11px] font-semibold rounded-xl flex items-center justify-center gap-1 active:scale-95 transition-all"
            >
              <FileDown className="w-3 h-3 text-[var(--color-accent)]" />
              <span>Nutrition</span>
            </button>
            <button
              onClick={() => exportCsv('workouts')}
              className="min-h-[44px] py-2 bg-[var(--color-surface-raised)] hover:bg-[var(--color-surface-raised)] text-[var(--color-text)] text-[11px] font-semibold rounded-xl flex items-center justify-center gap-1 active:scale-95 transition-all"
            >
              <FileDown className="w-3 h-3 text-[var(--color-accent)]" />
              <span>Workouts</span>
            </button>
          </div>
        </div>

        {/* ======================================================== */}
        {/* CLOUD SYNC & MULTI-DEVICE PERSISTENCE */}
        {/* ======================================================== */}
        <div className="pt-3 border-t border-[var(--color-border)] space-y-2.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-xs font-bold text-[var(--color-text)]">
              <Cloud className="w-4 h-4 text-[var(--color-accent)]" />
              <span>Multi-Device Sync (Laptop ↔ Phone)</span>
            </div>
            <span
              className={`text-[10px] font-semibold px-2.5 py-0.5 rounded-full border ${
                currentUser
                  ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/30'
                  : 'bg-[var(--color-surface-raised)] text-[var(--color-text-muted)] border-[var(--color-border)]'
              }`}
            >
              {currentUser ? 'Cloud Connected' : 'Local Only'}
            </span>
          </div>

          <p className="text-[11px] text-[var(--color-text-muted)] leading-relaxed">
            {currentUser
              ? `Signed in as ${currentUser.email}. Changes sync automatically, or use the buttons below to force an immediate transfer.`
              : 'Sign in to automatically sync your life data between laptop and iPhone without cables or AirDrop.'}
          </p>

          {currentUser ? (
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={handleManualCloudBackup}
                disabled={isSyncingCloud}
                className="min-h-[44px] py-2 bg-[var(--color-surface-raised)] hover:bg-[var(--color-surface-sunken)] text-[var(--color-text)] text-xs font-semibold rounded-xl flex items-center justify-center gap-1.5 active:scale-95 transition-all disabled:opacity-50"
              >
                <CloudUpload className="w-3.5 h-3.5 text-[var(--color-accent)]" />
                <span>{isSyncingCloud ? 'Syncing...' : 'Backup to Cloud'}</span>
              </button>
              <button
                type="button"
                onClick={handleManualCloudRestore}
                disabled={isSyncingCloud}
                className="min-h-[44px] py-2 bg-[var(--color-surface-raised)] hover:bg-[var(--color-surface-sunken)] text-[var(--color-text)] text-xs font-semibold rounded-xl flex items-center justify-center gap-1.5 active:scale-95 transition-all disabled:opacity-50"
              >
                <CloudDownload className="w-3.5 h-3.5 text-[var(--color-accent)]" />
                <span>Restore from Cloud</span>
              </button>
            </div>
          ) : (
            <div className="p-3 bg-[var(--color-surface-sunken)] border border-[var(--color-border)] rounded-xl flex items-center justify-between">
              <div className="text-[11px] text-[var(--color-text-muted)]">
                <span>Have an account?</span>
              </div>
              <button
                type="button"
                onClick={() => {
                  onClose();
                  if (onOpenProfile) onOpenProfile();
                }}
                className="text-xs font-bold text-[var(--color-accent)] hover:underline"
              >
                Sign In / Sign Up →
              </button>
            </div>
          )}

          {cloudStatusMsg && (
            <div className="p-2.5 rounded-xl bg-[var(--color-surface-raised)] border border-[var(--color-border)] text-xs text-[var(--color-accent)] font-medium text-center">
              {cloudStatusMsg}
            </div>
          )}
        </div>

        {/* ======================================================== */}
        {/* HEALTH & WEARABLE INTEGRATION (APPLE HEALTH & GARMIN)   */}
        {/* ======================================================== */}
        <div className="pt-4 border-t border-[var(--color-border)] space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-xs font-bold text-[var(--color-text)]">
              <Watch className="w-4 h-4 text-[var(--color-accent)]" />
              <span>Apple Health & Garmin Sync</span>
            </div>
            <span className="text-[10px] text-[var(--color-accent)] font-semibold bg-[var(--color-accent-soft)] px-2.5 py-0.5 rounded-full border border-[var(--color-accent)]/30">
              Active
            </span>
          </div>

          <p className="text-[11px] text-[var(--color-text-muted)] leading-relaxed">
            Directly ingest workouts, cardio, and weigh-ins from Apple Health (XML/Shortcuts) and Garmin Connect (.TCX/.GPX/.CSV).
          </p>

          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => onOpenHealthSync?.()}
              className="min-h-[44px] py-2.5 px-3 bg-[var(--color-surface-raised)] hover:border-[var(--color-accent)]/60 border border-[var(--color-border)] text-[var(--color-text)] rounded-2xl flex items-center gap-2 text-xs font-semibold text-left transition-all active:scale-95"
            >
              <div className="w-7 h-7 rounded-xl bg-[var(--color-accent)]/15 text-[var(--color-accent)] flex items-center justify-center shrink-0">
                <Watch className="w-4 h-4" />
              </div>
              <div>
                <p className="font-bold text-xs">Sync Devices</p>
                <p className="text-[10px] text-[var(--color-text-subtle)]">Apple & Garmin</p>
              </div>
            </button>

            <button
              type="button"
              onClick={() => onOpenInstallPwa?.()}
              className="min-h-[44px] py-2.5 px-3 bg-[var(--color-surface-raised)] hover:border-[var(--color-accent)]/60 border border-[var(--color-border)] text-[var(--color-text)] rounded-2xl flex items-center gap-2 text-xs font-semibold text-left transition-all active:scale-95"
            >
              <div className="w-7 h-7 rounded-xl bg-[var(--color-info)]/15 text-[var(--color-info)] flex items-center justify-center shrink-0">
                <Smartphone className="w-4 h-4" />
              </div>
              <div>
                <p className="font-bold text-xs">Install PWA</p>
                <p className="text-[10px] text-[var(--color-text-subtle)]">iPhone Home Screen</p>
              </div>
            </button>
          </div>
        </div>

        {/* ======================================================== */}
        {/* NOTIFICATIONS & IPHONE WEB APP REMINDERS                 */}
        {/* ======================================================== */}
        <div className="pt-4 border-t border-[var(--color-border)] space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-xs font-bold text-[var(--color-text)]">
              <Bell className="w-4 h-4 text-[var(--color-accent)]" />
              <span>{language === 'pt-BR' ? 'Notificações (iPhone & Web)' : 'Notifications (iPhone & Web)'}</span>
            </div>
            <span className={`text-[10px] font-semibold px-2.5 py-0.5 rounded-full border ${
              notificationPermission === 'granted'
                ? 'bg-[var(--color-success-soft)] text-[var(--color-success)] border-[var(--color-success)]/30'
                : 'bg-[var(--color-surface-raised)] text-[var(--color-text-muted)] border-[var(--color-border)]'
            }`}>
              {notificationPermission === 'granted' 
                ? (language === 'pt-BR' ? 'Ativo' : 'Active') 
                : (language === 'pt-BR' ? 'Desativado' : 'Not Enabled')}
            </span>
          </div>

          <p className="text-[11px] text-[var(--color-text-muted)] leading-relaxed">
            {language === 'pt-BR'
              ? 'Receba lembretes serenos para sua intenção matinal, equilíbrio do meio-dia e reflexão noturna.'
              : 'Receive calm, intentional nudges for morning deliberation, midday balance, and evening reflection.'}
          </p>

          {/* iOS Safari Home Screen Requirement Guide */}
          {isIOS() && !isStandalone() && (
            <div className="p-3.5 bg-[var(--color-surface-raised)] border border-[var(--color-border)] rounded-2xl space-y-2 text-xs">
              <div className="flex items-center gap-2 font-semibold text-[var(--color-accent)]">
                <Smartphone className="w-4 h-4" />
                <span>{language === 'pt-BR' ? 'Necessário adicionar à Tela de Início do iPhone' : 'iPhone Home Screen Setup Required'}</span>
              </div>
              <p className="text-[11px] text-[var(--color-text-muted)] leading-relaxed">
                {language === 'pt-BR'
                  ? 'No iOS (Safari), as notificações web são ativadas quando o aplicativo é adicionado à tela de início:'
                  : 'On iOS 16.4+, Apple requires Web Apps to be installed on your Home Screen to deliver notifications:'}
              </p>
              <ol className="text-[11px] text-[var(--color-text)] space-y-1 list-decimal list-inside font-medium pl-1">
                <li>{language === 'pt-BR' ? 'Toque no ícone Compartilhar (no rodapé do Safari)' : 'Tap the Share button at the bottom of Safari'}</li>
                <li>{language === 'pt-BR' ? 'Role e toque em "Adicionar à Tela de Início"' : 'Scroll down and tap "Add to Home Screen"'}</li>
                <li>{language === 'pt-BR' ? 'Abra o Eunoia pelo ícone na tela de início para ativar' : 'Open Eunoia from your Home Screen icon to enable alerts'}</li>
              </ol>
            </div>
          )}

          {notificationPermission !== 'granted' ? (
            <button
              type="button"
              onClick={handleRequestPermission}
              className="min-h-[44px] w-full py-2.5 px-3 bg-[var(--color-accent)] hover:bg-[var(--color-accent-hover)] text-[var(--color-on-accent)] rounded-xl text-xs font-semibold flex items-center justify-center gap-2 active:scale-95 transition-all shadow-xs"
            >
              <BellRing className="w-4 h-4" />
              <span>{language === 'pt-BR' ? 'Ativar Notificações no iPhone / Web' : 'Enable Notifications on iPhone / Web'}</span>
            </button>
          ) : (
            <div className="space-y-2.5 pt-1">
              {/* Daily Reminder Toggles */}
              <div className="bg-[var(--color-surface-sunken)] p-3 rounded-2xl border border-[var(--color-border)] space-y-2.5">
                {/* Morning */}
                <div className="flex items-center justify-between text-xs">
                  <label className="flex items-center gap-2 cursor-pointer font-medium text-[var(--color-text)]">
                    <input
                      type="checkbox"
                      checked={reminderConfig.morningEnabled}
                      onChange={(e) => handleToggleReminderConfig('morningEnabled', e.target.checked)}
                      className="rounded accent-[var(--color-accent)] w-4 h-4"
                    />
                    <span>{language === 'pt-BR' ? 'Intenção Matinal' : 'Morning Intention'}</span>
                  </label>
                  <input
                    type="time"
                    value={reminderConfig.morningTime}
                    onChange={(e) => handleToggleReminderConfig('morningTime', e.target.value)}
                    className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-lg px-2 py-1 text-xs text-[var(--color-text)] font-mono"
                  />
                </div>

                {/* Midday */}
                <div className="flex items-center justify-between text-xs">
                  <label className="flex items-center gap-2 cursor-pointer font-medium text-[var(--color-text)]">
                    <input
                      type="checkbox"
                      checked={reminderConfig.middayEnabled}
                      onChange={(e) => handleToggleReminderConfig('middayEnabled', e.target.checked)}
                      className="rounded accent-[var(--color-accent)] w-4 h-4"
                    />
                    <span>{language === 'pt-BR' ? 'Pausa & Hidratação' : 'Midday Pause'}</span>
                  </label>
                  <input
                    type="time"
                    value={reminderConfig.middayTime}
                    onChange={(e) => handleToggleReminderConfig('middayTime', e.target.value)}
                    className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-lg px-2 py-1 text-xs text-[var(--color-text)] font-mono"
                  />
                </div>

                {/* Evening */}
                <div className="flex items-center justify-between text-xs">
                  <label className="flex items-center gap-2 cursor-pointer font-medium text-[var(--color-text)]">
                    <input
                      type="checkbox"
                      checked={reminderConfig.eveningEnabled}
                      onChange={(e) => handleToggleReminderConfig('eveningEnabled', e.target.checked)}
                      className="rounded accent-[var(--color-accent)] w-4 h-4"
                    />
                    <span>{language === 'pt-BR' ? 'Reflexão Noturna' : 'Evening Reflection'}</span>
                  </label>
                  <input
                    type="time"
                    value={reminderConfig.eveningTime}
                    onChange={(e) => handleToggleReminderConfig('eveningTime', e.target.value)}
                    className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-lg px-2 py-1 text-xs text-[var(--color-text)] font-mono"
                  />
                </div>
              </div>

              {/* Send Test Notification Button */}
              <button
                type="button"
                onClick={handleSendTest}
                className="min-h-[40px] w-full py-2 px-3 bg-[var(--color-surface-raised)] hover:border-[var(--color-accent)]/50 border border-[var(--color-border)] text-[var(--color-text)] font-semibold rounded-xl text-xs flex items-center justify-center gap-2 active:scale-95 transition-all"
              >
                <Send className="w-3.5 h-3.5 text-[var(--color-accent)]" />
                <span>{language === 'pt-BR' ? 'Enviar Notificação de Teste' : 'Send Test Notification to iPhone'}</span>
              </button>
            </div>
          )}

          {testNotificationSent && (
            <div className="p-2.5 rounded-xl bg-[var(--color-success-soft)] border border-[var(--color-success)]/30 text-[var(--color-success)] text-xs font-semibold flex items-center gap-1.5">
              <Check className="w-3.5 h-3.5" />
              <span>{language === 'pt-BR' ? 'Notificação enviada com sucesso!' : 'Test notification sent! Check your screen/banner.'}</span>
            </div>
          )}

          {notificationError && (
            <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-500 text-xs font-semibold flex items-center gap-1.5">
              <AlertCircle className="w-3.5 h-3.5 shrink-0" />
              <span>{notificationError}</span>
            </div>
          )}
        </div>

        {/* Continuous Improvement & Recommendations */}
        <div className="bg-[var(--color-surface-sunken)] p-4 rounded-2xl border border-[var(--color-border)] space-y-2">
          <div className="flex items-center gap-1.5 text-xs font-bold text-[var(--color-text)]">
            <MessageSquarePlus className="w-4 h-4 text-[var(--color-accent)]" />
            <span>Recommendations & Friction Feedback</span>
          </div>
          <p className="text-[11px] text-[var(--color-text-muted)] leading-relaxed">
            Have an idea, recommendation, or encountered friction? Submit directly to the autonomous development team.
          </p>
          {onOpenFeedback && (
            <button
              type="button"
              onClick={() => {
                onClose();
                onOpenFeedback();
              }}
              className="w-full min-h-[38px] py-2 px-3 bg-[var(--color-accent)] text-[var(--color-on-accent)] font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 active:scale-95 transition-all shadow-xs"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Submit Recommendation or Bug</span>
            </button>
          )}
        </div>

        {/* History & Demo Controls */}
        <div className="pt-3 border-t border-[var(--color-border)] space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-[var(--color-text-muted)] flex items-center gap-1.5">
              <Database className="w-3.5 h-3.5 text-[var(--color-accent)]" />
              <span>History & Sample Data</span>
            </span>
          </div>

          {actionSuccess && (
            <div className="p-2.5 rounded-xl bg-[var(--color-success-soft)] border border-[var(--color-success)]/30 text-[var(--color-success)] text-xs font-semibold flex items-center gap-1.5">
              <Check className="w-3.5 h-3.5" />
              <span>{actionSuccess}</span>
            </div>
          )}

          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => {
                loadDemoData();
                setActionSuccess('Sample demo history loaded!');
                setTimeout(() => setActionSuccess(null), 3000);
              }}
              className="min-h-[40px] py-2 px-3 bg-[var(--color-surface-raised)] hover:bg-[var(--color-surface-raised)]/80 text-[var(--color-text)] font-semibold rounded-xl text-xs flex items-center justify-center gap-1.5 active:scale-95 transition-all border border-[var(--color-border)]"
            >
              <Play className="w-3 h-3 text-[var(--color-accent)] fill-current" />
              <span>Load Sample Data</span>
            </button>

            <button
              type="button"
              onClick={() => setShowClearConfirm(true)}
              className="min-h-[40px] py-2 px-3 bg-[var(--color-surface-raised)] hover:bg-[var(--color-danger-soft)] text-[var(--color-text-muted)] hover:text-[var(--color-danger)] font-semibold rounded-xl text-xs flex items-center justify-center gap-1.5 active:scale-95 transition-all border border-[var(--color-border)]"
            >
              <Trash2 className="w-3 h-3" />
              <span>Clear History</span>
            </button>
          </div>

          <button
            onClick={() => setShowResetConfirm(true)}
            className="min-h-[40px] w-full py-2 bg-[var(--color-danger-soft)] hover:bg-[var(--color-danger-soft)] border border-[var(--color-danger)]/40 text-[var(--color-danger)] font-semibold rounded-xl text-xs flex items-center justify-center gap-1.5 transition-all active:scale-[0.99] mt-1"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset Factory Defaults</span>
          </button>
        </div>
      </div>

      {/* Clear History Confirmation Dialog */}
      {showClearConfirm && (
        <div className="fixed inset-0 z-60 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[var(--color-bg-elevated)] border border-[var(--color-border)] rounded-3xl max-w-xs w-full p-5 space-y-4 shadow-2xl">
            <h4 className="k-display text-base text-[var(--color-text)]">Clear History Logs?</h4>
            <p className="text-xs text-[var(--color-text-muted)] leading-relaxed">
              This will erase all recorded weigh-ins, meals, and workouts so you can start completely fresh. Your food library and target settings will be kept.
            </p>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => setShowClearConfirm(false)}
                className="min-h-[44px] py-2 bg-[var(--color-surface-raised)] rounded-xl text-xs font-semibold text-[var(--color-text-muted)] border border-[var(--color-border)]"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  clearAllHistory();
                  setShowClearConfirm(false);
                  onClose();
                }}
                className="min-h-[44px] py-2 bg-[var(--color-danger)] hover:bg-[var(--color-danger)] text-white font-semibold rounded-xl text-xs active:scale-95 transition-transform"
              >
                Clear logs
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reset Confirmation Dialog */}
      {showResetConfirm && (
        <div className="fixed inset-0 z-60 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[var(--color-bg-elevated)] border border-[var(--color-border)] rounded-3xl max-w-xs w-full p-5 space-y-4 shadow-2xl">
            <h4 className="k-display text-base text-[var(--color-text)]">Reset to factory clean?</h4>
            <p className="text-xs text-[var(--color-text-muted)] leading-relaxed">
              This completely resets Kinetic to a blank slate, erasing all data and custom targets.
            </p>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => setShowResetConfirm(false)}
                className="min-h-[44px] py-2 bg-[var(--color-surface-raised)] rounded-xl text-xs font-semibold text-[var(--color-text-muted)] border border-[var(--color-border)]"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  resetAllData();
                  setShowResetConfirm(false);
                  onClose();
                }}
                className="min-h-[44px] py-2 bg-[var(--color-danger)] hover:bg-[var(--color-danger)] text-white font-semibold rounded-xl text-xs active:scale-95 transition-transform"
              >
                Reset all
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
