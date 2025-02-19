import { Text, ScrollView, StyleSheet, View, Dimensions, Platform, Pressable, TouchableOpacity, ActivityIndicator } from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { SQLiteDatabase, openDatabaseAsync } from "expo-sqlite";
import { useState, useEffect, useMemo } from "react";
import { AverageHourCount, BongHitStats, Datapoint } from "@/src/types";
import { BONG_HITS_DATABASE_NAME, dayLookUpTable } from "@/src/constants";
import { Card } from "@/components/Card";
import AntDesign from "@expo/vector-icons/AntDesign";
import { Link, useRouter } from "expo-router";
import { LineChart, BarChart } from "react-native-chart-kit";
import { LinearGradient } from "expo-linear-gradient";
import { MaterialCommunityIcons, Ionicons } from "@expo/vector-icons";
import { DailyAverageCard } from "@/components/DailyAverageCard";
import WeeklyUsageBanner from "@/components/WeeklyUsageBanner";
import AsyncStorage from "@react-native-async-storage/async-storage";

const windowWidth = Dimensions.get("window").width;

const monthlyDataFake = {
  labels: ["January", "February", "March", "April", "May", "June"],
  datasets: [
    {
      data: [20, 45, 28, 80, 99, 43],
      color: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
      strokeWidth: 3,
    },
  ],
  legend: ["Hits Recorded"],
};

const weeklyDataFake = {
  labels: ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"],
  datasets: [
    {
      data: [9, 4, 2, 0, 15, 4, 10],
      color: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
      strokeWidth: 3,
    },
  ],
  legend: ["Hits Recorded"],
};

// Helper for consistent typography
const typography = {
  largeTitle: {
    fontSize: 34,
    fontWeight: Platform.select({ ios: "700", android: "bold" }),
    letterSpacing: Platform.select({ ios: 0.41, android: 0.25 }),
  },
  title1: {
    fontSize: 28,
    fontWeight: Platform.select({ ios: "600", android: "bold" }),
    letterSpacing: Platform.select({ ios: 0.34, android: 0.25 }),
  },
  title2: {
    fontSize: 22,
    fontWeight: Platform.select({ ios: "600", android: "bold" }),
    letterSpacing: Platform.select({ ios: 0.35, android: 0.25 }),
  },
  title3: {
    fontSize: 17,
    fontWeight: Platform.select({ ios: "600", android: "bold" }),
    letterSpacing: Platform.select({ ios: -0.41, android: 0.25 }),
  },
  body: {
    fontSize: 15,
    fontWeight: "400",
    letterSpacing: Platform.select({ ios: -0.24, android: 0.25 }),
  },
  caption1: {
    fontSize: 13,
    fontWeight: "400",
    letterSpacing: Platform.select({ ios: -0.08, android: 0.25 }),
  },
};

const colors = {
  systemBlue: "#007AFF",
  systemRed: "#FF3B30",
  systemYellow: "#FFE94D",
  systemGray: {
    1: "#8E8E93",
    2: "#AEAEB2",
    3: "#C7C7CC",
    4: "#D1D1D6",
    5: "#E5E5EA",
    6: "#F2F2F7",
  },
  label: {
    primary: "#000000",
    secondary: "#666666",
    tertiary: "#8E8E93",
  },
  background: {
    primary: "#FFFFFF",
    secondary: "#F2F2F7",
    tertiary: "#FFFFFF",
  },
  gradient: {
    start: "#FFB6A3",
    middle: "#85D8CE",
    end: "#FFFFFF",
  },
};

// Raw data interface for mini chart
interface RawChartData {
  timestamp: string;
  value: number;
}

// Add interfaces for type safety
interface DatabaseResult<T> {
  rows?: {
    _array?: T[];
  };
}

interface HitCount {
  day: string;
  hit_count: number;
}

// Add database initialization constants and functions
const FIRST_LAUNCH_KEY = 'app_first_launch';
const DB_VERSION_KEY = 'db_version';
const CURRENT_DB_VERSION = '1.0';

