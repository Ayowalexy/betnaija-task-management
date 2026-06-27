import { apiGet, apiPost, apiPatch, apiDelete } from '../lib/apiClient';
import type { Shift } from '../types/index';

export interface CreateShiftPayload {
  userId: string;
  departmentId: string;
  date: string;
  startTime: string;
  endTime: string;
}

export const rosterApi = {
  list: async (params?: { departmentId?: string; month?: string; userId?: string }): Promise<Shift[]> => {
    return apiGet<Shift[]>('/roster', { params });
  },

  create: async (payload: CreateShiftPayload): Promise<Shift> => {
    return apiPost<Shift>('/roster', payload);
  },

  update: async (id: string, payload: Partial<CreateShiftPayload>): Promise<Shift> => {
    return apiPatch<Shift>(`/roster/${id}`, payload);
  },

  remove: async (id: string): Promise<void> => {
    await apiDelete(`/roster/${id}`);
  },
};
