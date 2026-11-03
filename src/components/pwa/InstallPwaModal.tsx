import React from 'react';
import { X, Share, PlusSquare, Smartphone, CheckCircle, Sparkles } from 'lucide-react';

interface InstallPwaModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function InstallPwaModal({ isOpen, onClose }: InstallPwaModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-sm rounded-3xl bg-[var(--color-surface)] text-[var(--color-text)] border border-[var(--color-border)] shadow-2xl overflow-hidden p-5 space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-[var(--color-accent-soft)] text-[var(--color-accent)] flex items-center justify-center">
              <Smartphone className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-semibold text-base">Install on iPhone</h3>
              <p className="text-xs text-[var(--color-text-subtle)]">Add Eunoia to your Home Screen</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center bg-[var(--color-surface-raised)] text-[var(--color-text-muted)] hover:text-[var(--color-text)] transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Instructions */}
        <div className="space-y-3 pt-1">
          <div className="flex items-start gap-3 p-3 rounded-2xl bg-[var(--color-surface-sunken)] border border-[var(--color-border)]/70">
            <div className="w-7 h-7 rounded-xl bg-[var(--color-surface-raised)] text-[var(--color-text-muted)] flex items-center justify-center font-bold text-xs shrink-0">
              1
            </div>
            <div className="text-xs">
              <p className="font-semibold flex items-center gap-1.5">
                Tap Safari's Share Button <Share className="w-3.5 h-3.5 text-[var(--color-accent)] inline" />
              </p>
              <p className="text-[var(--color-text-subtle)] mt-0.5">
                At the bottom center of Safari's toolbar on your iPhone.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3 p-3 rounded-2xl bg-[var(--color-surface-sunken)] border border-[var(--color-border)]/70">
            <div className="w-7 h-7 rounded-xl bg-[var(--color-surface-raised)] text-[var(--color-text-muted)] flex items-center justify-center font-bold text-xs shrink-0">
              2
            </div>
            <div className="text-xs">
              <p className="font-semibold flex items-center gap-1.5">
                Tap "Add to Home Screen" <PlusSquare className="w-3.5 h-3.5 text-[var(--color-accent)] inline" />
              </p>
              <p className="text-[var(--color-text-subtle)] mt-0.5">
                Scroll down the share sheet and tap the Add to Home Screen option.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3 p-3 rounded-2xl bg-[var(--color-surface-sunken)] border border-[var(--color-border)]/70">
            <div className="w-7 h-7 rounded-xl bg-[var(--color-surface-raised)] text-[var(--color-text-muted)] flex items-center justify-center font-bold text-xs shrink-0">
              3
            </div>
            <div className="text-xs">
              <p className="font-semibold flex items-center gap-1.5">
                Tap "Add" in Top Right
              </p>
              <p className="text-[var(--color-text-subtle)] mt-0.5">
                Eunoia will launch fullscreen with zero address bar and offline caching.
              </p>
            </div>
          </div>
        </div>

        {/* Benefits badge */}
        <div className="p-3 rounded-2xl bg-[var(--color-accent-soft)] border border-[var(--color-accent)]/20 text-xs text-[var(--color-text-muted)] flex items-center gap-2">
          <Sparkles className="w-4 h-4 shrink-0 text-[var(--color-accent)]" />
          <span>Local-first architecture ensures 100% offline access and instant boot.</span>
        </div>

        <button
          onClick={onClose}
          className="w-full py-2.5 rounded-2xl bg-[var(--color-accent)] text-[var(--color-on-accent)] text-xs font-semibold hover:bg-[var(--color-accent-hover)] transition-colors active:scale-95 shadow-sm"
        >
          Got it
        </button>
      </div>
    </div>
  );
}
