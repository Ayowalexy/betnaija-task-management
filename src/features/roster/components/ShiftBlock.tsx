import { X } from 'lucide-react';
import type { Shift, User } from '../../../types/index';
import { Avatar } from '../../../components/ui/index';
import styles from './ShiftBlock.module.css';

interface ShiftBlockProps {
  shift: Shift;
  user: User;
  onDelete: (id: string) => void;
}

export function ShiftBlock({ shift, user, onDelete }: ShiftBlockProps) {
  return (
    <div
      className={styles.block}
      style={{ background: `${user.avatarColor}22`, borderColor: `${user.avatarColor}44` }}
    >
      <Avatar initials={user.avatarInitials} color={user.avatarColor} size="xs" name={user.name} />
      <div className={styles.info}>
        <div className={styles.name}>{user.name.split(' ')[0]}</div>
        <div className={styles.time}>{shift.startTime}–{shift.endTime}</div>
      </div>
      <button
        className={styles.deleteBtn}
        onClick={(e) => { e.stopPropagation(); onDelete(shift.id); }}
        aria-label={`Remove shift for ${user.name}`}
        type="button"
      >
        <X size={10} />
      </button>
    </div>
  );
}
