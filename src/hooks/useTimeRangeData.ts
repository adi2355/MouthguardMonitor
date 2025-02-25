import { useState, useCallback, useEffect } from 'react';
import { useDataService } from './useDataService';

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

export function useTimeRangeData(initialRange: TimeRange = 'W') {
  const { weeklyData, monthlyData, usageStats, isLoading: isDataLoading, error: dataError } = useDataService();
  const [timeRange, setTimeRange] = useState<TimeRange>(initialRange);
  const [data, setData] = useState<TimeRangeData>({
    chartData: [],
    chartLabels: [],
    averageValue: 0,
    maxValue: 0,
    minValue: 0,
    weekdayAvg: 0,
    weekendAvg: 0
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Function to fetch data based on time range
  const fetchDataByTimeRange = useCallback(async (range: TimeRange) => {
    if (isDataLoading || dataError) return;
    const averageValue = usageStats.averageHitsPerDay;
    const maxValue = usageStats.peakDayHits; // Use the peak day value
    const minValue = usageStats.lowestDayHits > 0 ? usageStats.lowestDayHits : 0;
    setIsLoading(true);
    setError(null);
    
    try {
      // In a real implementation, this would call your data service
      // For now, we'll use the existing data and simulate different time ranges
      let chartData: number[] = [];
      let chartLabels: string[] = [];
      
      switch(range) {
        case 'D': // Daily (hours)
          // Simulate hourly data for today
          chartData = Array.from({ length: 24 }, () => Math.floor(Math.random() * 10));
          chartLabels = Array.from({ length: 24 }, (_, i) => `${i}:00`);
          break;
        case 'W': // Weekly (days)
          // Use the existing weekly data
          chartData = weeklyData.map(d => d.value);
          chartLabels = weeklyData.map(d => d.label);
          break;
        case 'M': // Monthly (days)
          // Simulate daily data for a month
          chartData = Array.from({ length: 30 }, () => Math.floor(Math.random() * 20));
          chartLabels = Array.from({ length: 30 }, (_, i) => `${i+1}`);
          break;
        case 'Y': // Yearly (months)
          // Use the existing monthly data
          chartData = monthlyData.map(d => d.value);
          chartLabels = monthlyData.map(d => d.label);
          break;
      }

      let weekdayAvg = usageStats.weekdayStats?.weekday.avg || 0;
      let weekendAvg = usageStats.weekdayStats?.weekend.avg || 0;
      
      if (range !== 'W') {
        // Simulate different stats for other time ranges
        weekdayAvg = averageValue * 0.9; // Slightly lower for weekdays
        weekendAvg = averageValue * 1.2; // Slightly higher for weekends
      }
      
      setData({
        chartData,
        chartLabels,
        averageValue,
        maxValue,
        minValue,
        weekdayAvg,
        weekendAvg
      });
    } catch (err) {
      console.error("Error fetching time range data:", err);
      setError(err instanceof Error ? err.message : "An unknown error occurred");
    } finally {
      setIsLoading(false);
    }
  }, [weeklyData, monthlyData, usageStats, isDataLoading, dataError]);

  // Update data when time range changes
  useEffect(() => {
    fetchDataByTimeRange(timeRange);
  }, [timeRange, fetchDataByTimeRange]);

  return {
    timeRange,
    setTimeRange,
    data,
    isLoading: isLoading || isDataLoading,
    error: error || dataError,
    fetchDataByTimeRange
  };
} 