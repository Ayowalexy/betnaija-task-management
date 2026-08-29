import { useEffect } from 'react';
import type { ReactElement } from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';
import { Sidebar } from './Sidebar';
import { Topbar } from './Topbar';
import styles from './AppShell.module.css';

export function AppShell(): ReactElement {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const isInitializing = useAuthStore((s) => s.isInitializing);
  const theme = useAuthStore((s) => s.theme);

  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  if (isInitializing) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh' }}>
        <div style={{ color: 'var(--color-text-secondary)', fontSize: 'var(--font-size-sm)' }}>Loading…</div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className={styles.shell}>
      <Sidebar />
      <div className={styles.main}>
        <Topbar />
        <div className={styles.content}>
          <Outlet />
        </div>
      </div>
    </div>
  );
}
