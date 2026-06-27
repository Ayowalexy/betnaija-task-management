import { apiGet, apiPost, apiPatch, apiDelete } from '../lib/apiClient';
import type { Department } from '../types/index';
import type { PaginatedResponse } from './tickets';

export interface CreateDepartmentPayload {
  name: string;
  description?: string;
  headId?: string;
  routing: 'roster_based' | 'all_notify';
  slaResponseMs: number;
  slaResolutionMs: number;
  teamsWebhook?: string;
}

export const departmentsApi = {
  list: async (params?: { page?: number; limit?: number; search?: string }): Promise<PaginatedResponse<Department>> => {
    return apiGet<PaginatedResponse<Department>>('/departments', { params });
  },

  get: async (id: string): Promise<Department> => {
    return apiGet<Department>(`/departments/${id}`);
  },

  create: async (payload: CreateDepartmentPayload): Promise<Department> => {
    return apiPost<Department>('/departments', payload);
  },

  update: async (id: string, payload: Partial<CreateDepartmentPayload>): Promise<Department> => {
    return apiPatch<Department>(`/departments/${id}`, payload);
  },

  remove: async (id: string): Promise<void> => {
    await apiDelete(`/departments/${id}`);
  },

  addMember: async (departmentId: string, userId: string): Promise<void> => {
    await apiPost(`/departments/${departmentId}/members`, { userId });
  },

  removeMember: async (departmentId: string, userId: string): Promise<void> => {
    await apiDelete(`/departments/${departmentId}/members/${userId}`);
  },
};
