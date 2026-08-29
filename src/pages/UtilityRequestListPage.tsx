import type { ReactElement } from 'react';
import { useAuthStore } from '../store/authStore';
import { useUtilityRequestStore } from '../store/utilityRequestStore';
import { UtilityRequestList } from '../features/utility-requests/components/UtilityRequestList';

export function UtilityRequestListPage(): ReactElement {
  const currentUser = useAuthStore((s) => s.currentUser);
  const requests = useUtilityRequestStore((s) => s.requests);

  const isAdmin = currentUser?.role === 'root_admin';
  const isDeptHead = currentUser?.role === 'dept_head';

  // Scope requests to role
  const scopedRequests = isAdmin
    ? requests
    : isDeptHead
    ? requests.filter(
        (r) => r.departmentId === currentUser?.departmentId || r.requestorId === currentUser?.id,
      )
    : requests.filter((r) => r.requestorId === currentUser?.id);

  const title = isAdmin
    ? 'All Utility Requests'
    : isDeptHead
    ? 'Department Utility Requests'
    : 'My Utility Requests';

  return (
    <UtilityRequestList
      title={title}
      requests={scopedRequests}
      showDepartmentFilter={isAdmin}
    />
  );
}
