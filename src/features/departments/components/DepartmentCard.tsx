import type { ReactElement } from 'react';
import type { Department } from '@/types/index.js';
import { Avatar } from '@/components/ui/index.js';
import { Building2, Users, Ticket } from 'lucide-react';
import styles from './DepartmentCard.module.css';

interface DepartmentCardProps {
  department: Department;
  onClick: (id: string) => void;
  headName?: string;
  headInitials?: string;
  headColor?: string;
}

function formatSlaTime(ms: number): string {
  const totalMinutes = Math.round(ms / (1000 * 60));
  if (totalMinutes < 60) return `${totalMinutes} min`;
  const hours = totalMinutes / 60;
  if (Number.isInteger(hours)) return `${hours}h`;
  return `${hours}h`;
}

export function DepartmentCard({ department, onClick, headName, headInitials, headColor }: DepartmentCardProps): ReactElement {
  const isRoster = department.routing === 'roster_based';
  const routingLabel = isRoster ? 'Roster-Based' : 'All-Notify';
  const iconClass = isRoster ? styles.roster : styles.allNotify;
  const badgeClass = isRoster ? styles.roster : styles.allNotify;
  const totalMembers = department.memberIds.length + 1; // +1 for head

  return (
    <button
      type="button"
      className={styles.card}
      onClick={() => onClick(department.id)}
      aria-label={`Open ${department.name} department`}
    >
      {/* Top section */}
      <div className={styles.top}>
        <div className={styles.iconRow}>
          <div className={`${styles.iconWrap} ${iconClass}`}>
            <Building2 size={22} />
          </div>
        </div>

        <div className={styles.nameBlock}>
          <h3 className={styles.name}>{department.name}</h3>
          <p className={styles.description}>{department.description}</p>
        </div>
      </div>

      {/* Stats row */}
      <div className={styles.stats}>
        <span className={styles.statItem}>
          <Users size={13} />
          {totalMembers} {totalMembers === 1 ? 'member' : 'members'}
        </span>
        <span className={styles.statDivider} aria-hidden="true" />
        <span className={styles.statItem}>
          <Ticket size={13} />
          {department.activeTicketCount} tickets
        </span>
        <span className={styles.statDivider} aria-hidden="true" />
        <span className={`${styles.routingBadge} ${badgeClass}`}>
          {routingLabel}
        </span>
      </div>

      {/* Bottom section */}
      <div className={styles.bottom}>
        {headName && (
          <div className={styles.headRow}>
            <span className={styles.headLabel}>Head</span>
            <Avatar
              initials={headInitials ?? headName.slice(0, 2).toUpperCase()}
              color={headColor ?? '#4F6EF7'}
              size="xs"
              name={headName}
            />
            <span className={styles.headName}>{headName}</span>
          </div>
        )}

        <div className={styles.slaRow}>
          <div className={styles.slaItem}>
            <span className={styles.slaLabel}>Response SLA</span>
            <span className={styles.slaValue}>{formatSlaTime(department.sla.responseTimeMs)}</span>
          </div>
          <div className={styles.slaItem}>
            <span className={styles.slaLabel}>Resolution SLA</span>
            <span className={styles.slaValue}>{formatSlaTime(department.sla.resolutionTimeMs)}</span>
          </div>
        </div>
      </div>
    </button>
  );
}
