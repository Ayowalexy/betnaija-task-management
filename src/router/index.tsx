import { createBrowserRouter, Navigate } from 'react-router-dom';
import { AppShell } from '../components/layout/AppShell';
import { ErrorBoundary } from '../components/shared/ErrorBoundary';
import { NotFoundPage } from '../pages/NotFoundPage';
import { RoleGuard } from './guards';

// Auth pages
import { LoginPage } from '../features/auth/components/LoginPage';
import { ForceResetPage } from '../features/auth/components/ForceResetPage';

// Dashboard pages
import { AdminDashboard } from '../features/dashboard/components/AdminDashboard';
import { DeptHeadDashboard } from '../features/dashboard/components/DeptHeadDashboard';
import { TeamMemberDashboard } from '../features/dashboard/components/TeamMemberDashboard';

// Ticket pages
import { TicketListPage } from '../pages/TicketListPage';
import { TicketDetailPage } from '../pages/TicketDetailPage';
import { CreateTicketPage } from '../features/tickets/components/CreateTicketPage';

// Department pages
import { DepartmentsPage } from '../features/departments/components/DepartmentsPage';
import { DepartmentDetailPage } from '../features/departments/components/DepartmentDetailPage';

// Utility pages
import { UtilitiesPage } from '../features/utilities/components/UtilitiesPage';
import { UtilityDetailPage } from '../features/utilities/components/UtilityDetailPage';

// Utility Request pages
import { UtilityRequestListPage } from '../pages/UtilityRequestListPage';
import { UtilityRequestDetailPage } from '../pages/UtilityRequestDetailPage';
import { CreateUtilityRequestPage } from '../features/utility-requests/components/CreateUtilityRequestPage';

// User pages
import { UsersPage } from '../features/users/components/UsersPage';

// Other pages
import { AnalyticsPage } from '../features/analytics/components/AnalyticsPage';
import { RosterPage } from '../features/roster/components/RosterPage';
import { DepartmentUtilitiesPage } from '../features/utilities/components/DepartmentUtilitiesPage';
import { ChatPage } from '../features/chat/components/ChatPage';
import { NotificationsPage } from '../features/notifications/components/NotificationsPage';
import { SettingsPage } from '../features/settings/components/SettingsPage';
import { ProfilePage } from '../features/profile/components/ProfilePage';
import { PaymentsPage } from '../features/payments/components/PaymentsPage';

// Role-aware dashboard wrapper
import { DashboardPage } from '../pages/DashboardPage';

export const router = createBrowserRouter([
  {
    path: '/login',
    element: <LoginPage />,
  },
  {
    path: '/reset-password',
    element: <ForceResetPage />,
  },
  {
    element: <AppShell />,
    errorElement: <NotFoundPage />,
    children: [
      {
        path: '/dashboard',
        element: (
          <ErrorBoundary>
            <DashboardPage
              AdminDashboard={AdminDashboard}
              DeptHeadDashboard={DeptHeadDashboard}
              TeamMemberDashboard={TeamMemberDashboard}
            />
          </ErrorBoundary>
        ),
      },
      {
        path: '/tickets',
        element: (
          <ErrorBoundary>
            <TicketListPage />
          </ErrorBoundary>
        ),
      },
      {
        path: '/tickets/new',
        element: (
          <ErrorBoundary>
            <CreateTicketPage />
          </ErrorBoundary>
        ),
      },
      {
        path: '/tickets/:id',
        element: (
          <ErrorBoundary>
            <TicketDetailPage />
          </ErrorBoundary>
        ),
      },
      {
        path: '/departments',
        element: (
          <ErrorBoundary>
            <RoleGuard allowed={['root_admin']}>
              <DepartmentsPage />
            </RoleGuard>
          </ErrorBoundary>
        ),
      },
      {
        path: '/departments/:id',
        element: (
          <ErrorBoundary>
            <RoleGuard allowed={['root_admin']}>
              <DepartmentDetailPage />
            </RoleGuard>
          </ErrorBoundary>
        ),
      },
      {
        path: '/utilities',
        element: (
          <ErrorBoundary>
            <RoleGuard allowed={['root_admin']}>
              <UtilitiesPage />
            </RoleGuard>
          </ErrorBoundary>
        ),
      },
      {
        path: '/utilities/:id',
        element: (
          <ErrorBoundary>
            <RoleGuard allowed={['root_admin']}>
              <UtilityDetailPage />
            </RoleGuard>
          </ErrorBoundary>
        ),
      },
      {
        path: '/utility-requests',
        element: (
          <ErrorBoundary>
            <UtilityRequestListPage />
          </ErrorBoundary>
        ),
      },
      {
        path: '/utility-requests/new',
        element: (
          <ErrorBoundary>
            <CreateUtilityRequestPage />
          </ErrorBoundary>
        ),
      },
      {
        path: '/utility-requests/:id',
        element: (
          <ErrorBoundary>
            <UtilityRequestDetailPage />
          </ErrorBoundary>
        ),
      },
      {
        path: '/users',
        element: (
          <ErrorBoundary>
            <RoleGuard allowed={['root_admin']}>
              <UsersPage />
            </RoleGuard>
          </ErrorBoundary>
        ),
      },
      {
        path: '/analytics',
        element: (
          <ErrorBoundary>
            <RoleGuard allowed={['root_admin', 'dept_head']}>
              <AnalyticsPage />
            </RoleGuard>
          </ErrorBoundary>
        ),
      },
      {
        path: '/roster',
        element: (
          <ErrorBoundary>
            <RoleGuard allowed={['dept_head']}>
              <RosterPage />
            </RoleGuard>
          </ErrorBoundary>
        ),
      },
      {
        path: '/department-utilities',
        element: (
          <ErrorBoundary>
            <RoleGuard allowed={['dept_head']}>
              <DepartmentUtilitiesPage />
            </RoleGuard>
          </ErrorBoundary>
        ),
      },
      {
        path: '/team',
        element: (
          <ErrorBoundary>
            <RoleGuard allowed={['dept_head']}>
              <UsersPage />
            </RoleGuard>
          </ErrorBoundary>
        ),
      },
      {
        path: '/chat',
        element: (
          <ErrorBoundary>
            <ChatPage />
          </ErrorBoundary>
        ),
      },
      {
        path: '/chat/:conversationId',
        element: (
          <ErrorBoundary>
            <ChatPage />
          </ErrorBoundary>
        ),
      },
      {
        path: '/notifications',
        element: (
          <ErrorBoundary>
            <NotificationsPage />
          </ErrorBoundary>
        ),
      },
      {
        path: '/settings',
        element: (
          <ErrorBoundary>
            <RoleGuard allowed={['root_admin']}>
              <SettingsPage />
            </RoleGuard>
          </ErrorBoundary>
        ),
      },
      {
        path: '/profile',
        element: (
          <ErrorBoundary>
            <ProfilePage />
          </ErrorBoundary>
        ),
      },
      {
        path: '/payments',
        element: (
          <ErrorBoundary>
            <RoleGuard allowed={['root_admin', 'dept_head']}>
              <PaymentsPage />
            </RoleGuard>
          </ErrorBoundary>
        ),
      },
      {
        path: '/',
        element: <Navigate to="/dashboard" replace />,
      },
    ],
  },
  {
    path: '*',
    element: <Navigate to="/dashboard" replace />,
  },
]);
