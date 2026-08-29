import { useMemo, useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Ticket,
  Building2,
  Users,
  BarChart3,
  MessageSquare,
  Bell,
  Settings,
  Calendar,
  Plus,
  Wrench,
  ClipboardList,
  User,
  ChevronLeft,
  ChevronRight,
  LogOut,
} from 'lucide-react';
import type { ReactNode, ReactElement } from 'react';
import type { UserRole } from '../../types/index';
import { useAuthStore } from '../../store/authStore';
import { useUIStore } from '../../store/uiStore';
import { useNotifications } from '../../hooks/useNotifications';
import logo from '../../assets/logo.png';
import styles from './Sidebar.module.css';

// ── Types ──────────────────────────────────────────────────────────────────

interface NavEntry {
  label: string;
  to: string;
  icon: ReactNode;
  badge?: number;
}

type NavStructure = Array<NavEntry | 'divider'>;

// ── Role label ─────────────────────────────────────────────────────────────

function formatRole(role: UserRole): string {
  switch (role) {
    case 'root_admin': return 'Root Admin';
    case 'dept_head': return 'Department Head';
    case 'team_member': return 'Team Member';
  }
}

// ── Main component ─────────────────────────────────────────────────────────

export function Sidebar(): ReactElement {
  const currentUser = useAuthStore((s) => s.currentUser);
  const logout = useAuthStore((s) => s.logout);
  const { sidebarCollapsed, sidebarMobileOpen, toggleSidebar, setSidebarMobileOpen } = useUIStore();
  const navigate = useNavigate();
  const { unreadCount: unreadNotifs } = useNotifications();
  // Chat unread count — placeholder until Stream.io integration is complete
  const [unreadChats] = useState(0);

  const navItems = useMemo((): NavStructure => {
    const role = currentUser?.role;
    if (role === 'root_admin') {
      return [
        { label: 'Dashboard', to: '/dashboard', icon: <LayoutDashboard size={18} /> },
        { label: 'All Tickets', to: '/tickets', icon: <Ticket size={18} /> },
        { label: 'Departments', to: '/departments', icon: <Building2 size={18} /> },
        { label: 'Utility', to: '/utilities', icon: <Wrench size={18} /> },
        { label: 'Utility Request', to: '/utility-requests', icon: <ClipboardList size={18} /> },
        { label: 'Users', to: '/users', icon: <Users size={18} /> },
        { label: 'Analytics', to: '/analytics', icon: <BarChart3 size={18} /> },
        { label: 'Chat', to: '/chat', icon: <MessageSquare size={18} />, badge: unreadChats },
        { label: 'Notifications', to: '/notifications', icon: <Bell size={18} />, badge: unreadNotifs },
        'divider',
        { label: 'Settings', to: '/settings', icon: <Settings size={18} /> },
      ];
    }
    if (role === 'dept_head') {
      return [
        { label: 'Dashboard', to: '/dashboard', icon: <LayoutDashboard size={18} /> },
        { label: 'Dept Tickets', to: '/tickets', icon: <Ticket size={18} /> },
        { label: 'Utility Request', to: '/utility-requests', icon: <ClipboardList size={18} /> },
        { label: 'Team Roster', to: '/roster', icon: <Calendar size={18} /> },
        { label: 'Team Members', to: '/team', icon: <Users size={18} /> },
        { label: 'Analytics', to: '/analytics', icon: <BarChart3 size={18} /> },
        { label: 'Chat', to: '/chat', icon: <MessageSquare size={18} />, badge: unreadChats },
        { label: 'Notifications', to: '/notifications', icon: <Bell size={18} />, badge: unreadNotifs },
        'divider',
        { label: 'Profile', to: '/profile', icon: <User size={18} /> },
      ];
    }
    // team_member (default)
    return [
      { label: 'My Dashboard', to: '/dashboard', icon: <LayoutDashboard size={18} /> },
      { label: 'My Tickets', to: '/tickets', icon: <Ticket size={18} /> },
      { label: 'Create Ticket', to: '/tickets/new', icon: <Plus size={18} /> },
      { label: 'Utility Request', to: '/utility-requests', icon: <ClipboardList size={18} /> },
      { label: 'Chat', to: '/chat', icon: <MessageSquare size={18} />, badge: unreadChats },
      { label: 'Notifications', to: '/notifications', icon: <Bell size={18} />, badge: unreadNotifs },
      'divider',
      { label: 'Profile', to: '/profile', icon: <User size={18} /> },
    ];
  }, [currentUser?.role, unreadChats, unreadNotifs]);

  const handleLogout = (): void => {
    logout();
    navigate('/login', { replace: true });
  };

  const closeMobile = (): void => setSidebarMobileOpen(false);

  const sidebarClass = [
    styles.sidebar,
    sidebarCollapsed ? styles.collapsed : '',
  ].filter(Boolean).join(' ');

  // We detect mobile via CSS, but for JS-driven overlay we use the store
  return (
    <>
      {/* Mobile backdrop */}
      <div
        className={`${styles.mobileBackdrop}${sidebarMobileOpen ? ` ${styles.mobileBackdropVisible}` : ''}`}
        onClick={closeMobile}
        aria-hidden="true"
      />

      <aside
        className={sidebarClass}
        aria-label="Main navigation"
      >
        {/* Logo */}
        <div className={styles.logoArea}>
          <img src={logo} alt="Bet9ja" className={styles.logoImg} />
        </div>

        {/* Collapse toggle */}
        <button
          type="button"
          className={styles.toggleBtn}
          onClick={toggleSidebar}
          aria-label={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          title={sidebarCollapsed ? 'Expand' : 'Collapse'}
        >
          {sidebarCollapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
        </button>

        {/* Navigation */}
        <nav className={styles.nav} aria-label="Primary">
          {navItems.map((item, idx) => {
            if (item === 'divider') {
              return <div key={`divider-${idx}`} className={styles.divider} role="separator" />;
            }
            const hasBadge = typeof item.badge === 'number' && item.badge > 0;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === '/dashboard'}
                className={({ isActive }) =>
                  `${styles.navItem}${isActive ? ` ${styles.active}` : ''}`
                }
                onClick={sidebarMobileOpen ? closeMobile : undefined}
              >
                <span className={styles.navIcon} aria-hidden="true">
                  {item.icon}
                </span>
                <span className={styles.navLabel}>{item.label}</span>
                {hasBadge && (
                  <>
                    <span className={styles.navBadge} aria-label={`${item.badge} unread`}>
                      {(item.badge ?? 0) > 99 ? '99+' : item.badge}
                    </span>
                    <span className={styles.iconBadge} aria-hidden="true">
                      {(item.badge ?? 0) > 9 ? '9+' : item.badge}
                    </span>
                  </>
                )}
                {/* Tooltip for collapsed state */}
                <span className={styles.tooltip} aria-hidden="true">
                  {item.label}
                  {hasBadge ? ` (${item.badge})` : ''}
                </span>
              </NavLink>
            );
          })}
        </nav>

        {/* Footer: user + logout */}
        {currentUser && (
          <div className={styles.footer}>
            <div className={styles.userRow}>
              <span
                className={styles.avatar}
                style={{ backgroundColor: currentUser.avatarColor }}
                aria-hidden="true"
              >
                {currentUser.avatarInitials}
              </span>
              <div className={styles.userInfo}>
                <span className={styles.userName}>{currentUser.name}</span>
                <span className={styles.userRole}>{formatRole(currentUser.role)}</span>
              </div>
            </div>
            <button
              type="button"
              className={styles.logoutBtn}
              onClick={handleLogout}
              title="Sign out"
            >
              <span className={styles.navIcon} aria-hidden="true">
                <LogOut size={18} />
              </span>
              <span className={styles.logoutLabel}>Sign out</span>
            </button>
          </div>
        )}
      </aside>
    </>
  );
}
