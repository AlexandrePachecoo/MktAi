import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

/* ─── SVG Logo — Farol ──────────────────────────────────────────────────── */
function FarolIcon({ size = 28 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 36" fill="none" aria-hidden="true">
      {/* Raios de luz */}
      <line x1="16" y1="10" x2="16" y2="2"  stroke="#e85d26" strokeWidth="2.5" strokeLinecap="round" />
      <line x1="16" y1="10" x2="8"  y2="4"  stroke="#e85d26" strokeWidth="2.5" strokeLinecap="round" />
      <line x1="16" y1="10" x2="24" y2="4"  stroke="#e85d26" strokeWidth="2.5" strokeLinecap="round" />
      <line x1="16" y1="10" x2="4"  y2="11" stroke="#e85d26" strokeWidth="2"   strokeLinecap="round" />
      <line x1="16" y1="10" x2="28" y2="11" stroke="#e85d26" strokeWidth="2"   strokeLinecap="round" />
      {/* Sala da lâmpada */}
      <rect x="11" y="10" width="10" height="6" rx="2" fill="var(--logo-body)" />
      {/* Torre — afunila levemente */}
      <path d="M12.5 16 L10 30 L22 30 L19.5 16 Z" fill="var(--logo-body)" />
      {/* Base */}
      <rect x="8" y="30" width="16" height="3.5" rx="2" fill="var(--logo-body)" />
      {/* Lente */}
      <circle cx="16" cy="13" r="2.5" fill="#e85d26" opacity="0.95" />
    </svg>
  );
}

/* ─── Mock Dashboard Card (Hero) ────────────────────────────────────────── */
function DashboardMock() {
  return (
    <div style={{
      background: 'var(--bg-card)',
      border: '1px solid var(--border)',
      borderRadius: 16,
      padding: '24px 28px',
      maxWidth: 460,
      margin: '0 auto',
      boxShadow: '0 24px 48px rgba(0,0,0,0.08)',
    }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
        <div>
          <p style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: 'var(--font-ui)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 4 }}>
            Campanha ativa
          </p>
          <p style={{ fontSize: 16, fontWeight: 500, fontFamily: 'var(--font-ui)', color: 'var(--text-primary)' }}>
            Lançamento Produto X
          </p>
        </div>
        <span style={{
          fontSize: 11,
          fontWeight: 500,
          padding: '4px 12px',
          borderRadius: 20,
          background: 'rgba(232,93,38,0.1)',
          color: '#e85d26',
          fontFamily: 'var(--font-ui)',
          textTransform: 'uppercase',
          letterSpacing: '0.06em',
        }}>
          ● ativa
        </span>
      </div>

      {/* Métricas */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12, marginBottom: 20 }}>
        {[
          { label: 'Impressões', value: '48.2K' },
          { label: 'Cliques',    value: '1.930' },
          { label: 'CTR',        value: '4,01%' },
        ].map((m) => (
          <div key={m.label} style={{
            background: 'var(--bg)',
            border: '1px solid var(--border)',
            borderRadius: 10,
            padding: '12px 14px',
          }}>
            <p style={{ fontSize: 10, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 4, fontFamily: 'var(--font-ui)' }}>
              {m.label}
            </p>
            <p style={{ fontSize: 18, fontWeight: 500, fontFamily: 'var(--font-ui)', color: 'var(--text-primary)' }}>
              {m.value}
            </p>
          </div>
        ))}
      </div>

      {/* Orçamento */}
      <div style={{ marginBottom: 18 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
          <span style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: 'var(--font-ui)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
            Orçamento utilizado
          </span>
          <span style={{ fontSize: 12, color: '#e85d26', fontFamily: 'var(--font-ui)', fontWeight: 500 }}>
            R$ 1.240 / R$ 2.000
          </span>
        </div>
        <div style={{ height: 6, background: 'var(--progress-trk)', borderRadius: 6 }}>
          <div style={{ width: '62%', height: '100%', background: '#e85d26', borderRadius: 6 }} />
        </div>
      </div>

      {/* Log da IA */}
      <div style={{
        background: 'var(--bg)',
        border: '1px solid var(--border)',
        borderRadius: 10,
        padding: '12px 14px',
        display: 'flex',
        alignItems: 'center',
        gap: 10,
      }}>
        <div style={{
          width: 28,
          height: 28,
          background: 'rgba(232,93,38,0.12)',
          borderRadius: 8,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
        }}>
          <FarolIcon size={16} />
        </div>
        <div>
          <p style={{ fontSize: 12, color: 'var(--text-primary)', fontFamily: 'var(--font-ui)', fontWeight: 500 }}>
            IA realocou +R$120 para stories
          </p>
          <p style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: 'var(--font-ui)' }}>
            CTR 23% acima da média · há 6 min
          </p>
        </div>
      </div>
    </div>
  );
}

