import { createStyles } from 'antd-style';

// Isolated styles for the demo-controls panel so the parent page imports a single hook
// and the warning border color stays on a token (never a raw hex or px literal).
export const useDemoControlsStyles = createStyles(({ css, token }) => ({
  panel: css`
    border-color: ${token.colorWarning};
    margin-bottom: var(--finni-space-md);
  `,
  subtitle: css`
    color: ${token.colorTextSecondary};
    font-size: ${token.fontSizeSM}px;
    margin-bottom: var(--finni-space-md);
  `,
  actions: css`
    display: flex;
    flex-wrap: wrap;
    gap: var(--finni-space-sm);
    align-items: center;
  `,
}));
