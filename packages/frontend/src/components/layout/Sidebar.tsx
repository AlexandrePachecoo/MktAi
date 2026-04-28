import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Logo } from '@/components/ui';
import { ProfileModal } from '@/components/profile/ProfileModal';

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
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [profileOpen, setProfileOpen] = useState(false);
  const [logoutHover, setLogoutHover] = useState(false);
  const [profileHover, setProfileHover] = useState(false);

  function handleLogout() {
    logout();
    navigate('/login');
  }

  function handleOpenProfile() {
    setProfileOpen(true);
    onClose?.();
  }

  function handleNav(path: string) {
    navigate(path);
    onClose?.();
  }

  return (
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
        <button
          type="button"
          onClick={handleOpenProfile}
          onMouseEnter={() => setProfileHover(true)}
          onMouseLeave={() => setProfileHover(false)}
          aria-label="Abrir perfil"
          style={{
            ...styles.userInfo,
            ...(profileHover ? styles.userInfoHover : {}),
          }}
        >
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
        <button
          type="button"
          onClick={handleLogout}
          onMouseEnter={() => setLogoutHover(true)}
          onMouseLeave={() => setLogoutHover(false)}
          style={{
            ...styles.logoutBtn,
            ...(logoutHover ? styles.logoutBtnHover : {}),
          }}
        >
          <span style={styles.logoutIcon} aria-hidden="true">↩</span>
          Sair da conta
        </button>
      </div>

      <ProfileModal open={profileOpen} onClose={() => setProfileOpen(false)} />
    </aside>
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
    paddingTop: '16px',
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  userInfo: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    width: '100%',
    minWidth: 0,
    padding: '8px',
    border: 'none',
    background: 'transparent',
    borderRadius: '10px',
    cursor: 'pointer',
    textAlign: 'left',
    transition: 'background 0.15s ease',
  },
  userInfoHover: {
    background: 'rgba(26, 18, 8, 0.04)',
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
    gap: '8px',
    width: '100%',
    padding: '10px 12px',
    borderRadius: '8px',
    border: '1px solid var(--color-border)',
    background: 'transparent',
    color: 'var(--color-text-muted)',
    fontFamily: 'var(--font-ui)',
    fontSize: '13px',
    fontWeight: 500,
    cursor: 'pointer',
    textAlign: 'left',
    transition: 'background 0.15s ease, color 0.15s ease, border-color 0.15s ease',
  },
  logoutBtnHover: {
    color: 'var(--color-ember)',
    borderColor: 'rgba(232, 93, 38, 0.3)',
    background: 'rgba(232, 93, 38, 0.06)',
  },
  logoutIcon: {
    fontSize: '15px',
    lineHeight: 1,
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
};
