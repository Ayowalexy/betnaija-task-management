import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus } from 'lucide-react';
import { format } from 'date-fns';
import type { UtilityRequest, Department, Utility } from '@/types/index.js';
import { Button } from '@/components/ui/index.js';
import { Badge } from '@/components/ui/index.js';
import { DataTable } from '@/components/shared/DataTable.js';
import type { Column } from '@/components/shared/DataTable.js';
import { EmptyState } from '@/components/shared/EmptyState.js';
import { PageWrapper } from '@/components/layout/PageWrapper.js';
import { departmentsApi } from '@/api/departments.js';
import { utilitiesApi } from '@/api/utilities.js';
import { useUtilityRequestFilters } from '../hooks/useUtilityRequestFilters.js';
import { UtilityRequestFilters } from './UtilityRequestFilters.js';
import { STATUS_LABELS, getUtilityRequestStatusVariant } from '../types.js';
import styles from './UtilityRequestList.module.css';

interface UtilityRequestListProps {
  title: string;
  requests: UtilityRequest[];
  total?: number;
  loading?: boolean;
  showDepartmentFilter?: boolean;
  page?: number;
  pageSize?: number;
  onPageChange?: (page: number) => void;
}

export function UtilityRequestList({
  title,
  requests,
  total,
  loading = false,
  showDepartmentFilter = true,
  page,
  pageSize,
  onPageChange,
}: UtilityRequestListProps) {
  const navigate = useNavigate();
  const { filters, setFilter, resetFilters } = useUtilityRequestFilters();
  const [departments, setDepartments] = useState<Department[]>([]);
  const [utilities, setUtilities] = useState<Utility[]>([]);

  useEffect(() => {
    void utilitiesApi.list().then((res) => setUtilities(res.data));
    if (showDepartmentFilter) {
      void departmentsApi.list({ limit: 100 }).then((res) => setDepartments(res.data));
    }
  }, [showDepartmentFilter]);

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
      render: (r) => (
        <span className={styles.utilityCell}>
          <span className={styles.utilityName}>{r.utilityName ?? r.utilityId}</span>
          {r.utilityOptionName && <span className={styles.optionName}>{r.utilityOptionName}</span>}
        </span>
      ),
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
      render: (r) => <span className={styles.deptCell}>{r.departmentName ?? r.departmentId}</span>,
    },
    {
      key: 'requestor',
      header: 'Requestor',
      width: '160px',
      render: (r) => <span className={styles.requestorCell}>{r.requestorName ?? r.requestorId}</span>,
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

  const depts = showDepartmentFilter ? departments : [];

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
        {total !== undefined && (
          <p className={styles.totalCount}>{total} request{total !== 1 ? 's' : ''} found</p>
        )}
        <DataTable
          columns={columns}
          data={requests}
          keyExtractor={(r) => r.id}
          onRowClick={(r) => navigate(`/utility-requests/${r.id}`)}
          loading={loading}
          pageSize={pageSize ?? 15}
          serverPagination={
            page !== undefined && pageSize !== undefined && onPageChange && total !== undefined
              ? { page, pageSize, totalItems: total, onPageChange }
              : undefined
          }
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
