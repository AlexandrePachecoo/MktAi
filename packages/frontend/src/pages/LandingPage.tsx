import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

/* ─── SVG Logo — Farol ──────────────────────────────────────────────────── */
function FarolIcon({ size = 28, light = false }: { size?: number; light?: boolean }) {
  const body = light ? '#f0ead8' : '#1a1208';
  return (
    <svg width={size} height={size} viewBox="0 0 32 36" fill="none" aria-hidden="true">
      <line x1="16" y1="10" x2="16" y2="2"  stroke="#e85d26" strokeWidth="2.5" strokeLinecap="round" />
      <line x1="16" y1="10" x2="8"  y2="4"  stroke="#e85d26" strokeWidth="2.5" strokeLinecap="round" />
      <line x1="16" y1="10" x2="24" y2="4"  stroke="#e85d26" strokeWidth="2.5" strokeLinecap="round" />
      <line x1="16" y1="10" x2="4"  y2="11" stroke="#e85d26" strokeWidth="2"   strokeLinecap="round" />
      <line x1="16" y1="10" x2="28" y2="11" stroke="#e85d26" strokeWidth="2"   strokeLinecap="round" />
      <rect x="11" y="10" width="10" height="6" rx="2" fill={body} />
      <path d="M12.5 16 L10 30 L22 30 L19.5 16 Z" fill={body} />
      <rect x="8" y="30" width="16" height="3.5" rx="2" fill={body} />
      <circle cx="16" cy="13" r="2.5" fill="#e85d26" opacity="0.95" />
    </svg>
  );
}

