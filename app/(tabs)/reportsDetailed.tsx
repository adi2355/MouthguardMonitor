import React, { useState, useEffect, useCallback, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ViewStyle, ActivityIndicator, Dimensions, Platform, Animated } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { COLORS, DEVICE_ID_SIM } from '@/src/constants';
import { useSensorDataRepository } from '@/src/providers/AppProvider';
import { dataChangeEmitter, dbEvents } from '@/src/utils/EventEmitter';
import { MotionPacket, FSRPacket, HRMPacket, HTMPacket, ImpactEvent, ChartData } from '@/src/types';
import { debounce } from 'lodash';

// Import the chart components
import LineChart from '../components/charts/LineChart';
import BarChart from '../components/charts/BarChart';

// Import new data processing utilities
import { 
  processHrmForChart, 
  processTempForChart, 
  processFsrForChart, 
  processMotionForChart, 
  processImpactsForCharts 
} from '@/src/utils/dataProcessing';

// Import our new visualization components
import HeartRateTrendChart from '../components/charts/HeartRateTrendChart';
import ScrollableHeartRateChart from '../components/charts/ScrollableHeartRateChart';
import TemperatureStabilityGraph from '../components/charts/TemperatureStabilityGraph';
import BiteForceDynamicsChart from '../components/charts/BiteForceDynamicsChart';
import MotionOverviewGraph from '../components/charts/MotionOverviewGraph';
import ConcussionRiskGauge from '../components/charts/ConcussionRiskGauge';
import ImpactTimelineGraph from '../components/charts/ImpactTimelineGraph';
import SeverityDistributionGraph from '../components/charts/SeverityDistributionGraph';
import CumulativeExposureGraph from '../components/charts/CumulativeExposureGraph';

// Safe wrapper for LineChart that ensures proper dataset format
const SafeLineChart = ({ 
  data, 
  emptyMessage = "No data available", 
  ...props 
}: {
  data: any; 
  emptyMessage?: string;
  [key: string]: any;
}) => {
  // First check if data exists at all
  if (!data) {
    return <Text style={styles.emptyChartText}>{emptyMessage}</Text>;
  }

  // Check if datasets array exists and is valid
  if (!data.datasets || !Array.isArray(data.datasets) || data.datasets.length === 0) {
    return <Text style={styles.emptyChartText}>{emptyMessage}</Text>;
  }

  // Check if any dataset has actual data to display
  const hasActualData = data.datasets.some((ds: any) => {
    // Guard against undefined or null dataset
    if (!ds) return false;
    // Guard against missing data array
    if (!ds.data || !Array.isArray(ds.data)) return false;
    // Check if there's at least one valid data point
    return ds.data.length > 0 && ds.data.some((val: any) => val !== null && val !== undefined);
  });

  // If no actual data was found, show empty message
  if (!hasActualData) {
    return <Text style={styles.emptyChartText}>{emptyMessage}</Text>;
  }

  // Create a safe data structure with properly formatted datasets
  const safeData = {
    labels: Array.isArray(data.labels) ? data.labels : [],
    datasets: data.datasets.map((dataset: any, index: number) => {
      // Handle null/undefined dataset
      if (!dataset) {
        return {
          data: [],
          color: () => 'rgba(0, 176, 118, 1)',
          strokeWidth: 2,
          index
        };
      }
      
      return {
        data: Array.isArray(dataset.data) ? dataset.data.map((val: any) => 
          typeof val === 'number' && !isNaN(val) ? val : 0
        ) : [],
        color: typeof dataset.color === 'function' ? dataset.color : () => 'rgba(0, 176, 118, 1)',
        strokeWidth: typeof dataset.strokeWidth === 'number' ? dataset.strokeWidth : 2,
        index
      };
    }),
    legend: data.legend
  };

  // Extract only the supported props to avoid type errors
  const { width, height, bezier, style, chartConfig } = props;

  return (
    <LineChart 
      data={safeData}
      width={width}
      height={height}
      bezier={bezier}
      style={style}
      chartConfig={chartConfig || {
        backgroundColor: 'transparent',
        backgroundGradientFrom: 'transparent',
        backgroundGradientTo: 'transparent',
        fillShadowGradientFrom: typeof safeData.datasets[0]?.color === 'function' ? 
          safeData.datasets[0].color(0.8) : 'rgba(0, 176, 118, 0.8)',
        fillShadowGradientTo: 'rgba(255, 255, 255, 0)',
        decimalPlaces: 0,
        color: (opacity = 1) => typeof safeData.datasets[0]?.color === 'function' ? 
          safeData.datasets[0].color(opacity) : `rgba(0, 176, 118, ${opacity})`,
        labelColor: (opacity = 1) => `rgba(80, 80, 80, ${opacity})`,
        propsForBackgroundLines: {
          strokeDasharray: '4, 4',
          strokeWidth: 0.5,
          stroke: 'rgba(0, 0, 0, 0.05)',
        },
      }}
    />
  );
};

