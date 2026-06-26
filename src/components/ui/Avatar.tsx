import styles from './Avatar.module.css';

interface AvatarProps {
  initials: string;
  color: string;
  size?: 'xs' | 'sm' | 'md' | 'lg';
  online?: boolean;
  name?: string;
}

export function Avatar({
  initials,
  color,
  size = 'md',
  online = false,
  name,
}: AvatarProps) {
  const cls = [styles.avatar, styles[size]].join(' ');

  return (
    <div
      className={cls}
      style={{ backgroundColor: color }}
      title={name}
      aria-label={name ?? initials}
      role="img"
    >
      {initials.slice(0, 2).toUpperCase()}
      {online && <span className={styles.onlineDot} aria-label="Online" />}
    </div>
  );
}
