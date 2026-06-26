import type { Department } from '../types/index.js';

export const DEPARTMENTS: Department[] = [
  {
    id: 'tech',
    name: 'Technology',
    headId: 'u2',
    memberIds: ['u6', 'u7', 'u8'],
    routing: 'roster_based',
    sla: {
      responseTimeMs: 30 * 60 * 1000,        // 30 minutes
      resolutionTimeMs: 4 * 60 * 60 * 1000,  // 4 hours
    },
    activeTicketCount: 9,
    teamsWebhook: 'https://hooks.teams.microsoft.com/mock/tech-dept-webhook',
    description: 'Handles all IT infrastructure, software systems, and technical support requests.',
  },
  {
    id: 'hr',
    name: 'Human Resources',
    headId: 'u3',
    memberIds: ['u9'],
    routing: 'all_notify',
    sla: {
      responseTimeMs: 60 * 60 * 1000,           // 1 hour
      resolutionTimeMs: 24 * 60 * 60 * 1000,    // 1 day
    },
    activeTicketCount: 5,
    teamsWebhook: 'https://hooks.teams.microsoft.com/mock/hr-dept-webhook',
    description: 'Manages employee relations, onboarding, offboarding, and HR policy requests.',
  },
  {
    id: 'finance',
    name: 'Finance',
    headId: 'u4',
    memberIds: ['u10', 'u12'],
    routing: 'all_notify',
    sla: {
      responseTimeMs: 2 * 60 * 60 * 1000,        // 2 hours
      resolutionTimeMs: 2 * 24 * 60 * 60 * 1000, // 2 days
    },
    activeTicketCount: 6,
    teamsWebhook: 'https://hooks.teams.microsoft.com/mock/finance-dept-webhook',
    description: 'Handles expense reimbursements, salary queries, vendor payments, and budget approvals.',
  },
  {
    id: 'facilities',
    name: 'Facilities',
    headId: 'u5',
    memberIds: ['u11'],
    routing: 'all_notify',
    sla: {
      responseTimeMs: 4 * 60 * 60 * 1000,        // 4 hours
      resolutionTimeMs: 3 * 24 * 60 * 60 * 1000, // 3 days
    },
    activeTicketCount: 5,
    teamsWebhook: 'https://hooks.teams.microsoft.com/mock/facilities-dept-webhook',
    description: 'Manages office maintenance, equipment, access cards, and workspace requests.',
  },
];

export const getDeptById = (id: string): Department | undefined =>
  DEPARTMENTS.find((d) => d.id === id);
