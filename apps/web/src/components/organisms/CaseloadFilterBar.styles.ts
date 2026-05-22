import { createStyles } from 'antd-style';

// Sentence-style filter panel: a white rounded card holding a natural-language row of inline
// controls, then a second row with the name search, the show-archived toggle, the live count, and
// reset. Connective words are muted text between controls.
export const useCaseloadFilterBarStyles = createStyles(({ css, token }) => ({
  panel: css`
    background: ${token.colorBgContainer};
    border: 1px solid ${token.colorBorderSecondary};
    border-radius: var(--finni-radius-lg);
    padding: var(--finni-space-lg);
    display: flex;
    flex-direction: column;
    gap: var(--finni-space-md);
  `,
  sentence: css`
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: var(--finni-space-sm);
  `,
  connector: css`
    color: ${token.colorTextSecondary};
  `,
  statusControl: css`
    min-width: calc(var(--finni-space-xl) * 7);
    flex: 1 1 auto;
  `,
  control: css`
    min-width: calc(var(--finni-space-xl) * 5);
  `,
  ageGroup: css`
    display: inline-flex;
    align-items: center;
    gap: var(--finni-space-xs);
  `,
  ageInput: css`
    width: calc(var(--finni-space-xl) * 3);
  `,
  row: css`
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: var(--finni-space-md);
  `,
  search: css`
    flex: 1 1 calc(var(--finni-space-xl) * 10);
  `,
  spacer: css`
    flex: 1 1 auto;
  `,
  count: css`
    color: ${token.colorTextSecondary};
    white-space: nowrap;
  `,
}));
