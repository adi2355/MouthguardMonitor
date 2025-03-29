import { useState, useEffect, useCallback } from 'react';
import { useBongHitsRepository } from '@/src/providers/AppProvider';
import { ChartDataPoint, DatabaseResponse } from '@/src/types';
import {
    getTodayRangeLocal,
    getCurrentWeekProgressRangeLocal,
    getCurrentFullWeekRangeLocal 
} from '@/src/utils/timeUtils';
import { databaseManager } from '@/src/DatabaseManager'; // Import databaseManager

// Define the shape of the data we'll store for each time range
interface TimeRangeResult {
    average: number;
    chartData: ChartDataPoint[];
    // Add other stats if needed (max, min, etc.)
}

// Define the state structure for the hook
interface DailyAverageDataState {
    daily: TimeRangeResult | null;
    weekly: TimeRangeResult | null;
    monthly: TimeRangeResult | null;
    yearly: TimeRangeResult | null;
    isLoading: boolean;
    error: string | null;
}

const INITIAL_STATE: DailyAverageDataState = {
    daily: null,
    weekly: null,
    monthly: null,
    yearly: null,
    isLoading: true,
    error: null,
};

export function useDailyAverageData() {
    const [state, setState] = useState<DailyAverageDataState>(INITIAL_STATE);
    const bongHitsRepository = useBongHitsRepository();

    const fetchDataForAllRanges = useCallback(async () => {
        console.log('[useDailyAverageData] Fetching data for all ranges...');
        setState(prev => ({ ...prev, isLoading: true, error: null }));

        try {
            // --- Fetch Daily Data ---
            const todayRange = getTodayRangeLocal();
            const dailyHitsResponse = await bongHitsRepository.getHitCountForDateRange(todayRange.startDate, todayRange.endDate);
            const dailyAvgResponse = await bongHitsRepository.getAverageHitsPerDayForDateRange(todayRange.startDate, todayRange.endDate); // Avg over 1 day is just the count
            const dailyChartResponse = await bongHitsRepository.getHourlyAveragesForDay(todayRange.startDate, todayRange.endDate); // Hourly for 'D'

            // --- Fetch Weekly Data ---
            const weekRange = getCurrentWeekProgressRangeLocal(); // Use progress range for average
            const fullWeekRange = getCurrentFullWeekRangeLocal(); // Use full range for chart
            const weeklyAvgResponse = await bongHitsRepository.getAverageHitsForCurrentWeek(); // Use dedicated method
            const weeklyChartResponse = await databaseManager.getWeeklyStats(fullWeekRange.startDate.toISOString(), fullWeekRange.endDate.toISOString()); // Fetch week chart data

            // --- Fetch Monthly Data ---
            const now = new Date();
            const monthStartDate = new Date(now.getFullYear(), now.getMonth(), 1);
            const monthEndDate = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
            const monthlyAvgResponse = await bongHitsRepository.getAverageHitsPerDayForDateRange(monthStartDate, monthEndDate);
            const monthlyChartResponse = await bongHitsRepository.getHitsByDayOfMonth(monthStartDate, monthEndDate); // Daily breakdown for 'M'

            // --- Fetch Yearly Data ---
            const yearEndDate = new Date();
            const yearStartDate = new Date();
            yearStartDate.setFullYear(yearEndDate.getFullYear() - 1);
            yearStartDate.setDate(yearStartDate.getDate() + 1); // Start exactly one year ago
            yearStartDate.setHours(0, 0, 0, 0);
            const yearlyAvgResponse = await bongHitsRepository.getAverageHitsPerDayForDateRange(yearStartDate, yearEndDate);
            const yearlyChartResponse = await databaseManager.getMonthlyStats(yearStartDate.toISOString(), yearEndDate.toISOString()); // Monthly breakdown for 'Y'

            // --- Consolidate Results ---
            const newState: DailyAverageDataState = {
                daily: {
                    average: dailyAvgResponse.success ? (dailyAvgResponse.data ?? 0) : 0,
                    chartData: dailyChartResponse.success ? (dailyChartResponse.data ?? []) : [],
                },
                weekly: {
                    average: weeklyAvgResponse.success ? (weeklyAvgResponse.data ?? 0) : 0,
                    chartData: weeklyChartResponse.success ? (weeklyChartResponse.data ?? []) : [],
                },
                monthly: {
                    average: monthlyAvgResponse.success ? (monthlyAvgResponse.data ?? 0) : 0,
                    chartData: monthlyChartResponse.success ? (monthlyChartResponse.data ?? []) : [],
                },
                yearly: {
                    average: yearlyAvgResponse.success ? (yearlyAvgResponse.data ?? 0) : 0,
                    chartData: yearlyChartResponse.success ? (yearlyChartResponse.data ?? []) : [],
                },
                isLoading: false,
                error: null, // Reset error on successful fetch
            };

            // Check for any errors during fetch
            const errors = [
                dailyHitsResponse.error, dailyAvgResponse.error, dailyChartResponse.error,
                weeklyAvgResponse.error, weeklyChartResponse.error,
                monthlyAvgResponse.error, monthlyChartResponse.error,
                yearlyAvgResponse.error, yearlyChartResponse.error
            ].filter(Boolean);

            if (errors.length > 0) {
                newState.error = `Failed to fetch some data: ${errors.join(', ')}`;
                console.error("[useDailyAverageData] Fetch errors:", errors);
            }

            setState(newState);
            console.log('[useDailyAverageData] Fetched and processed data for all ranges.');

        } catch (err) {
            console.error('[useDailyAverageData] Critical error fetching all data:', err);
            setState({
                ...INITIAL_STATE,
                isLoading: false,
                error: err instanceof Error ? err.message : 'An unknown error occurred',
            });
        }
    }, [bongHitsRepository]); // Include repository in dependencies

    // Fetch data on mount
    useEffect(() => {
        fetchDataForAllRanges();
    }, [fetchDataForAllRanges]); // Run effect when the fetch function itself changes (which it shouldn't after first render)

    // Provide a refresh function
    const refreshData = useCallback(() => {
        fetchDataForAllRanges();
    }, [fetchDataForAllRanges]);

    return { ...state, refreshData };
} 