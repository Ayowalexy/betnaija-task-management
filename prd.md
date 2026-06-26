# FlowDesk — Frontend Build Prompt v1.0
## React + Vite | Frontend Only | Dummy Data

---

## CONTEXT

You are building the complete frontend for FlowDesk, an internal ticketing
and operations management platform. Use the attached PRD (FlowDesk_PRD_v1.0.docx)
as your product specification — every screen, user role, and feature described
in it must be represented in the UI.

All data is mocked. No backend, no API calls, no environment variables.
The goal is a fully navigable, interactive frontend that looks and behaves
like a production application.

---

## DESIGN SYSTEM & CREATIVE DIRECTION

These Figma frames are your sole visual reference. Extract every color token,
typography scale, spacing value, border radius, shadow, and component pattern
directly from them. Do not invent UI patterns not represented in these designs.

- Light mode:       https://www.figma.com/design/uPsFBWbNbSpdAO8qpqHabm/Task--Management--Web-App-Design--Community-?node-id=2-3
- Dark mode:        https://www.figma.com/design/uPsFBWbNbSpdAO8qpqHabm/Task--Management--Web-App-Design--Community-?node-id=2-312
- Task/Ticket page: https://www.figma.com/design/uPsFBWbNbSpdAO8qpqHabm/Task--Management--Web-App-Design--Community-?node-id=2-1331
- Messages page:    https://www.figma.com/design/uPsFBWbNbSpdAO8qpqHabm/Task--Management--Web-App-Design--Community-?node-id=2-3592

Implement both light and dark modes from day one using CSS custom properties.
Theme preference must persist to localStorage. A toggle in the topbar switches
between them instantly.

---

## TECH STACK

- React 18 with TypeScript (strict mode)
- Vite
- React Router v6
- Zustand for global state
- React Hook Form + Zod for all forms
- date-fns for date/time formatting and calculations
- Lucide React for icons
- Recharts for analytics charts
- CSS Modules for all component styles (no Tailwind, no styled-components,
  no component libraries like MUI or Chakra)

No Axios, no TanStack Query, no Socket.io — all data comes from mock files.

---

## PROJECT STRUCTURE

Scaffold this exact structure:

lowdesk-web/

├── public/

├── src/

│   ├── assets/

│   ├── components/

│   │   ├── ui/               # Primitives: Button, Input, Select, Modal,

│   │   │                     # Badge, Avatar, Tooltip, Dropdown, Tabs,

│   │   │                     # Toast, Checkbox, Textarea, FileUpload

│   │   ├── layout/           # AppShell, Sidebar, Topbar, PageWrapper

│   │   └── shared/           # DataTable, EmptyState, ConfirmDialog,

│   │                         # SkeletonLoader, ErrorBoundary, SLACountdown

│   ├── features/

│   │   ├── auth/

│   │   │   ├── components/

│   │   │   ├── hooks/

│   │   │   └── types.ts

│   │   ├── tickets/

│   │   │   ├── components/

│   │   │   ├── hooks/

│   │   │   └── types.ts

│   │   ├── departments/

│   │   │   ├── components/

│   │   │   ├── hooks/

│   │   │   └── types.ts

│   │   ├── users/

│   │   │   ├── components/

│   │   │   ├── hooks/

│   │   │   └── types.ts

│   │   ├── roster/

│   │   │   ├── components/

│   │   │   ├── hooks/

│   │   │   └── types.ts

│   │   ├── chat/

│   │   │   ├── components/

│   │   │   ├── hooks/

│   │   │   └── types.ts

│   │   ├── analytics/

│   │   │   ├── components/

│   │   │   ├── hooks/

│   │   │   └── types.ts

│   │   ├── notifications/

│   │   │   ├── components/

│   │   │   ├── hooks/

│   │   │   └── types.ts

│   │   └── payments/

│   │       ├── components/

│   │       ├── hooks/

│   │       └── types.ts

│   ├── hooks/                # Shared hooks: useTheme, useToast, useModal,

│   │                         # useDebounce, useLocalStorage, usePagination

│   ├── mocks/                # ALL dummy data lives here

│   │   ├── users.ts

│   │   ├── departments.ts

│   │   ├── tickets.ts

│   │   ├── roster.ts

│   │   ├── chat.ts

│   │   ├── notifications.ts

│   │   ├── analytics.ts

│   │   └── payments.ts

│   ├── pages/                # Route-level components (thin wrappers only)

│   ├── router/

│   │   ├── index.tsx         # Route definitions

│   │   └── guards.tsx        # Role-based route guards

│   ├── store/

│   │   ├── authStore.ts      # Current user, role, theme

