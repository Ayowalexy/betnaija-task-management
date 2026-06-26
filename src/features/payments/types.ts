import type { PaymentStatus, PaymentMethod } from '../../types/index';

export interface PaymentFilters {
  status: PaymentStatus | 'all';
  method: PaymentMethod | 'all';
}
