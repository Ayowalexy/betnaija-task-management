import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useNavigate } from 'react-router-dom';
import { Zap, Eye, EyeOff } from 'lucide-react';
import { useAuthStore } from '../../../store/authStore';
import { USERS } from '../../../mocks/users';
import { loginSchema } from '../schemas';
import type { LoginFormValues } from '../types';
import type { UserRole } from '../../../types/index';
import styles from './LoginPage.module.css';

const DEMO_ROLES: { label: string; role: UserRole }[] = [
  { label: 'Root Admin', role: 'root_admin' },
  { label: 'Dept Head', role: 'dept_head' },
  { label: 'Team Member', role: 'team_member' },
];

export function LoginPage() {
  const navigate = useNavigate();
  const login = useAuthStore((s) => s.login);
  const [showPassword, setShowPassword] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (values: LoginFormValues) => {
    setLoginError(null);
    // Simulate async login
    await new Promise((r) => setTimeout(r, 600));
    const user = USERS.find((u) => u.email === values.email);
    if (!user) {
      setLoginError('No account found with that email address.');
      return;
    }
    login(user);
    navigate(user.isFirstLogin ? '/reset-password' : '/dashboard');
  };

  const loginAsRole = (role: UserRole) => {
    const user = USERS.find((u) => u.role === role);
    if (!user) return;
    login(user);
    navigate(user.isFirstLogin ? '/reset-password' : '/dashboard');
  };

  return (
    <div className={styles.page}>
      <div className={styles.card}>
        <div className={styles.logo}>
          <div className={styles.logoIcon}>
            <Zap size={20} />
          </div>
          <span className={styles.logoName}>FlowDesk</span>
        </div>

        <h1 className={styles.heading}>Welcome back</h1>
        <p className={styles.subheading}>Sign in to your workspace</p>

        <form className={styles.form} onSubmit={handleSubmit(onSubmit)} noValidate>
          {loginError && <div className={styles.errorBanner}>{loginError}</div>}

          <div>
            <label htmlFor="email" style={{ display: 'block', marginBottom: 6, fontSize: 'var(--font-size-sm)', fontWeight: 500, color: 'var(--color-text-primary)' }}>
              Email address
            </label>
            <input
              id="email"
              type="email"
              autoComplete="email"
              placeholder="you@company.com"
              style={{
                width: '100%',
                padding: '10px 14px',
                border: `1px solid ${errors.email ? 'var(--color-error)' : 'var(--color-border-default)'}`,
                borderRadius: 'var(--radius-md)',
                fontSize: 'var(--font-size-sm)',
                background: 'var(--color-bg-elevated)',
                color: 'var(--color-text-primary)',
                outline: 'none',
                boxSizing: 'border-box',
              }}
              {...register('email')}
            />
            {errors.email && (
              <p style={{ margin: '4px 0 0', fontSize: 'var(--font-size-xs)', color: 'var(--color-error)' }}>
                {errors.email.message}
              </p>
            )}
          </div>

          <div>
            <label htmlFor="password" style={{ display: 'block', marginBottom: 6, fontSize: 'var(--font-size-sm)', fontWeight: 500, color: 'var(--color-text-primary)' }}>
              Password
            </label>
            <div style={{ position: 'relative' }}>
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="current-password"
                placeholder="Enter your password"
                style={{
                  width: '100%',
                  padding: '10px 40px 10px 14px',
                  border: `1px solid ${errors.password ? 'var(--color-error)' : 'var(--color-border-default)'}`,
                  borderRadius: 'var(--radius-md)',
                  fontSize: 'var(--font-size-sm)',
                  background: 'var(--color-bg-elevated)',
                  color: 'var(--color-text-primary)',
                  outline: 'none',
                  boxSizing: 'border-box',
                }}
                {...register('password')}
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                style={{
                  position: 'absolute',
                  right: 12,
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  color: 'var(--color-text-tertiary)',
                  padding: 0,
                  display: 'flex',
                }}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            {errors.password && (
              <p style={{ margin: '4px 0 0', fontSize: 'var(--font-size-xs)', color: 'var(--color-error)' }}>
                {errors.password.message}
              </p>
            )}
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className={styles.submitButton}
            style={{
              padding: '10px 16px',
              background: isSubmitting ? 'var(--color-primary-hover)' : 'var(--color-primary)',
              color: '#fff',
              border: 'none',
              borderRadius: 'var(--radius-md)',
              fontSize: 'var(--font-size-sm)',
              fontWeight: 600,
              cursor: isSubmitting ? 'not-allowed' : 'pointer',
              transition: 'var(--transition-base)',
              opacity: isSubmitting ? 0.8 : 1,
            }}
          >
            {isSubmitting ? 'Signing in…' : 'Sign in'}
          </button>
        </form>

        {import.meta.env.DEV && (
          <>
            <div className={styles.divider}>dev only</div>
            <div className={styles.devSwitcher}>
              <span className={styles.devLabel}>Quick login</span>
              <div className={styles.devButtons}>
                {DEMO_ROLES.map(({ label, role }) => (
                  <button key={role} className={styles.devBtn} onClick={() => loginAsRole(role)}>
                    {label}
                  </button>
                ))}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
