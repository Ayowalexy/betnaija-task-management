import { create } from 'zustand';
import type { Utility, UtilityOption } from '../types/index.js';
import { UTILITIES } from '../mocks/utilities.js';

interface UtilityStore {
  utilities: Utility[];
  addUtility: (utility: Utility) => void;
  updateUtility: (id: string, updates: Partial<Utility>) => void;
  deleteUtility: (id: string) => void;
  addOption: (utilityId: string, option: UtilityOption) => void;
  removeOption: (utilityId: string, optionId: string) => void;
}

export const useUtilityStore = create<UtilityStore>((set) => ({
  utilities: UTILITIES,

  addUtility: (utility: Utility) => {
    set((state) => ({ utilities: [utility, ...state.utilities] }));
  },

  updateUtility: (id: string, updates: Partial<Utility>) => {
    set((state) => ({
      utilities: state.utilities.map((u) =>
        u.id === id ? { ...u, ...updates, updatedAt: new Date().toISOString() } : u
      ),
    }));
  },

  deleteUtility: (id: string) => {
    set((state) => ({ utilities: state.utilities.filter((u) => u.id !== id) }));
  },

  addOption: (utilityId: string, option: UtilityOption) => {
    set((state) => ({
      utilities: state.utilities.map((u) =>
        u.id === utilityId
          ? { ...u, options: [...u.options, option], updatedAt: new Date().toISOString() }
          : u
      ),
    }));
  },

  removeOption: (utilityId: string, optionId: string) => {
    set((state) => ({
      utilities: state.utilities.map((u) =>
        u.id === utilityId
          ? {
              ...u,
              options: u.options.filter((o) => o.id !== optionId),
              updatedAt: new Date().toISOString(),
            }
          : u
      ),
    }));
  },
}));
