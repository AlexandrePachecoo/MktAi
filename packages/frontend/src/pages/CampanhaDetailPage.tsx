import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { AppLayout } from '@/components/layout/AppLayout';
import { Button, Card } from '@/components/ui';
import { useCampanha } from '@/hooks/useCampanha';
import { useCriativos, Criativo } from '@/hooks/useCriativos';
import { api } from '@/lib/api';

// ─── Types ───────────────────────────────────────────────────────────────────

interface Copy {
  titulo: string;
  texto: string;
}

interface Distribuicao {
  plataforma: string;
  percentual: number;
  justificativa: string;
}

interface Estrategia {
  resumo: string;
  distribuicao: Distribuicao[];
  copies: Copy[];
}

// ─── Constants ───────────────────────────────────────────────────────────────

const STATUS_COLOR: Record<string, string> = {
  ativa:     '#e85d26',
  pausada:   '#999999',
  encerrada: '#4a4030',
};

const STATUS_LABEL: Record<string, string> = {
  ativa:     'Ativa',
  pausada:   'Pausada',
  encerrada: 'Encerrada',
};

const PLATAFORMA_LABEL: Record<string, string> = {
  meta:   'Meta',
  google: 'Google',
  ambos:  'Meta + Google',
};

const PLATAFORMA_COLOR: Record<string, string> = {
  meta:   '#1877F2',
  google: '#34A853',
  ambos:  '#e85d26',
};

// ─── Page ────────────────────────────────────────────────────────────────────

