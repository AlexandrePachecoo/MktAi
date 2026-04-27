import React, { useState, useEffect } from 'react';
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

interface CriativoEmTeste {
  id: string;
  url_imagem: string;
  tipo: string;
}

interface TesteAB {
  id: string;
  campanha_id: string;
  criativo_id_a: string;
  criativo_id_b: string;
  criativo_a: CriativoEmTeste;
  criativo_b: CriativoEmTeste;
  resultado: string | null;
  status: string;
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

const PALETAS_PREDEFINIDAS = [
  { id: 'quente',   nome: 'Quente',   cores: ['#E85D26', '#F4A261', '#FECAA0'] },
  { id: 'frio',     nome: 'Frio',     cores: ['#1D3557', '#457B9D', '#A8DADC'] },
  { id: 'luxo',     nome: 'Luxo',     cores: ['#1A1208', '#C9B458', '#F5F2EC'] },
  { id: 'natureza', nome: 'Natureza', cores: ['#2D6A4F', '#52B788', '#D8F3DC'] },
  { id: 'roxo',     nome: 'Roxo',     cores: ['#6B21A8', '#9333EA', '#E9D5FF'] },
  { id: 'neutro',   nome: 'Neutro',   cores: ['#1C1917', '#78716C', '#F5F5F4'] },
];

// ─── Page ────────────────────────────────────────────────────────────────────

export function CampanhaDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { campanha, loading, error, recarregar } = useCampanha(id);

  const { criativos, loading: loadingCriativos, recarregar: recarregarCriativos } = useCriativos(id);

  // ── Testes A/B ──
  const [testes, setTestes] = useState<TesteAB[]>([]);
  const [loadingTestes, setLoadingTestes] = useState(true);
  const [criandoTeste, setCriandoTeste] = useState(false);
  const [mostrarNovoTeste, setMostrarNovoTeste] = useState(false);
  const [selecionadoA, setSelecionadoA] = useState<string>('');
  const [selecionadoB, setSelecionadoB] = useState<string>('');
  const [erroTeste, setErroTeste] = useState('');
  const [resultadoInput, setResultadoInput] = useState<Record<string, string>>({});
  const [gerandoEstrategia, setGerandoEstrategia] = useState(false);
  const [erroEstrategia, setErroEstrategia] = useState('');
  const [alterandoStatus, setAlterandoStatus] = useState(false);
  const [copyExpandido, setCopyExpandido] = useState<number | null>(null);
  const [uploadando, setUploadando] = useState(false);
  const [erroUpload, setErroUpload] = useState('');
  const [imagemAmpliada, setImagemAmpliada] = useState<string | null>(null);
  const [mostrarGerarIA, setMostrarGerarIA] = useState(false);
  const [extraIA, setExtraIA] = useState('');
  const [copyIndexSelecionada, setCopyIndexSelecionada] = useState<number | null>(null);
  const [gerandoCriativo, setGerandoCriativo] = useState(false);
  const [erroGerarIA, setErroGerarIA] = useState('');
  const [paletaOpcao, setPaletaOpcao] = useState<string>('nenhuma');
  const [corCustom1, setCorCustom1] = useState('#e85d26');
  const [corCustom2, setCorCustom2] = useState('#f4a261');
  const [corCustom3, setCorCustom3] = useState('#fecaa0');
  const [imagemRefUrl, setImagemRefUrl] = useState<string | null>(null);
  const [uploadandoRef, setUploadandoRef] = useState(false);
  const [mostrarModalPublicar, setMostrarModalPublicar] = useState(false);
  const [criativoParaMeta, setCriativoParaMeta] = useState<string>('');
  const [copyParaMeta, setCopyParaMeta] = useState<number | null>(null);
  const [publicandoMeta, setPublicandoMeta] = useState(false);
  const [erroPublicacao, setErroPublicacao] = useState('');
  const [publicandoCriativo, setPublicandoCriativo] = useState<string | null>(null);

  function abrirModalPublicar() {
    setCriativoParaMeta(criativos[0]?.id ?? '');
    setCopyParaMeta(null);
    setErroPublicacao('');
    setMostrarModalPublicar(true);
  }

  async function confirmarPublicacaoNoMeta() {
    if (!id || !criativoParaMeta) return;
    setPublicandoMeta(true);
    setErroPublicacao('');
    let etapa: 'campanha' | 'criativo' = 'campanha';
    try {
      if (!campanha?.meta_adset_id) {
        await api.post(`/campanhas/${id}/publicar-meta`, {});
        await recarregar();
      }
      etapa = 'criativo';
      await api.post(`/campanhas/${id}/criativos/${criativoParaMeta}/publicar-meta`, {
        copy_index: copyParaMeta ?? undefined,
      });
      await recarregarCriativos();
      setMostrarModalPublicar(false);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Erro ao publicar no Meta';
      const prefixo = etapa === 'criativo'
        ? 'Campanha publicada, mas falhou ao publicar o criativo: '
        : 'Falha ao publicar campanha no Meta: ';
      setErroPublicacao(prefixo + msg);
      await recarregar();
      await recarregarCriativos();
    } finally {
      setPublicandoMeta(false);
    }
  }

