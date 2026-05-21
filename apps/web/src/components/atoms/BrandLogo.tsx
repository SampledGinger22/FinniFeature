import { useState } from 'react';
import finniLogoUrl from '@/assets/brand/finni-logo.svg';
import { finniSpacing } from '@/theme/finniTokens';
import { useBrandLogoStyles } from '@/components/atoms/BrandLogo.styles';

interface BrandLogoProps {
  height?: number;
  onDark?: boolean;
  title?: string;
}

// Renders Finni's real mark with a neutral wordmark fallback (D27); on dark surfaces wraps it in
// a light plate so the orange stays on-brand instead of vanishing.
export function BrandLogo({ height = finniSpacing.xxl, onDark = false, title = 'Finni' }: BrandLogoProps): JSX.Element {
  const { styles } = useBrandLogoStyles();
  const [failed, setFailed] = useState(false);

  if (failed) {
    return (
      <span className={styles.fallback} style={{ fontSize: height }}>
        {title}
      </span>
    );
  }

  const image = (
    <img
      className={styles.image}
      src={finniLogoUrl}
      alt={title}
      style={{ height }}
      onError={() => setFailed(true)}
    />
  );

  return onDark ? <span className={styles.plate}>{image}</span> : image;
}
