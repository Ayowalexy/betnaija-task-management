import { create } from 'zustand';
import type { User, Theme } from '../types/index.js';
import { authApi } from '../api/auth.js';
import { clearTokens, getAccessToken } from '../lib/apiClient.js';

interface AuthStore {
  currentUser: User | null;
  isAuthenticated: boolean;
  isInitializing: boolean;
  theme: Theme;

  initialize: () => Promise<void>;
  loginWithCredentials: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  setCurrentUser: (user: User) => void;
  setTheme: (theme: Theme) => void;
}

function applyThemeToDOM(theme: Theme): void {
  if (theme === 'dark') {
    document.documentElement.classList.add('dark');
  } else {
    document.documentElement.classList.remove('dark');
  }
}

function readThemeFromStorage(): Theme {
  try {
    const stored = localStorage.getItem('flowdesk:theme');
    if (stored === 'dark' || stored === 'light') return stored;
    if (window.matchMedia('(prefers-color-scheme: dark)').matches) return 'dark';
  } catch {
    // localStorage unavailable
  }
  return 'light';
}

const initialTheme = readThemeFromStorage();
applyThemeToDOM(initialTheme);

export const useAuthStore = create<AuthStore>((set) => ({
  currentUser: null,
  isAuthenticated: false,
  isInitializing: true,
  theme: initialTheme,

  initialize: async () => {
    const token = getAccessToken();
    if (!token) {
      set({ isInitializing: false });
      return;
    }
    try {
      const user = await authApi.me();
      set({ currentUser: user, isAuthenticated: true, isInitializing: false });
    } catch {
      clearTokens();
      set({ isInitializing: false });
    }
  },

  loginWithCredentials: async (email: string, password: string): Promise<void> => {
    await authApi.login(email, password);
    const user = await authApi.me();
    set({ currentUser: user, isAuthenticated: true });
  },

  logout: async () => {
    await authApi.logout();
    set({ currentUser: null, isAuthenticated: false });
  },

  setCurrentUser: (user: User) => {
    set({ currentUser: user });
  },

  setTheme: (theme: Theme) => {
    applyThemeToDOM(theme);
    try {
      localStorage.setItem('flowdesk:theme', theme);
    } catch {
      // ignore
    }
    set({ theme });
  },
}));

// Handle session expiry emitted by the API client interceptor
if (typeof window !== 'undefined') {
  window.addEventListener('flowdesk:session-expired', () => {
    useAuthStore.setState({ currentUser: null, isAuthenticated: false });
  });
}
