import React, { useState } from 'react';
import { X, Moon, Sparkles, Check, Clock, BatteryCharging } from 'lucide-react';
import { useFitness } from '../../context/FitnessContext';
import { SleepRecord } from '../../types';
import { useBodyScrollLock } from '../../utils/useBodyScrollLock';
import { getLocalDateString } from '../../utils/engine';

interface SleepModalProps {
  onClose: () => void;
  targetDate?: string;
}

export function SleepModal({ onClose, targetDate }: SleepModalProps) {
  useBodyScrollLock(true);
  const { addSleepRecord } = useFitness();
  const dateStr = targetDate || getLocalDateString();

  const [bedTime, setBedTime] = useState('22:45');
  const [wakeTime, setWakeTime] = useState('06:30');
  const [qualityRating, setQualityRating] = useState<number>(4);
  const [restfulness, setRestfulness] = useState<SleepRecord['restfulness']>('good');
  const [notes, setNotes] = useState('');

  // Calculate duration between bedTime and wakeTime
  const calculateDuration = (bed: string, wake: string): number => {
    const [bH, bM] = bed.split(':').map(Number);
    const [wH, wM] = wake.split(':').map(Number);
    let bedMinutes = bH * 60 + bM;
    let wakeMinutes = wH * 60 + wM;
    if (wakeMinutes < bedMinutes) {
      wakeMinutes += 24 * 60; // crossed midnight
    }
    return Math.max(0, wakeMinutes - bedMinutes);
  };

  const durationMins = calculateDuration(bedTime, wakeTime);
  const hours = (durationMins / 60).toFixed(1);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newRecord: SleepRecord = {
      id: `sleep-${Date.now()}`,
      date: dateStr,
      bedTime,
      wakeTime,
      durationMinutes: durationMins,
      qualityRating,
      restfulness,
      notes: notes.trim() || undefined,
    };
    addSleepRecord(newRecord);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in">
      <div className="bg-[var(--color-bg-elevated)] border border-[var(--color-border)] rounded-t-3xl sm:rounded-3xl max-w-sm w-full p-5 sm:p-6 space-y-4 max-h-[92vh] overflow-y-auto shadow-2xl">
        <div className="flex justify-between items-center pb-2 border-b border-[var(--color-border)]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-[var(--color-accent)]/15 text-[var(--color-accent)] flex items-center justify-center">
              <Moon className="w-4 h-4 stroke-[2.5]" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-[var(--color-text)]">Sleep & Recovery</h3>
              <p className="text-[11px] text-[var(--color-text-muted)]">Record night for {dateStr}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Close sleep dialog"
            className="w-8 h-8 rounded-full bg-[var(--color-surface-raised)] border border-[var(--color-border)] text-[var(--color-text-muted)] hover:text-[var(--color-text)] flex items-center justify-center transition-all"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-[var(--color-surface-sunken)] p-3 rounded-2xl border border-[var(--color-border)] space-y-1">
              <label className="text-[10px] text-[var(--color-text-muted)] uppercase font-semibold block">
                Lights Out
              </label>
              <input
                type="time"
                value={bedTime}
                onChange={(e) => setBedTime(e.target.value)}
                className="w-full bg-transparent font-bold text-sm text-[var(--color-text)] focus:outline-none"
              />
            </div>
            <div className="bg-[var(--color-surface-sunken)] p-3 rounded-2xl border border-[var(--color-border)] space-y-1">
              <label className="text-[10px] text-[var(--color-text-muted)] uppercase font-semibold block">
                Wake Up
              </label>
              <input
                type="time"
                value={wakeTime}
                onChange={(e) => setWakeTime(e.target.value)}
                className="w-full bg-transparent font-bold text-sm text-[var(--color-text)] focus:outline-none"
              />
            </div>
          </div>

          <div className="p-3 bg-[var(--color-surface-raised)] border border-[var(--color-border)] rounded-2xl flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-[var(--color-accent)]" />
              <span className="text-xs font-semibold text-[var(--color-text-muted)]">Calculated Sleep:</span>
            </div>
            <span className="text-sm font-bold text-[var(--color-text)] tabular-nums">
              {hours} hours ({Math.floor(durationMins / 60)}h {durationMins % 60}m)
            </span>
          </div>

          <div className="space-y-1.5">
            <label className="text-[11px] font-semibold text-[var(--color-text-muted)] uppercase tracking-wider block">
              Subjective Sleep Quality
            </label>
            <div className="grid grid-cols-5 gap-1.5">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setQualityRating(star)}
                  className={`py-2 rounded-xl text-xs font-bold transition-all border ${
                    qualityRating === star
                      ? 'bg-[var(--color-accent)] text-[var(--color-on-accent)] border-[var(--color-accent)] shadow-sm'
                      : 'bg-[var(--color-surface-sunken)] text-[var(--color-text-muted)] border-[var(--color-border)]'
                  }`}
                >
                  {star}★
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-[11px] font-semibold text-[var(--color-text-muted)] uppercase tracking-wider block">
              Morning Restfulness
            </label>
            <div className="grid grid-cols-4 gap-1">
              {(['poor', 'fair', 'good', 'optimal'] as const).map((level) => (
                <button
                  key={level}
                  type="button"
                  onClick={() => setRestfulness(level)}
                  className={`py-1.5 rounded-xl text-[11px] font-semibold capitalize transition-all border ${
                    restfulness === level
                      ? 'bg-[var(--color-surface-raised)] text-[var(--color-accent)] border-[var(--color-accent)] shadow-sm'
                      : 'bg-[var(--color-surface-sunken)] text-[var(--color-text-muted)] border-[var(--color-border)]'
                  }`}
                >
                  {level}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-[11px] font-semibold text-[var(--color-text-muted)] uppercase tracking-wider block">
              Notes & Hygiene Factors (optional)
            </label>
            <input
              type="text"
              placeholder="e.g. Read 20 mins before bed, bedroom cool at 19°C"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full bg-[var(--color-surface-sunken)] border border-[var(--color-border)] rounded-xl px-3 py-2 text-xs text-[var(--color-text)] focus:outline-none focus:border-[var(--color-accent)]"
            />
          </div>

          <button
            type="submit"
            className="w-full py-3 bg-[var(--color-accent)] hover:bg-[var(--color-accent-hover)] text-[var(--color-on-accent)] font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 active:scale-95 transition-all shadow-sm"
          >
            <Check className="w-4 h-4 stroke-[3]" />
            <span>Record Sleep Data</span>
          </button>
        </form>
      </div>
    </div>
  );
}
