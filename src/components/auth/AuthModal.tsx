import React from 'react';
import { X } from 'lucide-react';
import { AuthScreen } from './AuthScreen';
import { useBodyScrollLock } from '../../utils/useBodyScrollLock';

interface AuthModalProps {
  onClose: () => void;
  onSuccess?: () => void;
}

export function AuthModal({ onClose, onSuccess }: AuthModalProps) {
  useBodyScrollLock(true);

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
      <div className="relative w-full max-w-sm max-h-[95vh] overflow-y-auto">
        <button
          onClick={onClose}
          aria-label="Close authentication"
          className="absolute top-4 right-4 z-20 w-8 h-8 rounded-full bg-[var(--color-surface-raised)] border border-[var(--color-border)] text-[var(--color-text-muted)] hover:text-[var(--color-text)] flex items-center justify-center transition-all"
        >
          <X className="w-4 h-4" />
        </button>
        <AuthScreen
          onSuccess={() => {
            if (onSuccess) onSuccess();
            onClose();
          }}
        />
      </div>
    </div>
  );
}
