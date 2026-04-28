import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  width?: number;
}

export function Modal({ open, onClose, title, children, width = 460 }: ModalProps) {
  useEffect(() => {
    if (!open) return;

    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', handleKey);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', handleKey);
    };
  }, [open, onClose]);

  if (!open) return null;

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      onClick={onClose}
      style={styles.overlay}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{ ...styles.container, maxWidth: width }}
      >
        {title && (
          <div style={styles.header}>
            <h2 style={styles.title}>{title}</h2>
            <button
              type="button"
              onClick={onClose}
              aria-label="Fechar"
              style={styles.closeBtn}
            >
              ✕
            </button>
          </div>
        )}
        <div style={styles.body}>{children}</div>
      </div>
    </div>,
    document.body
  );
}

const styles: Record<string, React.CSSProperties> = {
  overlay: {
    position: 'fixed',
    inset: 0,
    background: 'rgba(26, 18, 8, 0.45)',
    backdropFilter: 'blur(2px)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '20px',
    zIndex: 1000,
  },
  container: {
    width: '100%',
    background: 'var(--color-bg-card)',
    borderRadius: 'var(--radius-modal)',
    boxShadow: 'var(--shadow-modal)',
    display: 'flex',
    flexDirection: 'column',
    maxHeight: '90vh',
    overflow: 'hidden',
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '20px 24px',
    borderBottom: '1px solid var(--color-border)',
  },
  title: {
    margin: 0,
    fontFamily: 'var(--font-display)',
    fontSize: '18px',
    fontWeight: 700,
    color: 'var(--color-text-primary)',
  },
  closeBtn: {
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    color: 'var(--color-text-muted)',
    fontSize: '18px',
    lineHeight: 1,
    padding: '4px',
  },
  body: {
    padding: '24px',
    overflow: 'auto',
  },
};
