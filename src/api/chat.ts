import { apiGet } from '../lib/apiClient';

export interface ChatToken {
  token: string;
  userId: string;
  apiKey: string;
}

// The token endpoint is the only chat call proxied through the backend — it's the only
// operation that needs the Stream app secret. Everything else (provisioning the user,
// querying/creating channels, sending messages, presence, read receipts) happens directly
// between the frontend (see src/lib/streamChat.ts) and Stream once it holds this token.
export const chatApi = {
  getToken: async (): Promise<ChatToken> => {
    return apiGet<ChatToken>('/chat/token');
  },
};
