import React from 'react';

import faroIconLight from '@/assets/faro-icon-light.svg';
import faroIconDark from '@/assets/faro-icon-dark.svg';
import faroLogoLight from '@/assets/faro-logo-full-light.svg';
import faroLogoDark from '@/assets/faro-logo-full-dark.svg';
import faroWordmark from '@/assets/faro-wordmark-light.svg';

type LogoVariant = 'icon' | 'full' | 'wordmark';

interface LogoProps {
  variant?: LogoVariant;
  theme?: 'light' | 'dark';
  height?: number;
  style?: React.CSSProperties;
}

export function Logo({ variant = 'full', theme = 'light', height = 40, style }: LogoProps) {
  const src = {
    icon: theme === 'dark' ? faroIconDark : faroIconLight,
    full: theme === 'dark' ? faroLogoDark : faroLogoLight,
    wordmark: faroWordmark,
  }[variant];

  return (
    <img
      src={src}
      alt="faro."
      height={height}
      style={{ display: 'block', ...style }}
    />
  );
}
