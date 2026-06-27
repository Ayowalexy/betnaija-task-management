# FlowDesk — Backend PRD

**Version:** 1.0  
**Date:** 2026-06-26  
**Scope:** Complete backend specification to replace all frontend mock data and power every page of the FlowDesk SPA.

---

## Table of Contents

1. [Architecture Overview](#1-architecture-overview)
2. [Technology Stack](#2-technology-stack)
3. [Authentication & Authorization (Keycloak)](#3-authentication--authorization-keycloak)
4. [Database Schema (PostgreSQL)](#4-database-schema-postgresql)
5. [API Reference](#5-api-reference)
6. [File Storage (Cloudinary)](#6-file-storage-cloudinary)
7. [Chat Integration (Stream.io)](#7-chat-integration-streamio)
8. [Notification Service](#8-notification-service)
9. [Analytics](#9-analytics)
10. [Caching Strategy (Redis)](#10-caching-strategy-redis)
11. [SLA Engine](#11-sla-engine)
12. [Payment Integration (Paystack)](#12-payment-integration-paystack)
13. [Environment Variables](#13-environment-variables)

---

## 1. Architecture Overview

```
┌──────────────────────────────────────────────────────┐
│                   React SPA (Frontend)               │
└───────────────────────┬──────────────────────────────┘
                        │ HTTP / WebSocket
┌───────────────────────▼──────────────────────────────┐
│               NestJS Monolith API                    │
│  /api/v1/*   (REST + SSE for real-time events)       │
│                                                      │
│  Modules:                                            │
│  auth · users · departments · tickets · roster       │
│  notifications · payments · analytics · chat         │
│  files · settings                                    │
└──┬──────────┬──────────┬──────────┬──────────────────┘
   │          │          │          │
   ▼          ▼          ▼          ▼
PostgreSQL  Redis     Stream.io  Keycloak
(primary)  (cache +  (chat +     (IAM)
           SLA jobs)  presence)
           
                      Cloudinary  (file storage)
                      Resend      (email)
                      Twilio      (SMS + WhatsApp)
                      Teams       (webhook)
```

**Key design decisions:**
- Monolith with feature modules. No microservices.
- All writes go to PostgreSQL. Redis caches hot reads (analytics, ticket lists) and holds SLA job payloads.
- Stream.io owns all chat history and real-time delivery. We only store conversation metadata in Postgres.
- Keycloak owns credentials and sessions. Our DB holds a `users` table that syncs user profile data; the Keycloak user ID (`kc_id`) is the shared key.
- Every ticket lifecycle event (create, assign, resolve, transfer, escalate, close, comment) fires through a shared `TicketEventEmitter` which fans out to: in-app notifications, email, SMS, WhatsApp, Teams webhook.

---

## 2. Technology Stack

| Layer | Choice | Version |
|-------|--------|---------|
| Runtime | Node.js | 22 LTS |
| Framework | NestJS | 11 |
| ORM | TypeORM | 0.3 |
| Database | PostgreSQL | 16 |
| Cache / Queues | Redis (ioredis) + BullMQ | Redis 7 |
| Auth / IAM | Keycloak | 25 |
| Chat | Stream.io (stream-chat) | latest |
| File storage | Cloudinary | Node SDK v2 |
| Email | Resend | latest |
| SMS & WhatsApp | Twilio | latest |
| Teams | Incoming Webhook (HTTP POST) | — |
| Payments | Paystack | Node SDK |
| Validation | class-validator + class-transformer | — |
| Config | @nestjs/config | — |
| API docs | Swagger (@nestjs/swagger) | — |
| Testing | Jest + Supertest | — |

---

## 3. Authentication & Authorization (Keycloak)

### 3.1 Realm Configuration

Create a Keycloak realm named `flowdesk`.

**Realm settings:**
- Access token lifespan: 15 minutes
- Refresh token lifespan: 24 hours
- Brute force protection: enabled (5 attempts, 30-second wait)
- Registration: disabled (admin-only user creation)
- Remember Me: enabled

### 3.2 Roles

Create the following realm roles (not client roles):

| Role Name | Description |
|-----------|-------------|
| `root_admin` | Full system access |
| `dept_head` | Access to own department + analytics |
| `team_member` | Access to own tickets + roster |

All users are assigned exactly **one** role. The NestJS backend reads the role from the JWT `realm_access.roles` claim.

### 3.3 Client Configuration

Create a Keycloak client named `flowdesk-backend`:
- Client authentication: ON (confidential)
- Grant types: Authorization Code + Refresh Token (for the SPA), Client Credentials (for backend-to-backend)
- Valid redirect URIs: `http://localhost:5174/*` (dev), `https://<prod-domain>/*`
- Web origins: `+` (same as redirect URIs)

The SPA uses the `flowdesk-web` public client (Authorization Code + PKCE).

### 3.4 Custom JWT Claims

Add a Keycloak Mapper to include `departmentId` in the token:
- Mapper type: User Attribute
- User attribute: `department_id`
- Token claim name: `department_id`
- Add to: Access Token, UserInfo

### 3.5 NestJS Integration

Use `@nestjs/passport` + `passport-keycloak-bearer`:

```typescript
// JWT payload shape (from Keycloak access token)
interface KeycloakTokenPayload {
  sub: string;             // Keycloak user ID (kc_id)
  email: string;
  name: string;
  preferred_username: string;
  realm_access: {
    roles: string[];       // contains 'root_admin' | 'dept_head' | 'team_member'
  };
  department_id: string | null;
}
```

**Guards:**

```typescript
@Roles('root_admin')
@UseGuards(AuthGuard('keycloak'), RolesGuard)
```

Every protected endpoint requires a valid Keycloak Bearer token. The `RolesGuard` extracts the role from `realm_access.roles` and compares against the `@Roles()` decorator.

### 3.6 First-Login Password Reset

When an admin creates a user, Keycloak sets a temporary password and marks `requiredActions: ['UPDATE_PASSWORD']`. The frontend detects `isFirstLogin: true` (from our DB) and redirects to `/reset-password`. The reset page calls Keycloak's Account API to change the password, which clears the required action. Our backend then sets `isFirstLogin = false` on the user record.

### 3.7 Role-Based Endpoint Access Matrix

| Resource | root_admin | dept_head | team_member |
|----------|-----------|-----------|-------------|
| GET /users | ✅ all users | ✅ own dept only | ❌ |
| POST /users | ✅ | ❌ | ❌ |
| GET /departments | ✅ | ✅ own | ❌ |
| POST /departments | ✅ | ❌ | ❌ |
| GET /tickets | ✅ all | ✅ own dept | ✅ own tickets |
| POST /tickets | ✅ | ✅ | ✅ |
| PATCH /tickets/:id/assign | ✅ | ✅ own dept | ❌ |
| PATCH /tickets/:id/transfer | ✅ | ✅ own dept | ❌ |
| PATCH /tickets/:id/escalate | ✅ | ✅ own dept | ❌ |
| PATCH /tickets/:id/resolve | ✅ | ✅ own dept | ✅ if assignee |
| PATCH /tickets/:id/close | ✅ | ✅ own dept | ❌ |
| GET /analytics | ✅ | ✅ own dept only | ❌ |
| GET /roster | ✅ | ✅ own dept | ✅ own shifts |
| POST /roster | ✅ | ✅ own dept | ❌ |
| GET /payments | ✅ | ✅ own dept | ❌ |
| POST /payments | ✅ finance dept_head | ✅ if finance | ❌ |
| GET /settings | ✅ | ❌ | ❌ |
| PATCH /settings | ✅ | ❌ | ❌ |
| GET /notifications | ✅ own | ✅ own | ✅ own |
| GET /chat/token | ✅ | ✅ | ✅ |

---

## 4. Database Schema (PostgreSQL)

All tables use UUID primary keys (gen_random_uuid()). Timestamps are `TIMESTAMPTZ`. Foreign keys have `ON DELETE SET NULL` unless otherwise noted.

### 4.1 users

```sql
CREATE TABLE users (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  kc_id           VARCHAR(255) UNIQUE NOT NULL,  -- Keycloak sub
  name            VARCHAR(255) NOT NULL,
  email           VARCHAR(255) UNIQUE NOT NULL,
  role            VARCHAR(50) NOT NULL CHECK (role IN ('root_admin','dept_head','team_member')),
  department_id   UUID REFERENCES departments(id) ON DELETE SET NULL,
  status          VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active','suspended')),
  avatar_color    VARCHAR(7) NOT NULL DEFAULT '#4F6EF7',  -- hex color
  join_date       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_login      TIMESTAMPTZ,
  is_online       BOOLEAN NOT NULL DEFAULT FALSE,
  is_first_login  BOOLEAN NOT NULL DEFAULT TRUE,
  notif_pref_email      BOOLEAN NOT NULL DEFAULT TRUE,
  notif_pref_teams      BOOLEAN NOT NULL DEFAULT FALSE,
  notif_pref_whatsapp   BOOLEAN NOT NULL DEFAULT FALSE,
  phone_number    VARCHAR(20),   -- for SMS/WhatsApp notifications
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_users_department ON users(department_id);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_email ON users(email);
```

**TypeORM Entity shape:**
```typescript
@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid') id: string;
  @Column({ unique: true }) kcId: string;
  @Column() name: string;
  @Column({ unique: true }) email: string;
  @Column() role: UserRole;
  @Column({ nullable: true }) departmentId: string | null;
  @Column({ default: 'active' }) status: UserStatus;
  @Column({ default: '#4F6EF7' }) avatarColor: string;
  @Column({ type: 'timestamptz' }) joinDate: Date;
  @Column({ nullable: true }) lastLogin: Date | null;
  @Column({ default: false }) isOnline: boolean;
  @Column({ default: true }) isFirstLogin: boolean;
  @Column({ default: true }) notifPrefEmail: boolean;
  @Column({ default: false }) notifPrefTeams: boolean;
  @Column({ default: false }) notifPrefWhatsapp: boolean;
  @Column({ nullable: true }) phoneNumber: string | null;
  @CreateDateColumn() createdAt: Date;
  @UpdateDateColumn() updatedAt: Date;
}
```

**Computed field `avatarInitials`:** derived server-side from `name` (first letter of first + last word). Never stored.

### 4.2 departments

```sql
CREATE TABLE departments (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name                  VARCHAR(255) UNIQUE NOT NULL,
  slug                  VARCHAR(100) UNIQUE NOT NULL,  -- 'tech', 'hr', etc.
  description           TEXT,
  head_id               UUID REFERENCES users(id) ON DELETE SET NULL,
  routing               VARCHAR(20) NOT NULL DEFAULT 'all_notify'
                          CHECK (routing IN ('roster_based','all_notify')),
  sla_response_ms       BIGINT NOT NULL DEFAULT 3600000,    -- 1 hour in ms
  sla_resolution_ms     BIGINT NOT NULL DEFAULT 86400000,   -- 24 hours in ms
  teams_webhook_url     TEXT,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_departments_head ON departments(head_id);
```

**Computed fields:** `activeTicketCount` and `memberIds` are computed via JOIN — not stored. `activeTicketCount` is cached in Redis.

### 4.3 department_members (join table)

```sql
CREATE TABLE department_members (
  department_id   UUID NOT NULL REFERENCES departments(id) ON DELETE CASCADE,
  user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  joined_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (department_id, user_id)
);

CREATE INDEX idx_dept_members_user ON department_members(user_id);
```

### 4.4 tickets

```sql
CREATE TABLE tickets (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title           VARCHAR(500) NOT NULL,
  description     TEXT NOT NULL,
  status          VARCHAR(30) NOT NULL DEFAULT 'open'
                    CHECK (status IN ('open','in_progress','pending','transferred',
                                      'defaulted','escalated','resolved','closed')),
  priority        VARCHAR(20) NOT NULL DEFAULT 'medium'
                    CHECK (priority IN ('low','medium','high','critical')),
  department_id   UUID NOT NULL REFERENCES departments(id) ON DELETE RESTRICT,
  assignee_id     UUID REFERENCES users(id) ON DELETE SET NULL,
  requestor_id    UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  resolved_at     TIMESTAMPTZ,
  closed_at       TIMESTAMPTZ,
  sla_response_deadline   TIMESTAMPTZ NOT NULL,  -- created_at + dept.sla_response_ms
  sla_resolution_deadline TIMESTAMPTZ NOT NULL,  -- created_at + dept.sla_resolution_ms
  sla_status      VARCHAR(20) NOT NULL DEFAULT 'safe'
                    CHECK (sla_status IN ('safe','warning','critical','breached')),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_tickets_department ON tickets(department_id);
CREATE INDEX idx_tickets_assignee ON tickets(assignee_id);
CREATE INDEX idx_tickets_requestor ON tickets(requestor_id);
CREATE INDEX idx_tickets_status ON tickets(status);
CREATE INDEX idx_tickets_priority ON tickets(priority);
CREATE INDEX idx_tickets_created_at ON tickets(created_at DESC);
CREATE INDEX idx_tickets_sla_deadline ON tickets(sla_resolution_deadline);
```

### 4.5 ticket_tags

```sql
CREATE TABLE ticket_tags (
  ticket_id   UUID NOT NULL REFERENCES tickets(id) ON DELETE CASCADE,
  tag         VARCHAR(100) NOT NULL,
  PRIMARY KEY (ticket_id, tag)
);
```

### 4.6 ticket_linked

```sql
CREATE TABLE ticket_linked (
  ticket_id         UUID NOT NULL REFERENCES tickets(id) ON DELETE CASCADE,
  linked_ticket_id  UUID NOT NULL REFERENCES tickets(id) ON DELETE CASCADE,
  PRIMARY KEY (ticket_id, linked_ticket_id),
  CHECK (ticket_id <> linked_ticket_id)
);
```

### 4.7 comments

```sql
CREATE TABLE comments (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id         UUID NOT NULL REFERENCES tickets(id) ON DELETE CASCADE,
  author_id         UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  content           TEXT NOT NULL,
  reply_to_id       UUID REFERENCES comments(id) ON DELETE SET NULL,
  is_edited         BOOLEAN NOT NULL DEFAULT FALSE,
  is_activity_entry BOOLEAN NOT NULL DEFAULT FALSE,
  activity_text     TEXT,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ
);

CREATE INDEX idx_comments_ticket ON comments(ticket_id);
CREATE INDEX idx_comments_author ON comments(author_id);
```

### 4.8 comment_reactions

```sql
CREATE TABLE comment_reactions (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  comment_id  UUID NOT NULL REFERENCES comments(id) ON DELETE CASCADE,
  user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  emoji       VARCHAR(10) NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (comment_id, user_id, emoji)
);
```

### 4.9 attachments

```sql
CREATE TABLE attachments (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name            VARCHAR(500) NOT NULL,
  mime_type       VARCHAR(100) NOT NULL,
  size_bytes      BIGINT NOT NULL,
  cloudinary_id   VARCHAR(500) NOT NULL,  -- Cloudinary public_id
  url             TEXT NOT NULL,          -- Cloudinary secure_url
  ticket_id       UUID REFERENCES tickets(id) ON DELETE CASCADE,
  comment_id      UUID REFERENCES comments(id) ON DELETE CASCADE,
  uploaded_by     UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CHECK (
    (ticket_id IS NOT NULL AND comment_id IS NULL) OR
    (ticket_id IS NULL AND comment_id IS NOT NULL)
  )
);

CREATE INDEX idx_attachments_ticket ON attachments(ticket_id);
CREATE INDEX idx_attachments_comment ON attachments(comment_id);
```

### 4.10 ticket_transfers

```sql
CREATE TABLE ticket_transfers (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id       UUID NOT NULL REFERENCES tickets(id) ON DELETE CASCADE,
  from_dept_id    UUID NOT NULL REFERENCES departments(id) ON DELETE RESTRICT,
  to_dept_id      UUID NOT NULL REFERENCES departments(id) ON DELETE RESTRICT,
  by_user_id      UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  note            TEXT,
  transferred_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_transfers_ticket ON ticket_transfers(ticket_id);
```

### 4.11 shifts (roster)

```sql
CREATE TABLE shifts (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  department_id   UUID NOT NULL REFERENCES departments(id) ON DELETE CASCADE,
  date            DATE NOT NULL,
  start_time      TIME NOT NULL,
  end_time        TIME NOT NULL,
  created_by      UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CHECK (start_time < end_time)
);

CREATE INDEX idx_shifts_user ON shifts(user_id);
CREATE INDEX idx_shifts_department ON shifts(department_id);
CREATE INDEX idx_shifts_date ON shifts(date);
```

### 4.12 notifications

```sql
CREATE TABLE notifications (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type        VARCHAR(50) NOT NULL CHECK (type IN (
                'ticket_assigned','sla_warning','ticket_resolved','new_comment',
                'payment_initiated','ticket_escalated','ticket_transferred'
              )),
  title       VARCHAR(500) NOT NULL,
  message     TEXT NOT NULL,
  ticket_id   UUID REFERENCES tickets(id) ON DELETE SET NULL,
  is_read     BOOLEAN NOT NULL DEFAULT FALSE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_notifications_user ON notifications(user_id);
CREATE INDEX idx_notifications_unread ON notifications(user_id, is_read) WHERE is_read = FALSE;
```

### 4.13 payments

```sql
CREATE TABLE payments (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id       UUID NOT NULL REFERENCES tickets(id) ON DELETE RESTRICT,
  amount          NUMERIC(15,2) NOT NULL,
  currency        CHAR(3) NOT NULL DEFAULT 'NGN',
  status          VARCHAR(20) NOT NULL DEFAULT 'pending'
                    CHECK (status IN ('pending','completed','failed')),
  method          VARCHAR(30) NOT NULL CHECK (method IN ('bank_transfer','paystack','cash')),
  paystack_ref    VARCHAR(255),   -- Paystack transaction reference
  initiated_by    UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  initiated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at    TIMESTAMPTZ,
  reference       VARCHAR(100) UNIQUE NOT NULL,  -- internal ref: FD-PAY-YYYY-NNNN
  description     TEXT NOT NULL
);

CREATE INDEX idx_payments_ticket ON payments(ticket_id);
CREATE INDEX idx_payments_status ON payments(status);
CREATE INDEX idx_payments_initiated_at ON payments(initiated_at DESC);
```

### 4.14 settings

```sql
CREATE TABLE settings (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_name              VARCHAR(255) NOT NULL DEFAULT 'FlowDesk',
  org_logo_url          TEXT,
  paystack_public_key   TEXT,
  paystack_secret_key   TEXT,  -- encrypted at rest (AES-256)
  notif_channel_email   BOOLEAN NOT NULL DEFAULT TRUE,
  notif_channel_teams   BOOLEAN NOT NULL DEFAULT FALSE,
  notif_channel_sms     BOOLEAN NOT NULL DEFAULT FALSE,
  notif_channel_whatsapp BOOLEAN NOT NULL DEFAULT FALSE,
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
-- Single row table (singleton). Seed with INSERT on first run.
```

### 4.15 sla_department_defaults

Stores per-department SLA defaults (separate from the main department table so history is preserved):

```sql
CREATE TABLE sla_department_defaults (
  department_id     UUID PRIMARY KEY REFERENCES departments(id) ON DELETE CASCADE,
  response_ms       BIGINT NOT NULL,
  resolution_ms     BIGINT NOT NULL,
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

---

## 5. API Reference

**Base URL:** `/api/v1`  
**Auth header:** `Authorization: Bearer <keycloak_access_token>`  
**Content-Type:** `application/json`  
**Pagination:** All list endpoints support `?page=1&limit=25` query params. Response: `{ data: T[], total: number, page: number, limit: number }`

---

### 5.1 Auth Module (`/api/v1/auth`)

#### POST /api/v1/auth/refresh
Exchange a Keycloak refresh token for a new access token (proxied to Keycloak).

**Request:**
```json
{ "refreshToken": "string" }
```

**Response 200:**
```json
{
  "accessToken": "string",
  "refreshToken": "string",
  "expiresIn": 900
}
```

#### POST /api/v1/auth/logout
Revoke the Keycloak refresh token (proxied to Keycloak).

**Request:**
```json
{ "refreshToken": "string" }
```

**Response 204:** No content.

#### GET /api/v1/auth/me
Returns the current user profile from the DB (populated via JWT `sub` → `kc_id`).

**Response 200:**
```json
{
  "id": "uuid",
  "kcId": "string",
  "name": "Amaka Osei",
  "email": "amaka@flowdesk.io",
  "role": "root_admin",
  "departmentId": null,
  "status": "active",
  "avatarInitials": "AO",
  "avatarColor": "#4F6EF7",
  "joinDate": "2023-01-10T09:00:00.000Z",
  "lastLogin": "2026-06-26T08:15:00.000Z",
  "isOnline": true,
  "isFirstLogin": false,
  "notificationPrefs": {
    "email": true,
    "teams": true,
    "whatsapp": false
  }
}
```

**Side effect:** Updates `lastLogin` and `isOnline = true` on the user record.

#### PATCH /api/v1/auth/first-login-complete
Called after the user successfully resets their first-login password. Sets `isFirstLogin = false`.

**Response 200:** Updated user object.

---

### 5.2 Users Module (`/api/v1/users`)

#### GET /api/v1/users
List users with optional filters.

**Access:** root_admin (all), dept_head (own dept only)

**Query params:**
- `search` — fuzzy match on name or email
- `departmentId` — filter by department UUID
- `role` — `root_admin | dept_head | team_member`
- `status` — `active | suspended`
- `page`, `limit`

**Response 200:**
```json
{
  "data": [
    {
      "id": "uuid",
      "name": "string",
      "email": "string",
      "role": "team_member",
      "departmentId": "uuid | null",
      "departmentName": "Technology",
      "status": "active",
      "avatarInitials": "SA",
      "avatarColor": "#0ea5e9",
      "joinDate": "ISO",
      "lastLogin": "ISO | null",
      "isOnline": true
    }
  ],
  "total": 12,
  "page": 1,
  "limit": 25
}
```

#### GET /api/v1/users/:id
Get a single user with full details including their tickets.

**Access:** root_admin, dept_head (own dept)

**Response 200:**
```json
{
  "id": "uuid",
  "name": "string",
  "email": "string",
  "role": "team_member",
  "departmentId": "uuid | null",
  "departmentName": "string | null",
  "status": "active",
  "avatarInitials": "SA",
  "avatarColor": "#0ea5e9",
  "joinDate": "ISO",
  "lastLogin": "ISO | null",
  "isOnline": true,
  "isFirstLogin": false,
  "notificationPrefs": {
    "email": true,
    "teams": false,
    "whatsapp": false
  },
  "tickets": [
    {
      "id": "uuid",
      "title": "string",
      "status": "open",
      "priority": "high",
      "departmentName": "string",
      "createdAt": "ISO"
    }
  ],
  "ticketCount": 4
}
```

#### POST /api/v1/users
Create a new user. Provisions the user in Keycloak (Admin REST API), sets a temporary password, marks `requiredActions: ['UPDATE_PASSWORD']`, then creates the user record in our DB.

**Access:** root_admin only

**Request:**
```json
{
  "name": "string",
  "email": "string",
  "role": "team_member",
  "departmentId": "uuid | null",
  "temporaryPassword": "string",
  "notificationPrefs": {
    "email": true,
    "teams": false,
    "whatsapp": false
  }
}
```

**Response 201:** Full user object.

**Side effects:**
- Creates Keycloak user
- Assigns Keycloak realm role
- Sets `department_id` attribute on Keycloak user
- Sends welcome email via Resend with login credentials

#### PATCH /api/v1/users/:id
Update user profile. Name/email changes are also synced to Keycloak.

**Access:** root_admin (all fields), own user (name, notificationPrefs, avatarColor only)

**Request (partial):**
```json
{
  "name": "string",
  "email": "string",
  "role": "team_member",
  "departmentId": "uuid | null",
  "status": "active",
  "avatarColor": "#hex",
  "notificationPrefs": {
    "email": true,
    "teams": false,
    "whatsapp": true
  },
  "phoneNumber": "+2348012345678"
}
```

**Response 200:** Updated user object.

**Side effects:**
- If `status` changes to `suspended` → also disables Keycloak account
- If `role` changes → updates Keycloak realm role assignment
- If `departmentId` changes → updates Keycloak user attribute

#### DELETE /api/v1/users/:id
Soft-disable. Sets `status = 'suspended'` and disables Keycloak account. Does **not** delete the DB record (preserves ticket history).

**Access:** root_admin only

**Response 204:** No content.

#### PATCH /api/v1/users/:id/reset-password
Admin-triggered password reset. Sets a new temp password in Keycloak and re-applies `UPDATE_PASSWORD` required action.

**Access:** root_admin only

**Request:**
```json
{ "temporaryPassword": "string" }
```

**Response 200:** `{ "message": "Password reset. User must change on next login." }`

---

### 5.3 Departments Module (`/api/v1/departments`)

#### GET /api/v1/departments
List all departments with computed stats.

**Access:** root_admin (all), dept_head (own department only)

**Response 200:**
```json
{
  "data": [
    {
      "id": "uuid",
      "name": "Technology",
      "slug": "tech",
      "description": "string",
      "headId": "uuid",
      "headName": "Damilola Adeyemi",
      "memberIds": ["uuid", "uuid"],
      "memberCount": 3,
      "routing": "roster_based",
      "sla": {
        "responseTimeMs": 1800000,
        "resolutionTimeMs": 14400000
      },
      "activeTicketCount": 9,
      "teamsWebhook": "https://...",
      "createdAt": "ISO"
    }
  ],
  "total": 4
}
```

#### GET /api/v1/departments/:id
Get a single department with full details.

**Access:** root_admin, dept_head (own dept)

**Response 200:** Same shape as list item, plus:
```json
{
  ...,
  "members": [
    {
      "id": "uuid",
      "name": "string",
      "email": "string",
      "role": "team_member",
      "status": "active",
      "avatarInitials": "SA",
      "avatarColor": "#hex",
      "joinDate": "ISO",
      "lastLogin": "ISO | null"
    }
  ]
}
```

#### POST /api/v1/departments
Create a new department.

**Access:** root_admin only

**Request:**
```json
{
  "name": "string",
  "slug": "string",
  "description": "string",
  "headId": "uuid",
  "routing": "roster_based",
  "sla": {
    "responseTimeMs": 1800000,
    "resolutionTimeMs": 14400000
  },
  "teamsWebhook": "string | null"
}
```

**Response 201:** Full department object.

**Side effects:**
- Sets `users.department_id = new dept` for the head user
- Updates Keycloak `department_id` attribute for the head user

#### PATCH /api/v1/departments/:id
Update department metadata.

**Access:** root_admin only

**Request (partial):**
```json
{
  "name": "string",
  "description": "string",
  "headId": "uuid",
  "routing": "all_notify",
  "sla": {
    "responseTimeMs": 3600000,
    "resolutionTimeMs": 86400000
  },
  "teamsWebhook": "string | null"
}
```

**Response 200:** Updated department object.

**Side effects:** If `headId` changes, updates old head's dept membership and new head's `department_id`.

#### DELETE /api/v1/departments/:id
Delete a department. Fails if the department has open/in_progress tickets.

**Access:** root_admin only

**Response 204:** No content.  
**Response 409:** `{ "error": "Department has active tickets. Resolve or transfer them first." }`

#### POST /api/v1/departments/:id/members
Add a user to a department.

**Access:** root_admin only

**Request:**
```json
{ "userId": "uuid" }
```

**Response 201:** `{ "message": "User added to department." }`

**Side effects:** Sets `users.department_id` and Keycloak attribute.

#### DELETE /api/v1/departments/:id/members/:userId
Remove a user from a department.

**Access:** root_admin only

**Response 204:** No content.

---

### 5.4 Tickets Module (`/api/v1/tickets`)

#### GET /api/v1/tickets
List tickets with filters and pagination.

**Access:** root_admin (all), dept_head (own dept), team_member (own tickets: requestor or assignee)

**Query params:**
- `departmentIds` — comma-separated UUIDs
- `statuses` — comma-separated status values
- `priorities` — comma-separated priority values
- `assigneeId` — UUID
- `requestorId` — UUID
- `dateFrom` — ISO date
- `dateTo` — ISO date
- `search` — match against title
- `tags` — comma-separated
- `page`, `limit`
- `sortBy` — `createdAt | updatedAt | priority | status` (default: `createdAt`)
- `sortOrder` — `asc | desc` (default: `desc`)

**Response 200:**
```json
{
  "data": [
    {
      "id": "uuid",
      "title": "string",
      "status": "open",
      "priority": "high",
      "departmentId": "uuid",
      "departmentName": "Technology",
      "assigneeId": "uuid | null",
      "assigneeName": "string | null",
      "assigneeInitials": "string | null",
      "requestorId": "uuid",
      "requestorName": "string",
      "slaStatus": "safe",
      "slaResolutionDeadline": "ISO",
      "tags": ["vpn","network"],
      "commentCount": 3,
      "attachmentCount": 1,
      "createdAt": "ISO",
      "updatedAt": "ISO"
    }
  ],
  "total": 25,
  "page": 1,
  "limit": 25
}
```

#### GET /api/v1/tickets/:id
Get a single ticket with full details (comments, attachments, transfer history, linked tickets).

**Access:** root_admin; dept_head (own dept); team_member (requestor or assignee)

**Response 200:**
```json
{
  "id": "uuid",
  "title": "string",
  "description": "string",
  "status": "open",
  "priority": "high",
  "departmentId": "uuid",
  "departmentName": "string",
  "assigneeId": "uuid | null",
  "assignee": { "id": "uuid", "name": "string", "avatarInitials": "SA", "avatarColor": "#hex" } | null,
  "requestorId": "uuid",
  "requestor": { "id": "uuid", "name": "string", "avatarInitials": "NO", "avatarColor": "#hex" },
  "slaStatus": "warning",
  "slaResponseDeadline": "ISO",
  "slaResolutionDeadline": "ISO",
  "resolvedAt": "ISO | null",
  "closedAt": "ISO | null",
  "tags": ["vpn"],
  "linkedTicketIds": ["uuid"],
  "linkedTickets": [
    { "id": "uuid", "title": "string", "status": "open" }
  ],
  "transferHistory": [
    {
      "id": "uuid",
      "fromDeptId": "uuid",
      "fromDeptName": "HR",
      "toDeptId": "uuid",
      "toDeptName": "Finance",
      "byUserId": "uuid",
      "byUserName": "Amaka Osei",
      "note": "string",
      "timestamp": "ISO"
    }
  ],
  "comments": [
    {
      "id": "uuid",
      "authorId": "uuid",
      "authorName": "string",
      "authorInitials": "SA",
      "authorColor": "#hex",
      "content": "string",
      "replyToId": "uuid | null",
      "isEdited": false,
      "isActivityEntry": false,
      "activityText": null,
      "reactions": [
        { "emoji": "👍", "userIds": ["uuid"] }
      ],
      "attachments": [
        {
          "id": "uuid",
          "name": "file.pdf",
          "mimeType": "application/pdf",
          "sizeBytes": 1024000,
          "url": "https://res.cloudinary.com/..."
        }
      ],
      "createdAt": "ISO",
      "updatedAt": "ISO | null"
    }
  ],
  "attachments": [
    {
      "id": "uuid",
      "name": "string",
      "mimeType": "string",
      "sizeBytes": 1024000,
      "url": "https://res.cloudinary.com/..."
    }
  ],
  "createdAt": "ISO",
  "updatedAt": "ISO"
}
```

#### POST /api/v1/tickets
Create a new ticket.

**Access:** All authenticated users

**Request:** `multipart/form-data`

Fields:
- `title` (string, required)
- `description` (string, required)
- `priority` (string: low|medium|high|critical, required)
- `departmentId` (UUID, required)
- `tags` (JSON array of strings, optional)
- `linkedTicketIds` (JSON array of UUIDs, optional)
- `files[]` (file uploads, optional, max 10 files, max 20MB each)

**Response 201:**
```json
{
  "id": "uuid",
  "title": "string",
  ...
}
```

**Side effects:**
1. Upload files to Cloudinary (folder: `flowdesk/tickets/<ticket_id>/`)
2. Create attachment records
3. Compute SLA deadlines from department SLA config
4. Create `notifications` records for:
   - Department head (ticket_assigned if routing=all_notify, or next shift assignee if roster_based)
   - All dept members if `routing = 'all_notify'`
5. Send notifications via configured channels
6. If `routing = 'roster_based'`: query current/next shift from `shifts` table to find the on-call assignee; auto-assign them

#### PATCH /api/v1/tickets/:id
Update ticket metadata (title, description, priority, tags, linkedTicketIds).

**Access:** root_admin; dept_head (own dept); team_member (assignee or requestor)

**Request (partial):**
```json
{
  "title": "string",
  "description": "string",
  "priority": "high",
  "tags": ["vpn", "network"],
  "linkedTicketIds": ["uuid"]
}
```

**Response 200:** Updated ticket (summary shape).

#### PATCH /api/v1/tickets/:id/assign
Assign or reassign the ticket.

**Access:** root_admin, dept_head (own dept), team_member (can self-assign if `status=open` and `assigneeId=null`)

**Request:**
```json
{ "assigneeId": "uuid" }
```

**Response 200:** Updated ticket.

**Side effects:**
1. Sets `status = 'in_progress'` if `status = 'open'`
2. Creates notification for new assignee (type: `ticket_assigned`)
3. Creates activity comment: "Ticket assigned to [Name] by [Actor]"

#### PATCH /api/v1/tickets/:id/transfer
Transfer ticket to another department.

**Access:** root_admin, dept_head (own dept), assignee

**Request:**
```json
{
  "toDepartmentId": "uuid",
  "note": "string"
}
```

**Response 200:** Updated ticket.

**Side effects:**
1. Creates `ticket_transfers` record
2. Sets `status = 'transferred'`, clears `assignee_id`
3. Updates `department_id` to target department
4. Recomputes SLA deadlines based on target department's SLA config
5. Creates activity comment
6. Creates notifications for target department members/head

#### PATCH /api/v1/tickets/:id/escalate
Escalate a ticket.

**Access:** root_admin, dept_head (own dept)

**Request:**
```json
{ "note": "string" }
```

**Response 200:** Updated ticket.

**Side effects:**
1. Sets `status = 'escalated'`, `priority = 'critical'` (if not already)
2. Creates activity comment: "Ticket escalated by [Name]"
3. Creates notification for root_admin users (type: `ticket_escalated`)
4. Sends Teams webhook, email, SMS if configured

#### PATCH /api/v1/tickets/:id/resolve
Resolve a ticket.

**Access:** root_admin, dept_head (own dept), assignee

**Request:**
```json
{ "resolutionNote": "string" }
```

**Response 200:** Updated ticket.

**Side effects:**
1. Sets `status = 'resolved'`, `resolved_at = NOW()`
2. Sets `sla_status` based on whether deadline was met
3. Creates activity comment
4. Creates notification for requestor (type: `ticket_resolved`)
5. Sends email/push to requestor

#### PATCH /api/v1/tickets/:id/close
Close a resolved ticket.

**Access:** root_admin, dept_head (own dept)

**Response 200:** Updated ticket.

**Side effects:** Sets `status = 'closed'`, `closed_at = NOW()`

#### POST /api/v1/tickets/:id/comments
Add a comment to a ticket.

**Access:** All users who can view the ticket

**Request:** `multipart/form-data`

Fields:
- `content` (string, required, min 1 char)
- `replyToId` (UUID, optional)
- `files[]` (file uploads, optional)

**Response 201:** Full comment object.

**Side effects:**
1. Upload files to Cloudinary (folder: `flowdesk/tickets/<ticket_id>/comments/<comment_id>/`)
2. Creates notification for: assignee, requestor, dept_head (type: `new_comment`) — excluding the comment author

#### PATCH /api/v1/tickets/:id/comments/:commentId
Edit a comment (mark `isEdited = true`, update `updatedAt`).

**Access:** Comment author only

**Request:**
```json
{ "content": "string" }
```

**Response 200:** Updated comment.

#### DELETE /api/v1/tickets/:id/comments/:commentId
Delete a comment (hard delete, also deletes its Cloudinary files).

**Access:** Comment author or root_admin

**Response 204:** No content.

#### POST /api/v1/tickets/:id/comments/:commentId/reactions
Toggle a reaction on a comment (add if not present, remove if already present).

**Access:** All users who can view the ticket

**Request:**
```json
{ "emoji": "👍" }
```

**Response 200:** Updated reactions array: `[{ "emoji": "👍", "userIds": ["uuid"] }]`

---

### 5.5 Roster Module (`/api/v1/roster`)

#### GET /api/v1/roster
Get roster shifts.

**Access:** root_admin (all), dept_head (own dept), team_member (own shifts only)

**Query params:**
- `departmentId` (UUID, required for dept_head/team_member; optional for root_admin)
- `userId` (UUID, optional)
- `dateFrom` (YYYY-MM-DD, default: start of current month)
- `dateTo` (YYYY-MM-DD, default: end of current month)

**Response 200:**
```json
{
  "data": [
    {
      "id": "uuid",
      "userId": "uuid",
      "userName": "Segun Afolabi",
      "userInitials": "SA",
      "userColor": "#0ea5e9",
      "departmentId": "uuid",
      "departmentName": "Technology",
      "date": "2026-06-26",
      "startTime": "08:00",
      "endTime": "17:00",
      "createdAt": "ISO"
    }
  ],
  "total": 16
}
```

#### POST /api/v1/roster
Create a new shift.

**Access:** root_admin, dept_head (own dept)

**Request:**
```json
{
  "userId": "uuid",
  "departmentId": "uuid",
  "date": "2026-07-01",
  "startTime": "08:00",
  "endTime": "17:00"
}
```

**Response 201:** Full shift object.

**Side effects:** Creates in-app notification for the assigned user.

#### PATCH /api/v1/roster/:id
Update a shift.

**Access:** root_admin, dept_head (own dept)

**Request (partial):**
```json
{
  "date": "2026-07-02",
  "startTime": "09:00",
  "endTime": "18:00"
}
```

**Response 200:** Updated shift.

#### DELETE /api/v1/roster/:id
Delete a shift.

**Access:** root_admin, dept_head (own dept)

**Response 204:** No content.

---

### 5.6 Notifications Module (`/api/v1/notifications`)

#### GET /api/v1/notifications
Get notifications for the current user.

**Access:** All authenticated users (own notifications only)

**Query params:**
- `type` — `ticket_assigned | sla_warning | ticket_resolved | new_comment | payment_initiated | ticket_escalated | ticket_transferred`
- `isRead` — `true | false`
- `page`, `limit`

**Response 200:**
```json
{
  "data": [
    {
      "id": "uuid",
      "userId": "uuid",
      "type": "ticket_assigned",
      "title": "New ticket assigned",
      "message": "You have been assigned ticket #... 'Laptop not connecting to VPN'",
      "ticketId": "uuid | null",
      "isRead": false,
      "createdAt": "ISO"
    }
  ],
  "total": 15,
  "unreadCount": 4
}
```

#### PATCH /api/v1/notifications/:id/read
Mark a single notification as read.

**Access:** Notification owner only

**Response 200:** `{ "id": "uuid", "isRead": true }`

#### PATCH /api/v1/notifications/read-all
Mark all notifications as read for the current user.

**Response 200:** `{ "updatedCount": 4 }`

#### DELETE /api/v1/notifications/:id
Delete a notification.

**Access:** Notification owner only

**Response 204:** No content.

**SSE endpoint:**

#### GET /api/v1/notifications/stream
Server-Sent Events stream for real-time notification delivery. Authenticated via `?token=<access_token>` query param (SSE doesn't support custom headers easily).

Events emitted:
```
event: notification
data: { "id": "uuid", "type": "ticket_assigned", ... }

event: ping
data: {}
```

---

### 5.7 Payments Module (`/api/v1/payments`)

#### GET /api/v1/payments
List payments with filters.

**Access:** root_admin, dept_head (own dept tickets only)

**Query params:**
- `status` — `pending | completed | failed`
- `ticketId` — UUID
- `search` — match on reference or description
- `dateFrom`, `dateTo`
- `page`, `limit`

**Response 200:**
```json
{
  "data": [
    {
      "id": "uuid",
      "ticketId": "uuid",
      "ticketTitle": "string",
      "amount": 185000.00,
      "currency": "NGN",
      "status": "pending",
      "method": "bank_transfer",
      "paystackRef": null,
      "initiatedBy": "uuid",
      "initiatedByName": "Kelechi Nwosu",
      "initiatedAt": "ISO",
      "completedAt": null,
      "reference": "FD-PAY-2026-0023",
      "description": "string"
    }
  ],
  "total": 8
}
```

#### GET /api/v1/payments/:id
Get single payment.

**Response 200:** Full payment object (same shape as list item).

#### POST /api/v1/payments
Initiate a payment.

**Access:** root_admin, dept_head (finance dept only enforced by server — role check + dept check)

**Request:**
```json
{
  "ticketId": "uuid",
  "amount": 185000,
  "currency": "NGN",
  "method": "bank_transfer",
  "description": "string"
}
```

**Response 201:** Full payment object.

**Side effects:**
1. Generates internal reference: `FD-PAY-<YEAR>-<SEQUENCE>`
2. If `method = 'paystack'`: initializes a Paystack transaction, returns `authorizationUrl` in response
3. Creates notification for ticket requestor (type: `payment_initiated`)
4. Sends email/SMS to requestor

**Response for Paystack method (201):**
```json
{
  "payment": { ... },
  "authorizationUrl": "https://checkout.paystack.com/..."
}
```

#### PATCH /api/v1/payments/:id/complete
Manually mark a bank transfer as completed.

**Access:** root_admin, finance dept_head

**Response 200:** Updated payment with `status: 'completed'`, `completedAt: ISO`.

#### PATCH /api/v1/payments/:id/fail
Mark a payment as failed.

**Access:** root_admin only

**Response 200:** Updated payment with `status: 'failed'`.

#### POST /api/v1/payments/paystack/webhook
Paystack webhook receiver. Validates HMAC-SHA512 signature using `X-Paystack-Signature` header.

**Events handled:**
- `charge.success` → set payment `status = 'completed'`, `completed_at = NOW()`
- `transfer.failed` → set `status = 'failed'`

**Response 200:** `{ "received": true }`

---

### 5.8 Analytics Module (`/api/v1/analytics`)

#### GET /api/v1/analytics
Returns computed analytics data.

**Access:** root_admin (all depts), dept_head (own dept only — query scoped to `departmentId`)

**Query params:**
- `dateFrom` (ISO date, default: 6 months ago)
- `dateTo` (ISO date, default: now)
- `departmentId` (root_admin only — filter to one dept)

**Response 200:**
```json
{
  "monthlyVolume": [
    { "month": "Jan 2026", "count": 42 }
  ],
  "slaCompliance": [
    { "department": "Technology", "complianceRate": 74.2 }
  ],
  "ticketsByStatus": [
    { "label": "Open", "value": 7, "color": "#0ea5e9" }
  ],
  "ticketsByPriority": [
    { "label": "Low", "value": 9, "color": "#10b981" }
  ],
  "avgResolutionTime": [
    { "department": "Technology", "avgHours": 6.4 }
  ],
  "topRequestors": [
    { "userId": "uuid", "name": "Damilola Adeyemi", "ticketCount": 8 }
  ],
  "recentBreaches": [
    {
      "ticketId": "uuid",
      "title": "string",
      "department": "Technology",
      "assignee": "Yetunde Williams",
      "breachedAt": "ISO",
      "hoursOverdue": 24.3
    }
  ],
  "summary": {
    "totalTickets": 270,
    "resolvedThisMonth": 25,
    "slaComplianceRate": 79.75,
    "avgResolutionHours": 23.65
  }
}
```

**Implementation:** Results are computed via SQL aggregation queries and cached in Redis with TTL of 1 hour. Cache key: `analytics:<departmentId | 'all'>:<dateFrom>:<dateTo>`.

**SQL queries used:**

```sql
-- Monthly volume
SELECT TO_CHAR(DATE_TRUNC('month', created_at), 'Mon YYYY') AS month, COUNT(*) AS count
FROM tickets
WHERE created_at BETWEEN $1 AND $2
  AND ($3::uuid IS NULL OR department_id = $3)
GROUP BY DATE_TRUNC('month', created_at)
ORDER BY DATE_TRUNC('month', created_at);

-- SLA compliance per department
SELECT d.name AS department,
  ROUND(100.0 * COUNT(*) FILTER (WHERE sla_status != 'breached') / NULLIF(COUNT(*),0), 1) AS compliance_rate
FROM tickets t JOIN departments d ON d.id = t.department_id
WHERE t.status IN ('resolved','closed')
  AND t.created_at BETWEEN $1 AND $2
GROUP BY d.name;

-- Average resolution time
SELECT d.name AS department,
  ROUND(AVG(EXTRACT(EPOCH FROM (t.resolved_at - t.created_at))/3600)::numeric, 1) AS avg_hours
FROM tickets t JOIN departments d ON d.id = t.department_id
WHERE t.resolved_at IS NOT NULL
  AND t.created_at BETWEEN $1 AND $2
GROUP BY d.name;

-- Top requestors
SELECT u.id AS user_id, u.name, COUNT(*) AS ticket_count
FROM tickets t JOIN users u ON u.id = t.requestor_id
WHERE t.created_at BETWEEN $1 AND $2
GROUP BY u.id, u.name
ORDER BY ticket_count DESC
LIMIT 10;

-- Recent SLA breaches
SELECT t.id, t.title, d.name AS department, u.name AS assignee,
  t.sla_resolution_deadline AS breached_at,
  ROUND(EXTRACT(EPOCH FROM (NOW() - t.sla_resolution_deadline))/3600::numeric, 1) AS hours_overdue
FROM tickets t
  JOIN departments d ON d.id = t.department_id
  LEFT JOIN users u ON u.id = t.assignee_id
WHERE t.sla_status = 'breached'
ORDER BY t.sla_resolution_deadline ASC
LIMIT 10;
```

---

### 5.9 Settings Module (`/api/v1/settings`)

#### GET /api/v1/settings
Get organization settings.

**Access:** root_admin only

**Response 200:**
```json
{
  "orgName": "FlowDesk",
  "orgLogoUrl": "https://res.cloudinary.com/.../logo.png",
  "paystackPublicKey": "pk_live_...",
  "paystackSecretKey": "sk_live_...",
  "notifChannels": {
    "email": true,
    "teams": false,
    "sms": false,
    "whatsapp": false
  }
}
```

Note: `paystackSecretKey` is stored encrypted in DB and decrypted only for display. Never logged.

#### PATCH /api/v1/settings
Update organization settings.

**Access:** root_admin only

**Request (partial):**
```json
{
  "orgName": "string",
  "paystackPublicKey": "string",
  "paystackSecretKey": "string",
  "notifChannels": {
    "email": true,
    "teams": true,
    "sms": false,
    "whatsapp": false
  }
}
```

**Response 200:** Updated settings object.

#### POST /api/v1/settings/logo
Upload or replace the organization logo.

**Access:** root_admin only

**Request:** `multipart/form-data`, field `file` (PNG/SVG/JPG, max 2MB)

**Response 200:** `{ "logoUrl": "https://res.cloudinary.com/..." }`

**Side effects:** Uploads to Cloudinary folder `flowdesk/org/logo`, deletes old logo if one existed.

---

### 5.10 Files Module (`/api/v1/files`)

#### POST /api/v1/files/upload
Upload a file and get back its Cloudinary URL. Used for standalone uploads before form submission.

**Access:** All authenticated users

**Request:** `multipart/form-data`, field `file`

**Query params:**
- `context` — `ticket | comment | logo` (determines Cloudinary folder)
- `ticketId` — UUID (required if `context=ticket` or `context=comment`)

**Response 201:**
```json
{
  "id": "uuid",
  "name": "vpn-error-log.txt",
  "mimeType": "text/plain",
  "sizeBytes": 4096,
  "url": "https://res.cloudinary.com/flowdesk/...",
  "cloudinaryId": "flowdesk/tickets/t-abc/vpn-error-log"
}
```

#### DELETE /api/v1/files/:id
Delete a file (removes from Cloudinary and DB).

**Access:** File uploader or root_admin

**Response 204:** No content.

---

### 5.11 Chat Module (`/api/v1/chat`)

#### GET /api/v1/chat/token
Generate a Stream.io user token for the current user.

**Access:** All authenticated users

**Response 200:**
```json
{
  "token": "string",
  "userId": "uuid",
  "apiKey": "STREAM_API_KEY"
}
```

**Implementation:**
```typescript
// server-side token generation using Stream server SDK
const serverClient = StreamChat.getInstance(process.env.STREAM_API_KEY, process.env.STREAM_SECRET);
const token = serverClient.createToken(user.id);
```

#### POST /api/v1/chat/provision-user
Upsert the current user in Stream.io. Called on first login or when profile changes.

**Access:** All authenticated users (own user)

**Response 200:** `{ "success": true }`

**Implementation:**
```typescript
await serverClient.upsertUser({
  id: user.id,
  name: user.name,
  image: `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}&background=${user.avatarColor.slice(1)}&color=fff`,
  role: user.role,
});
```

#### POST /api/v1/chat/channels
Create a Stream.io channel (DM or group). The backend creates the channel server-side so permissions are enforced.

**Access:** All authenticated users

**Request:**
```json
{
  "type": "dm",
  "memberIds": ["uuid", "uuid"]
}
```
or:
```json
{
  "type": "group",
  "name": "Tech Team",
  "memberIds": ["uuid", "uuid", "uuid"]
}
```

**Response 201:**
```json
{
  "channelId": "string",
  "channelType": "messaging"
}
```

**Implementation:**
- DM channels: type = `messaging`, id = sorted user IDs joined by `-`
- Group channels: type = `team`, id = UUID

#### GET /api/v1/chat/channels
List the current user's channels (metadata from Postgres, real-time data from Stream).

**Response 200:**
```json
[
  {
    "channelId": "string",
    "type": "dm",
    "name": null,
    "participantIds": ["uuid", "uuid"],
    "lastMessageAt": "ISO"
  }
]
```

**Note:** Actual messages are fetched client-side via the Stream.io JavaScript SDK. This endpoint only provides channel metadata and participant info for rendering the conversation list.

---

### 5.12 Profile Module (`/api/v1/profile`)

#### GET /api/v1/profile
Get the current user's full profile (alias for `GET /auth/me` but includes ticket summary).

**Access:** All authenticated users

**Response 200:** Same as `GET /users/:id` but always returns current user regardless of role.

#### PATCH /api/v1/profile
Update the current user's own profile.

**Access:** All authenticated users

**Request:**
```json
{
  "name": "string",
  "avatarColor": "#hex",
  "phoneNumber": "+2348012345678",
  "notificationPrefs": {
    "email": true,
    "teams": false,
    "whatsapp": true
  }
}
```

**Response 200:** Updated user object.

**Side effects:** Syncs `name` to Keycloak user. Syncs user profile to Stream.io.

#### PATCH /api/v1/profile/password
Change the current user's own password via Keycloak.

**Access:** All authenticated users

**Request:**
```json
{
  "currentPassword": "string",
  "newPassword": "string"
}
```

**Response 200:** `{ "message": "Password updated successfully." }`

**Implementation:** Calls Keycloak's Account API with the user's own session token (re-verifies current password before update).

---

## 6. File Storage (Cloudinary)

### 6.1 Account Setup

- Create a Cloudinary account with product environment: `flowdesk`
- Enable "Signed uploads" (never expose API secret in frontend)
- Enable "Auto backups"
- Set transformation limits appropriate for the plan

### 6.2 Folder Structure

```
flowdesk/
  org/
    logo/               ← org logo
  tickets/
    <ticket_id>/
      <original_filename>   ← ticket-level attachments
      comments/
        <comment_id>/
          <original_filename>   ← comment attachments
```

### 6.3 Upload Flow

All uploads go through the NestJS backend (never direct from browser):

1. Client sends `multipart/form-data` to `POST /api/v1/files/upload`
2. Backend validates file: type whitelist, size limit (20MB for tickets, 2MB for logos)
3. Backend streams file to Cloudinary using the Node SDK
4. Backend stores the `cloudinary_id` and `secure_url` in the `attachments` table
5. Returns the attachment record to the client

**Allowed MIME types:**
- Images: `image/jpeg`, `image/png`, `image/gif`, `image/webp`
- Documents: `application/pdf`, `application/msword`, `application/vnd.openxmlformats-officedocument.wordprocessingml.document`
- Spreadsheets: `application/vnd.ms-excel`, `application/vnd.openxmlformats-officedocument.spreadsheetml.sheet`
- Text: `text/plain`, `text/csv`
- Archives: `application/zip`

### 6.4 Access Control

All files are uploaded with `access_mode: 'authenticated'` in Cloudinary. The NestJS backend generates a signed URL (TTL: 15 minutes) before returning them to the client:

```typescript
const signedUrl = cloudinary.url(publicId, {
  sign_url: true,
  secure: true,
  expires_at: Math.floor(Date.now() / 1000) + 900, // 15 min
});
```

### 6.5 Deletion

When a ticket is deleted (or a comment is deleted), call `cloudinary.api.delete_resources([...publicIds])` to clean up.

---

## 7. Chat Integration (Stream.io)

### 7.1 Overview

Stream.io handles:
- Real-time message delivery
- Message history and pagination
- Typing indicators
- Online presence
- Read receipts
- Message reactions (via Stream's own reaction API)
- File message attachments (we upload to Cloudinary first, pass URL as Stream attachment)

The FlowDesk backend:
- Manages user provisioning in Stream
- Manages channel creation (server-side for auth)
- Provides `GET /chat/token` for frontend client initialization

### 7.2 Channel Types

Configure two channel types in the Stream dashboard:

| Type | Name | Use Case |
|------|------|----------|
| `messaging` | Direct Messages | 1-on-1 DMs |
| `team` | Group Channels | Department/leadership groups |

**Permissions:**
- Any member can send messages in their channels
- Channel creation: server-side only (disallow client-side create)
- Message deletion: author only + moderators

### 7.3 User Provisioning

Users are provisioned in Stream when:
- They first log in (`POST /chat/provision-user`)
- Their name or avatar changes (`PATCH /profile`)

User object in Stream:
```json
{
  "id": "<flowdesk_user_uuid>",
  "name": "Segun Afolabi",
  "image": "https://ui-avatars.com/...",
  "role": "team_member",
  "teams": ["dept:<departmentId>"]
}
```

### 7.4 Message Attachments

When a user sends a file in chat:
1. Frontend first uploads the file to `POST /api/v1/files/upload?context=chat`
2. Backend uploads to Cloudinary, returns a signed URL
3. Frontend sends the Stream message with the Cloudinary URL as an attachment

```json
{
  "text": "Here's the RCA document",
  "attachments": [
    {
      "type": "file",
      "title": "rca-document.pdf",
      "asset_url": "https://res.cloudinary.com/flowdesk/...",
      "mime_type": "application/pdf",
      "file_size": 1024000
    }
  ]
}
```

### 7.5 Unread Count

Unread message count is fetched from the Stream client SDK on the frontend. The backend does not track this separately.

---

## 8. Notification Service

### 8.1 Architecture

The notification service is a NestJS module (`NotificationsModule`) with:
- A `NotificationsService` that creates in-app notification records
- A `NotificationDispatchService` that fans out to external channels
- BullMQ queues for async delivery (to avoid blocking ticket update responses)

```
TicketEvent emitted
       ↓
NotificationsService.createAndDispatch(event)
       ↓
  ┌────┴───────────────────────┐
  │ Persist to notifications   │
  │ table (in-app)             │
  └─────────────────────────┬──┘
                            │
  BullMQ job added ─────────▼
                            ↓
         ┌──────────────────────────────────┐
         │   NotificationWorker             │
         │                                  │
         │  For each recipient:             │
         │  - if notifPrefEmail → Resend    │
         │  - if notifPrefSms → Twilio SMS  │
         │  - if notifPrefWhatsapp → Twilio │
         │  - if deptTeamsWebhook → HTTP    │
         └──────────────────────────────────┘
```

### 8.2 Notification Events and Recipients

| Event | Trigger | Recipients | In-App | Email | SMS | WhatsApp | Teams |
|-------|---------|-----------|--------|-------|-----|----------|-------|
| `ticket_created` | POST /tickets | Dept head + members (all_notify) OR on-call shift (roster_based) | ✅ | ✅ | — | — | ✅ |
| `ticket_assigned` | PATCH /assign | Assignee | ✅ | ✅ | ✅ | ✅ | — |
| `ticket_resolved` | PATCH /resolve | Requestor | ✅ | ✅ | ✅ | ✅ | — |
| `ticket_closed` | PATCH /close | Requestor | ✅ | ✅ | — | — | — |
| `ticket_escalated` | PATCH /escalate | All root_admin + dept head | ✅ | ✅ | ✅ | — | ✅ |
| `ticket_transferred` | PATCH /transfer | New dept head + members | ✅ | ✅ | — | — | ✅ |
| `new_comment` | POST /comments | Assignee + requestor (excl. author) | ✅ | ✅ | — | — | — |
| `sla_warning` | SLA cron job | Assignee + dept head | ✅ | ✅ | ✅ | — | ✅ |
| `sla_breach` | SLA cron job | Assignee + dept head + root_admin | ✅ | ✅ | ✅ | ✅ | ✅ |
| `payment_initiated` | POST /payments | Ticket requestor | ✅ | ✅ | ✅ | — | — |

### 8.3 Email (Resend)

**Configuration:**
```
RESEND_API_KEY=re_...
EMAIL_FROM=notifications@flowdesk.io
```

**Templates (HTML emails):**

All emails use a consistent HTML template with the FlowDesk branding. Use Resend's template API or inline HTML.

Template variables per notification type:
- `ticket_assigned`: ticket title, ticket URL, assignee name, priority badge
- `ticket_resolved`: ticket title, resolution note, requestor name
- `ticket_escalated`: ticket title, escalated-by user, current assignee
- `new_comment`: ticket title, comment snippet (first 200 chars), commenter name, reply URL
- `sla_warning`: ticket title, time remaining, ticket URL, priority
- `payment_initiated`: amount formatted (₦XX,XXX.XX), payment reference, linked ticket title

**Implementation:**
```typescript
await resend.emails.send({
  from: 'FlowDesk <notifications@flowdesk.io>',
  to: recipient.email,
  subject: notification.title,
  html: renderTemplate(notification.type, templateVars),
});
```

### 8.4 SMS (Twilio)

**Configuration:**
```
TWILIO_ACCOUNT_SID=AC...
TWILIO_AUTH_TOKEN=...
TWILIO_PHONE_NUMBER=+1234567890
```

SMS messages are short-form (max 160 chars):
```
FlowDesk: [Ticket title] assigned to you. Priority: High. View: https://flowdesk.io/tickets/<id>
```

Only sent to users with `notifPrefSms = true` (derived from `phoneNumber` not null in our DB — note: we use `notifPrefWhatsapp` to gate WhatsApp and a separate column for SMS preference; see the extended notification prefs below).

**Note on notification prefs extension:** The current frontend has `notifPrefEmail`, `notifPrefTeams`, `notifPrefWhatsapp`. Add a `notifPrefSms BOOLEAN DEFAULT FALSE` column to the `users` table.

### 8.5 WhatsApp (Twilio)

Use Twilio's WhatsApp Business API (same SDK, different sender):

```
TWILIO_WHATSAPP_FROM=whatsapp:+14155238886  (Twilio sandbox or approved number)
```

```typescript
await twilioClient.messages.create({
  from: process.env.TWILIO_WHATSAPP_FROM,
  to: `whatsapp:${user.phoneNumber}`,
  body: `*FlowDesk*: ${notification.title}\n\n${notification.message}\n\nView: ${ticketUrl}`,
});
```

Only sent to users with `notifPrefWhatsapp = true` and `phoneNumber` set.

### 8.6 Microsoft Teams (Webhook)

Each department has a `teamsWebhook` URL (Incoming Webhook URL from Teams channel settings).

Payload format (Adaptive Card):
```json
{
  "@type": "MessageCard",
  "@context": "https://schema.org/extensions",
  "themeColor": "4F6EF7",
  "summary": "FlowDesk Notification",
  "sections": [
    {
      "activityTitle": "**Ticket Created: [title]**",
      "activitySubtitle": "Department: Technology | Priority: 🔴 Critical",
      "facts": [
        { "name": "Requested by", "value": "Ngozi Obiora" },
        { "name": "SLA Deadline", "value": "Jun 26, 2026 11:30 AM" }
      ],
      "markdown": true
    }
  ],
  "potentialAction": [
    {
      "@type": "OpenUri",
      "name": "View Ticket",
      "targets": [{ "os": "default", "uri": "https://flowdesk.io/tickets/<id>" }]
    }
  ]
}
```

Sent via plain `fetch` / `axios` POST to the webhook URL. Errors are logged but do not block the response.

### 8.7 BullMQ Queue Configuration

```typescript
// Queue: 'notifications'
// Worker: processes jobs one at a time per recipient
// Retry: 3 attempts, exponential backoff (2s, 4s, 8s)
// Failed jobs: moved to 'failed' queue for inspection

const notificationQueue = new Queue('notifications', {
  defaultJobOptions: {
    attempts: 3,
    backoff: { type: 'exponential', delay: 2000 },
    removeOnComplete: 1000,  // keep last 1000 completed jobs
    removeOnFail: 500,
  },
});
```

---

## 9. Analytics

See section 5.8 for the API endpoint. The queries run against Postgres with the following indexing strategy:

**Critical indexes for analytics:**
```sql
CREATE INDEX idx_tickets_created_month ON tickets (DATE_TRUNC('month', created_at));
CREATE INDEX idx_tickets_dept_status ON tickets(department_id, status);
CREATE INDEX idx_tickets_resolved_dept ON tickets(department_id, resolved_at) WHERE resolved_at IS NOT NULL;
CREATE INDEX idx_tickets_sla_breached ON tickets(sla_status) WHERE sla_status = 'breached';
```

**Cache invalidation:** Analytics cache (Redis) is invalidated when any ticket changes status (write-through invalidation via `CACHE INVALIDATE analytics:*` on ticket updates).

---

## 10. Caching Strategy (Redis)

### 10.1 Cache Keys and TTLs

| Key Pattern | Content | TTL | Invalidated By |
|-------------|---------|-----|----------------|
| `user:<id>` | User object | 5 min | User update |
| `dept:<id>` | Department + computed stats | 10 min | Dept update, ticket status change |
| `dept:all` | Departments list | 5 min | Dept create/update/delete |
| `analytics:<scope>:<from>:<to>` | Analytics query results | 1 hour | Any ticket status change |
| `notifications:unread:<userId>` | Unread count | 30 sec | Notification create/read |
| `shifts:<deptId>:<month>` | Roster for a month | 10 min | Shift create/update/delete |

### 10.2 SLA Timers (BullMQ Delayed Jobs)

When a ticket is created, schedule two delayed BullMQ jobs:

```typescript
// Warning at 80% of SLA window
await slaQueue.add('sla-warning', { ticketId }, {
  delay: slaResolutionMs * 0.8,
  jobId: `sla-warn-${ticketId}`,
});

// Breach at 100% of SLA window
await slaQueue.add('sla-breach', { ticketId }, {
  delay: slaResolutionMs,
  jobId: `sla-breach-${ticketId}`,
});
```

When the ticket is resolved/closed, cancel the pending jobs:
```typescript
const warnJob = await slaQueue.getJob(`sla-warn-${ticketId}`);
await warnJob?.remove();
const breachJob = await slaQueue.getJob(`sla-breach-${ticketId}`);
await breachJob?.remove();
```

### 10.3 Session / Online Status

Track user online status in Redis (updated on `GET /auth/me`):
```
SET user:online:<userId> 1 EX 300   // 5-minute TTL
```

A background job (every 60 seconds) syncs `isOnline` from Redis to Postgres for persistence.

---

## 11. SLA Engine

### 11.1 Deadline Computation

When a ticket is created:
```typescript
const responseDeadline = new Date(ticket.createdAt.getTime() + dept.slaResponseMs);
const resolutionDeadline = new Date(ticket.createdAt.getTime() + dept.slaResolutionMs);
```

When a ticket is transferred, the deadlines are recomputed based on the **target department's SLA**, starting from the transfer timestamp:
```typescript
const responseDeadline = new Date(transfer.timestamp.getTime() + targetDept.slaResponseMs);
const resolutionDeadline = new Date(transfer.timestamp.getTime() + targetDept.slaResolutionMs);
```

### 11.2 SLA Status Computation

The `sla_status` column is updated:
- `safe`: `NOW() < 80% of resolution deadline`
- `warning`: `80% of deadline < NOW() < deadline`
- `critical`: `95% of deadline < NOW() < deadline`
- `breached`: `NOW() > deadline` and ticket not resolved

A cron job runs every 5 minutes (`@Cron('*/5 * * * *')`) to recompute `sla_status` for all unresolved tickets:

```typescript
await ticketRepo.createQueryBuilder()
  .update(Ticket)
  .set({
    slaStatus: () => `
      CASE
        WHEN NOW() > sla_resolution_deadline THEN 'breached'
        WHEN NOW() > (sla_resolution_deadline - (sla_resolution_deadline - created_at) * 0.05) THEN 'critical'
        WHEN NOW() > (sla_resolution_deadline - (sla_resolution_deadline - created_at) * 0.20) THEN 'warning'
        ELSE 'safe'
      END
    `,
  })
  .where('status NOT IN (:...statuses)', { statuses: ['resolved', 'closed'] })
  .execute();
```

---

## 12. Payment Integration (Paystack)

### 12.1 Configuration

```
PAYSTACK_SECRET_KEY=sk_live_...
PAYSTACK_PUBLIC_KEY=pk_live_...
PAYSTACK_WEBHOOK_SECRET=...
```

### 12.2 Initialize Transaction (for Paystack method)

```typescript
const response = await paystackClient.transaction.initialize({
  email: requestorUser.email,
  amount: payment.amount * 100,  // Paystack amounts are in kobo
  currency: payment.currency,
  reference: payment.reference,
  metadata: {
    ticketId: payment.ticketId,
    paymentId: payment.id,
    description: payment.description,
  },
  callback_url: `${process.env.APP_URL}/payments/callback`,
});
```

### 12.3 Webhook Validation

```typescript
const hash = crypto
  .createHmac('sha512', process.env.PAYSTACK_WEBHOOK_SECRET)
  .update(JSON.stringify(body))
  .digest('hex');

if (hash !== req.headers['x-paystack-signature']) {
  throw new UnauthorizedException();
}
```

### 12.4 Internal Reference Generation

```typescript
async generateReference(): Promise<string> {
  const year = new Date().getFullYear();
  const count = await paymentRepo.count({ where: { reference: Like(`FD-PAY-${year}-%`) } });
  return `FD-PAY-${year}-${String(count + 1).padStart(4, '0')}`;
}
```

---

## 13. Environment Variables

```bash
# App
NODE_ENV=production
PORT=3000
APP_URL=https://flowdesk.io
API_PREFIX=api/v1

# Database
DATABASE_URL=postgresql://flowdesk:password@localhost:5432/flowdesk
DATABASE_SSL=true

# Redis
REDIS_URL=redis://localhost:6379

# Keycloak
KEYCLOAK_URL=https://auth.flowdesk.io
KEYCLOAK_REALM=flowdesk
KEYCLOAK_CLIENT_ID=flowdesk-backend
KEYCLOAK_CLIENT_SECRET=...
KEYCLOAK_ADMIN_CLIENT_ID=admin-cli
KEYCLOAK_ADMIN_USERNAME=admin
KEYCLOAK_ADMIN_PASSWORD=...

# Stream.io
STREAM_API_KEY=...
STREAM_API_SECRET=...

# Cloudinary
CLOUDINARY_CLOUD_NAME=flowdesk
CLOUDINARY_API_KEY=...
CLOUDINARY_API_SECRET=...

# Resend (Email)
RESEND_API_KEY=re_...
EMAIL_FROM=notifications@flowdesk.io

# Twilio (SMS + WhatsApp)
TWILIO_ACCOUNT_SID=AC...
TWILIO_AUTH_TOKEN=...
TWILIO_PHONE_NUMBER=+1234567890
TWILIO_WHATSAPP_FROM=whatsapp:+14155238886

# Paystack
PAYSTACK_SECRET_KEY=sk_live_...
PAYSTACK_PUBLIC_KEY=pk_live_...
PAYSTACK_WEBHOOK_SECRET=...

# Encryption (for Paystack secret key at rest)
ENCRYPTION_KEY=<32-byte-hex>

# CORS
CORS_ORIGINS=https://flowdesk.io,http://localhost:5174

# Swagger
SWAGGER_ENABLED=true
SWAGGER_PATH=docs
```

---

## 14. NestJS Module Structure

```
src/
  app.module.ts
  main.ts
  
  common/
    decorators/
      roles.decorator.ts       (@Roles)
      current-user.decorator.ts
    guards/
      keycloak-auth.guard.ts
      roles.guard.ts
    interceptors/
      logging.interceptor.ts
      transform.interceptor.ts  (camelCase ↔ snake_case)
    filters/
      http-exception.filter.ts
    pipes/
      validation.pipe.ts
    
  config/
    database.config.ts
    redis.config.ts
    keycloak.config.ts
    stream.config.ts
    cloudinary.config.ts
    
  modules/
    auth/
      auth.module.ts
      auth.controller.ts
      auth.service.ts
      keycloak.service.ts       (Admin REST API calls)
      dto/
        refresh-token.dto.ts
        
    users/
      users.module.ts
      users.controller.ts
      users.service.ts
      users.entity.ts
      dto/
        create-user.dto.ts
        update-user.dto.ts
        user-response.dto.ts
        
    departments/
      departments.module.ts
      departments.controller.ts
      departments.service.ts
      department.entity.ts
      department-member.entity.ts
      dto/
        create-department.dto.ts
        update-department.dto.ts
        department-response.dto.ts
        
    tickets/
      tickets.module.ts
      tickets.controller.ts
      tickets.service.ts
      tickets.event.emitter.ts
      ticket.entity.ts
      comment.entity.ts
      ticket-transfer.entity.ts
      ticket-tag.entity.ts
      dto/
        create-ticket.dto.ts
        update-ticket.dto.ts
        transfer-ticket.dto.ts
        create-comment.dto.ts
        ticket-filter.dto.ts
        
    roster/
      roster.module.ts
      roster.controller.ts
      roster.service.ts
      shift.entity.ts
      dto/
        create-shift.dto.ts
        
    notifications/
      notifications.module.ts
      notifications.controller.ts
      notifications.service.ts
      notification-dispatch.service.ts
      notification.entity.ts
      queues/
        notification.queue.ts
        notification.worker.ts
      channels/
        email.channel.ts         (Resend)
        sms.channel.ts           (Twilio)
        whatsapp.channel.ts      (Twilio)
        teams.channel.ts         (Webhook)
        
    payments/
      payments.module.ts
      payments.controller.ts
      payments.service.ts
      paystack.service.ts
      payment.entity.ts
      dto/
        create-payment.dto.ts
        
    analytics/
      analytics.module.ts
      analytics.controller.ts
      analytics.service.ts
      
    settings/
      settings.module.ts
      settings.controller.ts
      settings.service.ts
      settings.entity.ts
      dto/
        update-settings.dto.ts
        
    files/
      files.module.ts
      files.controller.ts
      files.service.ts
      cloudinary.service.ts
      attachment.entity.ts
      
    chat/
      chat.module.ts
      chat.controller.ts
      chat.service.ts
      stream.service.ts
      
    profile/
      profile.module.ts
      profile.controller.ts
      profile.service.ts
      dto/
        update-profile.dto.ts
        change-password.dto.ts
        
    sla/
      sla.module.ts
      sla.service.ts
      sla.cron.ts
      queues/
        sla.queue.ts
        sla.worker.ts
```

---

## 15. Data Type Reference

All TypeScript type mappings between frontend and backend:

| Frontend Type | Backend TypeORM Column | PostgreSQL Type |
|--------------|----------------------|-----------------|
| `string` (UUID) | `@PrimaryGeneratedColumn('uuid')` | `UUID` |
| `string` (ISO date) | `@Column({ type: 'timestamptz' })` | `TIMESTAMPTZ` |
| `string` (date only) | `@Column({ type: 'date' })` | `DATE` |
| `string` (time) | `@Column({ type: 'time' })` | `TIME` |
| `number` (milliseconds) | `@Column({ type: 'bigint' })` | `BIGINT` |
| `number` (currency) | `@Column({ type: 'numeric', precision: 15, scale: 2 })` | `NUMERIC(15,2)` |
| `boolean` | `@Column({ type: 'boolean' })` | `BOOLEAN` |
| `string[]` (tags) | Separate `ticket_tags` table | `VARCHAR(100)` |
| `Reaction[]` | Separate `comment_reactions` table | — |
| `Attachment[]` | Separate `attachments` table | — |
| `TransferEntry[]` | Separate `ticket_transfers` table | — |
| `Comment[]` | Separate `comments` table | — |

**Frontend `avatarInitials`** — not stored. Computed server-side:
```typescript
function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}
```

**Frontend `activeTicketCount`** — not stored. Computed via SQL:
```sql
SELECT COUNT(*) FROM tickets 
WHERE department_id = $1 
  AND status NOT IN ('resolved','closed');
```

Cached in Redis with key `dept:active-count:<id>`, TTL 2 minutes.

---

## 16. Seed Data

On first run, the NestJS bootstrap should:
1. Run TypeORM migrations
2. Check if `settings` table has a row; if not, `INSERT` the default singleton row
3. Check if Keycloak realm `flowdesk` has users; if not, seed the demo users via Keycloak Admin API
4. Seed departments, tickets, roster, payments, notifications matching the frontend mock data shapes

Provide a `DatabaseSeeder` service (`npm run seed`) that resets and re-seeds all data from the mock arrays for development environments.

---

## 17. API Response Shape Conventions

All API responses follow consistent conventions:

**Success response:**
```json
{
  "data": <payload>,
  "meta": { "requestId": "uuid", "timestamp": "ISO" }
}
```

**List response:**
```json
{
  "data": [],
  "total": 25,
  "page": 1,
  "limit": 25,
  "meta": { "requestId": "uuid", "timestamp": "ISO" }
}
```

**Error response:**
```json
{
  "statusCode": 400,
  "error": "Bad Request",
  "message": "title must not be empty",
  "meta": { "requestId": "uuid", "timestamp": "ISO" }
}
```

Use a global `TransformInterceptor` to wrap all responses in this envelope and a global `HttpExceptionFilter` for consistent error shapes.

---

*End of Backend PRD*
