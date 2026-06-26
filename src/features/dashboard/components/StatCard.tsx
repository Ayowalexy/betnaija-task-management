import { TrendingUp, TrendingDown } from 'lucide-react';
import styles from './StatCard.module.css';

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: React.ReactNode;
  iconBg?: string;
  trend?: { value: number; label: string };
}

export function StatCard({ title, value, subtitle, icon, iconBg = 'var(--color-primary-subtle)', trend }: StatCardProps) {
  const isUp = trend ? trend.value >= 0 : null;

  return (
    <div className={styles.card}>
      <div className={styles.iconBox} style={{ background: iconBg }}>
        {icon}
      </div>
      <div className={styles.body}>
        <p className={styles.title}>{title}</p>
        <p className={styles.value}>{value}</p>
        {subtitle && <p className={styles.subtitle}>{subtitle}</p>}
        {trend && (
          <div className={`${styles.trend} ${isUp ? styles.up : styles.down}`}>
            {isUp ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
            <span>{Math.abs(trend.value)}% {trend.label}</span>
          </div>
        )}
      </div>
    </div>
  );
}
