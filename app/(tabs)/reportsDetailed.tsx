import React, { useState, useEffect, useCallback, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ViewStyle, ActivityIndicator, Dimensions, Platform, Animated } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { COLORS, DEVICE_ID_SIM } from '@/src/constants';
import { useSensorDataRepository, useDeviceService, useBluetoothService } from '@/src/providers/AppProvider';
import { dataChangeEmitter, dbEvents } from '@/src/utils/EventEmitter';
import { MotionPacket, FSRPacket, HRMPacket, HTMPacket, ImpactEvent, ChartData, SavedDevice } from '@/src/types';
import { debounce } from 'lodash';
import { useLocalSearchParams } from 'expo-router';
import { useSession } from '@/src/contexts/SessionContext';
import { useSessionRepository } from '@/src/providers/AppProvider';
import 'react-native-get-random-values';
import { v4 as uuidv4 } from 'uuid';
// Import the chart components
import LineChart from '../components/charts/LineChart';
import BarChart from '../components/charts/BarChart';
// Import direct chart library for testing
import { LineChart as RNLineChart, BarChart as RNBarChart } from 'react-native-chart-kit';

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

// Add ErrorBoundary for catching render errors
class ErrorBoundary extends React.Component<{children: React.ReactNode}, {hasError: boolean, error: Error | null, errorInfo: React.ErrorInfo | null}> {
  constructor(props: {children: React.ReactNode}) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error: Error) {
    // Update state so the next render will show the fallback UI
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Log the error to console for debugging
    console.error('React Error Boundary caught an error:', error, errorInfo);
    this.setState({ errorInfo });
  }

  render() {
    if (this.state.hasError) {
      // Render fallback UI
      return (
        <View style={styles.errorContainer}>
          <MaterialCommunityIcons name="alert-circle-outline" size={48} color={COLORS.error} />
          <Text style={styles.errorTitle}>Something went wrong rendering this screen</Text>
          <Text style={styles.errorText}>
            {this.state.error?.toString()}
          </Text>
          <TouchableOpacity 
            style={styles.retryButton} 
            onPress={() => this.setState({ hasError: false, error: null, errorInfo: null })}
          >
            <Text style={styles.retryButtonText}>Try Again</Text>
          </TouchableOpacity>
        </View>
      );
    }

    return this.props.children;
  }
}

