import React, { useState } from 'react';
import {
  LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Legend,
} from 'recharts';
import { AppLayout } from '@/components/layout/AppLayout';
import { Card } from '@/components/ui';
import { CampanhaSelect } from '@/components/ui/CampanhaSelect';
import { useCampanhas } from '@/hooks/useCampanhas';
import { useDashboard, MetricasMeta, MetricasGoogle } from '@/hooks/useDashboard';

// ---------------------------------------------------------------------------
// Mock de série temporal — substituído por dados reais quando API retornar
// ---------------------------------------------------------------------------
function gerarSerieHoras(base: number) {
  const agora = new Date();
  const horaAtual = agora.getHours();
  return Array.from({ length: horaAtual + 1 }, (_, i) => {
    const ruido = () => 0.75 + Math.random() * 0.5;
    return {
      dia: `${String(i).padStart(2, '0')}h`,
      impressoes: Math.round((base / 24) * ruido()),
      cliques: Math.round((base / 24) * 0.04 * ruido()),
      gasto: parseFloat(((base / 24) * 0.002 * ruido()).toFixed(2)),
      ctr: parseFloat((4 * ruido()).toFixed(2)),
      cpc: parseFloat((0.38 * ruido()).toFixed(2)),
    };
  });
}

function gerarSerie(base: number, dias = 7) {
  return Array.from({ length: dias }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (dias - 1 - i));
    const label = d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
    const ruido = () => 0.75 + Math.random() * 0.5;
    return {
      dia: label,
      impressoes: Math.round(base * ruido()),
      cliques: Math.round(base * 0.04 * ruido()),
      gasto: parseFloat((base * 0.002 * ruido()).toFixed(2)),
      ctr: parseFloat((4 * ruido()).toFixed(2)),
      cpc: parseFloat((0.38 * ruido()).toFixed(2)),
    };
  });
}


const MOCK_META: MetricasMeta = {
  plataforma: 'meta',
  impressoes: 168432,
  cliques: 6731,
  gasto: 2340.5,
  alcance: 94210,
  ctr: 4.0,
  cpc: 0.35,
};

const MOCK_GOOGLE: MetricasGoogle = {
  plataforma: 'google',
  impressoes: 112800,
  cliques: 4512,
  gasto: 1870.2,
  ctr: 4.0,
  cpc: 0.41,
};
// ---------------------------------------------------------------------------

type Metrica = 'impressoes' | 'cliques' | 'gasto' | 'ctr' | 'cpc';
type Plataforma = 'meta' | 'google' | 'ambos';
type Periodo = 1 | 7 | 30 | 90;

const PERIODOS: { key: Periodo; label: string }[] = [
  { key: 1,  label: 'Hoje' },
  { key: 7,  label: '7 dias' },
  { key: 30, label: '30 dias' },
  { key: 90, label: '90 dias' },
];

const METRICAS: { key: Metrica; label: string; format: (v: number) => string }[] = [
  { key: 'impressoes', label: 'Impressões', format: (v) => v.toLocaleString('pt-BR') },
  { key: 'cliques',    label: 'Cliques',    format: (v) => v.toLocaleString('pt-BR') },
  { key: 'gasto',      label: 'Gasto',      format: (v) => `R$ ${v.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` },
  { key: 'ctr',        label: 'CTR',        format: (v) => `${v.toFixed(2)}%` },
  { key: 'cpc',        label: 'CPC',        format: (v) => `R$ ${v.toFixed(2)}` },
];

