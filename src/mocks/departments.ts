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
    requestTypes: [
      {
        id: 'tech-rt-1',
        name: 'VPN / Network Access',
        description: 'Issues connecting to the corporate VPN or internal network.',
        priority: 'high',
        sla: { responseTimeMs: 15 * 60 * 1000, resolutionTimeMs: 2 * 60 * 60 * 1000 },
      },
      {
        id: 'tech-rt-2',
        name: 'Password Reset',
        description: 'Reset or unlock access to a system, application, or account.',
        priority: 'medium',
        sla: { responseTimeMs: 15 * 60 * 1000, resolutionTimeMs: 60 * 60 * 1000 },
      },
      {
        id: 'tech-rt-3',
        name: 'Hardware Request',
        description: 'Request or repair of a laptop, monitor, or other equipment.',
        priority: 'low',
        sla: { responseTimeMs: 60 * 60 * 1000, resolutionTimeMs: 3 * 24 * 60 * 60 * 1000 },
      },
    ],
    utilityIds: ['util-meeting-rooms', 'util-av-equipment'],
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
    requestTypes: [
      {
        id: 'hr-rt-1',
        name: 'Leave Request',
        description: 'Apply for annual, sick, or compassionate leave.',
        priority: 'low',
        sla: { responseTimeMs: 2 * 60 * 60 * 1000, resolutionTimeMs: 24 * 60 * 60 * 1000 },
      },
      {
        id: 'hr-rt-2',
        name: 'Onboarding Support',
        description: 'New hire setup, documentation, and orientation queries.',
        priority: 'medium',
        sla: { responseTimeMs: 60 * 60 * 1000, resolutionTimeMs: 24 * 60 * 60 * 1000 },
      },
      {
        id: 'hr-rt-3',
        name: 'Workplace Grievance',
        description: 'Report a workplace conflict or policy violation.',
        priority: 'critical',
        sla: { responseTimeMs: 30 * 60 * 1000, resolutionTimeMs: 8 * 60 * 60 * 1000 },
      },
    ],
    utilityIds: [],
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
    requestTypes: [
      {
        id: 'finance-rt-1',
        name: 'Expense Reimbursement',
        description: 'Submit and track reimbursement for approved work expenses.',
        priority: 'medium',
        sla: { responseTimeMs: 4 * 60 * 60 * 1000, resolutionTimeMs: 3 * 24 * 60 * 60 * 1000 },
      },
      {
        id: 'finance-rt-2',
        name: 'Vendor Payment',
        description: 'Request or follow up on a payment to an external vendor.',
        priority: 'high',
        sla: { responseTimeMs: 2 * 60 * 60 * 1000, resolutionTimeMs: 2 * 24 * 60 * 60 * 1000 },
      },
    ],
    utilityIds: ['util-meeting-rooms'],
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
    requestTypes: [
      {
        id: 'facilities-rt-1',
        name: 'Office Maintenance',
        description: 'Report a facilities issue such as broken furniture or AC.',
        priority: 'medium',
        sla: { responseTimeMs: 4 * 60 * 60 * 1000, resolutionTimeMs: 2 * 24 * 60 * 60 * 1000 },
      },
      {
        id: 'facilities-rt-2',
        name: 'Access Card Request',
        description: 'Request a new or replacement building access card.',
        priority: 'low',
        sla: { responseTimeMs: 8 * 60 * 60 * 1000, resolutionTimeMs: 3 * 24 * 60 * 60 * 1000 },
      },
    ],
    utilityIds: ['util-meeting-rooms', 'util-pool-cars'],
  },
];

export const getDeptById = (id: string): Department | undefined =>
  DEPARTMENTS.find((d) => d.id === id);

export const getDepartmentsForUtility = (utilityId: string): Department[] =>
  DEPARTMENTS.filter((d) => d.utilityIds.includes(utilityId));