/* ─── Page ──────────────────────────────────────────────────────────────── */
export function LandingPage() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <div style={{
      /* ─── Lock landing to light mode (DESIGN.md) ─── */
      ['--bg' as string]:           '#f5f2ec',
      ['--bg-card' as string]:      '#ffffff',
      ['--bg-cta' as string]:       '#1a1208',
      ['--text-primary' as string]: '#1a1208',
      ['--text-muted' as string]:   '#999999',
      ['--border' as string]:       '#ede7de',
      ['--border-div' as string]:   '#e8e0d4',
      ['--progress-trk' as string]: '#f0ebe3',
      ['--btn-bg' as string]:       '#1a1208',
      ['--btn-txt' as string]:      '#f5f2ec',
      ['--btn-sec-brd' as string]:  'rgba(232,93,38,0.3)',
      ['--btn-sec-txt' as string]:  '#e85d26',
      ['--logo-body' as string]:    '#1a1208',
      background: '#f5f2ec',
      color: '#1a1208',
      minHeight: '100vh',
    } as React.CSSProperties}>
      {/* ── 1. NAVBAR ──────────────────────────────────────────────────── */}
      <nav style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 100,
        height: 64,
        display: 'flex',
        alignItems: 'center',
        background: scrolled ? 'rgba(245,242,236,0.85)' : 'transparent',
        backdropFilter: scrolled ? 'blur(12px)' : 'none',
        borderBottom: scrolled ? '1px solid var(--border)' : '1px solid transparent',
        transition: 'background 0.25s, border-color 0.25s, backdrop-filter 0.25s',
      }}>
        <div className="container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          {/* Logo */}
          <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none' }}>
            <FarolIcon size={28} />
            <span style={{
              fontFamily: 'var(--font-display)',
              fontWeight: 800,
              fontSize: 22,
              color: 'var(--text-primary)',
              letterSpacing: '-0.5px',
            }}>
              faro.
            </span>
          </Link>

          {/* Links */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 32 }}>
            <a href="#como-funciona" style={{ fontSize: 13, color: 'var(--text-muted)', fontFamily: 'var(--font-ui)', fontWeight: 500, transition: 'color 0.15s' }}
              onMouseEnter={e => (e.currentTarget.style.color = 'var(--text-primary)')}
              onMouseLeave={e => (e.currentTarget.style.color = 'var(--text-muted)')}>
              Como funciona
            </a>
            <a href="#precos" style={{ fontSize: 13, color: 'var(--text-muted)', fontFamily: 'var(--font-ui)', fontWeight: 500, transition: 'color 0.15s' }}
              onMouseEnter={e => (e.currentTarget.style.color = 'var(--text-primary)')}
              onMouseLeave={e => (e.currentTarget.style.color = 'var(--text-muted)')}>
              Preços
            </a>
            <BtnPrimary to="/register" size="sm">Começar grátis →</BtnPrimary>
          </div>
        </div>
      </nav>

      {/* ── 2. HERO ────────────────────────────────────────────────────── */}
      <section style={{ paddingTop: 140, paddingBottom: 100 }}>
        <div className="container" style={{ textAlign: 'center' }}>
          {/* Badge */}
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 8,
            padding: '6px 14px',
            background: 'rgba(232,93,38,0.08)',
            border: '1px solid rgba(232,93,38,0.2)',
            borderRadius: 20,
            marginBottom: 32,
          }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#e85d26', display: 'inline-block' }} />
            <span style={{ fontSize: 12, color: '#e85d26', fontFamily: 'var(--font-ui)', fontWeight: 500, letterSpacing: '0.04em' }}>
              IA trabalhando 24h por você
            </span>
          </div>

          <h1 style={{
            fontFamily: 'var(--font-display)',
            fontWeight: 800,
            fontSize: 'clamp(40px, 6vw, 72px)',
            lineHeight: 1.08,
            color: 'var(--text-primary)',
            letterSpacing: '-2px',
            maxWidth: 760,
            margin: '0 auto 24px',
          }}>
            Suas campanhas no piloto automático.
          </h1>

          <p style={{
            fontSize: 'clamp(15px, 2vw, 18px)',
            color: 'var(--text-muted)',
            fontFamily: 'var(--font-ui)',
            lineHeight: 1.7,
            maxWidth: 520,
            margin: '0 auto 40px',
          }}>
            O faro. conecta com Meta e Google Ads e usa IA para gerenciar,
            otimizar e escalar suas campanhas — enquanto você foca no que
            realmente importa.
          </p>

          {/* CTAs */}
          <div style={{ display: 'flex', justifyContent: 'center', gap: 12, marginBottom: 64, flexWrap: 'wrap' }}>
            <BtnPrimary to="/register">Começar grátis →</BtnPrimary>
            <BtnSecondary href="#como-funciona">Ver como funciona</BtnSecondary>
          </div>

          {/* Dashboard Mock */}
          <DashboardMock />
        </div>
      </section>

      {/* ── 3. SOCIAL PROOF ────────────────────────────────────────────── */}
      <section style={{ paddingBottom: 80 }}>
        <div className="container" style={{ textAlign: 'center' }}>
          <p style={{
            fontSize: 12,
            color: 'var(--text-muted)',
            fontFamily: 'var(--font-ui)',
            textTransform: 'uppercase',
            letterSpacing: '0.1em',
            marginBottom: 20,
          }}>
            Integra diretamente com
          </p>
          <div style={{ display: 'flex', justifyContent: 'center', gap: 16, flexWrap: 'wrap' }}>
            <PlatformBadge label="Meta Ads"   color="#1877F2" initial="f" />
            <PlatformBadge label="Google Ads" color="#34A853" initial="G" />
          </div>
        </div>
      </section>

      <Divider />

      {/* ── 4. FEATURES ────────────────────────────────────────────────── */}
      <section style={{ padding: '96px 0' }}>
        <div className="container">
          <SectionLabel>O que o faro. faz</SectionLabel>
          <h2 style={h2Style}>
            A IA que trabalha enquanto<br />você descansa.
          </h2>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
            gap: 20,
            marginTop: 52,
          }}>
            <FeatureCard
              icon="◈"
              title="IA que trabalha por você"
              body="Conecte sua conta e defina o objetivo. O faro. cuida do resto — ajusta lances, realoca orçamento e mantém suas campanhas sempre no melhor desempenho."
            />
            <FeatureCard
              icon="⇄"
              title="Testes A/B sem esforço"
              body="A IA cria e testa variações de criativos automaticamente, aprende o que converte e escala o que está funcionando."
            />
            <FeatureCard
              icon="▤"
              title="Você sempre no controle"
              body="Cada decisão da IA fica registrada em tempo real. Transparência total sobre o que está acontecendo com o seu dinheiro."
            />
          </div>
        </div>
      </section>

      <Divider />

      {/* ── 5. COMO FUNCIONA ───────────────────────────────────────────── */}
      <section id="como-funciona" style={{ padding: '96px 0' }}>
        <div className="container">
          <SectionLabel>Como funciona</SectionLabel>
          <h2 style={h2Style}>
            Da conta ao resultado<br />em menos de 10 minutos.
          </h2>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
            gap: 32,
            marginTop: 52,
          }}>
            <StepCard
              num="01"
              title="Conecte sua conta"
              body="Meta Ads ou Google Ads em menos de 2 minutos. Sem configuração técnica."
            />
            <StepCard
              num="02"
              title="Defina sua campanha"
              body="Nome, orçamento, público-alvo e objetivo. O faro. entende o que você quer alcançar."
            />
            <StepCard
              num="03"
              title="A IA assume"
              body="Monitoramento contínuo, otimização automática e relatórios claros. Você só acompanha os resultados."
            />
          </div>
        </div>
      </section>

      <Divider />

      {/* ── 6. PRICING ─────────────────────────────────────────────────── */}
      <section id="precos" style={{ padding: '96px 0' }}>
        <div className="container">
          <SectionLabel>Planos</SectionLabel>
          <h2 style={h2Style}>
            Simples assim.
          </h2>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
            gap: 20,
            marginTop: 52,
            maxWidth: 720,
            marginLeft: 'auto',
            marginRight: 'auto',
          }}>
            {/* Starter */}
            <div style={{
              background: 'var(--bg-card)',
              border: '1px solid var(--border)',
              borderRadius: 16,
              padding: '36px 32px',
            }}>
              <p style={{ fontSize: 13, color: 'var(--text-muted)', fontFamily: 'var(--font-ui)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>
                Starter
              </p>
              <p style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 36, color: 'var(--text-primary)', marginBottom: 4 }}>
                Grátis
              </p>
              <p style={{ fontSize: 13, color: 'var(--text-muted)', fontFamily: 'var(--font-ui)', marginBottom: 32 }}>
                Para começar sem risco.
              </p>
              <PlanFeatureList items={[
                'Até 2 campanhas ativas',
                '1 integração (Meta ou Google)',
                'Relatórios básicos',
                'Suporte por email',
              ]} />
              <BtnSecondary to="/register" fullWidth>Criar conta grátis</BtnSecondary>
            </div>

            {/* Pro — destaque */}
            <div style={{
              background: 'var(--bg-card)',
              border: '2px solid #e85d26',
              borderRadius: 16,
              padding: '36px 32px',
              position: 'relative',
            }}>
              <span style={{
                position: 'absolute',
                top: -13,
                left: '50%',
                transform: 'translateX(-50%)',
                background: '#e85d26',
                color: '#0f0d09',
                fontSize: 11,
                fontWeight: 700,
                fontFamily: 'var(--font-ui)',
                padding: '4px 14px',
                borderRadius: 20,
                whiteSpace: 'nowrap',
                letterSpacing: '0.06em',
                textTransform: 'uppercase',
              }}>
                Mais popular
              </span>
              <p style={{ fontSize: 13, color: '#e85d26', fontFamily: 'var(--font-ui)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>
                Pro
              </p>
              <div style={{ display: 'flex', alignItems: 'flex-end', gap: 6, marginBottom: 4 }}>
                <p style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 36, color: 'var(--text-primary)', lineHeight: 1 }}>
                  R$97
                </p>
                <p style={{ fontSize: 14, color: 'var(--text-muted)', fontFamily: 'var(--font-ui)', marginBottom: 4 }}>
                  /mês
                </p>
              </div>
              <p style={{ fontSize: 13, color: 'var(--text-muted)', fontFamily: 'var(--font-ui)', marginBottom: 32 }}>
                Para quem quer escalar.
              </p>
              <PlanFeatureList highlight items={[
                'Campanhas ilimitadas',
                'Meta + Google simultâneo',
                'Testes A/B automáticos',
                'Logs completos da IA',
                'Suporte prioritário',
              ]} />
              <BtnPrimary to="/register" fullWidth>Começar agora →</BtnPrimary>
            </div>
          </div>

          <p style={{ textAlign: 'center', fontSize: 13, color: 'var(--text-muted)', fontFamily: 'var(--font-ui)', marginTop: 24 }}>
            Cancele quando quiser. Sem fidelidade.
          </p>
        </div>
      </section>

      {/* ── 7. CTA FINAL ───────────────────────────────────────────────── */}
      <section style={{
        background: 'var(--bg-cta)',
        padding: '100px 0',
      }}>
        <div className="container" style={{ textAlign: 'center' }}>
          <h2 style={{
            fontFamily: 'var(--font-display)',
            fontWeight: 800,
            fontSize: 'clamp(32px, 5vw, 56px)',
            lineHeight: 1.1,
            color: '#f5f2ec',
            letterSpacing: '-1.5px',
            maxWidth: 600,
            margin: '0 auto 20px',
          }}>
            Pare de perder tempo.<br />Comece a ter resultados.
          </h2>
          <p style={{
            fontSize: 16,
            color: 'rgba(240,234,216,0.6)',
            fontFamily: 'var(--font-ui)',
            marginBottom: 40,
            lineHeight: 1.7,
          }}>
            Crie sua conta grátis e veja a IA otimizando suas campanhas hoje.
          </p>
          <Link
            to="/register"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              height: 52,
              padding: '0 32px',
              background: '#e85d26',
              color: '#0f0d09',
              fontFamily: 'var(--font-ui)',
              fontWeight: 500,
              fontSize: 15,
              borderRadius: 10,
              border: 'none',
              cursor: 'pointer',
              transition: 'background 0.15s, transform 0.15s',
              textDecoration: 'none',
            }}
            onMouseEnter={e => {
              e.currentTarget.style.background = '#c94d1e';
              e.currentTarget.style.transform = 'translateY(-1px)';
            }}
            onMouseLeave={e => {
              e.currentTarget.style.background = '#e85d26';
              e.currentTarget.style.transform = 'translateY(0)';
            }}
          >
            Criar minha conta →
          </Link>
        </div>
      </section>

      {/* ── 8. FOOTER ──────────────────────────────────────────────────── */}
      <footer style={{
        borderTop: '1px solid var(--border)',
        padding: '56px 0 40px',
        background: 'var(--bg)',
      }}>
        <div className="container">
          <div style={{ display: 'grid', gridTemplateColumns: '1fr auto auto', gap: 48, marginBottom: 48 }}>
            {/* Brand */}
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                <FarolIcon size={22} />
                <span style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 18, color: 'var(--text-primary)' }}>
                  faro.
                </span>
              </div>
              <p style={{ fontSize: 13, color: 'var(--text-muted)', fontFamily: 'var(--font-ui)', lineHeight: 1.6, maxWidth: 260 }}>
                A IA que ilumina o caminho das suas campanhas.
              </p>
            </div>

            {/* Produto */}
            <div>
              <p style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: 'var(--font-ui)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 16 }}>
                Produto
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <FooterLink href="#como-funciona">Como funciona</FooterLink>
                <FooterLink href="#precos">Preços</FooterLink>
              </div>
            </div>

            {/* Legal */}
            <div>
              <p style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: 'var(--font-ui)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 16 }}>
                Legal
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <FooterLink to="/termos">Termos de uso</FooterLink>
                <FooterLink to="/privacidade">Privacidade</FooterLink>
              </div>
            </div>
          </div>

          <div style={{ borderTop: '1px solid var(--border-div)', paddingTop: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <p style={{ fontSize: 12, color: 'var(--text-muted)', fontFamily: 'var(--font-ui)' }}>
              © {new Date().getFullYear()} faro. Todos os direitos reservados.
            </p>
            <p style={{ fontSize: 12, color: 'var(--text-muted)', fontFamily: 'var(--font-ui)' }}>
              Feito com IA.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}

/* ─── Sub-components ────────────────────────────────────────────────────── */

function BtnPrimary({ to, children, size = 'md', fullWidth = false }: {
  to: string;
  children: React.ReactNode;
  size?: 'sm' | 'md';
  fullWidth?: boolean;
}) {
  const h = size === 'sm' ? 38 : 50;
  const px = size === 'sm' ? '18px' : '28px';
  const fs = size === 'sm' ? 13 : 15;

  return (
    <Link
      to={to}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        height: h,
        padding: `0 ${px}`,
        background: 'var(--btn-bg)',
        color: 'var(--btn-txt)',
        fontFamily: 'var(--font-ui)',
        fontWeight: 500,
        fontSize: fs,
        borderRadius: 9,
        border: 'none',
        cursor: 'pointer',
        transition: 'opacity 0.15s, transform 0.15s',
        textDecoration: 'none',
        width: fullWidth ? '100%' : undefined,
        whiteSpace: 'nowrap',
      }}
      onMouseEnter={e => {
        e.currentTarget.style.opacity = '0.88';
        e.currentTarget.style.transform = 'translateY(-1px)';
      }}
      onMouseLeave={e => {
        e.currentTarget.style.opacity = '1';
        e.currentTarget.style.transform = 'translateY(0)';
      }}
    >
      {children}
    </Link>
  );
}