  async function publicarCriativoNoMeta(criativoId: string) {
    if (!id) return;
    setPublicandoCriativo(criativoId);
    try {
      await api.post(`/campanhas/${id}/criativos/${criativoId}/publicar-meta`, {});
      await recarregarCriativos();
    } catch (err) {
      console.error('Erro ao publicar criativo no Meta:', err);
    } finally {
      setPublicandoCriativo(null);
    }
  }

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

  async function handleImagemRefSelecionada(e: React.ChangeEvent<HTMLInputElement>) {
    const arquivo = e.target.files?.[0];
    if (!arquivo) return;
    e.target.value = '';
    setUploadandoRef(true);
    try {
      const formData = new FormData();
      formData.append('imagem', arquivo);
      const { url } = await api.upload<{ url: string }>('/upload/upload', formData);
      setImagemRefUrl(url);
    } catch (err) {
      console.error('Erro ao fazer upload da referência:', err);
    } finally {
      setUploadandoRef(false);
    }
  }

  async function gerarCriativoIA() {
    if (!id) return;
    setGerandoCriativo(true);
    setErroGerarIA('');

    const paletaCores =
      paletaOpcao === 'nenhuma'
        ? undefined
        : paletaOpcao === 'personalizada'
          ? [corCustom1, corCustom2, corCustom3]
          : PALETAS_PREDEFINIDAS.find(p => p.id === paletaOpcao)?.cores;

    try {
      await api.post(`/campanhas/${id}/criativos/gerar`, {
        copy_index: copyIndexSelecionada ?? undefined,
        extra: extraIA.trim() || undefined,
        paleta_cores: paletaCores,
        referencia_url: imagemRefUrl ?? undefined,
      });
      await recarregarCriativos();
      setMostrarGerarIA(false);
      setExtraIA('');
      setCopyIndexSelecionada(null);
      setPaletaOpcao('nenhuma');
      setImagemRefUrl(null);
    } catch (err) {
      setErroGerarIA(err instanceof Error ? err.message : 'Erro ao gerar criativo');
    } finally {
      setGerandoCriativo(false);
    }
  }

  // ── Funções Testes A/B ──
  async function carregarTestes() {
    if (!id) return;
    setLoadingTestes(true);
    try {
      const data = await api.get<TesteAB[]>(`/campanhas/${id}/testes-ab`);
      setTestes(data);
    } finally {
      setLoadingTestes(false);
    }
  }

  useEffect(() => { carregarTestes(); }, [id]);

  async function criarTeste() {
    if (!id || !selecionadoA || !selecionadoB) return;
    setCriandoTeste(true);
    setErroTeste('');
    try {
      await api.post(`/campanhas/${id}/testes-ab`, {
        criativo_id_a: selecionadoA,
        criativo_id_b: selecionadoB,
      });
      setMostrarNovoTeste(false);
      setSelecionadoA('');
      setSelecionadoB('');
      await carregarTestes();
    } catch (err) {
      setErroTeste(err instanceof Error ? err.message : 'Erro ao criar teste');
    } finally {
      setCriandoTeste(false);
    }
  }

