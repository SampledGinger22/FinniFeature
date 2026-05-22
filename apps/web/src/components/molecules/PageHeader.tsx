import type { ReactNode } from 'react';
import { Typography } from 'antd';
import { usePageHeaderStyles } from '@/components/molecules/PageHeader.styles';

interface PageHeaderProps {
  title: string;
  eyebrow?: string;
  actions?: ReactNode;
}

// Shared page-header treatment: a small uppercase eyebrow above the page title, with an optional
// right-aligned actions slot (view switcher, primary buttons). Used by every workspace page.
export function PageHeader({ title, eyebrow = 'Provider Workspace', actions }: PageHeaderProps): JSX.Element {
  const { styles } = usePageHeaderStyles();
  return (
    <header className={styles.header}>
      <div className={styles.heading}>
        <span className={styles.eyebrow}>{eyebrow}</span>
        <Typography.Title level={2} className={styles.title}>
          {title}
        </Typography.Title>
      </div>
      {actions !== undefined && <div className={styles.actions}>{actions}</div>}
    </header>
  );
}
