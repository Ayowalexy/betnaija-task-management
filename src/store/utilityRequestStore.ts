import { create } from 'zustand';
import type { UtilityRequestFilters } from '../types/index.js';

const DEFAULT_FILTERS: UtilityRequestFilters = {
  departmentIds: [],
  utilityIds: [],
  statuses: [],
  dateFrom: null,
  dateTo: null,
  search: '',
};

interface UtilityRequestStore {
  filters: UtilityRequestFilters;
  selectedRequestId: string | null;
  setFilters: (filters: Partial<UtilityRequestFilters>) => void;
  resetFilters: () => void;
  selectRequest: (id: string | null) => void;
}

export const useUtilityRequestStore = create<UtilityRequestStore>((set) => ({
  filters: { ...DEFAULT_FILTERS },
  selectedRequestId: null,

  setFilters: (filters: Partial<UtilityRequestFilters>) => {
    set((state) => ({ filters: { ...state.filters, ...filters } }));
  },

  resetFilters: () => {
    set({ filters: { ...DEFAULT_FILTERS } });
  },

  selectRequest: (id: string | null) => {
    set({ selectedRequestId: id });
  },
}));
