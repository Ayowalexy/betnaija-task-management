import { useEffect } from 'react';
import type { ReactElement } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { useUIStore } from '../store/uiStore';
import type { UserRole } from '../types/index';

interface RoleGuardProps {
  allowed: UserRole[];
  children: ReactElement;
}

export function RoleGuard({ allowed, children }: RoleGuardProps): ReactElement {
  const currentUser = useAuthStore((s) => s.currentUser);
  const addToast = useUIStore((s) => s.addToast);
  const hasAccess = currentUser != null && allowed.includes(currentUser.role);

  useEffect(() => {
    if (!hasAccess) {
      addToast({ type: 'error', message: "You don't have permission to access that page." });
    }
  }, [hasAccess, addToast]);

  if (!hasAccess) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
}

interface AuthGuardProps {
  children: ReactElement;
}

export function AuthGuard({ children }: AuthGuardProps): ReactElement {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  return children;
}
