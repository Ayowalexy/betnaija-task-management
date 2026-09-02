import { useState, useEffect, useMemo } from 'react';
import type { ReactElement } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import {
  Bell, Inbox, AlertTriangle, CheckCircle2, MessageSquare,
  CreditCard, TrendingUp, ArrowRightLeft, ChevronLeft, ChevronRight,
} from 'lucide-react';
import type { Notification, NotificationType } from '@/types/index.js';
import { notificationsApi } from '@/api/notifications.js';
import { useToast } from '@/hooks/useToast.js';
import { usePagination } from '@/hooks/usePagination.js';
import { Button, Tabs } from '@/components/ui/index.js';
import { PageWrapper } from '@/components/layout/PageWrapper.js';
import styles from './NotificationsPage.module.css';

type FilterTab = 'all' | 'unread' | 'tickets' | 'sla' | 'payments';

const FILTER_TABS: FilterTab[] = ['all', 'unread', 'tickets', 'sla', 'payments'];

const PAGE_SIZE = 10;

interface IconConfig {
  icon: ReactElement;
  bg: string;
  color: string;
}

function getIconConfig(type: NotificationType): IconConfig {
  switch (type) {
    case 'ticket_assigned':    return { icon: <Inbox size={18} />,         bg: '#dde4fd', color: '#4f6ef7' };
    case 'sla_warning':        return { icon: <AlertTriangle size={18} />,  bg: '#fef3c7', color: '#d97706' };
    case 'ticket_resolved':    return { icon: <CheckCircle2 size={18} />,   bg: '#d1fae5', color: '#059669' };
    case 'new_comment':        return { icon: <MessageSquare size={18} />,  bg: '#ede9fe', color: '#7c3aed' };
    case 'payment_initiated':  return { icon: <CreditCard size={18} />,     bg: '#ccfbf1', color: '#0f766e' };
    case 'ticket_escalated':   return { icon: <TrendingUp size={18} />,     bg: '#fee2e2', color: '#dc2626' };
    case 'ticket_transferred': return { icon: <ArrowRightLeft size={18} />, bg: '#e0e7ff', color: '#4338ca' };
    default:                   return { icon: <Bell size={18} />,           bg: '#f1f3f8', color: '#6b7280' };
  }
}

function matchesTab(n: Notification, tab: FilterTab): boolean {
  if (tab === 'all') return true;
  if (tab === 'unread') return !n.isRead;
  if (tab === 'tickets') return n.type === 'ticket_assigned' || n.type === 'ticket_resolved' || n.type === 'ticket_escalated' || n.type === 'ticket_transferred';
  if (tab === 'sla') return n.type === 'sla_warning';
  if (tab === 'payments') return n.type === 'payment_initiated';
  return true;
}