// Enhanced GlassCard component with improved styling
const GlassCard = ({ 
  style, 
  children, 
  intensity = 15 
}: {
  style?: any;
  children: React.ReactNode;
  intensity?: number;
}) => {
  // Use BlurView on iOS for true glass effect, fallback for Android
  if (Platform.OS === 'ios') {
    return (
      <View style={[styles.cardContainer, style]}>
        <BlurView intensity={intensity} tint="light" style={styles.blurView}>
          <View style={styles.cardContent}>
            {children}
          </View>
        </BlurView>
      </View>
    );
  }
  
  // Fallback for Android with enhanced styling
  return (
    <View style={[styles.cardContainer, styles.cardAndroid, style]}>
      <View style={styles.cardContent}>
        {children}
      </View>
    </View>
  );
};

export default function ReportsDetailedScreen() {
  const sensorDataRepository = useSensorDataRepository();

  // Animation values
  const fadeAnim = React.useRef(new Animated.Value(0)).current;

  // State for raw data (only when needed for specialized visualization)
  const [impacts, setImpacts] = useState<any[]>([]);

  // State for processed chart data
  const [hrmChartData, setHrmChartData] = useState<ChartData | null>(null);
  const [tempChartData, setTempChartData] = useState<ChartData | null>(null);
  const [biteForceChartData, setBiteForceChartData] = useState<ChartData | null>(null);
  const [motionChartData, setMotionChartData] = useState<ChartData | null>(null);
  const [impactTimelineData, setImpactTimelineData] = useState<ChartData | null>(null);
  const [severityDistData, setSeverityDistData] = useState<{ labels: string[], data: number[] } | null>(null);
  const [chieData, setChieData] = useState<ChartData | null>(null);
  
  // State for calculated session stats/KPIs
  const [sessionStats, setSessionStats] = useState<{
    avgHr?: number | null;
    minHr?: number | null;
    maxHr?: number | null;
    avgTemp?: number | null;
    maxTemp?: number | null;
    currentTemp?: number | null;
    avgBiteLeft?: number | null;
    avgBiteRight?: number | null;
    avgBiteTotal?: number | null;
    maxBiteForce?: number | null;
    peakAccel?: number | null;
    totalImpacts?: number | null;
    highImpacts?: number | null;
    maxG?: number | null;
    concussionRisk?: 'Low' | 'Moderate' | 'High' | 'Critical' | null;
  } | null>(null);

  // Loading and error states
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const deviceId = DEVICE_ID_SIM;

  const getRiskStyle = (risk: any) => {
    switch (risk?.toLowerCase()) {
      case 'high': 
      case 'critical': return { color: COLORS.error };
      case 'moderate': return { color: COLORS.warning };
      default: return { color: COLORS.primary };
    }
  };

  const fetchData = useCallback(async () => {
    console.log('[ReportsDetailed] Fetching data...');
    setLoading(true);
    setError(null);

    try {
      // Define time range (e.g., last 24 hours, or all data for sim device)
      const endTime = Date.now();
      const startTime = 0; // Fetch all data for simplicity initially

      // Fetch all relevant data types
      const [
        fetchedImpacts,
        fetchedMotion,
        fetchedFsr,
        fetchedHrm,
        fetchedHtm
      ] = await Promise.all([
        sensorDataRepository.getSensorData(deviceId, 'impact_events', startTime, endTime),
        sensorDataRepository.getSensorData(deviceId, 'motion_packets', startTime, endTime),
        sensorDataRepository.getSensorData(deviceId, 'fsr_packets', startTime, endTime),
        sensorDataRepository.getSensorData(deviceId, 'hrm_packets', startTime, endTime),
        sensorDataRepository.getSensorData(deviceId, 'htm_packets', startTime, endTime),
      ]);

      // Keep raw impact data for direction visualization if needed
      setImpacts(fetchedImpacts);
      
      console.log(`[ReportsDetailed] Fetched ${fetchedImpacts.length} impacts, ${fetchedMotion.length} motion, ${fetchedFsr.length} fsr, ${fetchedHrm.length} hrm, ${fetchedHtm.length} htm packets.`);
      console.log('[ReportsDetailed] == STARTING PROCESSING ==');

      // --- Process data using utility functions ---
      console.log(`[ReportsDetailed] --> Processing HRM (${fetchedHrm.length} packets)...`);
      const hrmResults = processHrmForChart(fetchedHrm);
      console.log(`[ReportsDetailed] <-- Done Processing HRM. Results:`, JSON.stringify(hrmResults));
      console.log('[ReportsDetailed] --> Setting HRM Chart Data...');
      setHrmChartData(hrmResults.chartData);
      console.log('[ReportsDetailed] <-- Done Setting HRM Chart Data.');
      
      console.log(`[ReportsDetailed] --> Processing Temp (${fetchedHtm.length} packets)...`);
      const tempResults = processTempForChart(fetchedHtm);
      console.log(`[ReportsDetailed] <-- Done Processing Temp. Results:`, JSON.stringify(tempResults));
      console.log('[ReportsDetailed] --> Setting Temp Chart Data...');
      setTempChartData(tempResults.chartData);
      console.log('[ReportsDetailed] <-- Done Setting Temp Chart Data.');
      
      console.log(`[ReportsDetailed] --> Processing FSR (${fetchedFsr.length} packets)...`);
      const fsrResults = processFsrForChart(fetchedFsr);
      console.log(`[ReportsDetailed] <-- Done Processing FSR. Results:`, JSON.stringify(fsrResults));
      console.log('[ReportsDetailed] --> Setting Bite Force Chart Data...');
      setBiteForceChartData(fsrResults.chartData);
      console.log('[ReportsDetailed] <-- Done Setting Bite Force Chart Data.');
      
      console.log(`[ReportsDetailed] --> Processing Motion (${fetchedMotion.length} packets)...`);
      const motionResults = processMotionForChart(fetchedMotion);
      console.log(`[ReportsDetailed] <-- Done Processing Motion. Results:`, JSON.stringify(motionResults));
      console.log('[ReportsDetailed] --> Setting Motion Chart Data...');
      setMotionChartData(motionResults.accelMagnitudeChart);
      console.log('[ReportsDetailed] <-- Done Setting Motion Chart Data.');
      
      console.log(`[ReportsDetailed] --> Processing Impacts (${fetchedImpacts.length} packets)...`);
      const impactResults = processImpactsForCharts(fetchedImpacts);
      console.log(`[ReportsDetailed] <-- Done Processing Impacts. Results:`, JSON.stringify(impactResults));
      console.log('[ReportsDetailed] --> Setting Impact Chart Data...');
      setImpactTimelineData(impactResults.timelineChart);
      console.log('[ReportsDetailed] --> Setting Severity Distribution Data...');
      setSeverityDistData(impactResults.severityDistribution);
      console.log('[ReportsDetailed] --> Setting CHIE Data...');
      setChieData(impactResults.cumulativeExposureChart);
      console.log('[ReportsDetailed] <-- Done Setting Impact Chart Data.');
      
      // Create a consolidated object with all stats, ensuring each property is defined
      console.log('[ReportsDetailed] --> Consolidating final stats...');
      // Log each property to find what might be undefined
      console.log('[ReportsDetailed] Stats inputs:', {
        avgHr: hrmResults.avgHr,
        minHr: hrmResults.minHr,
        maxHr: hrmResults.maxHr,
        avgTemp: tempResults.avgTemp,
        maxTemp: tempResults.maxTemp,
        currentTemp: tempResults.currentTemp,
        avgBiteLeft: fsrResults.avgLeft,
        avgBiteRight: fsrResults.avgRight,
        avgBiteTotal: fsrResults.avgTotal,
        maxBiteForce: fsrResults.maxForce,
        peakAccel: motionResults.peakAccel,
        totalImpacts: impactResults.totalImpacts,
        highImpacts: impactResults.highImpacts,
        maxG: impactResults.maxG,
        concussionRisk: impactResults.concussionRisk
      });
      
      const finalStats = {
        // Heart rate
        avgHr: hrmResults.avgHr ?? null,
        minHr: hrmResults.minHr ?? null,
        maxHr: hrmResults.maxHr ?? null,
        
        // Temperature
        avgTemp: tempResults.avgTemp ?? null,
        maxTemp: tempResults.maxTemp ?? null,
        currentTemp: tempResults.currentTemp ?? null,
        
        // Bite force
        avgBiteLeft: fsrResults.avgLeft ?? null,
        avgBiteRight: fsrResults.avgRight ?? null,
        avgBiteTotal: fsrResults.avgTotal ?? null,
        maxBiteForce: fsrResults.maxForce ?? null,
        
        // Motion
        peakAccel: motionResults.peakAccel ?? null,
        
        // Impacts
        totalImpacts: impactResults.totalImpacts ?? 0,
        highImpacts: impactResults.highImpacts ?? 0,
        maxG: impactResults.maxG ?? null,
        concussionRisk: impactResults.concussionRisk ?? 'Low'
      };
      
      console.log('[ReportsDetailed] <-- Done Consolidating stats. Value:', JSON.stringify(finalStats));
      console.log('[ReportsDetailed] --> Setting Session Stats...');
      setSessionStats(finalStats);
      console.log('[ReportsDetailed] <-- Done Setting Session Stats.');

      // Animate cards in
      console.log('[ReportsDetailed] --> Starting Animation...');
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }).start(() => {
        console.log('[ReportsDetailed] <-- Animation Completed.');
      });
      console.log('[ReportsDetailed] == PROCESSING COMPLETE ==');

    } catch (err) {
      console.error('[ReportsDetailed] Error fetching data:', err);
      // Add more detailed error logging
      if (err instanceof Error) {
        console.error('[ReportsDetailed] Error Name:', err.name);
        console.error('[ReportsDetailed] Error Message:', err.message);
        console.error('[ReportsDetailed] Error Stack:', err.stack);
      }
      setError(err instanceof Error ? err.message : 'Failed to load report data');
      
      // Clear existing data on error
      setImpacts([]);
      setHrmChartData(null);
      setTempChartData(null);
      setBiteForceChartData(null);
      setMotionChartData(null);
      setImpactTimelineData(null);
      setSeverityDistData(null);
      setChieData(null);
      setSessionStats(null);
    } finally {
      setLoading(false);
      console.log('[ReportsDetailed] Fetching complete.');
    }
  }, [deviceId, sensorDataRepository, fadeAnim]);

  // Fetch data on initial mount
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Create a ref to hold the latest fetchData function
  const fetchDataRef = useRef(fetchData);
  
  // Update the ref whenever fetchData changes
  useEffect(() => {
    fetchDataRef.current = fetchData;
  }, [fetchData]);
  
  // Create a debounced version of fetchData ONLY for the listener
  const debouncedFetchData = useRef(
    debounce(() => {
      console.log('[ReportsDetailed] Debounced fetch triggered...');
      // Call the latest fetchData function from the ref
      fetchDataRef.current();
    }, 1000, { leading: false, trailing: true }) // Fetch on the trailing edge after 1s pause
  ).current;

  // Subscribe to data changes (using the debounced fetch)
  useEffect(() => {
    const handleDataChange = (eventData: { deviceId: string; type: string }) => {
      // Re-fetch data if the change affects the current device
      if (eventData.deviceId === deviceId) {
        console.log(`[ReportsDetailed] Data changed for device ${deviceId} (type: ${eventData.type}), queueing debounced fetch...`);
        debouncedFetchData(); // Call the debounced function
      }
    };

    dataChangeEmitter.on(dbEvents.DATA_CHANGED, handleDataChange);
    
    // Cleanup subscription on unmount
    return () => {
      dataChangeEmitter.off(dbEvents.DATA_CHANGED, handleDataChange);
      debouncedFetchData.cancel(); // Cancel any pending debounced calls
    };
  }, [deviceId, debouncedFetchData]);

  // Show loading indicator
  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loadingText}>Loading Report Data...</Text>
      </View>
    );
  }

  // Show error message
  if (error) {
    return (
      <View style={styles.errorContainer}>
        <MaterialCommunityIcons name="alert-circle-outline" size={48} color={COLORS.error} />
        <Text style={styles.errorTitle}>Error Loading Report</Text>
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={fetchData}>
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // Show message if no data
  if (!sessionStats && 
      !impactTimelineData?.datasets?.[0]?.data?.length && 
      !biteForceChartData?.datasets?.[0]?.data?.length && 
      !hrmChartData?.datasets?.[0]?.data?.length && 
      !tempChartData?.datasets?.[0]?.data?.length) {
    return (
      <View style={styles.emptyContainer}>
        <MaterialCommunityIcons name="chart-bar-stacked" size={48} color={COLORS.textTertiary} />
        <Text style={styles.emptyText}>No Data Available</Text>
        <Text style={styles.emptySubText}>Generate test data or connect a device to see reports.</Text>
      </View>
    );
  }

  return (
    <SafeAreaProvider>
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <ScrollView
          style={styles.container}
          contentContainerStyle={styles.contentContainer}
          showsVerticalScrollIndicator={false}
        >
          {/* Enhanced Header */}
          <View style={styles.header}>
            <LinearGradient
              colors={['rgba(0,176,118,0.2)', 'rgba(0,176,118,0.05)', 'transparent']}
              style={styles.headerGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 0, y: 1 }}
            />
            <View style={styles.headerContent}>
              <Text style={styles.headerTitle}>Detailed Report</Text>
            </View>
          </View>

          {/* Session Info Card - Refined */}
          <Animated.View style={{opacity: fadeAnim, transform: [{translateY: fadeAnim.interpolate({
            inputRange: [0, 1],
            outputRange: [20, 0]
          })}]}}>
            <GlassCard style={styles.summaryCard}>
              <View style={styles.cardHeader}>
                <Text style={styles.cardTitle}>Session Report</Text>
                <Text style={styles.deviceId}>({deviceId})</Text>
              </View>
              
              <View style={styles.metricsRow}>
                <View style={styles.metricColumn}>
                  <Text style={styles.metricNumber}>{sessionStats?.totalImpacts ?? '0'}</Text>
                  <Text style={styles.metricLabel}>Total Impacts</Text>
                </View>
                
                <View style={styles.metricDivider} />
                
                <View style={styles.metricColumn}>
                  <Text style={styles.metricNumber}>{sessionStats?.maxG ?? '0'}g</Text>
                  <Text style={styles.metricLabel}>Max G-Force</Text>
                </View>
                
                <View style={styles.metricDivider} />
                
                <View style={styles.metricColumn}>
                  <Text style={styles.metricNumber}>{sessionStats?.highImpacts ?? '0'}</Text>
                  <Text style={styles.metricLabel}>High Impacts</Text>
                </View>
              </View>
            </GlassCard>
          </Animated.View>

          {/* Heart Rate Card */}
          <Animated.View style={{opacity: fadeAnim, transform: [{translateY: fadeAnim.interpolate({
            inputRange: [0, 1],
            outputRange: [20, 0]
          })}], marginTop: 8}}>
            <GlassCard style={styles.heartRateCard}>
              <View style={styles.cardHeader}>
                <View style={[styles.iconContainer, {backgroundColor: 'rgba(255, 59, 48, 0.1)'}]}>
                  <MaterialCommunityIcons name="heart-pulse" size={20} color="rgba(255, 59, 48, 1)" />
                </View>
                <Text style={styles.cardTitle}>Heart Rate</Text>
              </View>
              
              <View style={styles.scrollableChartContainer}>
                {loading ? (
                  <ActivityIndicator color={COLORS.primary} />
                ) : error ? (
                  <Text style={styles.errorText}>{error}</Text>
                ) : hrmChartData ? (
                  <ScrollableHeartRateChart
                    data={hrmChartData}
                    currentValue={sessionStats?.avgHr ?? 0}
                    timestamp={hrmChartData?.latestTimestamp || (new Date()).toLocaleTimeString().slice(0, 5)}
                    height={280}
                    rangeData={{
                      min: sessionStats?.minHr ?? 0,
                      max: sessionStats?.maxHr ?? 0,
                      timeRange: hrmChartData?.timeRangeLabel || "Today"
                    }}
                  />
                ) : (
                  <Text style={styles.emptyChartText}>No heart rate data available</Text>
                )}
              </View>
            </GlassCard>
          </Animated.View>

          {/* Temperature Card */}
          <Animated.View style={{opacity: fadeAnim, transform: [{translateY: fadeAnim.interpolate({
            inputRange: [0, 1],
            outputRange: [20, 0]
          })}], marginTop: 8}}>
            <GlassCard style={styles.dataCard}>
              <View style={styles.cardHeader}>
                <View style={[styles.iconContainer, {backgroundColor: 'rgba(255, 149, 0, 0.1)'}]}>
                  <MaterialCommunityIcons name="thermometer" size={20} color="rgba(255, 149, 0, 1)" />
                </View>
                <Text style={styles.cardTitle}>Temperature</Text>
              </View>
              
              <View style={styles.chartContainer}>
                {loading ? (
                  <ActivityIndicator color={COLORS.primary} />
                ) : error ? (
                  <Text style={styles.errorText}>{error}</Text>
                ) : tempChartData ? (
                  <TemperatureStabilityGraph
                    data={tempChartData}
                    currentTemp={sessionStats?.currentTemp}
                    avgTemp={sessionStats?.avgTemp}
                    maxTemp={sessionStats?.maxTemp}
                  />
                ) : (
                  <Text style={styles.emptyChartText}>No temperature data available</Text>
                )}
              </View>
            </GlassCard>
          </Animated.View>

          {/* Bite Force Card */}
          <Animated.View style={{opacity: fadeAnim, transform: [{translateY: fadeAnim.interpolate({
            inputRange: [0, 1],
            outputRange: [20, 0]
          })}], marginTop: 8}}>
            <GlassCard style={styles.dataCard}>
              <View style={styles.cardHeader}>
                <View style={[styles.iconContainer, {backgroundColor: 'rgba(0, 122, 255, 0.1)'}]}>
                  <MaterialCommunityIcons name="tooth-outline" size={20} color="rgba(0, 122, 255, 1)" />
                </View>
                <Text style={styles.cardTitle}>Bite Force</Text>
              </View>
              
              <View style={styles.chartContainer}>
                {loading ? (
                  <ActivityIndicator color={COLORS.primary} />
                ) : error ? (
                  <Text style={styles.errorText}>{error}</Text>
                ) : biteForceChartData ? (
                  <BiteForceDynamicsChart
                    data={biteForceChartData}
                    avgLeft={sessionStats?.avgBiteLeft}
                    avgRight={sessionStats?.avgBiteRight}
                    avgTotal={sessionStats?.avgBiteTotal}
                    maxForce={sessionStats?.maxBiteForce}
                  />
                ) : (
                  <Text style={styles.emptyChartText}>No bite force data available</Text>
                )}
              </View>
            </GlassCard>
          </Animated.View>

          {/* Motion Overview Card */}
          <Animated.View style={{opacity: fadeAnim, transform: [{translateY: fadeAnim.interpolate({
            inputRange: [0, 1],
            outputRange: [20, 0]
          })}], marginTop: 8}}>
            <GlassCard style={styles.dataCard}>
              <View style={styles.cardHeader}>
                <View style={[styles.iconContainer, {backgroundColor: 'rgba(80, 80, 80, 0.1)'}]}>
                  <MaterialCommunityIcons name="axis-arrow" size={20} color="rgba(80, 80, 80, 1)" />
                </View>
                <Text style={styles.cardTitle}>Motion Overview</Text>
              </View>
              
              <View style={styles.chartContainer}>
                {loading ? (
                  <ActivityIndicator color={COLORS.primary} />
                ) : error ? (
                  <Text style={styles.errorText}>{error}</Text>
                ) : motionChartData ? (
                  <MotionOverviewGraph
                    data={motionChartData}
                    peakAccel={sessionStats?.peakAccel}
                  />
                ) : (
                  <Text style={styles.emptyChartText}>No motion data available</Text>
                )}
              </View>
            </GlassCard>
          </Animated.View>

          {/* Concussion Risk Card - Refined */}
          <Animated.View style={{opacity: fadeAnim, transform: [{translateY: fadeAnim.interpolate({
            inputRange: [0, 1],
            outputRange: [20, 0]
          })}], marginTop: 8}}>
            <GlassCard style={[styles.dataCard, styles.riskCard]}>
              <View style={styles.cardHeader}>
                <View style={[styles.iconContainer, {backgroundColor: `${getRiskStyle(sessionStats?.concussionRisk).color}15`}]}>
                  <MaterialCommunityIcons 
                    name="shield-alert-outline" 
                    size={20} 
                    color={getRiskStyle(sessionStats?.concussionRisk).color} 
                  />
                </View>
                <Text style={styles.cardTitle}>Concussion Risk</Text>
              </View>
              
              <ConcussionRiskGauge risk={sessionStats?.concussionRisk} />
            </GlassCard>
          </Animated.View>

          {/* Impact Timeline Card */}
          <Animated.View style={{opacity: fadeAnim, transform: [{translateY: fadeAnim.interpolate({
            inputRange: [0, 1],
            outputRange: [20, 0]
          })}], marginTop: 8}}>
            <GlassCard style={styles.dataCard}>
              <View style={styles.cardHeader}>
                <View style={[styles.iconContainer, {backgroundColor: 'rgba(0, 176, 118, 0.1)'}]}>
                  <MaterialCommunityIcons name="chart-timeline-variant" size={20} color={COLORS.primary} />
                </View>
                <Text style={styles.cardTitle}>Impact Timeline</Text>
              </View>
              
              <View style={styles.chartContainer}>
                {loading ? (
                  <ActivityIndicator color={COLORS.primary} />
                ) : error ? (
                  <Text style={styles.errorText}>{error}</Text>
                ) : impactTimelineData ? (
                  <ImpactTimelineGraph
                    data={impactTimelineData}
                    totalImpacts={sessionStats?.totalImpacts}
                    maxG={sessionStats?.maxG}
                  />
                ) : (
                  <Text style={styles.emptyChartText}>No impact data available</Text>
                )}
              </View>
            </GlassCard>
          </Animated.View>

          {/* Severity Distribution Card - Refined */}
          <Animated.View style={{opacity: fadeAnim, transform: [{translateY: fadeAnim.interpolate({
            inputRange: [0, 1],
            outputRange: [20, 0]
          })}], marginTop: 8}}>
            <GlassCard style={styles.dataCard}>
              <View style={styles.cardHeader}>
                <View style={[styles.iconContainer, {backgroundColor: 'rgba(0, 176, 118, 0.1)'}]}>
                  <MaterialCommunityIcons name="chart-histogram" size={20} color={COLORS.primary} />
                </View>
                <Text style={styles.cardTitle}>Severity Distribution</Text>
              </View>
              
              <View style={styles.chartContainer}>
                {loading ? (
                  <ActivityIndicator color={COLORS.primary} />
                ) : error ? (
                  <Text style={styles.errorText}>{error}</Text>
                ) : severityDistData ? (
                  <SeverityDistributionGraph data={severityDistData} />
                ) : (
                  <Text style={styles.emptyChartText}>No impact data available</Text>
                )}
              </View>
            </GlassCard>
          </Animated.View>

          {/* CHIE Card */}
          <Animated.View style={{opacity: fadeAnim, transform: [{translateY: fadeAnim.interpolate({
            inputRange: [0, 1],
            outputRange: [20, 0]
          })}], marginTop: 8}}>
            <GlassCard style={styles.dataCard}>
              <View style={styles.cardHeader}>
                <View style={[styles.iconContainer, {backgroundColor: 'rgba(0, 122, 255, 0.1)'}]}>
                  <MaterialCommunityIcons name="brain" size={20} color="rgba(0, 122, 255, 1)" />
                </View>
                <Text style={styles.cardTitle}>Cumulative Head Impact Exposure</Text>
              </View>
              
              <View style={styles.chartContainer}>
                {loading ? (
                  <ActivityIndicator color={COLORS.primary} />
                ) : error ? (
                  <Text style={styles.errorText}>{error}</Text>
                ) : chieData ? (
                  <CumulativeExposureGraph data={chieData} />
                ) : (
                  <Text style={styles.emptyChartText}>No cumulative exposure data available</Text>
                )}
              </View>
            </GlassCard>
          </Animated.View>

          {/* Bottom Spacer */}
          <View style={{ height: 24 }} />
        </ScrollView>
      </SafeAreaView>
    </SafeAreaProvider>
  );
}

