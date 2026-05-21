import { createStyles } from 'antd-style';
import type { PatientStatus } from '@finni/shared';

// Reads the per-status CSS vars ThemeProvider injects, so a palette switch restyles every tag
// instantly. Border is a translucent mix of the foreground — no separate token needed.
export const useStatusTagStyles = createStyles(({ css }, status: PatientStatus) => ({
  tag: css`
    margin: 0;
    border-radius: var(--finni-radius-pill);
    border-style: solid;
    border-width: 1px;
    font-weight: 600;
    color: var(--finni-status-${status}-fg);
    background: var(--finni-status-${status}-bg);
    border-color: color-mix(in srgb, var(--finni-status-${status}-fg) 26%, transparent);
  `,
}));
