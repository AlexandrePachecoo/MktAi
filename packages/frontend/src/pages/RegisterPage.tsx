import React, { useState, FormEvent } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button, Input, Card, Logo } from '@/components/ui';

export function RegisterPage() {
  const { register } = useAuth();
  const navigate = useNavigate();

  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await register(nome, email, password);
      navigate('/dashboard');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao criar conta');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={styles.page}>
      <div style={styles.container}>
        <div style={styles.logoWrap}>
          <Logo variant="full" theme="light" height={48} />
        </div>

        <Card style={styles.card}>
          <h1 style={styles.title}>Comece agora.</h1>
          <p style={styles.subtitle}>Crie sua conta e ilumine suas campanhas.</p>

          <form onSubmit={handleSubmit} style={styles.form} noValidate>
            <Input
              label="Nome"
              type="text"
              placeholder="Seu nome"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              autoComplete="name"
              required
            />

            <Input
              label="E-mail"
              type="email"
              placeholder="voce@exemplo.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
              required
            />

            <Input
              label="Senha"
              type="password"
              placeholder="Mínimo 8 caracteres"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="new-password"
              required
              hint="Use letras, números e símbolos para uma senha forte."
            />

            {error && <p style={styles.errorMsg}>{error}</p>}

            <Button
              type="submit"
              fullWidth
              size="lg"
              loading={loading}
              style={{ marginTop: '8px' }}
            >
              Criar conta
            </Button>
          </form>
        </Card>

        <p style={styles.footer}>
          Já tem conta?{' '}
          <Link to="/login">Entrar</Link>
        </p>
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  page: {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '24px',
    background: 'var(--color-bg)',
  },
  container: {
    width: '100%',
    maxWidth: '400px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '24px',
  },
  logoWrap: {
    marginBottom: '4px',
  },
  card: {
    width: '100%',
    padding: '36px 32px',
  },
  title: {
    fontFamily: 'var(--font-display)',
    fontSize: '22px',
    fontWeight: 800,
    color: 'var(--color-text-primary)',
    marginBottom: '6px',
  },
  subtitle: {
    fontSize: '14px',
    color: 'var(--color-text-muted)',
    marginBottom: '28px',
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '18px',
  },
  errorMsg: {
    fontSize: '13px',
    color: 'var(--color-ember)',
    background: 'rgba(232, 93, 38, 0.08)',
    border: '1px solid rgba(232, 93, 38, 0.2)',
    borderRadius: '8px',
    padding: '10px 14px',
    margin: 0,
  },
  footer: {
    fontSize: '13px',
    color: 'var(--color-text-muted)',
  },
};
