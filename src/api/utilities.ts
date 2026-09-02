import { apiGet, apiPost, apiPatch, apiDelete } from '../lib/apiClient';
import type { CalendarProvider, CalendarSyncMode, Utility, UtilityOption, UtilityStatus } from '../types/index';

export interface CreateUtilityPayload {
  name: string;
  description?: string;
  status?: UtilityStatus;
  options: { name: string }[];
  calendarEnabled: boolean;
  calendarProvider?: CalendarProvider;
  calendarAddress?: string;
  calendarSyncMode?: CalendarSyncMode;
  departmentIds?: string[];
}

export type UpdateUtilityPayload = Partial<Omit<CreateUtilityPayload, 'options'>>;

export interface UpdateOptionAvailabilityPayload {
  isAvailable: boolean;
  unavailableUntil?: string;
  reason?: string;
}

export const utilitiesApi = {
  list: async (params?: { status?: UtilityStatus; search?: string; departmentId?: string }): Promise<{ data: Utility[]; total: number }> => {
    return apiGet<{ data: Utility[]; total: number }>('/utilities', { params });
  },

  get: async (id: string): Promise<Utility> => {
    return apiGet<Utility>(`/utilities/${id}`);
  },

  create: async (payload: CreateUtilityPayload): Promise<Utility> => {
    return apiPost<Utility>('/utilities', payload);
  },

  update: async (id: string, payload: UpdateUtilityPayload): Promise<Utility> => {
    return apiPatch<Utility>(`/utilities/${id}`, payload);
  },

  remove: async (id: string): Promise<void> => {
    await apiDelete(`/utilities/${id}`);
  },

  addOption: async (utilityId: string, name: string): Promise<UtilityOption> => {
    return apiPost<UtilityOption>(`/utilities/${utilityId}/options`, { name });
  },

  removeOption: async (utilityId: string, optionId: string): Promise<void> => {
    await apiDelete(`/utilities/${utilityId}/options/${optionId}`);
  },

  updateOptionAvailability: async (
    utilityId: string,
    optionId: string,
    payload: UpdateOptionAvailabilityPayload,
  ): Promise<UtilityOption> => {
    return apiPatch<UtilityOption>(`/utilities/${utilityId}/options/${optionId}/availability`, payload);
  },
};
