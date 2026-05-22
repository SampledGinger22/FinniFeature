import { createStyles } from 'antd-style';

// A row of color-dot status pills acting as a single-select. Selected pill is tinted with the
// status colors (set inline per status); unselected pills are neutral outlines.
export const useStatusPillSelectStyles = createStyles(({ css, token }) => ({
  group: css`
    display: flex;
    flex-wrap: wrap;
    gap: var(--finni-space-sm);
  `,
  pill: css`
    display: inline-flex;
    align-items: center;
    gap: var(--finni-space-sm);
    padding: var(--finni-space-xs) var(--finni-space-md);
    border: 1px solid ${token.colorBorder};
    border-radius: var(--finni-radius-pill);
    background: ${token.colorBgContainer};
    color: ${token.colorText};
    font: inherit;
    cursor: pointer;
    transition: border-color 0.15s ease, background 0.15s ease;

    &:hover {
      border-color: ${token.colorPrimary};
    }
  `,
  dot: css`
    width: var(--finni-space-sm);
    height: var(--finni-space-sm);
    border-radius: var(--finni-radius-pill);
    flex-shrink: 0;
  `,
}));
