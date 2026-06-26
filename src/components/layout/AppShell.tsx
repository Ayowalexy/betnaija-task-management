import { useEffect } from 'react';
import type { ReactElement } from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { Sidebar } from './Sidebar';
import { Topbar } from './Topbar';
import styles from './AppShell.module.css';

export function AppShell(): ReactElement {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const isFirstLogin = useAuthStore((s) => s.isFirstLogin);
  const theme = useAuthStore((s) => s.theme);

  // Apply theme class to <html> element whenever theme changes
  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (isFirstLogin) {
    return <Navigate to="/reset-password" replace />;
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
