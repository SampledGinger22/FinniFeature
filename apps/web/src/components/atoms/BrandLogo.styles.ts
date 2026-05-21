import { createStyles } from 'antd-style';

// The mark is single-color orange; on dark surfaces it sits on a light plate so the brand color
// stays legible (§8). The fallback is a neutral wordmark if the asset fails to load.
export const useBrandLogoStyles = createStyles(({ css, token }) => ({
  image: css`
    display: block;
    width: auto;
  `,
  plate: css`
    display: inline-flex;
    padding: var(--finni-space-xs) var(--finni-space-sm);
    border-radius: var(--finni-radius-md);
    background: ${token.colorBgContainer};
  `,
  fallback: css`
    font-weight: 700;
    color: ${token.colorPrimary};
    font-family: var(--finni-font-family);
    letter-spacing: 0.02em;
  `,
}));
