import type { Ticket, TicketFilters } from '@/types/index';
import { useTicketStore } from '@/store/ticketStore';

interface UseTicketFiltersReturn {
  filters: TicketFilters;
  setFilter: (updates: Partial<TicketFilters>) => void;
  resetFilters: () => void;
  filteredTickets: Ticket[];
}

/** All filtering (department/status/priority/assignee/date-range/search/SLA-breach range) is handled server-side via ticketsApi.list. */
export function useTicketFilters(tickets: Ticket[] = []): UseTicketFiltersReturn {
  const filters = useTicketStore((s) => s.filters);
  const setFilters = useTicketStore((s) => s.setFilters);
  const resetFilters = useTicketStore((s) => s.resetFilters);

  return {
    filters,
    setFilter: setFilters,
    resetFilters,
    filteredTickets: tickets,
  };
}
