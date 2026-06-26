import React from 'react';
import { Check, Minus } from 'lucide-react';
import styles from './Checkbox.module.css';

interface CheckboxProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  description?: string;
}

export const Checkbox = React.forwardRef<HTMLInputElement, CheckboxProps>(
  function Checkbox({ label, description, id, checked, className, ...rest }, ref) {
    const generatedId = React.useId();
    const checkboxId = id ?? generatedId;
    const isIndeterminate = rest['aria-checked'] === 'mixed';

    const boxCls = [
      styles.box,
      checked ? styles.boxChecked : '',
      isIndeterminate ? styles.boxIndeterminate : '',
    ]
      .filter(Boolean)
      .join(' ');

    return (
      <label
        htmlFor={checkboxId}
        className={[styles.wrapper, className ?? ''].filter(Boolean).join(' ')}
      >
        <input
          ref={ref}
          type="checkbox"
          id={checkboxId}
          className={styles.nativeInput}
          checked={checked}
          {...rest}
        />
        <span className={boxCls} aria-hidden="true">
          {isIndeterminate ? (
            <span className={styles.checkIcon}>
              <Minus size={12} strokeWidth={3} />
            </span>
          ) : checked ? (
            <span className={styles.checkIcon}>
              <Check size={12} strokeWidth={3} />
            </span>
          ) : null}
        </span>
        {(label ?? description) && (
          <span className={styles.labelGroup}>
            {label && <span className={styles.label}>{label}</span>}
            {description && <span className={styles.description}>{description}</span>}
          </span>
        )}
      </label>
    );
  }
);
