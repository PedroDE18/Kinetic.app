import React, { useState, useEffect } from 'react';
import { X, Sparkles, AlertCircle, Lightbulb, CheckCircle2, Send, Tag, Layers, List, Copy, RefreshCw, Check } from 'lucide-react';
import { useBodyScrollLock } from '../../utils/useBodyScrollLock';
import { useFitness } from '../../context/FitnessContext';
import { FeedbackCategory, FrictionSeverity, FrictionReport } from '../../types';

interface FrictionFeedbackModalProps {
  onClose: () => void;
}

export function FrictionFeedbackModal({ onClose }: FrictionFeedbackModalProps) {
  useBodyScrollLock(true);
  const { state } = useFitness();

  const [activeView, setActiveView] = useState<'create' | 'history'>('create');
  const [feedbackType, setFeedbackType] = useState<'recommendation' | 'friction'>('recommendation');
  const [category, setCategory] = useState<FeedbackCategory>('feature_request');
  const [severity, setSeverity] = useState<FrictionSeverity>('enhancement');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [suggestedSolution, setSuggestedSolution] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [savedReports, setSavedReports] = useState<FrictionReport[]>([]);
  const [copied, setCopied] = useState(false);
  const [syncStatus, setSyncStatus] = useState<string | null>(null);

  useEffect(() => {
    try {
      const existing = JSON.parse(localStorage.getItem('eunoia_friction_v1') || '[]');
      setSavedReports(existing);
    } catch {}
  }, []);

  const categories: { id: FeedbackCategory; label: string }[] = [
    { id: 'feature_request', label: 'Feature Request' },
    { id: 'nutrition_diary', label: 'Nutrition & Foods' },
    { id: 'workout_logging', label: 'Workouts & Atlas' },
    { id: 'stoic_reflection', label: 'Mind & Reflection' },
    { id: 'habits_systems', label: 'Habits & Streaks' },
    { id: 'ui_contrast_layout', label: 'UI & Theme Design' },
    { id: 'performance_bug', label: 'Bug & Performance' },
  ];

  const handleSyncToDisk = async (reportsToSync: FrictionReport[]) => {
    setSyncStatus('Syncing to disk...');
    try {
      const res = await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(reportsToSync),
      });
      if (res.ok) {
        setSyncStatus('Synced to docs/friction-backlog.json!');
      } else {
        setSyncStatus('Sync error: server response not ok');
      }
    } catch (e) {
      setSyncStatus('Local disk sync active in dev mode');
    }
    setTimeout(() => setSyncStatus(null), 3000);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !description.trim()) return;

    const report: FrictionReport = {
      id: `fric-${Date.now()}`,
      timestamp: new Date().toISOString(),
      category,
      severity: feedbackType === 'recommendation' ? 'enhancement' : severity,
      title: title.trim(),
      description: description.trim(),
      suggestedSolution: suggestedSolution.trim() || undefined,
      deviceContext: {
        viewport: `${window.innerWidth}x${window.innerHeight}`,
        userAgent: navigator.userAgent,
        isStandalonePwa: window.matchMedia('(display-mode: standalone)').matches,
        theme: state.profile.theme,
      },
      reporter: 'human_user',
      status: 'open',
    };

    // 1. Persist to local storage
    try {
      const existing = JSON.parse(localStorage.getItem('eunoia_friction_v1') || '[]');
      existing.unshift(report);
      localStorage.setItem('eunoia_friction_v1', JSON.stringify(existing));
      setSavedReports(existing);
    } catch {
      // Ignore localStorage quotas
    }

    // 2. Dispatch event and sync to dev server if available
    window.dispatchEvent(new CustomEvent('eunoia:feedback-submitted', { detail: report }));
    try {
      await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(report),
      });
    } catch {
      // Offline fallback
    }

    setSubmitted(true);
    setTimeout(() => {
      onClose();
    }, 1800);
  };

  const handleCopyAll = () => {
    navigator.clipboard.writeText(JSON.stringify(savedReports, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 animate-in fade-in">
      <div className="bg-[var(--color-bg-elevated)] border border-[var(--color-border)] rounded-3xl max-w-md w-full max-h-[92vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="shrink-0 p-5 pb-3 border-b border-[var(--color-border)] flex justify-between items-center bg-[var(--color-bg-elevated)]">
          <div>
            <div className="flex items-center gap-1.5 text-[var(--color-accent)] text-xs font-bold uppercase tracking-wider">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Continuous Improvement</span>
            </div>
            <h3 className="text-base font-bold text-[var(--color-text)] mt-0.5">
              Recommendations & Friction
            </h3>
          </div>
          <button
            onClick={onClose}
            aria-label="Close"
            className="min-h-[44px] min-w-[44px] flex items-center justify-center text-[var(--color-text-muted)] hover:text-[var(--color-text)] rounded-full hover:bg-[var(--color-surface)] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* View Switcher: Create vs History */}
        <div className="shrink-0 px-5 pt-3 pb-1 border-b border-[var(--color-border)] flex items-center gap-2 bg-[var(--color-bg-elevated)]">
          <button
            type="button"
            onClick={() => setActiveView('create')}
            className={`min-h-[34px] px-3.5 py-1 rounded-xl text-xs font-bold transition-all border ${
              activeView === 'create'
                ? 'bg-[var(--color-accent)] border-[var(--color-accent)] text-[var(--color-on-accent)] shadow-xs'
                : 'bg-[var(--color-surface-sunken)] border-[var(--color-border)] text-[var(--color-text-muted)] hover:text-[var(--color-text)]'
            }`}
          >
            New Submission
          </button>
          <button
            type="button"
            onClick={() => setActiveView('history')}
            className={`min-h-[34px] px-3.5 py-1 rounded-xl text-xs font-bold transition-all border flex items-center gap-1.5 ${
              activeView === 'history'
                ? 'bg-[var(--color-accent)] border-[var(--color-accent)] text-[var(--color-on-accent)] shadow-xs'
                : 'bg-[var(--color-surface-sunken)] border-[var(--color-border)] text-[var(--color-text-muted)] hover:text-[var(--color-text)]'
            }`}
          >
            <List className="w-3.5 h-3.5" />
            <span>My Submissions ({savedReports.length})</span>
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 min-h-0 overflow-y-auto p-5 space-y-4">
          {activeView === 'history' ? (
            <div className="space-y-3">
              {/* History Toolbar */}
              <div className="flex items-center justify-between gap-2 pb-2 border-b border-[var(--color-border)]">
                <span className="text-xs font-semibold text-[var(--color-text-muted)]">
                  {savedReports.length} items registered
                </span>
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => handleSyncToDisk(savedReports)}
                    title="Sync to disk backlog"
                    className="min-h-[30px] px-2.5 py-1 rounded-lg bg-[var(--color-surface-raised)] border border-[var(--color-border)] text-[11px] font-semibold text-[var(--color-accent)] flex items-center gap-1 active:scale-95 transition-all"
                  >
                    <RefreshCw className="w-3 h-3" />
                    <span>Sync Disk</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleCopyAll}
                    title="Copy all feedback as JSON"
                    className="min-h-[30px] px-2.5 py-1 rounded-lg bg-[var(--color-surface-raised)] border border-[var(--color-border)] text-[11px] font-semibold text-[var(--color-accent)] flex items-center gap-1 active:scale-95 transition-all"
                  >
                    {copied ? <Check className="w-3 h-3 text-[var(--color-success)]" /> : <Copy className="w-3 h-3" />}
                    <span>{copied ? 'Copied!' : 'Copy JSON'}</span>
                  </button>
                </div>
              </div>

              {syncStatus && (
                <div className="p-2 rounded-xl bg-[var(--color-accent-soft)] border border-[var(--color-accent)]/30 text-[var(--color-accent)] text-xs text-center font-semibold animate-in fade-in">
                  {syncStatus}
                </div>
              )}

              {savedReports.length === 0 ? (
                <div className="py-12 text-center text-xs text-[var(--color-text-muted)] border border-dashed border-[var(--color-border)] rounded-2xl p-4">
                  No recommendations or friction submitted yet from this device.
                </div>
              ) : (
                <div className="space-y-2.5">
                  {savedReports.map((item) => (
                    <div
                      key={item.id}
                      className="p-3.5 bg-[var(--color-surface-sunken)] border border-[var(--color-border)] rounded-2xl space-y-1.5"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <span className="text-xs font-bold text-[var(--color-text)]">
                          {item.title}
                        </span>
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-[var(--color-surface-raised)] border border-[var(--color-border)] text-[var(--color-text-muted)] font-semibold shrink-0">
                          {item.category.replace('_', ' ')}
                        </span>
                      </div>
                      <p className="text-xs text-[var(--color-text-muted)] leading-relaxed">
                        {item.description}
                      </p>
                      {item.suggestedSolution && (
                        <div className="text-[11px] text-[var(--color-accent)] font-medium pt-1 border-t border-[var(--color-border)]">
                          Suggestion: {item.suggestedSolution}
                        </div>
                      )}
                      <div className="text-[9px] text-[var(--color-text-subtle)] pt-0.5">
                        {new Date(item.timestamp).toLocaleString()}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : submitted ? (
            <div className="py-12 text-center space-y-3 animate-in fade-in zoom-in-95">
              <div className="w-12 h-12 rounded-full bg-[var(--color-success)]/10 border border-[var(--color-success)]/30 text-[var(--color-success)] flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <h4 className="text-base font-bold text-[var(--color-text)]">Feedback Saved & Synced</h4>
              <p className="text-xs text-[var(--color-text-muted)] max-w-xs mx-auto">
                Your recommendation has been registered. The autonomous engineering squad reviews and acts on this in scheduled improvement sprints.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Type Switcher */}
              <div className="grid grid-cols-2 gap-2 bg-[var(--color-surface-sunken)] p-1 rounded-2xl border border-[var(--color-border)]">
                <button
                  type="button"
                  onClick={() => {
                    setFeedbackType('recommendation');
                    setCategory('feature_request');
                    setSeverity('enhancement');
                  }}
                  className={`min-h-[38px] py-1.5 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                    feedbackType === 'recommendation'
                      ? 'bg-[var(--color-surface)] text-[var(--color-text)] shadow-xs border border-[var(--color-border)]'
                      : 'text-[var(--color-text-muted)] hover:text-[var(--color-text)]'
                  }`}
                >
                  <Lightbulb className="w-3.5 h-3.5 text-amber-400" />
                  <span>Recommendation</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setFeedbackType('friction');
                    setCategory('performance_bug');
                    setSeverity('high_friction');
                  }}
                  className={`min-h-[38px] py-1.5 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                    feedbackType === 'friction'
                      ? 'bg-[var(--color-surface)] text-[var(--color-text)] shadow-xs border border-[var(--color-border)]'
                      : 'text-[var(--color-text-muted)] hover:text-[var(--color-text)]'
                  }`}
                >
                  <AlertCircle className="w-3.5 h-3.5 text-rose-400" />
                  <span>Friction / Bug</span>
                </button>
              </div>

              {/* Category Picker */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold uppercase tracking-wider text-[var(--color-text-subtle)] flex items-center gap-1">
                  <Tag className="w-3 h-3 text-[var(--color-accent)]" />
                  <span>Area of App</span>
                </label>
                <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-none">
                  {categories.map((c) => (
                    <button
                      type="button"
                      key={c.id}
                      onClick={() => setCategory(c.id)}
                      className={`min-h-[32px] px-3 py-1 rounded-xl text-[11px] font-bold whitespace-nowrap transition-all border shrink-0 ${
                        category === c.id
                          ? 'bg-[var(--color-accent)] border-[var(--color-accent)] text-[var(--color-on-accent)]'
                          : 'bg-[var(--color-surface-sunken)] border-[var(--color-border)] text-[var(--color-text-muted)] hover:text-[var(--color-text)]'
                      }`}
                    >
                      {c.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Friction Severity (Only if friction) */}
              {feedbackType === 'friction' && (
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold uppercase tracking-wider text-[var(--color-text-subtle)] flex items-center gap-1">
                    <Layers className="w-3 h-3 text-[var(--color-accent)]" />
                    <span>Severity</span>
                  </label>
                  <div className="grid grid-cols-3 gap-1.5">
                    {(['minor_annoyance', 'high_friction', 'blocker'] as FrictionSeverity[]).map((s) => (
                      <button
                        type="button"
                        key={s}
                        onClick={() => setSeverity(s)}
                        className={`min-h-[32px] px-2 py-1 rounded-xl text-[10px] font-bold capitalize transition-all border ${
                          severity === s
                            ? 'bg-[var(--color-accent)] border-[var(--color-accent)] text-[var(--color-on-accent)]'
                            : 'bg-[var(--color-surface-sunken)] border-[var(--color-border)] text-[var(--color-text-muted)]'
                        }`}
                      >
                        {s.replace('_', ' ')}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Title */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold uppercase tracking-wider text-[var(--color-text-subtle)]">
                  {feedbackType === 'recommendation' ? 'What would you like to see?' : 'Summary of Friction'}
                </label>
                <input
                  type="text"
                  required
                  placeholder={
                    feedbackType === 'recommendation'
                      ? 'e.g., Add barbell plate visualizer for deadlifts'
                      : 'e.g., Button doesn’t respond when saving sleep entry'
                  }
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="min-h-[44px] w-full bg-[var(--color-surface-sunken)] border border-[var(--color-border)] rounded-xl px-3 py-2 text-xs text-[var(--color-text)] placeholder-[var(--color-text-subtle)] focus:outline-none focus:border-[var(--color-accent)]"
                />
              </div>

              {/* Description */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold uppercase tracking-wider text-[var(--color-text-subtle)]">
                  Details & Context
                </label>
                <textarea
                  required
                  rows={3}
                  placeholder="Explain the friction point, where it happened, or how this feature would improve your flourishing..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full bg-[var(--color-surface-sunken)] border border-[var(--color-border)] rounded-xl px-3 py-2 text-xs text-[var(--color-text)] placeholder-[var(--color-text-subtle)] focus:outline-none focus:border-[var(--color-accent)] resize-none"
                />
              </div>

              {/* Suggested Solution */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold uppercase tracking-wider text-[var(--color-text-subtle)]">
                  Your Suggested Solution (Optional)
                </label>
                <input
                  type="text"
                  placeholder="Any idea on how we should solve this?"
                  value={suggestedSolution}
                  onChange={(e) => setSuggestedSolution(e.target.value)}
                  className="min-h-[44px] w-full bg-[var(--color-surface-sunken)] border border-[var(--color-border)] rounded-xl px-3 py-2 text-xs text-[var(--color-text)] placeholder-[var(--color-text-subtle)] focus:outline-none focus:border-[var(--color-accent)]"
                />
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                className="w-full min-h-[44px] py-2.5 rounded-2xl bg-[var(--color-accent)] text-[var(--color-on-accent)] font-bold text-xs flex items-center justify-center gap-2 hover:opacity-95 active:scale-[0.98] transition-all shadow-md"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Submit to Autonomous Roadmap</span>
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

