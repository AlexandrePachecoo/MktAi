import React from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
}

export function Input({ label, error, hint, id, style, ...props }: InputProps) {
  const inputId = id ?? label?.toLowerCase().replace(/\s+/g, '-');

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
      {label && (
        <label
          htmlFor={inputId}
          style={{
            fontFamily: 'var(--font-ui)',
            fontSize: '12px',
            fontWeight: 500,
            color: 'var(--color-text-muted)',
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
          }}
        >
          {label}
        </label>
      )}
      <input
        id={inputId}
        style={{
          fontFamily: 'var(--font-ui)',
          fontSize: '14px',
          height: '44px',
          padding: '0 14px',
          borderRadius: 'var(--radius-btn)',
          border: `1px solid ${error ? 'var(--color-ember)' : 'var(--color-border)'}`,
          background: 'var(--color-bg-card)',
          color: 'var(--color-text-primary)',
          outline: 'none',
          transition: 'border-color 0.15s ease',
          width: '100%',
          ...style,
        }}
        onFocus={(e) => {
          e.currentTarget.style.borderColor = 'var(--color-ember)';
          props.onFocus?.(e);
        }}
        onBlur={(e) => {
          e.currentTarget.style.borderColor = error
            ? 'var(--color-ember)'
            : 'var(--color-border)';
          props.onBlur?.(e);
        }}
        {...props}
      />
      {error && (
        <span style={{ fontSize: '12px', color: 'var(--color-ember)' }}>{error}</span>
      )}
      {hint && !error && (
        <span style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>{hint}</span>
      )}
    </div>
  );
}