function BtnSecondary({ to, href, children, fullWidth = false }: {
  to?: string;
  href?: string;
  children: React.ReactNode;
  fullWidth?: boolean;
}) {
  const style: React.CSSProperties = {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    height: 50,
    padding: '0 28px',
    background: 'transparent',
    color: 'var(--btn-sec-txt)',
    fontFamily: 'var(--font-ui)',
    fontWeight: 500,
    fontSize: 15,
    borderRadius: 9,
    border: '1px solid var(--btn-sec-brd)',
    cursor: 'pointer',
    transition: 'border-color 0.15s, transform 0.15s',
    textDecoration: 'none',
    width: fullWidth ? '100%' : undefined,
    whiteSpace: 'nowrap',
  };

  const handlers = {
    onMouseEnter: (e: React.MouseEvent<HTMLElement>) => {
      e.currentTarget.style.borderColor = '#e85d26';
      e.currentTarget.style.transform = 'translateY(-1px)';
    },
    onMouseLeave: (e: React.MouseEvent<HTMLElement>) => {
      e.currentTarget.style.borderColor = 'var(--btn-sec-brd)';
      e.currentTarget.style.transform = 'translateY(0)';
    },
  };

  if (to) {
    return <Link to={to} style={style} {...handlers}>{children}</Link>;
  }
  return <a href={href} style={style} {...handlers}>{children}</a>;
}

