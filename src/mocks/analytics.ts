import type { AnalyticsData } from '../types/index.js';

export const ANALYTICS: AnalyticsData = {
  monthlyVolume: [
    { month: 'Jan 2026', count: 42 },
    { month: 'Feb 2026', count: 38 },
    { month: 'Mar 2026', count: 55 },
    { month: 'Apr 2026', count: 61 },
    { month: 'May 2026', count: 49 },
    { month: 'Jun 2026', count: 25 },
  ],

  slaCompliance: [
    { department: 'Technology', complianceRate: 74.2 },
    { department: 'Human Resources', complianceRate: 91.5 },
    { department: 'Finance', complianceRate: 88.0 },
    { department: 'Facilities', complianceRate: 65.3 },
  ],

  ticketsByStatus: [
    { label: 'Open', value: 7, color: '#0ea5e9' },
    { label: 'In Progress', value: 5, color: '#4f6ef7' },
    { label: 'Pending', value: 3, color: '#f59e0b' },
    { label: 'Transferred', value: 2, color: '#8b5cf6' },
    { label: 'Defaulted', value: 2, color: '#6b7280' },
    { label: 'Escalated', value: 2, color: '#f97316' },
    { label: 'Resolved', value: 3, color: '#10b981' },
    { label: 'Closed', value: 2, color: '#374151' },
  ],

  ticketsByPriority: [
    { label: 'Low', value: 9, color: '#10b981' },
    { label: 'Medium', value: 11, color: '#f59e0b' },
    { label: 'High', value: 7, color: '#f97316' },
    { label: 'Critical', value: 3, color: '#ef4444' },
  ],

  avgResolutionTime: [
    { department: 'Technology', avgHours: 6.4 },
    { department: 'Human Resources', avgHours: 18.2 },
    { department: 'Finance', avgHours: 28.7 },
    { department: 'Facilities', avgHours: 41.3 },
  ],

  topRequestors: [
    { userId: 'u2', name: 'Damilola Adeyemi', ticketCount: 8 },
    { userId: 'u1', name: 'Amaka Osei', ticketCount: 6 },
    { userId: 'u9', name: 'Ngozi Obiora', ticketCount: 5 },
    { userId: 'u6', name: 'Segun Afolabi', ticketCount: 4 },
    { userId: 'u5', name: 'Tunde Bakare', ticketCount: 3 },
    { userId: 'u12', name: 'Adaeze Ikenna', ticketCount: 3 },
  ],

  recentBreaches: [
    {
      ticketId: 't6',
      title: 'Server down – production database unreachable',
      department: 'Technology',
      assignee: 'Yetunde Williams',
      breachedAt: '2026-06-25T07:00:00.000Z',
      hoursOverdue: 24.3,
    },
    {
      ticketId: 't8',
      title: 'Q1 salary discrepancy – missing transport allowance',
      department: 'Finance',
      assignee: 'Ifunanya Dike',
      breachedAt: '2026-06-17T10:00:00.000Z',
      hoursOverdue: 218.1,
    },
    {
      ticketId: 't4',
      title: 'AC unit broken in meeting room B',
      department: 'Facilities',
      assignee: 'Biodun Sule',
      breachedAt: '2026-06-25T08:00:00.000Z',
      hoursOverdue: 28.5,
    },
    {
      ticketId: 't23',
      title: 'Data backup failure – nas-backup-02',
      department: 'Technology',
      assignee: 'Yetunde Williams',
      breachedAt: '2026-06-22T08:00:00.000Z',
      hoursOverdue: 96.2,
    },
    {
      ticketId: 't13',
      title: 'Update employee handbook – remote work policy',
      department: 'Human Resources',
      assignee: 'Ngozi Obiora',
      breachedAt: '2026-06-01T09:00:00.000Z',
      hoursOverdue: 599.8,
    },
  ],
};
