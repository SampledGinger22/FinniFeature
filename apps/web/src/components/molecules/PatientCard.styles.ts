import { createStyles } from 'antd-style';

export const usePatientCardStyles = createStyles(({ css, token }) => ({
  card: css`
    cursor: pointer;
    height: 100%;
  `,
  body: css`
    display: flex;
    gap: var(--finni-space-md);
    align-items: flex-start;
  `,
  details: css`
    display: flex;
    flex-direction: column;
    gap: var(--finni-space-xs);
    min-width: 0;
    flex: 1;
  `,
  name: css`
    font-weight: 600;
    color: ${token.colorText};
  `,
  meta: css`
    color: ${token.colorTextSecondary};
    font-size: var(--finni-font-size);
  `,
  tags: css`
    display: flex;
    gap: var(--finni-space-xs);
    align-items: center;
    flex-wrap: wrap;
  `,
}));
