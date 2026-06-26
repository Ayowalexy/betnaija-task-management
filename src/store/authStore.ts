import { create } from 'zustand';
import type { User, Theme } from '../types/index.js';

interface AuthStore {
  currentUser: User | null;
  isAuthenticated: boolean;
  isFirstLogin: boolean;
  theme: Theme;
  login: (user: User) => void;
  logout: () => void;
  setTheme: (theme: Theme) => void;
  markOnboarded: () => void;
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
    if (stored === 'dark' || stored === 'light') {
      return stored;
    }
    if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
      return 'dark';
    }
  } catch {
    // localStorage may be unavailable in some environments
  }
  return 'light';
}

const initialTheme = readThemeFromStorage();
applyThemeToDOM(initialTheme);

export const useAuthStore = create<AuthStore>((set) => ({
  currentUser: null,
  isAuthenticated: false,
  isFirstLogin: false,
  theme: initialTheme,

  login: (user: User) => {
    set({
      currentUser: user,
      isAuthenticated: true,
      isFirstLogin: user.isFirstLogin,
    });
  },

  logout: () => {
    set({
      currentUser: null,
      isAuthenticated: false,
      isFirstLogin: false,
    });
  },

  setTheme: (theme: Theme) => {
    applyThemeToDOM(theme);
    try {
      localStorage.setItem('flowdesk:theme', theme);
    } catch {
      // ignore storage errors
    }
    set({ theme });
  },

  markOnboarded: () => {
    set((state) => ({
      currentUser: state.currentUser
        ? { ...state.currentUser, isFirstLogin: false }
        : null,
      isFirstLogin: false,
    }));
  },
}));
