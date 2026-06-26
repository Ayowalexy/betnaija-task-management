import type { ReactElement } from 'react';
import { useParams } from 'react-router-dom';
import { TicketDetail } from '../features/tickets/components/TicketDetail';

export function TicketDetailPage(): ReactElement {
  const { id } = useParams<{ id: string }>();
  return <TicketDetail ticketId={id ?? ''} />;
}
