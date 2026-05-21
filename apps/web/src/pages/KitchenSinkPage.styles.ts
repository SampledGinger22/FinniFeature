import { createStyles } from 'antd-style';

// The kitchen sink is the visual-regression surface (§14): every primitive in every state, plus
// live theme controls. All spacing/colors come from tokens so a palette switch restyles it whole.
export const useKitchenSinkStyles = createStyles(({ css, token }) => ({
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
    justify-content: space-between;
    flex-wrap: wrap;
    gap: var(--finni-space-lg);
  `,
  darkPanel: css`
    background: ${token.colorTextBase};
    padding: var(--finni-space-md);
    border-radius: var(--finni-radius-md);
    display: inline-flex;
  `,
  controls: css`
    display: flex;
    flex-wrap: wrap;
    gap: var(--finni-space-xl);
  `,
  control: css`
    display: flex;
    flex-direction: column;
    gap: var(--finni-space-xs);
  `,
  controlLabel: css`
    font-size: var(--finni-font-size);
    color: ${token.colorTextSecondary};
  `,
  row: css`
    display: flex;
    flex-wrap: wrap;
    gap: var(--finni-space-sm);
    align-items: center;
  `,
}));
