import { apiGet, apiPost, apiPatch } from '../lib/apiClient';
import type { Payment } from '../types/index';
import type { PaginatedResponse } from './tickets';

export interface CreatePaymentPayload {
  ticketId: string;
  amount: number;
  currency?: string;
  method: 'bank_transfer' | 'paystack' | 'cash';
  description?: string;
}

export const paymentsApi = {
  list: async (params?: { page?: number; limit?: number; status?: string; ticketId?: string }): Promise<PaginatedResponse<Payment>> => {
    return apiGet<PaginatedResponse<Payment>>('/payments', { params });
  },

  get: async (id: string): Promise<Payment> => {
    return apiGet<Payment>(`/payments/${id}`);
  },

  create: async (payload: CreatePaymentPayload): Promise<Payment> => {
    return apiPost<Payment>('/payments', payload);
  },

  complete: async (id: string, reference?: string): Promise<Payment> => {
    return apiPatch<Payment>(`/payments/${id}/complete`, { reference });
  },

  fail: async (id: string, reason?: string): Promise<Payment> => {
    return apiPatch<Payment>(`/payments/${id}/fail`, { reason });
  },
};
