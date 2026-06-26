import { useNavigate } from 'react-router-dom';
import { Plus } from 'lucide-react';
import { format } from 'date-fns';
import type { Ticket } from '../../../types/index';
import { Button } from '../../../components/ui/index';
import { Avatar } from '../../../components/ui/index';
import { Tooltip } from '../../../components/ui/index';
import { DataTable } from '../../../components/shared/DataTable';
import type { Column } from '../../../components/shared/DataTable';
import { SLACountdown } from '../../../components/shared/SLACountdown';
import { EmptyState } from '../../../components/shared/EmptyState';
import { PageWrapper } from '../../../components/layout/PageWrapper';
import { DEPARTMENTS, getDeptById } from '../../../mocks/departments';
import { USERS, getUserById } from '../../../mocks/users';
import { useTicketFilters } from '../hooks/useTicketFilters';
import { TicketFilters } from './TicketFilters';
import { TicketStatusBadge } from './TicketStatusBadge';
import { TicketPriorityBadge } from './TicketPriorityBadge';
import styles from './TicketList.module.css';

interface TicketListProps {
  title: string;
  tickets: Ticket[];
  loading?: boolean;
  showDepartmentFilter?: boolean;
  showAssigneeFilter?: boolean;
}

export function TicketList({
  title,
  tickets,
  loading = false,
  showDepartmentFilter = true,
  showAssigneeFilter = true,
}: TicketListProps) {
  const navigate = useNavigate();
  const { filters, setFilter, resetFilters, filteredTickets } = useTicketFilters(tickets);

  const columns: Column<Ticket>[] = [
    {
      key: 'id',
      header: 'ID',
      width: '80px',
      render: (t) => (
        <span className={styles.idChip}>#{t.id.toUpperCase()}</span>
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
    {
      key: 'department',
      header: 'Department',
      width: '130px',
      render: (t) => {
        const dept = getDeptById(t.departmentId);
        return <span className={styles.deptCell}>{dept?.name ?? t.departmentId}</span>;
      },
    },
    {
      key: 'assignee',
      header: 'Assignee',
      width: '160px',
      render: (t) => {
        const user = t.assigneeId ? getUserById(t.assigneeId) : null;
        return user ? (
          <div className={styles.assigneeCell}>
            <Avatar initials={user.avatarInitials} color={user.avatarColor} size="xs" name={user.name} />
            <span>{user.name}</span>
          </div>
        ) : (
          <span className={styles.unassigned}>Unassigned</span>
        );
      },
    },
    {
      key: 'sla',
      header: 'SLA',
      width: '110px',
      render: (t) => {
        const dept = getDeptById(t.departmentId);
        return dept ? (
          <SLACountdown createdAt={t.createdAt} slaDurationMs={dept.sla.resolutionTimeMs} variant="pill" />
        ) : null;
      },
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

  const depts = showDepartmentFilter ? DEPARTMENTS : [];
  const users = showAssigneeFilter ? USERS : [];

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
          departments={depts}
          users={users}
        />
        <DataTable
          columns={columns}
          data={filteredTickets}
          keyExtractor={(t) => t.id}
          onRowClick={(t) => navigate(`/tickets/${t.id}`)}
          loading={loading}
          pageSize={15}
          stickyHeader
          emptyState={
            <EmptyState
              title="No tickets found"
              description="Try adjusting your filters or create a new ticket."
            />
          }
        />
      </div>
    </PageWrapper>
  );
}
