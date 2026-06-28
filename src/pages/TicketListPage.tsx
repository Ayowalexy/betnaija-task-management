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

  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const isAdmin = currentUser?.role === 'root_admin';
  const isDeptHead = currentUser?.role === 'dept_head';

  const title = isAdmin ? 'All Tickets' : isDeptHead ? 'Department Tickets' : 'My Tickets';

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    const apiFilters: Parameters<typeof ticketsApi.list>[0] = { ...filters };
    if (!isAdmin && isDeptHead && currentUser?.departmentId) {
      apiFilters.departmentIds = [currentUser.departmentId];
    } else if (!isAdmin && !isDeptHead && currentUser?.id) {
      apiFilters.assigneeId = currentUser.id;
    }

    ticketsApi.list(apiFilters)
      .then((res) => {
        if (!cancelled) {
          setTickets(res.data);
          setTotal(res.total);
          setLoading(false);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setError('Failed to load tickets');
          setLoading(false);
        }
      });

    return () => { cancelled = true; };
  }, [filters, isAdmin, isDeptHead, currentUser?.departmentId, currentUser?.id]);

  return (
    <TicketList
      title={title}
      tickets={tickets}
      total={total}
      loading={loading}
      error={error}
      showDepartmentFilter={isAdmin}
      showDepartmentColumn={isAdmin}
      showAssigneeFilter={isAdmin || isDeptHead}
    />
  );
}
