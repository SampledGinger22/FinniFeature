import { createStyles } from 'antd-style';

export const useCaseloadFilterBarStyles = createStyles(({ css, token }) => ({
  bar: css`
    display: flex;
    flex-wrap: wrap;
    gap: var(--finni-space-md);
    align-items: flex-end;
  `,
  control: css`
    flex: 1 1 ${token.controlHeight * token.sizeStep}px;
  `,
  ageControl: css`
    display: flex;
    flex-direction: column;
    gap: var(--finni-space-xs);
    flex: 1 1 ${token.controlHeight * token.sizeStep}px;
  `,
  ageSlider: css`
    width: 100%;
  `,
  label: css`
    color: ${token.colorTextSecondary};
    font-size: ${token.fontSizeSM}px;
  `,
  spacer: css`
    flex: 1 1 auto;
  `,
  count: css`
    color: ${token.colorTextSecondary};
  `,
}));
