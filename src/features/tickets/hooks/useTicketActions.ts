import { useTicketStore } from '../../../store/ticketStore';
import { useAuthStore } from '../../../store/authStore';
import { useToast } from '../../../hooks/useToast';

interface UseTicketActionsReturn {
  acceptTicket: (ticketId: string) => void;
  resolveTicket: (ticketId: string) => void;
  closeTicket: (ticketId: string) => void;
  escalateTicket: (ticketId: string) => void;
}

export function useTicketActions(): UseTicketActionsReturn {
  const updateTicket = useTicketStore((s) => s.updateTicket);
  const currentUser = useAuthStore((s) => s.currentUser);
  const { toast } = useToast();

  function acceptTicket(ticketId: string): void {
    if (!currentUser) return;
    updateTicket(ticketId, {
      assigneeId: currentUser.id,
      status: 'in_progress',
    });
    toast({ type: 'success', message: 'Ticket accepted and assigned to you.' });
  }

  function resolveTicket(ticketId: string): void {
    updateTicket(ticketId, {
      status: 'resolved',
      resolvedAt: new Date().toISOString(),
    });
    toast({ type: 'success', message: 'Ticket marked as resolved.' });
  }

  function closeTicket(ticketId: string): void {
    updateTicket(ticketId, {
      status: 'closed',
      closedAt: new Date().toISOString(),
    });
    toast({ type: 'success', message: 'Ticket closed.' });
  }

  function escalateTicket(ticketId: string): void {
    updateTicket(ticketId, { status: 'escalated' });
    toast({ type: 'success', message: 'Ticket escalated.' });
  }

  return { acceptTicket, resolveTicket, closeTicket, escalateTicket };
}