  async function encerrarTeste(testeId: string) {
    const resultado = resultadoInput[testeId]?.trim();
    if (!resultado || !id) return;
    try {
      await api.patch(`/campanhas/${id}/testes-ab/${testeId}/resultado`, { resultado });
      setResultadoInput(prev => ({ ...prev, [testeId]: '' }));
      await carregarTestes();
    } catch (err) {
      console.error(err);
    }
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
      <div style={styles.header} className="detail-page-header">
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

        <div style={styles.headerActions} className="detail-header-actions">
          {['meta', 'ambos'].includes(campanha.plataforma) && (
            campanha.meta_campaign_id ? (
              <span style={styles.metaBadgeOk}>
                Meta publicado
              </span>
            ) : (
              <Button
                variant="secondary"
                size="sm"
                onClick={abrirModalPublicar}
                disabled={criativos.length === 0}
                style={{ background: '#1877F218', color: '#1877F2', borderColor: '#1877F240' }}
                title={criativos.length === 0 ? 'Adicione ao menos um criativo primeiro' : undefined}
              >
                Publicar no Meta
              </Button>
            )
          )}
          {campanha.status !== 'encerrada' && (
            <>
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
            </>
          )}
        </div>
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
          <div style={{ display: 'flex', gap: '8px' }} className="criativos-actions">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => { setMostrarGerarIA(v => !v); setErroGerarIA(''); setExtraIA(''); setCopyIndexSelecionada(null); setPaletaOpcao('nenhuma'); setImagemRefUrl(null); }}
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
              const copies = (campanha?.estrategia as Estrategia | null)?.copies ?? [];
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
            {/* Color Palette */}
            <div style={{ marginBottom: '16px' }}>
              <p style={styles.gerarIALabel}>Palheta de cores (opcional):</p>
              <div style={styles.paletaGrid}>
                <button
                  style={{ ...styles.paletaOpcaoBtn, ...(paletaOpcao === 'nenhuma' ? styles.paletaOpcaoBtnAtivo : {}) }}
                  onClick={() => setPaletaOpcao('nenhuma')}
                  type="button"
                  disabled={gerandoCriativo}
                >
                  <span style={styles.paletaNenhuma}>Nenhuma</span>
                </button>
                {PALETAS_PREDEFINIDAS.map(p => (
                  <button
                    key={p.id}
                    style={{ ...styles.paletaOpcaoBtn, ...(paletaOpcao === p.id ? styles.paletaOpcaoBtnAtivo : {}) }}
                    onClick={() => setPaletaOpcao(p.id)}
                    type="button"
                    disabled={gerandoCriativo}
                    title={p.nome}
                  >
                    <div style={styles.paletaSwatches}>
                      {p.cores.map((cor, i) => (
                        <span key={i} style={{ ...styles.palettaSwatch, background: cor }} />
                      ))}
                    </div>
                    <span style={styles.paletaItemLabel}>{p.nome}</span>
                  </button>
                ))}
                <button
                  style={{ ...styles.paletaOpcaoBtn, ...(paletaOpcao === 'personalizada' ? styles.paletaOpcaoBtnAtivo : {}) }}
                  onClick={() => setPaletaOpcao('personalizada')}
                  type="button"
                  disabled={gerandoCriativo}
                >
                  <span style={styles.paletaItemLabel}>Personalizada</span>
                </button>
              </div>
              {paletaOpcao === 'personalizada' && (
                <div style={styles.coresCustomRow}>
                  {([
                    [corCustom1, setCorCustom1],
                    [corCustom2, setCorCustom2],
                    [corCustom3, setCorCustom3],
                  ] as const).map(([cor, setCor], i) => (
                    <div key={i} style={styles.corCustomItem}>
                      <input
                        type="color"
                        value={cor}
                        onChange={e => (setCor as (v: string) => void)(e.target.value)}
                        style={styles.colorPicker}
                        disabled={gerandoCriativo}
                      />
                      <span style={styles.corCustomLabel}>{cor.toUpperCase()}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Reference Image */}
            <div style={{ marginBottom: '16px' }}>
              <p style={styles.gerarIALabel}>Logo ou imagem do produto (opcional):</p>
              {imagemRefUrl ? (
                <div style={styles.refImagePreview}>
                  <img src={imagemRefUrl} alt="Referência" style={styles.refImageImg} />
                  <button
                    style={styles.refImageRemove}
                    onClick={() => setImagemRefUrl(null)}
                    type="button"
                    disabled={gerandoCriativo}
                  >
                    ✕ Remover
                  </button>
                </div>
              ) : (
                <button
                  style={styles.refUploadBtn}
                  onClick={() => document.getElementById('ref-imagem-input')?.click()}
                  type="button"
                  disabled={gerandoCriativo || uploadandoRef}
                >
                  {uploadandoRef ? 'Enviando...' : '+ Adicionar logo / imagem'}
                </button>
              )}
              <input
                id="ref-imagem-input"
                type="file"
                accept="image/*"
                style={{ display: 'none' }}
                onChange={handleImagemRefSelecionada}
                disabled={gerandoCriativo || uploadandoRef}
              />
            </div>

            <p style={styles.gerarIALabel}>Observações adicionais (opcional):</p>
            <textarea
              value={extraIA}
              onChange={(e) => setExtraIA(e.target.value)}
              rows={2}
              style={styles.gerarIATextarea}
              placeholder="Ex: tons quentes, estilo minimalista, fundo escuro..."
              disabled={gerandoCriativo}
            />
            {erroGerarIA && <p style={{ ...styles.errorText, marginBottom: '8px' }}>{erroGerarIA}</p>}
            <div style={{ display: 'flex', gap: '8px' }}>
              <Button onClick={gerarCriativoIA} disabled={gerandoCriativo} size="sm">
                {gerandoCriativo ? 'Gerando imagem...' : 'Gerar imagem'}
              </Button>
              <Button variant="ghost" size="sm" onClick={() => setMostrarGerarIA(false)} disabled={gerandoCriativo}>
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
              <CriativoThumb
                key={c.id}
                criativo={c}
                onAmpliar={setImagemAmpliada}
                onPublicarMeta={campanha.meta_adset_id ? publicarCriativoNoMeta : undefined}
                publicando={publicandoCriativo === c.id}
              />
            ))}
          </div>
        )}
      </Card>

      {/* ── Lightbox ── */}
      {imagemAmpliada && (
        <div
          style={styles.lightboxOverlay}
          onClick={() => setImagemAmpliada(null)}
        >
          <img
            src={imagemAmpliada}
            alt="Criativo ampliado"
            style={styles.lightboxImg}
            onClick={e => e.stopPropagation()}
          />
          <button
            style={styles.lightboxClose}
            onClick={() => setImagemAmpliada(null)}
          >
            ✕
          </button>
        </div>
      )}

      {/* ── Modal Publicar no Meta ── */}
      {mostrarModalPublicar && campanha && (
        <div style={styles.modalOverlay} onClick={() => !publicandoMeta && setMostrarModalPublicar(false)}>
          <div style={styles.modalBox} onClick={e => e.stopPropagation()}>
            <div style={styles.modalHeader}>
              <p style={styles.modalTitle}>Publicar no Meta Ads</p>
              <button style={styles.modalCloseBtn} onClick={() => setMostrarModalPublicar(false)} disabled={publicandoMeta}>✕</button>
            </div>

            {/* Selecionar criativo */}
            <div style={styles.modalSection}>
              <p style={styles.modalLabel}>Criativo do anúncio</p>
              <div style={styles.modalCriativosGrid}>
                {criativos.map((c) => (
                  <button
                    key={c.id}
                    style={{
                      ...styles.modalCriativoBtn,
                      ...(criativoParaMeta === c.id ? styles.modalCriativoBtnAtivo : {}),
                    }}
                    onClick={() => setCriativoParaMeta(c.id)}
                    disabled={publicandoMeta}
                    type="button"
                  >
                    <img
                      src={c.url_imagem}
                      alt="Criativo"
                      style={styles.modalCriativoImg}
                    />
                    {criativoParaMeta === c.id && (
                      <div style={styles.modalCriativoCheck}>✓</div>
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Selecionar copy */}
            {(() => {
              const copies = (campanha.estrategia as Estrategia | null)?.copies ?? [];
              return copies.length > 0 ? (
                <div style={styles.modalSection}>
                  <p style={styles.modalLabel}>Copy / descrição do anúncio <span style={{ fontWeight: 400, color: 'var(--color-text-muted)' }}>(opcional)</span></p>
                  <div style={styles.modalCopiesList}>
                    <button
                      style={{
                        ...styles.modalCopyBtn,
                        ...(copyParaMeta === null ? styles.modalCopyBtnAtivo : {}),
                      }}
                      onClick={() => setCopyParaMeta(null)}
                      disabled={publicandoMeta}
                      type="button"
                    >
                      <span style={styles.modalCopyNum}>—</span>
                      <span style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>Sem copy (usar nome da campanha)</span>
                    </button>
                    {copies.map((copy, idx) => (
                      <button
                        key={idx}
                        style={{
                          ...styles.modalCopyBtn,
                          ...(copyParaMeta === idx ? styles.modalCopyBtnAtivo : {}),
                        }}
                        onClick={() => setCopyParaMeta(idx)}
                        disabled={publicandoMeta}
                        type="button"
                      >
                        <span style={styles.modalCopyNum}>{idx + 1}</span>
                        <div style={{ minWidth: 0 }}>
                          <p style={styles.modalCopyTitulo}>{copy.titulo}</p>
                          <p style={styles.modalCopyTexto}>{copy.texto}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              ) : null;
            })()}

            {erroPublicacao && (
              <p style={{ ...styles.errorText, marginBottom: '12px' }}>{erroPublicacao}</p>
            )}

            <div style={styles.modalFooter}>
              <Button variant="ghost" size="sm" onClick={() => setMostrarModalPublicar(false)} disabled={publicandoMeta}>
                Cancelar
              </Button>
              <Button
                size="sm"
                onClick={confirmarPublicacaoNoMeta}
                disabled={!criativoParaMeta || publicandoMeta}
                style={{ background: '#1877F2', borderColor: '#1877F2' }}
              >
                {publicandoMeta ? 'Publicando...' : 'Publicar no Meta'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ── Testes A/B ── */}
      <Card style={styles.section}>
        <div style={styles.sectionHeader}>
          <p style={styles.sectionTitle}>Testes A/B</p>
          {criativos.length >= 2 && (
            <Button
              variant="secondary"
              size="sm"
              onClick={() => { setMostrarNovoTeste(v => !v); setErroTeste(''); setSelecionadoA(''); setSelecionadoB(''); }}
            >
              {mostrarNovoTeste ? 'Cancelar' : '+ Novo teste'}
            </Button>
          )}
        </div>

        {/* Formulário novo teste */}
        {mostrarNovoTeste && (
          <div style={styles.abNovoBox}>
            <p style={styles.gerarIALabel}>Selecione os dois criativos:</p>
            <div style={styles.abSelectRow}>
              <div style={styles.abSelectCol}>
                <p style={styles.abSelectLabel}>Criativo A</p>
                <div style={styles.abThumbGrid}>
                  {criativos.map(c => (
                    <button
                      key={c.id}
                      type="button"
                      style={{
                        ...styles.abThumbBtn,
                        ...(selecionadoA === c.id ? styles.abThumbBtnAtivo : {}),
                        ...(selecionadoB === c.id ? styles.abThumbBtnBloqueado : {}),
                      }}
                      onClick={() => selecionadoB !== c.id && setSelecionadoA(selecionadoA === c.id ? '' : c.id)}
                      disabled={selecionadoB === c.id}
                    >
                      <img src={c.url_imagem} alt="" style={styles.abThumbImg} />
                      {selecionadoA === c.id && <span style={styles.abThumbCheck}>A</span>}
                    </button>
                  ))}
                </div>
              </div>
              <div style={styles.abVs}>VS</div>
              <div style={styles.abSelectCol}>
                <p style={styles.abSelectLabel}>Criativo B</p>
                <div style={styles.abThumbGrid}>
                  {criativos.map(c => (
                    <button
                      key={c.id}
                      type="button"
                      style={{
                        ...styles.abThumbBtn,
                        ...(selecionadoB === c.id ? styles.abThumbBtnAtivo : {}),
                        ...(selecionadoA === c.id ? styles.abThumbBtnBloqueado : {}),
                      }}
                      onClick={() => selecionadoA !== c.id && setSelecionadoB(selecionadoB === c.id ? '' : c.id)}
                      disabled={selecionadoA === c.id}
                    >
                      <img src={c.url_imagem} alt="" style={styles.abThumbImg} />
                      {selecionadoB === c.id && <span style={styles.abThumbCheck}>B</span>}
                    </button>
                  ))}
                </div>
              </div>
            </div>
            {erroTeste && <p style={{ ...styles.errorText, marginTop: '8px' }}>{erroTeste}</p>}
            <Button
              size="sm"
              style={{ marginTop: '12px' }}
              onClick={criarTeste}
              disabled={criandoTeste || !selecionadoA || !selecionadoB}
            >
              {criandoTeste ? 'Criando...' : 'Iniciar teste'}
            </Button>
          </div>
        )}

        {criativos.length < 2 && (
          <p style={styles.muted}>Adicione pelo menos 2 criativos para criar um teste A/B.</p>
        )}

        {/* Lista de testes */}
        {loadingTestes ? (
          <p style={{ ...styles.muted, marginTop: '12px' }}>Carregando testes...</p>
        ) : testes.length === 0 && !mostrarNovoTeste ? (
          <div style={{ ...styles.criativos_vazio, marginTop: criativos.length < 2 ? '12px' : '0' }}>
            <p style={styles.muted}>Nenhum teste criado ainda.</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: mostrarNovoTeste ? '16px' : '0' }}>
            {testes.map(teste => (
              <div key={teste.id} style={styles.abTesteCard}>
                {/* Cabeçalho do teste */}
                <div style={styles.abTesteHeader}>
                  <span style={{
                    ...styles.abTesteBadge,
                    background: teste.status === 'ativo' ? 'rgba(232,93,38,0.1)' : 'rgba(150,150,150,0.1)',
                    color: teste.status === 'ativo' ? 'var(--color-ember)' : '#888',
                  }}>
                    {teste.status === 'ativo' ? 'Ativo' : 'Encerrado'}
                  </span>
                  {teste.resultado && (
                    <span style={styles.abTesteResultado}>Vencedor: {teste.resultado}</span>
                  )}
                </div>

                {/* Par de criativos */}
                <div style={styles.abTesteImagens}>
                  <div style={styles.abTesteImgWrap}>
                    <span style={styles.abTesteLabel}>A</span>
                    <img src={teste.criativo_a.url_imagem} alt="Criativo A" style={styles.abTesteImg} />
                  </div>
                  <span style={styles.abTesteVs}>VS</span>
                  <div style={styles.abTesteImgWrap}>
                    <span style={styles.abTesteLabel}>B</span>
                    <img src={teste.criativo_b.url_imagem} alt="Criativo B" style={styles.abTesteImg} />
                  </div>
                </div>

                {/* Encerrar teste */}
                {teste.status === 'ativo' && (
                  <div style={styles.abTesteEncerrar}>
                    <input
                      type="text"
                      placeholder="Descreva o vencedor (ex: Criativo A teve CTR 40% maior)"
                      value={resultadoInput[teste.id] ?? ''}
                      onChange={e => setResultadoInput(prev => ({ ...prev, [teste.id]: e.target.value }))}
                      style={styles.abTesteInput}
                    />
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => encerrarTeste(teste.id)}
                      disabled={!resultadoInput[teste.id]?.trim()}
                    >
                      Encerrar
                    </Button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </Card>
    </AppLayout>
  );
}

// ─── CriativoThumb ────────────────────────────────────────────────────────────

function CriativoThumb({
  criativo,
  onAmpliar,
  onPublicarMeta,
  publicando,
}: {
  criativo: Criativo;
  onAmpliar: (url: string) => void;
  onPublicarMeta?: (id: string) => void;
  publicando?: boolean;
}) {
  const [imgError, setImgError] = useState(false);
  const [hover, setHover] = useState(false);

  return (
    <div
      style={styles.criativos_thumb}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
    >
      <div style={{ position: 'relative' }}>
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
        {!imgError && hover && (
          <button
            style={styles.criativos_thumbZoom}
            onClick={() => onAmpliar(criativo.url_imagem)}
            title="Ver em tamanho maior"
          >
            ⤢
          </button>
        )}
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 8px' }}>
        <p style={{ ...styles.criativos_thumbData, padding: 0 }}>
          {new Date(criativo.created_at).toLocaleDateString('pt-BR')}
        </p>
        <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
          {criativo.tipo === 'gerado_ia' && (
            <span style={styles.criativos_thumbBadge}>IA</span>
          )}
          {criativo.meta_ad_id ? (
            <span style={styles.metaBadgeSmall}>Meta</span>
          ) : onPublicarMeta ? (
            <button
              style={styles.metaEnviarBtn}
              onClick={() => onPublicarMeta(criativo.id)}
              disabled={publicando}
              title="Enviar ao Meta Ads"
            >
              {publicando ? '...' : 'Meta'}
            </button>
          ) : null}
        </div>
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
  criativos_thumbZoom: {
    position: 'absolute' as const,
    top: '6px',
    right: '6px',
    width: '28px',
    height: '28px',
    borderRadius: '6px',
    background: 'rgba(0,0,0,0.55)',
    border: 'none',
    color: '#fff',
    fontSize: '15px',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    lineHeight: 1,
  },

  // Lightbox
  lightboxOverlay: {
    position: 'fixed' as const,
    inset: 0,
    background: 'rgba(0,0,0,0.85)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
    cursor: 'zoom-out',
  },
  lightboxImg: {
    maxWidth: '90vw',
    maxHeight: '90vh',
    borderRadius: '8px',
    objectFit: 'contain' as const,
    cursor: 'default',
    boxShadow: '0 8px 48px rgba(0,0,0,0.6)',
  },
  lightboxClose: {
    position: 'absolute' as const,
    top: '16px',
    right: '20px',
    background: 'rgba(255,255,255,0.12)',
    border: 'none',
    color: '#fff',
    fontSize: '18px',
    width: '36px',
    height: '36px',
    borderRadius: '50%',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Testes A/B
  abNovoBox: {
    background: 'var(--color-bg)',
    border: '1px dashed var(--color-border)',
    borderRadius: '8px',
    padding: '16px',
    marginBottom: '16px',
  },
  abSelectRow: {
    display: 'flex',
    gap: '12px',
    alignItems: 'flex-start',
  },
  abSelectCol: {
    flex: 1,
    minWidth: 0,
  },
  abSelectLabel: {
    fontSize: '11px',
    fontWeight: 700,
    color: 'var(--color-text-muted)',
    textTransform: 'uppercase' as const,
    letterSpacing: '0.06em',
    margin: '0 0 8px 0',
    fontFamily: 'var(--font-ui)',
  },
  abThumbGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(72px, 1fr))',
    gap: '6px',
  },
  abThumbBtn: {
    position: 'relative' as const,
    border: '2px solid var(--color-border)',
    borderRadius: '6px',
    overflow: 'hidden',
    background: 'none',
    cursor: 'pointer',
    padding: 0,
    aspectRatio: '1 / 1',
  },
  abThumbBtnAtivo: {
    borderColor: 'var(--color-ember)',
    boxShadow: '0 0 0 2px rgba(232,93,38,0.25)',
  },
  abThumbBtnBloqueado: {
    opacity: 0.35,
    cursor: 'not-allowed',
  },
  abThumbImg: {
    width: '100%',
    height: '100%',
    objectFit: 'cover' as const,
    display: 'block',
  },
  abThumbCheck: {
    position: 'absolute' as const,
    top: '4px',
    right: '4px',
    fontSize: '10px',
    fontWeight: 800,
    background: 'var(--color-ember)',
    color: '#fff',
    borderRadius: '4px',
    padding: '1px 5px',
    fontFamily: 'var(--font-ui)',
  },
  abVs: {
    fontSize: '12px',
    fontWeight: 800,
    color: 'var(--color-text-muted)',
    alignSelf: 'center',
    padding: '0 4px',
    fontFamily: 'var(--font-ui)',
  },
  abTesteCard: {
    border: '1px solid var(--color-border)',
    borderRadius: '8px',
    padding: '16px',
    background: 'var(--color-bg-card)',
  },
  abTesteHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    marginBottom: '12px',
  },
  abTesteBadge: {
    fontSize: '10px',
    fontWeight: 700,
    borderRadius: '20px',
    padding: '3px 10px',
    textTransform: 'uppercase' as const,
    letterSpacing: '0.04em',
    fontFamily: 'var(--font-ui)',
  },
  abTesteResultado: {
    fontSize: '12px',
    color: 'var(--color-text-muted)',
    fontFamily: 'var(--font-ui)',
  },
  abTesteImagens: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  abTesteImgWrap: {
    position: 'relative' as const,
    width: '80px',
    flexShrink: 0,
    borderRadius: '6px',
    overflow: 'hidden',
    border: '1px solid var(--color-border)',
  },
  abTesteLabel: {
    position: 'absolute' as const,
    top: '4px',
    left: '4px',
    fontSize: '10px',
    fontWeight: 800,
    background: 'rgba(0,0,0,0.55)',
    color: '#fff',
    borderRadius: '3px',
    padding: '1px 5px',
    fontFamily: 'var(--font-ui)',
  },
  abTesteImg: {
    width: '80px',
    height: '80px',
    objectFit: 'cover' as const,
    display: 'block',
  },
  abTesteVs: {
    fontSize: '11px',
    fontWeight: 800,
    color: 'var(--color-text-muted)',
    flexShrink: 0,
    fontFamily: 'var(--font-ui)',
  },
  abTesteEncerrar: {
    display: 'flex',
    gap: '8px',
    alignItems: 'center',
    marginTop: '12px',
  },
  abTesteInput: {
    flex: 1,
    background: 'var(--color-bg)',
    border: '1px solid var(--color-border)',
    borderRadius: '6px',
    padding: '7px 10px',
    fontSize: '12px',
    fontFamily: 'var(--font-ui)',
    color: 'var(--color-text-primary)',
    outline: 'none',
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
  templateGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(4, 1fr)',
    gap: '8px',
    marginBottom: '20px',
  },
  templateCard: {
    background: 'rgba(255,255,255,0.03)',
    border: '1px solid var(--color-border)',
    borderRadius: '8px',
    padding: '0 0 8px',
    cursor: 'pointer',
    textAlign: 'left' as const,
    overflow: 'hidden',
    transition: 'border-color 0.15s',
  },
  templateCardAtivo: {
    border: '1px solid var(--color-ember)',
    background: 'rgba(232,93,38,0.06)',
  },
  templatePreview: {
    position: 'relative' as const,
    width: '100%',
    paddingTop: '100%', // quadrado
    background: 'linear-gradient(135deg, #1a1a2e 0%, #2d1b4e 50%, #0d0d1a 100%)',
    marginBottom: '6px',
    overflow: 'hidden',
  },
  templatePreviewGrad: {
    position: 'absolute' as const,
    inset: 0,
  },
  templatePreviewTitle: {
    position: 'absolute' as const,
    left: '8%',
    right: '8%',
    color: '#fff',
    fontWeight: 700,
    fontFamily: 'var(--font-ui)',
    lineHeight: 1.2,
    textShadow: '0 1px 3px rgba(0,0,0,0.5)',
  },
  templatePreviewCopy: {
    position: 'absolute' as const,
    left: '8%',
    right: '8%',
    color: 'rgba(255,255,255,0.75)',
    fontSize: '7px',
    fontFamily: 'var(--font-ui)',
    lineHeight: 1.3,
  },
  templateNome: {
    margin: '0 8px 2px',
    fontSize: '11px',
    fontWeight: 600,
    color: 'var(--color-text-primary)',
    fontFamily: 'var(--font-ui)',
  },
  templateDesc: {
    margin: '0 8px',
    fontSize: '10px',
    color: 'var(--color-text-muted)',
    fontFamily: 'var(--font-ui)',
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

  // Modal Publicar no Meta
  modalOverlay: {
    position: 'fixed' as const,
    inset: 0,
    background: 'rgba(0,0,0,0.6)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 200,
    padding: '16px',
  },
  modalBox: {
    background: 'var(--color-bg-card)',
    border: '1px solid var(--color-border)',
    borderRadius: '12px',
    width: '100%',
    maxWidth: '540px',
    maxHeight: '85vh',
    overflowY: 'auto' as const,
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '0',
  },
  modalHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '20px 24px 16px',
    borderBottom: '1px solid var(--color-border)',
  },
  modalTitle: {
    fontSize: '16px',
    fontWeight: 700,
    color: 'var(--color-text-primary)',
    fontFamily: 'var(--font-display)',
    margin: 0,
  },
  modalCloseBtn: {
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    color: 'var(--color-text-muted)',
    fontSize: '16px',
    padding: '4px',
  },
  modalSection: {
    padding: '16px 24px',
    borderBottom: '1px solid var(--color-border)',
  },
  modalLabel: {
    fontSize: '12px',
    fontWeight: 600,
    color: 'var(--color-text-muted)',
    textTransform: 'uppercase' as const,
    letterSpacing: '0.06em',
    marginBottom: '12px',
    margin: '0 0 12px',
    fontFamily: 'var(--font-ui)',
  },
  modalCriativosGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(90px, 1fr))',
    gap: '8px',
  },
  modalCriativoBtn: {
    position: 'relative' as const,
    border: '2px solid var(--color-border)',
    borderRadius: '8px',
    overflow: 'hidden',
    cursor: 'pointer',
    padding: 0,
    background: 'none',
    aspectRatio: '1',
  },
  modalCriativoBtnAtivo: {
    borderColor: '#1877F2',
  },
  modalCriativoImg: {
    width: '100%',
    height: '100%',
    objectFit: 'cover' as const,
    display: 'block',
  },
  modalCriativoCheck: {
    position: 'absolute' as const,
    top: '4px',
    right: '4px',
    background: '#1877F2',
    color: 'white',
    borderRadius: '50%',
    width: '20px',
    height: '20px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '11px',
    fontWeight: 700,
  },
  modalCopiesList: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '6px',
    maxHeight: '200px',
    overflowY: 'auto' as const,
  },
  modalCopyBtn: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: '10px',
    padding: '10px 12px',
    border: '1px solid var(--color-border)',
    borderRadius: '8px',
    cursor: 'pointer',
    background: 'transparent',
    textAlign: 'left' as const,
    width: '100%',
  },
  modalCopyBtnAtivo: {
    borderColor: '#1877F2',
    background: '#1877F208',
  },
  modalCopyNum: {
    fontSize: '11px',
    fontWeight: 700,
    color: '#1877F2',
    background: '#1877F218',
    borderRadius: '4px',
    padding: '2px 7px',
    fontFamily: 'var(--font-ui)',
    flexShrink: 0,
    marginTop: '1px',
  },
  modalCopyTitulo: {
    fontSize: '13px',
    fontWeight: 600,
    color: 'var(--color-text-primary)',
    margin: '0 0 2px',
    fontFamily: 'var(--font-ui)',
  },
  modalCopyTexto: {
    fontSize: '12px',
    color: 'var(--color-text-muted)',
    margin: 0,
    fontFamily: 'var(--font-ui)',
    lineHeight: 1.4,
    overflow: 'hidden',
    display: '-webkit-box',
    WebkitLineClamp: 2,
    WebkitBoxOrient: 'vertical' as const,
  },
  modalFooter: {
    display: 'flex',
    justifyContent: 'flex-end',
    gap: '8px',
    padding: '16px 24px',
  },

  // Meta Ads
  metaBadgeOk: {
    fontSize: '11px',
    fontWeight: 600,
    color: '#1877F2',
    background: '#1877F218',
    border: '1px solid #1877F240',
    borderRadius: '6px',
    padding: '4px 10px',
    fontFamily: 'var(--font-ui)',
    whiteSpace: 'nowrap' as const,
  },
  metaBadgeSmall: {
    fontSize: '10px',
    fontWeight: 600,
    color: '#1877F2',
    background: '#1877F218',
    border: '1px solid #1877F240',
    borderRadius: '4px',
    padding: '2px 6px',
    fontFamily: 'var(--font-ui)',
  },
  metaEnviarBtn: {
    fontSize: '10px',
    fontWeight: 600,
    color: '#1877F2',
    background: 'transparent',
    border: '1px solid #1877F280',
    borderRadius: '4px',
    padding: '2px 6px',
    cursor: 'pointer',
    fontFamily: 'var(--font-ui)',
  },

  // Color Palette
  paletaGrid: {
    display: 'flex',
    flexWrap: 'wrap' as const,
    gap: '6px',
    marginTop: '4px',
  },
  paletaOpcaoBtn: {
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
    gap: '4px',
    padding: '7px 10px',
    border: '1px solid var(--color-border)',
    borderRadius: '8px',
    background: 'var(--color-bg-card)',
    cursor: 'pointer',
  },
  paletaOpcaoBtnAtivo: {
    borderColor: 'var(--color-ember)',
    boxShadow: '0 0 0 2px rgba(232,93,38,0.2)',
  },
  paletaSwatches: {
    display: 'flex',
    gap: '3px',
  },
  palettaSwatch: {
    width: '14px',
    height: '14px',
    borderRadius: '50%',
    border: '1px solid rgba(0,0,0,0.12)',
    flexShrink: 0,
  },
  paletaItemLabel: {
    fontSize: '11px',
    fontWeight: 500,
    color: 'var(--color-text-primary)',
    fontFamily: 'var(--font-ui)',
  },
  paletaNenhuma: {
    fontSize: '11px',
    fontWeight: 500,
    color: 'var(--color-text-muted)',
    fontFamily: 'var(--font-ui)',
    lineHeight: '22px',
  },
  coresCustomRow: {
    display: 'flex',
    gap: '16px',
    marginTop: '10px',
    flexWrap: 'wrap' as const,
  },
  corCustomItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  colorPicker: {
    width: '36px',
    height: '36px',
    border: '1px solid var(--color-border)',
    borderRadius: '6px',
    padding: '2px',
    cursor: 'pointer',
    background: 'var(--color-bg-card)',
  },
  corCustomLabel: {
    fontSize: '11px',
    fontFamily: 'var(--font-ui)',
    color: 'var(--color-text-muted)',
    letterSpacing: '0.04em',
  },

  // Reference Image
  refImagePreview: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    marginTop: '8px',
  },
  refImageImg: {
    width: '60px',
    height: '60px',
    objectFit: 'contain' as const,
    borderRadius: '6px',
    border: '1px solid var(--color-border)',
    background: 'var(--color-bg)',
  },
  refImageRemove: {
    fontSize: '12px',
    color: 'var(--color-text-muted)',
    background: 'none',
    border: '1px solid var(--color-border)',
    borderRadius: '6px',
    padding: '5px 10px',
    cursor: 'pointer',
    fontFamily: 'var(--font-ui)',
  },
  refUploadBtn: {
    marginTop: '6px',
    fontSize: '12px',
    color: 'var(--color-text-muted)',
    background: 'var(--color-bg)',
    border: '1px dashed var(--color-border)',
    borderRadius: '8px',
    padding: '10px 16px',
    cursor: 'pointer',
    fontFamily: 'var(--font-ui)',
    width: '100%',
    textAlign: 'center' as const,
    display: 'block',
  },
};