│   │   ├── ticketStore.ts    # Active filters, selected ticket

│   │   └── uiStore.ts        # Sidebar state, active modal, toasts

│   ├── styles/

│   │   ├── tokens.css        # ALL CSS custom properties from Figma

│   │   ├── typography.css    # Font imports and text scale

│   │   ├── reset.css

│   │   └── global.css

│   ├── types/

│   │   └── index.ts          # All shared TypeScript interfaces

│   └── main.tsx

├── index.html

├── vite.config.ts

└── tsconfig.json

---

## MOCK DATA REQUIREMENTS

All mock data goes in src/mocks/. Make it realistic and rich enough to
demonstrate every feature. Specifically:

**users.ts** — minimum 12 users across 4 departments. Include at least:
- 1 Root Admin
- 4 Department Heads (Tech, HR, Finance, Facilities)
- 7 Team Members spread across departments
- Vary: names, avatar initials/colors, join dates, online status

**departments.ts** — 4 departments minimum:
- Technology (routing: roster-based, SLA: 30min response / 4hr resolution)
- Human Resources (routing: all-notify, SLA: 1hr response / 1 day resolution)
- Finance (routing: all-notify, SLA: 2hr response / 2 day resolution)
- Facilities (routing: all-notify, SLA: 4hr response / 3 day resolution)

**tickets.ts** — minimum 25 tickets with variety across:
- All 8 status types (Open, In Progress, Pending, Transferred, Defaulted,
  Escalated, Resolved, Closed)
- All 4 priority levels (Low, Medium, High, Critical)
- All 4 departments as targets
- Mix of single-department and multi-department (transferred) tickets
- Some with SLA already breached (created_at in the past beyond SLA window)
- Some with active conversation threads (3–5 comments per ticket)
- Some with file attachments listed
- Some linked to other tickets
- Realistic titles: "Laptop not connecting to VPN", "Request new desk chair",
  "Expense reimbursement – April trip", "AC unit broken in meeting room B", etc.

**roster.ts** — 2 weeks of shifts for the Tech department with realistic
rotation across team members including some gaps (to test empty shift state)

**chat.ts** — 6 conversations (4 direct messages, 2 group chats) with
realistic message history, read receipts, and timestamps

**notifications.ts** — 15 notifications of different types (ticket assigned,
SLA warning, ticket resolved, new comment, payment initiated, etc.) with a
mix of read and unread

**analytics.ts** — Realistic numbers for all dashboard widgets:
- Monthly ticket volumes for the past 6 months (for line chart)
- SLA compliance rates per department (for bar chart)
- Ticket distribution by status and priority (for pie/donut charts)
- Average resolution times per department
- Top 5 requestors
- Recent SLA breaches list

**payments.ts** — 8 payment transactions with mix of statuses
(Pending, Completed, Failed), different methods, and linked ticket IDs

---

## SCREENS TO BUILD

Build every screen fully. No placeholder "coming soon" pages.

### Auth Screens
**Login** — Email + password form. Below the form, add a dev-only role
switcher (visible only in development): a row of buttons labelled
"Login as Root Admin", "Login as Dept Head", "Login as Team Member".
Clicking any sets the mock user in authStore and redirects to dashboard.
This is the primary navigation mechanism for reviewing all role views.

**Force Password Reset** — Shown on first login. New password + confirm
password fields with strength indicator. On submit, marks user as
onboarded and redirects to dashboard.

---

### Root Admin Screens

**Dashboard** — All widgets from PRD section 4.8.1:
- Stat cards: Total tickets, Open, In Progress, Defaulted (SLA breached),
  Resolved this week
- Line chart: Ticket volume over last 6 months
- Bar chart: SLA compliance rate by department
- Donut chart: Tickets by status
- Table: Overdue tickets (past SLA) with ticket title, department,
  assignee, time overdue
- Table: Tickets due this week
- "Generate PDF Report" button (shows a modal confirming date range,
  then triggers browser print/download — no actual PDF generation needed,
  just a realistic modal)

**All Tickets** — Full ticket list across all departments and all users.
Filters: Department (multi-select), Status (multi-select), Priority
(multi-select), Assignee, Date range. Search by ticket title or ID.
Sortable columns. Pagination (10 per page). Each row is clickable.

**Departments** — List of all departments as cards. Each card shows:
department name, head name, member count, routing type badge, SLA config,
active ticket count. "Create Department" button opens a slide-over form.
Click a card to go to the department detail page.

**Department Detail** — Shows: department settings (editable inline),
SLA config (editable), member list with roles, active roster preview,
recent tickets for this department, Teams webhook config field.

