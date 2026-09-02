import { apiGet, apiPost, apiPatch, apiDelete } from '../lib/apiClient';
import type { Department, RequestType, TicketPriority } from '../types/index';
import type { PaginatedResponse } from './tickets';

export interface CreateRequestTypePayload {
  name: string;
  description: string;
  priority: TicketPriority;
  sla: { responseTimeMs: number; resolutionTimeMs: number };
}

export interface CreateDepartmentPayload {
  name: string;
  slug: string;
  description?: string;
  headId?: string;
  routing: 'roster_based' | 'all_notify';
  sla: { responseTimeMs: number; resolutionTimeMs: number };
  teamsWebhook?: string;
  requestTypes?: CreateRequestTypePayload[]; // create only — use the request-type endpoints below to edit after creation
  utilityIds?: string[];
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

  update: async (id: string, payload: Partial<Omit<CreateDepartmentPayload, 'requestTypes'>>): Promise<Department> => {
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

  createRequestType: async (departmentId: string, payload: CreateRequestTypePayload): Promise<RequestType> => {
    return apiPost<RequestType>(`/departments/${departmentId}/request-types`, payload);
  },

  updateRequestType: async (departmentId: string, requestTypeId: string, payload: Partial<CreateRequestTypePayload>): Promise<RequestType> => {
    return apiPatch<RequestType>(`/departments/${departmentId}/request-types/${requestTypeId}`, payload);
  },

  removeRequestType: async (departmentId: string, requestTypeId: string): Promise<void> => {
    await apiDelete(`/departments/${departmentId}/request-types/${requestTypeId}`);
  },
};
