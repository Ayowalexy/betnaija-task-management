import { useNavigate } from 'react-router-dom';
import { Plus } from 'lucide-react';
import { format } from 'date-fns';
import type { UtilityRequest } from '../../../types/index.js';
import { Button } from '../../../components/ui/index.js';
import { Badge } from '../../../components/ui/index.js';
import { DataTable } from '../../../components/shared/DataTable.js';
import type { Column } from '../../../components/shared/DataTable.js';
import { EmptyState } from '../../../components/shared/EmptyState.js';
import { PageWrapper } from '../../../components/layout/PageWrapper.js';
import { DEPARTMENTS, getDeptById } from '../../../mocks/departments.js';
import { getUtilityById } from '../../../mocks/utilities.js';
import { useUtilityStore } from '../../../store/utilityStore.js';
import { getUserById } from '../../../mocks/users.js';
import { useUtilityRequestFilters } from '../hooks/useUtilityRequestFilters.js';
import { UtilityRequestFilters } from './UtilityRequestFilters.js';
import { STATUS_LABELS, getUtilityRequestStatusVariant } from '../types.js';
import styles from './UtilityRequestList.module.css';

interface UtilityRequestListProps {
  title: string;
  requests: UtilityRequest[];
  loading?: boolean;
  showDepartmentFilter?: boolean;
}

export function UtilityRequestList({
  title,
  requests,
  loading = false,
  showDepartmentFilter = true,
}: UtilityRequestListProps) {
  const navigate = useNavigate();
  const { filters, setFilter, resetFilters, filteredRequests } = useUtilityRequestFilters(requests);
  const utilities = useUtilityStore((s) => s.utilities);

  const columns: Column<UtilityRequest>[] = [
    {
      key: 'id',
      header: 'ID',
      width: '80px',
      render: (r) => <span className={styles.idChip}>#{r.id.toUpperCase()}</span>,
    },
    {
      key: 'utility',
      header: 'Utility',
      render: (r) => {
        const utility = getUtilityById(r.utilityId);
        const option = utility?.options.find((o) => o.id === r.utilityOptionId);
        return (
          <span className={styles.utilityCell}>
            <span className={styles.utilityName}>{utility?.name ?? r.utilityId}</span>
            {option && <span className={styles.optionName}>{option.name}</span>}
          </span>
        );
      },
    },
    {
      key: 'status',
      header: 'Status',
      width: '120px',
      render: (r) => (
        <Badge variant={getUtilityRequestStatusVariant(r.status)} size="sm" dot>
          {STATUS_LABELS[r.status]}
        </Badge>
      ),
    },
    {
      key: 'department',
      header: 'Department',
      width: '130px',
      render: (r) => {
        const dept = getDeptById(r.departmentId);
        return <span className={styles.deptCell}>{dept?.name ?? r.departmentId}</span>;
      },
    },
    {
      key: 'requestor',
      header: 'Requestor',
      width: '160px',
      render: (r) => {
        const user = getUserById(r.requestorId);
        return <span className={styles.requestorCell}>{user?.name ?? r.requestorId}</span>;
      },
    },
    {
      key: 'date',
      header: 'Date',
      width: '160px',
      sortable: true,
      render: (r) => (
        <span className={styles.dateCell}>
          {format(new Date(r.date), 'MMM d, yyyy')} · {r.startTime}–{r.endTime}
        </span>
      ),
    },
    {
      key: 'createdAt',
      header: 'Requested',
      width: '100px',
      sortable: true,
      render: (r) => (
        <span className={styles.dateCell}>{format(new Date(r.createdAt), 'MMM d, yyyy')}</span>
      ),
    },
  ];

  const depts = showDepartmentFilter ? DEPARTMENTS : [];

  return (
    <PageWrapper
      title={title}
      actions={
        <Button leftIcon={<Plus size={16} />} onClick={() => navigate('/utility-requests/new')}>
          New Request
        </Button>
      }
    >
      <div className={styles.container}>
        <UtilityRequestFilters
          filters={filters}
          onFilterChange={setFilter}
          onReset={resetFilters}
          departments={depts}
          utilities={utilities}
        />
        <DataTable
          columns={columns}
          data={filteredRequests}
          keyExtractor={(r) => r.id}
          onRowClick={(r) => navigate(`/utility-requests/${r.id}`)}
          loading={loading}
          pageSize={15}
          stickyHeader
          emptyState={
            <EmptyState
              title="No utility requests found"
              description="Try adjusting your filters or create a new request."
            />
          }
        />
      </div>
    </PageWrapper>
  );
}
