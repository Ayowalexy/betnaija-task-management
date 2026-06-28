import { apiClient, apiGet, apiPost, apiPatch, apiDelete, unwrap } from '../lib/apiClient';
import type { Ticket, TicketFilters } from '../types/index';

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
}

export interface CreateTicketPayload {
  title: string;
  description: string;
  priority: string;
  departmentId: string;
  tags?: string[];
  files?: File[];
}

export interface CreateCommentPayload {
  content: string;
  replyToId?: string | null;
  files?: File[];
}

export const ticketsApi = {
  list: async (
    filters: Partial<TicketFilters> & { page?: number; limit?: number },
  ): Promise<PaginatedResponse<Ticket>> => {
    const params: Record<string, unknown> = { page: filters.page ?? 1, limit: filters.limit ?? 25 };
    if (filters.search) params.search = filters.search;
    if (filters.statuses?.length) params.status = filters.statuses.join(',');
    if (filters.priorities?.length) params.priority = filters.priorities.join(',');
    if (filters.departmentIds?.length) params.departmentIds = filters.departmentIds.join(',');
    if (filters.assigneeId) params.assigneeId = filters.assigneeId;
    if (filters.dateFrom) params.dateFrom = filters.dateFrom;
    if (filters.dateTo) params.dateTo = filters.dateTo;
    return apiGet<PaginatedResponse<Ticket>>('/tickets', { params });
  },

  get: async (id: string): Promise<Ticket> => {
    return apiGet<Ticket>(`/tickets/${id}`);
  },

  create: async (payload: CreateTicketPayload): Promise<Ticket> => {
    const form = new FormData();
    form.append('title', payload.title);
    form.append('description', payload.description);
    form.append('priority', payload.priority);
    form.append('departmentId', payload.departmentId);
    (payload.tags ?? []).forEach((tag, i) => form.append(`tags[${i}]`, tag));
    (payload.files ?? []).forEach((f) => form.append('files[]', f));
    const res = await apiClient.post('/tickets', form, { headers: { 'Content-Type': undefined } });
    return unwrap<Ticket>(res.data);
  },

  update: async (id: string, updates: { title?: string; description?: string; priority?: string; tags?: string[] }): Promise<Ticket> => {
    return apiPatch<Ticket>(`/tickets/${id}`, updates);
  },

  assign: async (id: string, assigneeId: string): Promise<Ticket> => {
    return apiPatch<Ticket>(`/tickets/${id}/assign`, { assigneeId });
  },

  transfer: async (id: string, toDepartmentId: string, note: string): Promise<Ticket> => {
    return apiPatch<Ticket>(`/tickets/${id}/transfer`, { toDepartmentId, note });
  },

  escalate: async (id: string, reason: string): Promise<Ticket> => {
    return apiPatch<Ticket>(`/tickets/${id}/escalate`, { reason });
  },

  resolve: async (id: string, resolution: string): Promise<Ticket> => {
    return apiPatch<Ticket>(`/tickets/${id}/resolve`, { resolution });
  },

  close: async (id: string): Promise<Ticket> => {
    return apiPatch<Ticket>(`/tickets/${id}/close`);
  },

  addComment: async (ticketId: string, payload: CreateCommentPayload) => {
    const form = new FormData();
    form.append('content', payload.content);
    if (payload.replyToId) form.append('replyToId', payload.replyToId);
    (payload.files ?? []).forEach((f) => form.append('files[]', f));
    const res = await apiClient.post(`/tickets/${ticketId}/comments`, form, {
      headers: { 'Content-Type': undefined },
    });
    return unwrap(res.data);
  },

  updateComment: async (ticketId: string, commentId: string, content: string) => {
    return apiPatch(`/tickets/${ticketId}/comments/${commentId}`, { content });
  },

  deleteComment: async (ticketId: string, commentId: string): Promise<void> => {
    await apiDelete(`/tickets/${ticketId}/comments/${commentId}`);
  },

  toggleReaction: async (ticketId: string, commentId: string, emoji: string) => {
    return apiPost(`/tickets/${ticketId}/comments/${commentId}/reactions`, { emoji });
  },
};
