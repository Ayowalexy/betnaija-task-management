import { apiClient, apiDelete, unwrap } from '../lib/apiClient';
import type { Attachment } from '../types/index';

export const filesApi = {
  upload: async (
    file: File,
    context: 'ticket' | 'comment' | 'utility-request-comment' | 'logo' | 'chat',
    ids?: { ticketId?: string; commentId?: string; requestId?: string },
  ): Promise<Attachment> => {
    const form = new FormData();
    form.append('file', file);
    const params: Record<string, string> = { context };
    if (ids?.ticketId) params.ticketId = ids.ticketId;
    if (ids?.commentId) params.commentId = ids.commentId;
    if (ids?.requestId) params.requestId = ids.requestId;
    const res = await apiClient.post('/files/upload', form, {
      params,
      headers: { 'Content-Type': undefined },
    });
    return unwrap<Attachment>(res.data);
  },

  remove: async (id: string): Promise<void> => {
    await apiDelete(`/files/${id}`);
  },
};
