# FlowDesk Frontend Integration Guide

## Overview

FlowDesk is a role-based task management system. The backend is a NestJS 11 REST API authenticated via Keycloak. This guide covers everything the frontend needs to integrate end-to-end.

---

## Base URL

| Environment | URL |
|-------------|-----|
| Development | `http://localhost:3000/api/v1` |
| Production  | `https://<your-domain>/api/v1` |

All responses are wrapped by the `TransformInterceptor`:
```json
{
  "data": { ... },
  "statusCode": 200,
  "message": "Success"
}
```
Errors follow RFC 7807 via `HttpExceptionFilter`:
```json
{
  "statusCode": 404,
  "message": "User abc123 not found",
  "error": "Not Found"
}
```

---

## Authentication

FlowDesk uses **Keycloak** for identity. The frontend calls the backend's auth endpoints directly — do not call Keycloak endpoints from the frontend.

### Headers

```
Authorization: Bearer <access_token>
Content-Type: application/json
```

### Login

```http
POST /auth/login
Content-Type: application/json

{ "email": "user@flowdesk.io", "password": "Password123!" }
```

Response:
```json
{
  "accessToken": "eyJhbGciOiJSUzI1...",
  "refreshToken": "eyJhbGciOiJIUzI1...",
  "expiresIn": 300
}
```

Store both tokens. Attach `accessToken` as `Authorization: Bearer <accessToken>` on every subsequent request.

### Token Refresh

```http
POST /auth/refresh
Content-Type: application/json

{ "refreshToken": "<refresh_token>" }
```

Returns the same shape as Login. Auto-refresh before the token expires using the `expiresIn` value.

### Logout

```http
POST /auth/logout
Content-Type: application/json

{ "refreshToken": "<refresh_token>" }
```

Returns `204 No Content`. Clear both tokens from storage.

### First Login Flow

After `GET /auth/me`, check `isFirstLogin`. If `true`, redirect to a "set your password" screen and call:

```http
PATCH /auth/set-password
Authorization: Bearer <access_token>
Content-Type: application/json

{ "newPassword": "MyNewPermanentPassword123!" }
```

This sets a permanent password in Keycloak (removes the `UPDATE_PASSWORD` required action) and marks `isFirstLogin = false`. Minimum 8 characters.

### Forgot Password Flow

Three-step flow — all endpoints are public (no Bearer token needed):

**Step 1 — Request OTP**
```http
POST /auth/forgot-password
Content-Type: application/json

{ "email": "amaka@flowdesk.io" }
```
Always returns `200` with a generic message (prevents email enumeration). The user receives a 6-digit OTP by email, valid for **10 minutes**.

**Step 2 — Submit OTP + new password**
```http
POST /auth/reset-password
Content-Type: application/json

{
  "email": "amaka@flowdesk.io",
  "otp": "482910",
  "newPassword": "MyNewPassword123!"
}
```

| Status | Meaning |
|--------|---------|
| 200 | Success — password changed, OTP consumed |
| 400 `"OTP has expired..."` | OTP TTL elapsed or never requested — prompt user to restart |
| 400 `"Invalid OTP"` | Wrong code entered |

**Step 3 — Redirect to login**
After a 200 response the user can log in immediately with their new password.

---

## Role System

Every user has exactly one role, stored in Keycloak realm roles and the local DB.

| Role | Value | Access |
|------|-------|--------|
| Root Admin | `root_admin` | Full system access |
| Department Head | `dept_head` | Own department only |
| Team Member | `team_member` | Own tickets only |

Read the authenticated user's role from `GET /auth/me` → `role` field, or from the decoded JWT `realm_access.roles` array.

---

## User Object Shape

