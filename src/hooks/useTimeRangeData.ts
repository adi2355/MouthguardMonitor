import { useState, useCallback, useEffect, useMemo, useRef } from 'react';
import { useDataService } from './useDataService';
import { UsageStats, ChartDataPoint, TimeDistribution } from '@/src/types';
import { useBongHitsRepository } from '@/src/providers/AppProvider';

export type TimeRange = 'D' | 'W' | 'M' | 'Y';

interface TimeRangeData {
  chartData: number[];
  chartLabels: string[];
  averageValue: number;
  maxValue: number;
  minValue: number;
  weekdayAvg?: number;
  weekendAvg?: number;
}

// Helper function to get date range based on time range selection
// This MUST be a pure function or memoized correctly.
function calculateDateRangeForTimeRange(range: TimeRange): { startDate: Date, endDate: Date } {
  const now = new Date(); // Base end date on current time
  let startDate = new Date();
  let endDate = new Date();

  switch(range) {
    case 'D': // Today only - calendar day
      startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0); // Start of today
      endDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999); // End of today
      break;
    case 'W': // Week - Sunday to Saturday
      // Get the current day of the week (0 = Sunday, 6 = Saturday)
      const dayOfWeek = now.getDay();
      // Set start date to the beginning of the current week (Sunday)
      startDate.setDate(now.getDate() - dayOfWeek);
      startDate.setHours(0, 0, 0, 0); // Start of Sunday
      
      // Set end date to the end of this week (Saturday)
      const daysToEnd = 6 - dayOfWeek; // Days until Saturday
      const weekEndDate = new Date(now);
      weekEndDate.setDate(now.getDate() + daysToEnd);
      weekEndDate.setHours(23, 59, 59, 999); // End of Saturday
      
      // Only use the calculated end date if it's in the future
      if (weekEndDate <= now) {
        // We're already past Saturday, so use current time as end
        endDate.setHours(23, 59, 59, 999); // End of today
      } else {
        // Use the end of Saturday as end date
        endDate.setTime(weekEndDate.getTime());
      }
      break;
    case 'M': // Current calendar month
      startDate = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0); // First day of month
      // Last day of month (0th day of next month is last day of current month)
      endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
      break;
    case 'Y': // Last 365 days (1 year)
      endDate = new Date();
      endDate.setHours(23, 59, 59, 999); // End of today
      startDate = new Date();
      startDate.setFullYear(endDate.getFullYear() - 1);
      startDate.setDate(startDate.getDate() + 1); // Start exactly one year ago
      startDate.setHours(0, 0, 0, 0); // Start of the first day
      break;
  }

  // Format dates to ISO strings for consistent logging
  const startIso = startDate.toISOString();
  const endIso = endDate.toISOString();
  console.log(`[calculateDateRange] Range: ${range}, Start: ${startIso}, End: ${endIso}`);
  
  return { startDate, endDate };
}

const DEFAULT_TIMERANGE_DATA: TimeRangeData = {
  chartData: [],
  chartLabels: [],
  averageValue: 0,
  maxValue: 0,
  minValue: 0,
  weekdayAvg: 0,
  weekendAvg: 0
};

// Helper function to calculate statistics from chart data
function calculateStats(data: number[]): { avg: number; max: number; min: number } {
  if (!data || data.length === 0) {
    return { avg: 0, max: 0, min: 0 };
  }

  const sum = data.reduce((acc, value) => acc + value, 0);
  const avg = sum / data.length;
  const max = Math.max(...data);
  
  // For min, filter out zeros if other values exist
  const nonZeroValues = data.filter(value => value > 0);
  const min = nonZeroValues.length > 0 
    ? Math.min(...nonZeroValues) 
    : 0;

  return {
    avg,
    max,
    min
  };
}

