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
  stepper: css`
    display: flex;
    width: 100%;
  `,
  step: css`
    flex: 1 1 0;
    min-width: 0;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: var(--finni-space-xs);
    position: relative;
  `,
  connector: css`
    position: absolute;
    top: calc((var(--finni-space-lg) + var(--finni-space-sm)) / 2 - 1px);
    right: 50%;
    width: 100%;
    height: 2px;
    z-index: 0;
  `,
  connectorDone: css`
    background: ${token.colorPrimary};
  `,
  connectorPending: css`
    background: ${token.colorBorder};
  `,
  circle: css`
    width: calc(var(--finni-space-lg) + var(--finni-space-sm));
    height: calc(var(--finni-space-lg) + var(--finni-space-sm));
    border-radius: var(--finni-radius-pill);
    display: inline-flex;
    align-items: center;
    justify-content: center;
    font-size: ${token.fontSizeSM}px;
    position: relative;
    z-index: 1;
    flex-shrink: 0;
  `,
  circleDone: css`
    background: ${token.colorPrimaryBg};
    color: ${token.colorPrimary};
  `,
  circleCurrent: css`
    background: ${token.colorPrimary};
    color: ${token.colorBgContainer};
    font-weight: 600;
  `,
  circleFuture: css`
    background: ${token.colorFillSecondary};
    color: ${token.colorTextTertiary};
  `,
  stepLabel: css`
    font-size: ${token.fontSizeSM}px;
    text-align: center;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    max-width: 100%;
  `,
  stepLabelMuted: css`
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
