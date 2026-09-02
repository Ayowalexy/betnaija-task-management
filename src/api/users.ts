import { apiGet, apiPost, apiPatch, apiDelete } from '../lib/apiClient';
import type { User, UserRole } from '../types/index';
import type { PaginatedResponse } from './tickets';

export interface CreateUserPayload {
  name: string;
  email: string;
  role: UserRole;
  departmentId?: string | null;
  temporaryPassword: string;
  notificationPrefs?: {
    email?: boolean;
    teams?: boolean;
    whatsapp?: boolean;
    sms?: boolean;
  };
}

export interface UpdateUserPayload {
  name?: string;
  email?: string;
  role?: UserRole;
  departmentId?: string | null;
  status?: 'active' | 'suspended';
  avatarColor?: string;
  phoneNumber?: string | null;
  notificationPrefs?: {
    email?: boolean;
    teams?: boolean;
    whatsapp?: boolean;
    sms?: boolean;
  };
}

export interface DirectoryUser {
  id: string;
  name: string;
  email: string;
  avatarInitials: string;
  avatarColor: string;
  isOnline: boolean;
}

export const usersApi = {
  /** Minimal, cross-department user list — for chat, where department-scoped list() would hide anyone outside your own department. */
  listDirectory: async (): Promise<DirectoryUser[]> => {
    return apiGet<DirectoryUser[]>('/users/directory');
  },

  list: async (params?: {
    search?: string;
    departmentId?: string;
    role?: string;
    status?: string;
    page?: number;
    limit?: number;
  }): Promise<PaginatedResponse<User>> => {
    return apiGet<PaginatedResponse<User>>('/users', { params });
  },

  get: async (id: string): Promise<User> => {
    return apiGet<User>(`/users/${id}`);
  },

  create: async (payload: CreateUserPayload): Promise<User> => {
    return apiPost<User>('/users', payload);
  },

  update: async (id: string, payload: UpdateUserPayload): Promise<User> => {
    return apiPatch<User>(`/users/${id}`, payload);
  },

  remove: async (id: string): Promise<void> => {
    await apiDelete(`/users/${id}`);
  },

  resetPassword: async (id: string, temporaryPassword: string): Promise<{ message: string }> => {
    return apiPatch<{ message: string }>(`/users/${id}/reset-password`, { temporaryPassword });
  },
};
