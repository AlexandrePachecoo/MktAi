import React from 'react';
import { Sidebar } from './Sidebar';

interface AppLayoutProps {
  children: React.ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  return (
    <div className="app-root" style={styles.root}>
      <Sidebar />
      <main className="app-main" style={styles.main}>{children}</main>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  root: {
    display: 'flex',
    minHeight: '100vh',
    background: 'var(--color-bg)',
  },
  main: {
    flex: 1,
    padding: '32px',
    minWidth: 0,
  },
};
