import { useEffect, useRef } from 'react';

// Returns keyboard focus to the control that opened an overlay once it closes (WCAG 2.4.3). The
// trigger is captured during the opening render — before the overlay's focus trap moves focus
// inward — and refocused when `open` flips back to false.
export function useReturnFocus(open: boolean): void {
  const triggerRef = useRef<HTMLElement | null>(null);
  if (open && triggerRef.current === null && typeof document !== 'undefined') {
    triggerRef.current = document.activeElement as HTMLElement | null;
  }
  useEffect(() => {
    if (!open && triggerRef.current) {
      triggerRef.current.focus();
      triggerRef.current = null;
    }
  }, [open]);
}
