import { createStyles } from 'antd-style';

export const useCaseloadBoardViewStyles = createStyles(({ css, token }) => ({
  toolbar: css`
    display: flex;
    align-items: center;
    gap: var(--finni-space-sm);
    margin-bottom: var(--finni-space-md);
  `,
  chooser: css`
    min-width: 280px;
  `,
  board: css`
    display: flex;
    gap: var(--finni-space-md);
    align-items: flex-start;
    overflow-x: auto;
    padding-bottom: var(--finni-space-sm);
  `,
  column: css`
    display: flex;
    flex-direction: column;
    gap: var(--finni-space-sm);
    flex: 1 0 auto;
    width: 280px;
    min-width: 280px;
    height: 70vh;
    padding: var(--finni-space-sm);
    border-radius: var(--finni-radius-md);
    background: ${token.colorFillQuaternary};
  `,
  columnOver: css`
    outline: 1px solid ${token.colorPrimaryBorder};
    background: ${token.colorPrimaryBg};
  `,
  columnHeader: css`
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: var(--finni-space-xs);
    font-weight: 600;
    color: ${token.colorText};
  `,
  columnList: css`
    display: flex;
    flex-direction: column;
    gap: var(--finni-space-sm);
    flex: 1 1 auto;
    min-height: 0;
    overflow-y: auto;
  `,
  columnEmpty: css`
    color: ${token.colorTextTertiary};
    font-size: var(--finni-font-size);
    text-align: center;
    padding: var(--finni-space-md) 0;
  `,
  card: css`
    cursor: grab;
    touch-action: none;
  `,
  cardDragging: css`
    opacity: 0.5;
    cursor: grabbing;
  `,
  cardBody: css`
    display: flex;
    gap: var(--finni-space-sm);
    align-items: center;
  `,
  cardDetails: css`
    display: flex;
    flex-direction: column;
    gap: var(--finni-space-xs);
    min-width: 0;
    flex: 1;
  `,
  cardName: css`
    font-weight: 600;
    color: ${token.colorText};
  `,
  cardMeta: css`
    color: ${token.colorTextSecondary};
    font-size: var(--finni-font-size);
  `,
  cardTags: css`
    display: flex;
    gap: var(--finni-space-xs);
    align-items: center;
    flex-wrap: wrap;
  `,
}));
