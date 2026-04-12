import React, { useState, useRef, useEffect } from 'react';
import { Campanha } from '@/hooks/useCampanhas';

const STATUS_COLOR: Record<string, string> = {
  ativa: '#e85d26',
  pausada: '#999999',
  encerrada: '#4a4030',
};

const STATUS_LABEL: Record<string, string> = {
  ativa: 'Ativa',
  pausada: 'Pausada',
  encerrada: 'Encerrada',
};

const PLATAFORMA_LABEL: Record<string, string> = {
  meta: 'Meta',
  google: 'Google',
  ambos: 'Meta + Google',
};

interface CampanhaSelectProps {
  campanhas: Campanha[];
  value: string;
  onChange: (id: string) => void;
}

export function CampanhaSelect({ campanhas, value, onChange }: CampanhaSelectProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const selected = campanhas.find((c) => c.id === value) ?? null;

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  return (
    <div ref={ref} style={styles.root}>
      {/* Trigger */}
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        style={{
          ...styles.trigger,
          borderColor: open ? 'var(--color-ember)' : 'var(--color-border)',
          boxShadow: open ? '0 0 0 3px rgba(232,93,38,0.12)' : 'none',
        }}
      >
        {selected ? (
          <div style={styles.triggerSelected}>
            <div style={styles.triggerLeft}>
              <span style={styles.triggerNome}>{selected.nome}</span>
              <span style={styles.triggerSub}>
                {PLATAFORMA_LABEL[selected.plataforma]} ·{' '}
                R$ {Number(selected.orcamento).toLocaleString('pt-BR')}
              </span>
            </div>
            <span
              style={{
                ...styles.badge,
                background: `${STATUS_COLOR[selected.status]}18`,
                color: STATUS_COLOR[selected.status],
              }}
            >
              {STATUS_LABEL[selected.status]}
            </span>
          </div>
        ) : (
          <span style={styles.placeholder}>Selecione uma campanha</span>
        )}

        <span style={{ ...styles.arrow, transform: open ? 'rotate(180deg)' : 'rotate(0deg)' }}>
          ▾
        </span>
      </button>

      {/* Dropdown */}
      {open && (
        <div style={styles.dropdown}>
          {campanhas.length === 0 ? (
            <div style={styles.empty}>Nenhuma campanha encontrada.</div>
          ) : (
            campanhas.map((c) => (
              <button
                key={c.id}
                type="button"
                onClick={() => { onChange(c.id); setOpen(false); }}
                style={{
                  ...styles.option,
                  background: c.id === value ? 'rgba(232,93,38,0.06)' : 'transparent',
                }}
              >
                <div style={styles.optionLeft}>
                  <span style={styles.optionNome}>{c.nome}</span>
                  <span style={styles.optionSub}>
                    {PLATAFORMA_LABEL[c.plataforma]} ·{' '}
                    R$ {Number(c.orcamento).toLocaleString('pt-BR')}
                  </span>
                </div>
                <span
                  style={{
                    ...styles.badge,
                    background: `${STATUS_COLOR[c.status]}18`,
                    color: STATUS_COLOR[c.status],
                  }}
                >
                  {STATUS_LABEL[c.status]}
                </span>
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  root: {
    position: 'relative',
    width: '100%',
    maxWidth: '520px',
  },
  trigger: {
    width: '100%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: '12px',
    padding: '12px 16px',
    background: 'var(--color-bg)',
    border: '1px solid var(--color-border)',
    borderRadius: '10px',
    cursor: 'pointer',
    fontFamily: 'var(--font-ui)',
    transition: 'border-color 0.15s ease, box-shadow 0.15s ease',
    textAlign: 'left',
  },
  triggerSelected: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    flex: 1,
    minWidth: 0,
    gap: '12px',
  },
  triggerLeft: {
    display: 'flex',
    flexDirection: 'column',
    gap: '2px',
    minWidth: 0,
  },
  triggerNome: {
    fontSize: '14px',
    fontWeight: 500,
    color: 'var(--color-text-primary)',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  triggerSub: {
    fontSize: '12px',
    color: 'var(--color-text-muted)',
  },
  placeholder: {
    fontSize: '14px',
    color: 'var(--color-text-muted)',
    flex: 1,
  },
  arrow: {
    fontSize: '12px',
    color: 'var(--color-text-muted)',
    flexShrink: 0,
    transition: 'transform 0.2s ease',
    lineHeight: 1,
  },
  badge: {
    flexShrink: 0,
    fontSize: '11px',
    fontWeight: 500,
    padding: '3px 10px',
    borderRadius: '20px',
    textTransform: 'uppercase' as const,
    letterSpacing: '0.04em',
    whiteSpace: 'nowrap',
  },
  dropdown: {
    position: 'absolute',
    top: 'calc(100% + 6px)',
    left: 0,
    right: 0,
    background: 'var(--color-bg-card)',
    border: '1px solid var(--color-border)',
    borderRadius: '10px',
    boxShadow: 'var(--shadow-modal)',
    zIndex: 50,
    overflow: 'hidden',
  },
  option: {
    width: '100%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: '12px',
    padding: '12px 16px',
    border: 'none',
    borderBottom: '1px solid var(--color-border)',
    cursor: 'pointer',
    fontFamily: 'var(--font-ui)',
    textAlign: 'left',
    transition: 'background 0.1s ease',
  },
  optionLeft: {
    display: 'flex',
    flexDirection: 'column',
    gap: '2px',
    minWidth: 0,
  },
  optionNome: {
    fontSize: '14px',
    fontWeight: 500,
    color: 'var(--color-text-primary)',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  optionSub: {
    fontSize: '12px',
    color: 'var(--color-text-muted)',
  },
  empty: {
    padding: '16px',
    fontSize: '13px',
    color: 'var(--color-text-muted)',
    textAlign: 'center',
  },
};
