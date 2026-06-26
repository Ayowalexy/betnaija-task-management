import React from 'react';
import styles from './Dropdown.module.css';

interface DropdownItem {
  label: string;
  icon?: React.ReactNode;
  onClick: () => void;
  variant?: 'default' | 'danger';
  disabled?: boolean;
  dividerAfter?: boolean;
}

interface DropdownProps {
  trigger: React.ReactElement;
  items: DropdownItem[];
  align?: 'left' | 'right';
}

export function Dropdown({ trigger, items, align = 'left' }: DropdownProps) {
  const [open, setOpen] = React.useState(false);
  const wrapperRef = React.useRef<HTMLDivElement>(null);

  const toggle = React.useCallback(() => setOpen((prev) => !prev), []);

  const close = React.useCallback(() => setOpen(false), []);

  // Close on outside click
  React.useEffect(() => {
    if (!open) return;
    function handlePointerDown(e: PointerEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        close();
      }
    }
    document.addEventListener('pointerdown', handlePointerDown);
    return () => document.removeEventListener('pointerdown', handlePointerDown);
  }, [open, close]);

  // Close on Escape
  React.useEffect(() => {
    if (!open) return;
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') close();
    }
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [open, close]);

  const menuCls = [
    styles.menu,
    open ? styles.menuOpen : '',
    align === 'right' ? styles.alignRight : styles.alignLeft,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div ref={wrapperRef} className={styles.wrapper}>
      {React.cloneElement(trigger as React.ReactElement<Record<string, unknown>>, {
        onClick: toggle,
        'aria-expanded': open,
        'aria-haspopup': 'true' as const,
      })}
      <div className={menuCls} role="menu" aria-hidden={!open}>
        {items.map((item, idx) => (
          <React.Fragment key={idx}>
            <button
              className={[
                styles.item,
                item.variant === 'danger' ? styles.itemDanger : '',
                item.disabled ? styles.itemDisabled : '',
              ]
                .filter(Boolean)
                .join(' ')}
              role="menuitem"
              disabled={item.disabled}
              onClick={() => {
                if (!item.disabled) {
                  item.onClick();
                  close();
                }
              }}
            >
              {item.icon && (
                <span className={styles.itemIcon} aria-hidden="true">
                  {item.icon}
                </span>
              )}
              {item.label}
            </button>
            {item.dividerAfter && <div className={styles.divider} role="separator" />}
          </React.Fragment>
        ))}
      </div>
    </div>
  );
}
