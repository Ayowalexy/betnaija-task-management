import type { ReactElement, ReactNode } from 'react';
import { TrendingUp, TrendingDown } from 'lucide-react';
import styles from './StatCard.module.css';

interface StatCardProps {
  title: string;
  value: string | number;
  change?: number;
  changeLabel?: string;
  icon: ReactNode;
  color?: string;
}

export function StatCard({ title, value, change, changeLabel, icon, color }: StatCardProps): ReactElement {
  const isPositive = change !== undefined && change >= 0;
  const isNegative = change !== undefined && change < 0;

  return (
    <div className={styles.card}>
      <div className={styles.iconWrap} style={color ? { background: color + '1a', color } : undefined}>
        {icon}
      </div>
      <div className={styles.content}>
        <span className={styles.value}>{value}</span>
        <span className={styles.title}>{title}</span>
        {change !== undefined && (
          <div className={[styles.change, isPositive ? styles.positive : styles.negative].join(' ')}>
            {isPositive ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
            <span>
              {isNegative ? '' : '+'}{change}%{changeLabel ? ` ${changeLabel}` : ''}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
