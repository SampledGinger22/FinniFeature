import { createStyles } from 'antd-style';

export const useCaseloadViewStyles = createStyles(({ css }) => ({
  grid: css`
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
    gap: var(--finni-space-md);
  `,
}));
