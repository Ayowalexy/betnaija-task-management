import { Link } from 'react-router-dom';
import { Ticket, CheckCircle, Clock, Activity } from 'lucide-react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';
import { formatDistanceToNow } from 'date-fns';
import { useAuthStore } from '../../../store/authStore';
import { TICKETS } from '../../../mocks/tickets';
import { ROSTER } from '../../../mocks/roster';
import { getUserById } from '../../../mocks/users';
import { DEPARTMENTS } from '../../../mocks/departments';
import { PageWrapper } from '../../../components/layout/PageWrapper';
import { Avatar } from '../../../components/ui/index';
import { StatCard } from './StatCard';
import styles from './DeptHeadDashboard.module.css';

const TODAY = '2026-06-26';

export function DeptHeadDashboard() {
  const currentUser = useAuthStore((s) => s.currentUser);
  const deptId = currentUser?.departmentId ?? 'tech';
  const dept = DEPARTMENTS.find((d) => d.id === deptId);

  const deptTickets = TICKETS.filter((t) => t.departmentId === deptId);
  const openCount = deptTickets.filter((t) => t.status === 'open').length;
  const inProgressCount = deptTickets.filter((t) => t.status === 'in_progress').length;
  const resolvedThisWeek = deptTickets.filter((t) => t.resolvedAt && t.resolvedAt >= '2026-06-22').length;
  const slaOk = deptTickets.filter((t) => t.status !== 'defaulted' && t.status !== 'escalated').length;
  const slaRate = deptTickets.length > 0 ? Math.round((slaOk / deptTickets.length) * 100) : 0;

  // Team workload
  const deptMembers = dept ? [...dept.memberIds, dept.headId] : [];
  const workloadData = deptMembers.map((uid) => {
    const user = getUserById(uid);
    const count = deptTickets.filter((t) => t.assigneeId === uid).length;
    return { name: user?.name.split(' ')[0] ?? uid, tickets: count };
  });

  // On duty today
  const todayShifts = ROSTER.filter((s) => s.departmentId === deptId && s.date === TODAY);
  const onDutyUsers = todayShifts.map((s) => ({ shift: s, user: getUserById(s.userId) })).filter((x) => x.user);

  // Recent activity
  const recentActivity = deptTickets
    .flatMap((t) => t.comments.map((c) => ({ ticket: t, comment: c })))
    .sort((a, b) => new Date(b.comment.createdAt).getTime() - new Date(a.comment.createdAt).getTime())
    .slice(0, 5);

  return (
    <PageWrapper title={`${dept?.name ?? 'Department'} Dashboard`} subtitle="Your department at a glance">
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
            {onDutyUsers.length === 0 ? (
              <p className={styles.noOnDuty}>No shifts scheduled today</p>
            ) : (
              onDutyUsers.map(({ shift, user }) => user ? (
                <div key={shift.id} className={styles.onDutyUser}>
                  <Avatar initials={user.avatarInitials} color={user.avatarColor} size="sm" online={user.isOnline} />
                  <div>
                    <div className={styles.onDutyName}>{user.name}</div>
                    <div className={styles.onDutyTime}>{shift.startTime} – {shift.endTime}</div>
                  </div>
                </div>
              ) : null)
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
