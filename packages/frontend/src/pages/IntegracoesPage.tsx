import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { AppLayout } from '@/components/layout/AppLayout';
import { Button, Card } from '@/components/ui';
import { api } from '@/lib/api';

interface Integracao {
  plataforma: 'meta' | 'google';
  conectado: boolean;
  account_id: string | null;
  expires_at: string | null;
}

interface Conta {
  id: string;
  name: string;
}

const PLATAFORMA_INFO = {
  meta: {
    nome: 'Meta Ads',
    descricao: 'Facebook & Instagram Ads — acesse métricas e otimize campanhas automaticamente.',
    cor: '#1877F2',
    icon: 'f',
    accountLabel: 'Conta de anúncios',
    accountHint: 'Selecione a conta que contém suas campanhas.',
  },
  google: {
    nome: 'Google Ads',
    descricao: 'Search, Display & YouTube — monitore performance em tempo real.',
    cor: '#34A853',
    icon: 'G',
    accountLabel: 'Conta do Google Ads',
    accountHint: 'Selecione a conta que contém suas campanhas.',
  },
};

export function IntegracoesPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [integracoes, setIntegracoes] = useState<Integracao[]>([]);
  const [loading, setLoading] = useState(true);
  const [conectando, setConectando] = useState<string | null>(null);
  const [desconectando, setDesconectando] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{ tipo: 'sucesso' | 'erro'; msg: string } | null>(null);

  // estado do seletor de conta por plataforma
  const [contas, setContas] = useState<Record<string, Conta[]>>({ meta: [], google: [] });
  const [loadingContas, setLoadingContas] = useState<Record<string, boolean>>({ meta: false, google: false });
  const [contaSelecionada, setContaSelecionada] = useState<Record<string, string>>({});
  const [salvandoConta, setSalvandoConta] = useState<string | null>(null);

  async function carregar() {
    setLoading(true);
    try {
      const data = await api.get<Integracao[]>('/integracoes');
      setIntegracoes(data);
      // pré-preenche os inputs com o account_id já salvo
      const mapa: Record<string, string> = {};
      data.forEach(i => { if (i.account_id) mapa[i.plataforma] = i.account_id; });
      setContaSelecionada(mapa);
    } finally {
      setLoading(false);
    }
  }

  async function carregarContas(plataforma: string) {
    setLoadingContas(prev => ({ ...prev, [plataforma]: true }));
    try {
      const data = await api.get<Conta[]>(`/integracoes/${plataforma}/contas`);
      setContas(prev => ({ ...prev, [plataforma]: data }));
    } catch {
      setFeedback({ tipo: 'erro', msg: `Não foi possível buscar as contas do ${PLATAFORMA_INFO[plataforma as keyof typeof PLATAFORMA_INFO]?.nome}.` });
    } finally {
      setLoadingContas(prev => ({ ...prev, [plataforma]: false }));
    }
  }

  useEffect(() => { carregar(); }, []);

  // Lê parâmetros após callback OAuth
  useEffect(() => {
    const conectado = searchParams.get('conectado');
    const erro = searchParams.get('erro');
    if (conectado) {
      const info = PLATAFORMA_INFO[conectado as keyof typeof PLATAFORMA_INFO];
      setFeedback({ tipo: 'sucesso', msg: `${info?.nome ?? conectado} conectado! Agora selecione a conta de anúncios.` });
      carregar();
      carregarContas(conectado);
      setSearchParams({}, { replace: true });
    } else if (erro) {
      const info = PLATAFORMA_INFO[erro as keyof typeof PLATAFORMA_INFO];
      setFeedback({ tipo: 'erro', msg: `Falha ao conectar ${info?.nome ?? erro}. Tente novamente.` });
      setSearchParams({}, { replace: true });
    }
  }, []);

  async function conectar(plataforma: string) {
    setConectando(plataforma);
    try {
      const { url } = await api.get<{ url: string }>(`/integracoes/${plataforma}`);
      window.location.href = url;
    } catch {
      setFeedback({ tipo: 'erro', msg: 'Não foi possível iniciar a conexão.' });
      setConectando(null);
    }
  }

  async function desconectar(plataforma: string) {
    setDesconectando(plataforma);
    try {
      await api.delete(`/integracoes/${plataforma}`);
      await carregar();
      setContas(prev => ({ ...prev, [plataforma]: [] }));
      const info = PLATAFORMA_INFO[plataforma as keyof typeof PLATAFORMA_INFO];
      setFeedback({ tipo: 'sucesso', msg: `${info?.nome ?? plataforma} desconectado.` });
    } catch {
      setFeedback({ tipo: 'erro', msg: 'Erro ao desconectar.' });
    } finally {
      setDesconectando(null);
    }
  }

  async function salvarConta(plataforma: string) {
    const account_id = contaSelecionada[plataforma]?.trim();
    if (!account_id) return;
    setSalvandoConta(plataforma);
    try {
      await api.patch(`/integracoes/${plataforma}/conta`, { account_id });
      await carregar();
      setFeedback({ tipo: 'sucesso', msg: 'Conta salva com sucesso!' });
    } catch {
      setFeedback({ tipo: 'erro', msg: 'Erro ao salvar conta.' });
    } finally {
      setSalvandoConta(null);
    }
  }

  return (
    <AppLayout>
      <div style={styles.header}>
        <h1 style={styles.title}>Integrações</h1>
        <p style={styles.subtitle}>Conecte suas contas de anúncios para habilitar métricas e otimização automática.</p>
      </div>

      {feedback && (
        <div style={{
          ...styles.feedback,
          background: feedback.tipo === 'sucesso' ? 'rgba(52,168,83,0.1)' : 'rgba(232,93,38,0.1)',
          borderColor: feedback.tipo === 'sucesso' ? '#34A853' : 'var(--color-ember)',
          color: feedback.tipo === 'sucesso' ? '#34A853' : 'var(--color-ember)',
        }}>
          {feedback.msg}
          <button style={styles.feedbackClose} onClick={() => setFeedback(null)}>✕</button>
        </div>
      )}

      {loading ? (
        <p style={styles.muted}>Carregando...</p>
      ) : (
        <div style={styles.grid}>
          {integracoes.map(integ => {
            const info = PLATAFORMA_INFO[integ.plataforma];
            const ocupado = conectando === integ.plataforma || desconectando === integ.plataforma;
            const contaConfigurada = !!integ.account_id;

            return (
              <Card key={integ.plataforma} style={styles.card}>
                {/* ── Cabeçalho ── */}
                <div style={styles.cardHeader}>
                  <div style={{ ...styles.platformIcon, background: info.cor }}>
                    {info.icon}
                  </div>
                  <div style={styles.cardInfo}>
                    <div style={styles.cardTitleRow}>
                      <span style={styles.cardNome}>{info.nome}</span>
                      <span style={{
                        ...styles.statusBadge,
                        background: integ.conectado
                          ? contaConfigurada ? 'rgba(52,168,83,0.12)' : 'rgba(255,160,0,0.12)'
                          : 'rgba(150,150,150,0.1)',
                        color: integ.conectado
                          ? contaConfigurada ? '#34A853' : '#e6a000'
                          : '#888',
                      }}>
                        {integ.conectado
                          ? contaConfigurada ? '● Pronto' : '● Conta pendente'
                          : '○ Desconectado'}
                      </span>
                    </div>
                    <p style={styles.cardDesc}>{info.descricao}</p>
                    {integ.conectado && integ.expires_at && (
                      <p style={styles.expira}>
                        Token expira em {new Date(integ.expires_at).toLocaleDateString('pt-BR')}
                      </p>
                    )}
                  </div>
                </div>

                {/* ── Seletor de conta (só aparece quando conectado) ── */}
                {integ.conectado && (
                  <div style={styles.contaBox}>
                    <p style={styles.contaLabel}>{info.accountLabel}</p>
                    <p style={styles.contaHint}>{info.accountHint}</p>

                    {/* Meta e Google: lista de botões com contas buscadas via API */}
                    {(() => {
                      const p = integ.plataforma;
                      const lista = contas[p] ?? [];
                      const buscando = loadingContas[p] ?? false;
                      const selecionado = contaSelecionada[p] ?? '';
                      return (
                        <>
                          {lista.length === 0 ? (
                            <Button variant="secondary" size="sm" onClick={() => carregarContas(p)} disabled={buscando}>
                              {buscando ? 'Buscando...' : 'Buscar contas disponíveis'}
                            </Button>
                          ) : (
                            <>
                              <div style={styles.contaLista}>
                                {lista.map(c => (
                                  <button
                                    key={c.id}
                                    type="button"
                                    style={{
                                      ...styles.contaOpcao,
                                      ...(selecionado === c.id ? styles.contaOpcaoAtiva : {}),
                                    }}
                                    onClick={() => setContaSelecionada(prev => ({ ...prev, [p]: c.id }))}
                                  >
                                    <span style={styles.contaOpcaoNome}>{c.name}</span>
                                    <span style={styles.contaOpcaoId}>{c.id}</span>
                                    {selecionado === c.id && <span style={styles.contaOpcaoCheck}>✓</span>}
                                  </button>
                                ))}
                              </div>
                              <div style={{ display: 'flex', gap: '8px', marginTop: '10px' }}>
                                <Button
                                  size="sm"
                                  onClick={() => salvarConta(p)}
                                  disabled={!selecionado || salvandoConta === p}
                                >
                                  {salvandoConta === p ? 'Salvando...' : 'Confirmar seleção'}
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => setContas(prev => ({ ...prev, [p]: [] }))}
                                >
                                  Atualizar lista
                                </Button>
                              </div>
                            </>
                          )}
                        </>
                      );
                    })()}

                    {integ.account_id && (
                      <p style={styles.contaAtual}>Conta ativa: <strong>{integ.account_id}</strong></p>
                    )}
                  </div>
                )}

                {/* ── Ações ── */}
                <div style={styles.cardFooter}>
                  {integ.conectado ? (
                    <>
                      <Button variant="secondary" size="sm" onClick={() => conectar(integ.plataforma)} disabled={ocupado}>
                        {conectando === integ.plataforma ? 'Redirecionando...' : 'Reconectar'}
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => desconectar(integ.plataforma)} disabled={ocupado} style={{ color: '#888' }}>
                        {desconectando === integ.plataforma ? 'Removendo...' : 'Desconectar'}
                      </Button>
                    </>
                  ) : (
                    <Button size="sm" onClick={() => conectar(integ.plataforma)} disabled={ocupado}>
                      {conectando === integ.plataforma ? 'Redirecionando...' : `Conectar ${info.nome}`}
                    </Button>
                  )}
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </AppLayout>
  );
}

const styles: Record<string, React.CSSProperties> = {
  header: { marginBottom: '28px' },
  title: {
    fontFamily: 'var(--font-display)',
    fontSize: '28px',
    fontWeight: 800,
    margin: '0 0 6px 0',
  },
  subtitle: {
    fontSize: '13px',
    color: 'var(--color-text-muted)',
    margin: 0,
    fontFamily: 'var(--font-ui)',
  },
  muted: {
    fontSize: '13px',
    color: 'var(--color-text-muted)',
    fontFamily: 'var(--font-ui)',
  },
  feedback: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '12px 16px',
    borderRadius: '8px',
    border: '1px solid',
    fontSize: '13px',
    fontFamily: 'var(--font-ui)',
    marginBottom: '20px',
  },
  feedbackClose: {
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    fontSize: '12px',
    color: 'inherit',
    padding: '0 0 0 12px',
    lineHeight: 1,
  },
  grid: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  },
  card: { padding: '20px 24px' },
  cardHeader: {
    display: 'flex',
    gap: '16px',
    alignItems: 'flex-start',
    marginBottom: '16px',
  },
  platformIcon: {
    width: '40px',
    height: '40px',
    borderRadius: '10px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: '#fff',
    fontWeight: 800,
    fontSize: '16px',
    fontFamily: 'var(--font-display)',
    flexShrink: 0,
  },
  cardInfo: { flex: 1, minWidth: 0 },
  cardTitleRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    marginBottom: '4px',
  },
  cardNome: {
    fontSize: '15px',
    fontWeight: 700,
    color: 'var(--color-text-primary)',
    fontFamily: 'var(--font-ui)',
  },
  statusBadge: {
    fontSize: '11px',
    fontWeight: 500,
    padding: '2px 9px',
    borderRadius: '20px',
    fontFamily: 'var(--font-ui)',
  },
  cardDesc: {
    fontSize: '13px',
    color: 'var(--color-text-muted)',
    margin: 0,
    fontFamily: 'var(--font-ui)',
    lineHeight: 1.5,
  },
  expira: {
    fontSize: '11px',
    color: 'var(--color-text-muted)',
    margin: '6px 0 0 0',
    fontFamily: 'var(--font-ui)',
  },
  // Conta
  contaBox: {
    background: 'var(--color-bg)',
    border: '1px solid var(--color-border)',
    borderRadius: '8px',
    padding: '14px 16px',
    marginBottom: '16px',
  },
  contaLabel: {
    fontSize: '11px',
    fontWeight: 700,
    color: 'var(--color-text-muted)',
    textTransform: 'uppercase' as const,
    letterSpacing: '0.05em',
    margin: '0 0 4px 0',
    fontFamily: 'var(--font-ui)',
  },
  contaHint: {
    fontSize: '12px',
    color: 'var(--color-text-muted)',
    margin: '0 0 10px 0',
    fontFamily: 'var(--font-ui)',
  },
  contaRow: {
    display: 'flex',
    gap: '8px',
    alignItems: 'center',
  },
  contaLista: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '6px',
  },
  contaOpcao: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    padding: '10px 14px',
    background: 'var(--color-bg-card)',
    border: '1px solid var(--color-border)',
    borderRadius: '8px',
    cursor: 'pointer',
    textAlign: 'left' as const,
    width: '100%',
    transition: 'border-color 0.15s',
  },
  contaOpcaoAtiva: {
    borderColor: 'var(--color-ember)',
    background: 'rgba(232,93,38,0.05)',
  },
  contaOpcaoNome: {
    fontSize: '13px',
    fontWeight: 600,
    color: 'var(--color-text-primary)',
    fontFamily: 'var(--font-ui)',
    flex: 1,
  },
  contaOpcaoId: {
    fontSize: '11px',
    color: 'var(--color-text-muted)',
    fontFamily: 'var(--font-ui)',
    flexShrink: 0,
  },
  contaOpcaoCheck: {
    fontSize: '13px',
    color: 'var(--color-ember)',
    fontWeight: 700,
    flexShrink: 0,
  },
  contaAtual: {
    fontSize: '12px',
    color: 'var(--color-text-muted)',
    margin: '10px 0 0 0',
    fontFamily: 'var(--font-ui)',
  },
  cardFooter: {
    display: 'flex',
    gap: '8px',
    borderTop: '1px solid var(--color-border)',
    paddingTop: '16px',
  },
};
