import { useState, useEffect, useCallback } from 'react';
import { useBongHitsRepository } from '@/src/providers/AppProvider';
import { getCurrentWeekProgressRangeLocal } from '@/src/utils/timeUtils';
import { dataChangeEmitter, dbEvents } from '../utils/EventEmitter'; // Import emitter

export function useCurrentWeekData() {
  const [currentWeekAverage, setCurrentWeekAverage] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const bongHitsRepository = useBongHitsRepository();

  const fetchWeekData = useCallback(async (isFromEvent: boolean = false) => {
    // Prevent setting loading state if triggered by event and already loaded
    if (!isFromEvent) {
      setIsLoading(true);
    }
    console.log(`[useCurrentWeekData] Fetching average for current week... (Triggered by: ${isFromEvent ? 'event' : 'mount/refresh'})`);
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
      // Only set loading false if it wasn't triggered by an event after initial load
      if (!isFromEvent || isLoading) {
        setIsLoading(false);
      }
    }
  }, [bongHitsRepository, isLoading]); // Add isLoading to dependencies

  // Initial fetch on mount
  useEffect(() => {
    fetchWeekData(false);
    // Optional: Refetch periodically or based on other triggers
  }, [fetchWeekData]);

  // Add effect to listen for database changes
  useEffect(() => {
    const handleDataChange = () => {
      console.log('[useCurrentWeekData] Database change detected, refreshing weekly average...');
      // Pass true to indicate this fetch is triggered by an event
      fetchWeekData(true);
    };

    dataChangeEmitter.on(dbEvents.DATA_CHANGED, handleDataChange);
    console.log('[useCurrentWeekData] Added database change listener.');

    return () => {
      dataChangeEmitter.off(dbEvents.DATA_CHANGED, handleDataChange);
      console.log('[useCurrentWeekData] Removed database change listener.');
    };
    // Depend only on fetchWeekData which is stable due to useCallback
  }, [fetchWeekData]);

  return { currentWeekAverage, isLoading, error, refresh: () => fetchWeekData(false) }; // Ensure manual refresh sets loading
} 