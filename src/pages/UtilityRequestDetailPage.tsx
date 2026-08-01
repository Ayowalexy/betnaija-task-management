import type { ReactElement } from 'react';
import { useParams } from 'react-router-dom';
import { UtilityRequestDetail } from '../features/utility-requests/components/UtilityRequestDetail';

export function UtilityRequestDetailPage(): ReactElement {
  const { id } = useParams<{ id: string }>();
  return <UtilityRequestDetail requestId={id ?? ''} />;
}
