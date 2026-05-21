import { describe, expect, it } from 'vitest';
import { render } from '@testing-library/react';
import { finniAvatarColors } from '@/theme/finniTokens';
import { PatientAvatar, pickAvatarColor } from '@/components/atoms/PatientAvatar';

describe('pickAvatarColor', () => {
  it('is deterministic for the same seed', () => {
    expect(pickAvatarColor('Avery Johnson')).toBe(pickAvatarColor('Avery Johnson'));
  });

  it('always returns a color from the fixed ring', () => {
    for (const seed of ['a', 'Mateo Garcia', 'zzz', '12345', '']) {
      expect(finniAvatarColors).toContain(pickAvatarColor(seed));
    }
  });
});

describe('PatientAvatar', () => {
  it('renders the silhouette fallback when no headshot src is given', () => {
    const { container } = render(<PatientAvatar seed="No photo" />);
    expect(container.querySelector('svg')).not.toBeNull();
    expect(container.querySelector('img')).toBeNull();
  });

  it('renders a headshot img when a src is given (USE_HEADSHOTS on by default)', () => {
    const src = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg"/>';
    const { container } = render(<PatientAvatar seed="With photo" src={src} />);
    const img = container.querySelector('img');
    expect(img).not.toBeNull();
    expect(img?.getAttribute('src')).toBe(src);
  });
});
