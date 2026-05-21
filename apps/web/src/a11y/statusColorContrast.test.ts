import { describe, expect, it } from 'vitest';
import { ThemePalette } from '@finni/shared';
import { finniSeeds, finniStatusColors } from '@/theme/finniTokens';

// WCAG 2.1 relative-luminance contrast. Codifies D23 (every status color passes AA) so a future
// palette edit that breaks contrast fails CI instead of shipping. Lives outside theme/ because
// the WCAG coefficients below are math, not style tokens (the C6 lint targets style files).
const channel = (value: number): number => {
  const c = value / 255;
  return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
};
const luminance = (hex: string): number => {
  const n = Number.parseInt(hex.slice(1), 16);
  return 0.2126 * channel((n >> 16) & 255) + 0.7152 * channel((n >> 8) & 255) + 0.0722 * channel(n & 255);
};
const contrast = (a: string, b: string): number => {
  const la = luminance(a);
  const lb = luminance(b);
  return (Math.max(la, lb) + 0.05) / (Math.min(la, lb) + 0.05);
};

const AA_NORMAL = 4.5;

describe('status colors meet WCAG AA on their own tag background', () => {
  for (const palette of Object.values(ThemePalette)) {
    for (const [status, set] of Object.entries(finniStatusColors[palette])) {
      it(`${palette} / ${status}`, () => {
        expect(contrast(set.fg, set.bg)).toBeGreaterThanOrEqual(AA_NORMAL);
      });
    }
  }
});

describe('primary button uses dark ink, not white (D22)', () => {
  for (const palette of Object.values(ThemePalette)) {
    it(`${palette}: ink on orange passes AA, white on orange does not`, () => {
      const seed = finniSeeds[palette];
      expect(contrast(seed.colorPrimaryInk, seed.colorPrimary)).toBeGreaterThanOrEqual(AA_NORMAL);
      expect(contrast('#ffffff', seed.colorPrimary)).toBeLessThan(AA_NORMAL);
    });
  }
});