function PlatformBadge({ label, color, initial }: { label: string; color: string; initial: string }) {
  return (
    <div style={{
      display: 'inline-flex',
      alignItems: 'center',
      gap: 8,
      padding: '8px 16px',
      background: 'var(--bg-card)',
      border: '1px solid var(--border)',
      borderRadius: 10,
    }}>
      <div style={{
        width: 24,
        height: 24,
        borderRadius: 6,
        background: color,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: 'white',
        fontWeight: 800,
        fontSize: 12,
        fontFamily: 'var(--font-display)',
        flexShrink: 0,
      }}>
        {initial}
      </div>
      <span style={{ fontSize: 13, fontFamily: 'var(--font-ui)', fontWeight: 500, color: 'var(--text-primary)' }}>
        {label}
      </span>
    </div>
  );
}

function Divider() {
  return (
    <div className="container">
      <div style={{ height: 1, background: 'var(--border-div)' }} />
    </div>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p style={{
      fontSize: 11,
      color: '#e85d26',
      fontFamily: 'var(--font-ui)',
      fontWeight: 500,
      textTransform: 'uppercase',
      letterSpacing: '0.12em',
      marginBottom: 16,
    }}>
      {children}
    </p>
  );
}

const h2Style: React.CSSProperties = {
  fontFamily: 'var(--font-display)',
  fontWeight: 800,
  fontSize: 'clamp(28px, 4vw, 44px)',
  lineHeight: 1.15,
  color: 'var(--text-primary)',
  letterSpacing: '-1px',
  maxWidth: 520,
};

