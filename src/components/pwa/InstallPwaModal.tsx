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
      <div className="w-full max-w-sm rounded-3xl bg-[var(--color-bg)] text-[var(--color-text)] border border-[var(--color-border)] shadow-2xl overflow-hidden p-5 space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-[var(--color-accent)]/15 text-[var(--color-accent)] flex items-center justify-center">
              <Smartphone className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-semibold text-base">Install on iPhone</h3>
              <p className="text-xs text-[var(--color-text-subtle)]">Add Kinetic to your Home Screen</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center bg-[var(--color-surface-raised)] text-[var(--color-text-muted)]"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Instructions */}
        <div className="space-y-3 pt-1">
          <div className="flex items-start gap-3 p-3 rounded-2xl bg-[var(--color-surface)]  border border-[var(--color-border)]">
            <div className="w-7 h-7 rounded-xl bg-[#EAF2F7] dark:bg-[#1D2B35] text-[#2D6C96] dark:text-[#8ECAE6] flex items-center justify-center font-bold text-xs shrink-0">
              1
            </div>
            <div className="text-xs">
              <p className="font-semibold flex items-center gap-1.5">
                Tap Safari's Share Button <Share className="w-3.5 h-3.5 text-[#2D6C96] inline" />
              </p>
              <p className="text-[var(--color-text-subtle)] mt-0.5">
                At the bottom center of Safari's toolbar on your iPhone.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3 p-3 rounded-2xl bg-[var(--color-surface)]  border border-[var(--color-border)]">
            <div className="w-7 h-7 rounded-xl bg-[#FDF0EE] dark:bg-[#341F1C] text-[#C85A32] dark:text-[var(--color-accent)] flex items-center justify-center font-bold text-xs shrink-0">
              2
            </div>
            <div className="text-xs">
              <p className="font-semibold flex items-center gap-1.5">
                Tap "Add to Home Screen" <PlusSquare className="w-3.5 h-3.5 text-[#C85A32] inline" />
              </p>
              <p className="text-[var(--color-text-subtle)] mt-0.5">
                Scroll down the share sheet and tap the Add to Home Screen option.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3 p-3 rounded-2xl bg-[var(--color-surface)]  border border-[var(--color-border)]">
            <div className="w-7 h-7 rounded-xl bg-[#EEF5EE] dark:bg-[#1E2E22] text-[var(--color-success)] flex items-center justify-center font-bold text-xs shrink-0">
              3
            </div>
            <div className="text-xs">
              <p className="font-semibold flex items-center gap-1.5">
                Tap "Add" in Top Right
              </p>
              <p className="text-[var(--color-text-subtle)] mt-0.5">
                Kinetic will launch fullscreen like a native iOS app with zero Safari URL bar!
              </p>
            </div>
          </div>
        </div>

        {/* Benefits badge */}
        <div className="p-3 rounded-2xl bg-[#FEF8E7] dark:bg-[#2A2416] border border-[#F6E3B5] dark:border-[#4D3F1D] text-xs text-[#7A5B0B] dark:text-[#E8CD82] flex items-center gap-2">
          <Sparkles className="w-4 h-4 shrink-0 text-[var(--color-accent)]" />
          <span>Works offline with full local storage and instantaneous launches.</span>
        </div>

        <button
          onClick={onClose}
          className="w-full py-2.5 rounded-2xl bg-[var(--color-accent)] text-[var(--color-on-accent)] text-xs font-semibold hover:bg-[var(--color-accent-hover)] transition-colors"
        >
          Got it
        </button>
      </div>
    </div>
  );
}
