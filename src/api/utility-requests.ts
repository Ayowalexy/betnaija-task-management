import { apiClient, apiGet, apiPost, apiPatch, apiDelete, unwrap } from '../lib/apiClient';
import type { UtilityRequest, UtilityRequestComment } from '../types/index';
import type { PaginatedResponse } from './tickets';

export interface CreateUtilityRequestPayload {
  utilityId: string;
  utilityOptionId: string;
  departmentId: string;
  date: string;
  startTime: string;
  endTime: string;
  details: string;
}

export type UpdateUtilityRequestPayload = Partial<Omit<CreateUtilityRequestPayload, 'utilityId' | 'departmentId'>>;

export interface CreateUtilityRequestCommentPayload {
  content: string;
  files?: File[];
}

export const utilityRequestsApi = {
  list: async (params?: {
    departmentIds?: string[];
    utilityIds?: string[];
    statuses?: string[];
    dateFrom?: string | null;
    dateTo?: string | null;
    search?: string;
    page?: number;
    limit?: number;
  }): Promise<PaginatedResponse<UtilityRequest>> => {
    const query: Record<string, unknown> = { page: params?.page ?? 1, limit: params?.limit ?? 15 };
    if (params?.departmentIds?.length) query.departmentIds = params.departmentIds.join(',');
    if (params?.utilityIds?.length) query.utilityIds = params.utilityIds.join(',');
    if (params?.statuses?.length) query.statuses = params.statuses.join(',');
    if (params?.dateFrom) query.dateFrom = params.dateFrom;
    if (params?.dateTo) query.dateTo = params.dateTo;
    if (params?.search) query.search = params.search;
    return apiGet<PaginatedResponse<UtilityRequest>>('/utility-requests', { params: query });
  },

  get: async (id: string): Promise<UtilityRequest> => {
    return apiGet<UtilityRequest>(`/utility-requests/${id}`);
  },

  create: async (payload: CreateUtilityRequestPayload): Promise<UtilityRequest> => {
    return apiPost<UtilityRequest>('/utility-requests', payload);
  },

  update: async (id: string, payload: UpdateUtilityRequestPayload): Promise<UtilityRequest> => {
    return apiPatch<UtilityRequest>(`/utility-requests/${id}`, payload);
  },

  approve: async (id: string): Promise<UtilityRequest> => {
    return apiPatch<UtilityRequest>(`/utility-requests/${id}/approve`);
  },

  reject: async (id: string, reason: string): Promise<UtilityRequest> => {
    return apiPatch<UtilityRequest>(`/utility-requests/${id}/reject`, { reason });
  },

  complete: async (id: string): Promise<UtilityRequest> => {
    return apiPatch<UtilityRequest>(`/utility-requests/${id}/complete`);
  },

  cancel: async (id: string): Promise<UtilityRequest> => {
    return apiPatch<UtilityRequest>(`/utility-requests/${id}/cancel`);
  },

  addComment: async (requestId: string, payload: CreateUtilityRequestCommentPayload): Promise<UtilityRequestComment> => {
    const form = new FormData();
    form.append('content', payload.content);
    (payload.files ?? []).forEach((f) => form.append('files[]', f));
    const res = await apiClient.post(`/utility-requests/${requestId}/comments`, form, {
      headers: { 'Content-Type': undefined },
    });
    return unwrap<UtilityRequestComment>(res.data);
  },

  updateComment: async (requestId: string, commentId: string, content: string): Promise<UtilityRequestComment> => {
    return apiPatch<UtilityRequestComment>(`/utility-requests/${requestId}/comments/${commentId}`, { content });
  },

  deleteComment: async (requestId: string, commentId: string): Promise<void> => {
    await apiDelete(`/utility-requests/${requestId}/comments/${commentId}`);
  },

  toggleReaction: async (requestId: string, commentId: string, emoji: string) => {
    return apiPost(`/utility-requests/${requestId}/comments/${commentId}/reactions`, { emoji });
  },

  // The comment thread itself now lives in Stream Chat (real-time delivery, reactions,
  // attachments) — these two remain the only backend touchpoints for it: getting/creating
  // access to the request's chat channel, and recording activity-log entries for it.
  getChatAccess: async (requestId: string): Promise<{ channelId: string }> => {
    return apiGet<{ channelId: string }>(`/utility-requests/${requestId}/chat-access`);
  },

  logChatEvent: async (
    requestId: string,
    action: 'commented' | 'comment_edited' | 'comment_deleted',
    note?: string,
  ): Promise<void> => {
    await apiPost(`/utility-requests/${requestId}/chat-log`, { action, note });
  },
};
