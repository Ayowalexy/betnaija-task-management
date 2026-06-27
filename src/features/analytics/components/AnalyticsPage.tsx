import { useRef, useState, useEffect, useCallback } from 'react';
import type { ReactElement } from 'react';
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from 'recharts';
import { Ticket, CheckCircle2, BarChart2, Clock, Download } from 'lucide-react';
import { format } from 'date-fns';
import { PageWrapper } from '../../../components/layout/PageWrapper.js';
import { Button } from '../../../components/ui/index.js';
import { Input } from '../../../components/ui/index.js';
import { DataTable } from '../../../components/shared/DataTable.js';
import type { Column } from '../../../components/shared/DataTable.js';
import { analyticsApi } from '../../../api/analytics.js';
import type { AnalyticsData, SLABreach } from '../../../types/index.js';
import { StatCard } from './StatCard.js';
import styles from './AnalyticsPage.module.css';

const breachColumns: Column<SLABreach>[] = [
  { key: 'title', header: 'Ticket', render: (b) => b.title, sortable: true },
  { key: 'department', header: 'Department', render: (b) => b.department },
  { key: 'assignee', header: 'Assignee', render: (b) => b.assignee },
  {
    key: 'breachedAt',
    header: 'Breached At',
    render: (b) => format(new Date(b.breachedAt), 'MMM d, HH:mm'),
  },
  {
    key: 'hoursOverdue',
    header: 'Hours Overdue',
    render: (b) => <span className={styles.overdueVal}>{b.hoursOverdue.toFixed(1)}h</span>,
    sortable: true,
  },
];

const EMPTY_ANALYTICS: AnalyticsData = {
  monthlyVolume: [],
  slaCompliance: [],
  ticketsByStatus: [],
  ticketsByPriority: [],
  avgResolutionTime: [],
  topRequestors: [],
  recentBreaches: [],
};

