import { Bell, CheckCircle, XCircle, Ticket, AlertTriangle, MessageSquare, CreditCard, ArrowRight, ClipboardList } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import type { Notification } from '@/types/index';
import styles from './NotificationItem.module.css';

interface NotificationItemProps {
  notification: Notification;
  onClick: () => void;
}

function NotifIcon({ type }: { type: Notification['type'] }) {
  const icons: Record<Notification['type'], React.ReactNode> = {
    ticket_assigned: <Bell size={16} />,
    ticket_accepted: <CheckCircle size={16} />,
    ticket_rejected: <XCircle size={16} />,
    new_ticket: <Ticket size={16} />,
    sla_warning: <AlertTriangle size={16} />,
    ticket_resolved: <CheckCircle size={16} />,
    new_comment: <MessageSquare size={16} />,
    payment_initiated: <CreditCard size={16} />,
    ticket_escalated: <AlertTriangle size={16} />,
    ticket_transferred: <ArrowRight size={16} />,
    utility_request_submitted: <ClipboardList size={16} />,
    utility_request_approved: <CheckCircle size={16} />,
    utility_request_rejected: <XCircle size={16} />,
    utility_request_completed: <CheckCircle size={16} />,
  };
  return <>{icons[type]}</>;
}

export function NotificationItem({ notification, onClick }: NotificationItemProps) {
  const timeAgo = formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true });

  return (
    <div
      className={`${styles.item}${!notification.isRead ? ` ${styles.unread}` : ''}`}
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === 'Enter' && onClick()}
    >
      <div className={`${styles.iconWrap} ${styles[notification.type]}`}>
        <NotifIcon type={notification.type} />
      </div>
      <div className={styles.body}>
        <p className={styles.title}>{notification.title}</p>
        <p className={styles.message}>{notification.message}</p>
        <span className={styles.time}>{timeAgo}</span>
      </div>
      {!notification.isRead && <span className={styles.unreadDot} aria-label="Unread" />}
    </div>
  );
}
