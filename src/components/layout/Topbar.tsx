import { useState, useEffect, useRef } from 'react';
import type { ReactElement } from 'react';
import { useNavigate } from 'react-router-dom';
import { Menu, Sun, Moon, Bell, User, LogOut } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { useUIStore } from '@/store/uiStore';
import { useTheme } from '@/hooks/useTheme';
import { useNotifications } from '@/hooks/useNotifications';
import styles from './Topbar.module.css';

interface TopbarProps {
  title?: string;
}

export function Topbar({ title }: TopbarProps): ReactElement {
  const currentUser = useAuthStore((s) => s.currentUser);
  const logout = useAuthStore((s) => s.logout);
  const setSidebarMobileOpen = useUIStore((s) => s.setSidebarMobileOpen);
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const { unreadCount: unreadNotifs } = useNotifications();

  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    if (!dropdownOpen) return;
    function handleClick(e: MouseEvent): void {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node)
      ) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [dropdownOpen]);

  // Close dropdown on Escape
  useEffect(() => {
    if (!dropdownOpen) return;
    function handleKey(e: KeyboardEvent): void {
      if (e.key === 'Escape') setDropdownOpen(false);
    }
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [dropdownOpen]);

  const handleLogout = (): void => {
    setDropdownOpen(false);
    logout();
    navigate('/login', { replace: true });
  };

  const handleProfile = (): void => {
    setDropdownOpen(false);
    navigate('/profile');
  };

  const displayTitle = title ?? document.title;

  return (
    <header className={styles.topbar} role="banner">
      {/* Mobile hamburger */}
      <button
        type="button"
        className={styles.hamburger}
        onClick={() => setSidebarMobileOpen(true)}
        aria-label="Open navigation"
      >
        <Menu size={20} />
      </button>

      {/* Page title */}
      <h1 className={styles.title}>{displayTitle}</h1>

      {/* Right controls */}
      <div className={styles.right}>
        {/* Theme toggle */}
        <button
          type="button"
          className={styles.iconBtn}
          onClick={toggleTheme}
          aria-label={theme === 'light' ? 'Switch to dark mode' : 'Switch to light mode'}
          title={theme === 'light' ? 'Dark mode' : 'Light mode'}
        >
          {theme === 'light' ? <Moon size={18} /> : <Sun size={18} />}
        </button>

        {/* Notification bell */}
        <button
          type="button"
          className={styles.iconBtn}
          onClick={() => navigate('/notifications')}
          aria-label={`Notifications${unreadNotifs > 0 ? `, ${unreadNotifs} unread` : ''}`}
          title="Notifications"
        >
          <Bell size={18} />
          {unreadNotifs > 0 && (
            <span className={styles.badge} aria-hidden="true">
              {unreadNotifs > 99 ? '99+' : unreadNotifs}
            </span>
          )}
        </button>

        {/* User avatar + dropdown */}
        {currentUser && (
          <div className={styles.dropdownAnchor} ref={dropdownRef}>
            <button
              type="button"
              className={styles.avatarBtn}
              onClick={() => setDropdownOpen((o) => !o)}
              aria-label="User menu"
              aria-expanded={dropdownOpen}
              aria-haspopup="menu"
            >
              <span
                className={styles.avatar}
                style={{ backgroundColor: currentUser.avatarColor }}
              >
                {currentUser.avatarInitials}
              </span>
            </button>

            {dropdownOpen && (
              <div className={styles.dropdown} role="menu">
                <button
                  type="button"
                  className={styles.dropdownItem}
                  onClick={handleProfile}
                  role="menuitem"
                >
                  <User size={16} aria-hidden="true" />
                  My Profile
                </button>
                <div className={styles.dropdownDivider} role="separator" />
                <button
                  type="button"
                  className={`${styles.dropdownItem} ${styles.danger}`}
                  onClick={handleLogout}
                  role="menuitem"
                >
                  <LogOut size={16} aria-hidden="true" />
                  Logout
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </header>
  );
}
