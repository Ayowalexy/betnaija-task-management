import { useState, useEffect, useCallback } from 'react';
import type { ReactElement } from 'react';
import { useParams } from 'react-router-dom';
import type { UtilityRequest } from '../types/index';
import { utilityRequestsApi } from '../api/utility-requests';
import { UtilityRequestDetail } from '../features/utility-requests/components/UtilityRequestDetail';
import { EmptyState } from '../components/shared/EmptyState';

export function UtilityRequestDetailPage(): ReactElement {
  const { id } = useParams<{ id: string }>();
  const [request, setRequest] = useState<UtilityRequest | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchRequest = useCallback(() => {
    if (!id) return;
    setLoading(true);
    setError(null);
    utilityRequestsApi.get(id)
      .then((r) => { setRequest(r); setLoading(false); })
      .catch(() => { setError('Failed to load utility request.'); setLoading(false); });
  }, [id]);

  useEffect(() => {
    fetchRequest();
  }, [fetchRequest]);

  if (loading) {
    return <div style={{ padding: '2rem', color: 'var(--color-text-secondary)' }}>Loading request…</div>;
  }

  if (error || !request) {
    return <EmptyState title="Request not found" description={error ?? "This utility request doesn't exist or has been deleted."} />;
  }

  return <UtilityRequestDetail request={request} onRefresh={fetchRequest} />;
}
