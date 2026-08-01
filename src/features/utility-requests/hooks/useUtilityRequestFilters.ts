import { useMemo } from 'react';
import type { UtilityRequest, UtilityRequestFilters } from '../../../types/index.js';
import { useUtilityRequestStore } from '../../../store/utilityRequestStore.js';
import { useDebounce } from '../../../hooks/useDebounce.js';
import { getUtilityById } from '../../../mocks/utilities.js';

interface UseUtilityRequestFiltersReturn {
  filters: UtilityRequestFilters;
  setFilter: (updates: Partial<UtilityRequestFilters>) => void;
  resetFilters: () => void;
  filteredRequests: UtilityRequest[];
}

export function useUtilityRequestFilters(requests?: UtilityRequest[]): UseUtilityRequestFiltersReturn {
  const storeRequests = useUtilityRequestStore((s) => s.requests);
  const filters = useUtilityRequestStore((s) => s.filters);
  const setFilters = useUtilityRequestStore((s) => s.setFilters);
  const resetFilters = useUtilityRequestStore((s) => s.resetFilters);

  const source = requests ?? storeRequests;
  const debouncedSearch = useDebounce(filters.search, 300);

  const filteredRequests = useMemo(() => {
    return source.filter((request) => {
      if (filters.departmentIds.length > 0 && !filters.departmentIds.includes(request.departmentId)) {
        return false;
      }
      if (filters.utilityIds.length > 0 && !filters.utilityIds.includes(request.utilityId)) {
        return false;
      }
      if (filters.statuses.length > 0 && !filters.statuses.includes(request.status)) {
        return false;
      }
      if (filters.dateFrom && request.date < filters.dateFrom) {
        return false;
      }
      if (filters.dateTo && request.date > filters.dateTo) {
        return false;
      }
      if (debouncedSearch) {
        const q = debouncedSearch.toLowerCase();
        const utility = getUtilityById(request.utilityId);
        const matchesId = request.id.toLowerCase().includes(q);
        const matchesUtility = utility?.name.toLowerCase().includes(q) ?? false;
        const matchesDetails = request.details.toLowerCase().includes(q);
        if (!matchesId && !matchesUtility && !matchesDetails) return false;
      }
      return true;
    });
  }, [source, filters, debouncedSearch]);

  return {
    filters,
    setFilter: setFilters,
    resetFilters,
    filteredRequests,
  };
}
