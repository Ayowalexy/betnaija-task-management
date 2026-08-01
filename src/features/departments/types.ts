import type { RoutingType, TicketPriority } from '../../types/index.js';

export interface RequestTypeForm {
  name: string;
  description: string;
  priority: TicketPriority;
  responseTimeHours: number;
  resolutionTimeHours: number;
}

export interface CreateDepartmentForm {
  name: string;
  headId: string;
  routing: RoutingType;
  responseTimeHours: number;
  resolutionTimeHours: number;
  teamsWebhook: string;
  description: string;
  requestTypes: RequestTypeForm[];
  utilityIds: string[];
}
