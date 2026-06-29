import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useNavigate } from 'react-router-dom';
import { Eye, EyeOff } from 'lucide-react';
import logo from '../../../assets/logo.png';
import { useAuthStore } from '../../../store/authStore';
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

export function ForceResetPage() {
  const navigate = useNavigate();
  const markOnboarded = useAuthStore((s) => s.markOnboarded);
  const [showPw, setShowPw] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [pwValue, setPwValue] = useState('');

  const { strength, label: strengthLabel } = usePasswordStrength(pwValue);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ResetPasswordFormValues>({
    resolver: zodResolver(resetPasswordSchema),
  });

  const onSubmit = async (_values: ResetPasswordFormValues) => {
    await new Promise((r) => setTimeout(r, 500));
    markOnboarded();
    navigate('/dashboard');
  };

  const pwProps = register('password', {
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
          This is your first login. Create a secure password to continue.
        </p>

        <form className={styles.form} onSubmit={handleSubmit(onSubmit)} noValidate>
          {/* New password */}
          <div className={styles.fieldGroup}>
            <label htmlFor="password" className={styles.label}>New password</label>
            <div className={styles.inputWrap}>
              <input
                id="password"
                type={showPw ? 'text' : 'password'}
                autoComplete="new-password"
                className={`${styles.input} ${errors.password ? styles.inputError : ''}`}
                {...pwProps}
              />
              <button
                type="button"
                className={styles.toggleBtn}
                onClick={() => setShowPw((v) => !v)}
                aria-label={showPw ? 'Hide password' : 'Show password'}
              >
                {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            {pwValue && (
              <div className={styles.strengthBar}>
                <div className={styles.strengthTrack}>
                  <div
                    className={`${styles.strengthFill} ${STRENGTH_FILL_CLASS[strength]}`}
                    style={{ width: STRENGTH_WIDTHS[strength] }}
                  />
                </div>
                <p className={styles.strengthLabel}>
                  Password strength: <strong>{strengthLabel}</strong>
                </p>
              </div>
            )}
            {errors.password && (
              <p className={styles.fieldError}>{errors.password.message}</p>
            )}
          </div>

          {/* Confirm password */}
          <div className={styles.fieldGroup}>
            <label htmlFor="confirmPassword" className={styles.label}>Confirm password</label>
            <div className={styles.inputWrap}>
              <input
                id="confirmPassword"
                type={showConfirm ? 'text' : 'password'}
                autoComplete="new-password"
                className={`${styles.input} ${errors.confirmPassword ? styles.inputError : ''}`}
                {...register('confirmPassword')}
              />
              <button
                type="button"
                className={styles.toggleBtn}
                onClick={() => setShowConfirm((v) => !v)}
                aria-label={showConfirm ? 'Hide password' : 'Show password'}
              >
                {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            {errors.confirmPassword && (
              <p className={styles.fieldError}>{errors.confirmPassword.message}</p>
            )}
          </div>

          <button type="submit" className={styles.submitButton} disabled={isSubmitting}>
            {isSubmitting ? 'Saving…' : 'Set password & continue'}
          </button>
        </form>
      </div>
    </div>
  );
}