function FeatureCard({ icon, title, body }: { icon: string; title: string; body: string }) {
  return (
    <div style={{
      background: 'var(--bg-card)',
      border: '1px solid var(--border)',
      borderRadius: 14,
      padding: '32px 28px',
    }}>
      <div style={{
        width: 44,
        height: 44,
        background: 'rgba(232,93,38,0.08)',
        borderRadius: 10,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: 18,
        color: '#e85d26',
        marginBottom: 20,
      }}>
        {icon}
      </div>
      <h3 style={{
        fontFamily: 'var(--font-display)',
        fontWeight: 800,
        fontSize: 18,
        color: 'var(--text-primary)',
        marginBottom: 12,
        letterSpacing: '-0.3px',
      }}>
        {title}
      </h3>
      <p style={{
        fontSize: 14,
        color: 'var(--text-muted)',
        fontFamily: 'var(--font-ui)',
        lineHeight: 1.7,
      }}>
        {body}
      </p>
    </div>
  );
}

function StepCard({ num, title, body }: { num: string; title: string; body: string }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: 14,
      }}>
        <span style={{
          fontFamily: 'var(--font-display)',
          fontWeight: 800,
          fontSize: 13,
          color: '#e85d26',
          letterSpacing: '0.04em',
          minWidth: 28,
        }}>
          {num}
        </span>
        <div style={{ height: 1, flex: 1, background: 'var(--border-div)' }} />
      </div>
      <h3 style={{
        fontFamily: 'var(--font-display)',
        fontWeight: 800,
        fontSize: 20,
        color: 'var(--text-primary)',
        letterSpacing: '-0.3px',
      }}>
        {title}
      </h3>
      <p style={{
        fontSize: 14,
        color: 'var(--text-muted)',
        fontFamily: 'var(--font-ui)',
        lineHeight: 1.7,
      }}>
        {body}
      </p>
    </div>
  );
}

