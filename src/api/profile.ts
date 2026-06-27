import { apiGet, apiPatch } from '../lib/apiClient';
import type { User } from '../types/index';

export interface UpdateProfilePayload {
  name?: string;
  avatarColor?: string;
  phoneNumber?: string | null;
  notificationPrefs?: {
    email?: boolean;
    teams?: boolean;
    whatsapp?: boolean;
    sms?: boolean;
  };
}

export const profileApi = {
  get: async (): Promise<User> => {
    return apiGet<User>('/profile');
  },

  update: async (payload: UpdateProfilePayload): Promise<User> => {
    return apiPatch<User>('/profile', payload);
  },

  changePassword: async (currentPassword: string, newPassword: string): Promise<{ message: string }> => {
    return apiPatch<{ message: string }>('/profile/password', { currentPassword, newPassword });
  },
};
