import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, FlatList, TouchableOpacity, ViewStyle, ActivityIndicator, Dimensions } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur'; // Import if using GlassCard
import { COLORS, DEVICE_ID_SIM } from '@/src/constants'; // Import the simulated device ID
import { useSensorDataRepository } from '@/src/providers/AppProvider'; // Import the repository hook
import { dataChangeEmitter, dbEvents } from '@/src/utils/EventEmitter'; // Import event emitter
import { MotionPacket, FSRPacket, HRMPacket, HTMPacket, ImpactEvent, ChartData } from '@/src/types'; // Import types

// Import the chart components
import LineChart from '../components/charts/LineChart';
import BarChart from '../components/charts/BarChart';

// Safe wrapper for LineChart that ensures proper dataset format
const SafeLineChart = ({ data, emptyMessage = "No data available", ...props }: any) => {
  // Determine if there is actual data to render
  const hasActualData = data && 
                       data.datasets && 
                       data.datasets.some((ds: any) => ds.data && ds.data.length > 0 && 
                                                     ds.data.some((val: any) => val !== null && val !== undefined));

  // Don't render if no data structure at all
  if (!data || !data.datasets) {
    return <Text style={styles.metricValueSub}>{emptyMessage}</Text>;
  }

  // If datasets exist but are empty, show empty message
  if (!hasActualData) {
    return <Text style={styles.metricValueSub}>{emptyMessage}</Text>;
  }

  // Create a safe data structure with properly formatted datasets
  const safeData = {
    labels: data.labels || [],
    datasets: data.datasets.map((dataset: any, index: number) => ({
      data: dataset.data || [],
      color: dataset.color || (() => 'rgba(0, 176, 118, 1)'),
      strokeWidth: dataset.strokeWidth || 2,
      index: index // Ensure index is set
    })),
    legend: data.legend || undefined
  };

  return <LineChart data={safeData} {...props} />;
};

// Re-use or adapt the GlassCard component from index.tsx or devices.tsx
// If not using GlassCard, replace with styled View components.
interface GlassCardProps {
  style?: ViewStyle;
  children: React.ReactNode;
  intensity?: number;
}

const GlassCard: React.FC<GlassCardProps> = ({ style, children, intensity = 15 }) => {
  // Basic fallback View if BlurView/GlassCard isn't available/desired
  return <View style={[styles.glassCardFallback, style]}>{children}</View>;
};

// Define the Theme based on your constants
const THEME = {
  background: COLORS.background,
  cardBackground: COLORS.card,
  primary: COLORS.primary,
  text: {
    primary: COLORS.textPrimary,
    secondary: COLORS.textSecondary,
    tertiary: COLORS.textTertiary,
  },
  divider: 'rgba(0,0,0,0.08)',
  card: {
    shadow: 'rgba(0,0,0,0.12)',
    border: 'rgba(0,0,0,0.05)',
  },
  error: COLORS.error,
  warning: COLORS.warning,
  info: COLORS.info,
};

