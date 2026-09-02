import { useState, useEffect } from 'react';
import type { ReactElement } from 'react';
import type { Ticket } from '../types/index';
import { useAuthStore } from '../store/authStore';
import { useTicketStore } from '../store/ticketStore';
import { ticketsApi } from '../api/tickets';
import { TicketList } from '../features/tickets/components/TicketList';

export function TicketListPage(): ReactElement {
  const currentUser = useAuthStore((s) => s.currentUser);
  const filters = useTicketStore((s) => s.filters);

  const [state, setState] = useState({ tickets: [] as Ticket[], total: 0, loading: true, error: null as string | null });
  const { tickets, total, loading, error } = state;
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 25;

  const isAdmin = currentUser?.role === 'root_admin';

  const title = isAdmin ? 'All Tickets' : 'Department Tickets';

  // Filters changing invalidates whatever page we were on — go back to page 1 rather than
  // requesting e.g. page 4 of a now much-smaller filtered result set.
  useEffect(() => {
    setPage(1);
  }, [filters]);

  useEffect(() => {
    let cancelled = false;
    setState((s) => ({ ...s, loading: true, error: null }));

    const apiFilters: Parameters<typeof ticketsApi.list>[0] = { ...filters, page, limit: PAGE_SIZE };
    if (!isAdmin && currentUser?.departmentId) {
      apiFilters.departmentIds = [currentUser.departmentId];
    }

    ticketsApi.list(apiFilters)
      .then((res) => {
        if (!cancelled) {
          setState((s) => ({ ...s, tickets: res.data, total: res.total, loading: false }));
        }
      })
      .catch(() => {
        if (!cancelled) {
          setState((s) => ({ ...s, error: 'Failed to load tickets', loading: false }));
        }
      });

    return () => { cancelled = true; };
  }, [filters, page, isAdmin, currentUser?.departmentId]);

  return (
    <TicketList
      title={title}
      tickets={tickets}
      total={total}
      loading={loading}
      error={error}
      showDepartmentFilter={isAdmin}
      showDepartmentColumn={isAdmin}
      showAssigneeFilter={isAdmin}
      page={page}
      pageSize={PAGE_SIZE}
      onPageChange={setPage}
    />
  );
}