```typescript
interface User {
  id: string;            // UUID — use this for all API calls
  kcId: string;          // Keycloak user ID
  name: string;
  email: string;
  role: 'root_admin' | 'dept_head' | 'team_member';
  departmentId: string | null;
  status: 'active' | 'suspended';
  avatarInitials: string;  // Derived from name
  avatarColor: string;     // Hex colour e.g. "#4F6EF7"
  joinDate: string;        // ISO datetime
  lastLogin: string | null;
  isOnline: boolean;
  isFirstLogin: boolean;
  notificationPrefs: {
    email: boolean;
    teams: boolean;
    whatsapp: boolean;
    sms: boolean;
  };
  phoneNumber: string | null;
}
```

---

## Ticket Object Shape

```typescript
// List item (summary)
interface TicketSummary {
  id: string;
  title: string;
  status: TicketStatus;
  priority: TicketPriority;
  departmentId: string;
  departmentName: string | null;
  assigneeId: string | null;
  assigneeName: string | null;
  assigneeInitials: string | null;
  requestorId: string;
  requestorName: string | null;
  slaStatus: SlaStatus;
  slaResolutionDeadline: string;   // ISO datetime
  tags: string[];
  commentCount: number;
  attachmentCount: number;
  createdAt: string;
  updatedAt: string;
}

// Detail view (GET /tickets/:id)
interface TicketDetail extends TicketSummary {
  description: string;
  slaResponseDeadline: string;
  resolvedAt: string | null;
  closedAt: string | null;
  assignee: { id: string; name: string; avatarInitials: string; avatarColor: string } | null;
  requestor: { id: string; name: string; avatarInitials: string; avatarColor: string } | null;
  linkedTicketIds: string[];
  linkedTickets: { id: string; title: string; status: TicketStatus }[];
  transferHistory: TransferRecord[];
  comments: Comment[];
  attachments: Attachment[];
}

type TicketStatus = 'open' | 'in_progress' | 'pending' | 'transferred' | 'defaulted' | 'escalated' | 'resolved' | 'closed';
type TicketPriority = 'low' | 'medium' | 'high' | 'critical';
type SlaStatus = 'safe' | 'warning' | 'critical' | 'breached';
```

---

## Paginated Responses

All list endpoints return:
```json
{
  "data": [...],
  "total": 150,
  "page": 1,
  "limit": 25
}
```

Query params: `?page=1&limit=25`

---

## Endpoint Reference

