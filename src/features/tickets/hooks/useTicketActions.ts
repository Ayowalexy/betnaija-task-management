import { useAuthStore } from '@/store/authStore';
import { useToast } from '@/hooks/useToast';
import { ticketsApi } from '@/api/tickets';

interface UseTicketActionsReturn {
  acceptTicket: (ticketId: string, onRefresh?: () => void) => Promise<void>;
  resolveTicket: (ticketId: string, onRefresh?: () => void) => Promise<void>;
  closeTicket: (ticketId: string, onRefresh?: () => void) => Promise<void>;
  escalateTicket: (ticketId: string, onRefresh?: () => void) => Promise<void>;
}

export function useTicketActions(): UseTicketActionsReturn {
  const currentUser = useAuthStore((s) => s.currentUser);
  const { toast } = useToast();

  async function acceptTicket(ticketId: string, onRefresh?: () => void): Promise<void> {
    if (!currentUser) return;
    try {
      await ticketsApi.assign(ticketId, currentUser.id);
      toast({ type: 'success', message: 'Ticket accepted and assigned to you.' });
      onRefresh?.();
    } catch {
      toast({ type: 'error', message: 'Failed to accept ticket.' });
    }
  }

  async function resolveTicket(ticketId: string, onRefresh?: () => void): Promise<void> {
    try {
      await ticketsApi.resolve(ticketId, '');
      toast({ type: 'success', message: 'Ticket marked as resolved.' });
      onRefresh?.();
    } catch {
      toast({ type: 'error', message: 'Failed to resolve ticket.' });
    }
  }

  async function closeTicket(ticketId: string, onRefresh?: () => void): Promise<void> {
    try {
      await ticketsApi.close(ticketId);
      toast({ type: 'success', message: 'Ticket closed.' });
      onRefresh?.();
    } catch {
      toast({ type: 'error', message: 'Failed to close ticket.' });
    }
  }

  async function escalateTicket(ticketId: string, onRefresh?: () => void): Promise<void> {
    try {
      await ticketsApi.escalate(ticketId, '');
      toast({ type: 'success', message: 'Ticket escalated.' });
      onRefresh?.();
    } catch {
      toast({ type: 'error', message: 'Failed to escalate ticket.' });
    }
  }

  return { acceptTicket, resolveTicket, closeTicket, escalateTicket };
}
