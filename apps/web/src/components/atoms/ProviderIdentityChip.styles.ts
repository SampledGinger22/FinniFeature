import { createStyles } from 'antd-style';

export const useProviderIdentityChipStyles = createStyles(({ css, token }) => ({
  chip: css`
    display: flex;
    align-items: center;
    gap: var(--finni-space-sm);
    min-width: 0;
  `,
  chipCollapsed: css`
    justify-content: center;
  `,
  avatar: css`
    background: ${token.colorPrimary};
    color: ${token.colorBgContainer};
    flex-shrink: 0;
    font-weight: 600;
  `,
  identity: css`
    display: flex;
    flex-direction: column;
    min-width: 0;
  `,
  name: css`
    font-weight: 600;
    color: ${token.colorText};
    line-height: 1.2;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  `,
  credential: css`
    color: ${token.colorTextSecondary};
    font-size: ${token.fontSizeSM}px;
    line-height: 1.2;
  `,
}));
