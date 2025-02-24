import { StrainSearchFilters } from '../services/StrainService';

export const hasActiveFilters = (filters: StrainSearchFilters): boolean => {
  return !!(
    filters.geneticType ||
    (filters.effects && filters.effects.length > 0) ||
    filters.minTHC ||
    filters.maxTHC ||
    (filters.sort && filters.sort !== 'rating')
  );
}; 