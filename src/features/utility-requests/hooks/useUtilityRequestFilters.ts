import type { UtilityRequestFilters } from '@/types/index.js';
import { useUtilityRequestStore } from '@/store/utilityRequestStore.js';

interface UseUtilityRequestFiltersReturn {
  filters: UtilityRequestFilters;
  setFilter: (updates: Partial<UtilityRequestFilters>) => void;
  resetFilters: () => void;
}

/** Filtering (department/utility/status/date-range/search) is handled server-side via utilityRequestsApi.list. */
export function useUtilityRequestFilters(): UseUtilityRequestFiltersReturn {
  const filters = useUtilityRequestStore((s) => s.filters);
  const setFilters = useUtilityRequestStore((s) => s.setFilters);
  const resetFilters = useUtilityRequestStore((s) => s.resetFilters);

  return {
    filters,
    setFilter: setFilters,
    resetFilters,
  };
}
