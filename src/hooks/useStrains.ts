import { useState, useEffect, useCallback } from 'react';
import StrainService, { StrainSearchFilters } from '../services/StrainService';
import { Strain } from '../dbManager';

export interface UseStrainState {
  strains: Strain[];
  popularStrains: Strain[];
  categories: { [key: string]: number };
  isLoading: boolean;
  error: string | null;
  pagination: {
    total: number;
    currentPage: number;
    totalPages: number;
    hasMore: boolean;
  };
}

export interface UseStrainActions {
  searchStrains: (query: string, filters: StrainSearchFilters) => Promise<void>;
  loadMore: () => void;
  toggleFavorite: (strainId: number) => Promise<void>;
  isFavorite: (strainId: number) => boolean;
  clearSearch: () => void;
  getStrainDetails: (id: number) => Promise<Strain | null>;
  getRelatedStrains: (strain: Strain) => Promise<Strain[]>;
}

const INITIAL_STATE: UseStrainState = {
  strains: [],
  popularStrains: [],
  categories: {},
  isLoading: false,
  error: null,
  pagination: {
    total: 0,
    currentPage: 1,
    totalPages: 1,
    hasMore: false
  }
};

export function useStrains(): UseStrainState & UseStrainActions {
  const [state, setState] = useState<UseStrainState>(INITIAL_STATE);
  const [filters, setFilters] = useState<StrainSearchFilters>({});
  const [favoriteStrains, setFavoriteStrains] = useState<number[]>([]);

  // Load initial data
  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    try {
      setState(prev => ({ ...prev, isLoading: true }));
      
      const [popularStrains, categories] = await Promise.all([
        StrainService.getPopularStrains(),
        StrainService.getStrainCategories()
      ]);

      setState(prev => ({
        ...prev,
        popularStrains,
        categories,
        isLoading: false
      }));
    } catch (error) {
      setState(prev => ({
        ...prev,
        error: 'Failed to load initial data',
        isLoading: false
      }));
    }
  };

  const searchStrains = useCallback(async (
    query: string,
    newFilters: StrainSearchFilters = {},
    page: number = 1
  ) => {
    try {
      setState(prev => ({ ...prev, isLoading: true }));
      setFilters(newFilters);

      const result = await StrainService.searchStrains(query, newFilters, { page, limit: 10 });

      setState(prev => ({
        ...prev,
        strains: page === 1 ? result.data : [...prev.strains, ...result.data],
        pagination: {
          total: result.total,
          currentPage: result.currentPage,
          totalPages: result.totalPages,
          hasMore: result.hasMore
        },
        isLoading: false
      }));
    } catch (error) {
      setState(prev => ({
        ...prev,
        error: 'Search failed',
        isLoading: false
      }));
    }
  }, []);

  const loadMore = useCallback(() => {
    if (state.pagination.hasMore && !state.isLoading) {
      const nextPage = state.pagination.currentPage + 1;
      searchStrains('', filters, nextPage);
    }
  }, [state.pagination, state.isLoading, filters, searchStrains]);

  const toggleFavorite = useCallback(async (strainId: number) => {
    setFavoriteStrains(prev => {
      const isFavorited = prev.includes(strainId);
      return isFavorited 
        ? prev.filter(id => id !== strainId)
        : [...prev, strainId];
    });
  }, []);

  const isFavorite = useCallback((strainId: number) => {
    return favoriteStrains.includes(strainId);
  }, [favoriteStrains]);

  const clearSearch = useCallback(() => {
    setState(prev => ({
      ...prev,
      strains: [],
      pagination: {
        total: 0,
        currentPage: 1,
        totalPages: 1,
        hasMore: false
      }
    }));
  }, []);

  const getStrainDetails = useCallback(async (id: number): Promise<Strain | null> => {
    try {
      return await StrainService.getStrainById(id);
    } catch (error) {
      console.error('[useStrains] Error getting strain details:', error);
      return null;
    }
  }, []);

  const getRelatedStrains = useCallback(async (strain: Strain): Promise<Strain[]> => {
    try {
      return await StrainService.getRelatedStrains(strain);
    } catch (error) {
      console.error('[useStrains] Error getting related strains:', error);
      return [];
    }
  }, []);

  return {
    ...state,
    searchStrains,
    loadMore,
    toggleFavorite,
    isFavorite,
    clearSearch,
    getStrainDetails,
    getRelatedStrains
  };
} 