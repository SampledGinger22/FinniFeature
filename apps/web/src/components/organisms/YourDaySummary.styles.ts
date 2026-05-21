import { createStyles } from 'antd-style';

export const useYourDaySummaryStyles = createStyles(({ css, token }) => ({
  section: css`
    display: flex;
    flex-direction: column;
    gap: var(--finni-space-lg);
  `,
  statsRow: css`
    display: flex;
    flex-wrap: wrap;
    gap: var(--finni-space-md);
  `,
  statCard: css`
    flex: 1 1 var(--finni-space-xl);
    min-width: 120px;
  `,
  statusGrid: css`
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
    gap: var(--finni-space-md);
  `,
  attentionList: css`
    display: flex;
    flex-direction: column;
    gap: var(--finni-space-sm);
  `,
  attentionName: css`
    font-weight: ${token.fontWeightStrong};
  `,
  sectionTitle: css`
    margin: 0;
    color: ${token.colorTextSecondary};
    font-size: ${token.fontSizeSM}px;
    text-transform: uppercase;
    letter-spacing: 0.05em;
  `,
}));
