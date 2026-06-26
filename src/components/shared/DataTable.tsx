import { useState, useMemo } from 'react';
import type { ReactNode, ReactElement } from 'react';
import { ArrowUp, ArrowDown, ArrowUpDown, ChevronLeft, ChevronRight } from 'lucide-react';
import { usePagination } from '../../hooks/usePagination';
import { EmptyState } from './EmptyState';
import styles from './DataTable.module.css';

export interface Column<T> {
  key: string;
  header: string;
  render: (row: T) => ReactNode;
  sortable?: boolean;
  width?: string;
}

interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  keyExtractor: (row: T) => string;
  onRowClick?: (row: T) => void;
  loading?: boolean;
  emptyState?: ReactNode;
  checkboxSelection?: boolean;
  pageSize?: number;
  stickyHeader?: boolean;
}

type SortDir = 'asc' | 'desc' | null;

// ── Sub-components ─────────────────────────────────────────────────────────

interface TableHeaderProps<T> {
  columns: Column<T>[];
  sortKey: string | null;
  sortDir: SortDir;
  onSort: (key: string) => void;
  checkboxSelection: boolean;
  allSelected: boolean;
  onSelectAll: () => void;
}

function TableHeader<T>({
  columns,
  sortKey,
  sortDir,
  onSort,
  checkboxSelection,
  allSelected,
  onSelectAll,
}: TableHeaderProps<T>): ReactElement {
  return (
    <thead className={styles.thead}>
      <tr>
        {checkboxSelection && (
          <th className={`${styles.th} ${styles.checkboxCol}`}>
            <input
              type="checkbox"
              checked={allSelected}
              onChange={onSelectAll}
              aria-label="Select all rows"
            />
          </th>
        )}
        {columns.map((col) => {
          const isActive = sortKey === col.key;
          return (
            <th
              key={col.key}
              className={`${styles.th}${col.sortable ? ` ${styles.sortable}` : ''}${isActive ? ` ${styles.sortActive}` : ''}`}
              style={col.width ? { width: col.width } : undefined}
              onClick={col.sortable ? () => onSort(col.key) : undefined}
            >
              <span className={styles.thInner}>
                {col.header}
                {col.sortable && (
                  <span className={styles.sortIcon} aria-hidden="true">
                    {!isActive && <ArrowUpDown size={12} />}
                    {isActive && sortDir === 'asc' && <ArrowUp size={12} />}
                    {isActive && sortDir === 'desc' && <ArrowDown size={12} />}
                  </span>
                )}
              </span>
            </th>
          );
        })}
      </tr>
    </thead>
  );
}

interface TableBodyProps<T> {
  columns: Column<T>[];
  rows: T[];
  keyExtractor: (row: T) => string;
  onRowClick?: (row: T) => void;
  loading: boolean;
  emptyState: ReactNode;
  checkboxSelection: boolean;
  selectedIds: Set<string>;
  onToggleRow: (id: string) => void;
}

