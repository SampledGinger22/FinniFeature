import { createStyles } from 'antd-style';

export const usePageHeaderStyles = createStyles(({ css, token }) => ({
  header: css`
    display: flex;
    align-items: flex-end;
    justify-content: space-between;
    gap: var(--finni-space-lg);
    flex-wrap: wrap;
  `,
  heading: css`
    display: flex;
    flex-direction: column;
    gap: var(--finni-space-xs);
    min-width: 0;
  `,
  eyebrow: css`
    text-transform: uppercase;
    letter-spacing: 0.08em;
    font-size: ${token.fontSizeSM}px;
    font-weight: 600;
    color: ${token.colorTextTertiary};
  `,
  title: css`
    margin: 0;
  `,
  actions: css`
    display: flex;
    align-items: center;
    gap: var(--finni-space-md);
    flex-wrap: wrap;
  `,
}));
