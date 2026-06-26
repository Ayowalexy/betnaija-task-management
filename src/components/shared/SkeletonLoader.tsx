import type { CSSProperties, ReactElement } from 'react';
import styles from './SkeletonLoader.module.css';

interface SkeletonLoaderProps {
  width?: string;
  height?: string;
  borderRadius?: string;
  count?: number;
  className?: string;
}

export function SkeletonLoader({
  width = '100%',
  height = '16px',
  borderRadius,
  count = 1,
  className,
}: SkeletonLoaderProps): ReactElement {
  const style: CSSProperties = {
    width,
    height,
    ...(borderRadius ? { borderRadius } : {}),
  };

  if (count === 1) {
    return (
      <span
        className={`${styles.skeleton}${className ? ` ${className}` : ''}`}
        style={style}
        aria-hidden="true"
      />
    );
  }

  return (
    <span className={styles.stack} aria-hidden="true">
      {Array.from({ length: count }, (_, i) => (
        <span
          key={i}
          className={`${styles.skeleton}${className ? ` ${className}` : ''}`}
          style={style}
        />
      ))}
    </span>
  );
}
