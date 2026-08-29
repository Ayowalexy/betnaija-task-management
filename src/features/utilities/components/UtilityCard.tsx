import type { ReactElement } from 'react';
import { Wrench, ListChecks, CalendarCheck2, CalendarOff } from 'lucide-react';
import type { Utility } from '../../../types/index.js';
import styles from './UtilityCard.module.css';

interface UtilityCardProps {
  utility: Utility;
  onClick: (id: string) => void;
}

export function UtilityCard({ utility, onClick }: UtilityCardProps): ReactElement {
  const isSynced = utility.calendar.enabled;

  return (
    <button
      type="button"
      className={styles.card}
      onClick={() => onClick(utility.id)}
      aria-label={`Open ${utility.name} utility`}
    >
      <div className={styles.top}>
        <div className={styles.iconRow}>
          <div className={styles.iconWrap}>
            <Wrench size={22} />
          </div>
          {utility.status === 'inactive' && (
            <span className={styles.inactiveBadge}>Inactive</span>
          )}
        </div>

        <div className={styles.nameBlock}>
          <h3 className={styles.name}>{utility.name}</h3>
          <p className={styles.description}>{utility.description || 'No description provided.'}</p>
        </div>
      </div>

      <div className={styles.stats}>
        <span className={styles.statItem}>
          <ListChecks size={13} />
          {utility.options.length} {utility.options.length === 1 ? 'option' : 'options'}
        </span>
        <span className={styles.statDivider} aria-hidden="true" />
        <span className={`${styles.calendarBadge} ${isSynced ? styles.synced : styles.notSynced}`}>
          {isSynced ? <CalendarCheck2 size={13} /> : <CalendarOff size={13} />}
          {isSynced ? 'Calendar synced' : 'No calendar'}
        </span>
      </div>

      <div className={styles.bottom}>
        <div className={styles.optionChips}>
          {utility.options.slice(0, 3).map((opt) => (
            <span key={opt.id} className={styles.chip}>
              {opt.name}
            </span>
          ))}
          {utility.options.length > 3 && (
            <span className={styles.chip}>+{utility.options.length - 3} more</span>
          )}
        </div>
      </div>
    </button>
  );
}
