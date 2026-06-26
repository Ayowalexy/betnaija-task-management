import type { ReactElement } from 'react';
import type { UserStatus } from '../../../types/index.js';
import { Badge } from '../../../components/ui/index.js';

interface UserStatusBadgeProps {
  status: UserStatus;
}

export function UserStatusBadge({ status }: UserStatusBadgeProps): ReactElement {
  return (
    <Badge variant={status === 'active' ? 'success' : 'error'} size="sm" dot>
      {status === 'active' ? 'Active' : 'Suspended'}
    </Badge>
  );
}
