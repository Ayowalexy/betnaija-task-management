import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import type { Notification } from '@/types/index';
import { notificationsApi } from '@/api/notifications';
import { NotificationItem } from './NotificationItem';
import styles from './NotificationDropdown.module.css';

interface NotificationDropdownProps {
  isOpen: boolean;
  onClose: () => void;
}

export function NotificationDropdown({ isOpen, onClose }: NotificationDropdownProps) {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState<Notification[]>([]);

  useEffect(() => {
    if (!isOpen) return;
    notificationsApi.list({ limit: 10 }).then((res) => {
      setNotifications(res.data);
    }).catch(() => { /* silent */ });
  }, [isOpen]);

  if (!isOpen) return null;

  const recent = notifications.slice(0, 10);

  async function handleMarkAll() {
    try {
      await notificationsApi.markAllRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    } catch { /* silent */ }
  }

  async function handleClick(notif: Notification) {
    if (!notif.isRead) {
      try {
        await notificationsApi.markRead(notif.id);
        setNotifications((prev) =>
          prev.map((n) => (n.id === notif.id ? { ...n, isRead: true } : n))
        );
      } catch { /* silent */ }
    }
    if (notif.ticketId) {
      navigate(`/tickets/${notif.ticketId}`);
    }
    onClose();
  }

  return (
    <>
      <div className={styles.overlay} onClick={onClose} />
      <div className={styles.panel} role="dialog" aria-label="Notifications">
        <div className={styles.header}>
          <h3 className={styles.title}>Notifications</h3>
          <button className={styles.markAllBtn} onClick={handleMarkAll}>
            Mark all as read
          </button>
        </div>
        <div className={styles.list}>
          {recent.length === 0 ? (
            <p className={styles.empty}>No notifications</p>
          ) : (
            recent.map((n) => (
              <NotificationItem key={n.id} notification={n} onClick={() => handleClick(n)} />
            ))
          )}
        </div>
        <div className={styles.footer}>
          <Link to="/notifications" className={styles.viewAllLink} onClick={onClose}>
            View all notifications
          </Link>
        </div>
      </div>
    </>
  );
}
