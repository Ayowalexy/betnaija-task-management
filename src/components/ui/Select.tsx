import React from 'react';
import { ChevronDown } from 'lucide-react';
import styles from './Select.module.css';

interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  options: SelectOption[];
  placeholder?: string;
  wrapperClassName?: string;
}

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  function Select(
    {
      label,
      error,
      options,
      placeholder,
      wrapperClassName,
      id,
      className,
      value,
      ...rest
    },
    ref
  ) {
    const generatedId = React.useId();
    const selectId = id ?? generatedId;

    const selectCls = [
      styles.select,
      error ? styles.selectError : '',
      !value && placeholder ? styles.placeholder : '',
      className ?? '',
    ]
      .filter(Boolean)
      .join(' ');

    return (
      <div className={[styles.wrapper, wrapperClassName ?? ''].filter(Boolean).join(' ')}>
        {label && (
          <label htmlFor={selectId} className={styles.label}>
            {label}
          </label>
        )}
        <div className={styles.selectWrap}>
          <select
            ref={ref}
            id={selectId}
            className={selectCls}
            value={value}
            aria-invalid={!!error}
            aria-describedby={error ? `${selectId}-error` : undefined}
            {...rest}
          >
            {placeholder && (
              <option value="" disabled>
                {placeholder}
              </option>
            )}
            {options.map((opt) => (
              <option key={opt.value} value={opt.value} disabled={opt.disabled}>
                {opt.label}
              </option>
            ))}
          </select>
          <span className={styles.chevron} aria-hidden="true">
            <ChevronDown size={16} />
          </span>
        </div>
        {error && (
          <span id={`${selectId}-error`} className={styles.error} role="alert">
            {error}
          </span>
        )}
      </div>
    );
  }
);
