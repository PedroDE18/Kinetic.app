import { useEffect } from 'react';

/**
 * Hook to lock body scroll when a modal or dialog is open,
 * preventing scroll chaining and background bleed.
 */
export function useBodyScrollLock(isLocked: boolean = true) {
  useEffect(() => {
    if (!isLocked) return;

    const originalOverflow = document.body.style.overflow;
    const originalTouchAction = document.body.style.touchAction;

    document.body.style.overflow = 'hidden';
    document.body.style.touchAction = 'none';

    return () => {
      document.body.style.overflow = originalOverflow;
      document.body.style.touchAction = originalTouchAction;
    };
  }, [isLocked]);
}
