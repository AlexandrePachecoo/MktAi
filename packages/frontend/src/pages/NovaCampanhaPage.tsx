import React, { useState, FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppLayout } from '@/components/layout/AppLayout';
import { Button, Input, Card } from '@/components/ui';
import { api } from '@/lib/api';

type Plataforma = 'meta' | 'google' | 'ambos';

const PLATAFORMAS: { value: Plataforma; label: string; desc: string }[] = [
  { value: 'meta', label: 'Meta', desc: 'Facebook e Instagram' },
  { value: 'google', label: 'Google', desc: 'Search e Display' },
  { value: 'ambos', label: 'Meta + Google', desc: 'Ambas as plataformas' },
];

export function NovaCampanhaPage() {
  const navigate = useNavigate();

  const [nome, setNome] = useState('');
  const [descricao, setDescricao] = useState('');
  const [objetivo, setObjetivo] = useState('');
  const [publicoAlvo, setPublicoAlvo] = useState('');
  const [orcamento, setOrcamento] = useState('');
  const [plataforma, setPlataforma] = useState<Plataforma>('meta');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  function validate() {
    const e: Record<string, string> = {};
    if (!nome.trim()) e.nome = 'Informe o nome da campanha';
    if (!descricao.trim()) e.descricao = 'Informe a descrição';
    if (!publicoAlvo.trim()) e.publicoAlvo = 'Informe o público-alvo';
    if (!orcamento || Number(orcamento) <= 0) e.orcamento = 'Informe um orçamento válido';
    return e;
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const erros = validate();
    if (Object.keys(erros).length > 0) { setErrors(erros); return; }

    setLoading(true);
    setErrors({});

    try {
      await api.post('/campanhas', {
        nome: nome.trim(),
        descricao: descricao.trim(),
        objetivo: objetivo.trim() || undefined,
        publico_alvo: publicoAlvo.trim(),
        orcamento: Number(orcamento),
        plataforma,
      });
      navigate('/campanhas');
    } catch (err) {
      setErrors({ form: err instanceof Error ? err.message : 'Erro ao criar campanha' });
    } finally {
      setLoading(false);
    }
  }

  return (
    <AppLayout>
      <div style={styles.header}>
        <button onClick={() => navigate('/campanhas')} style={styles.back}>
          ← Voltar
        </button>
        <div>
          <h1 style={styles.title}>Nova campanha</h1>
          <p style={styles.subtitle}>Preencha os dados para criar sua campanha</p>
        </div>
      </div>

      <div style={styles.layout}>
        <form onSubmit={handleSubmit} noValidate style={styles.form}>

          {/* Informações básicas */}
          <Card>
            <p style={styles.sectionTitle}>Informações básicas</p>
            <div style={styles.fields}>
              <Input
                label="Nome da campanha"
                placeholder="Ex: Lançamento do produto X"
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                error={errors.nome}
              />

              <div style={styles.fieldGroup}>
                <label style={styles.label}>Descrição</label>
                <textarea
                  placeholder="Descreva o objetivo e contexto da campanha"
                  value={descricao}
                  onChange={(e) => setDescricao(e.target.value)}
                  rows={4}
                  style={{
                    ...styles.textarea,
                    borderColor: errors.descricao ? 'var(--color-ember)' : 'var(--color-border)',
                  }}
                  onFocus={(e) => (e.currentTarget.style.borderColor = 'var(--color-ember)')}
                  onBlur={(e) => (e.currentTarget.style.borderColor = errors.descricao ? 'var(--color-ember)' : 'var(--color-border)')}
                />
                {errors.descricao && <span style={styles.errorMsg}>{errors.descricao}</span>}
              </div>

              <Input
                label="Objetivo (opcional)"
                placeholder="Ex: conversão, awareness, leads"
                value={objetivo}
                onChange={(e) => setObjetivo(e.target.value)}
                hint="Deixe em branco se não souber ainda."
              />
            </div>
          </Card>

          {/* Segmentação */}
          <Card>
            <p style={styles.sectionTitle}>Segmentação e orçamento</p>
            <div style={styles.fields}>
              <Input
                label="Público-alvo"
                placeholder="Ex: Homens 25-40, interessados em tecnologia"
                value={publicoAlvo}
                onChange={(e) => setPublicoAlvo(e.target.value)}
                error={errors.publicoAlvo}
              />

              <Input
                label="Orçamento (R$)"
                type="number"
                placeholder="Ex: 1500"
                value={orcamento}
                onChange={(e) => setOrcamento(e.target.value)}
                error={errors.orcamento}
                hint="Orçamento total da campanha em reais."
              />
            </div>
          </Card>

          {/* Plataforma */}
          <Card>
            <p style={styles.sectionTitle}>Plataforma</p>
            <div style={styles.plataformas}>
              {PLATAFORMAS.map((p) => (
                <button
                  key={p.value}
                  type="button"
                  onClick={() => setPlataforma(p.value)}
                  style={{
                    ...styles.plataformaBtn,
                    borderColor: plataforma === p.value ? 'var(--color-ember)' : 'var(--color-border)',
                    background: plataforma === p.value ? 'rgba(232,93,38,0.06)' : 'var(--color-bg)',
                  }}
                >
                  <span style={{
                    ...styles.plataformaDot,
                    background: plataforma === p.value ? 'var(--color-ember)' : 'var(--color-border)',
                  }} />
                  <div>
                    <p style={{
                      ...styles.plataformaLabel,
                      color: plataforma === p.value ? 'var(--color-ember)' : 'var(--color-text-primary)',
                    }}>
                      {p.label}
                    </p>
                    <p style={styles.plataformaDesc}>{p.desc}</p>
                  </div>
                </button>
              ))}
            </div>
          </Card>

          {errors.form && (
            <p style={styles.formError}>{errors.form}</p>
          )}

          <div style={styles.actions}>
            <Button variant="ghost" type="button" onClick={() => navigate('/campanhas')}>
              Cancelar
            </Button>
            <Button type="submit" loading={loading} size="lg">
              Criar campanha
            </Button>
          </div>
        </form>

        {/* Dica lateral */}
        <aside style={styles.aside}>
          <Card style={{ padding: '20px' }}>
            <p style={styles.dicaTitle}>Como funciona</p>
            <div style={styles.dicas}>
              <Dica numero="1" texto="Crie a campanha com os dados do produto e público." />
              <Dica numero="2" texto="A IA gera uma estratégia com distribuição e copies." />
              <Dica numero="3" texto="Faça upload dos seus criativos e inicie os testes A/B." />
              <Dica numero="4" texto="A IA otimiza automaticamente a cada hora." />
            </div>
          </Card>
        </aside>
      </div>
    </AppLayout>
  );
}

