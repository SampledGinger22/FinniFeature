import { describe, expect, it } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useReturnFocus } from '@/hooks/useReturnFocus';

describe('useReturnFocus', () => {
  it('captures the focused trigger on open and restores focus to it on close', () => {
    const trigger = document.createElement('button');
    document.body.appendChild(trigger);
    trigger.focus();

    const { rerender } = renderHook(({ open }) => useReturnFocus(open), {
      initialProps: { open: false },
    });

    // Opening captures the trigger; the overlay then steals focus (simulated by another control).
    rerender({ open: true });
    const overlayControl = document.createElement('input');
    document.body.appendChild(overlayControl);
    overlayControl.focus();
    expect(document.activeElement).toBe(overlayControl);

    // Closing returns focus to the original trigger.
    rerender({ open: false });
    expect(document.activeElement).toBe(trigger);
  });

  it('does nothing while it stays closed', () => {
    const other = document.createElement('input');
    document.body.appendChild(other);
    other.focus();

    const { rerender } = renderHook(({ open }) => useReturnFocus(open), {
      initialProps: { open: false },
    });
    rerender({ open: false });
    expect(document.activeElement).toBe(other);
  });
});
