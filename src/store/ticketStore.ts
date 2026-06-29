import { create } from 'zustand';
import type { Ticket, Comment, TicketFilters, TransferEntry } from '../types/index.js';
import { TICKETS } from '../mocks/tickets.js';

const DEFAULT_FILTERS: TicketFilters = {
  departmentIds: [],
  statuses: [],
  priorities: [],
  assigneeId: null,
  dateFrom: null,
  dateTo: null,
  slaBreachedFrom: null,
  slaBreachedTo: null,
  search: '',
};

interface TicketStore {
  tickets: Ticket[];
  filters: TicketFilters;
  selectedTicketId: string | null;
  setFilters: (filters: Partial<TicketFilters>) => void;
  resetFilters: () => void;
  updateTicket: (id: string, updates: Partial<Ticket>) => void;
  addTicket: (ticket: Ticket) => void;
  addComment: (ticketId: string, comment: Comment) => void;
  transferTicket: (ticketId: string, toDeptId: string, note: string, byUserId: string) => void;
  selectTicket: (id: string | null) => void;
}

export const useTicketStore = create<TicketStore>((set) => ({
  tickets: TICKETS,
  filters: { ...DEFAULT_FILTERS },
  selectedTicketId: null,

  setFilters: (filters: Partial<TicketFilters>) => {
    set((state) => ({
      filters: { ...state.filters, ...filters },
    }));
  },

  resetFilters: () => {
    set({ filters: { ...DEFAULT_FILTERS } });
  },

  updateTicket: (id: string, updates: Partial<Ticket>) => {
    set((state) => ({
      tickets: state.tickets.map((t) =>
        t.id === id
          ? { ...t, ...updates, updatedAt: new Date().toISOString() }
          : t
      ),
    }));
  },

  addTicket: (ticket: Ticket) => {
    set((state) => ({ tickets: [ticket, ...state.tickets] }));
  },

  addComment: (ticketId: string, comment: Comment) => {
    set((state) => ({
      tickets: state.tickets.map((t) =>
        t.id === ticketId
          ? {
              ...t,
              comments: [...t.comments, comment],
              updatedAt: new Date().toISOString(),
            }
          : t
      ),
    }));
  },

  transferTicket: (ticketId: string, toDeptId: string, note: string, byUserId: string) => {
    const now = new Date().toISOString();

    set((state) => {
      const ticket = state.tickets.find((t) => t.id === ticketId);
      if (!ticket) return state;

      const fromDeptId = ticket.departmentId;

      const transferEntry: TransferEntry = {
        id: `tr-${ticketId}-${Date.now()}`,
        fromDeptId,
        toDeptId,
        byUserId,
        note,
        timestamp: now,
      };

      const activityComment: Comment = {
        id: `c-transfer-${ticketId}-${Date.now()}`,
        ticketId,
        authorId: byUserId,
        content: '',
        createdAt: now,
        updatedAt: null,
        isEdited: false,
        replyToId: null,
        reactions: [],
        attachments: [],
        isActivityEntry: true,
        activityText: `Ticket transferred from department ${fromDeptId} to ${toDeptId}`,
      };

      return {
        tickets: state.tickets.map((t) =>
          t.id === ticketId
            ? {
                ...t,
                status: 'transferred' as const,
                departmentId: toDeptId,
                assigneeId: null,
                updatedAt: now,
                transferHistory: [...t.transferHistory, transferEntry],
                comments: [...t.comments, activityComment],
              }
            : t
        ),
      };
    });
  },

  selectTicket: (id: string | null) => {
    set({ selectedTicketId: id });
  },
}));
