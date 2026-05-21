import { createStyles } from 'antd-style';

// Dense table layout for the caseload; row hover uses antd's built-in cursor style via
// the `rowClassName` pointer helper. Name cell aligns avatar + text without overflow.
export const useCaseloadTableViewStyles = createStyles(({ css, token }) => ({
  nameCell: css`
    display: flex;
    align-items: center;
    gap: var(--finni-space-sm);
  `,
  nameCellText: css`
    font-weight: 600;
    color: ${token.colorText};
  `,
  locationText: css`
    color: ${token.colorTextSecondary};
  `,
  tableRow: css`
    cursor: pointer;
  `,
}));
