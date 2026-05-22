import type { ThemePalette } from '@finni/shared';
import { finniAvatarSilhouette, finniLayout, finniRadius, finniSpacing, finniStatusColors } from '@/theme/finniTokens';

// Bridges tokens that antd's theme object does not carry (status colors, radii, spacing) to
// :root custom properties, so custom primitives reference var(--finni-*) instead of raw values
// (C6/C9). ThemeProvider rewrites these on every palette change — switching is an instant swap.
export const buildFinniCssVariables = (palette: ThemePalette): Record<string, string> => {
  const vars: Record<string, string> = {
    '--finni-radius-sm': `${finniRadius.sm}px`,
    '--finni-radius-md': `${finniRadius.md}px`,
    '--finni-radius-lg': `${finniRadius.lg}px`,
    '--finni-radius-pill': `${finniRadius.pill}px`,
    '--finni-space-xs': `${finniSpacing.xs}px`,
    '--finni-space-sm': `${finniSpacing.sm}px`,
    '--finni-space-md': `${finniSpacing.md}px`,
    '--finni-space-lg': `${finniSpacing.lg}px`,
    '--finni-space-xl': `${finniSpacing.xl}px`,
    '--finni-sidebar-w': `${finniLayout.sidebarWidth}px`,
    '--finni-sidebar-w-collapsed': `${finniLayout.sidebarCollapsedWidth}px`,
    '--finni-avatar-silhouette': finniAvatarSilhouette,
  };
  for (const [status, set] of Object.entries(finniStatusColors[palette])) {
    vars[`--finni-status-${status}-fg`] = set.fg;
    vars[`--finni-status-${status}-bg`] = set.bg;
  }
  return vars;
};
