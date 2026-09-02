import { utilityRequestsApi } from '@/api/utility-requests.js';
import { useToast } from '@/hooks/useToast.js';

interface UseUtilityRequestActionsReturn {
  approveRequest: (requestId: string) => Promise<void>;
  rejectRequest: (requestId: string, reason: string) => Promise<void>;
  cancelRequest: (requestId: string) => Promise<void>;
  completeRequest: (requestId: string) => Promise<void>;
}

export function useUtilityRequestActions(onRefresh: () => void): UseUtilityRequestActionsReturn {
  const { toast } = useToast();

  async function approveRequest(requestId: string): Promise<void> {
    try {
      await utilityRequestsApi.approve(requestId);
      toast({ type: 'success', message: 'Request approved.' });
      onRefresh();
    } catch (err) {
      toast({ type: 'error', message: err instanceof Error ? err.message : 'Failed to approve request.' });
    }
  }

  async function rejectRequest(requestId: string, reason: string): Promise<void> {
    try {
      await utilityRequestsApi.reject(requestId, reason);
      toast({ type: 'success', message: 'Request rejected.' });
      onRefresh();
    } catch (err) {
      toast({ type: 'error', message: err instanceof Error ? err.message : 'Failed to reject request.' });
    }
  }

  async function cancelRequest(requestId: string): Promise<void> {
    try {
      await utilityRequestsApi.cancel(requestId);
      toast({ type: 'success', message: 'Request cancelled.' });
      onRefresh();
    } catch (err) {
      toast({ type: 'error', message: err instanceof Error ? err.message : 'Failed to cancel request.' });
    }
  }

  async function completeRequest(requestId: string): Promise<void> {
    try {
      await utilityRequestsApi.complete(requestId);
      toast({ type: 'success', message: 'Request marked as completed.' });
      onRefresh();
    } catch (err) {
      toast({ type: 'error', message: err instanceof Error ? err.message : 'Failed to mark request completed.' });
    }
  }

  return { approveRequest, rejectRequest, cancelRequest, completeRequest };
}
