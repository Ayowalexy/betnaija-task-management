import type { ComponentType } from 'react';
import { useAuthStore } from '../store/authStore';

interface DashboardPageProps {
  AdminDashboard: ComponentType;
  DeptHeadDashboard: ComponentType;
  TeamMemberDashboard: ComponentType;
}

export function DashboardPage({ AdminDashboard, DeptHeadDashboard, TeamMemberDashboard }: DashboardPageProps) {
  const role = useAuthStore((s) => s.currentUser?.role);

  if (role === 'root_admin') return <AdminDashboard />;
  if (role === 'dept_head') return <DeptHeadDashboard />;
  return <TeamMemberDashboard />;
}
