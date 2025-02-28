// Core data types
export interface BongHit {
    id?: number;
    timestamp: string;
    duration_ms: number;
    intensity?: number;
    notes?: string;
}

export interface BongHitStats {
    averageDuration: number;
    longestHit: number;
    totalHits?: number;
}

export interface DailyStats {
    date: string;
    hitCount: number;
    averageDuration: number;
}

export interface AverageHourCount {
    count: number;
    hourOfDay: string;
}

export interface Datapoint {
    x: string | number;
    y: number;
}

// Chart-specific types
export interface ChartDataPoint {
    label: string;
    value: number;
}

export interface ChartDataset {
    data: number[];
    color: (opacity?: number) => string;
    strokeWidth: number;
}

export interface ChartData {
    labels: string[];
    datasets: ChartDataset[];
    legend?: string[];
}

// Database types
export interface DatabaseRow {
    timestamp?: string;
    duration_ms?: number;
    day?: string;
    month?: string;
    hour?: string;
    hit_count?: number;
    count?: number;
    avg_duration?: number;
    max_duration?: number;
    total_hits?: number;
    avg_hits_per_day?: number;
    avg_duration_per_day?: number;
    daily_hits?: number;
    days_with_data?: number;
    weekday_avg?: number;
    weekday_total?: number;
    weekend_avg?: number;
    weekend_total?: number;
    peak_day_hits?: number;
    lowest_day_hits?: number;
    most_active_hour?: number;
    least_active_hour?: number;
    total_duration?: number;
    avg_hits_per_hour?: number;
    hits_std_dev?: number;
    // Fields from time distribution query
    morning?: number;
    afternoon?: number;
    evening?: number;
    night?: number;
    // Fields from usage stats query
    average_hits_per_day?: number;
    shortest_hit?: number;
    longest_hit?: number;
    consistency?: number;
}

export interface UsageStats {
    // Hit counts
    averageHitsPerDay: number;
    totalHits: number;
    peakDayHits: number;
    lowestDayHits: number;
    
    // Duration stats
    averageDuration: number;  // in ms
    longestHit: number;      // in ms
    shortestHit: number;     // in ms
    
    // Time patterns
    mostActiveHour: number;  // 0-23
    leastActiveHour: number; // 0-23
    
    // Derived metrics
    totalDuration: number;   // total time in ms
    averageHitsPerHour: number;
    consistency: number;     // standard deviation of daily hits

    // Weekday vs Weekend stats
    weekdayStats: WeekdayStats;
}

// Add new interfaces for time distribution
export interface TimeDistribution {
    morning: number;
    afternoon: number;
    evening: number;
    night: number;
}

export interface WeekdayStats {
    weekday: { avg: number; total: number; };
    weekend: { avg: number; total: number; };
}

// Component Props interfaces
export interface WeeklyChartProps {
    data: ChartDataPoint[];
    onPress?: () => void;
}

export interface MonthlyChartProps {
    data: ChartDataPoint[];
    onPress?: () => void;
}

export interface NotificationProps {
    averageHits: number;
    percentageChange: number;
    onDismiss: () => void;
}

export interface DailyAverageCardProps {
    data: ChartDataPoint[];
    averageHits: number;
    onPress?: () => void;
}

export interface WeeklyUsageBannerProps {
    weeklyData: ChartDataPoint[];
    average: number;
    percentageChange: number;
    onPress?: () => void;
}

// API Response types
export interface DatabaseResponse<T> {
    success: boolean;
    data?: T;
    error?: string;
}

export interface UsageAnalytics {
    dailyAverage: number;
    weeklyAverage: number;
    percentageChange: number;
    lastUpdated: string;
}

export interface SavedDevice {
    id: string;
    name: string;
}

// State management types
export interface DataState {
    weeklyData: ChartDataPoint[];
    monthlyData: ChartDataPoint[];
    usageStats: UsageStats;
    timeDistribution: TimeDistribution;
    isLoading: boolean;
    error: string | null;
}