export function CampanhaDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { campanha, loading, error, recarregar } = useCampanha(id);

  const { criativos, loading: loadingCriativos, recarregar: recarregarCriativos } = useCriativos(id);
  const [gerandoEstrategia, setGerandoEstrategia] = useState(false);
  const [erroEstrategia, setErroEstrategia] = useState('');
  const [alterandoStatus, setAlterandoStatus] = useState(false);
  const [copyExpandido, setCopyExpandido] = useState<number | null>(null);
  const [uploadando, setUploadando] = useState(false);
  const [erroUpload, setErroUpload] = useState('');
  const [mostrarGerarIA, setMostrarGerarIA] = useState(false);
  const [extraIA, setExtraIA] = useState('');
  const [copyIndexSelecionada, setCopyIndexSelecionada] = useState<number | null>(null);
  const [gerandoCriativo, setGerandoCriativo] = useState(false);
  const [erroGerarIA, setErroGerarIA] = useState('');

  async function gerarEstrategia() {
    setGerandoEstrategia(true);
    setErroEstrategia('');
    try {
      await api.post(`/campanhas/${id}/estrategia`, {});
      await recarregar();
    } catch (err) {
      setErroEstrategia(err instanceof Error ? err.message : 'Erro ao gerar estratégia');
    } finally {
      setGerandoEstrategia(false);
    }
  }

  async function handleImagemSelecionada(e: React.ChangeEvent<HTMLInputElement>) {
    const arquivo = e.target.files?.[0];
    if (!arquivo || !id) return;
    e.target.value = '';
    setUploadando(true);
    setErroUpload('');
    try {
      const formData = new FormData();
      formData.append('imagem', arquivo);
      const { url } = await api.upload<{ url: string }>('/upload/upload', formData);
      await api.post(`/campanhas/${id}/criativos`, { url_imagem: url });
      await recarregarCriativos();
    } catch (err) {
      setErroUpload(err instanceof Error ? err.message : 'Erro ao fazer upload');
    } finally {
      setUploadando(false);
    }
  }

  async function gerarCriativoIA() {
    if (!id) return;
    setGerandoCriativo(true);
    setErroGerarIA('');
    try {
      await api.post(`/campanhas/${id}/criativos/gerar`, {
        copy_index: copyIndexSelecionada ?? undefined,
        extra: extraIA.trim() || undefined,
      });
      await recarregarCriativos();
      setMostrarGerarIA(false);
      setExtraIA('');
      setCopyIndexSelecionada(null);
    } catch (err) {
      setErroGerarIA(err instanceof Error ? err.message : 'Erro ao gerar criativo');
    } finally {
      setGerandoCriativo(false);
    }
  }

  function abrirGerarIA() {
    setExtraIA('');
    setCopyIndexSelecionada(null);
    setErroGerarIA('');
    setMostrarGerarIA(true);
  }

  async function alterarStatus(novoStatus: 'ativa' | 'pausada' | 'encerrada') {
    setAlterandoStatus(true);
    try {
      await api.put(`/campanhas/${id}`, { status: novoStatus });
      await recarregar();
    } finally {
      setAlterandoStatus(false);
    }
  }

  if (loading) {
    return (
      <AppLayout>
        <div style={styles.center}>
          <p style={styles.muted}>Carregando campanha...</p>
        </div>
      </AppLayout>
    );
  }

  if (error || !campanha) {
    return (
      <AppLayout>
        <div style={styles.center}>
          <p style={styles.errorText}>{error || 'Campanha não encontrada.'}</p>
          <Button variant="ghost" onClick={() => navigate('/campanhas')} style={{ marginTop: '16px' }}>
            ← Voltar
          </Button>
        </div>
      </AppLayout>
    );
  }

  const estrategia = campanha.estrategia as Estrategia | null;

  return (
    <AppLayout>
      {/* ── Header ── */}
      <div style={styles.header}>
        <div style={styles.headerLeft}>
          <button style={styles.backBtn} onClick={() => navigate('/campanhas')}>
            ← Campanhas
          </button>
          <div style={styles.titleRow}>
            <h1 style={styles.title}>{campanha.nome}</h1>
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
          <p style={styles.subtitle}>
            {PLATAFORMA_LABEL[campanha.plataforma]} · criada em{' '}
            {new Date(campanha.created_at).toLocaleDateString('pt-BR')}
          </p>
        </div>

        {campanha.status !== 'encerrada' && (
          <div style={styles.headerActions}>
            {campanha.status === 'ativa' ? (
              <Button
                variant="secondary"
                size="sm"
                onClick={() => alterarStatus('pausada')}
                disabled={alterandoStatus}
              >
                Pausar
              </Button>
            ) : (
              <Button
                variant="secondary"
                size="sm"
                onClick={() => alterarStatus('ativa')}
                disabled={alterandoStatus}
              >
                Reativar
              </Button>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => alterarStatus('encerrada')}
              disabled={alterandoStatus}
              style={{ color: '#999' }}
            >
              Encerrar
            </Button>
          </div>
        )}
      </div>

      {/* ── Informações ── */}
      <Card style={styles.section}>
        <p style={styles.sectionTitle}>Informações</p>
        <div style={styles.infoGrid}>
          <InfoItem label="Descrição"    value={campanha.descricao} />
          <InfoItem label="Objetivo"     value={campanha.objetivo ?? '—'} />
          <InfoItem label="Público-alvo" value={campanha.publico_alvo} />
          <InfoItem
            label="Orçamento"
            value={`R$ ${Number(campanha.orcamento).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
          />
          <InfoItem
            label="Plataforma"
            value={PLATAFORMA_LABEL[campanha.plataforma]}
            valueStyle={{ color: PLATAFORMA_COLOR[campanha.plataforma], fontWeight: 600 }}
          />
        </div>
      </Card>

      {/* ── Estratégia de IA ── */}
      <Card style={styles.section}>
        <div style={styles.sectionHeader}>
          <p style={styles.sectionTitle}>Estratégia de IA</p>
          {estrategia && (
            <Button
              variant="ghost"
              size="sm"
              onClick={gerarEstrategia}
              disabled={gerandoEstrategia}
            >
              {gerandoEstrategia ? 'Gerando...' : 'Regerar'}
            </Button>
          )}
        </div>

        {!estrategia && (
          <div style={styles.estrategiaVazia}>
            <p style={styles.muted}>
              Nenhuma estratégia gerada ainda. A IA irá criar uma distribuição de anúncios e 5 copies personalizados.
            </p>
            {erroEstrategia && <p style={styles.errorText}>{erroEstrategia}</p>}
            <Button
              onClick={gerarEstrategia}
              disabled={gerandoEstrategia}
              style={{ marginTop: '16px' }}
            >
              {gerandoEstrategia ? 'Gerando estratégia...' : '✦ Gerar estratégia com IA'}
            </Button>
          </div>
        )}

        {estrategia && (
          <div>
            {/* Resumo */}
            <p style={styles.resumo}>{estrategia.resumo}</p>

            {/* Distribuição */}
            {estrategia.distribuicao?.length > 0 && (
              <div style={styles.distribuicaoBlock}>
                <p style={styles.subLabel}>Distribuição de orçamento</p>
                {estrategia.distribuicao.map((d) => (
                  <div key={d.plataforma} style={styles.distItem}>
                    <div style={styles.distHeader}>
                      <span style={styles.distPlataforma}>{d.plataforma}</span>
                      <span style={styles.distPercentual}>{d.percentual}%</span>
                    </div>
                    <div style={styles.progressBar}>
                      <div
                        style={{
                          ...styles.progressFill,
                          width: `${d.percentual}%`,
                          background: PLATAFORMA_COLOR[d.plataforma.toLowerCase()] ?? 'var(--color-ember)',
                        }}
                      />
                    </div>
                    <p style={styles.distJustificativa}>{d.justificativa}</p>
                  </div>
                ))}
              </div>
            )}

            {/* Copies */}
            {estrategia.copies?.length > 0 && (
              <div style={styles.copiesBlock}>
                <p style={styles.subLabel}>Copies ({estrategia.copies.length})</p>
                <div style={styles.copiesList}>
                  {estrategia.copies.map((copy, i) => (
                    <div key={i} style={styles.copyCard}>
                      <button
                        style={styles.copyHeader}
                        onClick={() => setCopyExpandido(copyExpandido === i ? null : i)}
                      >
                        <div style={styles.copyHeaderLeft}>
                          <span style={styles.copyNumero}>{i + 1}</span>
                          <span style={styles.copyTitulo}>{copy.titulo}</span>
                        </div>
                        <div style={styles.copyHeaderRight}>
                          <span style={styles.copyChevron}>
                            {copyExpandido === i ? '▲' : '▼'}
                          </span>
                        </div>
                      </button>
                      {copyExpandido === i && (
                        <p style={styles.copyTexto}>{copy.texto}</p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </Card>

      {/* ── Criativos ── */}
      <Card style={styles.section}>
        <div style={styles.sectionHeader}>
          <p style={styles.sectionTitle}>Criativos</p>
          <div style={{ display: 'flex', gap: '8px' }}>
            <Button
              variant="secondary"
              size="sm"
              onClick={abrirGerarIA}
              disabled={gerandoCriativo || uploadando}
            >
              ✦ Gerar com IA
            </Button>
            <Button
              variant="secondary"
              size="sm"
              disabled={uploadando}
              onClick={() => document.getElementById('criativo-input')?.click()}
            >
              {uploadando ? 'Enviando...' : '+ Adicionar imagem'}
            </Button>
            <input
              id="criativo-input"
              type="file"
              accept="image/*"
              style={{ display: 'none' }}
              onChange={handleImagemSelecionada}
              disabled={uploadando}
            />
          </div>
        </div>

        {mostrarGerarIA && (
          <div style={styles.gerarIABox}>
            {(() => {
              const estrategiaAtual = campanha?.estrategia as Estrategia | null;
              const copies = estrategiaAtual?.copies ?? [];
              return copies.length > 0 ? (
                <div style={{ marginBottom: '16px' }}>
                  <p style={styles.gerarIALabel}>Usar uma copy da estratégia (opcional):</p>
                  <div style={styles.gerarIACopiesList}>
                    {copies.map((copy, idx) => (
                      <button
                        key={idx}
                        style={{
                          ...styles.gerarIACopyBtn,
                          ...(copyIndexSelecionada === idx ? styles.gerarIACopyBtnAtivo : {}),
                        }}
                        onClick={() => setCopyIndexSelecionada(copyIndexSelecionada === idx ? null : idx)}
                        disabled={gerandoCriativo}
                        type="button"
                      >
                        <span style={styles.gerarIACopyNum}>{idx + 1}</span>
                        <span style={styles.gerarIACopyTitulo}>{copy.titulo}</span>
                        {copyIndexSelecionada === idx && <span style={styles.gerarIACopyCheck}>✓</span>}
                      </button>
                    ))}
                  </div>
                </div>
              ) : null;
            })()}

            <p style={styles.gerarIALabel}>Observações adicionais (opcional):</p>
            <textarea
              value={extraIA}
              onChange={(e) => setExtraIA(e.target.value)}
              rows={3}
              style={styles.gerarIATextarea}
              placeholder="Ex: fundo escuro, tons de azul e dourado, estilo minimalista..."
              disabled={gerandoCriativo}
            />
            {erroGerarIA && <p style={{ ...styles.errorText, marginBottom: '8px' }}>{erroGerarIA}</p>}
            <div style={{ display: 'flex', gap: '8px' }}>
              <Button onClick={gerarCriativoIA} disabled={gerandoCriativo} size="sm">
                {gerandoCriativo ? 'Gerando imagem...' : 'Gerar imagem'}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setMostrarGerarIA(false)}
                disabled={gerandoCriativo}
              >
                Cancelar
              </Button>
            </div>
          </div>
        )}

        {erroUpload && <p style={{ ...styles.errorText, marginBottom: '12px' }}>{erroUpload}</p>}

        {loadingCriativos ? (
          <p style={styles.muted}>Carregando criativos...</p>
        ) : criativos.length === 0 ? (
          <div style={styles.criativos_vazio}>
            <p style={styles.muted}>Nenhum criativo adicionado ainda.</p>
          </div>
        ) : (
          <div style={styles.criativos_grid}>
            {criativos.map((c) => (
              <CriativoThumb key={c.id} criativo={c} />
            ))}
          </div>
        )}
      </Card>

      {/* ── Testes A/B ── */}
      <Card style={{ ...styles.section, ...styles.comingSoon }}>
        <p style={styles.sectionTitle}>Testes A/B</p>
        <p style={styles.muted}>Comparação entre criativos — em breve.</p>
      </Card>
    </AppLayout>
  );
}

// ─── CriativoThumb ────────────────────────────────────────────────────────────

function CriativoThumb({ criativo }: { criativo: Criativo }) {
  const [imgError, setImgError] = useState(false);

  return (
    <div style={styles.criativos_thumb}>
      {imgError ? (
        <div style={styles.criativos_thumbFallback}>
          <span style={{ fontSize: '11px', color: 'var(--color-text-muted)' }}>Indisponível</span>
        </div>
      ) : (
        <img
          src={criativo.url_imagem}
          alt="Criativo"
          style={styles.criativos_thumbImg}
          onError={() => setImgError(true)}
        />
      )}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 8px' }}>
        <p style={{ ...styles.criativos_thumbData, padding: 0 }}>
          {new Date(criativo.created_at).toLocaleDateString('pt-BR')}
        </p>
        {criativo.tipo === 'gerado_ia' && (
          <span style={styles.criativos_thumbBadge}>IA</span>
        )}
      </div>
    </div>
  );
}

// ─── InfoItem ─────────────────────────────────────────────────────────────────

function InfoItem({
  label,
  value,
  valueStyle,
}: {
  label: string;
  value: string;
  valueStyle?: React.CSSProperties;
}) {
  return (
    <div style={styles.infoItem}>
      <p style={styles.infoLabel}>{label}</p>
      <p style={{ ...styles.infoValue, ...valueStyle }}>{value}</p>
    </div>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles: Record<string, React.CSSProperties> = {
  center: {
    textAlign: 'center',
    padding: '80px 32px',
  },
  muted: {
    fontSize: '13px',
    color: 'var(--color-text-muted)',
    margin: 0,
    lineHeight: 1.6,
  },
  errorText: {
    fontSize: '13px',
    color: 'var(--color-ember)',
    margin: 0,
  },

  // Header
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: '28px',
    gap: '16px',
  },
  headerLeft: {
    minWidth: 0,
  },
  headerActions: {
    display: 'flex',
    gap: '8px',
    flexShrink: 0,
    alignItems: 'center',
    paddingTop: '28px',
  },
  backBtn: {
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    fontSize: '12px',
    color: 'var(--color-text-muted)',
    padding: 0,
    marginBottom: '8px',
    fontFamily: 'var(--font-ui)',
    letterSpacing: '0.02em',
  },
  titleRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    marginBottom: '4px',
  },
  title: {
    fontFamily: 'var(--font-display)',
    fontSize: '28px',
    fontWeight: 800,
    margin: 0,
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
  subtitle: {
    fontSize: '13px',
    color: 'var(--color-text-muted)',
    margin: 0,
  },

  // Sections
  section: {
    marginBottom: '16px',
    padding: '24px',
  },
  sectionHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '16px',
  },
  sectionTitle: {
    fontFamily: 'var(--font-display)',
    fontSize: '14px',
    fontWeight: 800,
    margin: '0 0 16px 0',
    textTransform: 'uppercase' as const,
    letterSpacing: '0.06em',
    color: 'var(--color-text-muted)',
  },
  comingSoon: {
    opacity: 0.5,
  },

  // Criativos
  criativos_vazio: {
    padding: '32px 24px',
    background: 'var(--color-bg)',
    borderRadius: '8px',
    border: '1px dashed var(--color-border)',
    textAlign: 'center' as const,
  },
  criativos_grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))',
    gap: '12px',
  },
  criativos_thumb: {
    border: '1px solid var(--color-border)',
    borderRadius: '8px',
    overflow: 'hidden',
    background: 'var(--color-bg-card)',
    display: 'flex',
    flexDirection: 'column' as const,
  },
  criativos_thumbImg: {
    width: '100%',
    aspectRatio: '1 / 1',
    objectFit: 'cover' as const,
    display: 'block',
  },
  criativos_thumbFallback: {
    width: '100%',
    aspectRatio: '1 / 1',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'var(--color-bg)',
  },
  criativos_thumbData: {
    fontSize: '11px',
    color: 'var(--color-text-muted)',
    padding: '6px 8px',
    margin: 0,
    fontFamily: 'var(--font-ui)',
  },
  criativos_thumbBadge: {
    fontSize: '9px',
    fontWeight: 700,
    color: 'var(--color-ember)',
    background: 'rgba(232,93,38,0.12)',
    borderRadius: '4px',
    padding: '2px 5px',
    fontFamily: 'var(--font-ui)',
    letterSpacing: '0.04em',
  },

  // Gerar IA
  gerarIABox: {
    background: 'var(--color-bg)',
    border: '1px dashed var(--color-border)',
    borderRadius: '8px',
    padding: '16px',
    marginBottom: '16px',
  },
  gerarIALabel: {
    fontSize: '12px',
    fontWeight: 500,
    color: 'var(--color-text-muted)',
    textTransform: 'uppercase' as const,
    letterSpacing: '0.05em',
    margin: '0 0 8px 0',
    fontFamily: 'var(--font-ui)',
  },
  gerarIATextarea: {
    width: '100%',
    background: 'var(--color-bg-card)',
    border: '1px solid var(--color-border)',
    borderRadius: '6px',
    padding: '10px 12px',
    fontSize: '12px',
    fontFamily: 'var(--font-ui)',
    color: 'var(--color-text-primary)',
    resize: 'vertical' as const,
    marginBottom: '12px',
    boxSizing: 'border-box' as const,
    outline: 'none',
    lineHeight: 1.6,
  },
  gerarIACopiesList: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '6px',
  },
  gerarIACopyBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    padding: '8px 12px',
    background: 'var(--color-bg-card)',
    border: '1px solid var(--color-border)',
    borderRadius: '6px',
    cursor: 'pointer',
    textAlign: 'left' as const,
    width: '100%',
    transition: 'border-color 0.15s',
  },
  gerarIACopyBtnAtivo: {
    borderColor: 'var(--color-ember)',
    background: 'rgba(232,93,38,0.06)',
  },
  gerarIACopyNum: {
    fontSize: '10px',
    fontWeight: 700,
    color: 'var(--color-ember)',
    background: 'rgba(232,93,38,0.1)',
    borderRadius: '4px',
    padding: '2px 6px',
    fontFamily: 'var(--font-ui)',
    flexShrink: 0,
  },
  gerarIACopyTitulo: {
    fontSize: '12px',
    fontWeight: 500,
    color: 'var(--color-text-primary)',
    fontFamily: 'var(--font-ui)',
    flex: 1,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap' as const,
  },
  gerarIACopyCheck: {
    fontSize: '12px',
    color: 'var(--color-ember)',
    fontWeight: 700,
    flexShrink: 0,
  },

  // Info grid
  infoGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
    gap: '20px',
  },
  infoItem: {},
  infoLabel: {
    fontSize: '11px',
    fontWeight: 500,
    color: 'var(--color-text-muted)',
    textTransform: 'uppercase' as const,
    letterSpacing: '0.06em',
    margin: '0 0 4px 0',
    fontFamily: 'var(--font-ui)',
  },
  infoValue: {
    fontSize: '14px',
    color: 'var(--color-text-primary)',
    margin: 0,
    fontFamily: 'var(--font-ui)',
    lineHeight: 1.5,
  },

  // Estratégia
  estrategiaVazia: {
    padding: '24px',
    background: 'var(--color-bg)',
    borderRadius: '8px',
    border: '1px dashed var(--color-border)',
  },
  resumo: {
    fontSize: '14px',
    color: 'var(--color-text-primary)',
    lineHeight: 1.7,
    margin: '0 0 24px 0',
    fontFamily: 'var(--font-ui)',
  },
  subLabel: {
    fontSize: '11px',
    fontWeight: 500,
    color: 'var(--color-text-muted)',
    textTransform: 'uppercase' as const,
    letterSpacing: '0.06em',
    margin: '0 0 12px 0',
    fontFamily: 'var(--font-ui)',
  },

  // Distribuição
  distribuicaoBlock: {
    marginBottom: '24px',
  },
  distItem: {
    marginBottom: '16px',
  },
  distHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    marginBottom: '6px',
  },
  distPlataforma: {
    fontSize: '13px',
    fontWeight: 600,
    color: 'var(--color-text-primary)',
    textTransform: 'capitalize' as const,
    fontFamily: 'var(--font-ui)',
  },
  distPercentual: {
    fontSize: '13px',
    fontWeight: 600,
    color: 'var(--color-text-primary)',
    fontFamily: 'var(--font-ui)',
  },
  progressBar: {
    height: '6px',
    background: 'var(--color-border)',
    borderRadius: '3px',
    overflow: 'hidden',
    marginBottom: '6px',
  },
  progressFill: {
    height: '100%',
    borderRadius: '3px',
    transition: 'width 0.4s ease',
  },
  distJustificativa: {
    fontSize: '12px',
    color: 'var(--color-text-muted)',
    margin: 0,
    lineHeight: 1.5,
    fontFamily: 'var(--font-ui)',
  },

  // Copies
  copiesBlock: {},
  copiesList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  copyCard: {
    border: '1px solid var(--color-border)',
    borderRadius: '8px',
    overflow: 'hidden',
  },
  copyHeader: {
    width: '100%',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '12px 16px',
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    textAlign: 'left' as const,
    gap: '12px',
  },
  copyHeaderLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    minWidth: 0,
  },
  copyHeaderRight: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    flexShrink: 0,
  },
  copyNumero: {
    fontSize: '11px',
    fontWeight: 700,
    color: 'var(--color-ember)',
    background: 'rgba(232,93,38,0.1)',
    borderRadius: '4px',
    padding: '2px 7px',
    fontFamily: 'var(--font-ui)',
    flexShrink: 0,
  },
  copyTitulo: {
    fontSize: '13px',
    fontWeight: 600,
    color: 'var(--color-text-primary)',
    fontFamily: 'var(--font-ui)',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap' as const,
  },
  copyChevron: {
    fontSize: '10px',
    color: 'var(--color-text-muted)',
  },
  copyTexto: {
    fontSize: '13px',
    color: 'var(--color-text-muted)',
    lineHeight: 1.7,
    margin: 0,
    padding: '0 16px 16px',
    fontFamily: 'var(--font-ui)',
    borderTop: '1px solid var(--color-border)',
    paddingTop: '12px',
  },
};
