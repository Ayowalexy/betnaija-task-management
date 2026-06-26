import { create } from 'zustand';
import type { Toast } from '../types/index.js';

interface UIStore {
  sidebarCollapsed: boolean;
  sidebarMobileOpen: boolean;
  toasts: Toast[];
  setSidebarCollapsed: (v: boolean) => void;
  toggleSidebar: () => void;
  setSidebarMobileOpen: (v: boolean) => void;
  addToast: (toast: Omit<Toast, 'id'>) => void;
  removeToast: (id: string) => void;
}

function readSidebarCollapsed(): boolean {
  try {
    const stored = localStorage.getItem('flowdesk:sidebar-collapsed');
    return stored === 'true';
  } catch {
    return false;
  }
}

export const useUIStore = create<UIStore>((set) => ({
  sidebarCollapsed: readSidebarCollapsed(),
  sidebarMobileOpen: false,
  toasts: [],

  setSidebarCollapsed: (v: boolean) => {
    try {
      localStorage.setItem('flowdesk:sidebar-collapsed', String(v));
    } catch {
      // ignore storage errors
    }
    set({ sidebarCollapsed: v });
  },

  toggleSidebar: () => {
    set((state) => {
      const next = !state.sidebarCollapsed;
      try {
        localStorage.setItem('flowdesk:sidebar-collapsed', String(next));
      } catch {
        // ignore storage errors
      }
      return { sidebarCollapsed: next };
    });
  },

  setSidebarMobileOpen: (v: boolean) => {
    set({ sidebarMobileOpen: v });
  },

  addToast: (toast: Omit<Toast, 'id'>) => {
    const id = crypto.randomUUID();
    set((state) => ({
      toasts: [...state.toasts, { ...toast, id }],
    }));
  },

  removeToast: (id: string) => {
    set((state) => ({
      toasts: state.toasts.filter((t) => t.id !== id),
    }));
  },
}));
