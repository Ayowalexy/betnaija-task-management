import { useState, useRef, useEffect } from 'react';
import { Search, ChevronDown, X, RotateCcw } from 'lucide-react';
import type { TicketFilters, Department, User, TicketStatus, TicketPriority } from '@/types/index';
import { Input } from '@/components/ui/index';
import { Checkbox } from '@/components/ui/index';
import { Button } from '@/components/ui/index';
import styles from './TicketFilters.module.css';

const STATUSES: TicketStatus[] = ['open', 'in_progress', 'pending', 'transferred', 'escalated', 'resolved', 'defaulted', 'closed', 'rejected'];
const STATUS_LABELS: Record<TicketStatus, string> = {
  open: 'Open', in_progress: 'In Progress', pending: 'Pending',
  transferred: 'Transferred', escalated: 'Escalated', resolved: 'Resolved',
  defaulted: 'Defaulted', closed: 'Closed', rejected: 'Rejected',
};
const PRIORITIES: TicketPriority[] = ['low', 'medium', 'high', 'critical'];
const PRIORITY_LABELS: Record<TicketPriority, string> = {
  low: 'Low', medium: 'Medium', high: 'High', critical: 'Critical',
};

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

interface TicketFiltersProps {
  filters: TicketFilters;
  onFilterChange: (filters: Partial<TicketFilters>) => void;
  onReset: () => void;
  departments: Department[];
  users: User[];
  showDepartmentFilter?: boolean;
  showAssigneeFilter?: boolean;
}

export function TicketFilters({ filters, onFilterChange, onReset, departments, users, showDepartmentFilter = true, showAssigneeFilter = true }: TicketFiltersProps) {
  function toggleDept(id: string) {
    const next = filters.departmentIds.includes(id)
      ? filters.departmentIds.filter((d) => d !== id)
      : [...filters.departmentIds, id];
    onFilterChange({ departmentIds: next });
  }

  function toggleStatus(s: string) {
    const status = s as TicketStatus;
    const next = filters.statuses.includes(status)
      ? filters.statuses.filter((x) => x !== status)
      : [...filters.statuses, status];
    onFilterChange({ statuses: next });
  }

  function togglePriority(p: string) {
    const priority = p as TicketPriority;
    const next = filters.priorities.includes(priority)
      ? filters.priorities.filter((x) => x !== priority)
      : [...filters.priorities, priority];
    onFilterChange({ priorities: next });
  }

  const hasFilters =
    (showDepartmentFilter && filters.departmentIds.length > 0) ||
    filters.statuses.length > 0 || filters.priorities.length > 0 ||
    (showAssigneeFilter && filters.assigneeId) ||
    filters.dateFrom || filters.dateTo ||
    filters.slaBreachedFrom || filters.slaBreachedTo || filters.search;

  return (
    <div className={styles.bar}>
      <div className={styles.left}>
        <Input
          placeholder="Search tickets…"
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
        {showDepartmentFilter && (
          <MultiSelectDropdown
            label="Department"
            options={departments.map((d) => ({ value: d.id, label: d.name }))}
            selected={filters.departmentIds}
            onToggle={toggleDept}
          />
        )}
        <MultiSelectDropdown
          label="Status"
          options={STATUSES.map((s) => ({ value: s, label: STATUS_LABELS[s] }))}
          selected={filters.statuses}
          onToggle={toggleStatus}
        />
        <MultiSelectDropdown
          label="Priority"
          options={PRIORITIES.map((p) => ({ value: p, label: PRIORITY_LABELS[p] }))}
          selected={filters.priorities}
          onToggle={togglePriority}
        />
        {showAssigneeFilter && (
          <select
            className={styles.assigneeSelect}
            value={filters.assigneeId ?? ''}
            onChange={(e) => onFilterChange({ assigneeId: e.target.value || null })}
            aria-label="Filter by assignee"
          >
            <option value="">All Assignees</option>
            {users.map((u) => (
              <option key={u.id} value={u.id}>{u.name}</option>
            ))}
          </select>
        )}
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
        <div className={styles.slaBreachGroup}>
          <span className={styles.slaBreachLabel}>SLA breach</span>
          <input
            type="date"
            className={styles.dateInput}
            value={filters.slaBreachedFrom ?? ''}
            onChange={(e) => onFilterChange({ slaBreachedFrom: e.target.value || null })}
            aria-label="SLA breach from date"
            title="SLA breached from"
          />
          <span className={styles.slaBreachSep}>—</span>
          <input
            type="date"
            className={styles.dateInput}
            value={filters.slaBreachedTo ?? ''}
            onChange={(e) => onFilterChange({ slaBreachedTo: e.target.value || null })}
            aria-label="SLA breach to date"
            title="SLA breached to"
          />
        </div>
      </div>
      {hasFilters && (
        <Button variant="ghost" size="sm" leftIcon={<RotateCcw size={13} />} onClick={onReset}>
          Reset
        </Button>
      )}
    </div>
  );
}
