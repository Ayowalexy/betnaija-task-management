import { useState, useMemo, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Search, ExternalLink } from 'lucide-react';
import { format } from 'date-fns';
import type { Payment, PaymentStatus } from '@/types/index';
import { paymentsApi } from '@/api/payments';
import { useToast } from '@/hooks/useToast';
import { PageWrapper } from '@/components/layout/PageWrapper';
import { DataTable } from '@/components/shared/DataTable';
import type { Column } from '@/components/shared/DataTable';
import { EmptyState } from '@/components/shared/EmptyState';
import { PaymentStatusBadge } from './PaymentStatusBadge';
import styles from './PaymentsPage.module.css';

type TabFilter = PaymentStatus | 'all';

const TAB_FILTERS: TabFilter[] = ['all', 'pending', 'completed', 'failed'];

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
  const { toast } = useToast();
  const [searchParams, setSearchParams] = useSearchParams();

  const rawTab = searchParams.get('tab');
  const activeTab: TabFilter = rawTab && TAB_FILTERS.includes(rawTab as TabFilter) ? (rawTab as TabFilter) : 'all';
  const search = searchParams.get('q') ?? '';

  function setActiveTab(tab: TabFilter): void {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      next.set('tab', tab);
      return next;
    });
  }

  function setSearch(value: string): void {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      if (value) next.set('q', value);
      else next.delete('q');
      return next;
    });
  }

  const [state, setState] = useState({ payments: [] as Payment[], loading: true, total: 0 });
  const { payments, loading, total } = state;

  async function loadPayments() {
    try {
      setState((s) => ({ ...s, loading: true }));
      const res = await paymentsApi.list({ page: 1, limit: 25 });
      setState({ payments: res.data, loading: false, total: res.total });
    } catch {
      toast({ type: 'error', message: 'Failed to load payments' });
      setState((s) => ({ ...s, loading: false }));
    }
  }

  useEffect(() => {
    loadPayments();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleComplete(id: string): Promise<void> {
    try {
      await paymentsApi.complete(id);
      await loadPayments();
      toast({ type: 'success', message: 'Payment marked as completed' });
    } catch {
      toast({ type: 'error', message: 'Failed to complete payment' });
    }
  }

  async function handleFail(id: string): Promise<void> {
    try {
      await paymentsApi.fail(id);
      await loadPayments();
      toast({ type: 'success', message: 'Payment marked as failed' });
    } catch {
      toast({ type: 'error', message: 'Failed to update payment' });
    }
  }

  const filtered = useMemo(() => {
    let data = payments;
    if (activeTab !== 'all') data = data.filter((p) => p.status === activeTab);
    if (search.trim()) {
      const q = search.toLowerCase();
      data = data.filter(
        (p) => p.reference.toLowerCase().includes(q) || p.description.toLowerCase().includes(q)
      );
    }
    return data;
  }, [payments, activeTab, search]);

  const tabs: { key: TabFilter; label: string }[] = [
    { key: 'all', label: `All (${total})` },
    { key: 'pending', label: `Pending (${payments.filter((p) => p.status === 'pending').length})` },
    { key: 'completed', label: `Completed (${payments.filter((p) => p.status === 'completed').length})` },
    { key: 'failed', label: `Failed (${payments.filter((p) => p.status === 'failed').length})` },
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
      render: (p) => <span style={{ fontSize: 'var(--font-size-sm)' }}>{p.initiatedByName ?? p.initiatedBy}</span>,
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
            {p.ticketTitle ?? p.ticketId} <ExternalLink size={10} />
          </Link>
        ) : (
          <span style={{ color: 'var(--color-text-disabled)' }}>—</span>
        ),
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (p) =>
        p.status === 'pending' ? (
          <div style={{ display: 'flex', gap: 4 }}>
            <button
              type="button"
              style={{ fontSize: 'var(--font-size-xs)', padding: '2px 8px', cursor: 'pointer', borderRadius: 4, border: '1px solid var(--color-border-default)', background: 'var(--color-bg-subtle)' }}
              onClick={() => handleComplete(p.id)}
            >
              Complete
            </button>
            <button
              type="button"
              style={{ fontSize: 'var(--font-size-xs)', padding: '2px 8px', cursor: 'pointer', borderRadius: 4, border: '1px solid var(--color-error)', color: 'var(--color-error)', background: 'transparent' }}
              onClick={() => handleFail(p.id)}
            >
              Fail
            </button>
          </div>
        ) : null,
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

      {loading ? (
        <div style={{ padding: 32, textAlign: 'center', color: 'var(--color-text-secondary)' }}>
          Loading payments…
        </div>
      ) : (
        <DataTable
          columns={columns}
          data={filtered}
          keyExtractor={(p) => p.id}
          pageSize={8}
          emptyState={<EmptyState title="No payments found" description="No payments match your current filters." />}
        />
      )}
    </PageWrapper>
  );
}
