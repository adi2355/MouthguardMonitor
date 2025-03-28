import { useState, useEffect, useCallback } from 'react';
import { useBongHitsRepository } from '@/src/providers/AppProvider';
import { getTodayRangeLocal } from '@/src/utils/timeUtils';

export function useDailyData() {
  const [hitsToday, setHitsToday] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const bongHitsRepository = useBongHitsRepository();

  const fetchDailyData = useCallback(async () => {
    console.log('[useDailyData] Fetching data for today...');
    setIsLoading(true);
    setError(null);
    try {
      const { startDate, endDate } = getTodayRangeLocal();
      // Use getHitCountForDateRange for consistency, though getHitsForDate works too
      const response = await bongHitsRepository.getHitCountForDateRange(startDate, endDate);

      if (response.success) {
        setHitsToday(response.data ?? 0);
        console.log(`[useDailyData] Today's hits: ${response.data}`);
      } else {
        setError(response.error ?? 'Failed to fetch daily data');
        setHitsToday(0);
        console.error(`[useDailyData] Error: ${response.error}`);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error fetching daily data';
      setError(message);
      setHitsToday(0);
      console.error(`[useDailyData] Exception: ${message}`);
    } finally {
      setIsLoading(false);
    }
  }, [bongHitsRepository]);

  useEffect(() => {
    fetchDailyData();
    // Optional: Set up an interval to refetch daily data periodically if needed
    // const intervalId = setInterval(fetchDailyData, 60 * 60 * 1000); // e.g., every hour
    // return () => clearInterval(intervalId);
  }, [fetchDailyData]);

  return { hitsToday, isLoading, error, refresh: fetchDailyData };
} 