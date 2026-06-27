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
  | 'closed';

// Ticket priority (4 levels)
export type TicketPriority = 'low' | 'medium' | 'high' | 'critical';

// Department routing types
export type RoutingType = 'roster_based' | 'all_notify';

// SLA status
export type SLAStatus = 'safe' | 'warning' | 'critical' | 'breached';

// Notification types
export type NotificationType =
  | 'ticket_assigned'
  | 'sla_warning'
  | 'ticket_resolved'
  | 'new_comment'
  | 'payment_initiated'
  | 'ticket_escalated'
  | 'ticket_transferred';

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

export interface Department {
  id: string;
  name: string;
  headId: string; // user id
  memberIds: string[];
  routing: RoutingType;
  sla: SLAConfig;
  activeTicketCount: number;
  teamsWebhook: string;
  description: string;
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
  assigneeId: string | null;
  assigneeName?: string | null;
  assigneeInitials?: string | null;
  assigneeColor?: string | null;
  requestorId: string;
  requestorName?: string | null;
  requestorInitials?: string | null;
  slaStatus?: SLAStatus;
  slaResolutionDeadline?: string | null;
  slaResponseDeadline?: string | null;
  commentCount?: number;
  attachmentCount?: number;
  createdAt: string; // ISO
  updatedAt: string; // ISO
  resolvedAt: string | null;
  closedAt: string | null;
  comments: Comment[];
  attachments: Attachment[];
  linkedTicketIds: string[];
  transferHistory: TransferEntry[];
  tags: string[];
}

export interface TransferEntry {
  id: string;
  fromDeptId: string;
  toDeptId: string;
  byUserId: string;
  note: string;
  timestamp: string;
}

export interface Shift {
  id: string;
  userId: string;
  departmentId: string;
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
  createdAt: string; // ISO
  isRead: boolean;
}

export interface AnalyticsData {
  monthlyVolume: MonthlyVolume[];
  slaCompliance: SLACompliance[];
  ticketsByStatus: ChartDataPoint[];
  ticketsByPriority: ChartDataPoint[];
  avgResolutionTime: DeptResolutionTime[];
  topRequestors: TopRequestor[];
  recentBreaches: SLABreach[];
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
  amount: number;
  currency: string;
  status: PaymentStatus;
  method: PaymentMethod;
  initiatedBy: string; // user id
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
  search: string;
}
