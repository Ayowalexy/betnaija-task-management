// User roles
export type UserRole = 'root_admin' | 'dept_head' | 'team_member';

// User status
export type UserStatus = 'active' | 'suspended';

// Ticket status (8 types)
export type TicketStatus =
  | 'open'
  | 'in_progress'
  | 'pending'
  | 'transferred'
  | 'defaulted'
  | 'escalated'
  | 'resolved'
  | 'closed'
  | 'rejected';

// Ticket priority (4 levels)
export type TicketPriority = 'low' | 'medium' | 'high' | 'critical';

// Department routing types
export type RoutingType = 'roster_based' | 'all_notify';

// SLA status
export type SLAStatus = 'safe' | 'warning' | 'critical' | 'breached';

// Notification types
export type NotificationType =
  | 'ticket_assigned'
  | 'ticket_accepted'
  | 'ticket_rejected'
  | 'new_ticket'
  | 'sla_warning'
  | 'ticket_resolved'
  | 'new_comment'
  | 'payment_initiated'
  | 'ticket_escalated'
  | 'ticket_transferred'
  | 'utility_request_submitted'
  | 'utility_request_approved'
  | 'utility_request_rejected'
  | 'utility_request_completed';

// Payment status
export type PaymentStatus = 'pending' | 'completed' | 'failed';

// Payment method
export type PaymentMethod = 'bank_transfer' | 'paystack' | 'cash';

// Theme
export type Theme = 'light' | 'dark';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  departmentId: string | null;
  status: UserStatus;
  avatarInitials: string;
  avatarColor: string; // hex color for avatar bg
  joinDate: string; // ISO date
  lastLogin: string | null; // ISO date
  isOnline: boolean;
  isFirstLogin: boolean;
  notificationPrefs: {
    email: boolean;
    teams: boolean;
    whatsapp: boolean;
  };
}

export interface SLAConfig {
  responseTimeMs: number; // milliseconds
  resolutionTimeMs: number; // milliseconds
}

export interface RequestType {
  id: string;
  name: string;
  description: string;
  priority: TicketPriority;
  sla: SLAConfig;
}

export interface Department {
  id: string;
  name: string;
  slug: string;
  headId?: string | null;
  memberIds: string[];
  routing: RoutingType;
  sla: SLAConfig;
  activeTicketCount: number;
  teamsWebhook?: string | null;
  description?: string | null;
  requestTypes?: RequestType[];
  utilityIds?: string[]; // Utility.id — organization resources requesters can use for this department
}

// Utility (bookable org resources — meeting rooms, pool cars, equipment, etc.)
export type CalendarProvider = 'google' | 'outlook' | 'ics';
export type CalendarSyncMode = 'meeting' | 'event';
export type UtilityStatus = 'active' | 'inactive';

export interface UtilityOption {
  id: string;
  name: string;
  isAvailable: boolean;
  unavailableUntil: string | null;
  unavailableReason: string | null;
}

export interface UtilityCalendarIntegration {
  enabled: boolean;
  provider: CalendarProvider | null;
  calendarAddress: string; // calendar email/ID the utility syncs to
  syncMode: CalendarSyncMode | null; // 'meeting' invites attendees & shows availability, 'event' just blocks the calendar
}

export interface Utility {
  id: string;
  name: string;
  description: string;
  options: UtilityOption[];
  calendar: UtilityCalendarIntegration;
  status: UtilityStatus;
  departmentIds: string[]; // departments that approve requests for this utility
  departments?: { id: string; name: string }[]; // present on GET /utilities/:id
  createdAt: string; // ISO
  updatedAt: string; // ISO
}

// Utility Request (a requester booking a utility option from a department)
export type UtilityRequestStatus = 'pending' | 'approved' | 'rejected' | 'completed' | 'cancelled';

export type UtilityRequestLogAction =
  | 'created'
  | 'updated'
  | 'approved'
  | 'rejected'
  | 'cancelled'
  | 'completed';

export interface UtilityRequestLogEntry {
  id: string;
  timestamp: string; // ISO
  actorId: string;
  actorName?: string | null;
  action: UtilityRequestLogAction;
  note: string | null; // e.g. rejection reason or summary of what changed
}

export interface UtilityRequestComment {
  id: string;
  requestId: string;
  authorId: string;
  authorName?: string | null;
  authorInitials?: string | null;
  authorColor?: string | null;
  content: string;
  createdAt: string; // ISO
  updatedAt: string | null;
  isEdited: boolean;
  reactions: Reaction[];
  attachments: Attachment[];
}

export interface UtilityRequest {
  id: string;
  utilityId: string;
  utilityName?: string | null; // present on list items
  utilityOptionId: string;
  utilityOptionName?: string | null; // present on list items
  departmentId: string; // department responsible for approving this request
  departmentName?: string | null; // present on list items
  requestorId: string;
  requestorName?: string | null; // present on list items
  date: string; // ISO date YYYY-MM-DD
  startTime: string; // HH:MM
  endTime: string; // HH:MM
  // details/rejectionReason/updatedAt/comments/log are only present on the GET :id (detail) response —
  // list items (GET /utility-requests) omit them.
  details?: string;
  status: UtilityRequestStatus;
  rejectionReason?: string | null;
  createdAt: string; // ISO
  updatedAt?: string; // ISO
  comments?: UtilityRequestComment[];
  log?: UtilityRequestLogEntry[];
}