### Auth

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/auth/login` | Public | Email + password → accessToken + refreshToken |
| POST | `/auth/refresh` | Public | Exchange refresh token → new access token |
| POST | `/auth/logout` | Public | Revoke refresh token (204) |
| GET | `/auth/me` | Bearer | Get own profile + update lastLogin |
| PATCH | `/auth/set-password` | Bearer | Set permanent password (first-login flow) |
| PATCH | `/auth/first-login-complete` | Bearer | Mark first login done (no password change) |
| POST | `/auth/forgot-password` | Public | Send 6-digit OTP to email (10-min TTL) |
| POST | `/auth/reset-password` | Public | Validate OTP + set new password |

### Users

| Method | Path | Roles | Description |
|--------|------|-------|-------------|
| GET | `/users` | root_admin, dept_head | List users (dept_head scoped to own dept) |
| GET | `/users/:id` | root_admin, dept_head | Get user with ticket history |
| POST | `/users` | root_admin | Create user in Keycloak + DB |
| PATCH | `/users/:id` | Any (scoped) | Update user |
| DELETE | `/users/:id` | root_admin | Suspend user (soft) |
| PATCH | `/users/:id/reset-password` | root_admin | Force password reset |

### Departments

| Method | Path | Roles | Description |
|--------|------|-------|-------------|
| GET | `/departments` | root_admin, dept_head | List departments |
| GET | `/departments/:id` | root_admin, dept_head | Get with members |
| POST | `/departments` | root_admin | Create department |
| PATCH | `/departments/:id` | root_admin | Update |
| DELETE | `/departments/:id` | root_admin | Delete (fails if active tickets) |
| POST | `/departments/:id/members` | root_admin | Add member |
| DELETE | `/departments/:id/members/:userId` | root_admin | Remove member |

### Tickets

| Method | Path | Roles | Description |
|--------|------|-------|-------------|
| GET | `/tickets` | Any | List tickets (role-scoped) |
| GET | `/tickets/:id` | Any | Full ticket detail |
| POST | `/tickets` | Any | Create ticket (multipart) |
| PATCH | `/tickets/:id` | Any | Edit title/desc/priority/tags |
| PATCH | `/tickets/:id/assign` | Any | Assign to user |
| PATCH | `/tickets/:id/transfer` | dept_head, root_admin | Transfer to another dept |
| PATCH | `/tickets/:id/escalate` | dept_head, root_admin | Escalate to critical |
| PATCH | `/tickets/:id/resolve` | assignee, dept_head, root_admin | Mark resolved |
| PATCH | `/tickets/:id/close` | dept_head, root_admin | Mark closed |
| POST | `/tickets/:id/comments` | Any | Add comment (multipart) |
| PATCH | `/tickets/:id/comments/:id` | author | Edit comment |
| DELETE | `/tickets/:id/comments/:id` | author, root_admin | Delete comment |
| POST | `/tickets/:id/comments/:id/reactions` | Any | Toggle emoji reaction |

### Notifications

| Method | Path | Description |
|--------|------|-------------|
| GET | `/notifications` | List own notifications |
| PATCH | `/notifications/read-all` | Mark all read |
| PATCH | `/notifications/:id/read` | Mark one read |
| DELETE | `/notifications/:id` | Delete notification |
| GET | `/notifications/stream` | SSE real-time stream |

### Real-Time Notifications (SSE)

Connect to the SSE stream for live updates:

```typescript
const es = new EventSource(
  `${BASE_URL}/notifications/stream?access_token=${accessToken}`
);

es.addEventListener('notification', (e) => {
  const notification = JSON.parse(e.data);
  // Update notification badge / toast
});

es.addEventListener('ping', () => {
  // Keepalive — ignore or log
});

es.onerror = () => {
  // Reconnect with exponential backoff
  es.close();
};
```

> **Important:** The query param must be `access_token` (not `token`). Reconnect on error with backoff. Refresh the access token before it expires and reconnect with the new one.

### Notification Object

```typescript
interface Notification {
  id: string;
  userId: string;
  type: 'ticket_assigned' | 'ticket_resolved' | 'ticket_transferred' | 'ticket_escalated' | 'new_comment' | 'new_ticket' | 'sla_warning';
  title: string;
  message: string;
  ticketId: string | null;
  isRead: boolean;
  createdAt: string;
}
```

### Roster

| Method | Path | Roles | Description |
|--------|------|-------|-------------|
| GET | `/roster` | Any | List shifts (role-scoped, defaults to current month) |
| POST | `/roster` | root_admin, dept_head | Create shift |
| PATCH | `/roster/:id` | root_admin, dept_head | Update shift |
| DELETE | `/roster/:id` | root_admin, dept_head | Delete shift |

### Payments

| Method | Path | Roles | Description |
|--------|------|-------|-------------|
| POST | `/payments/paystack/webhook` | Public | Paystack webhook (do not call from FE) |
| GET | `/payments` | root_admin, dept_head | List payments |
| GET | `/payments/:id` | root_admin, dept_head | Get payment |
| POST | `/payments` | root_admin, dept_head | Create payment |
| PATCH | `/payments/:id/complete` | root_admin, dept_head | Mark complete |
| PATCH | `/payments/:id/fail` | root_admin | Mark failed |

### Analytics

```http
GET /analytics?dateFrom=2026-06-01&dateTo=2026-06-30&departmentId=<uuid>
```

Roles: root_admin (all depts), dept_head (own dept only, departmentId ignored).

### Settings

All settings endpoints require `root_admin`.

| Method | Path | Description |
|--------|------|-------------|
| GET | `/settings` | Get org settings |
| PATCH | `/settings` | Update org settings |
| POST | `/settings/logo` | Upload logo (multipart, field: `file`) |

### Files

| Method | Path | Description |
|--------|------|-------------|
| POST | `/files/upload` | Upload file (`?context=ticket&ticketId=<uuid>`) |
| DELETE | `/files/:id` | Delete file |

Attachment URLs returned from `GET /tickets/:id` are pre-signed Cloudinary URLs.

### Chat (Stream.io)

| Method | Path | Description |
|--------|------|-------------|
| GET | `/chat/token` | Get Stream.io user token |
| POST | `/chat/provision-user` | Register user in Stream.io (call on first login) |
| POST | `/chat/channels` | Create DM or group channel |

### Profile

| Method | Path | Description |
|--------|------|-------------|
| GET | `/profile` | Get own profile |
| PATCH | `/profile` | Update name, avatar, phone, notif prefs |
| PATCH | `/profile/password` | Change password (requires currentPassword) |

---

## Multipart Upload (Tickets & Comments)

When creating tickets or comments with file attachments, use `multipart/form-data`:

```typescript
const form = new FormData();
form.append('title', 'Issue title');
form.append('description', 'Description text');
form.append('priority', 'high');
form.append('departmentId', departmentId);
form.append('tags[0]', 'bug');
// Attach up to 10 files
files.forEach((file) => form.append('files[]', file));

