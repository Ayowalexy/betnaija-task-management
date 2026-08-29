import React from 'react';
import type { TicketStatus, TicketPriority } from '@/types/index.js';
import styles from './Badge.module.css';

interface BadgeProps {
  variant?: 'default' | 'success' | 'warning' | 'error' | 'info' | 'purple';
  size?: 'sm' | 'md';
  children: React.ReactNode;
  dot?: boolean;
}

export function Badge({
  variant = 'default',
  size = 'md',
  children,
  dot = false,
}: BadgeProps) {
  const cls = [styles.badge, styles[variant], styles[size]].join(' ');

  return (
    <span className={cls}>
      {dot && <span className={styles.dot} aria-hidden="true" />}
      {children}
    </span>
  );
}

export function getStatusVariant(status: TicketStatus): BadgeProps['variant'] {
  switch (status) {
    case 'open':
      return 'info';
    case 'in_progress':
      return 'info';
    case 'pending':
      return 'warning';
    case 'transferred':
      return 'purple';
    case 'defaulted':
      return 'default';
    case 'escalated':
      return 'warning';
    case 'resolved':
      return 'success';
    case 'closed':
      return 'default';
    default:
      return 'default';
  }
}

export function getPriorityVariant(priority: TicketPriority): BadgeProps['variant'] {
  switch (priority) {
    case 'low':
      return 'success';
    case 'medium':
      return 'warning';
    case 'high':
      return 'warning';
    case 'critical':
      return 'error';
    default:
      return 'default';
  }
}