export function useTimeRangeData(initialRange: TimeRange = 'W') {
  // Use ref to prevent unnecessary re-renders when checking busy state
  const isFetchingRef = useRef(false);
  
  // Use the useDataService hook - get the whole object to avoid dependency issues
  const dataService = useDataService();
  
  // Get the BongHitsRepository instance for direct data access
  const bongHitsRepository = useBongHitsRepository();

  const [timeRange, setTimeRange] = useState<TimeRange>(initialRange);

  // --- Memoize the date range calculation ---
  // This is crucial. Calculate start/end dates based *only* on the timeRange state.
  const { startDate, endDate } = useMemo(() => {
    console.log(`[useTimeRangeData] Recalculating date range for ${timeRange}`);
    return calculateDateRangeForTimeRange(timeRange);
    // Recalculate ONLY when timeRange changes
  }, [timeRange]);

  const [data, setData] = useState<TimeRangeData>(DEFAULT_TIMERANGE_DATA);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Function to process and format the data after it's been loaded
  const processData = useCallback((
    stats: UsageStats,
    weekly: ChartDataPoint[],
    monthly: ChartDataPoint[],
    range: TimeRange,
    directData?: ChartDataPoint[] // New parameter for direct repository data
  ): TimeRangeData => {
    console.log(`[useTimeRangeData] Processing data for range ${range}`);
    
    let chartData: number[] = [];
    let chartLabels: string[] = [];
    let weekdayAvg = 0;
    let weekendAvg = 0;
    let calculatedStats = { avg: 0, max: 0, min: 0 };
    
    // Generate chart data based on time range
    switch(range) {
      case 'D':
        // Use directly fetched data if available
        if (directData && directData.length > 0) {
          chartData = directData.map(d => d.value);
          chartLabels = directData.map(d => d.label);
          calculatedStats = calculateStats(chartData);
        } else {
          // Fallback to placeholder if no data
          const hourLabels = Array.from({ length: 24 }, (_, i) => `${(new Date().getHours() - 23 + i + 24) % 24}:00`);
          chartData = Array(24).fill(0);
          chartLabels = hourLabels;
        }
        break;

      case 'W':
        if (weekly && weekly.length > 0) {
          chartData = weekly.map(d => d.value);
          chartLabels = weekly.map(d => d.label);
          calculatedStats = calculateStats(chartData);
        } else {
          const dayLabels = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((_, i, arr) => arr[(new Date().getDay() - 6 + i + 7) % 7]);
          chartData = Array(7).fill(0);
          chartLabels = dayLabels;
        }
        break;

      case 'M':
        // Use directly fetched data if available
        if (directData && directData.length > 0) {
          chartData = directData.map(d => d.value);
          chartLabels = directData.map(d => d.label);
          calculatedStats = calculateStats(chartData);
        } else {
          // Fallback to placeholder if no data
          const monthLabels = Array.from({ length: 30 }, (_, i) => `${new Date(Date.now() - (29 - i) * 86400000).getDate()}`);
          chartData = Array(30).fill(0);
          chartLabels = monthLabels;
        }
        break;

      case 'Y':
        if (monthly && monthly.length > 0) {
          chartData = monthly.map(d => d.value);
          chartLabels = monthly.map(d => d.label);
          calculatedStats = calculateStats(chartData);
        } else {
          const yearLabels = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'].map((_, i, arr) => arr[(new Date().getMonth() - 11 + i + 12) % 12]);
          chartData = Array(12).fill(0);
          chartLabels = yearLabels;
        }
        break;
    }

    // Determine if we have data
    const hasData = (stats?.totalHits > 0 || chartData.some(value => value > 0));

    // Use global stats from dataService if available, otherwise use calculated stats
    const averageValue = hasData && stats?.averageHitsPerDay 
      ? stats.averageHitsPerDay 
      : calculatedStats.avg;
      
    const maxValue = hasData && stats?.peakDayHits 
      ? stats.peakDayHits
      : calculatedStats.max;
      
    const minValue = hasData && stats?.lowestDayHits
      ? stats.lowestDayHits 
      : calculatedStats.min;
    
    if (hasData && stats?.weekdayStats) {
      weekdayAvg = stats.weekdayStats.weekday?.avg || 0;
      weekendAvg = stats.weekdayStats.weekend?.avg || 0;
    }

    return {
      chartData,
      chartLabels,
      averageValue: hasData ? averageValue : 0,
      maxValue: hasData ? maxValue : 0,
      minValue: hasData ? minValue : 0,
      weekdayAvg,
      weekendAvg
    };
  }, []);

  // State to hold directly fetched data
  const [directData, setDirectData] = useState<ChartDataPoint[] | undefined>(undefined);

  // Function to fetch data based on the memoized date range
  // Refactored to only fetch, not process data
  const fetchDataForCurrentRange = useCallback(async (manualRefresh = false) => {
    if (isFetchingRef.current && !manualRefresh) {
      console.log('[useTimeRangeData] Already fetching data, skipping fetch.');
      return;
    }

    // Use local copies of dates to ensure stability if called rapidly
    const currentStartDate = startDate;
    const currentEndDate = endDate;
    const currentRange = timeRange; // Capture the current range
    
    // Format the date range for logging/debugging
    const formatDate = (date: Date) => date.toISOString().split('T')[0];
    console.log(`[useTimeRangeData] ${manualRefresh ? 'Refreshing' : 'Fetching'} data for range ${currentRange} (${formatDate(currentStartDate)} to ${formatDate(currentEndDate)})`);

    if (manualRefresh) {
      setIsRefreshing(true);
    } else {
      setIsLoading(true);
    }
    
    setError(null);
    isFetchingRef.current = true;

    try {
      let directResult: ChartDataPoint[] | undefined = undefined;
      
      // For day and month ranges, fetch data directly from the repository
      if (currentRange === 'D') {
        const hourlyResponse = await bongHitsRepository.getHourlyAveragesForDay(currentStartDate, currentEndDate);
        if (hourlyResponse.success && hourlyResponse.data) {
          directResult = hourlyResponse.data;
        } else if (hourlyResponse.error) {
          setError(hourlyResponse.error);
        }
      } else if (currentRange === 'M') {
        const dailyResponse = await bongHitsRepository.getHitsByDayOfMonth(currentStartDate, currentEndDate);
        if (dailyResponse.success && dailyResponse.data) {
          directResult = dailyResponse.data;
        } else if (dailyResponse.error) {
          setError(dailyResponse.error);
        }
      }
      
      // Store directData in state for the processing effect to use
      setDirectData(directResult);
      
      // Still trigger dataService load for stats and other ranges
      await dataService.loadDataWithDateRange(currentStartDate, currentEndDate, manualRefresh);
      
      // Only handle errors from the fetch call if not already set
      if (dataService.error && !error) {
        setError(dataService.error);
      }
    } catch (err) {
      console.error("[useTimeRangeData] Error triggering data fetch:", err);
      setError(err instanceof Error ? err.message : "An unknown error occurred during fetch trigger");
    } finally {
      isFetchingRef.current = false;
      // Don't reset loading states here - the processing effect will do that
    }
  }, [
    startDate, 
    endDate, 
    timeRange,
    // Only include stable method references, not the entire objects
    bongHitsRepository.getHourlyAveragesForDay, 
    bongHitsRepository.getHitsByDayOfMonth,
    dataService.loadDataWithDateRange
  ]);

  // Effect to *trigger* fetch when date range changes (i.e., timeRange changes)
  useEffect(() => {
    console.log(`[useTimeRangeData] Date Range Effect: Trigger fetch for ${timeRange}`);
    
    // Add a cancel flag to prevent state updates after unmount
    let isCancelled = false;
    
    // Trigger fetch
    fetchDataForCurrentRange(false).then(() => {
      if (isCancelled) {
        console.log('[useTimeRangeData] Fetch completed but component unmounted, skipping updates');
      }
    });
    
    // Cleanup function
    return () => {
      isCancelled = true;
      console.log('[useTimeRangeData] Cleanup fetch effect');
    };
  }, [fetchDataForCurrentRange]);

  // SEPARATE Effect to PROCESS data when it changes
  useEffect(() => {
    // Only process if the underlying service is NOT loading and we are not actively fetching
    if (!dataService.isLoading && !isFetchingRef.current) {
      console.log('[useTimeRangeData] Processing Effect: Handling data updated from services');
      
      const processed = processData(
        dataService.usageStats,
        dataService.weeklyData,
        dataService.monthlyData,
        timeRange,
        directData
      );
      
      setData(processed);
      setError(dataService.error); // Update error state from service
      setIsLoading(false);       // Mark this hook as not loading
      setIsRefreshing(false);    // Mark this hook as not refreshing
    }
  }, [
    // Dependencies for processing effect
    dataService.usageStats,
    dataService.weeklyData,
    dataService.monthlyData,
    dataService.isLoading,
    dataService.error,
    directData,
    timeRange,
    processData
  ]);

  // Function for manual refresh - stable
  const refreshTimeRangeData = useCallback(() => {
    console.log(`[useTimeRangeData] Manual refresh called for range ${timeRange}`);
    return fetchDataForCurrentRange(true);
  }, [fetchDataForCurrentRange, timeRange]);

  return {
    timeRange,
    setTimeRange,
    data,
    // isLoading should reflect if *either* hook is loading initially
    isLoading: isLoading || (dataService.isLoading && !isRefreshing),
    isRefreshing,
    error,
    refreshTimeRangeData
  };
} 