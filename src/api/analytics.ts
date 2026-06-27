import { apiGet } from '../lib/apiClient';
import type { AnalyticsData } from '../types/index';

export const analyticsApi = {
  get: async (params?: { dateFrom?: string; dateTo?: string; departmentId?: string }): Promise<AnalyticsData> => {
    return apiGet<AnalyticsData>('/analytics', { params });
  },
};
