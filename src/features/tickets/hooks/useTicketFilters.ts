import { useMemo } from 'react';
import type { Ticket, TicketFilters } from '../../../types/index';
import { useTicketStore } from '../../../store/ticketStore';
import { useDebounce } from '../../../hooks/useDebounce';
import { getDeptById } from '../../../mocks/departments';

interface UseTicketFiltersReturn {
  filters: TicketFilters;
  setFilter: (updates: Partial<TicketFilters>) => void;
  resetFilters: () => void;
  filteredTickets: Ticket[];
}

export function useTicketFilters(tickets?: Ticket[]): UseTicketFiltersReturn {
  const storeTickets = useTicketStore((s) => s.tickets);
  const filters = useTicketStore((s) => s.filters);
  const setFilters = useTicketStore((s) => s.setFilters);
  const resetFilters = useTicketStore((s) => s.resetFilters);

  const source = tickets ?? storeTickets;
  const debouncedSearch = useDebounce(filters.search, 300);

  const filteredTickets = useMemo(() => {
    return source.filter((ticket) => {
      if (filters.departmentIds.length > 0 && !filters.departmentIds.includes(ticket.departmentId)) {
        return false;
      }
      if (filters.statuses.length > 0 && !filters.statuses.includes(ticket.status)) {
        return false;
      }
      if (filters.priorities.length > 0 && !filters.priorities.includes(ticket.priority)) {
        return false;
      }
      if (filters.assigneeId && ticket.assigneeId !== filters.assigneeId) {
        return false;
      }
      if (filters.dateFrom) {
        const from = new Date(filters.dateFrom).getTime();
        if (new Date(ticket.createdAt).getTime() < from) return false;
      }
      if (filters.dateTo) {
        const to = new Date(filters.dateTo).getTime() + 86400000;
        if (new Date(ticket.createdAt).getTime() > to) return false;
      }
      // SLA breach date filter: breach moment = createdAt + dept.sla.resolutionTimeMs
      if (filters.slaBreachedFrom || filters.slaBreachedTo) {
        const dept = getDeptById(ticket.departmentId);
        if (!dept) return false;
        const breachMs = new Date(ticket.createdAt).getTime() + dept.sla.resolutionTimeMs;
        if (filters.slaBreachedFrom) {
          if (breachMs < new Date(filters.slaBreachedFrom).getTime()) return false;
        }
        if (filters.slaBreachedTo) {
          if (breachMs > new Date(filters.slaBreachedTo).getTime() + 86400000) return false;
        }
      }
      if (debouncedSearch) {
        const q = debouncedSearch.toLowerCase();
        const matchesId = ticket.id.toLowerCase().includes(q);
        const matchesTitle = ticket.title.toLowerCase().includes(q);
        if (!matchesId && !matchesTitle) return false;
      }
      return true;
    });
  }, [source, filters, debouncedSearch]);

  return {
    filters,
    setFilter: setFilters,
    resetFilters,
    filteredTickets,
  };
}
