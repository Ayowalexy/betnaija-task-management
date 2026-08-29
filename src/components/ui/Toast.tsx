import React from 'react';
import { CheckCircle, XCircle, AlertTriangle, Info, X } from 'lucide-react';
import type { Toast } from '@/types/index.js';
import { useUIStore } from '@/store/uiStore.js';
import styles from './Toast.module.css';

// ── ToastItem ──────────────────────────────────────────────

interface ToastItemProps {
  toast: Toast;
  onRemove: (id: string) => void;
}

export function ToastItem({ toast, onRemove }: ToastItemProps) {
  const [exiting, setExiting] = React.useState(false);

  const dismiss = React.useCallback(() => {
    setExiting(true);
    // Wait for exit animation before removing from state
    setTimeout(() => onRemove(toast.id), 200);
  }, [toast.id, onRemove]);

  // Auto-dismiss
  React.useEffect(() => {
    const duration = toast.duration ?? 4000;
    const timer = setTimeout(dismiss, duration);
    return () => clearTimeout(timer);
  }, [toast.duration, dismiss]);

  const toastCls = [
    styles.toast,
    styles[toast.type],
    exiting ? styles.toastExiting : '',
  ]
    .filter(Boolean)
    .join(' ');

  const iconMap: Record<Toast['type'], React.ReactElement> = {
    success: <CheckCircle size={18} className={styles.iconSuccess} />,
    error: <XCircle size={18} className={styles.iconError} />,
    warning: <AlertTriangle size={18} className={styles.iconWarning} />,
    info: <Info size={18} className={styles.iconInfo} />,
  };

  return (
    <div className={toastCls} role="alert" aria-live="polite">
      <span className={styles.icon} aria-hidden="true">
        {iconMap[toast.type]}
      </span>
      <div className={styles.content}>
        <p className={styles.message}>{toast.message}</p>
      </div>
      <button
        className={styles.closeBtn}
        onClick={dismiss}
        aria-label="Dismiss notification"
      >
        <X size={14} />
      </button>
    </div>
  );
}

// ── ToastContainer ─────────────────────────────────────────

const MAX_VISIBLE = 3;

export function ToastContainer() {
  const toasts = useUIStore((s) => s.toasts);
  const removeToast = useUIStore((s) => s.removeToast);

  // Show at most MAX_VISIBLE, newest on top (rendered last = visually on top)
  const visible = toasts.slice(-MAX_VISIBLE);

  return (
    <div className={styles.container} aria-label="Notifications" role="region">
      {visible.map((t) => (
        <ToastItem key={t.id} toast={t} onRemove={removeToast} />
      ))}
    </div>
  );
}
