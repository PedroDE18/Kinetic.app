import React, { useState, useRef } from 'react';
import { 
  X, 
  Watch, 
  Activity, 
  Upload, 
  CheckCircle2, 
  Smartphone, 
  FileText, 
  Download, 
  ArrowRight,
  ClipboardPaste,
  Sparkles,
  HelpCircle,
  Flame,
  Scale
} from 'lucide-react';
import { useFitness } from '../../context/FitnessContext';
import { parseHealthFile, getSampleWearableActivities, HealthImportResult, parseJsonPayload } from '../../services/healthSync';

interface HealthSyncModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function HealthSyncModal({ isOpen, onClose }: HealthSyncModalProps) {
  const { importHealthBatch } = useFitness();
  const [activeTab, setActiveTab] = useState<'upload' | 'shortcut' | 'simulate'>('upload');
  const [isLoading, setIsLoading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [importPreview, setImportPreview] = useState<HealthImportResult | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [clipboardText, setClipboardText] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleFileUpload = async (file: File) => {
    setIsLoading(true);
    setErrorMsg(null);
    setSuccessMessage(null);
    try {
      const result = await parseHealthFile(file);
      if (result.cardio.length === 0 && result.workouts.length === 0 && result.weights.length === 0) {
        setErrorMsg(`No workouts or weights found in ${file.name}. Ensure it is an Apple Health export or Garmin TCX/GPX/CSV.`);
      } else {
        setImportPreview(result);
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to parse file. Supported formats: TCX, GPX, XML, CSV, JSON.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleApplyImport = () => {
    if (!importPreview) return;
    const { addedCardio, addedWorkouts, addedWeights } = importHealthBatch(importPreview);
    setSuccessMessage(`Successfully ingested ${addedCardio} cardio activities, ${addedWorkouts} workouts, and ${addedWeights} weight records from ${importPreview.sourceName}!`);
    setImportPreview(null);
  };

  const handleSimulate = (type: 'apple_watch' | 'garmin_forerunner') => {
    const sample = getSampleWearableActivities(type);
    const { addedCardio, addedWorkouts, addedWeights } = importHealthBatch(sample);
    setSuccessMessage(`Simulated live sync from ${sample.sourceName}: Ingested ${addedCardio} cardio, ${addedWorkouts} workouts, and ${addedWeights} weigh-ins.`);
  };

  const handlePasteClipboard = () => {
    if (!clipboardText.trim()) return;
    try {
      let parsed = JSON.parse(clipboardText.trim());
      const result = Array.isArray(parsed) ? parseJsonPayload(parsed) : {
        cardio: parsed.cardio || [],
        workouts: parsed.workouts || [],
        weights: parsed.weights || [],
        sourceName: 'Clipboard Data',
        summary: 'Imported from clipboard JSON',
      };
      setImportPreview(result);
      setClipboardText('');
    } catch {
      setErrorMsg('Clipboard content is not valid JSON. Please paste the JSON produced by the Apple Health Shortcut.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div 
        className="w-full max-w-md max-h-[92vh] flex flex-col rounded-3xl bg-[var(--color-bg)] text-[var(--color-text)] border border-[var(--color-border)] shadow-2xl overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--color-border)] bg-[var(--color-surface)] ">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-[var(--color-accent)]/15 text-[var(--color-accent)] flex items-center justify-center">
              <Watch className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-semibold tracking-tight text-[var(--color-text)]">
                Health & Garmin Sync
              </h2>
              <p className="text-xs text-[var(--color-text-subtle)]">
                Native Apple Health, Garmin & wearable imports
              </p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center bg-[var(--color-surface-raised)] text-[var(--color-text-muted)] hover:bg-[var(--color-surface-raised)] transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex px-4 pt-3 gap-2 border-b border-[var(--color-border)] bg-[var(--color-surface)]">
          <button
            onClick={() => { setActiveTab('upload'); setImportPreview(null); }}
            className={`flex-1 pb-2.5 text-xs font-medium border-b-2 transition-all flex items-center justify-center gap-1.5 ${
              activeTab === 'upload'
                ? 'border-[var(--color-accent)] text-[var(--color-accent)] font-semibold'
                : 'border-transparent text-[var(--color-text-subtle)]'
            }`}
          >
            <Upload className="w-3.5 h-3.5" />
            File Import
          </button>
          <button
            onClick={() => { setActiveTab('shortcut'); setImportPreview(null); }}
            className={`flex-1 pb-2.5 text-xs font-medium border-b-2 transition-all flex items-center justify-center gap-1.5 ${
              activeTab === 'shortcut'
                ? 'border-[var(--color-accent)] text-[var(--color-accent)] font-semibold'
                : 'border-transparent text-[var(--color-text-subtle)]'
            }`}
          >
            <Smartphone className="w-3.5 h-3.5" />
            iOS Shortcut
          </button>
          <button
            onClick={() => { setActiveTab('simulate'); setImportPreview(null); }}
            className={`flex-1 pb-2.5 text-xs font-medium border-b-2 transition-all flex items-center justify-center gap-1.5 ${
              activeTab === 'simulate'
                ? 'border-[var(--color-accent)] text-[var(--color-accent)] font-semibold'
                : 'border-transparent text-[var(--color-text-subtle)]'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            Live Demo
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 no-scrollbar">
          {/* Success Banner */}
          {successMessage && (
            <div className="p-3.5 rounded-2xl bg-[var(--color-success-soft)] border border-[var(--color-success)]/30 text-[var(--color-success)] flex items-start gap-2.5 text-xs animate-fade-in">
              <CheckCircle2 className="w-4 h-4 text-[var(--color-success)] mt-0.5 shrink-0" />
              <div>
                <p className="font-semibold">Sync Successful</p>
                <p className="mt-0.5 leading-relaxed">{successMessage}</p>
              </div>
            </div>
          )}

          {/* Error Banner */}
          {errorMsg && (
            <div className="p-3 rounded-2xl bg-[var(--color-danger-soft)] border border-[var(--color-danger)]/30 text-[var(--color-danger)] text-xs">
              {errorMsg}
            </div>
          )}

          {/* TAB 1: File Upload */}
          {activeTab === 'upload' && (
            <div className="space-y-3">
              <div
                onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                onDragLeave={() => setDragOver(false)}
                onDrop={(e) => {
                  e.preventDefault();
                  setDragOver(false);
                  if (e.dataTransfer.files?.[0]) {
                    handleFileUpload(e.dataTransfer.files[0]);
                  }
                }}
                onClick={() => fileInputRef.current?.click()}
                className={`p-6 border-2 border-dashed rounded-3xl text-center cursor-pointer transition-all ${
                  dragOver
                    ? 'border-[var(--color-accent)] bg-[var(--color-accent-soft)]'
                    : 'border-[var(--color-border)] bg-[var(--color-surface)] hover:border-[var(--color-accent)]/60'
                }`}
              >
                <input
                  type="file"
                  ref={fileInputRef}
                  className="hidden"
                  accept=".xml,.tcx,.gpx,.csv,.json"
                  onChange={(e) => {
                    if (e.target.files?.[0]) {
                      handleFileUpload(e.target.files[0]);
                    }
                  }}
                />
                <div className="w-12 h-12 mx-auto rounded-2xl bg-[var(--color-accent-soft)] text-[var(--color-accent)] flex items-center justify-center mb-2.5">
                  <Upload className="w-6 h-6" />
                </div>
                <p className="text-sm font-medium text-[var(--color-text)]">
                  Choose or Drop Wearable File
                </p>
                <p className="text-xs text-[var(--color-text-subtle)] mt-1 max-w-[260px] mx-auto">
                  Garmin (.TCX, .GPX, .CSV), Apple Health (.XML, export.xml), or JSON logs
                </p>
              </div>

              {/* Supported formats cards */}
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="p-3 rounded-2xl bg-[var(--color-surface-sunken)] border border-[var(--color-border)] text-[var(--color-text)]">
                  <div className="font-semibold flex items-center gap-1.5 text-[var(--color-accent)]">
                    <Activity className="w-3.5 h-3.5" /> Garmin Connect
                  </div>
                  <p className="mt-1 text-[11px] leading-tight text-[var(--color-text-muted)]">
                    Export any ride or run as TCX or GPX from garmin.com
                  </p>
                </div>
                <div className="p-3 rounded-2xl bg-[var(--color-surface-sunken)] border border-[var(--color-border)] text-[var(--color-text)]">
                  <div className="font-semibold flex items-center gap-1.5 text-[var(--color-accent)]">
                    <Watch className="w-3.5 h-3.5" /> Apple Health
                  </div>
                  <p className="mt-1 text-[11px] leading-tight text-[var(--color-text-muted)]">
                    Apple Health App → Profile → Export All Health Data (XML)
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: iOS Shortcut Auto-Sync */}
          {activeTab === 'shortcut' && (
            <div className="space-y-3.5 text-xs text-[var(--color-text-muted)]">
              <div className="p-3.5 rounded-2xl bg-[var(--color-surface)] border border-[var(--color-border)]">
                <h4 className="font-semibold text-sm text-[var(--color-text)] flex items-center gap-1.5 mb-1.5">
                  <Smartphone className="w-4 h-4 text-[var(--color-accent)]" />
                  Automatic iPhone Health Sync
                </h4>
                <p className="leading-relaxed">
                  You can set up an iOS Shortcut that automatically triggers every time you finish a Garmin or Apple Watch workout, or whenever you open Eunoia on your iPhone:
                </p>

                <ol className="list-decimal list-inside space-y-1.5 mt-2.5 text-[11px] text-[var(--color-text-subtle)]">
                  <li>Open Apple <strong>Shortcuts</strong> on your iPhone.</li>
                  <li>Add Action: <em>Find Workouts where Date is Today</em>.</li>
                  <li>Add Action: <em>Get URLs from Input</em> or open Eunoia with query parameter:
                    <code className="block p-1.5 mt-1 rounded bg-[var(--color-surface-sunken)] text-[var(--color-accent)] break-all font-mono text-[10px] border border-[var(--color-border)]">
                      {typeof window !== 'undefined' ? window.location.origin + window.location.pathname : 'https://eunoia.app/'}?health_sync=...
                    </code>
                  </li>
                  <li>Eunoia automatically ingests and displays your exercises on arrival!</li>
                </ol>
              </div>

              {/* Paste JSON directly */}
              <div className="space-y-2">
                <label className="font-medium text-[var(--color-text)] flex items-center justify-between">
                  <span>Paste Shortcut JSON Output</span>
                  <span className="text-[11px] text-[var(--color-text-subtle)]">Manual Paste</span>
                </label>
                <textarea
                  value={clipboardText}
                  onChange={(e) => setClipboardText(e.target.value)}
                  placeholder={`[{"type": "running", "durationMinutes": 32, "distanceKm": 5.4, "calories": 410, "heartRate": 158}]`}
                  className="w-full h-20 p-2.5 text-xs rounded-2xl bg-[var(--color-surface)] border border-[var(--color-border)] text-[var(--color-text)] font-mono focus:outline-none focus:border-[var(--color-accent)]"
                />
                <button
                  onClick={handlePasteClipboard}
                  disabled={!clipboardText.trim()}
                  className="w-full py-2.5 rounded-2xl bg-[var(--color-accent)] text-[var(--color-on-accent)] font-medium hover:bg-[var(--color-accent-hover)] disabled:opacity-50 transition-colors flex items-center justify-center gap-1.5"
                >
                  <ClipboardPaste className="w-3.5 h-3.5" />
                  Parse & Ingest Clipboard
                </button>
              </div>
            </div>
          )}

          {/* TAB 3: Instant Wearable Simulators */}
          {activeTab === 'simulate' && (
            <div className="space-y-3">
              <p className="text-xs text-[var(--color-text-subtle)]">
                Test instant data ingestion as if your Apple Watch or Garmin device just finished syncing:
              </p>

              {/* Apple Watch Ultra Sample */}
              <div 
                onClick={() => handleSimulate('apple_watch')}
                className="p-3.5 rounded-2xl bg-[var(--color-surface)] border border-[var(--color-border)] hover:border-[var(--color-accent)]/60 cursor-pointer transition-all group"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-xl bg-[var(--color-accent-soft)] text-[var(--color-accent)] flex items-center justify-center">
                      <Watch className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="text-xs font-semibold text-[var(--color-text)] group-hover:text-[var(--color-accent)] transition-colors">
                        Apple Watch Outdoor Run + Scale
                      </h4>
                      <p className="text-[11px] text-[var(--color-text-subtle)]">
                        5.24 km • 28 min • 388 kcal • 78.9 kg weigh-in
                      </p>
                    </div>
                  </div>
                  <ArrowRight className="w-4 h-4 text-[var(--color-text-subtle)] group-hover:text-[var(--color-accent)] transition-transform group-hover:translate-x-0.5" />
                </div>
              </div>

              {/* Garmin Forerunner Sample */}
              <div 
                onClick={() => handleSimulate('garmin_forerunner')}
                className="p-3.5 rounded-2xl bg-[var(--color-surface)] border border-[var(--color-border)] hover:border-[var(--color-accent)]/60 cursor-pointer transition-all group"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-xl bg-[var(--color-accent-soft)] text-[var(--color-accent)] flex items-center justify-center">
                      <Activity className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="text-xs font-semibold text-[var(--color-text)] group-hover:text-[var(--color-accent)] transition-colors">
                        Garmin Forerunner 965 Century Ride
                      </h4>
                      <p className="text-[11px] text-[var(--color-text-subtle)]">
                        31.8 km • 64 min • 742 kcal • 280m Elevation Gain
                      </p>
                    </div>
                  </div>
                  <ArrowRight className="w-4 h-4 text-[var(--color-text-subtle)] group-hover:text-[var(--color-accent)] transition-transform group-hover:translate-x-0.5" />
                </div>
              </div>
            </div>
          )}

          {/* Pending Import Confirmation Modal */}
          {importPreview && (
            <div className="p-4 rounded-3xl bg-[var(--color-surface-raised)] border border-[var(--color-accent)]/40 space-y-3 animate-fade-in">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-[var(--color-accent)] flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5" />
                  Ready to Ingest ({importPreview.sourceName})
                </span>
                <span className="text-[11px] text-[var(--color-text-subtle)]">
                  {importPreview.cardio.length + importPreview.workouts.length + importPreview.weights.length} items
                </span>
              </div>

              <p className="text-xs text-[var(--color-text-muted)]">
                {importPreview.summary}
              </p>

              {/* Preview Cards */}
              <div className="space-y-1.5 max-h-40 overflow-y-auto no-scrollbar">
                {importPreview.cardio.map((c, i) => (
                  <div key={i} className="p-2 rounded-xl bg-[var(--color-surface)] border border-[var(--color-border)] flex items-center justify-between text-xs">
                    <span className="font-medium capitalize">{c.name || c.type}</span>
                    <span className="text-[var(--color-text-subtle)] text-[11px]">
                      {c.distanceKm ? `${c.distanceKm} km • ` : ''}{c.durationMinutes}m • {c.caloriesBurned} kcal
                    </span>
                  </div>
                ))}
                {importPreview.weights.map((w, i) => (
                  <div key={i} className="p-2 rounded-xl bg-[var(--color-surface)] border border-[var(--color-border)] flex items-center justify-between text-xs">
                    <span className="font-medium flex items-center gap-1">
                      <Scale className="w-3 h-3 text-[var(--color-accent)]" /> Weight ({w.date})
                    </span>
                    <span className="font-semibold">{w.weightKg} kg</span>
                  </div>
                ))}
              </div>

              <div className="flex gap-2 pt-1">
                <button
                  onClick={() => setImportPreview(null)}
                  className="flex-1 py-2 rounded-xl bg-[var(--color-surface-sunken)] hover:bg-[var(--color-surface-raised)] border border-[var(--color-border)] text-xs font-medium text-[var(--color-text-muted)] transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleApplyImport}
                  className="flex-1 py-2 rounded-xl bg-[var(--color-accent)] text-[var(--color-on-accent)] text-xs font-semibold hover:bg-[var(--color-accent-hover)] shadow-sm transition-colors"
                >
                  Confirm & Ingest
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
