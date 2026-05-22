import { Avatar } from 'antd';
import type { PatientStatus } from '@finni/shared';
import { USE_HEADSHOTS } from '@/config/appConfig';
import { finniAvatarColors } from '@/theme/finniTokens';
import { usePatientAvatarStyles } from '@/components/atoms/PatientAvatar.styles';

// Deterministic so a patient always gets the same fallback color (a card and a table can never
// disagree). Plain string hash → index into the fixed avatar ring.
export function pickAvatarColor(seed: string): string {
  let hash = 0;
  for (let index = 0; index < seed.length; index += 1) {
    hash = (hash * 31 + seed.charCodeAt(index)) | 0;
  }
  // The modulo guarantees an in-range index; the assertion satisfies noUncheckedIndexedAccess.
  return finniAvatarColors[Math.abs(hash) % finniAvatarColors.length]!;
}

function PatientSilhouette(): JSX.Element {
  return (
    <svg viewBox="0 0 24 24" width="62%" height="62%" fill="currentColor" aria-hidden="true">
      <path d="M12 12a5 5 0 1 0 0-10 5 5 0 0 0 0 10Zm0 2c-5 0-9 2.7-9 6v2h18v-2c0-3.3-4-6-9-6Z" />
    </svg>
  );
}

interface PatientAvatarProps {
  seed: string;
  src?: string;
  size?: number | 'small' | 'default' | 'large';
  alt?: string;
  initials?: string;
  status?: PatientStatus;
  shape?: 'circle' | 'square';
}

// Headshot when USE_HEADSHOTS is on and a src exists (D26); otherwise a fallback. The fallback is
// an initials monogram tinted by status (dense rows) when initials are given, else the deterministic
// colored silhouette. The flag forces the fallback app-wide when seeded photos render poorly.
export function PatientAvatar({
  seed,
  src,
  size = 'default',
  alt,
  initials,
  status,
  shape = 'square',
}: PatientAvatarProps): JSX.Element {
  const colors =
    status !== undefined
      ? { background: `var(--finni-status-${status}-bg)`, foreground: `var(--finni-status-${status}-fg)` }
      : { background: pickAvatarColor(seed), foreground: 'var(--finni-avatar-silhouette)' };
  const { styles } = usePatientAvatarStyles(colors);
  const label = alt ?? seed;

  if (USE_HEADSHOTS && src !== undefined) {
    return <Avatar shape={shape} size={size} src={src} alt={label} />;
  }
  return (
    <Avatar shape={shape} size={size} className={styles.fallback} alt={label}>
      {initials ?? <PatientSilhouette />}
    </Avatar>
  );
}
