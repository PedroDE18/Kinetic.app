import React, { useState } from 'react';
import {
  X,
  FileDown,
  RotateCcw,
  Shield,
  Check,
  Watch,
  Smartphone,
} from 'lucide-react';
import { useFitness } from '../../context/FitnessContext';
import { FitnessGoal, UnitSystem } from '../../types';
import { useBodyScrollLock } from '../../utils/useBodyScrollLock';

interface SettingsModalProps {
  onClose: () => void;
  onOpenHealthSync?: () => void;
  onOpenInstallPwa?: () => void;
}

export function SettingsModal({ onClose, onOpenHealthSync, onOpenInstallPwa }: SettingsModalProps) {
  useBodyScrollLock(true);
  const { state, updateProfile, resetAllData, exportAllJson, exportCsv, importAllJson } = useFitness();
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
      <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-3xl max-w-sm w-full p-6 space-y-4 max-h-[92vh] overflow-y-auto shadow-2xl">
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
            <label className="text-xs font-semibold text-[var(--color-text-muted)] block mb-1">Unit System</label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setUnitSystem('metric')}
                className={`min-h-[40px] py-2 rounded-xl text-xs font-semibold transition-all border ${
                  unitSystem === 'metric'
                    ? 'bg-[var(--color-accent)] border-[var(--color-accent)] text-[var(--color-accent)]'
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
                    ? 'bg-[var(--color-accent)] border-[var(--color-accent)] text-[var(--color-accent)]'
                    : 'bg-[var(--color-surface-sunken)] border-[var(--color-border)] text-[var(--color-text-muted)]'
                }`}
              >
                Imperial (lb / in)
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

          <button
            type="submit"
            className="min-h-[48px] w-full py-2.5 bg-[var(--color-accent)] hover:bg-[var(--color-accent-hover)] text-white font-semibold rounded-xl text-xs flex items-center justify-center gap-1.5 active:scale-95 transition-all shadow-sm"
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
            <span className="text-[10px] text-[var(--color-accent)] font-semibold bg-[var(--color-accent)] px-2 py-0.5 rounded-full border border-[var(--color-accent)]">
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
        {/* HEALTH & WEARABLE INTEGRATION (APPLE HEALTH & GARMIN)   */}
        {/* ======================================================== */}
        <div className="pt-4 border-t border-[var(--color-border)] space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-xs font-bold text-[var(--color-text)]">
              <Watch className="w-4 h-4 text-[var(--color-accent)]" />
              <span>Apple Health & Garmin Sync</span>
            </div>
            <span className="text-[10px] text-[var(--color-accent)] font-semibold bg-[var(--color-accent)] px-2 py-0.5 rounded-full border border-[var(--color-accent)]">
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

        {/* Reset State Action */}
        <div className="pt-2 border-t border-[var(--color-border)]">
          <button
            onClick={() => setShowResetConfirm(true)}
            className="min-h-[48px] w-full py-2.5 bg-[var(--color-danger-soft)] hover:bg-[var(--color-danger-soft)] border border-[var(--color-danger)]/40 text-[var(--color-danger)] font-semibold rounded-xl text-xs flex items-center justify-center gap-1.5 transition-all active:scale-[0.99]"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset demo data</span>
          </button>
        </div>
      </div>

      {/* Reset Confirmation Dialog */}
      {showResetConfirm && (
        <div className="fixed inset-0 z-60 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-3xl max-w-xs w-full p-5 space-y-4 shadow-2xl">
            <h4 className="k-display text-base text-[var(--color-text)]">Reset demo data?</h4>
            <p className="text-xs text-[var(--color-text-muted)] leading-relaxed">
              Your logged weigh-ins, workouts, meals, and hydration entries will be replaced with the initial
              sample data. This action cannot be undone.
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
