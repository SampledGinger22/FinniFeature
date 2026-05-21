import { createStyles } from 'antd-style';

export const usePatientEditDrawerStyles = createStyles(({ css, token }) => ({
  readonlyRow: css`
    display: flex;
    flex-direction: column;
    gap: var(--finni-space-xs);
    margin-bottom: var(--finni-space-lg);
  `,
  readonlyLabel: css`
    color: ${token.colorTextSecondary};
    font-size: var(--finni-font-size);
  `,
  footer: css`
    display: flex;
    justify-content: flex-end;
    gap: var(--finni-space-sm);
  `,
}));