export interface UtilityRequestFilters {
  departmentIds: string[];
  utilityIds: string[];
  statuses: UtilityRequestStatus[];
  dateFrom: string | null;
  dateTo: string | null;
  search: string;
}

export interface Comment {
  id: string;
  ticketId: string;
  authorId: string;
  authorName?: string | null;
  authorInitials?: string | null;
  authorColor?: string | null;
  content: string;
  createdAt: string; // ISO
  updatedAt: string | null;
  isEdited: boolean;
  replyToId: string | null;
  reactions: Reaction[];
  attachments: Attachment[];
  isActivityEntry: boolean; // for transfer/status change entries
  activityText: string | null;
}

export interface Reaction {
  emoji: string;
  userIds: string[];
}

export interface Attachment {
  id: string;
  name: string;
  type: string; // mime type
  sizeBytes: number;
  url: string; // mock URL
}

export interface Ticket {
  id: string;
  title: string;
  description: string;
  status: TicketStatus;
  priority: TicketPriority;
  departmentId: string;
  departmentName?: string | null;
  requestType?: { id: string; name: string } | null;
  assigneeId: string | null;
  assigneeName?: string | null;
  assigneeInitials?: string | null;
  assigneeColor?: string | null;
  requestorId: string;
  requestorName?: string | null;
  requestorInitials?: string | null;
  requestor?: {
    id: string;
    name: string;
    email: string;
    departmentId: string | null;
    departmentName?: string | null;
    avatarInitials: string;
    avatarColor: string;
  } | null;
  slaStatus?: SLAStatus;
  slaResolutionDeadline?: string | null;
  slaResponseDeadline?: string | null;
  commentCount?: number;
  attachmentCount?: number;
  createdAt: string; // ISO
  updatedAt: string; // ISO
  resolvedAt: string | null;
  closedAt: string | null;
  rejectionNote?: string | null;
  comments: Comment[];
  attachments: Attachment[];
  linkedTicketIds: string[];
  transferHistory: TransferEntry[];
  tags: string[];
}

export interface TransferEntry {
  id: string;
  fromDeptId: string;
  fromDeptName?: string | null;
  toDeptId: string;
  toDeptName?: string | null;
  byUserId: string;
  byUserName?: string | null;
  note: string;
  timestamp: string;
}

export interface Shift {
  id: string;
  userId: string;
  userName?: string | null;
  userInitials?: string | null;
  userColor?: string | null;
  departmentId: string;
  departmentName?: string | null;
  date: string; // ISO date YYYY-MM-DD
  startTime: string; // HH:MM
  endTime: string; // HH:MM
}

export interface ChatMessage {
  id: string;
  conversationId: string;
  senderId: string;
  content: string;
  sentAt: string; // ISO
  readBy: string[]; // user ids
  attachments: Attachment[];
}

export interface Conversation {
  id: string;
  type: 'dm' | 'group';
  name: string | null; // for groups
  participantIds: string[];
  messages: ChatMessage[];
  lastMessageAt: string;
}

export interface Notification {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  ticketId: string | null;
  utilityRequestId?: string | null;
  createdAt: string; // ISO
  isRead: boolean;
}

export interface AnalyticsSummary {
  totalTickets: number;
  resolvedThisMonth: number;
  slaComplianceRate: number;
  avgResolutionHours: number;
  currentlyBreached: number;
}

export interface AnalyticsData {
  monthlyVolume: MonthlyVolume[];
  slaCompliance: SLACompliance[];
  ticketsByStatus: ChartDataPoint[];
  ticketsByPriority: ChartDataPoint[];
  avgResolutionTime: DeptResolutionTime[];
  topRequestors: TopRequestor[];
  recentBreaches: SLABreach[];
  summary?: AnalyticsSummary;
}

export interface MonthlyVolume {
  month: string; // "Jan 2026"
  count: number;
}

export interface SLACompliance {
  department: string;
  complianceRate: number; // 0-100
}

export interface ChartDataPoint {
  label: string;
  value: number;
  color: string;
}

export interface DeptResolutionTime {
  department: string;
  avgHours: number;
}

export interface TopRequestor {
  userId: string;
  name: string;
  ticketCount: number;
}

export interface SLABreach {
  ticketId: string;
  title: string;
  department: string;
  assignee: string;
  breachedAt: string;
  hoursOverdue: number;
}

export interface Payment {
  id: string;
  ticketId: string;
  ticketTitle?: string | null;
  amount: number;
  currency: string;
  status: PaymentStatus;
  method: PaymentMethod;
  initiatedBy: string; // user id
  initiatedByName?: string | null;
  initiatedAt: string; // ISO
  completedAt: string | null;
  reference: string;
  description: string;
}

export interface Toast {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  message: string;
  duration?: number;
}

export interface TicketFilters {
  departmentIds: string[];
  statuses: TicketStatus[];
  priorities: TicketPriority[];
  assigneeId: string | null;
  dateFrom: string | null;
  dateTo: string | null;
  slaBreachedFrom: string | null;
  slaBreachedTo: string | null;
  search: string;
}
