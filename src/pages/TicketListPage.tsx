import type { ReactElement } from 'react';
import { useAuthStore } from '../store/authStore';
import { useTicketStore } from '../store/ticketStore';
import { TicketList } from '../features/tickets/components/TicketList';

export function TicketListPage(): ReactElement {
  const currentUser = useAuthStore((s) => s.currentUser);
  const tickets = useTicketStore((s) => s.tickets);

  const isAdmin = currentUser?.role === 'root_admin';
  const isDeptHead = currentUser?.role === 'dept_head';

  // Scope tickets to role
  const scopedTickets = isAdmin
    ? tickets
    : isDeptHead
    ? tickets.filter((t) => t.departmentId === currentUser?.departmentId)
    : tickets.filter((t) => t.assigneeId === currentUser?.id || t.requestorId === currentUser?.id);

  const title = isAdmin ? 'All Tickets' : isDeptHead ? 'Department Tickets' : 'My Tickets';

  return (
    <TicketList
      title={title}
      tickets={scopedTickets}
      showDepartmentFilter={isAdmin}
      showAssigneeFilter={isAdmin || isDeptHead}
    />
  );
}
