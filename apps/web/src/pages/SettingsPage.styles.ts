import { createStyles } from 'antd-style';

export const useSettingsPageStyles = createStyles(({ css, token }) => ({
  // Wraps the main preference controls and the demo section with consistent vertical rhythm.
  body: css`
    display: flex;
    flex-direction: column;
    gap: var(--finni-space-lg);
    max-width: ${token.screenLG}px;
  `,
  // Each Card's label column — fixed width keeps the value controls left-aligned in a column.
  labelCol: css`
    width: calc(var(--finni-space-xl) * 5);
    color: ${token.colorTextSecondary};
    font-size: ${token.fontSizeSM}px;
    padding-top: ${token.paddingXS}px;
    flex-shrink: 0;
  `,
  // Inline helper text rendered below a control to provide ambient feedback.
  helperText: css`
    font-size: ${token.fontSizeSM}px;
    color: ${token.colorTextTertiary};
    margin-top: ${token.marginXXS}px;
  `,
  // Row inside a Card for one label + control pair.
  formRow: css`
    display: flex;
    align-items: flex-start;
    gap: var(--finni-space-md);
    padding: ${token.paddingSM}px 0;
    border-bottom: ${token.lineWidth}px ${token.lineType} ${token.colorBorderSecondary};

    &:last-child {
      border-bottom: none;
      padding-bottom: 0;
    }

    &:first-child {
      padding-top: 0;
    }
  `,
  // Stretches the control side so selects/inputs reach a natural width.
  controlCol: css`
    flex: 1;
    display: flex;
    flex-direction: column;
  `,
}));
