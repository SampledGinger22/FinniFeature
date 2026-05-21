import { createStyles } from 'antd-style';

export const usePatientEditDrawerStyles = createStyles(({ css }) => ({
  fullWidth: css`
    width: 100%;
  `,
  footer: css`
    display: flex;
    justify-content: flex-end;
    gap: var(--finni-space-sm);
  `,
}));
