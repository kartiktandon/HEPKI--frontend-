import React from 'react';
import Image from 'next/image';

export default function HepkiLogo({
  size = 'default',
  showText = true,
  className = '',
  light = false,
}: {
  size?: 'small' | 'default' | 'large';
  showText?: boolean;
  className?: string;
  light?: boolean;
}) {
  const iconConfig = {
    small: { dim: 28, radius: 7, font: '18px', gap: '8px' },
    default: { dim: 36, radius: 9, font: '22px', gap: '10px' },
    large: { dim: 44, radius: 11, font: '28px', gap: '12px' },
  }[size];

  const textColor = light ? '#ffffff' : '#4353ff';

  return (
    <span
      className={`hepkiLogoWrapper ${className}`}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: iconConfig.gap,
        textDecoration: 'none',
        verticalAlign: 'middle',
      }}
    >
      <span
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: iconConfig.dim,
          height: iconConfig.dim,
          borderRadius: `${iconConfig.radius}px`,
          overflow: 'hidden',
          flexShrink: 0,
          boxShadow: '0 2px 8px rgba(59, 90, 254, 0.25)',
        }}
      >
        <Image
          src="/assets/hepki-logo.png"
          alt="Hepki"
          width={iconConfig.dim}
          height={iconConfig.dim}
          priority
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            display: 'block',
          }}
        />
      </span>

      {showText && (
        <span
          className="hepkiLogoText"
          style={{
            fontFamily: 'Inter, system-ui, -apple-system, sans-serif',
            fontSize: iconConfig.font,
            fontWeight: 800,
            letterSpacing: '-0.035em',
            color: textColor,
            lineHeight: 1,
            display: 'inline-block',
          }}
        >
          Hepki
        </span>
      )}
    </span>
  );
}
