import React, { useState } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { useAuth } from '@/contexts/AuthContext';
import { usePlanos } from '@/hooks/usePlanos';

function formatCpf(value: string): string {
  const digits = value.replace(/\D/g, '').slice(0, 11);
  return digits
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d{1,2})$/, '$1-$2');
}

function formatTelefone(value: string): string {
  const digits = value.replace(/\D/g, '').slice(0, 11);
  if (digits.length <= 10) {
    return digits.replace(/(\d{2})(\d{4})(\d{0,4})/, '($1) $2-$3').trim().replace(/-$/, '');
  }
  return digits.replace(/(\d{2})(\d{5})(\d{0,4})/, '($1) $2-$3').trim().replace(/-$/, '');
}

export function AssinaturaPage() {
  const { user } = useAuth();
  const { planos, loading, error, assinar } = usePlanos();
  const [assinando, setAssinando] = useState<string | null>(null);
  const [erroCheckout, setErroCheckout] = useState('');

  const [cpf, setCpf] = useState(user?.cpf ?? '');
  const [telefone, setTelefone] = useState(user?.telefone ?? '');
  const [pendingSlug, setPendingSlug] = useState<string | null>(null);

  const precisaDados = !cpf || cpf.replace(/\D/g, '').length < 11 || !telefone || telefone.replace(/\D/g, '').length < 10;

  async function executarAssinar(slug: string, cpfVal: string, telefoneVal: string) {
    setAssinando(slug);
    setErroCheckout('');
    try {
      await assinar(slug, cpfVal, telefoneVal);
    } catch (err) {
      setErroCheckout(err instanceof Error ? err.message : 'Erro ao iniciar pagamento');
      setAssinando(null);
    }
  }

  async function handleAssinar(slug: string) {
    if (precisaDados) {
      setPendingSlug(slug);
      return;
    }
    await executarAssinar(slug, cpf, telefone);
  }

  async function handleConfirmarDados(e: React.FormEvent) {
    e.preventDefault();
    if (!pendingSlug) return;
    await executarAssinar(pendingSlug, cpf, telefone);
    setPendingSlug(null);
  }

  const planoAtual = user?.plano ?? 'free';

  return (
    <AppLayout>
      <div style={{ maxWidth: 900, margin: '0 auto', padding: '40px 24px' }}>
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 28, fontWeight: 700, color: 'var(--color-text-primary)', marginBottom: 8 }}>
          Planos
        </h1>
        <p style={{ color: 'var(--color-text-muted)', marginBottom: 40, fontSize: 15 }}>
          Escolha o plano ideal para escalar suas campanhas com IA.
        </p>

        {error && (
          <div style={{ background: '#fee2e2', color: '#991b1b', padding: '12px 16px', borderRadius: 8, marginBottom: 24 }}>
            {error}
          </div>
        )}

        {erroCheckout && (
          <div style={{ background: '#fee2e2', color: '#991b1b', padding: '12px 16px', borderRadius: 8, marginBottom: 24 }}>
            {erroCheckout}
          </div>
        )}

        {pendingSlug && (
          <form
            onSubmit={handleConfirmarDados}
            style={{
              background: 'var(--color-bg-card)',
              border: '1px solid var(--color-border)',
              borderRadius: 'var(--radius-card)',
              padding: '24px',
              marginBottom: 32,
              display: 'flex',
              flexDirection: 'column',
              gap: 16,
            }}
          >
            <p style={{ fontWeight: 600, color: 'var(--color-text-primary)', margin: 0, fontSize: 15 }}>
              Para continuar, informe seus dados de pagamento:
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <label style={{ fontSize: 13, fontWeight: 500, color: 'var(--color-text-primary)' }}>CPF</label>
                <input
                  type="text"
                  placeholder="000.000.000-00"
                  value={cpf}
                  onChange={(e) => setCpf(formatCpf(e.target.value))}
                  required
                  style={inputStyle}
                />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <label style={{ fontSize: 13, fontWeight: 500, color: 'var(--color-text-primary)' }}>Telefone (com DDD)</label>
                <input
                  type="text"
                  placeholder="(11) 99999-9999"
                  value={telefone}
                  onChange={(e) => setTelefone(formatTelefone(e.target.value))}
                  required
                  style={inputStyle}
                />
              </div>
            </div>
            <div style={{ display: 'flex', gap: 12 }}>
              <button
                type="submit"
                disabled={assinando !== null}
                style={{
                  padding: '10px 24px',
                  borderRadius: 'var(--radius-btn)',
                  border: 'none',
                  cursor: 'pointer',
                  background: 'var(--color-ember)',
                  color: '#fff',
                  fontWeight: 600,
                  fontSize: 14,
                }}
              >
                {assinando ? 'Redirecionando...' : 'Continuar para pagamento'}
              </button>
              <button
                type="button"
                onClick={() => setPendingSlug(null)}
                style={{
                  padding: '10px 24px',
                  borderRadius: 'var(--radius-btn)',
                  border: '1px solid var(--color-border)',
                  cursor: 'pointer',
                  background: 'transparent',
                  color: 'var(--color-text-muted)',
                  fontWeight: 600,
                  fontSize: 14,
                }}
              >
                Cancelar
              </button>
            </div>
          </form>
        )}

        {loading ? (
          <p style={{ color: 'var(--color-text-muted)' }}>Carregando planos...</p>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 24 }}>
            {planos.map((plano) => {
              const ativo = plano.slug === planoAtual;
              const isPro = plano.slug === 'pro';

              return (
                <div
                  key={plano.slug}
                  style={{
                    background: 'var(--color-bg-card)',
                    border: isPro
                      ? '2px solid var(--color-ember)'
                      : '1px solid var(--color-border)',
                    borderRadius: 'var(--radius-card)',
                    padding: '28px 24px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 20,
                    boxShadow: 'var(--shadow-card)',
                    position: 'relative',
                  }}
                >
                  {isPro && (
                    <span
                      style={{
                        position: 'absolute',
                        top: -12,
                        left: '50%',
                        transform: 'translateX(-50%)',
                        background: 'var(--color-ember)',
                        color: '#fff',
                        fontSize: 11,
                        fontWeight: 700,
                        letterSpacing: '0.06em',
                        padding: '3px 12px',
                        borderRadius: 20,
                        textTransform: 'uppercase',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      Mais escolhido
                    </span>
                  )}

                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                      <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 18, fontWeight: 700, color: 'var(--color-text-primary)', margin: 0 }}>
                        {plano.nome}
                      </h2>
                      {ativo && (
                        <span style={{ background: '#d1fae5', color: '#065f46', fontSize: 11, fontWeight: 600, padding: '2px 8px', borderRadius: 20 }}>
                          Plano atual
                        </span>
                      )}
                    </div>
                    <p style={{ fontSize: 26, fontWeight: 800, color: 'var(--color-text-primary)', margin: 0, fontFamily: 'var(--font-display)' }}>
                      {plano.precoFormatado}
                    </p>
                  </div>

                  <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {plano.features.map((f) => (
                      <li key={f} style={{ display: 'flex', alignItems: 'flex-start', gap: 8, color: 'var(--color-text-primary)', fontSize: 14 }}>
                        <span style={{ color: 'var(--color-ember)', fontWeight: 700, flexShrink: 0 }}>✓</span>
                        {f}
                      </li>
                    ))}
                  </ul>

                  {plano.slug !== 'free' && (
                    <button
                      onClick={() => !ativo && handleAssinar(plano.slug)}
                      disabled={ativo || assinando !== null}
                      style={{
                        marginTop: 'auto',
                        padding: '12px 0',
                        borderRadius: 'var(--radius-btn)',
                        border: 'none',
                        cursor: ativo ? 'default' : 'pointer',
                        background: ativo
                          ? 'var(--color-border)'
                          : isPro
                          ? 'var(--color-ember)'
                          : 'var(--color-text-primary)',
                        color: ativo ? 'var(--color-text-muted)' : '#fff',
                        fontWeight: 600,
                        fontSize: 14,
                        opacity: assinando !== null && assinando !== plano.slug ? 0.6 : 1,
                      }}
                    >
                      {ativo
                        ? 'Plano atual'
                        : assinando === plano.slug
                        ? 'Redirecionando...'
                        : `Assinar ${plano.nome}`}
                    </button>
                  )}
                  {plano.slug === 'free' && (
                    <div style={{
                      marginTop: 'auto',
                      padding: '12px 0',
                      textAlign: 'center',
                      fontSize: 14,
                      color: 'var(--color-text-muted)',
                      fontFamily: 'var(--font-ui)',
                    }}>
                      {ativo ? 'Plano atual' : 'Incluído na criação de conta'}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </AppLayout>
  );
}

const inputStyle: React.CSSProperties = {
  padding: '10px 12px',
  borderRadius: 8,
  border: '1px solid var(--color-border)',
  background: 'var(--color-bg)',
  color: 'var(--color-text-primary)',
  fontSize: 14,
  width: '100%',
  boxSizing: 'border-box',
};
