import React from 'react';
import { format } from 'date-fns';
import type { Ticket } from '../../../types/index';
import { Avatar } from '../../../components/ui/index';
import { SLACountdown } from '../../../components/shared/SLACountdown';
import { getDeptById } from '../../../mocks/departments';
import { getUserById } from '../../../mocks/users';
import { TicketStatusBadge } from './TicketStatusBadge';
import { TicketPriorityBadge } from './TicketPriorityBadge';
import styles from './TicketCard.module.css';

interface TicketCardProps {
  ticket: Ticket;
  onClick: () => void;
}

export function TicketCard({ ticket, onClick }: TicketCardProps) {
  const dept = getDeptById(ticket.departmentId);
  const assignee = ticket.assigneeId ? getUserById(ticket.assigneeId) : null;
  const truncatedTitle =
    ticket.title.length > 60 ? `${ticket.title.slice(0, 60)}…` : ticket.title;

  function handleKeyDown(e: React.KeyboardEvent<HTMLElement>) {
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
        <span className={styles.idChip}>#{ticket.id.toUpperCase()}</span>
        <TicketStatusBadge status={ticket.status} ticketId={ticket.id} readOnly />
      </div>
      <h3 className={styles.title} title={ticket.title}>{truncatedTitle}</h3>
      <div className={styles.meta}>
        <TicketPriorityBadge priority={ticket.priority} size="sm" />
        {dept && <span className={styles.dept}>{dept.name}</span>}
      </div>
      <div className={styles.footer}>
        <div className={styles.footerLeft}>
          {assignee ? (
            <div className={styles.assignee}>
              <Avatar
                initials={assignee.avatarInitials}
                color={assignee.avatarColor}
                size="xs"
                name={assignee.name}
              />
              <span className={styles.assigneeName}>{assignee.name}</span>
            </div>
          ) : (
            <span className={styles.unassigned}>Unassigned</span>
          )}
        </div>
        <div className={styles.footerRight}>
          {dept && (
            <SLACountdown
              createdAt={ticket.createdAt}
              slaDurationMs={dept.sla.resolutionTimeMs}
              variant="pill"
            />
          )}
          <span className={styles.date}>{format(new Date(ticket.createdAt), 'MMM d')}</span>
        </div>
      </div>
    </article>
  );
}
