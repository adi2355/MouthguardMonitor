import { useState, useEffect, useCallback, useMemo } from 'react';
import { databaseManager } from '@/src/DatabaseManager';
import { DataState, ChartDataPoint, UsageStats, WeekdayStats } from '@/src/types';
import { dataChangeEmitter, dbEvents } from '../utils/EventEmitter';

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
  const [isRefreshing, setIsRefreshing] = useState(false); // New state for manual refresh

  // Memoize default date range to prevent recreating on each render
  const defaultDateRange = useMemo(() => {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setFullYear(startDate.getFullYear() - 1); // Default to last year
    return { startDate, endDate };
  }, []);

  // Helper function to ensure data is in the correct format
  const ensureChartDataFormat = (data: any[] | null | undefined): ChartDataPoint[] => {
    if (!data || data.length === 0) return [];
    
    // Check if data already has the right format (label and value properties)
    if (data[0].label !== undefined && data[0].value !== undefined) {
      return data as ChartDataPoint[];
    }
    
    // Otherwise, map to the right format
    return [];
  };
  
  // Function to load data with specific date range
  const loadDataWithDateRange = useCallback(async (startDate?: Date, endDate?: Date, isManualRefresh = false) => {
    const currentStartDate = startDate || defaultDateRange.startDate;
    const currentEndDate = endDate || defaultDateRange.endDate;
    
    // Format dates for database queries
    const startDateStr = currentStartDate.toISOString();
    const endDateStr = currentEndDate.toISOString();
    
    console.log(`[useDataService] ${isManualRefresh ? 'Refreshing' : 'Loading'} data with date range: ${startDateStr} to ${endDateStr}`);
    
    // Set appropriate loading state
    if (isManualRefresh) {
      setIsRefreshing(true);
    } else {
      setState(prev => ({ ...prev, isLoading: true, error: null }));
    }
    
    try {
      // Fetch data with date range
      console.log('[useDataService] Fetching weekly stats...');
      const weeklyStats = await databaseManager.getWeeklyStats(startDateStr, endDateStr);
      
      console.log('[useDataService] Fetching monthly stats...');
      const monthlyStats = await databaseManager.getMonthlyStats(startDateStr, endDateStr);
      
      console.log('[useDataService] Fetching usage stats...');
      const usageStats = await databaseManager.getUsageStats(startDateStr, endDateStr);
      
      console.log('[useDataService] Fetching time distribution...');
      const timeDistribution = await databaseManager.getTimeDistribution(startDateStr, endDateStr);
      
      // Collect any errors from the responses
      const errors: string[] = [];
      if (!weeklyStats.success) errors.push(`Weekly stats: ${weeklyStats.error}`);
      if (!monthlyStats.success) errors.push(`Monthly stats: ${monthlyStats.error}`);
      if (!usageStats.success) errors.push(`Usage stats: ${usageStats.error}`);
      if (!timeDistribution.success) errors.push(`Time distribution: ${timeDistribution.error}`);
      
      if (errors.length > 0) {
        const errorMessage = errors.join('; ');
        console.error('[useDataService] Data fetch errors:', errorMessage);
        setState(prev => ({
          ...prev,
          isLoading: false,
          error: errorMessage
        }));
        setIsRefreshing(false);
        return;
      }
      
      // Check if we actually have data in any of the datasets
      const hasUsageStats = usageStats.data && usageStats.data.totalHits > 0;
      // Check if weekly/monthly data has any non-zero values
      const hasWeeklyData = weeklyStats.data && weeklyStats.data.some((d: ChartDataPoint) => d.value > 0);
      const hasMonthlyData = monthlyStats.data && monthlyStats.data.some((d: ChartDataPoint) => d.value > 0);
      
      // Determine overall hasData based on any data existing
      const hasData = hasUsageStats || hasWeeklyData || hasMonthlyData;
      
      console.log(`[useDataService] Data fetch complete. Has data: ${hasData} (Usage: ${hasUsageStats}, Weekly: ${hasWeeklyData}, Monthly: ${hasMonthlyData})`);
      
      // Update state based on whether we have actual data or not
      setState({
        weeklyData: ensureChartDataFormat(weeklyStats.data),
        monthlyData: ensureChartDataFormat(monthlyStats.data),
        // Conditionally apply usageStats only if they contain data
        usageStats: hasUsageStats
                    ? (usageStats.data as UsageStats)
                    : DEFAULT_STATE.usageStats, // Use default if no usage stats
        // Conditionally apply timeDistribution only if there's any data
        timeDistribution: hasData
                        ? (timeDistribution.data || DEFAULT_STATE.timeDistribution)
                        : DEFAULT_STATE.timeDistribution,
        isLoading: false,
        error: null
      });
    } catch (error) {
      console.error('[useDataService] Unexpected error in loadData:', error);
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : 'An unexpected error occurred while fetching data'
      }));
    } finally {
      setIsRefreshing(false); // Always reset refreshing state
    }
  }, [defaultDateRange]);

  // Function for manual refresh
  const refreshData = useCallback(() => {
    return loadDataWithDateRange(defaultDateRange.startDate, defaultDateRange.endDate, true);
  }, [loadDataWithDateRange, defaultDateRange]);

  // Initial data load - only run once on mount
  useEffect(() => {
    console.log('[useDataService] Initial data load...');
    loadDataWithDateRange(defaultDateRange.startDate, defaultDateRange.endDate);
  }, [loadDataWithDateRange, defaultDateRange]); // Dependencies for ensuring it only runs when needed

  // Listen for database change events
  useEffect(() => {
    console.log('[useDataService] Setting up database change listener');
    
    const handleDataChange = () => {
      console.log('[useDataService] Database change detected, refreshing data...');
      refreshData();
    };
    
    dataChangeEmitter.on(dbEvents.DATA_CHANGED, handleDataChange);
    
    return () => {
      console.log('[useDataService] Cleaning up database change listener');
      dataChangeEmitter.off(dbEvents.DATA_CHANGED, handleDataChange);
    };
  }, [refreshData]);

  return {
    ...state,
    isRefreshing,
    refreshData,
    loadDataWithDateRange // Keep this for compatibility with existing code
  };
} 