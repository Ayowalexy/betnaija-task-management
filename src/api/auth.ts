import { apiPost, apiGet, apiPatch, storeTokens, clearTokens, getRefreshToken } from '../lib/apiClient';
import type { User } from '../types/index';

export interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

export const authApi = {
  login: async (email: string, password: string): Promise<LoginResponse> => {
    const tokens = await apiPost<LoginResponse>('/auth/login', { email, password });
    storeTokens(tokens.accessToken, tokens.refreshToken, tokens.expiresIn);
    return tokens;
  },

  me: async (): Promise<User> => {
    return apiGet<User>('/auth/me');
  },

  logout: async (): Promise<void> => {
    const refreshToken = getRefreshToken();
    if (refreshToken) {
      await apiPost('/auth/logout', { refreshToken }).catch(() => {});
    }
    clearTokens();
  },

  setPassword: async (newPassword: string): Promise<void> => {
    await apiPatch('/auth/set-password', { newPassword });
  },

  firstLoginComplete: async (): Promise<void> => {
    await apiPatch('/auth/first-login-complete');
  },

  forgotPassword: async (email: string): Promise<{ message: string }> => {
    return apiPost<{ message: string }>('/auth/forgot-password', { email });
  },

  resetPassword: async (email: string, otp: string, newPassword: string): Promise<{ message: string }> => {
    return apiPost<{ message: string }>('/auth/reset-password', { email, otp, newPassword });
  },
};
