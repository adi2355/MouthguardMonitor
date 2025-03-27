import { useState, useEffect } from 'react';
import { DataService } from '@/src/services/DataService';
import { DataState, ChartDataPoint, UsageStats, WeekdayStats } from '@/src/types';

const DEFAULT_STATE: DataState = {
  weeklyData: [],
  monthlyData: [],
  usageStats: {
    averageHitsPerDay: 0,
    totalHits: 0,
    peakDayHits: 0,
    lowestDayHits: 0,
    averageDuration: 0,
    longestHit: 0,
    shortestHit: 0,
    mostActiveHour: 0,
    leastActiveHour: 0,
    totalDuration: 0,
    averageHitsPerHour: 0,
    consistency: 0,
    weekdayStats: {
      weekday: { avg: 0, total: 0 },
      weekend: { avg: 0, total: 0 }
    }
  },
  timeDistribution: {
    morning: 0,
    afternoon: 0,
    evening: 0,
    night: 0
  },
  isLoading: true,
  error: null
};

export function useDataService() {
  const [state, setState] = useState<DataState>(DEFAULT_STATE);

  useEffect(() => {
    let isMounted = true;
    const service = DataService.getInstance();

    const loadData = async () => {
      try {
        // Log for debugging
        console.log('[useDataService] Starting data fetch...');

        // Set initial loading state
        if (!isMounted) return;
        setState(prev => ({ ...prev, isLoading: true, error: null }));

        // Run timestamp diagnostic to check data range
        await service.checkTimestampRange();

        // Fetch data sequentially to avoid race conditions
        console.log('[useDataService] Fetching weekly stats...');
        const weeklyStats = await service.getWeeklyStats();
        if (!isMounted) return;
        console.log('[useDataService] Weekly stats:', weeklyStats);

        console.log('[useDataService] Fetching monthly stats...');
        const monthlyStats = await service.getMonthlyStats();
        if (!isMounted) return;
        console.log('[useDataService] Monthly stats:', monthlyStats);

        console.log('[useDataService] Fetching usage stats...');
        const usageStats = await service.getUsageStats();
        if (!isMounted) return;
        console.log('[useDataService] Usage stats:', usageStats);

        console.log('[useDataService] Fetching time distribution...');
        const timeDistribution = await service.getTimeDistribution();
        if (!isMounted) return;
        console.log('[useDataService] Time distribution:', timeDistribution);

        // Collect any errors from the responses
        const errors: string[] = [];
        if (!weeklyStats.success) errors.push(`Weekly stats: ${weeklyStats.error}`);
        if (!monthlyStats.success) errors.push(`Monthly stats: ${monthlyStats.error}`);
        if (!usageStats.success) errors.push(`Usage stats: ${usageStats.error}`);
        if (!timeDistribution.success) errors.push(`Time distribution: ${timeDistribution.error}`);

        if (errors.length > 0) {
          const errorMessage = errors.join('; ');
          console.error('[useDataService] Data fetch errors:', errorMessage);
          if (isMounted) {
            setState(prev => ({
              ...prev,
              isLoading: false,
              error: errorMessage
            }));
          }
          return;
        }

        // Update state only if all requests succeeded and component is mounted
        console.log('[useDataService] All data fetched successfully, updating state...');
        if (isMounted) {
          setState({
            ...DEFAULT_STATE,
            weeklyData: weeklyStats.data!,
            monthlyData: monthlyStats.data!,
            usageStats: {
              ...DEFAULT_STATE.usageStats,
              ...usageStats.data!
            },
            timeDistribution: timeDistribution.data!,
            isLoading: false,
            error: null
          });
        }
      } catch (error) {
        console.error('[useDataService] Unexpected error in loadData:', error);
        if (isMounted) {
          setState(prev => ({
            ...prev,
            isLoading: false,
            error: error instanceof Error ? error.message : 'An unexpected error occurred while fetching data'
          }));
        }
      }
    };

    loadData();

    return () => {
      console.log('[useDataService] Cleaning up...');
      isMounted = false;
      service.cleanup().catch(error => {
        console.error('[useDataService] Error during cleanup:', error);
      });
    };
  }, []); // Empty dependency array as we only want to run this once

  return state;
} 