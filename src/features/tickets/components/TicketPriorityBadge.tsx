import type { TicketPriority } from '@/types/index';
import styles from './TicketPriorityBadge.module.css';

const PRIORITY_LABELS: Record<TicketPriority, string> = {
  low: 'Low',
  medium: 'Medium',
  high: 'High',
  critical: 'Critical',
};

interface TicketPriorityBadgeProps {
  priority: TicketPriority;
  size?: 'sm' | 'md';
}

export function TicketPriorityBadge({ priority, size = 'md' }: TicketPriorityBadgeProps) {
  return (
    <span className={`${styles.badge} ${styles[priority]} ${styles[size]}`}>
      {PRIORITY_LABELS[priority]}
    </span>
  );
}