export default function ReportsDetailedScreen() {
  const sensorDataRepository = useSensorDataRepository(); // Get the repository

  // State for storing fetched data
  const [impacts, setImpacts] = useState<ImpactEvent[]>([]);
  const [motionPackets, setMotionPackets] = useState<MotionPacket[]>([]);
  const [fsrPackets, setFsrPackets] = useState<FSRPacket[]>([]);
  const [hrmPackets, setHrmPackets] = useState<HRMPacket[]>([]);
  const [htmPackets, setHtmPackets] = useState<HTMPacket[]>([]);

  // State for aggregated stats
  const [sessionStats, setSessionStats] = useState<any>(null);
  const [impactTimelineData, setImpactTimelineData] = useState<any | null>(null);
  const [severityDistData, setSeverityDistData] = useState<any | null>(null);
  const [chieData, setChieData] = useState<any | null>(null);
  const [directionData, setDirectionData] = useState<any[] | null>(null);
  const [biteForceData, setBiteForceData] = useState<any | null>(null);
  const [hrChartData, setHrChartData] = useState<any | null>(null);
  const [tempChartData, setTempChartData] = useState<any | null>(null);

  // Loading and error states
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Assume single device for now
  const deviceId = DEVICE_ID_SIM;

  const getRiskStyle = (risk: string | undefined) => {
    switch (risk?.toLowerCase()) {
      case 'high': 
      case 'critical': return styles.riskHigh;
      case 'moderate': return styles.riskModerate;
      default: return styles.riskLow;
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

      // --- Store Raw Data ---
      setImpacts(fetchedImpacts as ImpactEvent[]);
      setMotionPackets(fetchedMotion as MotionPacket[]);
      setFsrPackets(fetchedFsr as FSRPacket[]);
      setHrmPackets(fetchedHrm as HRMPacket[]);
      setHtmPackets(fetchedHtm as HTMPacket[]);

      console.log(`[ReportsDetailed] Fetched ${fetchedImpacts.length} impacts, ${fetchedMotion.length} motion, ${fetchedFsr.length} fsr, ${fetchedHrm.length} hrm, ${fetchedHtm.length} htm packets.`);

      // --- Process Data for Charts and KPIs ---
      processAndSetChartData(
        fetchedImpacts as ImpactEvent[],
        fetchedFsr as FSRPacket[],
        fetchedHrm as HRMPacket[],
        fetchedHtm as HTMPacket[]
      );

    } catch (err) {
      console.error('[ReportsDetailed] Error fetching data:', err);
      setError(err instanceof Error ? err.message : 'Failed to load report data');
      // Clear existing data on error
      setImpacts([]);
      setMotionPackets([]);
      setFsrPackets([]);
      setHrmPackets([]);
      setHtmPackets([]);
      setSessionStats(null);
      setImpactTimelineData(null);
      setSeverityDistData(null);
      setChieData(null);
      setDirectionData(null);
      setBiteForceData(null);
      setHrChartData(null);
      setTempChartData(null);
    } finally {
      setLoading(false);
      console.log('[ReportsDetailed] Fetching complete.');
    }
  }, [deviceId, sensorDataRepository]);

  // --- Data Processing Function ---
  const processAndSetChartData = (
    impactData: ImpactEvent[],
    fsrData: FSRPacket[],
    hrmData: HRMPacket[],
    htmData: HTMPacket[]
  ) => {
    console.log('[ReportsDetailed] Processing data...');
    console.log('[ReportsDetailed] Raw HRM Data:', JSON.stringify(hrmData));
    console.log('[ReportsDetailed] Raw FSR Data:', JSON.stringify(fsrData));
    console.log('[ReportsDetailed] Raw HTM Data:', JSON.stringify(htmData));

    if (!impactData || impactData.length === 0) {
      console.log('[ReportsDetailed] No impact data.');
      // Reset chart data if no impacts
      setImpactTimelineData({
        labels: [],
        datasets: [{ 
          data: [], 
          color: () => 'rgba(0, 176, 118, 1)', 
          strokeWidth: 2,
          index: 0
        }]
      });
      setSeverityDistData({
        labels: [],
        datasets: [{ 
          data: [], 
          color: () => 'rgba(0, 176, 118, 1)', 
          strokeWidth: 2,
          index: 0
        }]
      });
      setChieData({
        labels: [],
        datasets: [{ 
          data: [], 
          color: () => 'rgba(0, 122, 255, 1)', 
          strokeWidth: 2,
          index: 0
        }]
      });
      setDirectionData([]);
      
      // Process other data types if available
      processBiteForceChart(fsrData);
      processHrChart(hrmData);
      processTempChart(htmData);
      
      // --- Deeper Logging in processAndSetChartData (No Impact block) ---
      const hrValuesEmpty = hrmData.map(p => {
        const rawValue = p.heartRate;
        const parsedValue = parseFloat(rawValue as any);
        console.log(`[HR Debug Empty] Raw: ${rawValue} (Type: ${typeof rawValue}), Parsed: ${parsedValue}, IsNaN: ${isNaN(parsedValue)}`);
        return parsedValue;
      });
      const validHrsEmpty = hrValuesEmpty.filter(hr => {
        const isNum = !isNaN(hr);
        console.log(`[HR Filter Empty] Value: ${hr}, IsValidNumber: ${isNum}`);
        return isNum;
      });
      console.log('[ReportsDetailed - No Impacts] Parsed HR Values (All):', JSON.stringify(hrValuesEmpty));
      console.log('[ReportsDetailed - No Impacts] Filtered Valid HRs:', JSON.stringify(validHrsEmpty));
      const avgHrValueEmpty = validHrsEmpty.length > 0 ? (validHrsEmpty.reduce((a, b) => a + b, 0) / validHrsEmpty.length) : NaN;
      const maxHrValueEmpty = validHrsEmpty.length > 0 ? Math.max(...validHrsEmpty) : NaN;
      console.log('[ReportsDetailed - No Impacts] Calculated Avg HR:', avgHrValueEmpty, ', Calculated Max HR:', maxHrValueEmpty);

      // Calculate Avg Temp
      const validTempsEmpty = htmData.map(p => p.temperature).filter(t => typeof t === 'number' && !isNaN(t));
      const avgTempValueEmpty = validTempsEmpty.length > 0 ? (validTempsEmpty.reduce((a, b) => a + b, 0) / validTempsEmpty.length) : NaN;
      console.log('[ReportsDetailed - No Impacts] Valid Temps:', JSON.stringify(validTempsEmpty));
      console.log('[ReportsDetailed - No Impacts] Calculated Avg Temp:', avgTempValueEmpty);

      // Calculate Avg Bite Force
      const validLeftBitesEmpty = fsrData.map(p => p.left_bite).filter(b => typeof b === 'number' && !isNaN(b));
      const validRightBitesEmpty = fsrData.map(p => p.right_bite).filter(b => typeof b === 'number' && !isNaN(b));
      const allValidBitesEmpty = [...validLeftBitesEmpty, ...validRightBitesEmpty];
      const avgBiteValueEmpty = allValidBitesEmpty.length > 0 ? (allValidBitesEmpty.reduce((a, b) => a + b, 0) / allValidBitesEmpty.length) : NaN;
      console.log('[ReportsDetailed - No Impacts] Valid Bites:', JSON.stringify(allValidBitesEmpty));
      console.log('[ReportsDetailed - No Impacts] Calculated Avg Bite:', avgBiteValueEmpty);

      // Set basic session stats
      const basicStats = {
        totalImpacts: 0,
        maxG: 0,
        avgG: 0,
        highImpacts: 0,
        avgHr: !isNaN(avgHrValueEmpty) ? avgHrValueEmpty.toFixed(0) : '--',
        maxHr: !isNaN(maxHrValueEmpty) ? maxHrValueEmpty : '--',
        avgTemp: !isNaN(avgTempValueEmpty) ? avgTempValueEmpty.toFixed(1) : '--', 
        avgBite: !isNaN(avgBiteValueEmpty) ? avgBiteValueEmpty.toFixed(0) : '--', // Add avg bite
        concussionRisk: 'Low',
        duration: "N/A", 
        caloriesBurned: "N/A", 
        acceleration: "N/A", 
        biteForce: !isNaN(avgBiteValueEmpty) ? avgBiteValueEmpty.toFixed(0) : '--', // Keep old key for now? Or remove?
      };
      console.log('[ReportsDetailed - No Impacts] Setting Basic Session Stats:', JSON.stringify(basicStats));
      setSessionStats(basicStats);
      return;
    }

    // Impact data exists...
    console.log('[ReportsDetailed] Processing WITH impact data.');
    const magnitudes = impactData.map(i => i.magnitude);
    const totalImpacts = impactData.length;
    const maxG = magnitudes.length > 0 ? Math.max(...magnitudes) : 0;
    const avgG = magnitudes.length > 0 ? magnitudes.reduce((a, b) => a + b, 0) / totalImpacts : 0;
    const highImpacts = impactData.filter(i => i.magnitude >= 80).length;

    // --- Deeper Logging in processAndSetChartData (WITH Impact block) ---
    const hrValuesWithImpact = hrmData.map(p => {
      const rawValue = p.heartRate;
      const parsedValue = parseFloat(rawValue as any);
      console.log(`[HR Debug Impact] Raw: ${rawValue} (Type: ${typeof rawValue}), Parsed: ${parsedValue}, IsNaN: ${isNaN(parsedValue)}`);
      return parsedValue;
    });
    const validHrs = hrValuesWithImpact.filter(hr => {
      const isNum = !isNaN(hr);
      console.log(`[HR Filter Impact] Value: ${hr}, IsValidNumber: ${isNum}`);
      return isNum;
    });
    console.log('[ReportsDetailed - With Impacts] Parsed HR Values (All):', JSON.stringify(hrValuesWithImpact));
    console.log('[ReportsDetailed - With Impacts] Filtered Valid HRs:', JSON.stringify(validHrs));
    const avgHrValue = validHrs.length > 0 ? (validHrs.reduce((a, b) => a + b, 0) / validHrs.length) : NaN;
    const maxHrValue = validHrs.length > 0 ? Math.max(...validHrs) : NaN;
    console.log('[ReportsDetailed - With Impacts] Calculated Avg HR:', avgHrValue, ', Calculated Max HR:', maxHrValue);

    // Calculate Avg Temp
    const validTemps = htmData.map(p => p.temperature).filter(t => typeof t === 'number' && !isNaN(t));
    const avgTempValue = validTemps.length > 0 ? (validTemps.reduce((a, b) => a + b, 0) / validTemps.length) : NaN;
    console.log('[ReportsDetailed - With Impacts] Valid Temps:', JSON.stringify(validTemps));
    console.log('[ReportsDetailed - With Impacts] Calculated Avg Temp:', avgTempValue);

    // Calculate Avg Bite Force
    const validLeftBites = fsrData.map(p => p.left_bite).filter(b => typeof b === 'number' && !isNaN(b));
    const validRightBites = fsrData.map(p => p.right_bite).filter(b => typeof b === 'number' && !isNaN(b));
    const allValidBites = [...validLeftBites, ...validRightBites];
    const avgBiteValue = allValidBites.length > 0 ? (allValidBites.reduce((a, b) => a + b, 0) / allValidBites.length) : NaN;
    console.log('[ReportsDetailed - With Impacts] Valid Bites:', JSON.stringify(allValidBites));
    console.log('[ReportsDetailed - With Impacts] Calculated Avg Bite:', avgBiteValue);

    const calculatedStats = {
      totalImpacts,
      maxG: maxG.toFixed(1),
      avgG: avgG.toFixed(1),
      highImpacts,
      avgHr: !isNaN(avgHrValue) ? avgHrValue.toFixed(0) : '--',
      maxHr: !isNaN(maxHrValue) ? maxHrValue : '--',
      avgTemp: !isNaN(avgTempValue) ? avgTempValue.toFixed(1) : '--',
      avgBite: !isNaN(avgBiteValue) ? avgBiteValue.toFixed(0) : '--', // Add avg bite
      concussionRisk: highImpacts > 0 || maxG > 100 ? 'High' : (maxG > 80 ? 'Moderate' : 'Low'),
      duration: "N/A",
      caloriesBurned: "N/A",
      acceleration: "N/A",
      biteForce: !isNaN(avgBiteValue) ? avgBiteValue.toFixed(0) : '--', // Keep old key for now?
    };
    console.log('[ReportsDetailed - With Impacts] Setting Calculated Session Stats:', JSON.stringify(calculatedStats));
    setSessionStats(calculatedStats);

    // 2. Process Impact Timeline Data
    const sortedImpacts = [...impactData].sort((a, b) => a.timestamp - b.timestamp);
    const timelineLabels = sortedImpacts.map((_, i) => i.toString());
    const timelineValues = sortedImpacts.map(i => i.magnitude);
    setImpactTimelineData({
      labels: timelineLabels,
      datasets: [{ 
        data: timelineValues, 
        color: () => 'rgba(0, 176, 118, 1)', 
        strokeWidth: 2,
        index: 0
      }]
    });

    // 3. Process Severity Distribution Data
    const bins = [0, 10, 20, 30, 40, 50, 60, 70, 80, 90, 100, Infinity];
    const binCounts = Array(bins.length - 1).fill(0);
    impactData.forEach(impact => {
      for (let i = 0; i < bins.length - 1; i++) {
        if (impact.magnitude >= bins[i] && impact.magnitude < bins[i+1]) {
          binCounts[i]++;
          break;
        }
      }
    });
    const severityLabels = bins.slice(0, -1).map((bin, i) => 
      `${bin}-${bins[i+1] < Infinity ? bins[i+1]-1 : '+'}`
    ); 
    setSeverityDistData({
      labels: severityLabels,
      datasets: [{ 
        data: binCounts, 
        color: () => 'rgba(0, 176, 118, 1)', 
        strokeWidth: 2,
        index: 0
      }]
    });

    // 4. Process CHIE Data
    let cumulativeG = 0;
    const chieValues = sortedImpacts.map(impact => {
      cumulativeG += impact.magnitude; // Simple sum for now
      return cumulativeG;
    });
    const chieLabels = sortedImpacts.map((_, i) => i.toString());
    setChieData({
      labels: chieLabels,
      datasets: [{ 
        data: chieValues, 
        color: () => 'rgba(0, 122, 255, 1)', 
        strokeWidth: 2,
        index: 0
      }]
    });

    // 5. Process Direction Data
    const directions = impactData.map(impact => ({
      x: impact.x, // Use the stored G-force components
      y: impact.y,
      magnitude: impact.magnitude
    }));
    // This data needs to be plotted on a polar chart component.
    // Store the raw points for the chart component to handle.
    setDirectionData(directions);

    // 6. Process Bite Force Chart
    processBiteForceChart(fsrData);
    // 7. Process HR Chart
    processHrChart(hrmData);
    // 8. Process Temp Chart
    processTempChart(htmData);

    console.log('[ReportsDetailed] Data processing complete.');
  };

  // Helper function for bite force chart data
  const processBiteForceChart = (fsrData: FSRPacket[]) => {
    console.log('[processBiteForceChart] Received FSR Data:', JSON.stringify(fsrData));
    const validFsrData = fsrData.filter(p => 
        (typeof p.left_bite === 'number' && !isNaN(p.left_bite)) || 
        (typeof p.right_bite === 'number' && !isNaN(p.right_bite))
    );
    console.log('[processBiteForceChart] Filtered Valid FSR Data:', JSON.stringify(validFsrData));
    
    if (validFsrData.length === 0) {
       console.log('[processBiteForceChart] No valid FSR data found, setting empty chart.');
      setBiteForceData({
        labels: [],
        datasets: [
          {
            data: [],
            color: () => 'rgba(0, 176, 118, 1)',
            strokeWidth: 2
          },
          {
            data: [],
            color: () => 'rgba(0, 122, 255, 1)',
            strokeWidth: 2
          }
        ],
        legend: ['Left', 'Right']
      });
      return;
    }
    const sortedFsr = [...validFsrData].sort((a, b) => a.timestamp - b.timestamp);
    const biteLabels = sortedFsr.map((_, i) => i.toString());
    const leftBiteValues = sortedFsr.map(p => typeof p.left_bite === 'number' ? p.left_bite : 0); // Default invalid to 0
    const rightBiteValues = sortedFsr.map(p => typeof p.right_bite === 'number' ? p.right_bite : 0); // Default invalid to 0
    console.log('[processBiteForceChart] Final Left Bites:', JSON.stringify(leftBiteValues));
    console.log('[processBiteForceChart] Final Right Bites:', JSON.stringify(rightBiteValues));
    const chartData = {
      labels: biteLabels,
      datasets: [
        { data: leftBiteValues, color: () => 'rgba(0, 176, 118, 1)', strokeWidth: 2, index: 0 },
        { data: rightBiteValues, color: () => 'rgba(0, 122, 255, 1)', strokeWidth: 2, index: 1 }
      ],
      legend: ['Left', 'Right']
    };
    console.log('[processBiteForceChart] Setting Bite Force Chart Data:', JSON.stringify(chartData));
    setBiteForceData(chartData);
  };

  // Helper for HR chart
  const processHrChart = (hrmData: HRMPacket[]) => {
    console.log('[processHrChart] Received HRM Data:', JSON.stringify(hrmData));
    const hrProcessingResults = hrmData.map(p => {
        const rawValue = p.heartRate;
        const parsedValue = parseFloat(rawValue as any);
        console.log(`[processHrChart Map Debug] Raw: ${rawValue} (Type: ${typeof rawValue}), Parsed: ${parsedValue}, IsNaN: ${isNaN(parsedValue)}`);
        return { ...p, heartRate: parsedValue };
    });
    const validHrmData = hrProcessingResults.filter(p => {
        const isNum = !isNaN(p.heartRate);
        console.log(`[processHrChart Filter Debug] HR: ${p.heartRate}, IsValidNumber: ${isNum}`);
        return isNum;
    });
    console.log('[processHrChart] Parsed HR Objects:', JSON.stringify(hrProcessingResults));
    console.log('[processHrChart] Filtered Valid HRM Data:', JSON.stringify(validHrmData));

    if (validHrmData.length === 0) {
      console.log('[processHrChart] No valid HRM data found, setting empty chart.');
      setHrChartData({
        labels: [],
        datasets: [{
          data: [],
          color: () => 'rgba(255, 59, 48, 1)',
          strokeWidth: 2
        }]
      });
      return;
    }
    const sortedHrm = [...validHrmData].sort((a, b) => a.appTimestamp - b.appTimestamp);
    const hrLabels = sortedHrm.map((_, i) => i.toString());
    const hrValues = sortedHrm.map(p => p.heartRate); // Already parsed
    console.log('[processHrChart] Final HR Values for chart:', JSON.stringify(hrValues));
    const chartData = {
      labels: hrLabels,
      datasets: [{ 
        data: hrValues, 
        color: () => 'rgba(255, 59, 48, 1)', 
        strokeWidth: 2,
        index: 0
      }]
    };
    console.log('[processHrChart] Setting HR Chart Data:', JSON.stringify(chartData));
    setHrChartData(chartData);
  };

  // Helper for Temp chart
  const processTempChart = (htmData: HTMPacket[]) => {
    console.log('[processTempChart] Received HTM Data:', JSON.stringify(htmData));
    const validHtmData = htmData.filter(p => typeof p.temperature === 'number' && !isNaN(p.temperature));
    console.log('[processTempChart] Filtered Valid HTM Data:', JSON.stringify(validHtmData));

    if (validHtmData.length === 0) {
      console.log('[processTempChart] No valid HTM data found, setting empty chart.');
      setTempChartData({
        labels: [],
        datasets: [{
          data: [],
          color: () => 'rgba(255, 149, 0, 1)',
          strokeWidth: 2
        }]
      });
      return;
    }
    const sortedHtm = [...validHtmData].sort((a, b) => a.appTimestamp - b.appTimestamp);
    const tempLabels = sortedHtm.map((_, i) => i.toString());
    const tempValues = sortedHtm.map(p => p.temperature);
    console.log('[processTempChart] Final Temp Values:', JSON.stringify(tempValues));
    const chartData = {
      labels: tempLabels,
      datasets: [{ 
        data: tempValues, 
        color: () => 'rgba(255, 149, 0, 1)', 
        strokeWidth: 2,
        index: 0
      }]
    };
    console.log('[processTempChart] Setting Temp Chart Data:', JSON.stringify(chartData));
    setTempChartData(chartData);
  };

  // Fetch data on initial mount
  useEffect(() => {
    fetchData();
  }, [fetchData]); // fetchData is memoized with useCallback

  // Subscribe to data changes
  useEffect(() => {
    const handleDataChange = (eventData: { type: string, deviceId: string }) => {
      // Re-fetch data if the change affects the current device
      if (eventData.deviceId === deviceId) {
        console.log(`[ReportsDetailed] Data changed for device ${deviceId} (type: ${eventData.type}), re-fetching...`);
        fetchData();
      }
    };

    dataChangeEmitter.on(dbEvents.DATA_CHANGED, handleDataChange);
    console.log('[ReportsDetailed] Subscribed to data changes.');

    // Cleanup subscription on unmount
    return () => {
      dataChangeEmitter.off(dbEvents.DATA_CHANGED, handleDataChange);
      console.log('[ReportsDetailed] Unsubscribed from data changes.');
    };
  }, [deviceId, fetchData]); // Dependencies: deviceId and the memoized fetchData

  const renderSessionHistoryItem = ({ item }: { item: any }) => (
    <TouchableOpacity style={styles.historyItem}>
       <View style={styles.historyIconContainer}>
         <MaterialCommunityIcons name="history" size={20} color={THEME.primary} />
       </View>
       <View style={styles.historyInfo}>
         <Text style={styles.historyTitle}>{item.type} - {item.sport}</Text>
         <Text style={styles.historyDate}>{item.date} ({item.stats.duration})</Text>
       </View>
       <MaterialCommunityIcons name="chevron-right" size={20} color={THEME.text.tertiary} />
    </TouchableOpacity>
  );

  // Show loading indicator
  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={THEME.primary} />
        <Text style={styles.loadingText}>Loading Report Data...</Text>
      </View>
    );
  }

  // Show error message
  if (error) {
    return (
      <View style={styles.errorContainer}>
        <MaterialCommunityIcons name="alert-circle-outline" size={48} color={THEME.error} />
        <Text style={styles.errorTitle}>Error Loading Report</Text>
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={fetchData}>
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // Show message if no data
  if (!sessionStats && !impacts.length && !fsrPackets.length && !hrmPackets.length && !htmPackets.length) {
    return (
      <View style={styles.emptyContainer}>
        <MaterialCommunityIcons name="chart-bar-stacked" size={48} color={THEME.text.tertiary} />
        <Text style={styles.emptyText}>No Data Available</Text>
        <Text style={styles.emptySubText}>Generate test data or connect a device to see reports.</Text>
      </View>
    );
  }

  return (
    <SafeAreaProvider>
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <LinearGradient
            colors={['rgba(0,176,118,0.15)', 'rgba(0,176,118,0.05)', 'transparent']}
            style={styles.headerGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          />
          <View style={styles.headerContent}>
            <Text style={styles.headerTitle}>Detailed Report</Text>
            {/* Maybe add session selector here later */}
          </View>
        </View>

        {/* Session Info Card */}
        <GlassCard style={styles.card}>
           <View style={styles.cardInner}>
             <Text style={styles.cardTitle}>Session Report ({deviceId})</Text>
             <Text style={styles.cardSubtitle}>Total Impacts: {sessionStats?.totalImpacts ?? '--'}</Text>
             <Text style={styles.cardSubtitle}>Max G-Force: {sessionStats?.maxG ?? '--'}g</Text>
             <Text style={styles.cardSubtitle}>Avg G-Force: {sessionStats?.avgG ?? '--'}g</Text>
             <Text style={styles.cardSubtitle}>High Impacts ({'>'}80g): {sessionStats?.highImpacts ?? '--'}</Text>
           </View>
        </GlassCard>

        {/* Metrics Grid/List */}
        <View style={styles.metricsGrid}>
          {/* Heart Rate */}
          <GlassCard style={[styles.metricCard, styles.metricCardFull] as unknown as ViewStyle}>
            <View style={styles.metricContent}>
              <MaterialCommunityIcons name="heart-pulse" size={28} color={THEME.primary} />
              <Text style={styles.metricLabel}>Heart Rate</Text>
              <Text style={styles.largeMetricValue}>{sessionStats?.avgHr ?? '--'} <Text style={styles.largeMetricUnit}>bpm</Text></Text>
              <Text style={styles.metricValueSub}>Avg: {sessionStats?.avgHr ?? '--'} bpm / Max: {sessionStats?.maxHr ?? '--'} bpm</Text>
              {hrChartData && (
                <SafeLineChart
                  data={hrChartData}
                  emptyMessage="No heart rate data available"
                  width={Dimensions.get('window').width - 80}
                  height={150}
                  bezier
                  style={{ marginTop: 16 }}
                />
              )}
            </View>
          </GlassCard>

          {/* Temperature */}
          <GlassCard style={[styles.metricCard, styles.metricCardFull] as unknown as ViewStyle}>
            <View style={styles.metricContent}>
              <MaterialCommunityIcons name="thermometer" size={28} color={THEME.primary} />
              <Text style={styles.metricLabel}>Avg Temperature</Text>
              <Text style={styles.largeMetricValue}>{sessionStats?.avgTemp ?? '--'}<Text style={styles.largeMetricUnit}>°F</Text></Text>
              {tempChartData && (
                <SafeLineChart
                  data={tempChartData}
                  emptyMessage="No temperature data available"
                  width={Dimensions.get('window').width - 80}
                  height={150}
                  bezier
                  style={{ marginTop: 16 }}
                />
              )}
            </View>
          </GlassCard>

          {/* Bite Force */}
          <GlassCard style={[styles.metricCard, styles.metricCardFull] as unknown as ViewStyle}>
            <View style={styles.metricContent}>
              <MaterialCommunityIcons name="tooth-outline" size={28} color={THEME.info} />
              <Text style={styles.metricLabel}>Bite Force (Left/Right)</Text>
              <Text style={styles.largeMetricValue}>{sessionStats?.avgBite ?? '--'} <Text style={styles.largeMetricUnit}>(Avg)</Text></Text>
              <SafeLineChart
                data={biteForceData}
                emptyMessage="No bite force data available"
                width={Dimensions.get('window').width - 80}
                height={150}
                bezier
                style={{ marginTop: 16 }}
              />
            </View>
          </GlassCard>

          {/* Concussion Risk */}
          <GlassCard style={[styles.metricCard, styles.metricCardFull] as unknown as ViewStyle}>
            <View style={styles.metricContent}>
              <MaterialCommunityIcons name="shield-alert-outline" size={28} color={getRiskStyle(sessionStats?.concussionRisk).color} />
              <Text style={styles.metricLabel}>Concussion Risk</Text>
              <Text style={[styles.largeMetricValue, getRiskStyle(sessionStats?.concussionRisk)]}>
                {sessionStats?.concussionRisk ?? 'N/A'}
              </Text>
            </View>
          </GlassCard>

          {/* Impact Timeline Card */}
          <GlassCard style={[styles.metricCard, styles.metricCardFull] as unknown as ViewStyle}>
            <View style={styles.metricContent}>
              <MaterialCommunityIcons name="chart-timeline-variant" size={28} color={THEME.primary} />
              <Text style={styles.metricLabel}>Impact Timeline</Text>
              <SafeLineChart
                data={impactTimelineData}
                emptyMessage="No impact data available"
                width={Dimensions.get('window').width - 80}
                height={150}
                bezier={false}
                style={{ marginTop: 16 }}
              />
            </View>
          </GlassCard>

          {/* Severity Distribution Card */}
          <GlassCard style={[styles.metricCard, styles.metricCardFull] as unknown as ViewStyle}>
            <View style={styles.metricContent}>
              <MaterialCommunityIcons name="chart-histogram" size={28} color={THEME.primary} />
              <Text style={styles.metricLabel}>Severity Distribution</Text>
              <SafeLineChart
                data={severityDistData}
                emptyMessage="No impact data available"
                width={Dimensions.get('window').width - 80}
                height={150}
                bezier={false}
                style={{ marginTop: 16 }}
              />
            </View>
          </GlassCard>

          {/* CHIE Card */}
          <GlassCard style={[styles.metricCard, styles.metricCardFull] as unknown as ViewStyle}>
            <View style={styles.metricContent}>
              <MaterialCommunityIcons name="brain" size={28} color={THEME.primary} />
              <Text style={styles.metricLabel}>Cumulative Head Impact Exposure</Text>
              <SafeLineChart
                data={chieData}
                emptyMessage="No impact data available"
                width={Dimensions.get('window').width - 80}
                height={150}
                bezier
                style={{ marginTop: 16 }}
              />
            </View>
          </GlassCard>
        </View>

        {/* Bottom Spacer */}
        <View style={{ height: 24 }} />
      </ScrollView>
    </SafeAreaProvider>
  );
}

// Add extensive styling - Adapt styles from index.tsx, devices.tsx
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: THEME.background,
  },
  contentContainer: {
    paddingBottom: 32,
  },
  header: {
    height: 140, // Keep consistent header size
    position: 'relative',
    marginBottom: 20,
  },
  headerGradient: {
    ...StyleSheet.absoluteFillObject,
  },
  headerContent: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 16, // Adjust as needed for safe area
    justifyContent: 'center', // Center title for this screen
  },
  headerTitle: {
    fontSize: 34,
    fontWeight: '700',
    color: THEME.text.primary,
    letterSpacing: 0.5,
    textAlign: 'center', // Center align
  },
  card: { // Style for general cards
    marginHorizontal: 16,
    marginBottom: 16,
  },
  cardInner: {
    padding: 16,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: THEME.text.primary,
    marginBottom: 8,
  },
  cardSubtitle: {
      fontSize: 14,
      color: THEME.text.secondary,
      marginBottom: 4,
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginHorizontal: 16,
    marginBottom: 16,
  },
  metricCard: {
    width: '48%', // Two columns layout
    marginBottom: 16,
    minHeight: 130, // Ensure cards have a minimum height
  },
  metricCardFull: {
      width: '100%', // Span full width
  },
  metricContent: {
    flex: 1, // Ensure content takes up space
    alignItems: 'center',
    justifyContent: 'flex-start', // Align top for charts
    padding: 16, // Increased padding maybe
  },
  metricLabel: {
    fontSize: 14,
    color: THEME.text.secondary,
    marginTop: 8,
    textAlign: 'center',
  },
  largeMetricValue: {
    fontSize: 36, // Larger font size
    fontWeight: '600',
    color: THEME.text.primary,
    textAlign: 'center',
    marginTop: 8, // Add some space above
    marginBottom: 4, // Space below before sub-text or chart
  },
  largeMetricUnit: {
    fontSize: 16, // Smaller unit text
    fontWeight: '500',
    color: THEME.text.secondary,
  },
  metricValueSub: { // Keep existing for max values etc.
    fontSize: 14,
    fontWeight: '500',
    color: THEME.text.secondary,
    marginTop: 2,
    marginBottom: 8, // Space before chart
    textAlign: 'center',
  },
  riskHigh: { color: THEME.error, fontWeight: 'bold' },
  riskModerate: { color: THEME.warning, fontWeight: 'bold' },
  riskLow: { color: THEME.primary, fontWeight: 'normal' }, // Or success color
  historyItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
  },
  historyIconContainer: {
      width: 36,
      height: 36,
      borderRadius: 18,
      backgroundColor: 'rgba(0,176,118,0.1)',
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: 12,
  },
  historyInfo: {
      flex: 1,
  },
  historyTitle:{
      fontSize: 15,
      fontWeight: '500',
      color: THEME.text.primary,
      marginBottom: 2,
  },
  historyDate:{
      fontSize: 13,
      color: THEME.text.secondary,
  },
  separator: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: THEME.divider,
    marginVertical: 4,
  },
  // Fallback style for GlassCard if needed
  glassCardFallback: {
    borderRadius: 16,
    backgroundColor: THEME.cardBackground,
    borderColor: THEME.card.border,
    borderWidth: 1,
    shadowColor: THEME.card.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
    // remove marginBottom if applying via parent style
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: THEME.background,
  },
  loadingText: {
    marginTop: 10,
    color: THEME.text.secondary,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: THEME.background,
    padding: 20,
  },
  errorTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: THEME.error,
    marginBottom: 8,
    textAlign: 'center',
  },
  errorText: {
    color: THEME.text.secondary,
    textAlign: 'center',
    marginBottom: 20,
  },
  retryButton: {
    backgroundColor: THEME.primary,
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
    minHeight: 300, // Ensure it takes some space
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: THEME.text.primary,
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubText: {
    fontSize: 14,
    color: THEME.text.secondary,
    textAlign: 'center',
  },
}); 