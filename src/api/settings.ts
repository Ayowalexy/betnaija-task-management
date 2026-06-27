import { apiClient, apiGet, apiPatch, unwrap } from '../lib/apiClient';

export interface OrgSettings {
  id: string;
  orgName: string;
  logoUrl: string | null;
  defaultSlaResponseMs: number;
  defaultSlaResolutionMs: number;
  notifyOnEscalate: boolean;
  notifyOnBreach: boolean;
}

export interface UpdateSettingsPayload {
  orgName?: string;
  defaultSlaResponseMs?: number;
  defaultSlaResolutionMs?: number;
  notifyOnEscalate?: boolean;
  notifyOnBreach?: boolean;
}

export const settingsApi = {
  get: async (): Promise<OrgSettings> => {
    return apiGet<OrgSettings>('/settings');
  },

  update: async (payload: UpdateSettingsPayload): Promise<OrgSettings> => {
    return apiPatch<OrgSettings>('/settings', payload);
  },

  uploadLogo: async (file: File): Promise<OrgSettings> => {
    const form = new FormData();
    form.append('file', file);
    const res = await apiClient.post('/settings/logo', form, { headers: { 'Content-Type': undefined } });
    return unwrap<OrgSettings>(res.data);
  },
};
