import React from 'react';
import styles from './Textarea.module.css';

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  hint?: string;
  wrapperClassName?: string;
}

export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  function Textarea(
    {
      label,
      error,
      hint,
      wrapperClassName,
      id,
      rows = 4,
      className,
      onChange,
      ...rest
    },
    ref
  ) {
    const generatedId = React.useId();
    const textareaId = id ?? generatedId;
    const innerRef = React.useRef<HTMLTextAreaElement>(null);

    // Merge refs
    React.useImperativeHandle(ref, () => innerRef.current as HTMLTextAreaElement);

    const handleChange = React.useCallback(
      (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        const el = innerRef.current;
        if (el) {
          el.style.height = 'auto';
          el.style.height = `${el.scrollHeight}px`;
        }
        onChange?.(e);
      },
      [onChange]
    );

    const textareaCls = [
      styles.textarea,
      error ? styles.textareaError : '',
      className ?? '',
    ]
      .filter(Boolean)
      .join(' ');

    return (
      <div className={[styles.wrapper, wrapperClassName ?? ''].filter(Boolean).join(' ')}>
        {label && (
          <label htmlFor={textareaId} className={styles.label}>
            {label}
          </label>
        )}
        <textarea
          ref={innerRef}
          id={textareaId}
          rows={rows}
          className={textareaCls}
          aria-invalid={!!error}
          aria-describedby={
            error ? `${textareaId}-error` : hint ? `${textareaId}-hint` : undefined
          }
          onChange={handleChange}
          {...rest}
        />
        {error && (
          <span id={`${textareaId}-error`} className={styles.error} role="alert">
            {error}
          </span>
        )}
        {!error && hint && (
          <span id={`${textareaId}-hint`} className={styles.hint}>
            {hint}
          </span>
        )}
      </div>
    );
  }
);
