import { apiClient, apiGet, apiPatch, apiPost, unwrap } from '../lib/apiClient';

export type SmtpProvider = 'office365' | 'gmail' | 'custom';
export type SmtpEncryption = 'tls' | 'ssl' | 'none';

export interface SmtpConfig {
  provider: SmtpProvider | null;
  host: string | null;
  port: number | null;
  encryption: SmtpEncryption | null;
  username: string | null;
  password: string | null;
  senderName: string | null;
  senderEmail: string | null;
}

export interface OrgSettings {
  orgName: string;
  orgLogoUrl: string | null;
  paystackPublicKey: string | null;
  paystackSecretKey: string | null;
  notifChannels: {
    email: boolean;
    teams: boolean;
    sms: boolean;
    whatsapp: boolean;
  };
  smtp: SmtpConfig;
}

export interface UpdateSettingsPayload {
  orgName?: string;
  paystackPublicKey?: string;
  paystackSecretKey?: string;
  notifChannels?: Partial<OrgSettings['notifChannels']>;
  smtp?: Partial<SmtpConfig>;
}

export const settingsApi = {
  get: async (): Promise<OrgSettings> => {
    return apiGet<OrgSettings>('/settings');
  },

  update: async (payload: UpdateSettingsPayload): Promise<OrgSettings> => {
    return apiPatch<OrgSettings>('/settings', payload);
  },

  uploadLogo: async (file: File): Promise<{ logoUrl: string }> => {
    const form = new FormData();
    form.append('file', file);
    const res = await apiClient.post('/settings/logo', form, { headers: { 'Content-Type': undefined } });
    return unwrap<{ logoUrl: string }>(res.data);
  },

  testSmtp: async (to: string, smtp?: Partial<SmtpConfig>): Promise<{ message: string }> => {
    return apiPost<{ message: string }>('/settings/smtp/test', { to, smtp });
  },
};
