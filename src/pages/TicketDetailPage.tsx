import { useState, useEffect, useCallback } from 'react';
import type { ReactElement } from 'react';
import { useParams } from 'react-router-dom';
import type { Ticket } from '../types/index';
import { ticketsApi } from '../api/tickets';
import { TicketDetail } from '../features/tickets/components/TicketDetail';
import { EmptyState } from '../components/shared/EmptyState';

export function TicketDetailPage(): ReactElement {
  const { id } = useParams<{ id: string }>();
  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTicket = useCallback(() => {
    if (!id) return;
    setLoading(true);
    setError(null);
    ticketsApi.get(id)
      .then((t) => { setTicket(t); setLoading(false); })
      .catch(() => { setError('Failed to load ticket.'); setLoading(false); });
  }, [id]);

  useEffect(() => {
    fetchTicket();
  }, [fetchTicket]);

  if (loading) {
    return <div style={{ padding: '2rem', color: 'var(--color-text-secondary)' }}>Loading ticket…</div>;
  }

  if (error || !ticket) {
    return <EmptyState title="Ticket not found" description={error ?? "This ticket doesn't exist or has been deleted."} />;
  }

  return <TicketDetail ticket={ticket} onRefresh={fetchTicket} />;
}
