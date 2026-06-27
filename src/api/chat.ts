import { apiGet, apiPost } from '../lib/apiClient';

export interface ChatToken {
  token: string;
  apiKey: string;
}

export interface CreateChannelPayload {
  type: 'dm' | 'group';
  memberIds: string[];
  name?: string;
}

export interface Channel {
  id: string;
  type: string;
  name: string | null;
  memberIds: string[];
  createdAt: string;
}

export const chatApi = {
  getToken: async (): Promise<ChatToken> => {
    return apiGet<ChatToken>('/chat/token');
  },

  provisionUser: async (): Promise<void> => {
    await apiPost('/chat/provision-user');
  },

  createChannel: async (payload: CreateChannelPayload): Promise<Channel> => {
    return apiPost<Channel>('/chat/channels', payload);
  },
};
