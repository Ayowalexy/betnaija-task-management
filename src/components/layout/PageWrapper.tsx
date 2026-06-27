import { useEffect } from 'react';
import type { ReactNode, ReactElement } from 'react';
import styles from './PageWrapper.module.css';

interface PageWrapperProps {
  title: string;
  subtitle?: string;
  actions?: ReactNode;
  children: ReactNode;
}

export function PageWrapper({
  title,
  subtitle,
  actions,
  children,
}: PageWrapperProps): ReactElement {
  useEffect(() => {
    document.title = `${title} — Betnaija`;
  }, [title]);

  return (
    <div className={styles.wrapper}>
      <div className={styles.header}>
        <div className={styles.titleGroup}>
          <h1 className={styles.title}>{title}</h1>
          {subtitle && <p className={styles.subtitle}>{subtitle}</p>}
        </div>
        {actions && <div className={styles.actions}>{actions}</div>}
      </div>
      <div className={styles.content}>{children}</div>
    </div>
  );
}
