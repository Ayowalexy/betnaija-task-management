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

  // Filtering is now handled server-side; pass through the tickets as-is.
  return {
    filters,
    setFilter: setFilters,
    resetFilters,
    filteredTickets: tickets,
  };
}
