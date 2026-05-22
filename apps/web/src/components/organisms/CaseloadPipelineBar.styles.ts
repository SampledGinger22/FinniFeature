import { createStyles } from 'antd-style';

// Horizontal pipeline: an eyebrow + live count header above a row of status-tinted, clickable
// segments whose widths are proportional to their counts. Each segment toggles its status filter.
export const useCaseloadPipelineBarStyles = createStyles(({ css, token }) => ({
  section: css`
    display: flex;
    flex-direction: column;
    gap: var(--finni-space-sm);
  `,
  header: css`
    display: flex;
    align-items: baseline;
    gap: var(--finni-space-sm);
    flex-wrap: wrap;
  `,
  eyebrow: css`
    text-transform: uppercase;
    letter-spacing: 0.08em;
    font-size: ${token.fontSizeSM}px;
    font-weight: 600;
    color: ${token.colorTextTertiary};
  `,
  count: css`
    color: ${token.colorTextSecondary};
  `,
  hint: css`
    margin-left: auto;
    color: ${token.colorTextTertiary};
    font-size: ${token.fontSizeSM}px;
  `,
  bar: css`
    display: flex;
    gap: var(--finni-space-xs);
    align-items: stretch;
  `,
  segment: css`
    flex-basis: 0;
    min-width: calc(var(--finni-space-xl) * 3);
    display: flex;
    align-items: center;
    gap: var(--finni-space-sm);
    padding: var(--finni-space-sm) var(--finni-space-md);
    border: 1px solid transparent;
    border-radius: var(--finni-radius-md);
    cursor: pointer;
    overflow: hidden;
    white-space: nowrap;
    font-size: var(--finni-font-size);
    transition: filter 0.15s ease, border-color 0.15s ease;

    &:hover {
      filter: brightness(0.97);
    }
  `,
  segmentActive: css`
    border-color: currentColor;
    font-weight: 600;
  `,
  dot: css`
    width: var(--finni-space-sm);
    height: var(--finni-space-sm);
    border-radius: var(--finni-radius-pill);
    background: currentColor;
    flex-shrink: 0;
  `,
  segmentLabel: css`
    overflow: hidden;
    text-overflow: ellipsis;
  `,
  segmentCount: css`
    margin-left: auto;
    font-weight: 600;
  `,
}));