/* ─── Mini Dashboard Card ───────────────────────────────────────────────── */
function DashboardCard({ name, status = 'ativa' }: { name: string; status?: string }) {
  const metrics = [
    { label: 'Impressões', value: status === 'ativa' ? '48.2K' : status === 'pausada' ? '12.1K' : '31.8K' },
    { label: 'Cliques',    value: status === 'ativa' ? '1.930' : status === 'pausada' ? '430'   : '1.240' },
    { label: 'CTR',        value: status === 'ativa' ? '4,01%' : status === 'pausada' ? '3,55%' : '3,90%' },
  ];
  const statusColor = status === 'ativa' ? '#e85d26' : status === 'pausada' ? '#999' : '#34A853';

  return (
    <div style={{
      background: '#ffffff',
      border: '1px solid #ede7de',
      borderRadius: 14,
      padding: '20px 22px',
      flex: '1 1 0',
      minWidth: 0,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <p style={{ fontSize: 14, fontWeight: 500, fontFamily: 'var(--font-ui)', color: '#1a1208' }}>
          {name}
        </p>
        <span style={{
          fontSize: 11,
          fontWeight: 500,
          padding: '3px 10px',
          borderRadius: 20,
          background: `${statusColor}18`,
          color: statusColor,
          fontFamily: 'var(--font-ui)',
          textTransform: 'uppercase',
          letterSpacing: '0.05em',
        }}>
          ● {status}
        </span>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
        {metrics.map((m) => (
          <div key={m.label} style={{
            background: '#f5f2ec',
            borderRadius: 8,
            padding: '10px 12px',
          }}>
            <p style={{ fontSize: 10, color: '#888880', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 3, fontFamily: 'var(--font-ui)' }}>
              {m.label}
            </p>
            <p style={{ fontSize: 16, fontWeight: 600, fontFamily: 'var(--font-ui)', color: '#1a1208' }}>
              {m.value}
            </p>
          </div>
        ))}
      </div>
      <div style={{ marginTop: 12, padding: '10px 12px', background: '#f5f2ec', borderRadius: 8, display: 'flex', alignItems: 'center', gap: 8 }}>
        <FarolIcon size={14} />
        <p style={{ fontSize: 12, color: '#888880', fontFamily: 'var(--font-ui)' }}>
          IA realocou +R$120 para stories · há 6 min
        </p>
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
      ['--font-display' as string]: "'Plus Jakarta Sans', sans-serif",
      ['--font-ui' as string]:      "'Inter', sans-serif",
      background: '#f5f2ec',
      color: '#1a1208',
      minHeight: '100vh',
    } as React.CSSProperties}>

      {/* ── NAVBAR ─────────────────────────────────────────────────────── */}
      <nav style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 100,
        height: 60,
        display: 'flex',
        alignItems: 'center',
        background: scrolled ? 'rgba(26,18,8,0.95)' : '#1a1208',
        backdropFilter: scrolled ? 'blur(12px)' : 'none',
        borderBottom: '1px solid rgba(255,255,255,0.06)',
        transition: 'background 0.25s',
      }}>
        <div className="container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
          <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none' }}>
            <FarolIcon size={26} light />
            <span style={{
              fontFamily: 'var(--font-display)',
              fontWeight: 800,
              fontSize: 20,
              color: '#f0ead8',
              letterSpacing: '-0.4px',
            }}>
              Faro.
            </span>
          </Link>

          <div style={{ display: 'flex', alignItems: 'center', gap: 28 }}>
            <a href="#servicos" style={navLinkStyle}
              onMouseEnter={e => (e.currentTarget.style.color = '#f0ead8')}
              onMouseLeave={e => (e.currentTarget.style.color = 'rgba(240,234,216,0.5)')}>
              Nosso serviço
            </a>
            <a href="#precos" style={navLinkStyle}
              onMouseEnter={e => (e.currentTarget.style.color = '#f0ead8')}
              onMouseLeave={e => (e.currentTarget.style.color = 'rgba(240,234,216,0.5)')}>
              Assinaturas
            </a>
            <Link to="/register" style={{
              display: 'inline-flex',
              alignItems: 'center',
              height: 36,
              padding: '0 18px',
              background: '#e85d26',
              color: '#ffffff',
              fontFamily: 'var(--font-ui)',
              fontWeight: 600,
              fontSize: 13,
              borderRadius: 8,
              textDecoration: 'none',
              transition: 'background 0.15s',
            }}
              onMouseEnter={e => (e.currentTarget.style.background = '#c94d1e')}
              onMouseLeave={e => (e.currentTarget.style.background = '#e85d26')}
            >
              Criar conta
            </Link>
          </div>
        </div>
      </nav>

      {/* ── HERO ───────────────────────────────────────────────────────── */}
      <section style={{ background: '#1a1208', paddingTop: 120, paddingBottom: 96 }}>
        <div className="container" style={{ textAlign: 'center' }}>
          <h1 style={{
            fontFamily: 'var(--font-display)',
            fontWeight: 800,
            fontSize: 'clamp(38px, 6vw, 68px)',
            lineHeight: 1.1,
            color: '#f0ead8',
            letterSpacing: '-2px',
            maxWidth: 700,
            margin: '0 auto 20px',
          }}>
            Suas campanhas no piloto automático.
          </h1>

          <p style={{
            fontSize: 16,
            color: 'rgba(240,234,216,0.55)',
            fontFamily: 'var(--font-ui)',
            lineHeight: 1.65,
            maxWidth: 480,
            margin: '0 auto 36px',
          }}>
            O Faro. conecta com Meta e Google Ads e usa IA para gerenciar, otimizar e escalar suas campanhas — enquanto você foca no que realmente importa.
          </p>

          <Link to="/register" style={{
            display: 'inline-flex',
            alignItems: 'center',
            height: 50,
            padding: '0 32px',
            background: '#e85d26',
            color: '#ffffff',
            fontFamily: 'var(--font-ui)',
            fontWeight: 600,
            fontSize: 15,
            borderRadius: 10,
            textDecoration: 'none',
            transition: 'background 0.15s, transform 0.15s',
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
            Criar campanha →
          </Link>
        </div>
      </section>

      {/* ── FEATURES ───────────────────────────────────────────────────── */}
      <section id="servicos" style={{ background: '#f5f2ec', padding: '88px 0' }}>
        <div className="container">
          <p style={{
            fontSize: 13,
            color: '#e85d26',
            fontFamily: 'var(--font-ui)',
            fontWeight: 600,
            textTransform: 'uppercase',
            letterSpacing: '0.1em',
            marginBottom: 8,
          }}>
            A IA trabalha
          </p>
          <h2 style={{
            fontFamily: 'var(--font-display)',
            fontWeight: 800,
            fontSize: 'clamp(28px, 4vw, 44px)',
            color: '#1a1208',
            letterSpacing: '-1px',
            marginBottom: 48,
            maxWidth: 560,
          }}>
            Enquanto você descansa.
          </h2>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: 20,
          }}
          className="features-grid"
          >
            {[
              {
                title: 'IA que trabalha por você',
                body: 'Conecte sua conta e defina o objetivo. O Faro. cuida do resto — ajusta lances, realoca orçamento e mantém suas campanhas no melhor desempenho.',
              },
              {
                title: 'Testes A/B sem esforço',
                body: 'A IA cria e testa variações de criativos automaticamente, aprende o que converte e escala o que está funcionando.',
              },
              {
                title: 'Você sempre no controle',
                body: 'Cada decisão da IA fica registrada em tempo real. Transparência total sobre o que está acontecendo com o seu dinheiro.',
              },
            ].map((f) => (
              <div key={f.title} style={{
                background: '#ffffff',
                border: '1px solid #ede7de',
                borderRadius: 14,
                padding: '28px 24px',
              }}>
                <div style={{
                  width: 40,
                  height: 40,
                  background: '#e85d26',
                  borderRadius: 8,
                  marginBottom: 20,
                }} />
                <h3 style={{
                  fontFamily: 'var(--font-display)',
                  fontWeight: 800,
                  fontSize: 17,
                  color: '#1a1208',
                  marginBottom: 10,
                  letterSpacing: '-0.2px',
                }}>
                  {f.title}
                </h3>
                <p style={{
                  fontSize: 14,
                  color: '#888880',
                  fontFamily: 'var(--font-ui)',
                  lineHeight: 1.65,
                }}>
                  {f.body}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── COMO FUNCIONA ──────────────────────────────────────────────── */}
      <section id="como-funciona" style={{ background: '#ffffff', padding: '88px 0', borderTop: '1px solid #ede7de', borderBottom: '1px solid #ede7de' }}>
        <div className="container">
          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: 64,
            alignItems: 'center',
          }} className="howto-grid">

            {/* Esquerda — headline grande */}
            <div>
              <p style={{
                fontSize: 12,
                color: '#e85d26',
                fontFamily: 'var(--font-ui)',
                fontWeight: 600,
                textTransform: 'uppercase',
                letterSpacing: '0.1em',
                marginBottom: 16,
              }}>
                Como funciona
              </p>
              <h2 style={{
                fontFamily: 'var(--font-display)',
                fontWeight: 800,
                fontSize: 'clamp(36px, 5vw, 58px)',
                lineHeight: 1.08,
                color: '#1a1208',
                letterSpacing: '-2px',
              }}>
                Seu resultado em menos de 10 minutos.
              </h2>
            </div>

            {/* Direita — steps */}
            <div style={{
              background: '#f5f2ec',
              border: '1px solid #ede7de',
              borderRadius: 16,
              padding: '36px 32px',
              display: 'flex',
              flexDirection: 'column',
              gap: 0,
            }}>
              {[
                { num: '01', title: 'Conecte sua conta',   body: 'Meta Ads ou Google Ads em menos de 2 minutos. Sem configuração técnica.' },
                { num: '02', title: 'Defina sua campanha', body: 'Nome, orçamento, público-alvo e objetivo. O Faro. entende o que você quer alcançar.' },
                { num: '03', title: 'A IA assume',         body: 'Monitoramento contínuo, otimização automática e relatórios claros. Você só acompanha os resultados.' },
              ].map((step, i) => (
                <div key={step.num} style={{
                  display: 'flex',
                  gap: 20,
                  paddingTop: i === 0 ? 0 : 24,
                  paddingBottom: i === 2 ? 0 : 24,
                  borderBottom: i < 2 ? '1px solid #e8e0d4' : 'none',
                  alignItems: 'flex-start',
                }}>
                  <span style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: 36,
                    height: 36,
                    borderRadius: '50%',
                    background: '#e85d26',
                    fontFamily: 'var(--font-display)',
                    fontWeight: 800,
                    fontSize: 13,
                    color: '#ffffff',
                    flexShrink: 0,
                    letterSpacing: '0.02em',
                    marginTop: 1,
                  }}>
                    {step.num}
                  </span>
                  <div>
                    <h3 style={{
                      fontFamily: 'var(--font-display)',
                      fontWeight: 800,
                      fontSize: 16,
                      color: '#1a1208',
                      letterSpacing: '-0.2px',
                      marginBottom: 5,
                    }}>
                      {step.title}
                    </h3>
                    <p style={{
                      fontSize: 13,
                      color: '#888880',
                      fontFamily: 'var(--font-ui)',
                      lineHeight: 1.6,
                    }}>
                      {step.body}
                    </p>
                  </div>
                </div>
              ))}
            </div>

          </div>
        </div>
      </section>

      {/* ── SOCIAL PROOF ───────────────────────────────────────────────── */}
      <section style={{ background: '#f5f2ec', padding: '88px 0' }}>
        <div className="container">
          <h2 style={{
            fontFamily: 'var(--font-display)',
            fontWeight: 800,
            fontSize: 'clamp(22px, 3vw, 32px)',
            color: '#1a1208',
            letterSpacing: '-0.5px',
            textAlign: 'center',
            marginBottom: 40,
          }}>
            Junte-se às melhores campanhas
          </h2>

          <div style={{
            display: 'flex',
            gap: 16,
            alignItems: 'stretch',
          }}
          className="cards-row"
          >
            <DashboardCard name="Lançamento Produto S"  status="ativa"   />
            <DashboardCard name="Lançamento Produto Y"  status="pausada" />
            <DashboardCard name="Lançamento Produto X"  status="ativa"   />
          </div>
        </div>
      </section>

      {/* ── PRICING ────────────────────────────────────────────────────── */}
      <section id="precos" style={{ background: '#1a1208', padding: '88px 0' }}>
        <div className="container" style={{ textAlign: 'center' }}>
          <p style={{
            fontSize: 13,
            color: 'rgba(240,234,216,0.4)',
            fontFamily: 'var(--font-ui)',
            marginBottom: 12,
          }}>
            Avance. Defina sua campanha. Tenha resultados.
          </p>
          <h2 style={{
            fontFamily: 'var(--font-display)',
            fontWeight: 800,
            fontSize: 'clamp(32px, 5vw, 52px)',
            color: '#f0ead8',
            letterSpacing: '-1.5px',
            marginBottom: 52,
          }}>
            Simples assim.
          </h2>

          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr 1fr',
            gap: 20,
            maxWidth: 980,
            margin: '0 auto',
          }}
          className="pricing-grid"
          >
            {/* Free */}
            <div style={{
              background: '#f5f0e8',
              borderRadius: 16,
              padding: '36px 32px',
              textAlign: 'left',
            }}>
              <p style={{ fontSize: 12, color: '#888880', fontFamily: 'var(--font-ui)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 10 }}>
                Free
              </p>
              <div style={{ display: 'flex', alignItems: 'flex-end', gap: 6, marginBottom: 4 }}>
                <p style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 40, color: '#1a1208', lineHeight: 1, letterSpacing: '-1px' }}>
                  R$0
                </p>
                <p style={{ fontSize: 14, color: '#888880', fontFamily: 'var(--font-ui)', marginBottom: 4 }}>
                  /sempre
                </p>
              </div>
              <p style={{ fontSize: 14, color: '#888880', fontFamily: 'var(--font-ui)', marginBottom: 28 }}>
                Para experimentar.
              </p>
              <FeatureList items={[
                'Até 2 campanhas',
                'Até 10 copies geradas',
                'Geração de estratégia com IA',
              ]} />
              <Link to="/register" style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                height: 46,
                background: 'transparent',
                border: '1px solid rgba(26,18,8,0.2)',
                borderRadius: 9,
                color: '#1a1208',
                fontFamily: 'var(--font-ui)',
                fontWeight: 500,
                fontSize: 14,
                textDecoration: 'none',
                transition: 'border-color 0.15s',
              }}
                onMouseEnter={e => (e.currentTarget.style.borderColor = '#1a1208')}
                onMouseLeave={e => (e.currentTarget.style.borderColor = 'rgba(26,18,8,0.2)')}
              >
                Criar conta grátis →
              </Link>
            </div>

            {/* Básico */}
            <div style={{
              background: '#ffffff',
              borderRadius: 16,
              padding: '36px 32px',
              textAlign: 'left',
            }}>
              <p style={{ fontSize: 12, color: '#888880', fontFamily: 'var(--font-ui)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 10 }}>
                Básico
              </p>
              <div style={{ display: 'flex', alignItems: 'flex-end', gap: 6, marginBottom: 4 }}>
                <p style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 40, color: '#1a1208', lineHeight: 1, letterSpacing: '-1px' }}>
                  R$48,90
                </p>
                <p style={{ fontSize: 14, color: '#888880', fontFamily: 'var(--font-ui)', marginBottom: 4 }}>
                  /mês
                </p>
              </div>
              <p style={{ fontSize: 14, color: '#888880', fontFamily: 'var(--font-ui)', marginBottom: 28 }}>
                Para começar a escalar.
              </p>
              <FeatureList items={[
                'Até 5 campanhas ativas',
                'Até 25 criativos',
                'Copies ilimitadas',
                'Meta + Google simultâneo',
                'Testes A/B',
                'Suporte prioritário',
              ]} />
              <Link to="/assinar" style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                height: 46,
                background: 'transparent',
                border: '1px solid rgba(232,93,38,0.3)',
                borderRadius: 9,
                color: '#e85d26',
                fontFamily: 'var(--font-ui)',
                fontWeight: 500,
                fontSize: 14,
                textDecoration: 'none',
                transition: 'border-color 0.15s',
              }}
                onMouseEnter={e => (e.currentTarget.style.borderColor = '#e85d26')}
                onMouseLeave={e => (e.currentTarget.style.borderColor = 'rgba(232,93,38,0.3)')}
              >
                Assinar Básico →
              </Link>
            </div>

            {/* Pro */}
            <div style={{
              background: '#2a1e10',
              border: '1px solid rgba(232,93,38,0.2)',
              borderRadius: 16,
              padding: '36px 32px',
              textAlign: 'left',
              position: 'relative',
            }}>
              <span style={{
                position: 'absolute',
                top: -13,
                left: '50%',
                transform: 'translateX(-50%)',
                background: '#e85d26',
                color: '#ffffff',
                fontSize: 11,
                fontWeight: 600,
                fontFamily: 'var(--font-ui)',
                padding: '4px 14px',
                borderRadius: 20,
                whiteSpace: 'nowrap',
                letterSpacing: '0.06em',
                textTransform: 'uppercase',
              }}>
                Mais escolhido
              </span>
              <p style={{ fontSize: 12, color: '#e85d26', fontFamily: 'var(--font-ui)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 10 }}>
                Pro
              </p>
              <div style={{ display: 'flex', alignItems: 'flex-end', gap: 6, marginBottom: 4 }}>
                <p style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 40, color: '#f0ead8', lineHeight: 1, letterSpacing: '-1px' }}>
                  R$68,90
                </p>
                <p style={{ fontSize: 14, color: 'rgba(240,234,216,0.4)', fontFamily: 'var(--font-ui)', marginBottom: 4 }}>
                  /mês
                </p>
              </div>
              <p style={{ fontSize: 14, color: 'rgba(240,234,216,0.45)', fontFamily: 'var(--font-ui)', marginBottom: 28 }}>
                Para quem quer escalar.
              </p>
              <FeatureList highlight items={[
                'Até 10 campanhas',
                'Até 50 criativos',
                'Copies ilimitadas',
                'Meta + Google simultâneo',
                'Testes A/B automáticos',
                'Logs completos da IA',
                'Suporte prioritário',
              ]} />
              <Link to="/assinar" style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                height: 46,
                background: '#e85d26',
                borderRadius: 9,
                color: '#ffffff',
                fontFamily: 'var(--font-ui)',
                fontWeight: 600,
                fontSize: 14,
                textDecoration: 'none',
                transition: 'background 0.15s',
              }}
                onMouseEnter={e => (e.currentTarget.style.background = '#c94d1e')}
                onMouseLeave={e => (e.currentTarget.style.background = '#e85d26')}
              >
                Assinar Pro →
              </Link>
            </div>
          </div>

          <p style={{ fontSize: 13, color: 'rgba(240,234,216,0.3)', fontFamily: 'var(--font-ui)', marginTop: 20 }}>
            Cancele quando quiser. Sem fidelidade.
          </p>
        </div>
      </section>

      {/* ── CTA FINAL ──────────────────────────────────────────────────── */}
      <section style={{ background: '#e85d26', padding: '88px 0' }}>
        <div className="container" style={{ textAlign: 'center' }}>
          <h2 style={{
            fontFamily: 'var(--font-display)',
            fontWeight: 800,
            fontSize: 'clamp(30px, 5vw, 50px)',
            lineHeight: 1.1,
            color: '#1a1208',
            letterSpacing: '-1.5px',
            maxWidth: 540,
            margin: '0 auto 16px',
          }}>
            Pare de perder tempo. Comece a ter resultados.
          </h2>
          <p style={{
            fontSize: 15,
            color: 'rgba(26,18,8,0.65)',
            fontFamily: 'var(--font-ui)',
            marginBottom: 36,
            lineHeight: 1.6,
          }}>
            Crie sua conta grátis e veja a IA cuidando das suas campanhas hoje.
          </p>
          <Link to="/register" style={{
            display: 'inline-flex',
            alignItems: 'center',
            height: 50,
            padding: '0 32px',
            background: '#1a1208',
            color: '#f0ead8',
            fontFamily: 'var(--font-ui)',
            fontWeight: 600,
            fontSize: 15,
            borderRadius: 10,
            textDecoration: 'none',
            transition: 'opacity 0.15s, transform 0.15s',
          }}
            onMouseEnter={e => {
              e.currentTarget.style.opacity = '0.85';
              e.currentTarget.style.transform = 'translateY(-1px)';
            }}
            onMouseLeave={e => {
              e.currentTarget.style.opacity = '1';
              e.currentTarget.style.transform = 'translateY(0)';
            }}
          >
            Criar conta →
          </Link>
        </div>
      </section>

      {/* ── FOOTER ─────────────────────────────────────────────────────── */}
      <footer style={{ background: '#f5f2ec', borderTop: '1px solid #ede7de', padding: '52px 0 36px' }}>
        <div className="container">
          <div style={{ display: 'grid', gridTemplateColumns: '1fr auto auto', gap: 48, marginBottom: 40 }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 9, marginBottom: 10 }}>
                <FarolIcon size={20} />
                <span style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 17, color: '#1a1208' }}>
                  faro.
                </span>
              </div>
              <p style={{ fontSize: 14, color: '#888880', fontFamily: 'var(--font-ui)', lineHeight: 1.6, maxWidth: 240 }}>
                A IA que ilumina o caminho das suas campanhas.
              </p>
            </div>

            <div>
              <p style={{ fontSize: 11, color: '#888880', fontFamily: 'var(--font-ui)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 14 }}>
                Produto
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <FooterLink href="#servicos">Nosso serviço</FooterLink>
                <FooterLink href="#precos">Preços</FooterLink>
              </div>
            </div>

            <div>
              <p style={{ fontSize: 11, color: '#888880', fontFamily: 'var(--font-ui)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 14 }}>
                Legal
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <FooterLink to="/termos">Termos de uso</FooterLink>
                <FooterLink to="/privacidade">Privacidade</FooterLink>
              </div>
            </div>
          </div>

          <div style={{ borderTop: '1px solid #e8e0d4', paddingTop: 20, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <p style={{ fontSize: 12, color: '#888880', fontFamily: 'var(--font-ui)' }}>
              © {new Date().getFullYear()} faro. Todos os direitos reservados.
            </p>
            <p style={{ fontSize: 12, color: '#888880', fontFamily: 'var(--font-ui)' }}>
              Feito com IA.
            </p>
          </div>
        </div>
      </footer>

      {/* ── Responsive ─────────────────────────────────────────────────── */}
      <style>{`
        @media (max-width: 860px) {
          .features-grid  { grid-template-columns: 1fr !important; }
          .howto-grid     { grid-template-columns: 1fr !important; gap: 40px !important; }
          .cards-row      { flex-direction: column !important; }
          .pricing-grid   { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  );
}

/* ─── Helpers ───────────────────────────────────────────────────────────── */

const navLinkStyle: React.CSSProperties = {
  fontSize: 14,
  color: 'rgba(240,234,216,0.5)',
  fontFamily: 'var(--font-ui)',
  fontWeight: 500,
  textDecoration: 'none',
  transition: 'color 0.15s',
};

function FeatureList({ items, highlight = false }: { items: string[]; highlight?: boolean }) {
  return (
    <ul style={{ listStyle: 'none', padding: 0, marginBottom: 24, display: 'flex', flexDirection: 'column', gap: 10 }}>
      {items.map((item) => (
        <li key={item} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{
            width: 17,
            height: 17,
            borderRadius: '50%',
            background: highlight ? 'rgba(232,93,38,0.15)' : '#f5f2ec',
            border: `1px solid ${highlight ? 'rgba(232,93,38,0.35)' : '#ede7de'}`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
            fontSize: 9,
            color: highlight ? '#e85d26' : '#888880',
            fontWeight: 700,
          }}>
            ✓
          </span>
          <span style={{
            fontSize: 14,
            color: highlight ? 'rgba(240,234,216,0.85)' : '#1a1208',
            fontFamily: 'var(--font-ui)',
          }}>
            {item}
          </span>
        </li>
      ))}
    </ul>
  );
}

function FooterLink({ href, to, children }: { href?: string; to?: string; children: React.ReactNode }) {
  const style: React.CSSProperties = {
    fontSize: 14,
    color: '#888880',
    fontFamily: 'var(--font-ui)',
    textDecoration: 'none',
    transition: 'color 0.15s',
  };
  const handlers = {
    onMouseEnter: (e: React.MouseEvent<HTMLElement>) => (e.currentTarget.style.color = '#1a1208'),
    onMouseLeave: (e: React.MouseEvent<HTMLElement>) => (e.currentTarget.style.color = '#888880'),
  };
  if (to) return <Link to={to} style={style} {...handlers}>{children}</Link>;
  return <a href={href} style={style} {...handlers}>{children}</a>;
}
