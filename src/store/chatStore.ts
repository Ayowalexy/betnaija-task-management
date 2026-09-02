import { create } from 'zustand';

interface ChatStore {
  connected: boolean;
  totalUnread: number;
  setConnected: (connected: boolean) => void;
  setTotalUnread: (count: number) => void;
}

export const useChatStore = create<ChatStore>((set) => ({
  connected: false,
  totalUnread: 0,
  setConnected: (connected) => set({ connected }),
  setTotalUnread: (totalUnread) => set({ totalUnread }),
}));
