import type { TicketStatus } from '@/types/index';

export const STATUS_TRANSITIONS: Record<TicketStatus, TicketStatus[]> = {
  open: ['in_progress', 'transferred', 'closed'],
  in_progress: ['pending', 'resolved', 'escalated', 'transferred'],
  pending: ['in_progress', 'closed'],
  transferred: ['in_progress', 'open'],
  escalated: ['in_progress', 'closed'],
  resolved: ['closed'],
  defaulted: ['in_progress', 'closed'],
  closed: [],
  rejected: [],
};
