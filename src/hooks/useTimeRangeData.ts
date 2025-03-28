import { useState, useCallback, useEffect, useMemo, useRef } from 'react';
import { useDataService } from './useDataService';
import { UsageStats, ChartDataPoint, TimeDistribution } from '@/src/types';

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
  const endDate = new Date(); // Base end date on current time
  let startDate = new Date();

  switch(range) {
    case 'D': // Last 24 hours
      startDate.setHours(endDate.getHours() - 24);
      break;
    case 'W': // Last 7 days
      // Ensure we get data for the current week precisely (Sunday to Saturday)
      // Get the current day of the week (0 = Sunday, 6 = Saturday)
      const dayOfWeek = endDate.getDay();
      // Set start date to the beginning of the current week (Sunday)
      startDate.setDate(endDate.getDate() - dayOfWeek);
      startDate.setHours(0, 0, 0, 0); // Start of Sunday
      
      // Set end date to the end of this week (Saturday)
      const daysToEnd = 6 - dayOfWeek; // Days until Saturday
      const weekEndDate = new Date(endDate);
      weekEndDate.setDate(endDate.getDate() + daysToEnd);
      weekEndDate.setHours(23, 59, 59, 999); // End of Saturday
      
      // Only use the calculated end date if it's in the future
      if (weekEndDate <= endDate) {
        // We're already past Saturday, so use current time as end
        endDate.setHours(23, 59, 59, 999); // End of today
      } else {
        // Use the end of Saturday as end date
        endDate.setTime(weekEndDate.getTime());
      }
      break;
    case 'M': // Last 30 days
      startDate.setDate(endDate.getDate() - 29); // Go back 29 days to include today (30 days total)
      startDate.setHours(0, 0, 0, 0); // Start of the first day
      endDate.setHours(23, 59, 59, 999); // End of today
      break;
    case 'Y': // Last 365 days (1 year)
      startDate.setFullYear(endDate.getFullYear() - 1);
      startDate.setDate(startDate.getDate() + 1); // Start exactly one year ago
      startDate.setHours(0, 0, 0, 0); // Start of the first day
      endDate.setHours(23, 59, 59, 999); // End of today
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

export function useTimeRangeData(initialRange: TimeRange = 'W') {
  // Use ref to prevent unnecessary re-renders when checking busy state
  const isFetchingRef = useRef(false);
  
  // Use the useDataService hook - get the whole object to avoid dependency issues
  const dataService = useDataService();

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
  // Now takes explicit arguments rather than implicitly using closure state
  const processData = useCallback((
    stats: UsageStats,
    weekly: ChartDataPoint[],
    monthly: ChartDataPoint[],
    range: TimeRange
  ): TimeRangeData => {
    console.log(`[useTimeRangeData] Processing data for range ${range}`);
    const averageValue = stats?.averageHitsPerDay || 0;
    const maxValue = stats?.peakDayHits || 0;
    const minValue = (stats?.lowestDayHits > 0 ? stats.lowestDayHits : 0) || 0;
    const hasData = stats?.totalHits > 0;

    let chartData: number[] = [];
    let chartLabels: string[] = [];
    let weekdayAvg = 0;
    let weekendAvg = 0;

    // Generate chart data based on time range
    switch(range) {
      case 'D':
        // Placeholder - Requires actual hourly data aggregation
        const hourLabels = Array.from({ length: 24 }, (_, i) => `${(new Date().getHours() - 23 + i + 24) % 24}:00`);
        chartData = Array(24).fill(0);
        chartLabels = hourLabels;
        break;

      case 'W':
        if (weekly && weekly.length > 0) {
          chartData = weekly.map(d => d.value);
          chartLabels = weekly.map(d => d.label);
        } else {
          const dayLabels = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((_, i, arr) => arr[(new Date().getDay() - 6 + i + 7) % 7]);
          chartData = Array(7).fill(0);
          chartLabels = dayLabels;
        }
        break;

      case 'M':
        // Placeholder - Requires actual daily data aggregation for the month
        const monthLabels = Array.from({ length: 30 }, (_, i) => `${new Date(Date.now() - (29 - i) * 86400000).getDate()}`);
        chartData = Array(30).fill(0);
        chartLabels = monthLabels;
        break;

      case 'Y':
        if (monthly && monthly.length > 0) {
          chartData = monthly.map(d => d.value);
          chartLabels = monthly.map(d => d.label);
        } else {
          const yearLabels = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'].map((_, i, arr) => arr[(new Date().getMonth() - 11 + i + 12) % 12]);
          chartData = Array(12).fill(0);
          chartLabels = yearLabels;
        }
        break;
    }

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
  // No dependencies since all data is passed as args
  }, []);

  // Function to fetch data based on the memoized date range
  // Now depends only on stable dates and the loadDataWithDateRange function
  const fetchDataForCurrentRange = useCallback(async (manualRefresh = false) => {
    if (isFetchingRef.current && !manualRefresh) {
      console.log('[useTimeRangeData] Already fetching data, skipping fetch.');
      return;
    }

    // Use local copies of dates to ensure stability if called rapidly
    const currentStartDate = startDate;
    const currentEndDate = endDate;
    
    // Format the date range for logging/debugging
    const formatDate = (date: Date) => date.toISOString().split('T')[0];
    console.log(`[useTimeRangeData] ${manualRefresh ? 'Refreshing' : 'Fetching'} data for range ${timeRange} (${formatDate(currentStartDate)} to ${formatDate(currentEndDate)})`);

    if (manualRefresh) {
      setIsRefreshing(true);
    } else {
      setIsLoading(true);
    }
    
    setError(null);
    isFetchingRef.current = true;

    try {
      // ONLY trigger database load - don't process data here
      await dataService.loadDataWithDateRange(currentStartDate, currentEndDate, manualRefresh);
      
      // Only handle errors from the fetch call
      if (dataService.error) {
        setError(dataService.error);
      }
    } catch (err) {
      console.error("[useTimeRangeData] Error triggering data fetch:", err);
      setError(err instanceof Error ? err.message : "An unknown error occurred during fetch trigger");
    } finally {
      isFetchingRef.current = false;
      // Don't reset loading/refreshing here, let the processing effect do it
    }
  // Stable dependencies: only the date range and timeRange for logging
  }, [dataService.loadDataWithDateRange, timeRange, startDate, endDate, dataService.error]);

  // Effect to *trigger* fetch when date range changes (i.e., timeRange changes)
  useEffect(() => {
    console.log(`[useTimeRangeData] Fetch Effect: Triggering fetch for ${timeRange}`);
    
    // Add more detailed logging for debugging weekly data
    if (timeRange === 'W') {
      const currentDay = new Date().getDay();
      const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
      console.log(`[useTimeRangeData] Current day is ${dayNames[currentDay]} (day ${currentDay})`);
      console.log(`[useTimeRangeData] Week range: ${startDate.toISOString().split('T')[0]} to ${endDate.toISOString().split('T')[0]}`);
    }
    
    fetchDataForCurrentRange(false); // Initial fetch for this time range

    // Cleanup function remains simple
    return () => {
      console.log('[useTimeRangeData] Cleaning up Fetch Effect');
    };
    // Depend *only* on the dates and the stable fetch function
  }, [startDate, endDate, fetchDataForCurrentRange, timeRange]);

  // SEPARATE Effect to PROCESS data when it changes in useDataService
  useEffect(() => {
    // Only process if the underlying service is NOT loading and we are not actively fetching
    if (!dataService.isLoading && !isFetchingRef.current) {
      console.log('[useTimeRangeData] Processing Effect: Data updated from useDataService.');
      const processed = processData(
        dataService.usageStats,
        dataService.weeklyData,
        dataService.monthlyData,
        timeRange
      );
      setData(processed);
      setError(dataService.error); // Update error state from service
      setIsLoading(false);       // Mark this hook as not loading
      setIsRefreshing(false);    // Mark this hook as not refreshing
    } else {
      console.log('[useTimeRangeData] Processing Effect: Skipped processing (service loading or fetch in progress)');
    }
  // Depend on the data coming FROM useDataService and the stable process function
  }, [
    dataService.usageStats,
    dataService.weeklyData,
    dataService.monthlyData,
    dataService.isLoading,
    dataService.error,
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