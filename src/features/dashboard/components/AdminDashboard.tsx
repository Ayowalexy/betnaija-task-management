import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Ticket, AlertCircle, Clock, Activity, Download } from 'lucide-react';
import {
  ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  BarChart, Bar, PieChart, Pie, Cell, Legend,
} from 'recharts';
import { ticketsApi } from '@/api/tickets';
import { analyticsApi } from '@/api/analytics';
import { PageWrapper } from '@/components/layout/PageWrapper';
import { Button, Modal } from '@/components/ui/index';
import { StatCard } from './StatCard';
import type { Ticket as TicketType, AnalyticsData } from '@/types/index';
import styles from './AdminDashboard.module.css';

interface ReportModalState {
  open: boolean;
  dateFrom: string;
  dateTo: string;
}
const INITIAL_REPORT_MODAL: ReportModalState = { open: false, dateFrom: '', dateTo: '' };

// Every status except the two terminal ones — matches "still needs attention" intent.
const NON_TERMINAL_STATUSES: TicketType['status'][] = [
  'open', 'in_progress', 'pending', 'transferred', 'escalated', 'defaulted', 'rejected',
];

export function AdminDashboard() {
  const [reportModal, setReportModal] = useState<ReportModalState>(INITIAL_REPORT_MODAL);

  const [dueThisWeek, setDueThisWeek] = useState<TicketType[]>([]);
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const thisWeekStart = new Date();
    thisWeekStart.setDate(thisWeekStart.getDate() - thisWeekStart.getDay());
    thisWeekStart.setHours(0, 0, 0, 0);

    Promise.all([
      // Dedicated, correctly-filtered fetch — the dashboard used to pull only the first 10
      // tickets system-wide and slice that tiny, arbitrary sample for every stat card and
      // both tables, which meant "Total Tickets" etc. never reflected the real counts.
      ticketsApi.list({ dateFrom: thisWeekStart.toISOString(), statuses: NON_TERMINAL_STATUSES, limit: 5 }),
      analyticsApi.get(),
    ]).then(([dueThisWeekRes, analyticsRes]) => {
      setDueThisWeek(dueThisWeekRes.data);
      setAnalytics(analyticsRes);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  const total = analytics?.summary?.totalTickets ?? 0;
  const open = analytics?.ticketsByStatus.find((s) => s.label === 'open')?.value ?? 0;
  const inProgress = analytics?.ticketsByStatus.find((s) => s.label === 'in_progress')?.value ?? 0;
  const breached = analytics?.summary?.currentlyBreached ?? 0;
  const overdue = analytics?.recentBreaches.slice(0, 5) ?? [];

  // Real month-over-month change from the same trend chart shown below, instead of a
  // hardcoded placeholder — omitted (rather than faked) when there isn't enough history yet.
  const volume = analytics?.monthlyVolume ?? [];
  const totalTrend = volume.length >= 2
    ? (() => {
        const prev = volume[volume.length - 2].count;
        const curr = volume[volume.length - 1].count;
        if (prev === 0) return null;
        return { value: Math.round(((curr - prev) / prev) * 1000) / 10, label: 'vs last month' };
      })()
    : null;

  if (loading) {
    return (
      <PageWrapper title="Admin Dashboard" subtitle="System-wide overview">
        <p style={{ color: 'var(--color-text-secondary)', padding: '2rem' }}>Loading…</p>
      </PageWrapper>
    );
  }

  return (
    <PageWrapper
      title="Admin Dashboard"
      subtitle="System-wide overview"
      actions={
        <Button variant="outline" size="sm" leftIcon={<Download size={14} />} onClick={() => setReportModal((m) => ({ ...m, open: true }))}>
          Generate PDF Report
        </Button>
      }
    >
      <div className={styles.statsGrid}>
        <StatCard title="Total Tickets" value={total} icon={<Ticket size={20} color="var(--color-primary)" />} iconBg="var(--color-primary-subtle)" trend={totalTrend ?? undefined} />
        <StatCard title="Open Tickets" value={open} icon={<Activity size={20} color="var(--color-info)" />} iconBg="var(--color-info-bg)" />
        <StatCard title="In Progress" value={inProgress} icon={<Clock size={20} color="var(--color-warning)" />} iconBg="var(--color-warning-bg)" />
        <StatCard title="SLA Breached" value={breached} icon={<AlertCircle size={20} color="var(--color-error)" />} iconBg="var(--color-error-bg)" />
      </div>

      <div className={styles.chartsRow}>
        <div className={styles.card}>
          <h3 className={styles.cardTitle}>Monthly Ticket Volume</h3>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={analytics?.monthlyVolume ?? []}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border-subtle)" />
              <XAxis dataKey="month" tick={{ fontSize: 11, fill: 'var(--color-text-tertiary)' }} />
              <YAxis tick={{ fontSize: 11, fill: 'var(--color-text-tertiary)' }} />
              <Tooltip contentStyle={{ background: 'var(--color-bg-elevated)', border: '1px solid var(--color-border-default)', borderRadius: 8, fontSize: 12 }} />
              <Line type="monotone" dataKey="count" stroke="var(--color-primary)" strokeWidth={2} dot={{ r: 3, fill: 'var(--color-primary)' }} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className={styles.card}>
          <h3 className={styles.cardTitle}>SLA Compliance by Dept</h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={analytics?.slaCompliance ?? []} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border-subtle)" />
              <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 10, fill: 'var(--color-text-tertiary)' }} />
              <YAxis type="category" dataKey="department" tick={{ fontSize: 10, fill: 'var(--color-text-tertiary)' }} width={80} />
              <Tooltip contentStyle={{ fontSize: 12, background: 'var(--color-bg-elevated)', border: '1px solid var(--color-border-default)', borderRadius: 8 }} />
              <Bar dataKey="complianceRate" fill="var(--color-primary)" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className={styles.card}>
          <h3 className={styles.cardTitle}>Tickets by Status</h3>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie data={analytics?.ticketsByStatus ?? []} dataKey="value" nameKey="label" cx="50%" cy="50%" innerRadius={45} outerRadius={70}>
                {(analytics?.ticketsByStatus ?? []).map((entry) => (
                  <Cell key={entry.label} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip contentStyle={{ fontSize: 12, background: 'var(--color-bg-elevated)', border: '1px solid var(--color-border-default)', borderRadius: 8 }} />
              <Legend iconSize={8} wrapperStyle={{ fontSize: 10 }} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className={styles.tablesRow}>
        <div className={styles.card}>
          <h3 className={styles.cardTitle}>Overdue Tickets</h3>
          <table className={styles.table}>
            <thead><tr><th>Ticket</th><th>Dept</th><th>Overdue</th></tr></thead>
            <tbody>
              {overdue.map((b) => (
                <tr key={b.ticketId}>
                  <td><Link to={`/tickets/${b.ticketId}`} className={styles.ticketLink}>{b.title.slice(0, 28)}…</Link></td>
                  <td>{b.department}</td>
                  <td><span className={styles.overdueBadge}>{b.hoursOverdue}h</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className={styles.card}>
          <h3 className={styles.cardTitle}>Tickets Due This Week</h3>
          <table className={styles.table}>
            <thead><tr><th>Ticket</th><th>Priority</th><th>Status</th></tr></thead>
            <tbody>
              {dueThisWeek.slice(0, 5).map((t) => (
                <tr key={t.id}>
                  <td><Link to={`/tickets/${t.id}`} className={styles.ticketLink}>{t.title.slice(0, 28)}…</Link></td>
                  <td>{t.priority}</td>
                  <td>{t.status.replace('_', ' ')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <Modal
        isOpen={reportModal.open}
        onClose={() => setReportModal((m) => ({ ...m, open: false }))}
        title="Generate PDF Report"
        footer={
          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
            <Button variant="ghost" onClick={() => setReportModal((m) => ({ ...m, open: false }))}>Cancel</Button>
            <Button variant="primary" onClick={() => { window.print(); setReportModal((m) => ({ ...m, open: false })); }}>Download</Button>
          </div>
        }
      >
        <div className={styles.modalBody}>
          <p style={{ margin: 0, fontSize: 'var(--font-size-sm)', color: 'var(--color-text-secondary)' }}>Select a date range for the report.</p>
          <div className={styles.dateRow}>
            <div>
              <label className={styles.dateLabel}>From</label>
              <input className={styles.dateInput} type="date" value={reportModal.dateFrom} onChange={(e) => setReportModal((m) => ({ ...m, dateFrom: e.target.value }))} />
            </div>
            <div>
              <label className={styles.dateLabel}>To</label>
              <input className={styles.dateInput} type="date" value={reportModal.dateTo} onChange={(e) => setReportModal((m) => ({ ...m, dateTo: e.target.value }))} />
            </div>
          </div>
        </div>
      </Modal>
    </PageWrapper>
  );
}
