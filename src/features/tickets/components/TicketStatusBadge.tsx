import { useState, useRef, useEffect } from 'react';
import { ChevronDown } from 'lucide-react';
import type { TicketStatus } from '../../../types/index';
import { STATUS_TRANSITIONS } from '../types';
import styles from './TicketStatusBadge.module.css';

const STATUS_LABELS: Record<TicketStatus, string> = {
  open: 'Open',
  in_progress: 'In Progress',
  pending: 'Pending',
  transferred: 'Transferred',
  escalated: 'Escalated',
  resolved: 'Resolved',
  defaulted: 'Defaulted',
  closed: 'Closed',
};

interface TicketStatusBadgeProps {
  status: TicketStatus;
  ticketId: string;
  onChange?: (newStatus: TicketStatus) => void;
  readOnly?: boolean;
}

export function TicketStatusBadge({
  status,
  ticketId: _ticketId,
  onChange,
  readOnly = false,
}: TicketStatusBadgeProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const transitions = STATUS_TRANSITIONS[status];
  const canChange = !readOnly && transitions.length > 0 && !!onChange;

  useEffect(() => {
    if (!open) return;
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [open]);

  function handleSelect(next: TicketStatus) {
    setOpen(false);
    onChange?.(next);
  }

  return (
    <div className={styles.root} ref={ref}>
      <button
        type="button"
        className={`${styles.badge} ${styles[`status_${status.replace('_', '')}`]}`}
        onClick={() => canChange && setOpen((v) => !v)}
        aria-haspopup={canChange ? 'listbox' : undefined}
        aria-expanded={canChange ? open : undefined}
        disabled={!canChange}
        style={{ cursor: canChange ? 'pointer' : 'default' }}
      >
        <span className={styles.dot} aria-hidden="true" />
        {STATUS_LABELS[status]}
        {canChange && <ChevronDown size={12} className={styles.chevron} aria-hidden="true" />}
      </button>
      {open && canChange && (
        <div className={styles.dropdown} role="listbox" aria-label="Change status">
          {transitions.map((s) => (
            <button
              key={s}
              type="button"
              role="option"
              className={`${styles.option} ${styles[`status_${s.replace('_', '')}`]}`}
              onClick={() => handleSelect(s)}
            >
              <span className={styles.dot} aria-hidden="true" />
              {STATUS_LABELS[s]}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
