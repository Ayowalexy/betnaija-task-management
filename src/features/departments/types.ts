import type { RoutingType } from '../../types/index.js';

export interface CreateDepartmentForm {
  name: string;
  headId: string;
  routing: RoutingType;
  responseTimeHours: number;
  resolutionTimeHours: number;
  teamsWebhook: string;
  description: string;
}
