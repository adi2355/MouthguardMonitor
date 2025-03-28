import { useState, useEffect, useCallback } from 'react';
import { useBongHitsRepository } from '@/src/providers/AppProvider';
import { getCurrentWeekProgressRangeLocal } from '@/src/utils/timeUtils';

export function useCurrentWeekData() {
  const [currentWeekAverage, setCurrentWeekAverage] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const bongHitsRepository = useBongHitsRepository();

  const fetchWeekData = useCallback(async () => {
    console.log('[useCurrentWeekData] Fetching average for current week...');
    setIsLoading(true);
    setError(null);
    try {
      // Use the specific repository method for current week average
      const response = await bongHitsRepository.getAverageHitsForCurrentWeek();

      if (response.success) {
        setCurrentWeekAverage(response.data ?? 0);
        console.log(`[useCurrentWeekData] Current week average: ${response.data}`);
      } else {
        setError(response.error ?? 'Failed to fetch weekly average');
        setCurrentWeekAverage(0);
        console.error(`[useCurrentWeekData] Error: ${response.error}`);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error fetching weekly data';
      setError(message);
      setCurrentWeekAverage(0);
      console.error(`[useCurrentWeekData] Exception: ${message}`);
    } finally {
      setIsLoading(false);
    }
  }, [bongHitsRepository]);

  useEffect(() => {
    fetchWeekData();
    // Optional: Refetch periodically or based on other triggers
  }, [fetchWeekData]);

  return { currentWeekAverage, isLoading, error, refresh: fetchWeekData };
} 