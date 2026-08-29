import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { z } from 'zod';
import { Eye, EyeOff } from 'lucide-react';
import { authApi } from '@/api/auth';
import logo from '@/assets/logo.png';
import { resetPasswordSchema } from '../schemas';
import { usePasswordStrength } from '../hooks/usePasswordStrength';
import type { ResetPasswordFormValues } from '../types';
import styles from './ForceResetPage.module.css';

const STRENGTH_WIDTHS = { weak: '25%', fair: '50%', strong: '75%', very_strong: '100%' };
const STRENGTH_FILL_CLASS = {
  weak: styles.strengthWeak,
  fair: styles.strengthFair,
  strong: styles.strengthStrong,
  very_strong: styles.strengthVeryStrong,
};

// Schema for the unauthenticated account-setup flow (includes OTP field)
const setupSchema = z.object({
  otp: z.string().min(1, 'OTP is required'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  confirmPassword: z.string(),
}).refine((d) => d.password === d.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
});
type SetupFormValues = z.infer<typeof setupSchema>;

export function ForceResetPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  // setup=1 means the user arrived here via ACCOUNT_SETUP_REQUIRED (unauthenticated)
  const isSetupMode = searchParams.get('setup') === '1';
  const setupEmail = isSetupMode ? (sessionStorage.getItem('flowdesk:setup_email') ?? '') : '';

  const [showPw, setShowPw] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [pwValue, setPwValue] = useState('');
  const [formError, setFormError] = useState<string | null>(null);

  const { strength, label: strengthLabel } = usePasswordStrength(pwValue);

  // ── Authenticated first-login form ──────────────────────────────────────
  const authForm = useForm<ResetPasswordFormValues>({
    resolver: zodResolver(resetPasswordSchema),
  });

  const onAuthSubmit = async (values: ResetPasswordFormValues) => {
    await authApi.setPassword(values.password);
    navigate('/dashboard');
  };

  // ── Unauthenticated account-setup form ──────────────────────────────────
  const setupForm = useForm<SetupFormValues>({
    resolver: zodResolver(setupSchema),
  });

  const onSetupSubmit = async (values: SetupFormValues) => {
    setFormError(null);
    try {
      await authApi.resetPassword(setupEmail, values.otp, values.password);
      sessionStorage.removeItem('flowdesk:setup_email');
      navigate('/login');
    } catch {
      setFormError('Invalid or expired code. Please try again.');
    }
  };

  const pwRegisterProps = isSetupMode
    ? setupForm.register('password', {
        onChange: (e: React.ChangeEvent<HTMLInputElement>) => setPwValue(e.target.value),
      })
    : authForm.register('password', {
        onChange: (e: React.ChangeEvent<HTMLInputElement>) => setPwValue(e.target.value),
      });

  return (
    <div className={styles.page}>
      <div className={styles.card}>
        <div className={styles.logo}>
          <img src={logo} alt="Bet9ja" style={{ height: 48, objectFit: 'contain' }} />
        </div>

        <h1 className={styles.heading}>Set your password</h1>
        <p className={styles.subheading}>
          {isSetupMode
            ? `We sent a setup code to ${setupEmail}. Enter it below along with your new password.`
            : 'This is your first login. Create a secure password to continue.'}
        </p>

        {/* ── Unauthenticated setup form ── */}
        {isSetupMode && (
          <form className={styles.form} onSubmit={setupForm.handleSubmit(onSetupSubmit)} noValidate>
            {formError && (
              <div style={{ padding: '10px 14px', background: 'var(--color-error-bg)', color: 'var(--color-error)', borderRadius: 'var(--radius-md)', fontSize: 'var(--font-size-sm)' }}>
                {formError}
              </div>
            )}

            <div className={styles.fieldGroup}>
              <label htmlFor="otp" className={styles.label}>Setup code</label>
              <input
                id="otp"
                type="text"
                inputMode="numeric"
                autoComplete="one-time-code"
                placeholder="Enter code from email"
                className={`${styles.input} ${setupForm.formState.errors.otp ? styles.inputError : ''}`}
                {...setupForm.register('otp')}
              />
              {setupForm.formState.errors.otp && (
                <p className={styles.fieldError}>{setupForm.formState.errors.otp.message}</p>
              )}
            </div>

            <div className={styles.fieldGroup}>
              <label htmlFor="password" className={styles.label}>New password</label>
              <div className={styles.inputWrap}>
                <input
                  id="password"
                  type={showPw ? 'text' : 'password'}
                  autoComplete="new-password"
                  className={`${styles.input} ${setupForm.formState.errors.password ? styles.inputError : ''}`}
                  {...pwRegisterProps}
                />
                <button type="button" className={styles.toggleBtn} onClick={() => setShowPw((v) => !v)} aria-label={showPw ? 'Hide password' : 'Show password'}>
                  {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {pwValue && (
                <div className={styles.strengthBar}>
                  <div className={styles.strengthTrack}>
                    <div className={`${styles.strengthFill} ${STRENGTH_FILL_CLASS[strength]}`} style={{ width: STRENGTH_WIDTHS[strength] }} />
                  </div>
                  <p className={styles.strengthLabel}>Password strength: <strong>{strengthLabel}</strong></p>
                </div>
              )}
              {setupForm.formState.errors.password && (
                <p className={styles.fieldError}>{setupForm.formState.errors.password.message}</p>
              )}
            </div>

            <div className={styles.fieldGroup}>
              <label htmlFor="confirmPassword" className={styles.label}>Confirm password</label>
              <div className={styles.inputWrap}>
                <input
                  id="confirmPassword"
                  type={showConfirm ? 'text' : 'password'}
                  autoComplete="new-password"
                  className={`${styles.input} ${setupForm.formState.errors.confirmPassword ? styles.inputError : ''}`}
                  {...setupForm.register('confirmPassword')}
                />
                <button type="button" className={styles.toggleBtn} onClick={() => setShowConfirm((v) => !v)} aria-label={showConfirm ? 'Hide' : 'Show'}>
                  {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {setupForm.formState.errors.confirmPassword && (
                <p className={styles.fieldError}>{setupForm.formState.errors.confirmPassword.message}</p>
              )}
            </div>

            <button type="submit" className={styles.submitButton} disabled={setupForm.formState.isSubmitting}>
              {setupForm.formState.isSubmitting ? 'Setting up…' : 'Set password & continue'}
            </button>
          </form>
        )}

        {/* ── Authenticated first-login form ── */}
        {!isSetupMode && (
          <form className={styles.form} onSubmit={authForm.handleSubmit(onAuthSubmit)} noValidate>
            <div className={styles.fieldGroup}>
              <label htmlFor="password" className={styles.label}>New password</label>
              <div className={styles.inputWrap}>
                <input
                  id="password"
                  type={showPw ? 'text' : 'password'}
                  autoComplete="new-password"
                  className={`${styles.input} ${authForm.formState.errors.password ? styles.inputError : ''}`}
                  {...pwRegisterProps}
                />
                <button type="button" className={styles.toggleBtn} onClick={() => setShowPw((v) => !v)} aria-label={showPw ? 'Hide password' : 'Show password'}>
                  {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {pwValue && (
                <div className={styles.strengthBar}>
                  <div className={styles.strengthTrack}>
                    <div className={`${styles.strengthFill} ${STRENGTH_FILL_CLASS[strength]}`} style={{ width: STRENGTH_WIDTHS[strength] }} />
                  </div>
                  <p className={styles.strengthLabel}>Password strength: <strong>{strengthLabel}</strong></p>
                </div>
              )}
              {authForm.formState.errors.password && (
                <p className={styles.fieldError}>{authForm.formState.errors.password.message}</p>
              )}
            </div>

            <div className={styles.fieldGroup}>
              <label htmlFor="confirmPassword" className={styles.label}>Confirm password</label>
              <div className={styles.inputWrap}>
                <input
                  id="confirmPassword"
                  type={showConfirm ? 'text' : 'password'}
                  autoComplete="new-password"
                  className={`${styles.input} ${authForm.formState.errors.confirmPassword ? styles.inputError : ''}`}
                  {...authForm.register('confirmPassword')}
                />
                <button type="button" className={styles.toggleBtn} onClick={() => setShowConfirm((v) => !v)} aria-label={showConfirm ? 'Hide' : 'Show'}>
                  {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {authForm.formState.errors.confirmPassword && (
                <p className={styles.fieldError}>{authForm.formState.errors.confirmPassword.message}</p>
              )}
            </div>

            <button type="submit" className={styles.submitButton} disabled={authForm.formState.isSubmitting}>
              {authForm.formState.isSubmitting ? 'Saving…' : 'Set password & continue'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
