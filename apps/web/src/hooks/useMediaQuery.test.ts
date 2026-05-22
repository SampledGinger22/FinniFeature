import { describe, it, expect, vi, afterEach } from 'vitest';
import { act, renderHook } from '@testing-library/react';
import { useMediaQuery } from '@/hooks/useMediaQuery';

const realMatchMedia = window.matchMedia;

afterEach(() => {
  window.matchMedia = realMatchMedia;
});

// Installs a controllable matchMedia and returns a fire() to simulate a breakpoint change.
function mockMatchMedia(initial: boolean): { fire: (matches: boolean) => void } {
  let handler: ((event: MediaQueryListEvent) => void) | null = null;
  const list = {
    matches: initial,
    addEventListener: (_type: string, listener: (event: MediaQueryListEvent) => void) => {
      handler = listener;
    },
    removeEventListener: vi.fn(),
  };
  window.matchMedia = vi.fn().mockReturnValue(list) as unknown as typeof window.matchMedia;
  return {
    fire: (matches: boolean) => {
      list.matches = matches;
      handler?.({ matches } as MediaQueryListEvent);
    },
  };
}

describe('useMediaQuery', () => {
  it('returns the initial match state', () => {
    mockMatchMedia(true);
    const { result } = renderHook(() => useMediaQuery('(max-width: 1024px)'));
    expect(result.current).toBe(true);
  });

  it('updates when the media query changes', () => {
    const { fire } = mockMatchMedia(false);
    const { result } = renderHook(() => useMediaQuery('(max-width: 1024px)'));
    expect(result.current).toBe(false);

    act(() => fire(true));
    expect(result.current).toBe(true);
  });
});