function PlanFeatureList({ items, highlight = false }: { items: string[]; highlight?: boolean }) {
  return (
    <ul style={{ listStyle: 'none', padding: 0, marginBottom: 28, display: 'flex', flexDirection: 'column', gap: 12 }}>
      {items.map((item) => (
        <li key={item} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{
            width: 18,
            height: 18,
            borderRadius: '50%',
            background: highlight ? 'rgba(232,93,38,0.12)' : 'var(--bg)',
            border: `1px solid ${highlight ? 'rgba(232,93,38,0.3)' : 'var(--border)'}`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
            fontSize: 10,
            color: highlight ? '#e85d26' : 'var(--text-muted)',
            fontWeight: 700,
          }}>
            ✓
          </span>
          <span style={{ fontSize: 14, color: 'var(--text-primary)', fontFamily: 'var(--font-ui)' }}>
            {item}
          </span>
        </li>
      ))}
    </ul>
  );
}

function FooterLink({ href, to, children }: { href?: string; to?: string; children: React.ReactNode }) {
  const style: React.CSSProperties = {
    fontSize: 13,
    color: 'var(--text-muted)',
    fontFamily: 'var(--font-ui)',
    transition: 'color 0.15s',
    textDecoration: 'none',
  };
  const handlers = {
    onMouseEnter: (e: React.MouseEvent<HTMLElement>) => (e.currentTarget.style.color = 'var(--text-primary)'),
    onMouseLeave: (e: React.MouseEvent<HTMLElement>) => (e.currentTarget.style.color = 'var(--text-muted)'),
  };

  if (to) {
    return <Link to={to} style={style} {...handlers}>{children}</Link>;
  }
  return <a href={href} style={style} {...handlers}>{children}</a>;
}
