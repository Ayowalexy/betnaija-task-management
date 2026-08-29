import type { UtilityRequestStatus } from '@/types/index.js';

export const STATUS_LABELS: Record<UtilityRequestStatus, string> = {
  pending: 'Pending',
  approved: 'Approved',
  rejected: 'Rejected',
  completed: 'Completed',
  cancelled: 'Cancelled',
};

export function getUtilityRequestStatusVariant(
  status: UtilityRequestStatus,
): 'default' | 'success' | 'warning' | 'error' | 'info' | 'purple' {
  switch (status) {
    case 'pending':
      return 'warning';
    case 'approved':
      return 'success';
    case 'rejected':
      return 'error';
    case 'completed':
      return 'info';
    case 'cancelled':
      return 'default';
  }
}
