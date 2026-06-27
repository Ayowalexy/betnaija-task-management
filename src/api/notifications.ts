import { apiGet, apiPatch, apiDelete, getAccessToken } from '../lib/apiClient';
import type { Notification } from '../types/index';
import type { PaginatedResponse } from './tickets';

const BASE_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3000/api/v1';

export const notificationsApi = {
  list: async (params?: {
    type?: string;
    isRead?: boolean;
    page?: number;
    limit?: number;
  }): Promise<PaginatedResponse<Notification> & { unreadCount: number }> => {
    return apiGet<PaginatedResponse<Notification> & { unreadCount: number }>('/notifications', { params });
  },

  markRead: async (id: string): Promise<void> => {
    await apiPatch(`/notifications/${id}/read`);
  },

  markAllRead: async (): Promise<void> => {
    await apiPatch('/notifications/read-all');
  },

  remove: async (id: string): Promise<void> => {
    await apiDelete(`/notifications/${id}`);
  },

  createSSEConnection: (): EventSource => {
    const token = getAccessToken();
    const url = `${BASE_URL}/notifications/stream?access_token=${token}`;
    return new EventSource(url);
  },
};
