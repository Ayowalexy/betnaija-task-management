import type { ReactElement } from 'react';
import { useSLACountdown } from '@/hooks/useSLACountdown';
import styles from './SLACountdown.module.css';

interface SLACountdownProps {
  // Option A: pass a deadline ISO string
  deadline?: string | null;
  // Option B: pass createdAt + duration
  createdAt?: string;
  slaDurationMs?: number;
  variant?: 'pill' | 'bar';
}

export function SLACountdown({
  deadline,
  createdAt,
  slaDurationMs,
  variant = 'pill',
}: SLACountdownProps): ReactElement | null {
  // A deadline alone isn't enough to know how much of the window has elapsed — we need
  // the actual start time too, otherwise "elapsed" and "duration" both drift with the
  // clock and cancel out, permanently reporting ~0% elapsed (see the bug this fixed).
  let resolvedCreatedAt: string;
  let resolvedDurationMs: number;
  if (deadline && createdAt) {
    resolvedCreatedAt = createdAt;
    resolvedDurationMs = Math.max(0, new Date(deadline).getTime() - new Date(createdAt).getTime());
  } else if (createdAt) {
    resolvedCreatedAt = createdAt;
    resolvedDurationMs = slaDurationMs ?? 0;
  } else if (deadline) {
    // No createdAt available — can't show real progress, so just count down to the deadline.
    resolvedCreatedAt = new Date().toISOString();
    resolvedDurationMs = Math.max(0, new Date(deadline).getTime() - Date.now());
  } else {
    resolvedCreatedAt = '';
    resolvedDurationMs = 0;
  }

  const { timeRemaining, percentElapsed, status } = useSLACountdown(
    resolvedCreatedAt,
    resolvedDurationMs,
  );

  if (!resolvedCreatedAt) return null;

  if (variant === 'bar') {
    const fillWidth = `${Math.min(100, percentElapsed).toFixed(1)}%`;
    return (
      <div className={styles.bar}>
        <div className={styles.barTrack}>
          <div
            className={`${styles.barFill} ${styles[status]}`}
            style={{ width: fillWidth }}
            role="progressbar"
            aria-valuenow={Math.round(percentElapsed)}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label={`SLA ${percentElapsed.toFixed(0)}% elapsed`}
          />
        </div>
        <div className={styles.barMeta}>
          <span className={styles.barLabel}>SLA</span>
          <span className={`${styles.barTime} ${styles[status]}`}>
            {timeRemaining}
          </span>
        </div>
      </div>
    );
  }

  return (
    <span className={`${styles.pill} ${styles[status]}`} title={`SLA: ${timeRemaining}`}>
      <span className={`${styles.dot} ${styles[status]}`} aria-hidden="true" />
      {status === 'breached' ? 'BREACHED' : timeRemaining}
    </span>
  );
}
