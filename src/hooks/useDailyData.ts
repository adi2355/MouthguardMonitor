import { useState, useEffect, useCallback } from 'react';
import { useBongHitsRepository } from '@/src/providers/AppProvider';
import { getTodayRangeLocal } from '@/src/utils/timeUtils';
import { dataChangeEmitter, dbEvents } from '../utils/EventEmitter'; // Import emitter

export function useDailyData() {
  const [hitsToday, setHitsToday] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const bongHitsRepository = useBongHitsRepository();

  const fetchDailyData = useCallback(async (isFromEvent: boolean = false) => {
    // Prevent setting loading state if triggered by event and already loaded
    if (!isFromEvent) {
      setIsLoading(true);
    }
    console.log(`[useDailyData] Fetching data for today... (Triggered by: ${isFromEvent ? 'event' : 'mount/refresh'})`);
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
      // Only set loading false if it wasn't triggered by an event after initial load
      if (!isFromEvent || isLoading) {
        setIsLoading(false);
      }
    }
  }, [bongHitsRepository, isLoading]); // Add isLoading to dependencies

  // Initial fetch on mount
  useEffect(() => {
    fetchDailyData(false);
    // Optional: Set up an interval to refetch daily data periodically if needed
    // const intervalId = setInterval(fetchDailyData, 60 * 60 * 1000); // e.g., every hour
    // return () => clearInterval(intervalId);
  }, [fetchDailyData]);

  // Add effect to listen for database changes
  useEffect(() => {
    const handleDataChange = () => {
      console.log('[useDailyData] Database change detected, refreshing daily data...');
      // Pass true to indicate this fetch is triggered by an event
      fetchDailyData(true);
    };

    dataChangeEmitter.on(dbEvents.DATA_CHANGED, handleDataChange);
    console.log('[useDailyData] Added database change listener.');

    return () => {
      dataChangeEmitter.off(dbEvents.DATA_CHANGED, handleDataChange);
      console.log('[useDailyData] Removed database change listener.');
    };
    // Depend only on fetchDailyData which is stable due to useCallback
  }, [fetchDailyData]);

  return { hitsToday, isLoading, error, refresh: () => fetchDailyData(false) }; // Ensure manual refresh sets loading
} 