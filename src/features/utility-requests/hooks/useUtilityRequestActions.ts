import { useUtilityRequestStore } from '../../../store/utilityRequestStore.js';
import { useAuthStore } from '../../../store/authStore.js';
import { useToast } from '../../../hooks/useToast.js';
import type { UtilityRequestLogEntry } from '../../../types/index.js';

interface UseUtilityRequestActionsReturn {
  approveRequest: (requestId: string) => void;
  rejectRequest: (requestId: string, reason: string) => void;
  cancelRequest: (requestId: string) => void;
  completeRequest: (requestId: string) => void;
}

export function useUtilityRequestActions(): UseUtilityRequestActionsReturn {
  const updateRequest = useUtilityRequestStore((s) => s.updateRequest);
  const addLogEntry = useUtilityRequestStore((s) => s.addLogEntry);
  const currentUser = useAuthStore((s) => s.currentUser);
  const { toast } = useToast();

  function pushLog(requestId: string, entry: Omit<UtilityRequestLogEntry, 'id' | 'timestamp' | 'actorId'>): void {
    if (!currentUser) return;
    addLogEntry(requestId, {
      id: `url-${requestId}-${Date.now()}`,
      timestamp: new Date().toISOString(),
      actorId: currentUser.id,
      ...entry,
    });
  }

  function approveRequest(requestId: string): void {
    updateRequest(requestId, { status: 'approved' });
    pushLog(requestId, { action: 'approved', note: null });
    toast({ type: 'success', message: 'Request approved.' });
  }

  function rejectRequest(requestId: string, reason: string): void {
    updateRequest(requestId, { status: 'rejected', rejectionReason: reason });
    pushLog(requestId, { action: 'rejected', note: reason });
    toast({ type: 'success', message: 'Request rejected.' });
  }

  function cancelRequest(requestId: string): void {
    updateRequest(requestId, { status: 'cancelled' });
    pushLog(requestId, { action: 'cancelled', note: null });
    toast({ type: 'success', message: 'Request cancelled.' });
  }

  function completeRequest(requestId: string): void {
    updateRequest(requestId, { status: 'completed' });
    pushLog(requestId, { action: 'completed', note: null });
    toast({ type: 'success', message: 'Request marked as completed.' });
  }

  return { approveRequest, rejectRequest, cancelRequest, completeRequest };
}