export function NotificationsPage(): ReactElement {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [searchParams, setSearchParams] = useSearchParams();

  const rawTab = searchParams.get('tab');
  const activeTab: FilterTab = rawTab && FILTER_TABS.includes(rawTab as FilterTab) ? (rawTab as FilterTab) : 'all';

  function setActiveTab(tab: FilterTab): void {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      next.set('tab', tab);
      return next;
    });
  }

  const [state, setState] = useState({ notifications: [] as Notification[], loading: true, unreadCount: 0 });
  const { notifications, loading, unreadCount } = state;

  async function loadNotifications() {
    try {
      setState((s) => ({ ...s, loading: true }));
      const res = await notificationsApi.list({ page: 1, limit: 100 });
      const sorted = [...res.data].sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
      setState({
        notifications: sorted,
        loading: false,
        unreadCount: res.unreadCount ?? sorted.filter((n) => !n.isRead).length,
      });
    } catch {
      toast({ type: 'error', message: 'Failed to load notifications' });
      setState((s) => ({ ...s, loading: false }));
    }
  }

  useEffect(() => {
    loadNotifications();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleMarkAll(): Promise<void> {
    try {
      await notificationsApi.markAllRead();
      await loadNotifications();
      toast({ type: 'success', message: 'All notifications marked as read' });
    } catch {
      toast({ type: 'error', message: 'Failed to mark all as read' });
    }
  }

  async function handleClick(notif: Notification): Promise<void> {
    if (!notif.isRead) {
      try {
        await notificationsApi.markRead(notif.id);
        setState((s) => ({
          ...s,
          notifications: s.notifications.map((n) => (n.id === notif.id ? { ...n, isRead: true } : n)),
          unreadCount: Math.max(0, s.unreadCount - 1),
        }));
      } catch {
        // best-effort
      }
    }
    if (notif.ticketId) navigate(`/tickets/${notif.ticketId}`);
    else if (notif.utilityRequestId) navigate(`/utility-requests/${notif.utilityRequestId}`);
  }

  const filtered = useMemo(
    () => notifications.filter((n) => matchesTab(n, activeTab)),
    [notifications, activeTab]
  );

  const { page, totalPages, paginatedItems, goToPage, nextPage, prevPage, canNext, canPrev } =
    usePagination(filtered, PAGE_SIZE);

  function handleTabChange(id: string): void {
    setActiveTab(id as FilterTab);
    goToPage(1);
  }

  const tabs = [
    { id: 'all', label: 'All', count: notifications.length },
    { id: 'unread', label: 'Unread', count: unreadCount },
    { id: 'tickets', label: 'Tickets' },
    { id: 'sla', label: 'SLA Alerts' },
    { id: 'payments', label: 'Payments' },
  ];

  return (
    <PageWrapper
      title="Notifications"
      subtitle="Stay updated on tickets, SLA alerts, and team activity"
      actions={
        <Button variant="outline" size="sm" onClick={handleMarkAll} disabled={unreadCount === 0}>
          Mark all as read
        </Button>
      }
    >
      <div className={styles.tabsRow}>
        <Tabs tabs={tabs} activeTab={activeTab} onChange={handleTabChange} variant="pill" />
        {unreadCount > 0 && (
          <span className={styles.unreadBadge}>{unreadCount} unread</span>
        )}
      </div>

      {loading ? (
        <div className={styles.emptyWrap}>
          <p className={styles.emptySubtitle}>Loading notifications…</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className={styles.emptyWrap}>
          <div className={styles.emptyIcon}><CheckCircle2 size={40} strokeWidth={1.5} /></div>
          <p className={styles.emptyTitle}>You&apos;re all caught up!</p>
          <p className={styles.emptySubtitle}>No notifications here.</p>
        </div>
      ) : (
        <>
          <div className={styles.list}>
            {paginatedItems.map((n) => {
              const cfg = getIconConfig(n.type);
              return (
                <button
                  key={n.id}
                  className={[styles.item, !n.isRead ? styles.itemUnread : ''].filter(Boolean).join(' ')}
                  onClick={() => handleClick(n)}
                >
                  <span
                    className={styles.iconCircle}
                    style={{ background: cfg.bg, color: cfg.color }}
                    aria-hidden="true"
                  >
                    {cfg.icon}
                  </span>

                  <div className={styles.body}>
                    <p className={styles.title}>{n.title}</p>
                    <p className={styles.message}>{n.message}</p>
                  </div>

                  <div className={styles.right}>
                    <span className={styles.time}>
                      {formatDistanceToNow(new Date(n.createdAt), { addSuffix: true })}
                    </span>
                    {!n.isRead && <span className={styles.dot} aria-label="Unread" />}
                  </div>
                </button>
              );
            })}
          </div>

          {totalPages > 1 && (
            <div className={styles.pagination} role="navigation" aria-label="Notifications pagination">
              <span className={styles.paginationInfo}>
                Page {page} of {totalPages}
              </span>
              <div className={styles.paginationControls}>
                <button
                  type="button"
                  className={styles.pageBtn}
                  onClick={prevPage}
                  disabled={!canPrev}
                  aria-label="Previous page"
                >
                  <ChevronLeft size={14} />
                </button>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                  <button
                    key={p}
                    type="button"
                    className={`${styles.pageBtn}${p === page ? ` ${styles.active}` : ''}`}
                    onClick={() => goToPage(p)}
                    aria-label={`Page ${p}`}
                    aria-current={p === page ? 'page' : undefined}
                  >
                    {p}
                  </button>
                ))}
                <button
                  type="button"
                  className={styles.pageBtn}
                  onClick={nextPage}
                  disabled={!canNext}
                  aria-label="Next page"
                >
                  <ChevronRight size={14} />
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </PageWrapper>
  );
}
