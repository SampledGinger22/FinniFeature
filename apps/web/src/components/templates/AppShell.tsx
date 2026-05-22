import type { ReactNode } from 'react';
import { Button, Tooltip } from 'antd';
import {
  AppstoreOutlined,
  CalendarOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  SettingOutlined,
} from '@ant-design/icons';
import { useLocation, useNavigate } from 'react-router-dom';
import { BrandLogo } from '@/components/atoms/BrandLogo';
import { ProviderIdentityChip } from '@/components/atoms/ProviderIdentityChip';
import { usePreferencesStore } from '@/state/usePreferencesStore';
import { useMediaQuery } from '@/hooks/useMediaQuery';
import { finniLayout } from '@/theme/finniTokens';
import { useAppShellStyles } from '@/components/templates/AppShell.styles';

interface AppShellNavItem {
  path: string;
  label: string;
  icon: ReactNode;
}

// Real, working destinations only — Inbox/Reports from the reference are omitted until they exist.
const shellNavItems: readonly AppShellNavItem[] = [
  { path: '/', label: 'Caseload', icon: <AppstoreOutlined /> },
  { path: '/your-day', label: 'Your day', icon: <CalendarOutlined /> },
];

const SETTINGS_PATH = '/settings';

interface AppShellProps {
  children: ReactNode;
}

// The persistent workspace frame: a collapsible left sidebar (brand, nav, pinned Settings, the
// provider chip) beside a scrolling main column. Every page renders inside one main content area,
// replacing the per-page header/nav each page used to carry.
export function AppShell({ children }: AppShellProps): JSX.Element {
  const { styles, cx } = useAppShellStyles();
  const navigate = useNavigate();
  const location = useLocation();
  const userCollapsed = usePreferencesStore((state) => state.sidebarCollapsed);
  const toggleSidebar = usePreferencesStore((state) => state.toggleSidebar);

  // Below the breakpoint the sidebar auto-collapses to an icon rail so the data stays in view; the
  // manual toggle is hidden there since collapse is enforced by width, not preference.
  const isNarrow = useMediaQuery(`(max-width: ${finniLayout.collapseBreakpoint}px)`);
  const collapsed = userCollapsed || isNarrow;

  // Trash lives under the Settings area, so Settings stays highlighted while viewing it.
  const isActive = (path: string): boolean =>
    path === SETTINGS_PATH ? location.pathname === SETTINGS_PATH || location.pathname === '/trash' : location.pathname === path;

  const renderNavButton = (path: string, label: string, icon: ReactNode): JSX.Element => {
    const active = isActive(path);
    const button = (
      <button
        type="button"
        className={cx(styles.navItem, active && styles.navItemActive, collapsed && styles.navItemCollapsed)}
        aria-label={label}
        aria-current={active ? 'page' : undefined}
        onClick={() => navigate(path)}
      >
        <span className={styles.navIcon}>{icon}</span>
        {!collapsed && <span className={styles.navLabel}>{label}</span>}
      </button>
    );
    return collapsed ? (
      <Tooltip key={path} title={label} placement="right">
        {button}
      </Tooltip>
    ) : (
      <span key={path}>{button}</span>
    );
  };

  return (
    <div className={styles.shell}>
      <aside className={cx(styles.sidebar, collapsed && styles.sidebarCollapsed)} aria-label="Primary">
        <div className={cx(styles.brandRow, collapsed && styles.brandRowCollapsed)}>
          {!collapsed && <BrandLogo />}
          {!isNarrow && (
            <Button
              type="text"
              className={styles.collapseToggle}
              icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
              aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
              onClick={toggleSidebar}
            />
          )}
        </div>

        <nav className={styles.nav} aria-label="Workspace">
          {shellNavItems.map((item) => renderNavButton(item.path, item.label, item.icon))}
        </nav>

        <div className={styles.footer}>
          <div className={styles.footerDivider} />
          {renderNavButton(SETTINGS_PATH, 'Settings', <SettingOutlined />)}
          <ProviderIdentityChip collapsed={collapsed} />
        </div>
      </aside>

      <main className={styles.main}>
        <div className={styles.mainInner}>{children}</div>
      </main>
    </div>
  );
}