**Users** — Table of all users: name, email, department, role, status
(Active / Suspended), last login, date joined. Actions: View, Edit Role,
Suspend/Activate, Reset Password. "Add User" button opens a form.

**Analytics** — Full analytics page with all charts described in the
analytics mock data. Date range picker at the top applies to all charts.
"Export PDF" button.

**Settings** — Tabs: General (org name, logo upload placeholder),
Notifications (global defaults), Payment (Paystack key fields — masked
input, save button), SLA Defaults.

---

### Department Head Screens

**Dashboard** — Department-scoped widgets from PRD section 4.8.2:
- Stat cards for their department only
- Team workload chart (tickets per team member — horizontal bar)
- Current on-duty member card (for roster departments)
- SLA compliance gauge
- Recent activity feed

**Department Tickets** — Same as All Tickets but pre-filtered to their
department. Cannot see other departments' tickets.

**Team Roster** — Calendar/schedule view showing current week's shifts.
Week navigation (prev/next). Each shift block shows member name and hours.
"Add Shift" button. "Import Excel" button (opens a modal with a drag-and-drop
file upload zone; parse the file with SheetJS and show a preview table
before confirming import).

**Team Members** — List of their department's members. Can add new members
(if permission delegated), suspend members (if delegated).

---

### Team Member Screens

**My Dashboard** — Personal view:
- My open tickets (assigned to me)
- Tickets I created
- Upcoming shifts (if in roster-based department)
- Recent notifications

**My Tickets** — Tickets assigned to me. Tabs: Active, Resolved, All.

---

### Shared Screens (all roles)

**Ticket List** (role-scoped as above)

**Ticket Detail** — The most important screen. Build it to match the
Figma Task page design exactly. Must include:
- Left panel: Ticket title (editable inline for assignee/admin), description,
  status badge (clickable dropdown to change status — enforce valid transitions),
  priority badge, department badge, SLA countdown chip (live, color-coded),
  assignee avatar + name, requestor info, created date, linked tickets
- Right panel: Conversation thread
  - Comment input with rich text toolbar (bold, italic, bullet list, code),
    file attachment button, @mention trigger (shows user dropdown)
  - Existing comments with: author avatar, name, timestamp, content,
    reply button, emoji reaction picker, edit/delete for own comments
  - File attachments shown as chips with file type icon and name
  - Transfer history entries shown inline in the thread with a different
    visual treatment (e.g., activity pill: "Transferred to Finance by Amaka")
- Action bar (shown based on role/status):
  - "Accept Ticket" (when Open and routed to me)
  - "Transfer to Department" (dropdown of other departments + note field)
  - "Mark Resolved" 
  - "Initiate Payment" (if Finance dept and status is Resolved)
  - "Escalate" (Dept Head only)

