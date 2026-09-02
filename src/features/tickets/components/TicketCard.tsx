import type { KeyboardEvent } from 'react';
import { format } from 'date-fns';
import type { Ticket } from '@/types/index';
import { Avatar } from '@/components/ui/index';
import { SLACountdown } from '@/components/shared/SLACountdown';
import { TicketStatusBadge } from './TicketStatusBadge';
import { TicketPriorityBadge } from './TicketPriorityBadge';
import styles from './TicketCard.module.css';

interface TicketCardProps {
  ticket: Ticket;
  onClick: () => void;
}

export function TicketCard({ ticket, onClick }: TicketCardProps) {
  const truncatedTitle =
    ticket.title.length > 60 ? `${ticket.title.slice(0, 60)}…` : ticket.title;

  function handleKeyDown(e: KeyboardEvent<HTMLElement>) {
    if (e.key === 'Enter' || e.key === ' ') onClick();
  }

  return (
    <article
      className={styles.card}
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={handleKeyDown}
      aria-label={`Ticket ${ticket.id}: ${ticket.title}`}
    >
      <div className={styles.header}>
        <span className={styles.idChip}>#{ticket.id.slice(0, 8).toUpperCase()}</span>
        <TicketStatusBadge status={ticket.status} ticketId={ticket.id} readOnly />
      </div>
      <h3 className={styles.title} title={ticket.title}>{truncatedTitle}</h3>
      <div className={styles.meta}>
        <TicketPriorityBadge priority={ticket.priority} size="sm" />
        {ticket.departmentName && (
          <span className={styles.dept}>{ticket.departmentName}</span>
        )}
      </div>
      <div className={styles.footer}>
        <div className={styles.footerLeft}>
          {ticket.assigneeName ? (
            <div className={styles.assignee}>
              <Avatar
                initials={ticket.assigneeInitials ?? ticket.assigneeName.slice(0, 2).toUpperCase()}
                color={ticket.assigneeColor ?? '#4F6EF7'}
                size="xs"
                name={ticket.assigneeName}
              />
              <span className={styles.assigneeName}>{ticket.assigneeName}</span>
            </div>
          ) : (
            <span className={styles.unassigned}>Unassigned</span>
          )}
        </div>
        <div className={styles.footerRight}>
          {ticket.slaResolutionDeadline && (
            <SLACountdown deadline={ticket.slaResolutionDeadline} createdAt={ticket.createdAt} variant="pill" />
          )}
          <span className={styles.date}>{format(new Date(ticket.createdAt), 'MMM d')}</span>
        </div>
      </div>
    </article>
  );
}
