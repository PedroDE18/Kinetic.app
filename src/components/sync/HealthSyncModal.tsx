import React, { useState, useRef } from 'react';
import { 
  X, 
  Watch, 
  Activity, 
  Upload, 
  CheckCircle2, 
  Smartphone, 
  ArrowRight,
  ClipboardPaste,
  Sparkles,
  Scale,
  Moon,
  Heart,
  Flame,
  Calendar,
  Layers,
  ShieldCheck,
  RefreshCw,
  AlertCircle
} from 'lucide-react';
import { useFitness } from '../../context/FitnessContext';
import { parseHealthFile, getSampleWearableActivities, HealthImportResult, parseJsonPayload } from '../../services/healthSync';
import { parseAppleHealthFile } from '../../services/appleHealth/appleHealthManager';
import { buildImportPreviewStats, filterNormalizedData } from '../../services/appleHealth/appleHealthAggregator';
import {
  saveDailyMetricsBatch,
  saveWorkoutsBatch,
  saveCardioBatch,
  saveWeightsBatch,
  saveSleepBatch,
} from '../../services/appleHealth/healthStorage';
import {
  ImportFilterOptions,
  ImportPreviewStats,
  ImportProgressUpdate,
  NormalizedHealthImportData,
  HealthCategoryKey,
} from '../../services/appleHealth/types';

interface HealthSyncModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function HealthSyncModal({ isOpen, onClose }: HealthSyncModalProps) {
  const { state, importHealthBatch } = useFitness();
  const [activeTab, setActiveTab] = useState<'upload' | 'shortcut' | 'simulate'>('upload');
  const [isLoading, setIsLoading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  
  // Streaming progress state for Apple Health
  const [streamProgress, setStreamProgress] = useState<ImportProgressUpdate | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Normalized preview & filtering state
  const [normalizedData, setNormalizedData] = useState<NormalizedHealthImportData | null>(null);
  const [previewStats, setPreviewStats] = useState<ImportPreviewStats | null>(null);
  const [filterOptions, setFilterOptions] = useState<ImportFilterOptions>({
    dateRange: 'all',
    categories: {
      body_composition: true,
      workouts: true,
      activity: true,
      sleep: true,
      cardiovascular: true,
      nutrition: true,
    },
  });

  // Legacy / generic format import preview
  const [legacyPreview, setLegacyPreview] = useState<HealthImportResult | null>(null);

  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [clipboardText, setClipboardText] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isPersisting, setIsPersisting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleCancelStreaming = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setStreamProgress(null);
    setIsLoading(false);
    setErrorMsg('Import cancelled by user.');
  };

