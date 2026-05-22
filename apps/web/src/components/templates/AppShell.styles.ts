import { createStyles } from 'antd-style';

export const useAppShellStyles = createStyles(({ css, token }) => ({
  shell: css`
    display: flex;
    min-height: 100vh;
    background: ${token.colorBgLayout};
  `,
  sidebar: css`
    width: var(--finni-sidebar-w);
    flex-shrink: 0;
    position: sticky;
    top: 0;
    height: 100vh;
    box-sizing: border-box;
    display: flex;
    flex-direction: column;
    gap: var(--finni-space-lg);
    padding: var(--finni-space-lg) var(--finni-space-md);
    background: ${token.colorBgContainer};
    border-right: 1px solid ${token.colorBorderSecondary};
    transition: width 0.18s ease;
  `,
  sidebarCollapsed: css`
    width: var(--finni-sidebar-w-collapsed);
  `,
  brandRow: css`
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: var(--finni-space-sm);
    min-height: var(--finni-space-xl);
  `,
  collapseToggle: css`
    flex-shrink: 0;
    color: ${token.colorTextTertiary};
  `,
  nav: css`
    display: flex;
    flex-direction: column;
    gap: var(--finni-space-xs);
  `,
  navItem: css`
    display: flex;
    align-items: center;
    gap: var(--finni-space-sm);
    width: 100%;
    box-sizing: border-box;
    padding: var(--finni-space-sm) var(--finni-space-md);
    border: none;
    border-left: var(--finni-space-xs) solid transparent;
    border-radius: var(--finni-radius-md);
    background: transparent;
    color: ${token.colorText};
    font-size: var(--finni-font-size);
    text-align: left;
    cursor: pointer;
    transition: background 0.15s ease, color 0.15s ease;

    &:hover {
      background: ${token.colorFillTertiary};
    }
  `,
  navItemActive: css`
    background: ${token.colorPrimaryBg};
    border-left-color: ${token.colorPrimary};
    color: ${token.colorPrimary};
    font-weight: 600;

    &:hover {
      background: ${token.colorPrimaryBg};
    }
  `,
  navItemCollapsed: css`
    justify-content: center;
    padding-left: var(--finni-space-sm);
    padding-right: var(--finni-space-sm);
  `,
  navIcon: css`
    font-size: var(--finni-font-size);
    line-height: 0;
  `,
  navLabel: css`
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  `,
  footer: css`
    margin-top: auto;
    display: flex;
    flex-direction: column;
    gap: var(--finni-space-md);
  `,
  footerDivider: css`
    height: 1px;
    background: ${token.colorBorderSecondary};
  `,
  main: css`
    flex: 1;
    min-width: 0;
    box-sizing: border-box;
    padding: var(--finni-space-xl);
    display: flex;
    flex-direction: column;
    gap: var(--finni-space-lg);
  `,
  mainInner: css`
    width: 100%;
    max-width: var(--finni-content-max-w);
    margin: 0 auto;
    display: flex;
    flex-direction: column;
    gap: var(--finni-space-lg);
  `,
}));
