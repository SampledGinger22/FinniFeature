import { createStyles } from 'antd-style';

// Right drawer with a read-first VIEW mode (identity header, lifecycle stepper, contact/address
// cards, recent timeline) and an editable EDIT mode (the patient form). The lateral motion signals
// "inspect a row"; Edit record flips the same drawer into the form.
export const usePatientEditDrawerStyles = createStyles(({ css, token }) => ({
  fullWidth: css`
    width: 100%;
  `,
  header: css`
    display: flex;
    gap: var(--finni-space-md);
    align-items: flex-start;
  `,
  identity: css`
    display: flex;
    flex-direction: column;
    gap: var(--finni-space-xs);
    min-width: 0;
  `,
  name: css`
    margin: 0;
  `,
  metaLine: css`
    color: ${token.colorTextSecondary};
  `,
  pills: css`
    display: flex;
    align-items: center;
    gap: var(--finni-space-sm);
    flex-wrap: wrap;
    margin-top: var(--finni-space-xs);
  `,
  insuredPill: css`
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
  idText: css`
    color: ${token.colorTextTertiary};
    font-size: ${token.fontSizeSM}px;
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
  card: css`
    display: flex;
    gap: var(--finni-space-md);
    align-items: flex-start;
    padding: var(--finni-space-md);
    border: 1px solid ${token.colorBorderSecondary};
    border-radius: var(--finni-radius-md);
    background: ${token.colorBgContainer};
  `,
  cardIcon: css`
    color: ${token.colorTextTertiary};
    margin-top: var(--finni-space-xs);
  `,
  cardLabel: css`
    text-transform: uppercase;
    letter-spacing: 0.06em;
    font-size: ${token.fontSizeSM}px;
    color: ${token.colorTextTertiary};
  `,
  cardValue: css`
    color: ${token.colorText};
  `,
  footer: css`
    display: flex;
    align-items: center;
    gap: var(--finni-space-sm);
  `,
  footerEdit: css`
    margin-left: auto;
  `,
}));
