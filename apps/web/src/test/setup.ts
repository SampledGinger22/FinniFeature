// Extends Vitest expect with jest-dom matchers for component tests.
import '@testing-library/jest-dom/vitest';
import { vi } from 'vitest';

// antd reads responsive breakpoints via window.matchMedia, which jsdom does not implement.
// Stub it (no-op listeners) so antd components render under the test environment.
if (typeof window !== 'undefined' && typeof window.matchMedia !== 'function') {
  window.matchMedia = (query: string): MediaQueryList =>
    ({
      matches: false,
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }) as unknown as MediaQueryList;
}
