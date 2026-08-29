import { useMemo } from 'react';
import type { Ticket, TicketFilters } from '../../../types/index';
import { useTicketStore } from '../../../store/ticketStore';

interface UseTicketFiltersReturn {
  filters: TicketFilters;
  setFilter: (updates: Partial<TicketFilters>) => void;
  resetFilters: () => void;
  filteredTickets: Ticket[];
}

export function useTicketFilters(tickets: Ticket[] = []): UseTicketFiltersReturn {
  const filters = useTicketStore((s) => s.filters);
  const setFilters = useTicketStore((s) => s.setFilters);
  const resetFilters = useTicketStore((s) => s.resetFilters);

  // Department/status/priority/assignee/date-range/search filtering is handled
  // server-side via ticketsApi.list. SLA-breach date range isn't supported by the
  // API yet, so it's applied here against the precomputed deadline on each ticket.
  const filteredTickets = useMemo(() => {
    if (!filters.slaBreachedFrom && !filters.slaBreachedTo) return tickets;
    return tickets.filter((ticket) => {
      if (!ticket.slaResolutionDeadline) return false;
      const breachMs = new Date(ticket.slaResolutionDeadline).getTime();
      if (filters.slaBreachedFrom && breachMs < new Date(filters.slaBreachedFrom).getTime()) return false;
      if (filters.slaBreachedTo && breachMs > new Date(filters.slaBreachedTo).getTime() + 86400000) return false;
      return true;
    });
  }, [tickets, filters.slaBreachedFrom, filters.slaBreachedTo]);

  return {
    filters,
    setFilter: setFilters,
    resetFilters,
    filteredTickets,
  };
}
