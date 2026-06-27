import { create } from 'zustand';
import type { TicketFilters } from '../types/index.js';

const DEFAULT_FILTERS: TicketFilters = {
  departmentIds: [],
  statuses: [],
  priorities: [],
  assigneeId: null,
  dateFrom: null,
  dateTo: null,
  search: '',
};

interface TicketStore {
  filters: TicketFilters;
  selectedTicketId: string | null;
  setFilters: (filters: Partial<TicketFilters>) => void;
  resetFilters: () => void;
  selectTicket: (id: string | null) => void;
}

export const useTicketStore = create<TicketStore>((set) => ({
  filters: { ...DEFAULT_FILTERS },
  selectedTicketId: null,
  setFilters: (filters) => set((s) => ({ filters: { ...s.filters, ...filters } })),
  resetFilters: () => set({ filters: { ...DEFAULT_FILTERS } }),
  selectTicket: (id) => set({ selectedTicketId: id }),
}));
