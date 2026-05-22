import { createStyles } from 'antd-style';

// Bottom "compose a new record" drawer: a drag-handle pill, an eyebrow/title/subtitle header, then
// IDENTITY / CONTACT / PRIMARY ADDRESS sections of responsive field grids, and a sticky footer with
// a PHI-at-rest note beside the actions.
export const usePatientCreateDrawerStyles = createStyles(({ css, token }) => ({
  dragHandle: css`
    width: calc(var(--finni-space-xl) * 1.5);
    height: var(--finni-space-xs);
    border-radius: var(--finni-radius-pill);
    background: ${token.colorBorder};
    margin: 0 auto var(--finni-space-md);
  `,
  eyebrow: css`
    text-transform: uppercase;
    letter-spacing: 0.08em;
    font-size: ${token.fontSizeSM}px;
    font-weight: 600;
    color: ${token.colorTextTertiary};
  `,
  title: css`
    margin: var(--finni-space-xs) 0 0;
  `,
  subtitle: css`
    margin: var(--finni-space-xs) 0 0;
    color: ${token.colorTextSecondary};
    max-width: calc(var(--finni-space-xl) * 24);
  `,
  body: css`
    display: flex;
    flex-direction: column;
    gap: var(--finni-space-lg);
  `,
  section: css`
    display: flex;
    flex-direction: column;
    gap: var(--finni-space-sm);
  `,
  sectionLabel: css`
    text-transform: uppercase;
    letter-spacing: 0.08em;
    font-size: ${token.fontSizeSM}px;
    font-weight: 600;
    color: ${token.colorTextTertiary};
  `,
  grid: css`
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(calc(var(--finni-space-xl) * 9), 1fr));
    gap: var(--finni-space-md);
  `,
  fullWidth: css`
    width: 100%;
  `,
  offLabel: css`
    margin-left: var(--finni-space-sm);
    color: ${token.colorTextSecondary};
  `,
  footer: css`
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: var(--finni-space-md);
    flex-wrap: wrap;
  `,
  footerNote: css`
    display: inline-flex;
    align-items: center;
    gap: var(--finni-space-sm);
    color: ${token.colorTextTertiary};
    font-size: ${token.fontSizeSM}px;
  `,
  footerActions: css`
    display: flex;
    gap: var(--finni-space-sm);
    margin-left: auto;
  `,
}));
