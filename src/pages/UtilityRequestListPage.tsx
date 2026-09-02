import { useState, useEffect } from 'react';
import type { ReactElement } from 'react';
import type { UtilityRequest } from '../types/index';
import { useAuthStore } from '../store/authStore';
import { useUtilityRequestStore } from '../store/utilityRequestStore';
import { utilityRequestsApi } from '../api/utility-requests';
import { UtilityRequestList } from '../features/utility-requests/components/UtilityRequestList';

export function UtilityRequestListPage(): ReactElement {
  const currentUser = useAuthStore((s) => s.currentUser);
  const filters = useUtilityRequestStore((s) => s.filters);

  const [requests, setRequests] = useState<UtilityRequest[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 15;

  const isAdmin = currentUser?.role === 'root_admin';
  const isDeptHead = currentUser?.role === 'dept_head';

  const title = isAdmin
    ? 'All Utility Requests'
    : isDeptHead
    ? 'Department Utility Requests'
    : 'My Utility Requests';

  // Filters changing invalidates whatever page we were on — go back to page 1 rather than
  // requesting e.g. page 4 of a now much-smaller filtered result set.
  useEffect(() => {
    setPage(1);
  }, [filters]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);

    // Scoping (root_admin: all; dept_head: own dept + own requests; team_member: own requests)
    // is enforced server-side — the API only needs the UI's own filter selections.
    utilityRequestsApi.list({
      departmentIds: filters.departmentIds,
      utilityIds: filters.utilityIds,
      statuses: filters.statuses,
      dateFrom: filters.dateFrom,
      dateTo: filters.dateTo,
      search: filters.search,
      page,
      limit: PAGE_SIZE,
    })
      .then((res) => {
        if (!cancelled) {
          setRequests(res.data);
          setTotal(res.total);
          setLoading(false);
        }
      })
      .catch(() => {
        if (!cancelled) setLoading(false);
      });

    return () => { cancelled = true; };
  }, [filters, page]);

  return (
    <UtilityRequestList
      title={title}
      requests={requests}
      total={total}
      loading={loading}
      showDepartmentFilter={isAdmin}
      page={page}
      pageSize={PAGE_SIZE}
      onPageChange={setPage}
    />
  );
}
