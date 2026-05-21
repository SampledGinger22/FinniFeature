import { createStyles } from 'antd-style';

export const useYourDayPageStyles = createStyles(({ css, token }) => ({
  page: css`
    min-height: 100vh;
    padding: var(--finni-space-xl);
    display: flex;
    flex-direction: column;
    gap: var(--finni-space-lg);
    background: ${token.colorBgLayout};
  `,
  header: css`
    display: flex;
    align-items: center;
    gap: var(--finni-space-lg);
  `,
  title: css`
    margin: 0;
  `,
  nav: css`
    margin-left: auto;
  `,
  content: css`
    display: flex;
    flex-direction: column;
    gap: var(--finni-space-lg);
  `,
}));
