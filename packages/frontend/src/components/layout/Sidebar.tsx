import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Logo } from '@/components/ui';

interface NavItem {
  label: string;
  path: string;
  icon: string;
}

interface SidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
}

const navItems: NavItem[] = [
  { label: 'Dashboard',    path: '/dashboard',    icon: '◈' },
  { label: 'Campanhas',    path: '/campanhas',    icon: '▤' },
  { label: 'Integrações',  path: '/integracoes',  icon: '⇄' },
];

const PLANO_LABEL: Record<string, string> = {
  free: 'Gratuito',
  basico: 'Básico',
  pro: 'Pro',
};

export function Sidebar({ isOpen, onClose }: SidebarProps) {
  const { user, logout, updateProfile } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [showModal, setShowModal] = useState(false);
  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [confirmarSenha, setConfirmarSenha] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  function openModal() {
    setNome(user?.nome ?? '');
    setEmail(user?.email ?? '');
    setSenha('');
    setConfirmarSenha('');
    setError('');
    setSuccess(false);
    setShowModal(true);
  }

  function closeModal() {
    setShowModal(false);
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setSuccess(false);

    if (senha && senha !== confirmarSenha) {
      setError('As senhas não coincidem.');
      return;
    }
    if (senha && senha.length < 8) {
      setError('A senha deve ter ao menos 8 caracteres.');
      return;
    }

    const data: { nome?: string; email?: string; password?: string } = {};
    if (nome && nome !== user?.nome) data.nome = nome;
    if (email && email !== user?.email) data.email = email;
    if (senha) data.password = senha;

    if (Object.keys(data).length === 0) {
      closeModal();
      return;
    }

    setSaving(true);
    try {
      await updateProfile(data);
      setSuccess(true);
      setSenha('');
      setConfirmarSenha('');
      setTimeout(() => {
        setSuccess(false);
        closeModal();
      }, 1200);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Erro ao salvar alterações.');
    } finally {
      setSaving(false);
    }
  }

  function handleLogout() {
    logout();
    navigate('/login');
  }

  function handleNav(path: string) {
    navigate(path);
    onClose?.();
  }

  return (
    <>
      <aside className={`app-sidebar${isOpen ? ' sidebar-open' : ''}`} style={styles.sidebar}>
        <div className="sidebar-logo" style={styles.logoWrap}>
          <Logo variant="full" theme="light" height={36} />
          <button className="sidebar-close" onClick={onClose} aria-label="Fechar menu">✕</button>
        </div>

        <nav className="sidebar-nav" style={styles.nav}>
          {navItems.map((item) => {
            const active = location.pathname === item.path;
            return (
              <button
                key={item.path}
                onClick={() => handleNav(item.path)}
                className="sidebar-nav-item"
                style={{
                  ...styles.navItem,
                  ...(active ? styles.navItemActive : {}),
                }}
              >
                <span className="sidebar-nav-icon" style={styles.navIcon}>{item.icon}</span>
                {item.label}
              </button>
            );
          })}
        </nav>

        {user?.plano === 'free' && (
          <button
            onClick={() => { navigate('/assinar'); onClose?.(); }}
            style={styles.upgradeBtn}
          >
            ✦ Fazer upgrade
          </button>
        )}

        <div className="sidebar-footer" style={styles.footer}>
          <button onClick={openModal} style={styles.profileBtn} title="Editar perfil">
            <div style={styles.avatar}>
              {user?.nome?.charAt(0).toUpperCase()}
            </div>
            <div style={styles.userText}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={styles.userName}>{user?.nome}</span>
                <span style={styles.planoBadge}>
                  {PLANO_LABEL[user?.plano ?? 'free'] ?? user?.plano}
                </span>
              </div>
              <span style={styles.userEmail}>{user?.email}</span>
            </div>
          </button>

          <button onClick={handleLogout} style={styles.logoutBtn} title="Sair da conta">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
              <polyline points="16 17 21 12 16 7" />
              <line x1="21" y1="12" x2="9" y2="12" />
            </svg>
            Sair
          </button>
        </div>
      </aside>

      {showModal && (
        <div style={styles.overlay} onClick={closeModal}>
          <div style={styles.modal} onClick={e => e.stopPropagation()}>
            <div style={styles.modalHeader}>
              <h2 style={styles.modalTitle}>Editar perfil</h2>
              <button onClick={closeModal} style={styles.closeBtn} aria-label="Fechar">✕</button>
            </div>

            <form onSubmit={handleSave} style={styles.form}>
              <div style={styles.avatarLarge}>
                {user?.nome?.charAt(0).toUpperCase()}
              </div>

              <div style={styles.field}>
                <label style={styles.label}>Nome</label>
                <input
                  type="text"
                  value={nome}
                  onChange={e => setNome(e.target.value)}
                  style={styles.input}
                  placeholder="Seu nome"
                  disabled={saving}
                />
              </div>

              <div style={styles.field}>
                <label style={styles.label}>Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  style={styles.input}
                  placeholder="seu@email.com"
                  disabled={saving}
                />
              </div>

              <div style={styles.divider} />

              <div style={styles.field}>
                <label style={styles.label}>Nova senha <span style={styles.optional}>(opcional)</span></label>
                <input
                  type="password"
                  value={senha}
                  onChange={e => setSenha(e.target.value)}
                  style={styles.input}
                  placeholder="Mínimo 8 caracteres"
                  disabled={saving}
                />
              </div>

              {senha && (
                <div style={styles.field}>
                  <label style={styles.label}>Confirmar nova senha</label>
                  <input
                    type="password"
                    value={confirmarSenha}
                    onChange={e => setConfirmarSenha(e.target.value)}
                    style={styles.input}
                    placeholder="Repita a senha"
                    disabled={saving}
                  />
                </div>
              )}

              {error && <p style={styles.errorMsg}>{error}</p>}
              {success && <p style={styles.successMsg}>Perfil atualizado!</p>}

              <div style={styles.actions}>
                <button type="button" onClick={closeModal} style={styles.cancelBtn} disabled={saving}>
                  Cancelar
                </button>
                <button type="submit" style={styles.saveBtn} disabled={saving}>
                  {saving ? 'Salvando…' : 'Salvar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}

const styles: Record<string, React.CSSProperties> = {
  sidebar: {
    width: '220px',
    minHeight: '100vh',
    background: 'var(--color-bg-card)',
    borderRight: '1px solid var(--color-border)',
    display: 'flex',
    flexDirection: 'column',
    padding: '24px 16px',
    flexShrink: 0,
  },
  logoWrap: {
    marginBottom: '32px',
    paddingLeft: '8px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  nav: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
    flex: 1,
  },
  navItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    padding: '10px 12px',
    borderRadius: '8px',
    border: 'none',
    background: 'transparent',
    color: 'var(--color-text-muted)',
    fontFamily: 'var(--font-ui)',
    fontSize: '14px',
    fontWeight: 500,
    cursor: 'pointer',
    textAlign: 'left',
    transition: 'background 0.15s ease, color 0.15s ease',
  },
  navItemActive: {
    background: 'rgba(232, 93, 38, 0.08)',
    color: 'var(--color-ember)',
  },
  navIcon: {
    fontSize: '16px',
    lineHeight: 1,
  },
  footer: {
    borderTop: '1px solid var(--color-border)',
    paddingTop: '12px',
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  profileBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    padding: '6px 8px',
    borderRadius: '8px',
    textAlign: 'left',
    width: '100%',
    transition: 'background 0.15s ease',
  },
  avatar: {
    width: '32px',
    height: '32px',
    borderRadius: '50%',
    background: 'var(--color-ember)',
    color: 'white',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontFamily: 'var(--font-display)',
    fontWeight: 800,
    fontSize: '14px',
    flexShrink: 0,
  },
  userText: {
    display: 'flex',
    flexDirection: 'column',
    minWidth: 0,
    flex: 1,
  },
  userName: {
    fontSize: '13px',
    fontWeight: 500,
    color: 'var(--color-text-primary)',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  userEmail: {
    fontSize: '11px',
    color: 'var(--color-text-muted)',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  logoutBtn: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '6px',
    width: '100%',
    padding: '8px',
    borderRadius: '8px',
    border: '1px solid var(--color-border)',
    background: 'transparent',
    color: 'var(--color-text-muted)',
    fontFamily: 'var(--font-ui)',
    fontSize: '13px',
    fontWeight: 500,
    cursor: 'pointer',
    transition: 'background 0.15s ease, color 0.15s ease, border-color 0.15s ease',
  },
  upgradeBtn: {
    display: 'block',
    width: '100%',
    marginBottom: '12px',
    padding: '9px 0',
    borderRadius: 'var(--radius-btn)',
    border: '1.5px solid var(--color-ember)',
    background: 'rgba(232,93,38,0.06)',
    color: 'var(--color-ember)',
    fontFamily: 'var(--font-ui)',
    fontSize: '13px',
    fontWeight: 600,
    cursor: 'pointer',
    textAlign: 'center',
  },
  planoBadge: {
    fontSize: '10px',
    fontWeight: 600,
    padding: '2px 6px',
    borderRadius: 10,
    background: 'rgba(232,93,38,0.1)',
    color: 'var(--color-ember)',
    flexShrink: 0,
  },

  // Modal
  overlay: {
    position: 'fixed',
    inset: 0,
    background: 'rgba(0,0,0,0.45)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
    padding: '16px',
  },
  modal: {
    background: 'var(--color-bg-card)',
    borderRadius: 'var(--radius-modal)',
    boxShadow: 'var(--shadow-modal)',
    width: '100%',
    maxWidth: '420px',
    padding: '28px 28px 24px',
    display: 'flex',
    flexDirection: 'column',
  },
  modalHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: '20px',
  },
  modalTitle: {
    fontFamily: 'var(--font-display)',
    fontSize: '18px',
    fontWeight: 700,
    color: 'var(--color-text-primary)',
    margin: 0,
  },
  closeBtn: {
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    fontSize: '16px',
    color: 'var(--color-text-muted)',
    padding: '4px',
    lineHeight: 1,
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '14px',
  },
  avatarLarge: {
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
    alignSelf: 'center',
    marginBottom: '4px',
  },
  field: {
    display: 'flex',
    flexDirection: 'column',
    gap: '5px',
  },
  label: {
    fontSize: '12px',
    fontWeight: 600,
    color: 'var(--color-text-muted)',
    fontFamily: 'var(--font-ui)',
    textTransform: 'uppercase',
    letterSpacing: '0.04em',
  },
  optional: {
    fontSize: '11px',
    fontWeight: 400,
    textTransform: 'none',
    letterSpacing: 0,
  },
  input: {
    padding: '9px 12px',
    borderRadius: '8px',
    border: '1px solid var(--color-border)',
    background: 'var(--color-bg)',
    color: 'var(--color-text-primary)',
    fontFamily: 'var(--font-ui)',
    fontSize: '14px',
    outline: 'none',
    width: '100%',
    boxSizing: 'border-box' as const,
  },
  divider: {
    borderTop: '1px solid var(--color-border)',
    margin: '2px 0',
  },
  errorMsg: {
    margin: 0,
    fontSize: '13px',
    color: '#d32f2f',
    fontFamily: 'var(--font-ui)',
  },
  successMsg: {
    margin: 0,
    fontSize: '13px',
    color: '#2e7d32',
    fontFamily: 'var(--font-ui)',
    fontWeight: 600,
  },
  actions: {
    display: 'flex',
    gap: '8px',
    marginTop: '4px',
  },
  cancelBtn: {
    flex: 1,
    padding: '10px',
    borderRadius: '8px',
    border: '1px solid var(--color-border)',
    background: 'transparent',
    color: 'var(--color-text-muted)',
    fontFamily: 'var(--font-ui)',
    fontSize: '14px',
    fontWeight: 500,
    cursor: 'pointer',
  },
  saveBtn: {
    flex: 1,
    padding: '10px',
    borderRadius: '8px',
    border: 'none',
    background: 'var(--color-ember)',
    color: 'white',
    fontFamily: 'var(--font-ui)',
    fontSize: '14px',
    fontWeight: 600,
    cursor: 'pointer',
  },
};
