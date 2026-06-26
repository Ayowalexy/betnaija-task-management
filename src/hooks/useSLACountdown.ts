import { useState, useEffect } from 'react';
import type { SLAStatus } from '../types/index.js';

interface SLACountdownResult {
  timeRemaining: string;
  percentElapsed: number;
  status: SLAStatus;
}

function formatRemaining(ms: number): string {
  if (ms <= 0) return 'BREACHED';

  const totalSeconds = Math.floor(ms / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  if (hours > 0) {
    return `${hours}h ${String(minutes).padStart(2, '0')}m`;
  }
  if (minutes > 0) {
    return `${minutes}m ${String(seconds).padStart(2, '0')}s`;
  }
  return `${seconds}s`;
}

function computeResult(
  createdAtMs: number,
  slaDurationMs: number,
  nowMs: number
): SLACountdownResult {
  const elapsed = nowMs - createdAtMs;
  const remaining = slaDurationMs - elapsed;
  const percentElapsed = Math.min(100, (elapsed / slaDurationMs) * 100);

  let status: SLAStatus;
  if (remaining <= 0) {
    status = 'breached';
  } else if (percentElapsed >= 90) {
    status = 'critical';
  } else if (percentElapsed >= 75) {
    status = 'warning';
  } else {
    status = 'safe';
  }

  return {
    timeRemaining: formatRemaining(remaining),
    percentElapsed,
    status,
  };
}

export function useSLACountdown(
  createdAt: string,
  slaDurationMs: number
): SLACountdownResult {
  const createdAtMs = new Date(createdAt).getTime();

  const [result, setResult] = useState<SLACountdownResult>(() =>
    computeResult(createdAtMs, slaDurationMs, Date.now())
  );

  useEffect(() => {
    // If already breached on mount, no need to tick
    if (result.status === 'breached') return;

    const interval = setInterval(() => {
      const next = computeResult(createdAtMs, slaDurationMs, Date.now());
      setResult(next);
      if (next.status === 'breached') {
        clearInterval(interval);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [createdAtMs, slaDurationMs, result.status]);

  return result;
}
