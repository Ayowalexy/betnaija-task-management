import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { formatDistanceToNow, format, addDays, isToday } from 'date-fns';
import { Ticket, Plus, Calendar, Bell, Inbox, AlertCircle, CheckCircle2, Clock, ArrowRight } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { ticketsApi } from '@/api/tickets';
import { rosterApi } from '@/api/roster';
import { notificationsApi } from '@/api/notifications';
import { Badge, getStatusVariant, getPriorityVariant } from '@/components/ui/index';
import { Button } from '@/components/ui/index';
import { Avatar } from '@/components/ui/index';
import { PageWrapper } from '@/components/layout/PageWrapper';
import type { Ticket as TicketType, Shift, Notification } from '@/types/index';
import styles from './TeamMemberDashboard.module.css';

const TODAY = new Date();
const WEEK_END = addDays(TODAY, 7);

const PRIORITY_BAR: Record<string, string> = {
  low: 'var(--color-priority-low)',
  medium: 'var(--color-priority-medium)',
  high: 'var(--color-priority-high)',
  critical: 'var(--color-priority-critical)',
};

function notifIcon(type: Notification['type']) {
  if (type === 'ticket_resolved') return <CheckCircle2 size={16} />;
  if (type === 'sla_warning' || type === 'ticket_escalated') return <AlertCircle size={16} />;
  return <Bell size={16} />;
}

function notifIconClass(type: Notification['type']): string {
  if (type === 'ticket_resolved') return styles.iconGreen;
  if (type === 'sla_warning' || type === 'ticket_escalated') return styles.iconOrange;
  return styles.iconBlue;
}