function TableBody<T>({
  columns,
  rows,
  keyExtractor,
  onRowClick,
  loading,
  emptyState,
  checkboxSelection,
  selectedIds,
  onToggleRow,
}: TableBodyProps<T>): ReactElement {
  const colSpan = columns.length + (checkboxSelection ? 1 : 0);

  if (loading) {
    return (
      <tbody className={styles.tbody}>
        {Array.from({ length: 5 }, (_, i) => (
          <tr key={i} className={styles.tr}>
            {checkboxSelection && (
              <td className={`${styles.td} ${styles.checkboxCell}`}>
                <span className={styles.skeletonLine} style={{ width: 16, height: 16, display: 'block', borderRadius: 4 }} aria-hidden="true" />
              </td>
            )}
            {columns.map((col) => (
              <td key={col.key} className={styles.skeletonCell}>
                <span
                  className={styles.skeletonLine}
                  style={{ width: `${60 + ((i * 13 + col.key.length * 7) % 35)}%` }}
                  aria-hidden="true"
                />
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    );
  }

  if (rows.length === 0) {
    return (
      <tbody className={styles.tbody}>
        <tr className={styles.emptyRow}>
          <td colSpan={colSpan}>
            {emptyState ?? (
              <EmptyState title="No data" description="Nothing to display here yet." />
            )}
          </td>
        </tr>
      </tbody>
    );
  }

  return (
    <tbody className={styles.tbody}>
      {rows.map((row) => {
        const id = keyExtractor(row);
        const isSelected = selectedIds.has(id);
        return (
          <tr
            key={id}
            className={`${styles.tr}${onRowClick ? ` ${styles.clickable}` : ''}${isSelected ? ` ${styles.selected}` : ''}`}
            onClick={onRowClick ? () => onRowClick(row) : undefined}
          >
            {checkboxSelection && (
              <td
                className={`${styles.td} ${styles.checkboxCell}`}
                onClick={(e) => e.stopPropagation()}
              >
                <input
                  type="checkbox"
                  checked={isSelected}
                  onChange={() => onToggleRow(id)}
                  aria-label={`Select row ${id}`}
                />
              </td>
            )}
            {columns.map((col) => (
              <td key={col.key} className={styles.td}>
                {col.render(row)}
              </td>
            ))}
          </tr>
        );
      })}
    </tbody>
  );
}

interface PaginationControlsProps {
  page: number;
  totalPages: number;
  totalItems: number;
  pageSize: number;
  canPrev: boolean;
  canNext: boolean;
  goToPage: (p: number) => void;
  prevPage: () => void;
  nextPage: () => void;
}

function PaginationControls({
  page,
  totalPages,
  totalItems,
  pageSize,
  canPrev,
  canNext,
  goToPage,
  prevPage,
  nextPage,
}: PaginationControlsProps): ReactElement {
  const startItem = (page - 1) * pageSize + 1;
  const endItem = Math.min(page * pageSize, totalItems);

  // Build page number array with ellipsis
  const pages: (number | 'dots')[] = useMemo(() => {
    if (totalPages <= 7) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }
    const result: (number | 'dots')[] = [1];
    if (page > 3) result.push('dots');
    const start = Math.max(2, page - 1);
    const end = Math.min(totalPages - 1, page + 1);
    for (let i = start; i <= end; i++) result.push(i);
    if (page < totalPages - 2) result.push('dots');
    result.push(totalPages);
    return result;
  }, [totalPages, page]);

  return (
    <div className={styles.pagination} role="navigation" aria-label="Table pagination">
      <span className={styles.paginationInfo}>
        Showing {startItem}–{endItem} of {totalItems}
      </span>
      <div className={styles.paginationControls}>
        <button
          type="button"
          className={styles.pageBtn}
          onClick={prevPage}
          disabled={!canPrev}
          aria-label="Previous page"
        >
          <ChevronLeft size={14} />
        </button>

        {pages.map((p, i) =>
          p === 'dots' ? (
            <span key={`dots-${i}`} className={styles.pageDots}>…</span>
          ) : (
            <button
              key={p}
              type="button"
              className={`${styles.pageBtn}${p === page ? ` ${styles.active}` : ''}`}
              onClick={() => goToPage(p)}
              aria-label={`Page ${p}`}
              aria-current={p === page ? 'page' : undefined}
            >
              {p}
            </button>
          ),
        )}

        <button
          type="button"
          className={styles.pageBtn}
          onClick={nextPage}
          disabled={!canNext}
          aria-label="Next page"
        >
          <ChevronRight size={14} />
        </button>
      </div>
    </div>
  );
}

// ── Main DataTable ──────────────────────────────────────────────────────────

export function DataTable<T>({
  columns,
  data,
  keyExtractor,
  onRowClick,
  loading = false,
  emptyState,
  checkboxSelection = false,
  pageSize = 10,
  stickyHeader = false,
}: DataTableProps<T>): ReactElement {
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortDir, setSortDir] = useState<SortDir>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const sortedData = useMemo(() => {
    if (!sortKey || !sortDir) return data;
    const col = columns.find((c) => c.key === sortKey);
    if (!col) return data;
    return [...data].sort((a, b) => {
      const aVal = col.render(a);
      const bVal = col.render(b);
      const aStr = String(aVal ?? '').toLowerCase();
      const bStr = String(bVal ?? '').toLowerCase();
      const cmp = aStr < bStr ? -1 : aStr > bStr ? 1 : 0;
      return sortDir === 'asc' ? cmp : -cmp;
    });
  }, [data, sortKey, sortDir, columns]);

  const { page, totalPages, paginatedItems, goToPage, nextPage, prevPage, canNext, canPrev } =
    usePagination(sortedData, pageSize);

  const handleSort = (key: string): void => {
    if (sortKey !== key) {
      setSortKey(key);
      setSortDir('asc');
    } else if (sortDir === 'asc') {
      setSortDir('desc');
    } else {
      setSortKey(null);
      setSortDir(null);
    }
  };

  const allSelected =
    paginatedItems.length > 0 &&
    paginatedItems.every((row) => selectedIds.has(keyExtractor(row)));

  const handleSelectAll = (): void => {
    if (allSelected) {
      setSelectedIds((prev) => {
        const next = new Set(prev);
        paginatedItems.forEach((row) => next.delete(keyExtractor(row)));
        return next;
      });
    } else {
      setSelectedIds((prev) => {
        const next = new Set(prev);
        paginatedItems.forEach((row) => next.add(keyExtractor(row)));
        return next;
      });
    }
  };

  const handleToggleRow = (id: string): void => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  return (
    <div className={`${styles.wrapper}${stickyHeader ? ` ${styles.stickyHeader}` : ''}`}>
      <table className={styles.table} role="grid">
        <TableHeader
          columns={columns}
          sortKey={sortKey}
          sortDir={sortDir}
          onSort={handleSort}
          checkboxSelection={checkboxSelection}
          allSelected={allSelected}
          onSelectAll={handleSelectAll}
        />
        <TableBody
          columns={columns}
          rows={paginatedItems}
          keyExtractor={keyExtractor}
          onRowClick={onRowClick}
          loading={loading}
          emptyState={emptyState}
          checkboxSelection={checkboxSelection}
          selectedIds={selectedIds}
          onToggleRow={handleToggleRow}
        />
      </table>
      {!loading && data.length > pageSize && (
        <PaginationControls
          page={page}
          totalPages={totalPages}
          totalItems={data.length}
          pageSize={pageSize}
          canPrev={canPrev}
          canNext={canNext}
          goToPage={goToPage}
          prevPage={prevPage}
          nextPage={nextPage}
        />
      )}
    </div>
  );
}
