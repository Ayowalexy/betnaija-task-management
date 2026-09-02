import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus } from 'lucide-react';
import { format } from 'date-fns';
import type { Ticket, Department } from '@/types/index';
import { Button } from '@/components/ui/index';
import { Avatar } from '@/components/ui/index';
import { Tooltip } from '@/components/ui/index';
import { DataTable } from '@/components/shared/DataTable';
import type { Column } from '@/components/shared/DataTable';
import { SLACountdown } from '@/components/shared/SLACountdown';
import { EmptyState } from '@/components/shared/EmptyState';
import { PageWrapper } from '@/components/layout/PageWrapper';
import { departmentsApi } from '@/api/departments';
import { useTicketFilters } from '../hooks/useTicketFilters';
import { TicketFilters } from './TicketFilters';
import { TicketStatusBadge } from './TicketStatusBadge';
import { TicketPriorityBadge } from './TicketPriorityBadge';
import styles from './TicketList.module.css';

interface TicketListProps {
  title: string;
  tickets: Ticket[];
  total?: number;
  loading?: boolean;
  error?: string | null;
  showDepartmentFilter?: boolean;
  showDepartmentColumn?: boolean;
  showAssigneeFilter?: boolean;
  page?: number;
  pageSize?: number;
  onPageChange?: (page: number) => void;
}

export function TicketList({
  title,
  tickets,
  total,
  loading = false,
  error = null,
  page,
  pageSize,
  onPageChange,
  showDepartmentFilter = true,
  showDepartmentColumn = true,
  showAssigneeFilter = true,
}: TicketListProps) {
  const navigate = useNavigate();
  const { filters, setFilter, resetFilters, filteredTickets } = useTicketFilters(tickets);
  const [departments, setDepartments] = useState<Department[]>([]);

  useEffect(() => {
    if (!showDepartmentFilter) return;
    departmentsApi.list({ limit: 100 }).then((res) => setDepartments(res.data)).catch(() => {});
  }, [showDepartmentFilter]);

  const columns: Column<Ticket>[] = [
    {
      key: 'id',
      header: 'ID',
      width: '80px',
      render: (t) => (
        <span className={styles.idChip}>#{t.id.slice(0, 8).toUpperCase()}</span>
      ),
    },
    {
      key: 'title',
      header: 'Title',
      sortable: true,
      render: (t) => {
        const truncated = t.title.length > 60 ? `${t.title.slice(0, 60)}…` : t.title;
        return t.title.length > 60 ? (
          <Tooltip content={t.title}>
            <span className={styles.titleCell}>{truncated}</span>
          </Tooltip>
        ) : (
          <span className={styles.titleCell}>{t.title}</span>
        );
      },
    },
    {
      key: 'status',
      header: 'Status',
      width: '130px',
      render: (t) => <TicketStatusBadge status={t.status} ticketId={t.id} readOnly />,
    },
    {
      key: 'priority',
      header: 'Priority',
      width: '100px',
      sortable: true,
      render: (t) => <TicketPriorityBadge priority={t.priority} />,
    },
    ...(showDepartmentColumn ? [{
      key: 'department' as const,
      header: 'Department',
      width: '130px',
      render: (t: Ticket) => (
        <span className={styles.deptCell}>{t.departmentName ?? t.departmentId.slice(0, 8)}</span>
      ),
    }] : []),
    {
      key: 'assignee',
      header: 'Assignee',
      width: '160px',
      render: (t) =>
        t.assigneeName ? (
          <div className={styles.assigneeCell}>
            <Avatar
              initials={t.assigneeInitials ?? t.assigneeName.slice(0, 2).toUpperCase()}
              color={t.assigneeColor ?? '#4F6EF7'}
              size="xs"
              name={t.assigneeName}
            />
            <span>{t.assigneeName}</span>
          </div>
        ) : (
          <span className={styles.unassigned}>Unassigned</span>
        ),
    },
    {
      key: 'sla',
      header: 'SLA',
      width: '110px',
      render: (t) =>
        t.slaResolutionDeadline ? (
          <SLACountdown deadline={t.slaResolutionDeadline} createdAt={t.createdAt} variant="pill" />
        ) : null,
    },
    {
      key: 'createdAt',
      header: 'Created',
      width: '100px',
      sortable: true,
      render: (t) => (
        <span className={styles.dateCell}>{format(new Date(t.createdAt), 'MMM d, yyyy')}</span>
      ),
    },
  ];

  return (
    <PageWrapper
      title={title}
      actions={
        <Button leftIcon={<Plus size={16} />} onClick={() => navigate('/tickets/new')}>
          New Ticket
        </Button>
      }
    >
      <div className={styles.container}>
        <TicketFilters
          filters={filters}
          onFilterChange={setFilter}
          onReset={resetFilters}
          departments={departments}
          users={[]}
          showDepartmentFilter={showDepartmentFilter}
          showAssigneeFilter={showAssigneeFilter}
        />
        {error && (
          <EmptyState title="Error loading tickets" description={error} />
        )}
        {!error && (
          <>
            {total !== undefined && (
              <p className={styles.totalCount}>{total} ticket{total !== 1 ? 's' : ''} found</p>
            )}
            <DataTable
              columns={columns}
              data={filteredTickets}
              keyExtractor={(t) => t.id}
              onRowClick={(t) => navigate(`/tickets/${t.id}`)}
              loading={loading}
              pageSize={pageSize ?? 25}
              serverPagination={
                page !== undefined && pageSize !== undefined && onPageChange && total !== undefined
                  ? { page, pageSize, totalItems: total, onPageChange }
                  : undefined
              }
              stickyHeader
              emptyState={
                <EmptyState
                  title="No tickets found"
                  description="Try adjusting your filters or create a new ticket."
                />
              }
            />
          </>
        )}
      </div>
    </PageWrapper>
  );
}