function Dica({ numero, texto }: { numero: string; texto: string }) {
  return (
    <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
      <span style={{
        width: '22px', height: '22px', borderRadius: '50%',
        background: 'rgba(232,93,38,0.1)', color: 'var(--color-ember)',
        fontSize: '11px', fontWeight: 800, display: 'flex',
        alignItems: 'center', justifyContent: 'center', flexShrink: 0,
        fontFamily: 'var(--font-display)',
      }}>
        {numero}
      </span>
      <p style={{ fontSize: '13px', color: 'var(--color-text-muted)', lineHeight: 1.5, margin: 0 }}>
        {texto}
      </p>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  header: {
    marginBottom: '28px',
  },
  back: {
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    fontSize: '13px',
    color: 'var(--color-text-muted)',
    fontFamily: 'var(--font-ui)',
    padding: 0,
    marginBottom: '12px',
    display: 'block',
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
  layout: {
    display: 'grid',
    gridTemplateColumns: '1fr 280px',
    gap: '24px',
    alignItems: 'start',
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '20px',
  },
  sectionTitle: {
    fontFamily: 'var(--font-display)',
    fontSize: '15px',
    fontWeight: 800,
    margin: '0 0 20px 0',
    color: 'var(--color-text-primary)',
  },
  fields: {
    display: 'flex',
    flexDirection: 'column',
    gap: '18px',
  },
  fieldGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
  },
  label: {
    fontFamily: 'var(--font-ui)',
    fontSize: '12px',
    fontWeight: 500,
    color: 'var(--color-text-muted)',
    textTransform: 'uppercase' as const,
    letterSpacing: '0.05em',
  },
  textarea: {
    fontFamily: 'var(--font-ui)',
    fontSize: '14px',
    padding: '12px 14px',
    borderRadius: '8px',
    border: '1px solid var(--color-border)',
    background: 'var(--color-bg-card)',
    color: 'var(--color-text-primary)',
    resize: 'vertical' as const,
    outline: 'none',
    lineHeight: 1.6,
    transition: 'border-color 0.15s ease',
    width: '100%',
  },
  errorMsg: {
    fontSize: '12px',
    color: 'var(--color-ember)',
  },
  plataformas: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, 1fr)',
    gap: '12px',
  },
  plataformaBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '14px 16px',
    border: '1px solid',
    borderRadius: '10px',
    cursor: 'pointer',
    fontFamily: 'var(--font-ui)',
    textAlign: 'left' as const,
    transition: 'border-color 0.15s ease, background 0.15s ease',
  },
  plataformaDot: {
    width: '10px',
    height: '10px',
    borderRadius: '50%',
    flexShrink: 0,
    transition: 'background 0.15s ease',
  },
  plataformaLabel: {
    fontSize: '13px',
    fontWeight: 500,
    margin: '0 0 2px 0',
    transition: 'color 0.15s ease',
  },
  plataformaDesc: {
    fontSize: '11px',
    color: 'var(--color-text-muted)',
    margin: 0,
  },
  actions: {
    display: 'flex',
    justifyContent: 'flex-end',
    gap: '12px',
  },
  formError: {
    fontSize: '13px',
    color: 'var(--color-ember)',
    background: 'rgba(232,93,38,0.08)',
    border: '1px solid rgba(232,93,38,0.2)',
    borderRadius: '8px',
    padding: '10px 14px',
    margin: 0,
  },
  aside: {
    position: 'sticky',
    top: '32px',
  },
  dicaTitle: {
    fontFamily: 'var(--font-display)',
    fontSize: '14px',
    fontWeight: 800,
    margin: '0 0 16px 0',
  },
  dicas: {
    display: 'flex',
    flexDirection: 'column',
    gap: '14px',
  },
};
