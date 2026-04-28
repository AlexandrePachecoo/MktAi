import React, { useEffect, useState, FormEvent } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button, Input, Modal } from '@/components/ui';

interface ProfileModalProps {
  open: boolean;
  onClose: () => void;
}

export function ProfileModal({ open, onClose }: ProfileModalProps) {
  const { user, updateProfile } = useAuth();

  const [nome, setNome] = useState(user?.nome ?? '');
  const [email, setEmail] = useState(user?.email ?? '');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open) {
      setNome(user?.nome ?? '');
      setEmail(user?.email ?? '');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setError('');
      setSuccess('');
    }
  }, [open, user]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (newPassword) {
      if (newPassword.length < 8) {
        setError('Nova senha deve ter ao menos 8 caracteres');
        return;
      }
      if (newPassword !== confirmPassword) {
        setError('A confirmação não corresponde à nova senha');
        return;
      }
      if (!currentPassword) {
        setError('Informe sua senha atual para trocar a senha');
        return;
      }
    }

    const payload: {
      nome?: string;
      email?: string;
      currentPassword?: string;
      newPassword?: string;
    } = {};
    if (nome.trim() && nome.trim() !== user?.nome) payload.nome = nome.trim();
    if (email.trim() && email.trim() !== user?.email) payload.email = email.trim();
    if (newPassword) {
      payload.currentPassword = currentPassword;
      payload.newPassword = newPassword;
    }

    if (Object.keys(payload).length === 0) {
      setError('Nenhuma alteração para salvar');
      return;
    }

    setLoading(true);
    try {
      await updateProfile(payload);
      setSuccess('Perfil atualizado com sucesso');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setTimeout(() => {
        onClose();
      }, 1200);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao atualizar perfil');
    } finally {
      setLoading(false);
    }
  }

  if (!user) return null;

  return (
    <Modal open={open} onClose={onClose} title="Meu perfil" width={480}>
      <div style={styles.identity}>
        <div style={styles.avatar}>{user.nome.charAt(0).toUpperCase()}</div>
        <div>
          <div style={styles.identityName}>{user.nome}</div>
          <div style={styles.identityEmail}>{user.email}</div>
        </div>
      </div>

      <form onSubmit={handleSubmit} style={styles.form} noValidate>
        <div style={styles.section}>
          <div style={styles.sectionLabel}>Dados da conta</div>
          <Input
            label="Nome"
            value={nome}
            onChange={(e) => setNome(e.target.value)}
            autoComplete="name"
            required
          />
          <Input
            label="E-mail"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
            required
          />
        </div>

        <div style={styles.section}>
          <div style={styles.sectionLabel}>Trocar senha (opcional)</div>
          <Input
            label="Senha atual"
            type="password"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            autoComplete="current-password"
            placeholder="••••••••"
          />
          <Input
            label="Nova senha"
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            autoComplete="new-password"
            placeholder="Mínimo 8 caracteres"
          />
          <Input
            label="Confirmar nova senha"
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            autoComplete="new-password"
            placeholder="Repita a nova senha"
          />
        </div>

        {error && <p style={styles.errorMsg}>{error}</p>}
        {success && <p style={styles.successMsg}>{success}</p>}

        <div style={styles.actions}>
          <Button type="button" variant="ghost" onClick={onClose} disabled={loading}>
            Cancelar
          </Button>
          <Button type="submit" loading={loading}>
            Salvar alterações
          </Button>
        </div>
      </form>
    </Modal>
  );
}

const styles: Record<string, React.CSSProperties> = {
  identity: {
    display: 'flex',
    alignItems: 'center',
    gap: '14px',
    paddingBottom: '20px',
    marginBottom: '20px',
    borderBottom: '1px solid var(--color-border)',
  },
  avatar: {
    width: '56px',
    height: '56px',
    borderRadius: '50%',
    background: 'var(--color-ember)',
    color: 'white',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontFamily: 'var(--font-display)',
    fontWeight: 800,
    fontSize: '22px',
    flexShrink: 0,
  },
  identityName: {
    fontFamily: 'var(--font-display)',
    fontSize: '16px',
    fontWeight: 700,
    color: 'var(--color-text-primary)',
  },
  identityEmail: {
    fontSize: '13px',
    color: 'var(--color-text-muted)',
    marginTop: '2px',
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '20px',
  },
  section: {
    display: 'flex',
    flexDirection: 'column',
    gap: '14px',
  },
  sectionLabel: {
    fontFamily: 'var(--font-ui)',
    fontSize: '12px',
    fontWeight: 600,
    color: 'var(--color-text-muted)',
    textTransform: 'uppercase',
    letterSpacing: '0.06em',
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
  successMsg: {
    fontSize: '13px',
    color: '#1f7a4a',
    background: 'rgba(31, 122, 74, 0.08)',
    border: '1px solid rgba(31, 122, 74, 0.2)',
    borderRadius: '8px',
    padding: '10px 14px',
    margin: 0,
  },
  actions: {
    display: 'flex',
    justifyContent: 'flex-end',
    gap: '10px',
    marginTop: '4px',
  },
};
