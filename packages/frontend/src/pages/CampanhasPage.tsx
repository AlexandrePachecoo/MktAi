import React from 'react';
import { useNavigate } from 'react-router-dom';
import { AppLayout } from '@/components/layout/AppLayout';
import { Button, Card } from '@/components/ui';
import { useCampanhas, Campanha } from '@/hooks/useCampanhas';

const STATUS_LABEL: Record<string, string> = {
  ativa: 'Ativa',
  pausada: 'Pausada',
  encerrada: 'Encerrada',
};

const STATUS_COLOR: Record<string, string> = {
  ativa: '#e85d26',
  pausada: '#999999',
  encerrada: '#4a4030',
};

const PLATAFORMA_LABEL: Record<string, string> = {
  meta: 'Meta',
  google: 'Google',
  ambos: 'Meta + Google',
};

export function CampanhasPage() {
  const navigate = useNavigate();
  const { campanhas, loading, error } = useCampanhas();

  return (
    <AppLayout>
      <div style={styles.header}>
        <div>
          <h1 style={styles.title}>Campanhas</h1>
          <p style={styles.subtitle}>
            {loading ? '...' : `${campanhas.length} campanha${campanhas.length !== 1 ? 's' : ''}`}
          </p>
        </div>
        <Button onClick={() => navigate('/campanhas/nova')}>
          + Nova campanha
        </Button>
      </div>

      {loading && (
        <div style={styles.center}>
          <p style={styles.muted}>Carregando...</p>
        </div>
      )}

      {error && (
        <div style={styles.center}>
          <p style={styles.errorText}>{error}</p>
        </div>
      )}

      {!loading && !error && campanhas.length === 0 && (
        <Card style={styles.emptyCard}>
          <p style={styles.emptyTitle}>Nenhuma campanha ainda.</p>
          <p style={styles.emptyText}>Crie sua primeira campanha e deixe a IA trabalhar por você.</p>
          <Button onClick={() => navigate('/campanhas/nova')} style={{ marginTop: '20px' }}>
            + Nova campanha
          </Button>
        </Card>
      )}

      {!loading && !error && campanhas.length > 0 && (
        <div style={styles.list}>
          {campanhas.map((c) => (
            <CampanhaRow key={c.id} campanha={c} />
          ))}
        </div>
      )}
    </AppLayout>
  );
}

function CampanhaRow({ campanha }: { campanha: Campanha }) {
  const navigate = useNavigate();

  return (
    <Card style={styles.row}>
      <div style={styles.rowMain}>
        <div style={styles.rowInfo}>
          <div style={styles.rowTop}>
            <span style={styles.rowNome}>{campanha.nome}</span>
            <span
              style={{
                ...styles.badge,
                background: `${STATUS_COLOR[campanha.status]}18`,
                color: STATUS_COLOR[campanha.status],
              }}
            >
              {STATUS_LABEL[campanha.status]}
            </span>
          </div>
          <p style={styles.rowDesc}>{campanha.descricao}</p>
          <div style={styles.rowMeta}>
            <span style={styles.chip}>{PLATAFORMA_LABEL[campanha.plataforma]}</span>
            <span style={styles.dot}>·</span>
            <span style={styles.muted}>
              R$ {Number(campanha.orcamento).toLocaleString('pt-BR')}
            </span>
            {campanha.objetivo && (
              <>
                <span style={styles.dot}>·</span>
                <span style={styles.muted}>{campanha.objetivo}</span>
              </>
            )}
          </div>
        </div>

        <div style={styles.rowActions}>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => navigate(`/campanhas/${campanha.id}`)}
          >
            Ver detalhes
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate(`/dashboard?campanha=${campanha.id}`)}
          >
            Métricas
          </Button>
        </div>
      </div>
    </Card>
  );
}

const styles: Record<string, React.CSSProperties> = {
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: '28px',
  },
  title: {
    fontFamily: 'var(--font-display)',
    fontSize: '28px',
    fontWeight: 800,
    margin: 0,
  },
  subtitle: {
    fontSize: '13px',
    color: 'var(--color-text-muted)',
    marginTop: '4px',
  },
  list: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  },
  row: {
    padding: '20px 24px',
  },
  rowMain: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: '24px',
  },
  rowInfo: {
    flex: 1,
    minWidth: 0,
  },
  rowTop: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    marginBottom: '6px',
  },
  rowNome: {
    fontFamily: 'var(--font-display)',
    fontWeight: 800,
    fontSize: '16px',
    color: 'var(--color-text-primary)',
  },
  badge: {
    fontSize: '11px',
    fontWeight: 500,
    padding: '3px 10px',
    borderRadius: '20px',
    textTransform: 'uppercase' as const,
    letterSpacing: '0.04em',
    whiteSpace: 'nowrap' as const,
  },
  rowDesc: {
    fontSize: '13px',
    color: 'var(--color-text-muted)',
    margin: '0 0 10px 0',
    lineHeight: 1.5,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap' as const,
  },
  rowMeta: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  chip: {
    fontSize: '11px',
    padding: '3px 10px',
    borderRadius: '20px',
    border: '1px solid var(--color-border)',
    color: 'var(--color-text-muted)',
  },
  dot: {
    color: 'var(--color-border)',
    fontSize: '14px',
  },
  muted: {
    fontSize: '13px',
    color: 'var(--color-text-muted)',
  },
  rowActions: {
    flexShrink: 0,
  },
  center: {
    textAlign: 'center',
    padding: '48px',
  },
  errorText: {
    fontSize: '14px',
    color: 'var(--color-ember)',
  },
  emptyCard: {
    textAlign: 'center',
    padding: '64px 32px',
  },
  emptyTitle: {
    fontFamily: 'var(--font-display)',
    fontSize: '20px',
    margin: '0 0 8px 0',
  },
  emptyText: {
    fontSize: '14px',
    color: 'var(--color-text-muted)',
    margin: 0,
  },
};
