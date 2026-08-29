import { create } from 'zustand';
import type { UtilityRequest, UtilityRequestComment, UtilityRequestFilters, UtilityRequestLogEntry } from '../types/index.js';
import { UTILITY_REQUESTS } from '../mocks/utilityRequests.js';

const DEFAULT_FILTERS: UtilityRequestFilters = {
  departmentIds: [],
  utilityIds: [],
  statuses: [],
  dateFrom: null,
  dateTo: null,
  search: '',
};

interface UtilityRequestStore {
  requests: UtilityRequest[];
  filters: UtilityRequestFilters;
  selectedRequestId: string | null;
  setFilters: (filters: Partial<UtilityRequestFilters>) => void;
  resetFilters: () => void;
  addRequest: (request: UtilityRequest) => void;
  updateRequest: (id: string, updates: Partial<UtilityRequest>) => void;
  addComment: (requestId: string, comment: UtilityRequestComment) => void;
  addLogEntry: (requestId: string, entry: UtilityRequestLogEntry) => void;
  selectRequest: (id: string | null) => void;
}

export const useUtilityRequestStore = create<UtilityRequestStore>((set) => ({
  requests: UTILITY_REQUESTS,
  filters: { ...DEFAULT_FILTERS },
  selectedRequestId: null,

  setFilters: (filters: Partial<UtilityRequestFilters>) => {
    set((state) => ({ filters: { ...state.filters, ...filters } }));
  },

  resetFilters: () => {
    set({ filters: { ...DEFAULT_FILTERS } });
  },

  addRequest: (request: UtilityRequest) => {
    set((state) => ({ requests: [request, ...state.requests] }));
  },

  updateRequest: (id: string, updates: Partial<UtilityRequest>) => {
    set((state) => ({
      requests: state.requests.map((r) =>
        r.id === id ? { ...r, ...updates, updatedAt: new Date().toISOString() } : r
      ),
    }));
  },

  addComment: (requestId: string, comment: UtilityRequestComment) => {
    set((state) => ({
      requests: state.requests.map((r) =>
        r.id === requestId
          ? { ...r, comments: [...r.comments, comment], updatedAt: new Date().toISOString() }
          : r
      ),
    }));
  },

  addLogEntry: (requestId: string, entry: UtilityRequestLogEntry) => {
    set((state) => ({
      requests: state.requests.map((r) =>
        r.id === requestId ? { ...r, log: [...r.log, entry] } : r
      ),
    }));
  },

  selectRequest: (id: string | null) => {
    set({ selectedRequestId: id });
  },
}));
