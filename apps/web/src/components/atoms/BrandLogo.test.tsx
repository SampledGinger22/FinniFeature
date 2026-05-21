import { describe, expect, it } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { BrandLogo } from '@/components/atoms/BrandLogo';

describe('BrandLogo', () => {
  it('renders the mark as an image with the brand alt text', () => {
    render(<BrandLogo />);
    const image = screen.getByAltText('Finni');
    expect(image.tagName).toBe('IMG');
    expect(image.getAttribute('src')).toBeTruthy();
  });

  it('falls back to a neutral wordmark when the asset fails to load', () => {
    render(<BrandLogo />);
    fireEvent.error(screen.getByAltText('Finni'));
    const fallback = screen.getByText('Finni');
    expect(fallback.tagName).toBe('SPAN');
  });

  it('still renders the mark when placed on a dark surface', () => {
    render(<BrandLogo onDark />);
    expect(screen.getByAltText('Finni').tagName).toBe('IMG');
  });
});
