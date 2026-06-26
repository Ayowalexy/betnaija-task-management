import type { PasswordStrength } from '../types';

export function usePasswordStrength(password: string): {
  strength: PasswordStrength;
  score: number;
  label: string;
} {
  let score = 0;
  if (password.length >= 8) score++;
  if (password.length >= 12) score++;
  if (/[A-Z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;

  let strength: PasswordStrength;
  let label: string;

  if (score <= 1) {
    strength = 'weak';
    label = 'Weak';
  } else if (score === 2) {
    strength = 'fair';
    label = 'Fair';
  } else if (score === 3) {
    strength = 'strong';
    label = 'Strong';
  } else {
    strength = 'very_strong';
    label = 'Very strong';
  }

  return { strength, score, label };
}
