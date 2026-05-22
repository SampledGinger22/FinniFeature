import { Avatar } from 'antd';
import { DEMO_PROVIDER } from '@/config/appConfig';
import { useProviderIdentityChipStyles } from '@/components/atoms/ProviderIdentityChip.styles';

interface ProviderIdentityChipProps {
  collapsed?: boolean;
}

// The signed-in clinician stand-in in the sidebar footer (no auth exists, D7). Collapsed shows
// only the initialed avatar; expanded adds the name and credential line.
export function ProviderIdentityChip({ collapsed = false }: ProviderIdentityChipProps): JSX.Element {
  const { styles } = useProviderIdentityChipStyles();
  return (
    <div className={styles.chip}>
      <Avatar shape="square" className={styles.avatar} alt={DEMO_PROVIDER.name}>
        {DEMO_PROVIDER.initials}
      </Avatar>
      {!collapsed && (
        <span className={styles.identity}>
          <span className={styles.name}>{DEMO_PROVIDER.name}</span>
          <span className={styles.credential}>{DEMO_PROVIDER.credential}</span>
        </span>
      )}
    </div>
  );
}