**Create Ticket** — Full form matching PRD fields. Department dropdown
changes the visible SLA info below it (shows selected dept's SLA times).
File drag-and-drop upload zone. Submit shows optimistic UI (adds to list
immediately).

**Chat** — Full-screen chat layout matching the Figma Messages page exactly.
Left panel: conversation list (DMs and groups) with unread badges, last
message preview, timestamp. Right panel: active conversation with message
bubbles, timestamps, read receipts, file attachment chips. Bottom: message
input with file attachment button and send button. "New Message" button
opens a user search modal to start a DM.

**Notifications** — Dropdown from topbar bell icon (shows last 10) AND
a full /notifications page. Each notification is clickable and navigates
to the relevant ticket. Mark all as read button. Unread count badge on the
bell icon.

**Profile** — Edit name, change password form, notification channel
preferences (Email on/off, Teams on/off, WhatsApp on/off per event type).

---

## COMPONENT REQUIREMENTS

### SLACountdown

useSLACountdown(createdAt: Date, slaDurationMs: number): {

timeRemaining: string   // "2h 14m" or "BREACHED"

percentElapsed: number  // 0–100

status: 'safe' | 'warning' | 'critical' | 'breached'

}

- Updates every second via setInterval, cleaned up on unmount
- 'warning' at 75% elapsed (yellow)
- 'critical' at 90% elapsed (red, pulse animation)
- 'breached' at 100% (red solid, "BREACHED" text)
- Renders as a pill/chip on ticket cards and a progress bar on ticket detail

### DataTable
Generic, reusable table component:
- Column definitions with: key, header, render function, sortable flag, width
- Built-in sort (client-side on mock data)
- Built-in pagination with configurable page size
- Row click handler
- Loading skeleton state (animated shimmer rows)
- Empty state slot (accepts a component)
- Checkbox column for bulk selection (optional)

### Toast System
- Custom hook: useToast() returns { toast }
- toast({ type: 'success' | 'error' | 'warning' | 'info', message, duration? })
- Renders fixed bottom-right, stacks up to 3, auto-dismisses
- Smooth slide-in/out animation using CSS transitions

### Modal / ConfirmDialog
- useModal() hook returns { open, close, isOpen }
- Renders in a portal (document.body)
- Backdrop click closes (unless confirmDialog)
- Keyboard: Escape closes, Tab traps focus inside
- ConfirmDialog: title, description, confirm button (danger variant), cancel button

### Sidebar
Match Figma design exactly. Must show:
- Organization logo/name at top
- Navigation links grouped by section (each with icon + label)
- Active state on current route
- Unread notification badge on bell link
- Unread chat badge on messages link
- Current user avatar + name + role at bottom
- Collapse to icon-only mode (toggle button, state persisted to localStorage)
- On mobile: hidden by default, opens as overlay on hamburger click

### Role-Based Navigation
The sidebar links shown depend on the current user's role:

Root Admin: Dashboard, All Tickets, Departments, Users, Analytics, Chat,
Notifications, Settings

Department Head: Dashboard, Department Tickets, Team Roster, Team Members,
Chat, Notifications, Profile

Team Member: My Dashboard, My Tickets, Create Ticket, Chat,
Notifications, Profile

---

## STATE MANAGEMENT

### authStore (Zustand)
```typescript
{
  currentUser: User | null
  isAuthenticated: boolean
  isFirstLogin: boolean
  theme: 'light' | 'dark'
  login: (user: User) => void
  logout: () => void
  setTheme: (theme: 'light' | 'dark') => void
}
```

### ticketStore (Zustand)
```typescript
{
  tickets: Ticket[]
  filters: TicketFilters
  selectedTicketId: string | null
  setFilters: (filters: Partial<TicketFilters>) => void
  updateTicket: (id: string, updates: Partial<Ticket>) => void
  addComment: (ticketId: string, comment: Comment) => void
  transferTicket: (ticketId: string, toDeptId: string, note: string) => void
}
```

### uiStore (Zustand)
```typescript
{
  sidebarCollapsed: boolean
  sidebarMobileOpen: boolean
  toasts: Toast[]
  setSidebarCollapsed: (v: boolean) => void
  addToast: (toast: Omit<Toast, 'id'>) => void
  removeToast: (id: string) => void
}
```

---

## ROUTING

/login                          → LoginPage

/reset-password                 → ForceResetPage
/dashboard                      → role-based dashboard

/tickets                        → scoped ticket list

/tickets/new                    → CreateTicketPage

/tickets/:id                    → TicketDetailPage
/departments                    → DepartmentsPage (admin only)

/departments/:id                → DepartmentDetailPage (admin only)
/users                          → UsersPage (admin only)
/roster                         → RosterPage (dept head only)

/team                           → TeamMembersPage (dept head only)
/analytics                      → AnalyticsPage (admin + dept head)
/chat                           → ChatPage

/chat/:conversationId           → ChatPage (with active conversation)
/notifications                  → NotificationsPage
/settings                       → SettingsPage (admin only)

/profile                        → ProfilePage

Route guards redirect to /dashboard if authenticated user tries to access
/login. Redirect to /login if unauthenticated. Redirect to /dashboard with
a toast error if a role accesses a route they don't have permission for.

---

## CODING STANDARDS

- TypeScript strict mode. No `any`. All mock data must be fully typed.
- One CSS module file per component. All values from CSS custom properties.
  Never hardcode colors or spacing values in component CSS.
- No component exceeds 150 lines. Extract logic to hooks, split large
  components into sub-components.
- Pages are thin: they compose feature components. No business logic in pages.
- All form validation defined as Zod schemas in a schemas.ts file within
  the feature folder. React Hook Form consumes the Zod schema via zodResolver.
- Every list screen has: search, filters, empty state, loading skeleton,
  and pagination.
- Every form has: field-level validation on blur, submit button loading state,
  success/error toast on completion.
- Every destructive action has a ConfirmDialog.
- Wrap every major route in an ErrorBoundary with a friendly fallback UI.

---

## WHAT NOT TO DO

- No component libraries (no MUI, Ant Design, Chakra, shadcn, Radix).
  Every UI element built from scratch to match the Figma.
- No Tailwind CSS.
- No API calls. No fetch(). No Axios. Dummy data only.
- No any TypeScript type suppression.
- No inline styles except for dynamic computed values (e.g., SLA bar width
  as a style prop: style={{ width: `${percent}%` }}).
- No God components over 150 lines.
- No business logic in page-level components.
- Do not skip the dev role switcher on the login screen — it is critical
  for reviewing all three role experiences without a backend.