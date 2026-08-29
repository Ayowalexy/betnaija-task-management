import { useState, useRef, useEffect } from 'react';
import { Search, ChevronDown, X, RotateCcw } from 'lucide-react';
import type { UtilityRequestFilters as UtilityRequestFiltersState, UtilityRequestStatus, Department, Utility } from '../../../types/index.js';
import { Input } from '../../../components/ui/index.js';
import { Checkbox } from '../../../components/ui/index.js';
import { Button } from '../../../components/ui/index.js';
import { STATUS_LABELS } from '../types.js';
import styles from './UtilityRequestFilters.module.css';

const STATUSES: UtilityRequestStatus[] = ['pending', 'approved', 'rejected', 'completed', 'cancelled'];

interface MultiSelectDropdownProps {
  label: string;
  options: { value: string; label: string }[];
  selected: string[];
  onToggle: (value: string) => void;
}

function MultiSelectDropdown({ label, options, selected, onToggle }: MultiSelectDropdownProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [open]);

  return (
    <div className={styles.multiSelect} ref={ref}>
      <button type="button" className={styles.multiSelectTrigger} onClick={() => setOpen((v) => !v)}>
        <span>{label}{selected.length > 0 ? ` (${selected.length})` : ''}</span>
        <ChevronDown size={14} className={open ? styles.chevronOpen : ''} />
      </button>
      {open && (
        <div className={styles.multiSelectDropdown}>
          {options.map((opt) => (
            <Checkbox
              key={opt.value}
              label={opt.label}
              checked={selected.includes(opt.value)}
              onChange={() => onToggle(opt.value)}
              className={styles.checkboxItem}
            />
          ))}
        </div>
      )}
    </div>
  );
}

interface UtilityRequestFiltersProps {
  filters: UtilityRequestFiltersState;
  onFilterChange: (filters: Partial<UtilityRequestFiltersState>) => void;
  onReset: () => void;
  departments: Department[];
  utilities: Utility[];
}

export function UtilityRequestFilters({
  filters,
  onFilterChange,
  onReset,
  departments,
  utilities,
}: UtilityRequestFiltersProps) {
  function toggleDept(id: string) {
    const next = filters.departmentIds.includes(id)
      ? filters.departmentIds.filter((d) => d !== id)
      : [...filters.departmentIds, id];
    onFilterChange({ departmentIds: next });
  }

  function toggleUtility(id: string) {
    const next = filters.utilityIds.includes(id)
      ? filters.utilityIds.filter((u) => u !== id)
      : [...filters.utilityIds, id];
    onFilterChange({ utilityIds: next });
  }

  function toggleStatus(s: string) {
    const status = s as UtilityRequestStatus;
    const next = filters.statuses.includes(status)
      ? filters.statuses.filter((x) => x !== status)
      : [...filters.statuses, status];
    onFilterChange({ statuses: next });
  }

  const hasFilters =
    filters.departmentIds.length > 0 || filters.utilityIds.length > 0 ||
    filters.statuses.length > 0 || filters.dateFrom || filters.dateTo || filters.search;

  return (
    <div className={styles.bar}>
      <div className={styles.left}>
        <Input
          placeholder="Search requests…"
          leftIcon={<Search size={14} />}
          value={filters.search}
          onChange={(e) => onFilterChange({ search: e.target.value })}
          rightIcon={filters.search ? (
            <button type="button" className={styles.clearBtn} onClick={() => onFilterChange({ search: '' })} aria-label="Clear search">
              <X size={12} />
            </button>
          ) : undefined}
          wrapperClassName={styles.searchInput}
        />
        <MultiSelectDropdown
          label="Utility"
          options={utilities.map((u) => ({ value: u.id, label: u.name }))}
          selected={filters.utilityIds}
          onToggle={toggleUtility}
        />
        <MultiSelectDropdown
          label="Department"
          options={departments.map((d) => ({ value: d.id, label: d.name }))}
          selected={filters.departmentIds}
          onToggle={toggleDept}
        />
        <MultiSelectDropdown
          label="Status"
          options={STATUSES.map((s) => ({ value: s, label: STATUS_LABELS[s] }))}
          selected={filters.statuses}
          onToggle={toggleStatus}
        />
        <input
          type="date"
          className={styles.dateInput}
          value={filters.dateFrom ?? ''}
          onChange={(e) => onFilterChange({ dateFrom: e.target.value || null })}
          aria-label="From date"
        />
        <input
          type="date"
          className={styles.dateInput}
          value={filters.dateTo ?? ''}
          onChange={(e) => onFilterChange({ dateTo: e.target.value || null })}
          aria-label="To date"
        />
      </div>
      {hasFilters && (
        <Button variant="ghost" size="sm" leftIcon={<RotateCcw size={13} />} onClick={onReset}>
          Reset
        </Button>
      )}
    </div>
  );
}
