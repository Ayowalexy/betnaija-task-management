import type { PaymentStatus } from '../../../types/index';
import { Badge } from '../../../components/ui/index';

interface PaymentStatusBadgeProps {
  status: PaymentStatus;
}

const variantMap: Record<PaymentStatus, 'warning' | 'success' | 'error'> = {
  pending: 'warning',
  completed: 'success',
  failed: 'error',
};

const labelMap: Record<PaymentStatus, string> = {
  pending: 'Pending',
  completed: 'Completed',
  failed: 'Failed',
};

export function PaymentStatusBadge({ status }: PaymentStatusBadgeProps) {
  return <Badge variant={variantMap[status]}>{labelMap[status]}</Badge>;
}