export function TeamMemberDashboard() {
  const navigate = useNavigate();
  const currentUser = useAuthStore((s) => s.currentUser);

  const [allTickets, setAllTickets] = useState<TicketType[]>([]);
  const [upcomingShifts, setUpcomingShifts] = useState<Shift[]>([]);
  const [recentNotifs, setRecentNotifs] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  const currentYearMonth = TODAY.toISOString().slice(0, 7);

  useEffect(() => {
    Promise.all([
      ticketsApi.list({ page: 1, limit: 25 }),
      rosterApi.list({ month: currentYearMonth }),
      notificationsApi.list({ limit: 5 }),
    ]).then(([ticketsRes, shiftsRes, notifsRes]) => {
      setAllTickets(ticketsRes.data);
      const userId = currentUser?.id;
      const shifts = shiftsRes.data
        .filter((s) => {
          const d = new Date(s.date);
          return s.userId === userId && d >= TODAY && d <= WEEK_END;
        })
        .sort((a, b) => a.date.localeCompare(b.date));
      setUpcomingShifts(shifts);
      setRecentNotifs(notifsRes.data.slice(0, 4));
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [currentUser?.id]);

  if (!currentUser) return null;

  const firstName = currentUser.name.split(' ')[0];

  const myOpenTickets = allTickets.filter(
    (t) => t.assigneeId === currentUser.id && t.status !== 'resolved' && t.status !== 'closed'
  );
  const myCreatedTickets = allTickets.filter((t) => t.requestorId === currentUser.id);
  const unreadCount = recentNotifs.filter((n) => !n.isRead).length;

  if (loading) {
    return (
      <PageWrapper title="My Dashboard" subtitle="">
        <p style={{ color: 'var(--color-text-secondary)', padding: '2rem' }}>Loading…</p>
      </PageWrapper>
    );
  }

  return (
    <PageWrapper title="My Dashboard" subtitle="">
      <div className={styles.shell}>

        {/* ── Welcome banner ── */}
        <div className={styles.banner}>
          <div className={styles.bannerLeft}>
            <h1 className={styles.bannerGreeting}>Good morning, {firstName} 👋</h1>
            <p className={styles.bannerDate}>{format(TODAY, 'EEEE, MMMM d, yyyy')}</p>
            <p className={styles.bannerSub}>Here's your activity overview</p>
          </div>
          <div className={styles.bannerRight}>
            <Avatar
              initials={currentUser.avatarInitials}
              color={currentUser.avatarColor}
              size="lg"
            />
            <div className={styles.bannerTimeBlock}>
              <span className={styles.bannerClock}>{format(TODAY, 'HH:mm')}</span>
              <span className={styles.bannerDayLabel}>{format(TODAY, 'EEE, MMM d')}</span>
            </div>
          </div>
        </div>

        {/* ── Stat mini-cards ── */}
        <div className={styles.statRow}>
          <div className={styles.statCard}>
            <div className={`${styles.statIcon} ${styles.statIconBlue}`}><Ticket size={18} /></div>
            <span className={styles.statNum}>{myOpenTickets.length}</span>
            <span className={styles.statLabel}>Open Tickets</span>
          </div>
          <div className={styles.statCard}>
            <div className={`${styles.statIcon} ${styles.statIconPurple}`}><Plus size={18} /></div>
            <span className={styles.statNum}>{myCreatedTickets.length}</span>
            <span className={styles.statLabel}>Tickets Created</span>
          </div>
          <div className={styles.statCard}>
            <div className={`${styles.statIcon} ${styles.statIconGreen}`}><Calendar size={18} /></div>
            <span className={styles.statNum}>{upcomingShifts.length}</span>
            <span className={styles.statLabel}>Upcoming Shifts</span>
          </div>
          <div className={styles.statCard}>
            <div className={`${styles.statIcon} ${styles.statIconOrange}`}><Bell size={18} /></div>
            <span className={styles.statNum}>{unreadCount}</span>
            <span className={styles.statLabel}>Unread Notifs</span>
          </div>
        </div>

        {/* ── Main 2-col grid ── */}
        <div className={styles.mainGrid}>

          {/* Left column */}
          <div className={styles.col}>

            {/* My Open Tickets */}
            <div className={styles.card}>
              <div className={styles.cardHeader}>
                <span className={styles.cardTitle}>My Open Tickets</span>
                <div className={styles.cardHeaderRight}>
                  <span className={styles.countBadge}>{myOpenTickets.length}</span>
                  <Link to="/tickets" className={styles.viewAll}>View all <ArrowRight size={12} /></Link>
                </div>
              </div>
              {myOpenTickets.length === 0 ? (
                <div className={styles.emptyState}>
                  <Inbox size={32} className={styles.emptyIcon} />
                  <p>No open tickets. Great work! 🎉</p>
                </div>
              ) : (
                <div className={styles.ticketList}>
                  {myOpenTickets.slice(0, 5).map((t) => (
                    <Link key={t.id} to={`/tickets/${t.id}`} className={styles.ticketRow}>
                      <span className={styles.priorityBar} style={{ background: PRIORITY_BAR[t.priority] }} />
                      <span className={styles.ticketTitle}>{t.title}</span>
                      <Badge variant={getStatusVariant(t.status)} size="sm">
                        {t.status.replace('_', ' ')}
                      </Badge>
                      <span className={styles.timeAgo}>
                        {formatDistanceToNow(new Date(t.createdAt), { addSuffix: true })}
                      </span>
                    </Link>
                  ))}
                </div>
              )}
            </div>

            {/* Tickets I Created */}
            <div className={styles.card}>
              <div className={styles.cardHeader}>
                <span className={styles.cardTitle}>Tickets I Created</span>
                <div className={styles.cardHeaderRight}>
                  <span className={styles.countBadge}>{myCreatedTickets.length}</span>
                  <Link to="/tickets" className={styles.viewAll}>View all <ArrowRight size={12} /></Link>
                </div>
              </div>
              {myCreatedTickets.length === 0 ? (
                <div className={styles.emptyState}>
                  <Inbox size={32} className={styles.emptyIcon} />
                  <p>You haven't created any tickets yet.</p>
                </div>
              ) : (
                <div className={styles.ticketList}>
                  {myCreatedTickets.slice(0, 5).map((t) => (
                    <Link key={t.id} to={`/tickets/${t.id}`} className={styles.ticketRow}>
                      <span className={styles.priorityBar} style={{ background: PRIORITY_BAR[t.priority] }} />
                      <span className={styles.ticketTitle}>{t.title}</span>
                      <Badge variant={getPriorityVariant(t.priority)} size="sm">
                        {t.priority}
                      </Badge>
                      <span className={styles.timeAgo}>{format(new Date(t.createdAt), 'MMM d')}</span>
                    </Link>
                  ))}
                </div>
              )}
            </div>

          </div>

          {/* Right column */}
          <div className={styles.col}>

            {/* Upcoming Shifts */}
            <div className={styles.card}>
              <div className={styles.cardHeader}>
                <span className={styles.cardTitle}>Upcoming Shifts</span>
                <Link to="/roster" className={styles.viewAll}>View roster <ArrowRight size={12} /></Link>
              </div>
              {upcomingShifts.length === 0 ? (
                <div className={styles.emptyState}>
                  <Calendar size={32} className={styles.emptyIcon} />
                  <p>No upcoming shifts this week.</p>
                </div>
              ) : (
                <div className={styles.shiftList}>
                  {upcomingShifts.map((s) => {
                    const d = new Date(s.date);
                    const todayShift = isToday(d);
                    return (
                      <div key={s.id} className={styles.shiftRow}>
                        <div className={`${styles.shiftCalIcon} ${todayShift ? styles.shiftCalIconToday : ''}`}>
                          <span className={styles.shiftDayAbbr}>{format(d, 'EEE')}</span>
                          <span className={styles.shiftDayNum}>{format(d, 'd')}</span>
                        </div>
                        <div className={styles.shiftInfo}>
                          <span className={styles.shiftDateLabel}>{format(d, 'EEE, MMM d')}</span>
                          <span className={styles.shiftTime}>
                            <Clock size={11} /> {s.startTime} – {s.endTime}
                          </span>
                        </div>
                        {todayShift && <span className={styles.todayBadge}>Today</span>}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Recent Notifications */}
            <div className={styles.card}>
              <div className={styles.cardHeader}>
                <span className={styles.cardTitle}>Recent Notifications</span>
                <Link to="/notifications" className={styles.viewAll}>View all <ArrowRight size={12} /></Link>
              </div>
              {recentNotifs.length === 0 ? (
                <div className={styles.emptyState}>
                  <Bell size={32} className={styles.emptyIcon} />
                  <p>No recent notifications.</p>
                </div>
              ) : (
                <div className={styles.notifList}>
                  {recentNotifs.map((n) => (
                    <Link key={n.id} to="/notifications" className={styles.notifRow}>
                      <div className={`${styles.notifIconCircle} ${notifIconClass(n.type)}`}>
                        {notifIcon(n.type)}
                      </div>
                      <div className={styles.notifContent}>
                        <span className={styles.notifTitle}>{n.title}</span>
                        <span className={styles.notifMsg}>{n.message.slice(0, 60)}…</span>
                        <span className={styles.notifTime}>
                          {formatDistanceToNow(new Date(n.createdAt), { addSuffix: true })}
                        </span>
                      </div>
                      {!n.isRead && <span className={styles.unreadDot} aria-label="Unread" />}
                    </Link>
                  ))}
                </div>
              )}
            </div>

          </div>
        </div>

        {/* ── Quick action bar ── */}
        <div className={styles.quickBar}>
          <Button onClick={() => navigate('/tickets/new')}>
            <Plus size={16} /> Create Ticket
          </Button>
          <Button variant="secondary" onClick={() => navigate('/tickets')}>
            <Ticket size={16} /> View My Tickets
          </Button>
          <Button variant="ghost" onClick={() => navigate('/roster')}>
            <Calendar size={16} /> View Roster
          </Button>
        </div>

      </div>
    </PageWrapper>
  );
}
