import { useCallback } from 'react';
import { useUIStore } from '../store/uiStore.js';
import type { Toast } from '../types/index.js';

type ToastInput = Omit<Toast, 'id'>;

interface UseToastReturn {
  toast: (input: ToastInput) => void;
}

export function useToast(): UseToastReturn {
  const addToast = useUIStore((s) => s.addToast);
  const removeToast = useUIStore((s) => s.removeToast);

  const toast = useCallback(
    (input: ToastInput): void => {
      const duration = input.duration ?? 4000;
      addToast(input);

      // Retrieve the last inserted toast id after state update
      // We use a timeout approach: get id from the store after add
      // Since addToast uses crypto.randomUUID and then sets state,
      // we schedule removal based on the id returned by the store.
      // We track via a small closure: read the toast list after the
      // microtask queue clears to find the matching toast by message + type.
      setTimeout(() => {
        const toasts = useUIStore.getState().toasts;
        const match = [...toasts]
          .reverse()
          .find((t) => t.message === input.message && t.type === input.type);
        if (match) {
          removeToast(match.id);
        }
      }, duration);
    },
    [addToast, removeToast]
  );

  return { toast };
}
