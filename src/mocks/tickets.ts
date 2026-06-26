import type { Ticket, Comment, TransferEntry } from '../types/index.js';

const mkComment = (
  overrides: Partial<Comment> & Pick<Comment, 'id' | 'ticketId' | 'authorId' | 'content' | 'createdAt'>
): Comment => ({
  updatedAt: null,
  isEdited: false,
  replyToId: null,
  reactions: [],
  attachments: [],
  isActivityEntry: false,
  activityText: null,
  ...overrides,
});

const mkTransfer = (overrides: TransferEntry): TransferEntry => overrides;

export const TICKETS: Ticket[] = [
  // ─── t1: Laptop not connecting to VPN ─────────────────────────────────────
  {
    id: 't1',
    title: 'Laptop not connecting to VPN',
    description:
      'My laptop (MacBook Pro, M3) has been unable to connect to the corporate VPN since the firmware update last night. I get error code 619. I need access to internal tools urgently.',
    status: 'open',
    priority: 'high',
    departmentId: 'tech',
    assigneeId: 'u6',
    requestorId: 'u9',
    createdAt: '2026-06-26T07:30:00.000Z',
    updatedAt: '2026-06-26T08:05:00.000Z',
    resolvedAt: null,
    closedAt: null,
    comments: [
      mkComment({
        id: 'c1-1',
        ticketId: 't1',
        authorId: 'u9',
        content: 'I tried reinstalling the VPN client but the error persists. Error log attached.',
        createdAt: '2026-06-26T07:45:00.000Z',
        attachments: [
          { id: 'a1-1', name: 'vpn-error-log.txt', type: 'text/plain', sizeBytes: 4096, url: '/mock/files/vpn-error-log.txt' },
        ],
      }),
      mkComment({
        id: 'c1-2',
        ticketId: 't1',
        authorId: 'u6',
        content: 'Hi Ngozi, I can see the issue. The firmware update changed a network adapter setting. Please run the diagnostics script I\'m sending. I\'ll be with you in 15 minutes.',
        createdAt: '2026-06-26T07:58:00.000Z',
        reactions: [{ emoji: '👍', userIds: ['u9'] }],
      }),
      mkComment({
        id: 'c1-3',
        ticketId: 't1',
        authorId: 'u9',
        content: 'Thanks Segun! Running the script now.',
        createdAt: '2026-06-26T08:05:00.000Z',
      }),
    ],
    attachments: [],
    linkedTicketIds: [],
    transferHistory: [],
    tags: ['vpn', 'network', 'laptop'],
  },

  // ─── t2: Request new desk chair ───────────────────────────────────────────
  {
    id: 't2',
    title: 'Request new desk chair',
    description:
      'My current desk chair is broken — the height adjustment mechanism is stuck. I need a replacement ergonomic chair before end of week to avoid back strain.',
    status: 'open',
    priority: 'low',
    departmentId: 'facilities',
    assigneeId: null,
    requestorId: 'u12',
    createdAt: '2026-06-25T14:00:00.000Z',
    updatedAt: '2026-06-25T14:00:00.000Z',
    resolvedAt: null,
    closedAt: null,
    comments: [],
    attachments: [
      { id: 'a2-1', name: 'broken-chair.jpg', type: 'image/jpeg', sizeBytes: 512000, url: '/mock/files/broken-chair.jpg' },
    ],
    linkedTicketIds: [],
    transferHistory: [],
    tags: ['furniture', 'ergonomics'],
  },

  // ─── t3: Expense reimbursement – April trip ───────────────────────────────
  {
    id: 't3',
    title: 'Expense reimbursement – April Lagos trip',
    description:
      'Requesting reimbursement for travel and accommodation expenses incurred during the April 2026 client visit to Lagos. Total amount: ₦185,000. Receipts attached.',
    status: 'in_progress',
    priority: 'medium',
    departmentId: 'finance',
    assigneeId: 'u10',
    requestorId: 'u9',
    createdAt: '2026-06-20T10:00:00.000Z',
    updatedAt: '2026-06-23T11:30:00.000Z',
    resolvedAt: null,
    closedAt: null,
    comments: [
      mkComment({
        id: 'c3-1',
        ticketId: 't3',
        authorId: 'u10',
        content: 'Receipts reviewed. I need you to provide the purchase order number for the hotel booking to proceed with approval.',
        createdAt: '2026-06-22T09:00:00.000Z',
      }),
      mkComment({
        id: 'c3-2',
        ticketId: 't3',
        authorId: 'u9',
        content: 'PO number is PO-2026-0412. Please find the updated receipts with the PO reference included.',
        createdAt: '2026-06-23T11:30:00.000Z',
        attachments: [
          { id: 'a3-1', name: 'receipts-with-po.pdf', type: 'application/pdf', sizeBytes: 1024000, url: '/mock/files/receipts-with-po.pdf' },
        ],
      }),
    ],
    attachments: [
      { id: 'a3-2', name: 'expense-receipts-april.pdf', type: 'application/pdf', sizeBytes: 2048000, url: '/mock/files/expense-receipts-april.pdf' },
    ],
    linkedTicketIds: [],
    transferHistory: [],
    tags: ['reimbursement', 'travel', 'finance'],
  },

  // ─── t4: AC unit broken in meeting room B ────────────────────────────────
  {
    id: 't4',
    title: 'AC unit broken in meeting room B',
    description:
      'The air conditioning unit in Meeting Room B has been non-functional for 3 days. The room is unusable during afternoon hours due to extreme heat. Multiple team meetings have been disrupted.',
    status: 'escalated',
    priority: 'high',
    departmentId: 'facilities',
    assigneeId: 'u11',
    requestorId: 'u2',
    createdAt: '2026-06-22T08:00:00.000Z',
    updatedAt: '2026-06-25T09:00:00.000Z',
    resolvedAt: null,
    closedAt: null,
    comments: [
      mkComment({
        id: 'c4-1',
        ticketId: 't4',
        authorId: 'u11',
        content: 'Assessed the unit. The compressor needs replacement. Contacting HVAC vendor for quotes.',
        createdAt: '2026-06-23T10:00:00.000Z',
      }),
      mkComment({
        id: 'c4-2',
        ticketId: 't4',
        authorId: 'u5',
        content: 'Escalating this due to business impact. Biodun, please fast-track vendor engagement. We need a resolution by Monday.',
        createdAt: '2026-06-25T09:00:00.000Z',
        isActivityEntry: true,
        activityText: 'Ticket escalated by Tunde Bakare',
      }),
    ],
    attachments: [],
    linkedTicketIds: [],
    transferHistory: [],
    tags: ['hvac', 'meeting-room', 'urgent'],
  },

  // ─── t5: Onboarding documents for new hire ────────────────────────────────
  {
    id: 't5',
    title: 'Onboarding documents for new hire – Funmi Adela',
    description:
      'Please prepare and send all onboarding documents for new hire Funmi Adela (Software Engineer) who starts on July 1, 2026. Include offer letter copy, NDA, IT access form, and employee handbook.',
    status: 'resolved',
    priority: 'medium',
    departmentId: 'hr',
    assigneeId: 'u9',
    requestorId: 'u2',
    createdAt: '2026-06-18T09:00:00.000Z',
    updatedAt: '2026-06-24T15:00:00.000Z',
    resolvedAt: '2026-06-24T15:00:00.000Z',
    closedAt: null,
    comments: [
      mkComment({
        id: 'c5-1',
        ticketId: 't5',
        authorId: 'u9',
        content: 'All documents prepared and sent to Funmi via DocuSign. IT access form forwarded to Tech team.',
        createdAt: '2026-06-24T15:00:00.000Z',
        reactions: [{ emoji: '✅', userIds: ['u2', 'u3'] }],
      }),
    ],
    attachments: [],
    linkedTicketIds: [],
    transferHistory: [],
    tags: ['onboarding', 'new-hire', 'hr'],
  },

  // ─── t6: Server down – production DB (SLA BREACHED) ──────────────────────
  {
    id: 't6',
    title: 'Server down – production database unreachable',
    description:
      'Production database server (db-prod-01) became unreachable at approximately 03:00 WAT. All services depending on it are down. Customer-facing APIs returning 503. CRITICAL: revenue impact ongoing.',
    status: 'in_progress',
    priority: 'critical',
    departmentId: 'tech',
    assigneeId: 'u7',
    requestorId: 'u1',
    createdAt: '2026-06-25T03:00:00.000Z',
    updatedAt: '2026-06-26T06:00:00.000Z',
    resolvedAt: null,
    closedAt: null,
    comments: [
      mkComment({
        id: 'c6-1',
        ticketId: 't6',
        authorId: 'u7',
        content: 'Investigating. db-prod-01 shows disk I/O saturation. Running fsck. ETA: 2 hours.',
        createdAt: '2026-06-25T03:45:00.000Z',
      }),
      mkComment({
        id: 'c6-2',
        ticketId: 't6',
        authorId: 'u2',
        content: 'Yetunde, loop in AWS support as well. This cannot wait. We\'re losing approximately ₦500k/hour.',
        createdAt: '2026-06-25T04:30:00.000Z',
      }),
      mkComment({
        id: 'c6-3',
        ticketId: 't6',
        authorId: 'u7',
        content: 'Failover initiated to db-prod-02. Services coming back up. Still investigating root cause of primary failure.',
        createdAt: '2026-06-25T06:15:00.000Z',
        reactions: [{ emoji: '🙏', userIds: ['u1', 'u2'] }],
      }),
    ],
    attachments: [
      { id: 'a6-1', name: 'db-error-logs.zip', type: 'application/zip', sizeBytes: 8192000, url: '/mock/files/db-error-logs.zip' },
    ],
    linkedTicketIds: ['t9'],
    transferHistory: [],
    tags: ['production', 'database', 'outage', 'critical'],
  },

  // ─── t7: Office access card not working ──────────────────────────────────
  {
    id: 't7',
    title: 'Office access card not working – floor 3',
    description:
      'My access card stopped working for the 3rd floor entrance as of this morning. I had to be let in by a colleague. This is my primary work floor and I need access restored urgently.',
    status: 'pending',
    priority: 'low',
    departmentId: 'facilities',
    assigneeId: null,
    requestorId: 'u8',
    createdAt: '2026-06-26T08:15:00.000Z',
    updatedAt: '2026-06-26T08:15:00.000Z',
    resolvedAt: null,
    closedAt: null,
    comments: [],
    attachments: [],
    linkedTicketIds: [],
    transferHistory: [],
    tags: ['access-card', 'security', 'floor-3'],
  },

  // ─── t8: Q1 salary discrepancy ───────────────────────────────────────────
  {
    id: 't8',
    title: 'Q1 salary discrepancy – missing transport allowance',
    description:
      'My February and March 2026 payslips show no transport allowance despite it being part of my compensation package per my offer letter. The allowance is ₦25,000/month. Total shortfall: ₦50,000.',
    status: 'in_progress',
    priority: 'high',
    departmentId: 'finance',
    assigneeId: 'u10',
    requestorId: 'u6',
    createdAt: '2026-06-15T10:00:00.000Z',
    updatedAt: '2026-06-24T14:00:00.000Z',
    resolvedAt: null,
    closedAt: null,
    comments: [
      mkComment({
        id: 'c8-1',
        ticketId: 't8',
        authorId: 'u10',
        content: 'Checking the payroll records. Could you attach a copy of your offer letter page showing the allowance breakdown?',
        createdAt: '2026-06-16T09:00:00.000Z',
      }),
      mkComment({
        id: 'c8-2',
        ticketId: 't8',
        authorId: 'u6',
        content: 'Attached the relevant offer letter pages. The transport allowance is listed under "Monthly Allowances" on page 3.',
        createdAt: '2026-06-17T10:30:00.000Z',
        attachments: [
          { id: 'a8-1', name: 'offer-letter-extract.pdf', type: 'application/pdf', sizeBytes: 512000, url: '/mock/files/offer-letter-extract.pdf' },
        ],
      }),
      mkComment({
        id: 'c8-3',
        ticketId: 't8',
        authorId: 'u10',
        content: 'Confirmed the discrepancy. Raised a payroll correction request with Finance Head. Processing the ₦50,000 in next week\'s payrun.',
        createdAt: '2026-06-24T14:00:00.000Z',
        reactions: [{ emoji: '👍', userIds: ['u6'] }],
      }),
    ],
    attachments: [],
    linkedTicketIds: [],
    transferHistory: [],
    tags: ['payroll', 'salary', 'allowance'],
  },

  // ─── t9: Software license renewal – Adobe ────────────────────────────────
  {
    id: 't9',
    title: 'Software license renewal – Adobe Creative Cloud',
    description:
      'Our Adobe Creative Cloud team license (15 seats) expires on July 15, 2026. Please initiate renewal process. Budget code: IT-SW-2026. Last year cost was $4,200/year.',
    status: 'open',
    priority: 'medium',
    departmentId: 'tech',
    assigneeId: null,
    requestorId: 'u2',
    createdAt: '2026-06-24T11:00:00.000Z',
    updatedAt: '2026-06-24T11:00:00.000Z',
    resolvedAt: null,
    closedAt: null,
    comments: [],
    attachments: [],
    linkedTicketIds: ['t6'],
    transferHistory: [],
    tags: ['software', 'license', 'adobe'],
  },

  // ─── t10: Team building event planning ───────────────────────────────────
  {
    id: 't10',
    title: 'Q2 team building event planning',
    description:
      'Organize the Q2 team building event for ~50 staff. Budget: ₦500,000. Date: last Friday of June 2026. Venue suggestions: Go-kart track or outdoor paintball.',
    status: 'closed',
    priority: 'low',
    departmentId: 'hr',
    assigneeId: 'u9',
    requestorId: 'u1',
    createdAt: '2026-05-20T09:00:00.000Z',
    updatedAt: '2026-06-20T17:00:00.000Z',
    resolvedAt: '2026-06-20T16:00:00.000Z',
    closedAt: '2026-06-20T17:00:00.000Z',
    comments: [
      mkComment({
        id: 'c10-1',
        ticketId: 't10',
        authorId: 'u9',
        content: 'Booked the Go-kart track at Lekki for June 27. Catering arranged. Transport shuttles confirmed. Sending calendar invite to all staff.',
        createdAt: '2026-06-15T14:00:00.000Z',
        reactions: [{ emoji: '🎉', userIds: ['u1', 'u2', 'u3', 'u4', 'u5'] }],
      }),
    ],
    attachments: [],
    linkedTicketIds: [],
    transferHistory: [],
    tags: ['events', 'team-building', 'hr'],
  },

  // ─── t11: Transferred ticket ──────────────────────────────────────────────
  {
    id: 't11',
    title: 'New hire IT equipment procurement',
    description:
      'Procure laptop, headset, and peripherals for 3 new hires starting July 1, 2026. Budget approved. Specs: MacBook Pro 14" M3, AirPods Pro, Magic Keyboard and Mouse.',
    status: 'transferred',
    priority: 'medium',
    departmentId: 'tech',
    assigneeId: 'u6',
    requestorId: 'u3',
    createdAt: '2026-06-10T09:00:00.000Z',
    updatedAt: '2026-06-19T11:00:00.000Z',
    resolvedAt: null,
    closedAt: null,
    comments: [
      mkComment({
        id: 'c11-1',
        ticketId: 't11',
        authorId: 'u3',
        content: 'Initially raised with HR but this needs Finance approval for PO before Tech can proceed.',
        createdAt: '2026-06-10T09:30:00.000Z',
      }),
      mkComment({
        id: 'c11-2',
        ticketId: 't11',
        authorId: 'u1',
        content: 'Ticket transferred from HR to Finance for procurement approval, then to Tech for execution.',
        createdAt: '2026-06-12T10:00:00.000Z',
        isActivityEntry: true,
        activityText: 'Ticket transferred from Human Resources to Finance by Amaka Osei',
      }),
      mkComment({
        id: 'c11-3',
        ticketId: 't11',
        authorId: 'u4',
        content: 'PO raised: PO-2026-0651. Approved for ₦1,250,000. Transferring back to Tech.',
        createdAt: '2026-06-18T14:00:00.000Z',
      }),
      mkComment({
        id: 'c11-4',
        ticketId: 't11',
        authorId: 'u4',
        content: 'Ticket transferred from Finance to Technology after PO approval.',
        createdAt: '2026-06-19T11:00:00.000Z',
        isActivityEntry: true,
        activityText: 'Ticket transferred from Finance to Technology by Kelechi Nwosu',
      }),
    ],
    attachments: [],
    linkedTicketIds: ['t5'],
    transferHistory: [
      mkTransfer({
        id: 'tr11-1',
        fromDeptId: 'hr',
        toDeptId: 'finance',
        byUserId: 'u1',
        note: 'Needs Finance approval for PO before procurement can proceed.',
        timestamp: '2026-06-12T10:00:00.000Z',
      }),
      mkTransfer({
        id: 'tr11-2',
        fromDeptId: 'finance',
        toDeptId: 'tech',
        byUserId: 'u4',
        note: 'PO approved. Tech to proceed with procurement.',
        timestamp: '2026-06-19T11:00:00.000Z',
      }),
    ],
    tags: ['procurement', 'new-hire', 'equipment'],
  },

  // ─── t12: Another transferred ticket ─────────────────────────────────────
  {
    id: 't12',
    title: 'Flooded bathroom on 2nd floor',
    description:
      'The main bathroom on the 2nd floor has water overflowing from a blocked drain. Risk of water damage to the floor below (Finance dept). Immediate attention required.',
    status: 'transferred',
    priority: 'high',
    departmentId: 'facilities',
    assigneeId: 'u11',
    requestorId: 'u10',
    createdAt: '2026-06-24T14:30:00.000Z',
    updatedAt: '2026-06-24T15:45:00.000Z',
    resolvedAt: null,
    closedAt: null,
    comments: [
      mkComment({
        id: 'c12-1',
        ticketId: 't12',
        authorId: 'u10',
        content: 'This started as a maintenance ticket but it\'s now a potential structural damage issue. Escalating to Facilities.',
        createdAt: '2026-06-24T14:35:00.000Z',
      }),
      mkComment({
        id: 'c12-2',
        ticketId: 't12',
        authorId: 'u5',
        content: 'Ticket transferred to Facilities for immediate remediation.',
        createdAt: '2026-06-24T15:00:00.000Z',
        isActivityEntry: true,
        activityText: 'Ticket transferred from Finance to Facilities by Tunde Bakare',
      }),
      mkComment({
        id: 'c12-3',
        ticketId: 't12',
        authorId: 'u11',
        content: 'Plumber on-site. Drain unblocked. Drying equipment deployed. Will monitor for 24 hours.',
        createdAt: '2026-06-24T15:45:00.000Z',
      }),
    ],
    attachments: [
      { id: 'a12-1', name: 'bathroom-flood.jpg', type: 'image/jpeg', sizeBytes: 1024000, url: '/mock/files/bathroom-flood.jpg' },
    ],
    linkedTicketIds: [],
    transferHistory: [
      mkTransfer({
        id: 'tr12-1',
        fromDeptId: 'finance',
        toDeptId: 'facilities',
        byUserId: 'u5',
        note: 'Maintenance issue requiring Facilities immediate response.',
        timestamp: '2026-06-24T15:00:00.000Z',
      }),
    ],
    tags: ['maintenance', 'emergency', 'water'],
  },

  // ─── t13: Defaulted ticket ────────────────────────────────────────────────
  {
    id: 't13',
    title: 'Update employee handbook – remote work policy',
    description:
      'The employee handbook needs to be updated to reflect the new hybrid work policy approved in April 2026. HR to update sections 4.2 (Work Hours) and 4.5 (Remote Work).',
    status: 'defaulted',
    priority: 'low',
    departmentId: 'hr',
    assigneeId: 'u9',
    requestorId: 'u1',
    createdAt: '2026-05-01T09:00:00.000Z',
    updatedAt: '2026-06-01T09:00:00.000Z',
    resolvedAt: null,
    closedAt: null,
    comments: [
      mkComment({
        id: 'c13-1',
        ticketId: 't13',
        authorId: 'u9',
        content: 'Acknowledged. Will work on this alongside legal team review.',
        createdAt: '2026-05-02T10:00:00.000Z',
      }),
    ],
    attachments: [],
    linkedTicketIds: [],
    transferHistory: [],
    tags: ['policy', 'handbook', 'hr'],
  },

  // ─── t14: Defaulted ticket 2 ──────────────────────────────────────────────
  {
    id: 't14',
    title: 'Printer on floor 1 out of toner',
    description:
      'The HP LaserJet on the 1st floor (near reception) is out of toner. Multiple staff members cannot print important documents.',
    status: 'defaulted',
    priority: 'medium',
    departmentId: 'facilities',
    assigneeId: null,
    requestorId: 'u12',
    createdAt: '2026-06-05T11:00:00.000Z',
    updatedAt: '2026-06-10T09:00:00.000Z',
    resolvedAt: null,
    closedAt: null,
    comments: [],
    attachments: [],
    linkedTicketIds: [],
    transferHistory: [],
    tags: ['printer', 'supplies', 'floor-1'],
  },

  // ─── t15: Open tech ticket ────────────────────────────────────────────────
  {
    id: 't15',
    title: 'Slack workspace storage almost full',
    description:
      'Our Slack workspace is at 95% storage capacity. We need to either upgrade the plan or archive old channels and export files. Please advise and take action.',
    status: 'open',
    priority: 'medium',
    departmentId: 'tech',
    assigneeId: 'u8',
    requestorId: 'u2',
    createdAt: '2026-06-25T09:00:00.000Z',
    updatedAt: '2026-06-25T09:00:00.000Z',
    resolvedAt: null,
    closedAt: null,
    comments: [],
    attachments: [],
    linkedTicketIds: [],
    transferHistory: [],
    tags: ['slack', 'storage', 'saas'],
  },

  // ─── t16: HR in_progress ─────────────────────────────────────────────────
  {
    id: 't16',
    title: 'Annual leave policy clarification – carry-over rules',
    description:
      'Several staff members are asking about the annual leave carry-over policy for 2026. Specifically: how many days can be carried into 2027, and what is the forfeiture deadline?',
    status: 'in_progress',
    priority: 'low',
    departmentId: 'hr',
    assigneeId: 'u3',
    requestorId: 'u6',
    createdAt: '2026-06-23T13:00:00.000Z',
    updatedAt: '2026-06-25T10:00:00.000Z',
    resolvedAt: null,
    closedAt: null,
    comments: [
      mkComment({
        id: 'c16-1',
        ticketId: 't16',
        authorId: 'u3',
        content: 'Checking with Legal on the exact carry-over limits per the updated employment contracts. Will respond by Friday.',
        createdAt: '2026-06-24T09:00:00.000Z',
      }),
    ],
    attachments: [],
    linkedTicketIds: [],
    transferHistory: [],
    tags: ['leave', 'policy', 'hr'],
  },

  // ─── t17: Finance resolved ────────────────────────────────────────────────
  {
    id: 't17',
    title: 'Vendor invoice dispute – CloudServe Nigeria',
    description:
      'CloudServe Nigeria has sent an invoice for services that were supposedly delivered in March 2026 but we have no record of delivery. Amount: ₦320,000. Please investigate before payment is made.',
    status: 'resolved',
    priority: 'high',
    departmentId: 'finance',
    assigneeId: 'u12',
    requestorId: 'u4',
    createdAt: '2026-06-10T10:00:00.000Z',
    updatedAt: '2026-06-20T16:00:00.000Z',
    resolvedAt: '2026-06-20T16:00:00.000Z',
    closedAt: null,
    comments: [
      mkComment({
        id: 'c17-1',
        ticketId: 't17',
        authorId: 'u12',
        content: 'Contacted CloudServe. They provided delivery confirmation docs. Cross-referenced with our internal records — delivery was to a different cost center. Issue resolved.',
        createdAt: '2026-06-20T16:00:00.000Z',
        attachments: [
          { id: 'a17-1', name: 'cloudserve-delivery-confirmation.pdf', type: 'application/pdf', sizeBytes: 256000, url: '/mock/files/cloudserve-confirmation.pdf' },
        ],
      }),
    ],
    attachments: [],
    linkedTicketIds: [],
    transferHistory: [],
    tags: ['vendor', 'invoice', 'dispute'],
  },

  // ─── t18: Pending facilities ──────────────────────────────────────────────
  {
    id: 't18',
    title: 'Conference room A projector bulb replacement',
    description:
      'The projector in Conference Room A has a blown bulb. Several important presentations are scheduled this week. A replacement bulb (model Epson ELPLP96) has been ordered — ETA 2 days.',
    status: 'pending',
    priority: 'medium',
    departmentId: 'facilities',
    assigneeId: 'u11',
    requestorId: 'u7',
    createdAt: '2026-06-24T08:00:00.000Z',
    updatedAt: '2026-06-24T10:00:00.000Z',
    resolvedAt: null,
    closedAt: null,
    comments: [
      mkComment({
        id: 'c18-1',
        ticketId: 't18',
        authorId: 'u11',
        content: 'Bulb ordered from Epson vendor. Awaiting delivery. Ticket marked pending delivery. Will install as soon as it arrives.',
        createdAt: '2026-06-24T10:00:00.000Z',
      }),
    ],
    attachments: [],
    linkedTicketIds: [],
    transferHistory: [],
    tags: ['projector', 'equipment', 'conference-room'],
  },

  // ─── t19: Tech closed ─────────────────────────────────────────────────────
  {
    id: 't19',
    title: 'Set up GitHub repository for new mobile project',
    description:
      'Create a new GitHub repository for the FlowDesk Mobile project. Settings: private repo, branch protection on main, CodeQL scanning enabled, add tech team as collaborators.',
    status: 'closed',
    priority: 'medium',
    departmentId: 'tech',
    assigneeId: 'u8',
    requestorId: 'u2',
    createdAt: '2026-06-12T09:00:00.000Z',
    updatedAt: '2026-06-13T11:00:00.000Z',
    resolvedAt: '2026-06-13T10:30:00.000Z',
    closedAt: '2026-06-13T11:00:00.000Z',
    comments: [
      mkComment({
        id: 'c19-1',
        ticketId: 't19',
        authorId: 'u8',
        content: 'Repository created: github.com/flowdesk/flowdesk-mobile. Branch protection enabled, CodeQL active, all tech team members added.',
        createdAt: '2026-06-13T10:30:00.000Z',
        reactions: [{ emoji: '✅', userIds: ['u2', 'u6', 'u7'] }],
      }),
    ],
    attachments: [],
    linkedTicketIds: [],
    transferHistory: [],
    tags: ['github', 'devops', 'mobile'],
  },

  // ─── t20: Finance open ────────────────────────────────────────────────────
  {
    id: 't20',
    title: 'Monthly budget report – May 2026',
    description:
      'Please compile and distribute the monthly budget variance report for May 2026. Include actuals vs. budget by department, highlight any variances over 10%, and send to all dept heads.',
    status: 'open',
    priority: 'medium',
    departmentId: 'finance',
    assigneeId: 'u4',
    requestorId: 'u1',
    createdAt: '2026-06-26T07:00:00.000Z',
    updatedAt: '2026-06-26T07:00:00.000Z',
    resolvedAt: null,
    closedAt: null,
    comments: [],
    attachments: [],
    linkedTicketIds: [],
    transferHistory: [],
    tags: ['budget', 'report', 'monthly'],
  },

  // ─── t21: HR open ─────────────────────────────────────────────────────────
  {
    id: 't21',
    title: 'Employee disciplinary review – tardiness pattern',
    description:
      'Confidential. Requesting HR review for an employee (ID withheld) with a recurring tardiness pattern across 8 weeks. Please initiate the formal review process per HR policy 3.1.',
    status: 'open',
    priority: 'medium',
    departmentId: 'hr',
    assigneeId: 'u3',
    requestorId: 'u2',
    createdAt: '2026-06-25T10:00:00.000Z',
    updatedAt: '2026-06-25T10:00:00.000Z',
    resolvedAt: null,
    closedAt: null,
    comments: [],
    attachments: [],
    linkedTicketIds: [],
    transferHistory: [],
    tags: ['disciplinary', 'confidential', 'hr'],
  },

  // ─── t22: Facilities pending ──────────────────────────────────────────────
  {
    id: 't22',
    title: 'Parking space allocation for new vehicles',
    description:
      'Three staff members have new vehicles and need parking space allocation in the company lot. Current lot capacity is 40 spaces with 37 occupied. Please assess and allocate.',
    status: 'pending',
    priority: 'low',
    departmentId: 'facilities',
    assigneeId: 'u5',
    requestorId: 'u9',
    createdAt: '2026-06-23T11:00:00.000Z',
    updatedAt: '2026-06-24T09:00:00.000Z',
    resolvedAt: null,
    closedAt: null,
    comments: [
      mkComment({
        id: 'c22-1',
        ticketId: 't22',
        authorId: 'u5',
        content: 'Pending space availability audit completion. Will confirm allocations by end of week.',
        createdAt: '2026-06-24T09:00:00.000Z',
      }),
    ],
    attachments: [],
    linkedTicketIds: [],
    transferHistory: [],
    tags: ['parking', 'facilities', 'allocation'],
  },

  // ─── t23: Tech escalated ─────────────────────────────────────────────────
  {
    id: 't23',
    title: 'Data backup failure – nas-backup-02',
    description:
      'Automated nightly backup job has been failing on nas-backup-02 for 5 consecutive nights. Last successful backup was June 19. Risk of data loss if not resolved immediately.',
    status: 'escalated',
    priority: 'critical',
    departmentId: 'tech',
    assigneeId: 'u7',
    requestorId: 'u2',
    createdAt: '2026-06-21T08:00:00.000Z',
    updatedAt: '2026-06-25T09:30:00.000Z',
    resolvedAt: null,
    closedAt: null,
    comments: [
      mkComment({
        id: 'c23-1',
        ticketId: 't23',
        authorId: 'u7',
        content: 'Initial check shows NAS disk RAID degraded — one disk failed silently. Ordered replacement disk.',
        createdAt: '2026-06-22T10:00:00.000Z',
      }),
      mkComment({
        id: 'c23-2',
        ticketId: 't23',
        authorId: 'u2',
        content: 'Escalated due to duration. Yetunde, please implement temporary cloud backup as fallback until hardware fixed.',
        createdAt: '2026-06-25T09:30:00.000Z',
        isActivityEntry: true,
        activityText: 'Ticket escalated by Damilola Adeyemi',
      }),
    ],
    attachments: [],
    linkedTicketIds: [],
    transferHistory: [],
    tags: ['backup', 'nas', 'data', 'critical'],
  },

  // ─── t24: Finance in_progress ─────────────────────────────────────────────
  {
    id: 't24',
    title: 'Petty cash replenishment – Facilities dept',
    description:
      'Facilities petty cash fund is exhausted. Requesting replenishment of ₦75,000 to cover miscellaneous maintenance expenses for the remainder of June 2026.',
    status: 'in_progress',
    priority: 'low',
    departmentId: 'finance',
    assigneeId: 'u10',
    requestorId: 'u5',
    createdAt: '2026-06-24T12:00:00.000Z',
    updatedAt: '2026-06-25T14:00:00.000Z',
    resolvedAt: null,
    closedAt: null,
    comments: [
      mkComment({
        id: 'c24-1',
        ticketId: 't24',
        authorId: 'u10',
        content: 'Finance head approval obtained. Bank transfer of ₦75,000 to Facilities petty cash account initiated. Processing in 1-2 business days.',
        createdAt: '2026-06-25T14:00:00.000Z',
      }),
    ],
    attachments: [],
    linkedTicketIds: [],
    transferHistory: [],
    tags: ['petty-cash', 'finance', 'facilities'],
  },

  // ─── t25: HR resolved ─────────────────────────────────────────────────────
  {
    id: 't25',
    title: 'Work-from-home equipment request – Adaeze Ikenna',
    description:
      'Requesting a company-provided monitor and ergonomic keyboard for home office setup per the new hybrid work policy. Adaeze works from home 3 days/week.',
    status: 'resolved',
    priority: 'low',
    departmentId: 'hr',
    assigneeId: 'u9',
    requestorId: 'u12',
    createdAt: '2026-06-14T10:00:00.000Z',
    updatedAt: '2026-06-21T15:00:00.000Z',
    resolvedAt: '2026-06-21T15:00:00.000Z',
    closedAt: null,
    comments: [
      mkComment({
        id: 'c25-1',
        ticketId: 't25',
        authorId: 'u9',
        content: 'Request approved under the hybrid work equipment subsidy. Coordinating with Tech for monitor setup. Items delivered to Adaeze\'s home address.',
        createdAt: '2026-06-21T15:00:00.000Z',
      }),
    ],
    attachments: [],
    linkedTicketIds: ['t11'],
    transferHistory: [],
    tags: ['wfh', 'equipment', 'hybrid-work'],
  },
];

export const getTicketById = (id: string): Ticket | undefined =>
  TICKETS.find((t) => t.id === id);
