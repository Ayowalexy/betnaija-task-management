import { apiClient, apiDelete, unwrap } from '../lib/apiClient';
import type { Attachment } from '../types/index';

export const filesApi = {
  upload: async (file: File, context: 'ticket' | 'comment' | 'settings', referenceId?: string): Promise<Attachment> => {
    const form = new FormData();
    form.append('file', file);
    const params: Record<string, string> = { context };
    if (referenceId) params.ticketId = referenceId;
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
