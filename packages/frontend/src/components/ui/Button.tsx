import React from 'react';

type ButtonVariant = 'primary' | 'secondary' | 'ghost';
type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  fullWidth?: boolean;
}

const styles: Record<string, React.CSSProperties> = {
  base: {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    fontFamily: 'var(--font-ui)',
    fontWeight: 500,
    cursor: 'pointer',
    border: 'none',
    borderRadius: 'var(--radius-btn)',
    transition: 'background 0.15s ease, color 0.15s ease, opacity 0.15s ease',
    whiteSpace: 'nowrap',
  },
};

const variantStyles: Record<ButtonVariant, React.CSSProperties> = {
  primary: {
    background: 'var(--color-text-primary)',
    color: 'var(--color-bg)',
  },
  secondary: {
    background: 'transparent',
    color: 'var(--color-ember)',
    border: '1px solid rgba(232, 93, 38, 0.3)',
  },
  ghost: {
    background: 'transparent',
    color: 'var(--color-text-muted)',
    border: '1px solid var(--color-border)',
  },
};

const sizeStyles: Record<ButtonSize, React.CSSProperties> = {
  sm: { height: '32px', padding: '0 12px', fontSize: '13px' },
  md: { height: '40px', padding: '0 20px', fontSize: '14px' },
  lg: { height: '48px', padding: '0 28px', fontSize: '15px' },
};

export function Button({
  variant = 'primary',
  size = 'md',
  loading = false,
  fullWidth = false,
  disabled,
  children,
  style,
  ...props
}: ButtonProps) {
  return (
    <button
      disabled={disabled || loading}
      style={{
        ...styles.base,
        ...variantStyles[variant],
        ...sizeStyles[size],
        ...(fullWidth ? { width: '100%' } : {}),
        ...(disabled || loading ? { opacity: 0.5, cursor: 'not-allowed' } : {}),
        ...style,
      }}
      {...props}
    >
      {loading ? <span style={{ opacity: 0.7 }}>...</span> : children}
    </button>
  );
}
