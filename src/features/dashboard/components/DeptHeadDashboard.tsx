import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Ticket, CheckCircle, Clock, Activity } from 'lucide-react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';
import { formatDistanceToNow } from 'date-fns';
import { useAuthStore } from '@/store/authStore';
import { ticketsApi } from '@/api/tickets';
import { rosterApi } from '@/api/roster';
import { PageWrapper } from '@/components/layout/PageWrapper';
import { Avatar } from '@/components/ui/index';
import { StatCard } from './StatCard';
import type { Ticket as TicketType, Shift } from '@/types/index';
import styles from './DeptHeadDashboard.module.css';

export function DeptHeadDashboard() {
  const currentUser = useAuthStore((s) => s.currentUser);
  const deptId = currentUser?.departmentId ?? 'tech';

  const [deptTickets, setDeptTickets] = useState<TicketType[]>([]);
  const [todayShifts, setTodayShifts] = useState<Shift[]>([]);
  const [loading, setLoading] = useState(true);

  const currentMonth = new Date().toISOString().slice(0, 7);
  const todayStr = new Date().toISOString().slice(0, 10);

  useEffect(() => {
    Promise.all([
      ticketsApi.list({ page: 1, limit: 100, ...(currentUser?.departmentId ? { departmentIds: [currentUser.departmentId] } : {}) }),
      rosterApi.list({ month: currentMonth }),
    ]).then(([ticketsRes, shiftsRes]) => {
      setDeptTickets(ticketsRes.data);
      setTodayShifts(shiftsRes.data.filter((s) => s.departmentId === deptId && s.date === todayStr));
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  const openCount = deptTickets.filter((t) => t.status === 'open').length;
  const inProgressCount = deptTickets.filter((t) => t.status === 'in_progress').length;
  const weekAgoStr = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
  const resolvedThisWeek = deptTickets.filter((t) => t.resolvedAt && t.resolvedAt >= weekAgoStr).length;
  const slaOk = deptTickets.filter((t) => t.status !== 'defaulted' && t.status !== 'escalated').length;
  const slaRate = deptTickets.length > 0 ? Math.round((slaOk / deptTickets.length) * 100) : 0;

  // Team workload — group by assignee using embedded assigneeName when available
  const workloadMap = new Map<string, { name: string; tickets: number }>();
  for (const t of deptTickets) {
    if (!t.assigneeId) continue;
    const existing = workloadMap.get(t.assigneeId);
    const name = t.assigneeName?.split(' ')[0] ?? t.assigneeId;
    if (existing) {
      existing.tickets += 1;
    } else {
      workloadMap.set(t.assigneeId, { name, tickets: 1 });
    }
  }
  const workloadData = Array.from(workloadMap.values());

  // Recent activity — comments across dept tickets
  const recentActivity = deptTickets
    .flatMap((t) => (t.comments ?? []).map((c) => ({ ticket: t, comment: c })))
    .sort((a, b) => new Date(b.comment.createdAt).getTime() - new Date(a.comment.createdAt).getTime())
    .slice(0, 5);

  if (loading) {
    return (
      <PageWrapper title="Department Dashboard" subtitle="Your department at a glance">
        <p style={{ color: 'var(--color-text-secondary)', padding: '2rem' }}>Loading…</p>
      </PageWrapper>
    );
  }

  return (
    <PageWrapper title="Department Dashboard" subtitle="Your department at a glance">
      <div className={styles.statsGrid}>
        <StatCard title="Open" value={openCount} icon={<Ticket size={20} color="var(--color-info)" />} iconBg="var(--color-info-bg)" />
        <StatCard title="In Progress" value={inProgressCount} icon={<Clock size={20} color="var(--color-warning)" />} iconBg="var(--color-warning-bg)" />
        <StatCard title="Resolved This Week" value={resolvedThisWeek} icon={<CheckCircle size={20} color="var(--color-success)" />} iconBg="var(--color-success-bg)" />
        <StatCard title="SLA Compliance" value={`${slaRate}%`} icon={<Activity size={20} color="var(--color-primary)" />} iconBg="var(--color-primary-subtle)" />
      </div>

      <div className={styles.twoCol}>
        <div className={styles.card}>
          <h3 className={styles.cardTitle}>Team Workload</h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={workloadData} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border-subtle)" />
              <XAxis type="number" tick={{ fontSize: 11, fill: 'var(--color-text-tertiary)' }} allowDecimals={false} />
              <YAxis type="category" dataKey="name" tick={{ fontSize: 11, fill: 'var(--color-text-tertiary)' }} width={70} />
              <Tooltip contentStyle={{ fontSize: 12, background: 'var(--color-bg-elevated)', border: '1px solid var(--color-border-default)', borderRadius: 8 }} />
              <Bar dataKey="tickets" fill="var(--color-primary)" radius={[0, 4, 4, 0]} name="Tickets" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className={styles.card}>
          <h3 className={styles.cardTitle}>On Duty Today</h3>
          <div className={styles.onDutyCard}>
            {todayShifts.length === 0 ? (
              <p className={styles.noOnDuty}>No shifts scheduled today</p>
            ) : (
              todayShifts.map((shift) => {
                const initials = shift.userId.slice(0, 2).toUpperCase();
                return (
                  <div key={shift.id} className={styles.onDutyUser}>
                    <Avatar initials={initials} color="var(--color-primary)" size="sm" />
                    <div>
                      <div className={styles.onDutyName}>{shift.userId}</div>
                      <div className={styles.onDutyTime}>{shift.startTime} – {shift.endTime}</div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      <div className={styles.card}>
        <h3 className={styles.cardTitle}>Recent Activity</h3>
        {recentActivity.map(({ ticket, comment }) => (
          <div key={comment.id} className={styles.activityItem}>
            <div className={styles.activityDot} />
            <div>
              <p className={styles.activityTitle}>
                <Link to={`/tickets/${ticket.id}`} className={styles.ticketLink}>{ticket.title}</Link>
              </p>
              <span className={styles.activityMeta}>
                {comment.isActivityEntry ? comment.activityText : comment.content.slice(0, 60) + (comment.content.length > 60 ? '…' : '')}
                {' · '}
                {formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true })}
              </span>
            </div>
          </div>
        ))}
      </div>
    </PageWrapper>
  );
}
