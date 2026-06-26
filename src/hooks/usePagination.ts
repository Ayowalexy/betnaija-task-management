import { useState, useMemo } from 'react';

interface UsePaginationReturn<T> {
  page: number;
  totalPages: number;
  paginatedItems: T[];
  goToPage: (page: number) => void;
  nextPage: () => void;
  prevPage: () => void;
  canNext: boolean;
  canPrev: boolean;
}

export function usePagination<T>(
  items: T[],
  pageSize: number
): UsePaginationReturn<T> {
  const [page, setPage] = useState(1);

  const totalPages = useMemo(
    () => Math.max(1, Math.ceil(items.length / pageSize)),
    [items.length, pageSize]
  );

  const safePage = Math.min(page, totalPages);

  const paginatedItems = useMemo(() => {
    const start = (safePage - 1) * pageSize;
    return items.slice(start, start + pageSize);
  }, [items, safePage, pageSize]);

  const goToPage = (target: number): void => {
    const clamped = Math.max(1, Math.min(target, totalPages));
    setPage(clamped);
  };

  const nextPage = (): void => {
    setPage((p) => Math.min(p + 1, totalPages));
  };

  const prevPage = (): void => {
    setPage((p) => Math.max(p - 1, 1));
  };

  return {
    page: safePage,
    totalPages,
    paginatedItems,
    goToPage,
    nextPage,
    prevPage,
    canNext: safePage < totalPages,
    canPrev: safePage > 1,
  };
}