export function DashboardPage() {
  const { campanhas, loading, error } = useCampanhas();
  const [selecionada, setSelecionada] = useState<string>('');
  const { data: metricas, loading: loadingMetricas } = useDashboard(selecionada || null);

  const [metricaAtiva, setMetricaAtiva] = useState<Metrica>('impressoes');
  const [plataformaAtiva, setPlataformaAtiva] = useState<Plataforma>('ambos');
  const [periodo, setPeriodo] = useState<Periodo>(7);

  const metaData: MetricasMeta = (metricas?.meta && !('erro' in metricas.meta))
    ? (metricas.meta as MetricasMeta)
    : MOCK_META;

  const googleData: MetricasGoogle = (metricas?.google && !('erro' in metricas.google))
    ? (metricas.google as MetricasGoogle)
    : MOCK_GOOGLE;

  const usandoMock = selecionada && (
    !metricas?.meta || 'erro' in (metricas?.meta ?? {}) ||
    !metricas?.google || 'erro' in (metricas?.google ?? {})
  );

  const metricaDef = METRICAS.find((m) => m.key === metricaAtiva)!;

  // Série do gráfico conforme plataforma e período selecionados
  const metaSerie   = React.useMemo(() => periodo === 1 ? gerarSerieHoras(12000) : gerarSerie(12000, periodo), [periodo]);
  const googleSerie = React.useMemo(() => periodo === 1 ? gerarSerieHoras(8000)  : gerarSerie(8000,  periodo), [periodo]);

  const serieAtiva = metaSerie.map((m, i) => ({
    dia: m.dia,
    Meta: plataformaAtiva !== 'google' ? m[metricaAtiva] : null,
    Google: plataformaAtiva !== 'meta' ? googleSerie[i][metricaAtiva] : null,
  }));

  return (
    <AppLayout>
      <div style={styles.header}>
        <div>
          <h1 style={styles.title}>Dashboard</h1>
          <p style={styles.subtitle}>Métricas em tempo real das suas campanhas</p>
        </div>
      </div>

      {/* Seletor de campanha */}
      <Card style={styles.selectorCard}>
        <label style={styles.selectorLabel}>Campanha</label>
        {loading ? (
          <p style={styles.muted}>Carregando campanhas...</p>
        ) : error ? (
          <p style={styles.errorText}>{error}</p>
        ) : (
          <CampanhaSelect campanhas={campanhas} value={selecionada} onChange={setSelecionada} />
        )}
      </Card>

      {/* Estado vazio */}
      {!selecionada && (
        <div style={styles.emptyState}>
          <p style={styles.emptyIcon}>◈</p>
          <p style={styles.emptyTitle}>Selecione uma campanha</p>
          <p style={styles.muted}>Escolha uma campanha acima para visualizar as métricas.</p>
        </div>
      )}

      {selecionada && loadingMetricas && (
        <div style={styles.emptyState}>
          <p style={styles.muted}>Buscando métricas...</p>
        </div>
      )}

      {selecionada && !loadingMetricas && (
        <>
          {usandoMock && (
            <div style={styles.mockBanner}>
              Dados de exemplo — conecte Meta Ads ou Google Ads para ver métricas reais.
            </div>
          )}

          {/* Toggle de plataforma */}
          <div className="plataforma-tabs" style={styles.plataformaTabs}>
            {(['ambos', 'meta', 'google'] as Plataforma[]).map((p) => (
              <button
                key={p}
                onClick={() => setPlataformaAtiva(p)}
                style={{
                  ...styles.plataformaTab,
                  background: plataformaAtiva === p ? 'var(--color-ember)' : 'transparent',
                  color: plataformaAtiva === p ? 'white' : 'var(--color-text-muted)',
                  borderColor: plataformaAtiva === p ? 'var(--color-ember)' : 'var(--color-border)',
                }}
              >
                {{ ambos: 'Meta + Google', meta: 'Meta', google: 'Google' }[p]}
              </button>
            ))}
          </div>

          {/* KPI cards — clicáveis */}
          <div className="kpi-grid" style={styles.kpiGrid}>
            {METRICAS.map((m) => {
              const valorMeta   = metaData[m.key as keyof MetricasMeta] as number;
              const valorGoogle = googleData[m.key as keyof MetricasGoogle] as number ?? null;
              const valor =
                plataformaAtiva === 'meta'   ? valorMeta :
                plataformaAtiva === 'google' ? (valorGoogle ?? valorMeta) :
                m.key === 'gasto' ? valorMeta + (valorGoogle ?? 0) :
                valorMeta;

              const ativo = metricaAtiva === m.key;

              return (
                <button
                  key={m.key}
                  onClick={() => setMetricaAtiva(m.key)}
                  style={{
                    ...kpiBtn,
                    borderColor: ativo ? 'var(--color-ember)' : 'var(--color-border)',
                    background: ativo ? 'rgba(232,93,38,0.05)' : 'var(--color-bg-card)',
                    boxShadow: ativo ? '0 0 0 3px rgba(232,93,38,0.12)' : 'var(--shadow-card)',
                  }}
                >
                  <p style={kpi.label}>{m.label}</p>
                  <p style={{ ...kpi.value, color: ativo ? 'var(--color-ember)' : 'var(--color-text-primary)' }}>
                    {m.format(valor)}
                  </p>
                  {ativo && <span style={kpi.indicator} />}
                </button>
              );
            })}
          </div>

          {/* Gráfico */}
          <Card>
            <div className="chart-header" style={styles.chartHeader}>
              <p style={styles.chartTitle}>
                {metricaDef.label}
                {plataformaAtiva !== 'ambos' && ` — ${plataformaAtiva === 'meta' ? 'Meta' : 'Google'}`}
              </p>
              <div style={styles.periodoTabs}>
                {PERIODOS.map((p) => (
                  <button
                    key={p.key}
                    onClick={() => setPeriodo(p.key)}
                    style={{
                      ...styles.periodoTab,
                      background: periodo === p.key ? 'var(--color-ember)' : 'transparent',
                      color: periodo === p.key ? 'white' : 'var(--color-text-muted)',
                      borderColor: periodo === p.key ? 'var(--color-ember)' : 'var(--color-border)',
                    }}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            </div>
            <ResponsiveContainer width="100%" height={260}>
              <LineChart data={serieAtiva} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                <XAxis dataKey="dia" tick={tickStyle} />
                <YAxis tick={tickStyle} tickFormatter={(v) => metricaDef.format(v)} width={70} />
                <Tooltip
                  contentStyle={tooltipStyle}
                  formatter={(v) => [metricaDef.format(Number(v)), '']}
                />
                {(plataformaAtiva === 'meta' || plataformaAtiva === 'ambos') && (
                  <Line type="monotone" dataKey="Meta" name="Meta" stroke="#1877F2" strokeWidth={2} dot={false} />
                )}
                {(plataformaAtiva === 'google' || plataformaAtiva === 'ambos') && (
                  <Line type="monotone" dataKey="Google" name="Google" stroke="#34A853" strokeWidth={2} dot={false} />
                )}
                {plataformaAtiva === 'ambos' && <Legend wrapperStyle={{ fontSize: '12px' }} />}
              </LineChart>
            </ResponsiveContainer>
          </Card>
        </>
      )}
    </AppLayout>
  );
}

const tickStyle = { fontSize: 11, fill: '#999999', fontFamily: 'DM Mono, monospace' };
const tooltipStyle = {
  background: 'var(--color-bg-card)',
  border: '1px solid var(--color-border)',
  borderRadius: '8px',
  fontFamily: 'DM Mono, monospace',
  fontSize: '12px',
};

const kpiBtn: React.CSSProperties = {
  textAlign: 'left',
  cursor: 'pointer',
  padding: '20px 24px',
  borderRadius: '12px',
  border: '1px solid',
  transition: 'border-color 0.15s ease, box-shadow 0.15s ease, background 0.15s ease',
  position: 'relative',
  fontFamily: 'var(--font-ui)',
};

const styles: Record<string, React.CSSProperties> = {
  header: { marginBottom: '28px' },
  title: { fontFamily: 'var(--font-display)', fontSize: '28px', fontWeight: 800, margin: 0 },
  subtitle: { fontSize: '13px', color: 'var(--color-text-muted)', marginTop: '4px' },
  selectorCard: { marginBottom: '28px', padding: '20px 24px' },
  selectorLabel: {
    display: 'block', fontSize: '11px', fontWeight: 500,
    color: 'var(--color-text-muted)', textTransform: 'uppercase',
    letterSpacing: '0.05em', marginBottom: '10px', fontFamily: 'var(--font-ui)',
  },
  emptyState: { textAlign: 'center', padding: '80px 32px' },
  emptyIcon: { fontSize: '32px', color: 'var(--color-ember)', marginBottom: '12px', opacity: 0.4 },
  emptyTitle: { fontFamily: 'var(--font-display)', fontSize: '20px', color: 'var(--color-text-primary)', marginBottom: '8px' },
  muted: { fontSize: '13px', color: 'var(--color-text-muted)', margin: 0 },
  errorText: { fontSize: '14px', color: 'var(--color-ember)', margin: 0 },
  mockBanner: {
    background: 'rgba(232,93,38,0.08)',
    border: '1px solid rgba(232,93,38,0.2)',
    borderRadius: '8px',
    padding: '10px 16px',
    fontSize: '13px',
    color: 'var(--color-ember)',
    marginBottom: '20px',
  },
  plataformaTabs: {
    display: 'flex',
    gap: '8px',
    marginBottom: '20px',
  },
  plataformaTab: {
    padding: '7px 18px',
    borderRadius: '8px',
    border: '1px solid',
    cursor: 'pointer',
    fontFamily: 'var(--font-ui)',
    fontSize: '13px',
    fontWeight: 500,
    transition: 'all 0.15s ease',
  },
  kpiGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(5, 1fr)',
    gap: '12px',
    marginBottom: '20px',
  },
  chartHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: '20px',
  },
  chartTitle: {
    fontFamily: 'var(--font-display)',
    fontSize: '14px',
    fontWeight: 800,
    margin: 0,
    color: 'var(--color-text-primary)',
  },
  periodoTabs: {
    display: 'flex',
    gap: '6px',
  },
  periodoTab: {
    padding: '5px 12px',
    borderRadius: '6px',
    border: '1px solid',
    cursor: 'pointer',
    fontFamily: 'var(--font-ui)',
    fontSize: '12px',
    fontWeight: 500,
    transition: 'all 0.15s ease',
  },
};

const kpi: Record<string, React.CSSProperties> = {
  label: {
    fontFamily: 'var(--font-ui)',
    fontSize: '11px',
    fontWeight: 500,
    color: 'var(--color-text-muted)',
    margin: '0 0 8px 0',
    textTransform: 'uppercase',
    letterSpacing: '0.08em',
  },
  value: {
    fontFamily: 'var(--font-ui)',
    fontSize: '22px',
    fontWeight: 500,
    letterSpacing: '-0.5px',
    margin: 0,
    lineHeight: 1,
    transition: 'color 0.15s ease',
  },
  indicator: {
    position: 'absolute',
    bottom: '-1px',
    left: '20px',
    right: '20px',
    height: '2px',
    background: 'var(--color-ember)',
    borderRadius: '2px 2px 0 0',
    display: 'block',
  },
};
