export interface LoginFormValues {
  email: string;
  password: string;
}

export interface ResetPasswordFormValues {
  password: string;
  confirmPassword: string;
}

export type PasswordStrength = 'weak' | 'fair' | 'strong' | 'very_strong';
