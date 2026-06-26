import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Search, ExternalLink } from 'lucide-react';
import { format } from 'date-fns';
import type { Payment, PaymentStatus } from '../../../types/index';
import { PAYMENTS } from '../../../mocks/payments';
import { getUserById } from '../../../mocks/users';
import { PageWrapper } from '../../../components/layout/PageWrapper';
import { DataTable } from '../../../components/shared/DataTable';
import type { Column } from '../../../components/shared/DataTable';
import { EmptyState } from '../../../components/shared/EmptyState';
import { PaymentStatusBadge } from './PaymentStatusBadge';
import styles from './PaymentsPage.module.css';

type TabFilter = PaymentStatus | 'all';

const METHOD_LABELS: Record<string, string> = {
  bank_transfer: 'Bank Transfer',
  paystack: 'Paystack',
  cash: 'Cash',
};

function formatAmount(amount: number, currency: string): string {
  const symbol = currency === 'NGN' ? '₦' : currency;
  return `${symbol} ${amount.toLocaleString('en-NG', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export function PaymentsPage() {
  const [activeTab, setActiveTab] = useState<TabFilter>('all');
  const [search, setSearch] = useState('');

  const filtered = useMemo(() => {
    let data = PAYMENTS;
    if (activeTab !== 'all') data = data.filter((p) => p.status === activeTab);
    if (search.trim()) {
      const q = search.toLowerCase();
      data = data.filter(
        (p) => p.reference.toLowerCase().includes(q) || p.description.toLowerCase().includes(q)
      );
    }
    return data;
  }, [activeTab, search]);

  const tabs: { key: TabFilter; label: string }[] = [
    { key: 'all', label: `All (${PAYMENTS.length})` },
    { key: 'pending', label: `Pending (${PAYMENTS.filter((p) => p.status === 'pending').length})` },
    { key: 'completed', label: `Completed (${PAYMENTS.filter((p) => p.status === 'completed').length})` },
    { key: 'failed', label: `Failed (${PAYMENTS.filter((p) => p.status === 'failed').length})` },
  ];

  const columns: Column<Payment>[] = [
    {
      key: 'reference',
      header: 'Reference',
      render: (p) => <span className={styles.refText}>{p.reference}</span>,
    },
    {
      key: 'description',
      header: 'Description',
      render: (p) => <span style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-primary)' }}>{p.description}</span>,
    },
    {
      key: 'amount',
      header: 'Amount',
      render: (p) => <span className={styles.amount}>{formatAmount(p.amount, p.currency)}</span>,
    },
    {
      key: 'status',
      header: 'Status',
      render: (p) => <PaymentStatusBadge status={p.status} />,
    },
    {
      key: 'method',
      header: 'Method',
      render: (p) => <span style={{ fontSize: 'var(--font-size-sm)' }}>{METHOD_LABELS[p.method] ?? p.method}</span>,
    },
    {
      key: 'initiatedBy',
      header: 'Initiated By',
      render: (p) => {
        const user = getUserById(p.initiatedBy);
        return <span style={{ fontSize: 'var(--font-size-sm)' }}>{user?.name ?? '—'}</span>;
      },
    },
    {
      key: 'initiatedAt',
      header: 'Initiated At',
      render: (p) => <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-secondary)' }}>{format(new Date(p.initiatedAt), 'MMM d, yyyy HH:mm')}</span>,
      sortable: true,
    },
    {
      key: 'ticket',
      header: 'Linked Ticket',
      render: (p) =>
        p.ticketId ? (
          <Link to={`/tickets/${p.ticketId}`} className={styles.ticketChip}>
            {p.ticketId} <ExternalLink size={10} />
          </Link>
        ) : (
          <span style={{ color: 'var(--color-text-disabled)' }}>—</span>
        ),
    },
  ];

  return (
    <PageWrapper title="Payments" subtitle="Track all initiated payments">
      <div className={styles.tabs}>
        {tabs.map((t) => (
          <button
            key={t.key}
            className={`${styles.tab}${activeTab === t.key ? ` ${styles.active}` : ''}`}
            onClick={() => setActiveTab(t.key)}
            type="button"
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className={styles.toolbar}>
        <div className={styles.searchWrap}>
          <Search size={14} className={styles.searchIcon} />
          <input
            className={styles.searchInput}
            type="search"
            placeholder="Search by reference or description..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      <DataTable
        columns={columns}
        data={filtered}
        keyExtractor={(p) => p.id}
        pageSize={8}
        emptyState={<EmptyState title="No payments found" description="No payments match your current filters." />}
      />
    </PageWrapper>
  );
}