// Refined StyleSheet with Apple-like aesthetics
const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  contentContainer: {
    paddingBottom: 32,
  },
  header: {
    height: 120,
    position: 'relative',
    marginBottom: 16,
  },
  headerGradient: {
    ...StyleSheet.absoluteFillObject,
  },
  headerContent: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 16,
    justifyContent: 'flex-end',
    paddingBottom: 20,
  },
  headerTitle: {
    fontSize: 34,
    fontWeight: '700',
    color: COLORS.textPrimary,
    letterSpacing: 0.5,
  },
  // Card container styling
  cardContainer: {
    marginHorizontal: 20,
    marginBottom: 8,
    borderRadius: 16,
    overflow: 'hidden',
  },
  cardContent: {
    padding: 20,
  },
  blurView: {
    ...StyleSheet.absoluteFillObject,
  },
  cardAndroid: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.04)',
  },
  summaryCard: {
    marginBottom: 16,
  },
  dataCard: {
    marginBottom: 8,
  },
  heartRateCard: {
    marginBottom: 8,
    paddingHorizontal: 0,
    paddingVertical: 16,
  },
  riskCard: {
    minHeight: 120,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    paddingHorizontal: 20,
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(0, 176, 118, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  cardTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  deviceId: {
    fontSize: 13,
    color: COLORS.textSecondary,
    marginLeft: 8,
    alignSelf: 'flex-end',
  },
  metricsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 12,
  },
  metricColumn: {
    flex: 1,
    alignItems: 'center',
  },
  metricDivider: {
    width: 1,
    height: '100%',
    backgroundColor: 'rgba(0, 0, 0, 0.06)',
  },
  metricNumber: {
    fontSize: 24,
    fontWeight: '600',
    color: COLORS.textPrimary,
    marginBottom: 4,
  },
  metricLabel: {
    fontSize: 13,
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
  dataValueContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'center',
    marginBottom: 4,
  },
  dataValue: {
    fontSize: 40,
    fontWeight: '500',
    color: COLORS.textPrimary,
  },
  dataUnit: {
    fontSize: 16,
    fontWeight: '500',
    color: COLORS.textSecondary,
    marginLeft: 4,
  },
  dataSubtext: {
    fontSize: 13,
    fontWeight: '500',
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginBottom: 16,
  },
  chartContainer: {
    alignItems: 'center',
    marginTop: 8,
    width: '100%',
  },
  scrollableChartContainer: {
    width: '100%',
    paddingHorizontal: 0,
  },
  legendContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 12,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 8,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  legendText: {
    fontSize: 13,
    color: COLORS.textSecondary,
  },
  riskValueContainer: {
    alignItems: 'center',
    marginTop: 16,
    marginBottom: 8,
  },
  riskValue: {
    fontSize: 32,
    fontWeight: '600',
  },
  emptyChartText: {
    fontSize: 14,
    color: COLORS.textTertiary,
    textAlign: 'center',
    marginVertical: 30,
    fontWeight: '500',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.background,
  },
  loadingText: {
    marginTop: 12,
    color: COLORS.textSecondary,
    fontSize: 16,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.background,
    padding: 20,
  },
  errorTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.error,
    marginTop: 16,
    marginBottom: 8,
    textAlign: 'center',
  },
  errorText: {
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginBottom: 24,
  },
  retryButton: {
    backgroundColor: COLORS.primary,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 12,
  },
  retryButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
    minHeight: 300,
  },
  emptyText: {
    fontSize: 20,
    fontWeight: '600',
    color: COLORS.textPrimary,
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubText: {
    fontSize: 14,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
  },
});