  const handleFileUpload = async (file: File) => {
    setIsLoading(true);
    setErrorMsg(null);
    setSuccessMessage(null);
    setNormalizedData(null);
    setPreviewStats(null);
    setLegacyPreview(null);

    const lowerName = file.name.toLowerCase();
    const isAppleHealth = lowerName.endsWith('.zip') || (lowerName.endsWith('.xml') && file.size > 2 * 1024 * 1024) || lowerName.includes('export');

    if (isAppleHealth) {
      try {
        const controller = new AbortController();
        abortControllerRef.current = controller;

        setStreamProgress({
          stage: lowerName.endsWith('.zip') ? 'unzipping' : 'reading',
          progressPct: 5,
          recordsParsed: 0,
        });

        const normalized = await parseAppleHealthFile(
          file,
          (update) => {
            setStreamProgress(update);
          },
          controller.signal
        );

        abortControllerRef.current = null;
        setStreamProgress(null);

        if (normalized.totalRecordsProcessed === 0) {
          setErrorMsg(`No recognized health records found in ${file.name}. Ensure it is an uncorrupted Apple Health export.zip or export.xml.`);
          setIsLoading(false);
          return;
        }

        // Build preview stats and check duplicates against current state
        const stats = buildImportPreviewStats(normalized, {
          weights: state.weights,
          workouts: state.completedWorkouts,
          cardio: state.cardioSessions,
          sleep: state.sleepRecords,
        });

        setNormalizedData(normalized);
        setPreviewStats(stats);
      } catch (err: any) {
        setStreamProgress(null);
        setErrorMsg(err.message || 'Failed to process Apple Health archive.');
      } finally {
        setIsLoading(false);
      }
      return;
    }

    // Generic wearable formats (Garmin TCX/GPX, CSV, small JSON)
    try {
      const result = await parseHealthFile(file);
      if (result.cardio.length === 0 && result.workouts.length === 0 && result.weights.length === 0) {
        setErrorMsg(`No activities or records found in ${file.name}.`);
      } else {
        setLegacyPreview(result);
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to parse file. Supported formats: Apple Health (.ZIP, .XML), Garmin TCX/GPX, CSV, JSON.');
    } finally {
      setIsLoading(false);
    }
  };

  const toggleCategory = (key: HealthCategoryKey) => {
    setFilterOptions((prev) => ({
      ...prev,
      categories: {
        ...prev.categories,
        [key]: !prev.categories[key],
      },
    }));
  };

  const handleApplyNormalizedImport = async () => {
    if (!normalizedData) return;
    setIsPersisting(true);
    try {
      const filtered = filterNormalizedData(normalizedData, filterOptions);

      // 1. Persist entire historical datasets to local IndexedDB (zero memory ceiling)
      await Promise.all([
        saveDailyMetricsBatch(filtered.dailyMetrics),
        saveWorkoutsBatch(filtered.workouts),
        saveCardioBatch(filtered.cardio),
        saveWeightsBatch(filtered.weights),
        saveSleepBatch(filtered.sleep),
      ]);

      // 2. Synchronize bounded recent datasets into primary state for immediate UI reactivity
      const { addedCardio, addedWorkouts, addedWeights, addedSleep } = importHealthBatch({
        cardio: filtered.cardio,
        workouts: filtered.workouts,
        weights: filtered.weights,
        sleep: filtered.sleep,
      });

      setSuccessMessage(
        `Ingested ${filtered.dailyMetrics.length} daily health records (${addedWorkouts} workouts, ${addedCardio} cardio, ${addedWeights} weights, ${addedSleep} sleep) from ${normalizedData.sourceNames[0] || 'Apple Health'}!`
      );
      setNormalizedData(null);
      setPreviewStats(null);
    } catch (err: any) {
      setErrorMsg(`Failed saving to local health database: ${err.message}`);
    } finally {
      setIsPersisting(false);
    }
  };

  const handleApplyLegacyImport = () => {
    if (!legacyPreview) return;
    const { addedCardio, addedWorkouts, addedWeights } = importHealthBatch(legacyPreview);
    setSuccessMessage(`Successfully ingested ${addedCardio} cardio activities, ${addedWorkouts} workouts, and ${addedWeights} weight records from ${legacyPreview.sourceName}!`);
    setLegacyPreview(null);
  };

  const handleSimulate = (type: 'apple_watch' | 'garmin_forerunner') => {
    const sample = getSampleWearableActivities(type);
    const { addedCardio, addedWorkouts, addedWeights } = importHealthBatch(sample);
    setSuccessMessage(`Simulated live sync from ${sample.sourceName}: Ingested ${addedCardio} cardio, ${addedWorkouts} workouts, and ${addedWeights} weigh-ins.`);
  };

  const handlePasteClipboard = () => {
    if (!clipboardText.trim()) return;
    try {
      const parsed = JSON.parse(clipboardText.trim());
      const result = Array.isArray(parsed) ? parseJsonPayload(parsed) : {
        cardio: parsed.cardio || [],
        workouts: parsed.workouts || [],
        weights: parsed.weights || [],
        sourceName: 'Clipboard Data',
        summary: 'Imported from clipboard JSON',
      };
      setLegacyPreview(result);
      setClipboardText('');
    } catch {
      setErrorMsg('Clipboard content is not valid JSON. Please paste the JSON produced by the Apple Health Shortcut.');
    }
  };

  const getStageLabel = (stage: ImportProgressUpdate['stage']) => {
    switch (stage) {
      case 'unzipping':
        return 'Decompressing export.zip archive...';
      case 'reading':
        return 'Reading XML export stream...';
      case 'parsing':
        return 'Streaming XML records...';
      case 'normalizing':
        return 'Aggregating daily metrics & deduplicating...';
      default:
        return 'Processing health data...';
    }
  };

  const getCategoryIcon = (key: HealthCategoryKey) => {
    switch (key) {
      case 'body_composition':
        return <Scale className="w-3.5 h-3.5 text-[var(--color-accent)]" />;
      case 'workouts':
        return <Activity className="w-3.5 h-3.5 text-blue-400" />;
      case 'activity':
        return <Flame className="w-3.5 h-3.5 text-amber-500" />;
      case 'sleep':
        return <Moon className="w-3.5 h-3.5 text-indigo-400" />;
      case 'cardiovascular':
        return <Heart className="w-3.5 h-3.5 text-rose-500" />;
      case 'nutrition':
        return <Sparkles className="w-3.5 h-3.5 text-emerald-500" />;
      default:
        return <Layers className="w-3.5 h-3.5" />;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div 
        className="w-full max-w-lg max-h-[92vh] flex flex-col rounded-3xl bg-[var(--color-bg)] text-[var(--color-text)] border border-[var(--color-border)] shadow-2xl overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--color-border)] bg-[var(--color-surface)]">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-[var(--color-accent)]/15 text-[var(--color-accent)] flex items-center justify-center">
              <Watch className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-semibold tracking-tight text-[var(--color-text)]">
                Health & Wearable Importer
              </h2>
              <p className="text-xs text-[var(--color-text-subtle)]">
                Native Apple Health (ZIP/XML), Garmin & wearable data
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
            onClick={() => { setActiveTab('upload'); setNormalizedData(null); setLegacyPreview(null); }}
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
            onClick={() => { setActiveTab('shortcut'); setNormalizedData(null); setLegacyPreview(null); }}
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
            onClick={() => { setActiveTab('simulate'); setNormalizedData(null); setLegacyPreview(null); }}
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
                <p className="font-semibold">Import Complete</p>
                <p className="mt-0.5 leading-relaxed">{successMessage}</p>
              </div>
            </div>
          )}

          {/* Error Banner */}
          {errorMsg && (
            <div className="p-3.5 rounded-2xl bg-[var(--color-danger-soft)] border border-[var(--color-danger)]/30 text-[var(--color-danger)] flex items-start gap-2 text-xs">
              <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
              <div className="leading-relaxed">{errorMsg}</div>
            </div>
          )}

          {/* STREAMING PROGRESS INDICATOR */}
          {streamProgress && (
            <div className="p-5 rounded-3xl bg-[var(--color-surface)] border border-[var(--color-accent)]/30 space-y-3 animate-fade-in shadow-sm">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-[var(--color-text)] flex items-center gap-2">
                  <RefreshCw className="w-4 h-4 text-[var(--color-accent)] animate-spin" />
                  {getStageLabel(streamProgress.stage)}
                </span>
                <span className="font-mono text-xs text-[var(--color-accent)] font-bold">
                  {streamProgress.progressPct}%
                </span>
              </div>

              {/* Progress track */}
              <div className="w-full h-2 rounded-full bg-[var(--color-surface-sunken)] overflow-hidden">
                <div 
                  className="h-full bg-[var(--color-accent)] transition-all duration-300 rounded-full"
                  style={{ width: `${Math.max(4, streamProgress.progressPct)}%` }}
                />
              </div>

              <div className="flex items-center justify-between text-[11px] text-[var(--color-text-subtle)] pt-1">
                <span>
                  {streamProgress.recordsParsed > 0
                    ? `${streamProgress.recordsParsed.toLocaleString()} records processed`
                    : 'Reading file stream...'}
                </span>
                <button
                  onClick={handleCancelStreaming}
                  className="text-[var(--color-text-muted)] hover:text-[var(--color-danger)] transition-colors underline"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          {/* TAB 1: File Upload */}
          {activeTab === 'upload' && !streamProgress && !previewStats && !legacyPreview && (
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
                  accept=".zip,.xml,.tcx,.gpx,.csv,.json"
                  onChange={(e) => {
                    if (e.target.files?.[0]) {
                      handleFileUpload(e.target.files[0]);
                    }
                  }}
                />
                <div className="w-12 h-12 mx-auto rounded-2xl bg-[var(--color-accent-soft)] text-[var(--color-accent)] flex items-center justify-center mb-2.5">
                  <Upload className="w-6 h-6" />
                </div>
                <p className="text-sm font-semibold text-[var(--color-text)]">
                  Choose or Drop Wearable File
                </p>
                <p className="text-xs text-[var(--color-text-subtle)] mt-1 max-w-[280px] mx-auto leading-relaxed">
                  Apple Health (.ZIP, export.xml), Garmin (.TCX, .GPX, .CSV), or JSON logs
                </p>
                <div className="mt-3 flex items-center justify-center gap-1.5 text-[10px] text-[var(--color-text-subtle)]">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                  <span>100% Client-Side Ingestion • Streams multi-GB files without crash</span>
                </div>
              </div>

              {/* Supported formats cards */}
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="p-3 rounded-2xl bg-[var(--color-surface-sunken)] border border-[var(--color-border)] text-[var(--color-text)]">
                  <div className="font-semibold flex items-center gap-1.5 text-[var(--color-accent)]">
                    <Watch className="w-3.5 h-3.5" /> Apple Health
                  </div>
                  <p className="mt-1 text-[11px] leading-tight text-[var(--color-text-muted)]">
                    Upload original <strong>export.zip</strong> or <strong>export.xml</strong> directly
                  </p>
                </div>
                <div className="p-3 rounded-2xl bg-[var(--color-surface-sunken)] border border-[var(--color-border)] text-[var(--color-text)]">
                  <div className="font-semibold flex items-center gap-1.5 text-[var(--color-accent)]">
                    <Activity className="w-3.5 h-3.5" /> Garmin Connect
                  </div>
                  <p className="mt-1 text-[11px] leading-tight text-[var(--color-text-muted)]">
                    Export workouts as TCX, GPX, or CSV activity files
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* APPLE HEALTH STREAMED PREVIEW & CATEGORY SELECTION */}
          {previewStats && normalizedData && (
            <div className="p-4 rounded-3xl bg-[var(--color-surface)] border border-[var(--color-accent)]/30 space-y-4 animate-fade-in">
              <div className="flex items-center justify-between border-b border-[var(--color-border)] pb-3">
                <div>
                  <span className="text-xs font-semibold text-[var(--color-accent)] flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5" />
                    Apple Health Import Preview
                  </span>
                  <p className="text-[11px] text-[var(--color-text-muted)] mt-0.5">
                    {previewStats.totalRecordsFound.toLocaleString()} records found • {previewStats.dateRange.start || 'Start'} to {previewStats.dateRange.end || 'Now'}
                  </p>
                </div>
                {previewStats.sources.length > 0 && (
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-[var(--color-surface-raised)] border border-[var(--color-border)] text-[var(--color-text-subtle)] truncate max-w-[120px]">
                    {previewStats.sources[0]}
                  </span>
                )}
              </div>

              {/* Date Range Selector */}
              <div>
                <label className="text-[11px] font-semibold text-[var(--color-text-subtle)] uppercase tracking-wider block mb-1.5">
                  Import Date Range
                </label>
                <div className="grid grid-cols-5 gap-1 text-[11px]">
                  {(['all', '1y', '6m', '90d', '30d'] as const).map((range) => {
                    const labels: Record<string, string> = {
                      all: 'All Time',
                      '1y': '1 Year',
                      '6m': '6 Mos',
                      '90d': '90 Days',
                      '30d': '30 Days',
                    };
                    const isSelected = filterOptions.dateRange === range;
                    return (
                      <button
                        key={range}
                        onClick={() => setFilterOptions((prev) => ({ ...prev, dateRange: range }))}
                        className={`py-1.5 rounded-xl font-medium transition-all text-center ${
                          isSelected
                            ? 'bg-[var(--color-accent)] text-[var(--color-on-accent)] font-semibold shadow-xs'
                            : 'bg-[var(--color-surface-sunken)] text-[var(--color-text-muted)] hover:text-[var(--color-text)] border border-[var(--color-border)]'
                        }`}
                      >
                        {labels[range]}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Category Toggles */}
              <div>
                <label className="text-[11px] font-semibold text-[var(--color-text-subtle)] uppercase tracking-wider block mb-1.5">
                  Data Categories to Ingest
                </label>
                <div className="space-y-1.5 max-h-48 overflow-y-auto no-scrollbar">
                  {previewStats.categories.map((cat) => {
                    const isChecked = !!filterOptions.categories[cat.key];
                    return (
                      <div
                        key={cat.key}
                        onClick={() => toggleCategory(cat.key)}
                        className={`p-2.5 rounded-2xl border transition-all cursor-pointer flex items-center justify-between ${
                          isChecked
                            ? 'bg-[var(--color-surface-raised)] border-[var(--color-accent)]/50'
                            : 'bg-[var(--color-surface-sunken)] border-[var(--color-border)] opacity-60'
                        }`}
                      >
                        <div className="flex items-center gap-2.5">
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => toggleCategory(cat.key)}
                            onClick={(e) => e.stopPropagation()}
                            className="rounded border-[var(--color-border)] text-[var(--color-accent)] focus:ring-0 cursor-pointer"
                          />
                          <div className="flex items-center gap-2">
                            {getCategoryIcon(cat.key)}
                            <div>
                              <p className="text-xs font-semibold text-[var(--color-text)]">
                                {cat.label}
                              </p>
                              <p className="text-[10px] text-[var(--color-text-subtle)]">
                                {cat.sampleDescription}
                              </p>
                            </div>
                          </div>
                        </div>
                        <span className="text-xs font-mono font-medium text-[var(--color-text-muted)]">
                          {cat.recordCount.toLocaleString()}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Deduplication Guarantee Banner */}
              <div className="p-2.5 rounded-2xl bg-[var(--color-surface-sunken)] border border-[var(--color-border)] flex items-center gap-2 text-[11px] text-[var(--color-text-subtle)]">
                <ShieldCheck className="w-4 h-4 text-emerald-500 shrink-0" />
                <span>
                  Deterministic deduplication active: existing workouts, cardio, and weights are preserved idempotently.
                </span>
              </div>

              {/* Confirmation Actions */}
              <div className="flex gap-2 pt-1">
                <button
                  onClick={() => { setNormalizedData(null); setPreviewStats(null); }}
                  disabled={isPersisting}
                  className="flex-1 py-2.5 rounded-2xl bg-[var(--color-surface-sunken)] hover:bg-[var(--color-surface-raised)] border border-[var(--color-border)] text-xs font-medium text-[var(--color-text-muted)] transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleApplyNormalizedImport}
                  disabled={isPersisting}
                  className="flex-1 py-2.5 rounded-2xl bg-[var(--color-accent)] text-[var(--color-on-accent)] text-xs font-semibold hover:bg-[var(--color-accent-hover)] shadow-sm transition-colors flex items-center justify-center gap-1.5"
                >
                  {isPersisting ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      Saving to Local DB...
                    </>
                  ) : (
                    'Confirm & Ingest'
                  )}
                </button>
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
                  You can set up an iOS Shortcut that automatically triggers every time you finish a Garmin or Apple Watch workout:
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

          {/* Pending Legacy Import Confirmation */}
          {legacyPreview && (
            <div className="p-4 rounded-3xl bg-[var(--color-surface-raised)] border border-[var(--color-accent)]/40 space-y-3 animate-fade-in">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-[var(--color-accent)] flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5" />
                  Ready to Ingest ({legacyPreview.sourceName})
                </span>
                <span className="text-[11px] text-[var(--color-text-subtle)]">
                  {legacyPreview.cardio.length + legacyPreview.workouts.length + legacyPreview.weights.length} items
                </span>
              </div>

              <p className="text-xs text-[var(--color-text-muted)]">
                {legacyPreview.summary}
              </p>

              {/* Preview Cards */}
              <div className="space-y-1.5 max-h-40 overflow-y-auto no-scrollbar">
                {legacyPreview.cardio.map((c, i) => (
                  <div key={i} className="p-2 rounded-xl bg-[var(--color-surface)] border border-[var(--color-border)] flex items-center justify-between text-xs">
                    <span className="font-medium capitalize">{c.name || c.type}</span>
                    <span className="text-[var(--color-text-subtle)] text-[11px]">
                      {c.distanceKm ? `${c.distanceKm} km • ` : ''}{c.durationMinutes}m • {c.caloriesBurned} kcal
                    </span>
                  </div>
                ))}
                {legacyPreview.weights.map((w, i) => (
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
                  onClick={() => setLegacyPreview(null)}
                  className="flex-1 py-2 rounded-xl bg-[var(--color-surface-sunken)] hover:bg-[var(--color-surface-raised)] border border-[var(--color-border)] text-xs font-medium text-[var(--color-text-muted)] transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleApplyLegacyImport}
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
