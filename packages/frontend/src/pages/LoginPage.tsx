import React, { useState, FormEvent } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button, Input, Card, Logo } from '@/components/ui';

export function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await login(email, password);
      navigate('/dashboard');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao entrar');
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
          <h1 style={styles.title}>Bom ter você de volta.</h1>
          <p style={styles.subtitle}>Entre na sua conta para continuar.</p>

          <form onSubmit={handleSubmit} style={styles.form} noValidate>
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
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
              required
            />

            {error && <p style={styles.errorMsg}>{error}</p>}

            <Button
              type="submit"
              fullWidth
              size="lg"
              loading={loading}
              style={{ marginTop: '8px' }}
            >
              Entrar
            </Button>
          </form>
        </Card>

        <p style={styles.footer}>
          Ainda não tem conta?{' '}
          <Link to="/register">Criar conta</Link>
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