export default function ReportsDetailedScreen() {
  const sensorDataRepository = useSensorDataRepository();
  const sessionRepository = useSessionRepository();
  const { activeSession, sessionLoading } = useSession();
  const { sessionId: routeSessionId } = useLocalSearchParams<{ sessionId: string }>();
  
  // State for current session being viewed and device
  const [currentSession, setCurrentSession] = useState<any>(null);
  const [targetDeviceId, setTargetDeviceId] = useState<string | null>(null);
  
  // State for viewing session (either from route params or active)
  const [viewingSessionId, setViewingSessionId] = useState<string | null>(null);

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
  
  // Get device and bluetooth services to access device information
  const deviceService = useDeviceService();
  const bluetoothService = useBluetoothService();

  // Effect to determine which session to view
  useEffect(() => {
    // Prioritize session ID from route params
    if (routeSessionId) {
      console.log(`[ReportsDetailed] Viewing specific session from route: ${routeSessionId}`);
      setViewingSessionId(routeSessionId);
    }
    // If no route param, check for an active session
    else if (activeSession) {
      console.log(`[ReportsDetailed] Viewing currently active session: ${activeSession.id}`);
      setViewingSessionId(activeSession.id);
    }
    // Otherwise, no session is being viewed
    else {
      console.log(`[ReportsDetailed] No specific or active session to view.`);
      setViewingSessionId(null);
      // Clear existing chart data when no session is active/selected
      setHrmChartData(null);
      setTempChartData(null);
      setBiteForceChartData(null);
      setMotionChartData(null);
      setImpactTimelineData(null);
      setSeverityDistData(null);
      setChieData(null);
      setSessionStats(null);
    }
  }, [routeSessionId, activeSession]);

  // Effect to load session data when a session ID is provided
  useEffect(() => {
    const loadSession = async () => {
      if (viewingSessionId) {
        try {
          const session = await sessionRepository.getSessionById(viewingSessionId);
          if (session) {
            setCurrentSession(session);
            console.log(`[ReportsDetailed] Loaded session: ${session.id} - ${session.name}`);
          } else {
            console.error(`[ReportsDetailed] Session not found: ${viewingSessionId}`);
            setError(`Session with ID ${viewingSessionId} not found`);
            setViewingSessionId(null); // Clear the viewing session ID if not found
          }
        } catch (err) {
          console.error('[ReportsDetailed] Error loading session:', err);
          setError('Failed to load session data');
          setViewingSessionId(null); // Clear the viewing session ID on error
        }
      } else {
        setCurrentSession(null);
      }
    };

    loadSession();
  }, [viewingSessionId, sessionRepository]);
  
  // Effect to find and set the target device ID
  useEffect(() => {
    const findDevice = async () => {
      let foundId: string | null = null;
      try {
        // 1. Check actively connected devices first (highest priority)
        if (bluetoothService) {
          const connectedIds = bluetoothService.getConnectedDeviceIds();
          if (connectedIds.length > 0) {
            foundId = connectedIds[0]; // Use the first connected device
            console.log(`[ReportsDetailed] Using actively connected device: ${foundId}`);
          }
        } else {
          console.log('[ReportsDetailed] BluetoothService not available yet');
        }

        // If no connected devices found or bluetoothService isn't available
        if (!foundId) {
          // 2. If none connected, check saved devices
          const savedDevices = await deviceService.getSavedDevices();
          console.log(`[ReportsDetailed] Found ${savedDevices.length} saved devices`);
          
          if (savedDevices.length > 0) {
            // Sort by lastConnected (most recent first)
            const sortedDevices = [...savedDevices].sort((a: SavedDevice, b: SavedDevice) => {
              const aTime = a.lastConnected || 0;
              const bTime = b.lastConnected || 0;
              return bTime - aTime;
            });
            
            // Use the most recently connected device
            foundId = sortedDevices[0].id;
            console.log(`[ReportsDetailed] Using most recently connected saved device: ${foundId}`);
          }
        }
        
        // 3. Fall back to simulation device only if absolutely nothing else is found
        if (!foundId) {
          console.log(`[ReportsDetailed] No connected or saved devices found, falling back to simulation device ID.`);
          foundId = DEVICE_ID_SIM;
        }
        
        // Set the target device ID
        setTargetDeviceId(foundId);
        
      } catch (err) {
        console.error('[ReportsDetailed] Error finding device:', err);
        // Fall back to simulation device on error
        setTargetDeviceId(DEVICE_ID_SIM);
      }
    };
    
    findDevice();
  }, [deviceService, bluetoothService]);

  const getRiskStyle = (risk: any) => {
    switch (risk?.toLowerCase()) {
      case 'high': 
      case 'critical': return { color: COLORS.error };
      case 'moderate': return { color: COLORS.warning };
      default: return { color: COLORS.primary };
    }
  };

  const fetchData = useCallback(async () => {
    // Don't attempt to fetch if targetDeviceId is not set yet or no session is being viewed
    if (targetDeviceId === null || viewingSessionId === null) {
      console.log(`[ReportsDetailed] Cannot fetch data: targetDeviceId=${targetDeviceId}, viewingSessionId=${viewingSessionId}`);
      setLoading(false); // Ensure loading is set to false if we're skipping the fetch
      return;
    }
    
    console.log(`[ReportsDetailed] Fetching data for Device: ${targetDeviceId}, Session: ${viewingSessionId}`);
    setLoading(true);
    setError(null);

    try {
      // Define query options - now we ONLY use sessionId
      const options: {
        sessionId: string;
        limit?: number;
      } = {
        sessionId: viewingSessionId,
        limit: 1000
      };

      // Fetch all relevant data types with session filtering
      console.log(`[ReportsDetailed] Fetching data for session: ${viewingSessionId}`);
      const [
        fetchedImpacts,
        fetchedMotion,
        fetchedFsr,
        fetchedHrm,
        fetchedHtm
      ] = await Promise.all([
        sensorDataRepository.getSensorData(targetDeviceId, 'impact_events', options),
        sensorDataRepository.getSensorData(targetDeviceId, 'motion_packets', options),
        sensorDataRepository.getSensorData(targetDeviceId, 'fsr_packets', options),
        sensorDataRepository.getSensorData(targetDeviceId, 'hrm_packets', options),
        sensorDataRepository.getSensorData(targetDeviceId, 'htm_packets', options),
      ]);

      // Keep raw impact data for direction visualization if needed
      setImpacts(fetchedImpacts);
      
      console.log(`[ReportsDetailed] Fetched ${fetchedImpacts.length} impacts, ${fetchedMotion.length} motion, ${fetchedFsr.length} fsr, ${fetchedHrm.length} hrm, ${fetchedHtm.length} htm packets for session ${viewingSessionId}.`);
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
  }, [targetDeviceId, sensorDataRepository, viewingSessionId]);

  // Create a ref to hold the latest fetchData function
  const fetchDataRef = useRef(fetchData);
  
  // Update the ref whenever fetchData changes
  useEffect(() => {
    fetchDataRef.current = fetchData;
  }, [fetchData]);
  
  // Create a debounced version of fetchData
  const debouncedFetchData = useRef(
    debounce(() => {
      console.log('[ReportsDetailed] Debounced fetch triggered after 1s idle period');
      // Call the latest fetchData function from the ref
      fetchDataRef.current();
    }, 1000, { leading: false, trailing: true }) // Fetch on the trailing edge after 1s pause
  ).current;

  // Fetch data whenever targetDeviceId or viewingSessionId changes
  useEffect(() => {
    if (targetDeviceId !== null && viewingSessionId !== null) {
      fetchData();
    } else {
      // If we don't have a session ID, ensure loading is false
      setLoading(false);
    }
  }, [targetDeviceId, viewingSessionId, fetchData]);
  
  // Set up event listener for data changes - only trigger for the session we're viewing
  useEffect(() => {
    if (!targetDeviceId) return;
    
    const handleDataChange = (eventData: { deviceId: string; type: string; sessionId?: string }) => {
      // Only handle events for matching device and session
      if (
        eventData.deviceId === targetDeviceId && 
        eventData.sessionId === viewingSessionId
      ) {
        console.log(`[ReportsDetailed] Relevant data changed (${eventData.type} for session ${viewingSessionId}). Triggering debounced refresh...`);
        debouncedFetchData();
      }
    };

    dataChangeEmitter.on(dbEvents.DATA_CHANGED, handleDataChange);
    
    // Cleanup subscription on unmount
    return () => {
      dataChangeEmitter.off(dbEvents.DATA_CHANGED, handleDataChange);
      // Make sure to cancel any pending debounced fetch
      debouncedFetchData.cancel();
    };
  }, [targetDeviceId, viewingSessionId, debouncedFetchData]);

  // Add detailed chart data logging
  useEffect(() => {
    if (!loading && !error) {
      // Only log if not in production
      if (__DEV__) {
        console.log('--- CHART DATA SUMMARY ---');
        
        // Log data dimensions
        console.log('Chart dimensions:', {
          hrm: hrmChartData ? `${hrmChartData.labels?.length || 0}x${hrmChartData.datasets?.[0]?.data?.length || 0}` : 'null',
          temp: tempChartData ? `${tempChartData.labels?.length || 0}x${tempChartData.datasets?.[0]?.data?.length || 0}` : 'null',
          fsr: biteForceChartData ? `${biteForceChartData.labels?.length || 0}x${biteForceChartData.datasets?.[0]?.data?.length || 0}` : 'null',
          motion: motionChartData ? `${motionChartData.labels?.length || 0}x${motionChartData.datasets?.[0]?.data?.length || 0}` : 'null',
        });
        
        // Check for empty label percentages
        if (biteForceChartData?.labels?.length) {
          const emptyLabels = biteForceChartData.labels.filter(label => !label).length;
          const pct = (emptyLabels / biteForceChartData.labels.length * 100).toFixed(1);
          console.log(`FSR empty labels: ${emptyLabels}/${biteForceChartData.labels.length} (${pct}%)`);
        }
        
        if (motionChartData?.labels?.length) {
          const emptyLabels = motionChartData.labels.filter(label => !label).length;
          const pct = (emptyLabels / motionChartData.labels.length * 100).toFixed(1);
          console.log(`Motion empty labels: ${emptyLabels}/${motionChartData.labels.length} (${pct}%)`);
        }
      }
    }
  }, [loading, error, hrmChartData, tempChartData, biteForceChartData, motionChartData]);

  // Show loading indicator if loading or if targetDeviceId is null or sessionLoading
  if (loading || sessionLoading || targetDeviceId === null) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loadingText}>
          {targetDeviceId === null ? 'Finding device...' : (sessionLoading ? 'Checking session...' : 'Loading Report Data...')}
        </Text>
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

  // Show message if no session is selected
  if (!viewingSessionId) {
    return (
      <View style={styles.emptyContainer}>
        <MaterialCommunityIcons name="clipboard-text-clock-outline" size={48} color={COLORS.textTertiary} />
        <Text style={styles.emptyText}>No Session Selected</Text>
        <Text style={styles.emptySubText}>
          {activeSession
            ? `Currently viewing live data for session: ${activeSession.name}. Select a past session from the 'Sessions' tab to view its report.`
            : "Start a new session on the Dashboard or select a past session from the 'Sessions' tab."}
        </Text>
      </View>
    );
  }

  // Show message if no data is available for the selected session
  const noDataForSession = !sessionStats &&
                          !impactTimelineData?.datasets?.[0]?.data?.length &&
                          !biteForceChartData?.datasets?.[0]?.data?.length &&
                          !hrmChartData?.datasets?.[0]?.data?.length &&
                          !tempChartData?.datasets?.[0]?.data?.length;

  if (noDataForSession) {
    return (
      <View style={styles.emptyContainer}>
        <MaterialCommunityIcons name="chart-bar-stacked" size={48} color={COLORS.textTertiary} />
        <Text style={styles.emptyText}>No Data Recorded</Text>
        <Text style={styles.emptySubText}>No sensor data was found for the selected session.</Text>
      </View>
    );
  }

  // Original return statement for rendering charts and data
  return (
    <ErrorBoundary>
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
            <View>
              <GlassCard style={styles.summaryCard}>
                <View style={styles.cardHeader}>
                  <Text style={styles.cardTitle}>Session Report</Text>
                  <Text style={styles.deviceId}>({targetDeviceId})</Text>
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
            </View>

            {/* Heart Rate Card - Modified for iOS compatibility */}
            <View style={[styles.chartCardContainer, {marginTop: 8}]}>
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
                    timestamp={(hrmChartData as any)?.latestTimestamp || (new Date()).toLocaleTimeString().slice(0, 5)}
                    height={280}
                    rangeData={{
                      min: sessionStats?.minHr ?? 0,
                      max: sessionStats?.maxHr ?? 0,
                      timeRange: (hrmChartData as any)?.timeRangeLabel || "Today"
                    }}
                  />
                ) : (
                  <Text style={styles.emptyChartText}>No heart rate data available</Text>
                )}
              </View>
            </View>

            {/* Temperature Card */}
            <View style={[styles.chartCardContainer, {marginTop: 8}]}>
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
                    width={Dimensions.get('window').width - 40}
                    height={180}
                  />
                ) : (
                  <Text style={styles.emptyChartText}>No temperature data available</Text>
                )}
              </View>
            </View>

            {/* Bite Force Card */}
            <View style={[styles.chartCardContainer, {marginTop: 8}]}>
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
                    width={Dimensions.get('window').width - 40}
                    height={180}
                  />
                ) : (
                  <Text style={styles.emptyChartText}>No bite force data available</Text>
                )}
              </View>
            </View>

            {/* Motion Overview Card */}
            <View style={[styles.chartCardContainer, {marginTop: 8}]}>
              <View style={styles.cardHeader}>
                <View style={[styles.iconContainer, {backgroundColor: 'rgba(88, 86, 214, 0.1)'}]}>
                  <MaterialCommunityIcons name="wave" size={20} color="rgba(88, 86, 214, 1)" />
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
                    width={Dimensions.get('window').width - 40}
                    height={180}
                  />
                ) : (
                  <Text style={styles.emptyChartText}>No motion data available</Text>
                )}
              </View>
            </View>

            {/* Impact Timeline Card */}
            <View style={[styles.chartCardContainer, {marginTop: 8}]}>
              <View style={styles.cardHeader}>
                <View style={[styles.iconContainer, {backgroundColor: 'rgba(255, 45, 85, 0.1)'}]}>
                  <MaterialCommunityIcons name="chart-timeline-variant" size={20} color="rgba(255, 45, 85, 1)" />
                </View>
                <Text style={styles.cardTitle}>Impact Timeline</Text>
              </View>
              
              <View style={styles.chartContainer}>
                {loading ? (
                  <ActivityIndicator color={COLORS.primary} />
                ) : error ? (
                  <Text style={styles.errorText}>{error}</Text>
                ) : impactTimelineData && impactTimelineData.datasets?.[0]?.data?.length ? (
                  <ImpactTimelineGraph 
                    data={impactTimelineData}
                    width={Dimensions.get('window').width - 40}
                    height={180}
                  />
                ) : (
                  <Text style={styles.emptyChartText}>No impact data available</Text>
                )}
              </View>
            </View>

            {/* Concussion Risk Card */}
            <View style={[styles.chartCardContainer, {marginTop: 8}]}>
              <View style={styles.cardHeader}>
                <View style={[styles.iconContainer, {backgroundColor: 'rgba(175, 82, 222, 0.1)'}]}>
                  <MaterialCommunityIcons name="brain" size={20} color="rgba(175, 82, 222, 1)" />
                </View>
                <Text style={styles.cardTitle}>Concussion Risk Assessment</Text>
              </View>
              
              <View style={styles.gaugeContainer}>
                {loading ? (
                  <ActivityIndicator color={COLORS.primary} />
                ) : error ? (
                  <Text style={styles.errorText}>{error}</Text>
                ) : (sessionStats?.totalImpacts !== null && sessionStats?.totalImpacts !== undefined) ? (
                  <ConcussionRiskGauge 
                    risk={sessionStats.concussionRisk || 'Low'}
                    width={Dimensions.get('window').width - 40}
                  />
                ) : (
                  <Text style={styles.emptyChartText}>No impact risk data available</Text>
                )}
              </View>
            </View>

            {/* Severity Distribution Card - Refined */}
            <View style={[styles.chartCardContainer, {marginTop: 8}]}>
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
            </View>

            {/* CHIE Card */}
            <View style={[styles.chartCardContainer, {marginTop: 8}]}>
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
            </View>

            {/* Bottom Spacer */}
            <View style={{ height: 24 }} />
          </ScrollView>
        </SafeAreaView>
      </SafeAreaProvider>
    </ErrorBoundary>
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
    backgroundColor: COLORS.background,
  },
  emptyText: {
    fontSize: 20,
    fontWeight: '600',
    color: COLORS.textPrimary,
    marginTop: 16,
    marginBottom: 8,
    textAlign: 'center',
  },
  emptySubText: {
    fontSize: 14,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
  },
  chartCardContainer: {
    marginHorizontal: 20,
    marginBottom: 16,
    backgroundColor: Platform.OS === 'ios' ? 'rgba(255, 255, 255, 0.8)' : COLORS.card,
    borderRadius: 16,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  gaugeContainer: {
    alignItems: 'center',
    marginTop: 16,
  },
});