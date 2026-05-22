import { createStyles } from 'antd-style';

// Redesigned caseload rows: a status-tinted initials avatar, a bold name with an optional archived
// flag, a status pill, location, an insurance pill, a derived attention note, and a trailing
// chevron with hover-revealed row actions.
export const useCaseloadTableViewStyles = createStyles(({ css, token }) => ({
  nameCell: css`
    display: flex;
    align-items: center;
    gap: var(--finni-space-md);
    min-width: 0;
  `,
  nameText: css`
    display: flex;
    flex-direction: column;
    min-width: 0;
  `,
  nameCellText: css`
    font-weight: 600;
    color: ${token.colorText};
  `,
  archivedFlag: css`
    align-self: flex-start;
    margin: 0;
    margin-top: var(--finni-space-xs);
  `,
  locationText: css`
    color: ${token.colorTextSecondary};
  `,
  insurancePill: css`
    display: inline-flex;
    align-items: center;
    gap: var(--finni-space-xs);
    padding: 0 var(--finni-space-sm);
    border-radius: var(--finni-radius-pill);
    border: 1px solid ${token.colorBorderSecondary};
    color: ${token.colorTextSecondary};
    background: ${token.colorFillQuaternary};
    line-height: 1.9;
  `,
  muted: css`
    color: ${token.colorTextTertiary};
  `,
  attentionCell: css`
    display: inline-flex;
    align-items: center;
    gap: var(--finni-space-sm);
    color: ${token.colorWarningText};
  `,
  attentionDot: css`
    width: var(--finni-space-sm);
    height: var(--finni-space-sm);
    border-radius: var(--finni-radius-pill);
    background: ${token.colorWarning};
    flex-shrink: 0;
  `,
  rowTrailing: css`
    display: flex;
    align-items: center;
    justify-content: flex-end;
    gap: var(--finni-space-xs);
  `,
  rowActions: css`
    opacity: 0;
    transition: opacity 0.15s ease;

    .ant-table-row:hover &,
    &:focus-within {
      opacity: 1;
    }
  `,
  chevron: css`
    color: ${token.colorTextTertiary};
    display: inline-flex;
  `,
  tableRow: css`
    cursor: pointer;
  `,
}));