export function AnalyticsPage(): ReactElement {
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData>(EMPTY_ANALYTICS);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  const loadAnalytics = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const params: { dateFrom?: string; dateTo?: string } = {};
      if (dateFrom) params.dateFrom = dateFrom;
      if (dateTo) params.dateTo = dateTo;
      const data = await analyticsApi.get(params);
      setAnalyticsData(data);
    } catch {
      setError('Failed to load analytics data');
    } finally {
      setLoading(false);
    }
  }, [dateFrom, dateTo]);

  useEffect(() => {
    loadAnalytics();
  }, [loadAnalytics]);

  const totalTickets = analyticsData.monthlyVolume.reduce((s, m) => s + m.count, 0);
  const resolvedCount = analyticsData.ticketsByStatus.find((t) => t.label === 'Resolved')?.value ?? 0;
  const avgCompliance =
    analyticsData.slaCompliance.length > 0
      ? Math.round(
          (analyticsData.slaCompliance.reduce((s, c) => s + c.complianceRate, 0) /
            analyticsData.slaCompliance.length) *
            10
        ) / 10
      : 0;
  const avgResolution =
    analyticsData.avgResolutionTime.length > 0
      ? Math.round(
          (analyticsData.avgResolutionTime.reduce((s, d) => s + d.avgHours, 0) /
            analyticsData.avgResolutionTime.length) *
            10
        ) / 10
      : 0;

  function handleExport(): void {
    const content = contentRef.current;
    if (!content) return;
    const printWindow = window.open('', '_blank', 'width=1200,height=800');
    if (!printWindow) return;
    const cssStyles = Array.from(document.styleSheets)
      .map((sheet) => {
        try {
          return Array.from(sheet.cssRules).map((r) => r.cssText).join('\n');
        } catch {
          return '';
        }
      })
      .join('\n');
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head><title>FlowDesk Analytics Report</title>
          <style>${cssStyles}</style>
        </head>
        <body style="margin:0;padding:24px;background:#f8f9fc">${content.innerHTML}</body>
      </html>
    `);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => { printWindow.print(); printWindow.close(); }, 500);
  }

  return (
    <PageWrapper
      title="Analytics"
      subtitle="Monitor ticket volume, SLA compliance, and team performance"
      actions={
        <div className={styles.topBar}>
          <Input
            type="date"
            label="From"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
            wrapperClassName={styles.dateInput}
          />
          <Input
            type="date"
            label="To"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
            wrapperClassName={styles.dateInput}
          />
          <div className={styles.exportBtnWrap}>
            <Button variant="outline" leftIcon={<Download size={14} />} onClick={handleExport}>
              Export Analytics
            </Button>
          </div>
        </div>
      }
    >
      {error && (
        <div style={{ padding: '16px', color: 'var(--color-error)', marginBottom: 16 }}>
          {error}
        </div>
      )}

      <div ref={contentRef} className={styles.pageContent}>
        {/* Stat cards */}
        <div className={styles.statsRow}>
          <StatCard
            title="Total Tickets"
            value={loading ? '—' : totalTickets}
            icon={<Ticket size={20} />}
            color="#4F6EF7"
            change={12}
            changeLabel="vs last period"
          />
          <StatCard
            title="Resolved This Month"
            value={loading ? '—' : resolvedCount}
            icon={<CheckCircle2 size={20} />}
            color="#10b981"
            change={5}
            changeLabel="vs last month"
          />
          <StatCard
            title="SLA Compliance %"
            value={loading ? '—' : `${avgCompliance}%`}
            icon={<BarChart2 size={20} />}
            color="#f59e0b"
            change={-2.1}
            changeLabel="vs last month"
          />
          <StatCard
            title="Avg Resolution Time"
            value={loading ? '—' : `${avgResolution}h`}
            icon={<Clock size={20} />}
            color="#8b5cf6"
            change={-8}
            changeLabel="improvement"
          />
        </div>

        {/* Row 1: Line chart + SLA bar chart */}
        <div className={styles.chartsGrid}>
          <div className={styles.chartCard}>
            <div className={styles.chartHeader}>
              <span className={styles.chartTitle}>Ticket Volume</span>
              <span className={styles.chartSubtitle}>Last 6 months</span>
            </div>
            <ResponsiveContainer width="100%" height={240}>
              <LineChart data={analyticsData.monthlyVolume} margin={{ top: 8, right: 16, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border-default)" />
                <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Line
                  type="monotone"
                  dataKey="count"
                  stroke="#4F6EF7"
                  strokeWidth={2}
                  dot={{ r: 3 }}
                  name="Tickets"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          <div className={styles.chartCard}>
            <div className={styles.chartHeader}>
              <span className={styles.chartTitle}>SLA Compliance by Department</span>
              <span className={styles.chartSubtitle}>Percentage compliance rate</span>
            </div>
            <ResponsiveContainer width="100%" height={240}>
              <BarChart
                data={analyticsData.slaCompliance}
                layout="vertical"
                margin={{ top: 8, right: 24, left: 60, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border-default)" />
                <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 11 }} />
                <YAxis dataKey="department" type="category" tick={{ fontSize: 11 }} width={56} />
                <Tooltip formatter={(v) => `${String(v)}%`} />
                <Bar dataKey="complianceRate" fill="#10b981" radius={[0, 4, 4, 0]} name="Compliance %" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Row 2: Status donut + Priority donut */}
        <div className={styles.chartsGrid}>
          <div className={styles.chartCard}>
            <div className={styles.chartHeader}>
              <span className={styles.chartTitle}>Tickets by Status</span>
              <span className={styles.chartSubtitle}>Distribution across all statuses</span>
            </div>
            <ResponsiveContainer width="100%" height={240}>
              <PieChart>
                <Pie
                  data={analyticsData.ticketsByStatus}
                  dataKey="value"
                  nameKey="label"
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={90}
                  paddingAngle={2}
                >
                  {analyticsData.ticketsByStatus.map((entry) => (
                    <Cell key={entry.label} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend iconSize={10} />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className={styles.chartCard}>
            <div className={styles.chartHeader}>
              <span className={styles.chartTitle}>Tickets by Priority</span>
              <span className={styles.chartSubtitle}>Distribution across priority levels</span>
            </div>
            <ResponsiveContainer width="100%" height={240}>
              <PieChart>
                <Pie
                  data={analyticsData.ticketsByPriority}
                  dataKey="value"
                  nameKey="label"
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={90}
                  paddingAngle={2}
                >
                  {analyticsData.ticketsByPriority.map((entry) => (
                    <Cell key={entry.label} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend iconSize={10} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Row 3: Resolution time bar (full width) */}
        <div className={styles.chartCardFull}>
          <div className={styles.chartHeader}>
            <span className={styles.chartTitle}>Avg Resolution Time by Department</span>
            <span className={styles.chartSubtitle}>Hours to resolve tickets per department</span>
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart
              data={analyticsData.avgResolutionTime}
              margin={{ top: 8, right: 16, left: -10, bottom: 0 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border-default)" />
              <XAxis dataKey="department" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} unit="h" />
              <Tooltip formatter={(v) => `${String(v)}h`} />
              <Bar dataKey="avgHours" fill="#8b5cf6" radius={[4, 4, 0, 0]} name="Avg Hours" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Tables section */}
        <div className={styles.tablesGrid}>
          <div className={styles.tableCard}>
            <div className={styles.chartHeader}>
              <span className={styles.chartTitle}>Top Requestors</span>
              <span className={styles.chartSubtitle}>Users with most tickets submitted</span>
            </div>
            <table className={styles.simpleTable}>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Tickets</th>
                </tr>
              </thead>
              <tbody>
                {analyticsData.topRequestors.slice(0, 5).map((r) => (
                  <tr key={r.userId}>
                    <td>{r.name}</td>
                    <td className={styles.ticketCount}>{r.ticketCount}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className={styles.tableCard}>
            <div className={styles.chartHeader}>
              <span className={styles.chartTitle}>Recent SLA Breaches</span>
              <span className={styles.chartSubtitle}>Tickets that exceeded SLA thresholds</span>
            </div>
            <DataTable<SLABreach>
              columns={breachColumns}
              data={analyticsData.recentBreaches}
              keyExtractor={(b) => b.ticketId}
              pageSize={5}
            />
          </div>
        </div>
      </div>
    </PageWrapper>
  );
}