const initializeDatabase = async () => {
  try {
    const db = await openDatabaseAsync(BONG_HITS_DATABASE_NAME);
    
    // Create tables if they don't exist
    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS ${BONG_HITS_DATABASE_NAME} (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
        duration_ms INTEGER NOT NULL,
        intensity INTEGER DEFAULT 0,
        notes TEXT
      );
      
      CREATE INDEX IF NOT EXISTS idx_timestamp 
      ON ${BONG_HITS_DATABASE_NAME}(timestamp);
    `);

    // Store database version
    await AsyncStorage.setItem(DB_VERSION_KEY, CURRENT_DB_VERSION);
    
    console.log('Database initialized successfully');
    return true;
  } catch (error) {
    console.error('Error initializing database:', error);
    return false;
  }
};

export const initializeAppOnFirstLaunch = async () => {
  try {
    // Check if this is first launch
    const hasLaunched = await AsyncStorage.getItem(FIRST_LAUNCH_KEY);
    if (hasLaunched) {
      return;
    }

    // Initialize database on first launch
    const success = await initializeDatabase();
    if (!success) {
      throw new Error('Database initialization failed');
    }

    // Mark first launch complete
    await AsyncStorage.setItem(FIRST_LAUNCH_KEY, 'true');
    console.log('App initialized successfully on first launch');
  } catch (error) {
    console.error('Error in initializeAppOnFirstLaunch:', error);
    throw error;
  }
};

// Add data validation helpers
const validateDatapoint = (point: any): Datapoint => ({
  label: String(point?.label || ""),
  value: Number(point?.value || 0)
});

const processWeeklyData = (weekData: Datapoint[], lastWeekAvg: number) => {
  if (!Array.isArray(weekData) || weekData.length === 0) {
    return { average: 0, change: 0 };
  }
  
  const total = weekData.reduce((sum, day) => sum + (day?.value || 0), 0);
  const average = Math.round(total / 7);
  return { 
    average, 
    change: calculatePercentageChange(average, lastWeekAvg) 
  };
};

// Keep the properly defined version outside the component
const getDailyAverageDatapoints = async () => {
  try {
    const db = await openDatabaseAsync(BONG_HITS_DATABASE_NAME);
    const avgHourCount = await db.getAllAsync(`
      SELECT strftime('%H', timestamp) AS hourOfDay, 
             COUNT(*) AS count
      FROM ${BONG_HITS_DATABASE_NAME}
      WHERE timestamp >= date('now', '-7 days')
      GROUP BY hourOfDay
      ORDER BY hourOfDay
    `);

    if (!avgHourCount?.length) return null;

    // Fill missing hours with proper validation
    const allHours = Array.from({ length: 24 }, (_, i) => 
      i.toString().padStart(2, "0")
    );
    
    const dataMap = new Map(
      avgHourCount.map(row => [
        String(row.hourOfDay || ''),
        Number(row.count || 0)
      ])
    );

    const processedData = allHours.map(hour => ({
      hourOfDay: hour,
      count: dataMap.get(hour) || 0
    }));

    return {
      labels: ["12am", "6am", "12pm", "6pm", "12am"],
      datasets: [{
        data: processedData.map(item => item.count),
        color: (opacity = 1) => `rgba(0, 122, 255, ${opacity})`,
        strokeWidth: 2,
      }],
      legend: ["Average daily hits"]
    };
  } catch (e) {
    console.error("Error in getDailyAverageDatapoints:", e);
    return null;
  }
};

const fetchMiniChartData = async () => {
  try {
    const db = await openDatabaseAsync(BONG_HITS_DATABASE_NAME);
    const results = await db.getAllAsync(`
      SELECT duration_ms AS value,
             timestamp
      FROM ${BONG_HITS_DATABASE_NAME}
      WHERE timestamp >= date('now', '-7 days')
      ORDER BY timestamp DESC
      LIMIT 10
    `);

    return results.map(row => ({
      timestamp: String(row.timestamp || ''),
      value: Number(row.value || 0)
    }));
  } catch (e) {
    console.error("Error fetching mini chart data:", e);
    return [];
  }
};

const getBongHitStatsFromPastWeek = async () => {
  try {
    const db = await openDatabaseAsync(BONG_HITS_DATABASE_NAME);
    const [avgResults, maxResults] = await Promise.all([
      db.getAllAsync(`
        SELECT AVG(duration_ms) AS avg_duration
        FROM ${BONG_HITS_DATABASE_NAME}
        WHERE timestamp >= date('now', '-7 days')
      `),
      db.getAllAsync(`
        SELECT MAX(duration_ms) AS max_duration
        FROM ${BONG_HITS_DATABASE_NAME}
        WHERE timestamp >= date('now', '-7 days')
      `)
    ]);

    if (!avgResults?.[0] || !maxResults?.[0]) return null;

    return {
      averageDuration: Number(avgResults[0].avg_duration || 0),
      longestHit: Number(maxResults[0].max_duration || 0)
    };
  } catch (e) {
    console.error("Error in getBongHitStatsFromPastWeek:", e);
    return null;
  }
};

// Update calculatePercentageChange to use passed parameters
const calculatePercentageChange = (currentAvg: number, lastWeekAvg: number): number => {
  if (!lastWeekAvg) return 0;
  return Math.round(((currentAvg - lastWeekAvg) / lastWeekAvg) * 100);
};

// Add helper function for data validation
const validateHitCount = (row: any): HitCount => ({
  day: String(row?.day || ''),
  hit_count: Number(row?.hit_count || 0)
});

// Add helper function for safe number parsing
const safeParseInt = (value: any, fallback = 0): number => {
  const parsed = parseInt(String(value || ''), 10);
  return isNaN(parsed) ? fallback : parsed;
};

// Update WeeklyOverview component with chart config
const WeeklyOverview = ({ weeklyHitsBarGraphProps }: { weeklyHitsBarGraphProps: Datapoint[] }) => {
  // Base chart config
  const baseChartConfig = useMemo(() => ({
    backgroundColor: "#ffffff",
    backgroundGradientFrom: "#ffffff",
    backgroundGradientTo: "#ffffff",
    decimalPlaces: 0,
    color: (opacity = 1) => `rgba(0, 122, 255, ${opacity})`,
    labelColor: (opacity = 0.8) => `rgba(128, 128, 128, ${opacity})`,
    barPercentage: 0.7,
    useShadowColorFromDataset: false,
    withInnerLines: false,
    withVerticalLabels: true,
    withHorizontalLabels: true,
    withVerticalLines: false,
    withHorizontalLines: true,
    propsForBackgroundLines: {
      stroke: "#e3e3e3",
      strokeWidth: 1,
    },
    propsForDots: {
      r: "4",
      strokeWidth: "2",
      stroke: "#007AFF",
    },
    style: {
      borderRadius: 16,
    }
  }), []);

  // Memoize the chart width calculation
  const chartWidth = useMemo(() => Math.max(windowWidth - 64, 200), [windowWidth]);

  // Memoize the complete chart config
  const memoizedChartConfig = useMemo(() => ({
    ...baseChartConfig,
    style: {
      ...baseChartConfig.style,
      width: chartWidth,
    },
  }), [baseChartConfig, chartWidth]);

  // Memoize the data transformation
  const chartData = useMemo(() => ({
    labels: weeklyHitsBarGraphProps.map((d) => d.label),
    datasets: [{ 
      data: weeklyHitsBarGraphProps.map((d) => d.value),
      color: (opacity = 1) => `rgba(0, 122, 255, ${opacity})`
    }]
  }), [weeklyHitsBarGraphProps]);

  if (!weeklyHitsBarGraphProps?.length) {
    return (
      <Card style={styles.card}>
        <View style={styles.cardHeader}>
          <MaterialCommunityIcons name="calendar-week" size={24} color="#007AFF" />
          <Text style={styles.cardTitle}>Weekly Overview</Text>
        </View>
        <View style={styles.chartContainer}>
          <Text style={styles.noDataText}>No data available</Text>
        </View>
      </Card>
    );
  }

  return (
    <Card style={styles.card}>
      <View style={styles.cardHeader}>
        <MaterialCommunityIcons name="calendar-week" size={24} color="#007AFF" />
        <Text style={styles.cardTitle}>Weekly Overview</Text>
      </View>
      <Text style={styles.cardDescription}>Compare your usage across different days</Text>
      <View style={styles.chartContainer}>
        <BarChart
          data={chartData}
          width={chartWidth}
          height={180}
          chartConfig={memoizedChartConfig}
          style={styles.chart}
          showValuesOnTopOfBars
          fromZero
          segments={4}
          flatColor={true}
          withCustomBarColorFromData={true}
        />
      </View>
    </Card>
  );
};

// Add memoized MonthlyOverview component
const MonthlyOverview = ({ weeklyHitsBarGraphProps }: { weeklyHitsBarGraphProps: Datapoint[] }) => {
  // Memoize the chart width calculation
  const chartWidth = useMemo(() => Math.max(windowWidth - 48, 200), [windowWidth]);
  
  // Base chart config with additional optimizations
  const baseChartConfig = useMemo(() => ({
    backgroundColor: "#ffffff",
    backgroundGradientFrom: "#ffffff",
    backgroundGradientTo: "#ffffff",
    decimalPlaces: 0,
    color: (opacity = 1) => `rgba(0, 122, 255, ${opacity})`,
    labelColor: (opacity = 0.8) => `rgba(128, 128, 128, ${opacity})`,
    barPercentage: 0.7,
    useShadowColorFromDataset: false,
    withInnerLines: false,
    withVerticalLabels: true,
    withHorizontalLabels: true,
    withVerticalLines: false,
    withHorizontalLines: true,
    propsForBackgroundLines: {
      stroke: "#e3e3e3",
      strokeWidth: 1,
    },
    propsForDots: {
      r: "4",
      strokeWidth: "2",
      stroke: "#007AFF",
    },
    style: {
      borderRadius: 16,
      width: chartWidth,
    },
    // Add these optimizations
    formatYLabel: (value: string) => Math.round(Number(value)).toString(),
    formatXLabel: (label: string) => label.substring(0, 3),
    segments: 4,
  }), [chartWidth]);

  // Memoize the chart data transformation
  const chartData = useMemo(() => ({
    labels: monthlyDataFake.labels.map(label => label.substring(0, 3)),
    datasets: [{
      data: monthlyDataFake.datasets[0].data,
      color: (opacity = 1) => `rgba(0, 122, 255, ${opacity})`,
      strokeWidth: 2,
    }],
  }), []); // Empty dependency array since monthlyDataFake is constant

  if (!weeklyHitsBarGraphProps?.length) {
    return (
      <Card style={styles.card}>
        <View style={styles.cardHeader}>
          <MaterialCommunityIcons name="calendar-month" size={24} color="#007AFF" />
          <Text style={styles.cardTitle}>Monthly Overview</Text>
        </View>
        <View style={styles.chartContainer}>
          <Text style={styles.noDataText}>No data available</Text>
        </View>
      </Card>
    );
  }

  return (
    <Card style={styles.card}>
      <View style={styles.cardHeader}>
        <MaterialCommunityIcons name="calendar-month" size={24} color="#007AFF" />
        <Text style={styles.cardTitle}>Monthly Overview</Text>
      </View>
      <Text style={styles.cardDescription}>Track your monthly trends</Text>
      <View style={styles.chartContainer}>
        <LineChart
          data={chartData}
          width={chartWidth}
          height={220}
          chartConfig={baseChartConfig}
          bezier
          style={styles.chart}
          withDots={true}
          withShadow={false}
          segments={4}
          fromZero
          withVerticalLines={false}
          withHorizontalLines={true}
          withVerticalLabels={true}
          withHorizontalLabels={true}
          hidePointsAtIndex={[]}
          renderDotContent={({ x, y, index }) => (
            <Text
              key={index}
              style={{
                position: 'absolute',
                top: y - 20,
                left: x - 10,
                fontSize: 10,
                color: colors.label.secondary,
              }}
            >
              {chartData.datasets[0].data[index]}
            </Text>
          )}
        />
      </View>
    </Card>
  );
};

export default function MyData() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [weeklyHitsBarGraphProps, setWeeklyHitsBarGraphProps] = useState<Datapoint[]>([]);
  const [dailyStatsOverview, setDailyStatsOverview] = useState<Object>();
  const [bongHitStats, setBongHitStats] = useState<BongHitStats>();
  const [weeklyAverage, setWeeklyAverage] = useState<number>(0);
  const [percentageChange, setPercentageChange] = useState<number>(0);
  const [miniChartData, setMiniChartData] = useState<RawChartData[]>([]);
  const [isScrolling, setIsScrolling] = useState(false);

  /* ------------------------------------------------------------------
   * Data-fetching helpers using getAllAsync
   * ------------------------------------------------------------------ */

  /**
   * Fetch a small set of data to show in a "mini chart."
   */
  const fetchMiniChartData = async () => {
    try {
      const db = await openDatabaseAsync(BONG_HITS_DATABASE_NAME);
      const results = await db.getAllAsync(`
        SELECT 
          duration_ms AS value,
          timestamp
        FROM ${BONG_HITS_DATABASE_NAME}
        WHERE timestamp >= date('now', '-7 days')
        ORDER BY timestamp DESC
        LIMIT 10
      `);

      const rows = results?.length ? results : [];
      setMiniChartData(rows); // This array matches your RawChartData interface
    } catch (e) {
      console.error("Error fetching mini chart data:", e);
      throw e;
    }
  };

  /**
   * Retrieve average & max durations for the last 7 days.
   */
  const getBongHitStatsFromPastWeek = async () => {
    try {
      const db = await openDatabaseAsync(BONG_HITS_DATABASE_NAME);
      const [avgResults, maxResults] = await Promise.all([
        db.getAllAsync(`
          SELECT AVG(duration_ms) AS avg_duration
          FROM ${BONG_HITS_DATABASE_NAME}
          WHERE timestamp >= date('now', '-7 days')
        `),
        db.getAllAsync(`
          SELECT MAX(duration_ms) AS max_duration
          FROM ${BONG_HITS_DATABASE_NAME}
          WHERE timestamp >= date('now', '-7 days')
        `)
      ]);

      const avgRow = avgResults?.[0]?._array?.[0];
      const maxRow = maxResults?.[0]?._array?.[0];

      const stats: BongHitStats = {
        longestHit: maxRow?.max_duration || 0,
        averageDuration: avgRow?.avg_duration || 0,
      };

      setBongHitStats(stats);
      return stats;
    } catch (e) {
      console.error("Error in getBongHitStatsFromPastWeek:", e);
      throw e;
    }
  };

  /**
   * Compare with the previous week's total hits to see how usage changed.
   */
  const calculatePercentageChange = (currentAvg: number, lastWeekAvg: number): number => {
    if (!lastWeekAvg) return 0;
    return Math.round(((currentAvg - lastWeekAvg) / lastWeekAvg) * 100);
  };

  /**
   * Orchestrate data loading on component mount.
   */
  useEffect(() => {
    let mounted = true;
    let timeoutId: NodeJS.Timeout;
    let db: SQLiteDatabase | null = null;

    const loadData = async () => {
      try {
        setIsLoading(true);
        setError(null);

        // Check database version before proceeding
        const dbVersion = await AsyncStorage.getItem(DB_VERSION_KEY);
        if (dbVersion !== CURRENT_DB_VERSION) {
          await initializeDatabase();
        }

        // Create new DB connection
        db = await openDatabaseAsync(BONG_HITS_DATABASE_NAME);
        
        // First verify we have data
        const checkData = await db.getAllAsync(`
          SELECT COUNT(*) as count 
          FROM ${BONG_HITS_DATABASE_NAME}
        `);
        console.log("Database record count:", checkData[0]?.count);

        // Get weekly data without the 7 day filter first to see all data
        const weekData = await db.getAllAsync(`
          SELECT strftime('%w', timestamp) AS day,
             COUNT(*) AS hit_count
          FROM ${BONG_HITS_DATABASE_NAME}
          GROUP BY day
          ORDER BY day
        `);
        
        console.log("Weekly data raw:", weekData);
        
        if (!mounted) return;

        // Initialize array for all days of the week
        const processedWeekData = Array.from({ length: 7 }, (_, i) => ({
          label: dayLookUpTable.get(i) || "",
          value: 0
        }));

        // Fill in actual data
        weekData.forEach(row => {
          const dayIndex = safeParseInt(row.day);
          if (dayIndex >= 0 && dayIndex < 7) {
            processedWeekData[dayIndex].value = Number(row.hit_count || 0);
          }
        });

        console.log("Processed week data:", processedWeekData);
        
        setWeeklyHitsBarGraphProps(processedWeekData);
        
        const total = processedWeekData.reduce((sum, day) => sum + day.value, 0);
        const average = Math.round(total / 7);
        
        // Get last week's data for comparison
        const lastWeekResults = await db.getAllAsync(`
          SELECT COUNT(*) AS hit_count
          FROM ${BONG_HITS_DATABASE_NAME}
          WHERE timestamp >= date('now', '-14 days')
            AND timestamp < date('now', '-7 days')
        `);
        
        const lastWeekAvg = Math.round((lastWeekResults[0]?.hit_count || 0) / 7);
        const change = calculatePercentageChange(average, lastWeekAvg);
        
        setWeeklyAverage(average);
        setPercentageChange(change);

        // Get daily data with proper validation
        const dailyStats = await getDailyAverageDatapoints();
        if (mounted && dailyStats) {
          setDailyStatsOverview(dailyStats);
        }

        // Get remaining data in parallel
        const [bongStats, miniData] = await Promise.all([
          getBongHitStatsFromPastWeek(),
          fetchMiniChartData()
        ]);

        if (!mounted) return;

        if (bongStats) setBongHitStats(bongStats);
        if (miniData?.length > 0) setMiniChartData(miniData);

      } catch (err) {
        console.error("Error in loadData:", err);
        if (mounted) {
          setError("Failed to load data");
        }
      } finally {
        if (mounted) {
          setIsLoading(false);
        }
        // Close database connection with delay to ensure queries complete
        if (db) {
          timeoutId = setTimeout(() => {
            if (db) {
              db.closeAsync().catch(err => 
                console.error("Error closing database:", err)
              );
              db = null;
            }
          }, 100);
        }
      }
    };

    loadData();

    // Cleanup function
    return () => {
      mounted = false;
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
      // Ensure database is closed on unmount
      if (db) {
        db.closeAsync().catch(err => 
          console.error("Error closing database on unmount:", err)
        );
        db = null;
      }
    };
  }, []);

  // Add garbage collection effect
  useEffect(() => {
    // Force garbage collection when component unmounts
    return () => {
      if (Platform.OS === 'android') {
        if (global.gc) global.gc();
      }
    };
  }, []);

  /* ------------------------------------------------------------------
   * Render helper functions
   * ------------------------------------------------------------------ */

  const renderWeeklyUsageBanner = () => {
    if (isLoading) {
      return (
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading data...</Text>
        </View>
      );
    }

    if (!weeklyHitsBarGraphProps?.length) {
      console.log("No weekly data available:", weeklyHitsBarGraphProps);
      return (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>No data available</Text>
        </View>
      );
    }

    const bannerProps = {
      weeklyData: weeklyHitsBarGraphProps,
      average: weeklyAverage || 0,
      percentageChange: percentageChange || 0,
    };

    console.log("Rendering WeeklyUsageBanner with props:", bannerProps);

    try {
      return (
        <WeeklyUsageBanner
          {...bannerProps}
          onPress={() => router.push("/dataOverviews/weeklyAverage")}
        />
      );
    } catch (error) {
      console.error("Error rendering WeeklyUsageBanner:", error);
      return (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Error displaying weekly data</Text>
        </View>
      );
    }
  };

  // Memoize the weekly chart component instance
  const weeklyOverview = useMemo(() => (
    <WeeklyOverview weeklyHitsBarGraphProps={weeklyHitsBarGraphProps} />
  ), [weeklyHitsBarGraphProps]);

  // Memoize the monthly chart component instance
  const monthlyOverview = useMemo(() => (
    <MonthlyOverview weeklyHitsBarGraphProps={weeklyHitsBarGraphProps} />
  ), [weeklyHitsBarGraphProps]);

  // Memoize placeholder component
  const placeholderCard = useMemo(() => (
    <View style={[styles.card, styles.placeholderCard]}>
      <View style={styles.cardHeader}>
        <MaterialCommunityIcons name="calendar-week" size={24} color="#007AFF" />
        <View style={styles.placeholderTitle} />
      </View>
      <View style={styles.chartContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    </View>
  ), []);

  const renderNotificationBanner = () => {
    return (
      <View style={styles.notificationBanner}>
        <View style={styles.notificationHeader}>
          <View style={styles.notificationTitle}>
            <MaterialCommunityIcons name="bell-outline" size={16} color="#000" />
            <Text style={styles.notificationTitleText}>Daily Summary</Text>
          </View>
          <View style={styles.notificationTime}>
            <Text style={styles.timeText}>Last 24 hours</Text>
            <TouchableOpacity style={styles.dismissButtonContainer}>
              <Text style={styles.dismissButton}>Dismiss</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.notificationContent}>
          <MaterialCommunityIcons
            name="clock-outline"
            size={32}
            color="#000"
            style={styles.earIcon}
          />
          <View style={styles.notificationTextContainer}>
            <Text style={styles.notificationMainText}>
              {`Average of ${weeklyAverage} hits per day`}
            </Text>
            <Text style={styles.notificationSubText}>
              Your daily average has increased compared to last week
            </Text>
            <TouchableOpacity>
              <Text style={styles.moreDetailsLink}>More Details</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaProvider>
      <ScrollView 
        style={styles.container}
        removeClippedSubviews={true}
        maxToRenderPerBatch={2}
        windowSize={3}
        updateCellsBatchingPeriod={50}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.contentContainer}
        scrollEventThrottle={16}
        bounces={false}
        overScrollMode="never"
        maintainVisibleContentPosition={{
          minIndexForVisible: 0,
          autoscrollToTopThreshold: 10,
        }}
        keyboardShouldPersistTaps="handled"
        onScrollBeginDrag={() => setIsScrolling(true)}
        onScrollEndDrag={() => setIsScrolling(false)}
        onMomentumScrollEnd={() => setIsScrolling(false)}
      >
        <LinearGradient
          colors={[colors.gradient.start, colors.gradient.middle, colors.gradient.end]}
          locations={[0, 0.2, 0.4]}
          start={{ x: 1, y: 0 }}
          end={{ x: 0, y: 1 }}
          style={styles.gradientBackground}
        />

        {/* Header */}
        <View style={styles.headerContainer}>
          <Text style={styles.headerTitle}>Summary</Text>
          <View style={styles.profilePic} />
        </View>

        {/* Notification Banner */}
        <View style={styles.notificationBanner}>{renderNotificationBanner()}</View>

        {/* Example "Medical ID" Card */}
        <View style={styles.medicalIdCard}>
          {/* ... or your actual MedicalIDCard component ... */}
        </View>

        {/* Data Content */}
        {isLoading ? (
          <View style={styles.loadingContainer}>
            <Text style={styles.loadingText}>Loading data...</Text>
          </View>
        ) : error ? (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : (
          <>
            <DailyAverageCard
              data={weeklyHitsBarGraphProps}
              averageHits={weeklyAverage}
              onPress={() => router.push("/dataOverviews/dailyAverageOverview")}
            />
            {renderWeeklyUsageBanner()}
            {isScrolling ? placeholderCard : weeklyOverview}
            {isScrolling ? placeholderCard : monthlyOverview}
          </>
        )}

        {/* Time Range Selector */}
        <Card style={[styles.card, styles.timeRangeCard]}>
          <View style={styles.timeRangeContent}>
            <Text style={styles.cardTitle}>Pick Time Range</Text>
            <AntDesign name="calendar" size={24} color="black" />
          </View>
        </Card>
      </ScrollView>
    </SafeAreaProvider>
  );
}

/* ------------------------------------------------------------------
 * Styles
 * ------------------------------------------------------------------ */
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.primary,
  },
  contentContainer: {
    paddingBottom: 32,
    // Remove paddingHorizontal if not needed
  },
  gradientBackground: {
    position: "absolute",
    left: 0,
    right: 0,
    top: 0,
    height: "35%",
    zIndex: 0,
  },
  headerContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingTop: 52,
    paddingBottom: 20,
    zIndex: 2,
  },
  headerTitle: {
    ...typography.largeTitle,
    color: "#000000",
  },
  profilePic: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#ddd",
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.1)",
  },
  card: {
    backgroundColor: colors.background.primary,
    marginHorizontal: 16,
    marginVertical: 8,
    borderRadius: 12,
    padding: 16,
    shadowColor: colors.label.primary,
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  cardTitle: {
    ...typography.title3,
    color: colors.label.primary,
    marginLeft: 10,
  },
  cardDescription: {
    ...typography.body,
    color: colors.label.secondary,
    marginTop: 4,
    marginBottom: 16,
    lineHeight: 20,
  },
  chartContainer: {
    marginTop: 16,
    alignItems: "center",
    paddingHorizontal: 8,
  },
  chart: {
    marginVertical: 8,
    borderRadius: 16,
  },
  timeRangeCard: {
    marginBottom: 16,
  },
  timeRangeContent: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
  },
  notificationBanner: {
    backgroundColor: "#FFE94D",
    marginHorizontal: 16,
    marginVertical: 8,
    borderRadius: 12,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  notificationHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  notificationTitle: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  notificationTitleText: {
    ...typography.caption1,
    fontWeight: "600",
    letterSpacing: 0.5,
    textTransform: "uppercase",
  },
  notificationTime: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  timeText: {
    ...typography.caption1,
    color: colors.label.secondary,
  },
  dismissButtonContainer: {
    marginLeft: 8,
    padding: 2,
  },
  dismissButton: {
    fontSize: 14,
    color: "#666",
    fontWeight: "400",
  },
  notificationContent: {
    flexDirection: "row",
    marginBottom: 16,
  },
  earIcon: {
    marginRight: 12,
  },
  notificationTextContainer: {
    flex: 1,
  },
  notificationMainText: {
    ...typography.title3,
    color: colors.label.primary,
    marginBottom: 4,
  },
  notificationSubText: {
    ...typography.body,
    color: colors.label.secondary,
    marginBottom: 4,
    lineHeight: 20,
  },
  moreDetailsLink: {
    ...typography.body,
    color: colors.systemBlue,
  },
  loadingContainer: {
    padding: 20,
    alignItems: "center",
    backgroundColor: "white",
    borderRadius: 12,
    margin: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  loadingText: {
    fontSize: 16,
    color: "#8E8E93",
  },
  errorContainer: {
    backgroundColor: "#fff",
    padding: 16,
    marginHorizontal: 16,
    marginVertical: 8,
    borderRadius: 12,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  errorText: {
    fontSize: 16,
    color: "#666",
    textAlign: "center",
  },
  noDataText: {
    fontSize: 16,
    color: "#666",
  },
  medicalIdCard: {
    backgroundColor: colors.background.primary,
    marginHorizontal: 16,
    marginVertical: 8,
    borderRadius: 12,
    padding: 16,
    shadowColor: colors.label.primary,
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  placeholderCard: {
    minHeight: 250,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background.secondary,
  },
  placeholderTitle: {
    width: 120,
    height: 20,
    backgroundColor: colors.systemGray[4],
    borderRadius: 4,
    marginLeft: 10,
  },
});