await fetch(`${BASE_URL}/tickets`, {
  method: 'POST',
  headers: { Authorization: `Bearer ${accessToken}` },
  body: form,
});
```

> Do **not** set `Content-Type` manually — the browser sets it with the correct boundary.

---

## Error Handling

| Status | Meaning |
|--------|---------|
| 400 | Validation failed — check `message` array for field errors |
| 401 | Missing or expired Bearer token |
| 403 | Insufficient role/ownership |
| 404 | Resource not found |
| 409 | Conflict (e.g. delete dept with active tickets) |
| 500 | Internal server error |

---

## SLA Status Display Guide

| `slaStatus` | Colour | Label |
|-------------|--------|-------|
| `safe` | Green | On Track |
| `warning` | Yellow | Due Soon |
| `critical` | Orange | At Risk |
| `breached` | Red | SLA Breached |

Display `slaResolutionDeadline` as a countdown timer. Update via the SSE `sla_warning` notification type.

---

## Ticket Status Flow

```
open → in_progress → resolved → closed
      ↓
   transferred (resets dept + SLA)
      ↓
   escalated (priority forced to critical)
      ↓
   defaulted (set by SLA breach cron)
```

---

## Recommended Frontend Architecture

```
src/
  api/
    auth.ts          → /auth/* endpoints
    users.ts         → /users/*
    departments.ts   → /departments/*
    tickets.ts       → /tickets/*
    roster.ts        → /roster/*
    notifications.ts → /notifications/* + SSE hook
    payments.ts      → /payments/*
    analytics.ts     → /analytics
    settings.ts      → /settings/*
    files.ts         → /files/*
    chat.ts          → /chat/*
    profile.ts       → /profile/*
  hooks/
    useNotifications.ts   → SSE connection + reconnect logic
    useCurrentUser.ts     → /auth/me + role helpers
  lib/
    apiClient.ts          → Axios/fetch with token interceptor + 401 refresh
    keycloak.ts           → keycloak-js setup
```

### Token Interceptor Pattern

```typescript
// Refresh on 401 automatically
apiClient.interceptors.response.use(
  (res) => res,
  async (err) => {
    if (err.response?.status === 401 && !err.config._retry) {
      err.config._retry = true;
      const { accessToken, refreshToken } = await authApi.refresh(getRefreshToken());
      storeTokens(accessToken, refreshToken);
      err.config.headers.Authorization = `Bearer ${accessToken}`;
      return apiClient(err.config);
    }
    return Promise.reject(err);
  }
);
```
