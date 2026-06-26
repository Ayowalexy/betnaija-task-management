import React from 'react';
import styles from './Tooltip.module.css';

interface TooltipProps {
  content: string;
  children: React.ReactElement;
  position?: 'top' | 'bottom' | 'left' | 'right';
}

export function Tooltip({ content, children, position = 'top' }: TooltipProps) {
  return (
    <span className={styles.wrapper}>
      {children}
      <span
        className={[styles.tooltip, styles[position]].join(' ')}
        role="tooltip"
        aria-hidden="true"
      >
        {content}
      </span>
    </span>
  );
}
