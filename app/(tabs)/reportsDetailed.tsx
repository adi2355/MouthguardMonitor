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

// Safe wrapper for LineChart that ensures proper dataset format
const SafeLineChart = ({ data, emptyMessage = "No data available", ...props }) => {
  // Determine if there is actual data to render
  const hasActualData = data && 
                       data.datasets && 
                       data.datasets.some((ds) => ds.data && ds.data.length > 0 && 
                                                 ds.data.some((val) => val !== null && val !== undefined));

  // Don't render if no data structure at all
  if (!data || !data.datasets) {
    return <Text style={styles.emptyChartText}>{emptyMessage}</Text>;
  }

  // If datasets exist but are empty, show empty message
  if (!hasActualData) {
    return <Text style={styles.emptyChartText}>{emptyMessage}</Text>;
  }

  // Create a safe data structure with properly formatted datasets
  const safeData = {
    labels: data.labels || [],
    datasets: data.datasets.map((dataset, index) => ({
      data: dataset.data || [],
      color: dataset.color || (() => 'rgba(0, 176, 118, 1)'),
      strokeWidth: dataset.strokeWidth || 2,
      index: index // Ensure index is set
    })),
    legend: data.legend || undefined
  };

  return (
    <LineChart 
      data={safeData}
      withDots={false}
      bezier={props.bezier !== undefined ? props.bezier : true}
      chartConfig={{
        backgroundColor: 'transparent',
        backgroundGradientFrom: 'transparent',
        backgroundGradientTo: 'transparent',
        fillShadowGradientFrom: safeData.datasets[0].color(0.8),
        fillShadowGradientTo: 'rgba(255, 255, 255, 0)',
        decimalPlaces: 0,
        color: (opacity = 1) => safeData.datasets[0].color(opacity),
        labelColor: (opacity = 1) => `rgba(80, 80, 80, ${opacity})`,
        propsForBackgroundLines: {
          strokeDasharray: '4, 4',
          strokeWidth: 0.5,
          stroke: 'rgba(0, 0, 0, 0.05)',
        },
      }}
      {...props} 
    />
  );
};

// Enhanced GlassCard component with improved styling
const GlassCard = ({ style, children, intensity = 15 }) => {
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
  const sensorDataRepository = useSensorDataRepository(); // Get the repository

  // Animation values
  const fadeAnim = React.useRef(new Animated.Value(0)).current;

  // State for storing fetched data
  const [impacts, setImpacts] = useState([]);
  const [motionPackets, setMotionPackets] = useState([]);
  const [fsrPackets, setFsrPackets] = useState([]);
  const [hrmPackets, setHrmPackets] = useState([]);
  const [htmPackets, setHtmPackets] = useState([]);

  // State for aggregated stats
  const [sessionStats, setSessionStats] = useState(null);
  const [impactTimelineData, setImpactTimelineData] = useState(null);
  const [severityDistData, setSeverityDistData] = useState(null);
  const [chieData, setChieData] = useState(null);
  const [directionData, setDirectionData] = useState(null);
  const [biteForceData, setBiteForceData] = useState(null);
  const [hrChartData, setHrChartData] = useState(null);
  const [tempChartData, setTempChartData] = useState(null);

  // Loading and error states
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Assume single device for now
  const deviceId = DEVICE_ID_SIM;

  const getRiskStyle = (risk) => {
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

      // --- Store Raw Data (only when necessary for rendering) ---
      // We only need impacts for the direction visualization which requires the raw data
      setImpacts(fetchedImpacts);
      
      // These are only used for processing and can be passed directly to processAndSetChartData
      // without storing in state
      // setMotionPackets(fetchedMotion);
      // setFsrPackets(fetchedFsr);
      // setHrmPackets(fetchedHrm);
      // setHtmPackets(fetchedHtm);

      console.log(`[ReportsDetailed] Fetched ${fetchedImpacts.length} impacts, ${fetchedMotion.length} motion, ${fetchedFsr.length} fsr, ${fetchedHrm.length} hrm, ${fetchedHtm.length} htm packets.`);

      // --- Process Data for Charts and KPIs ---
      processAndSetChartData(
        fetchedImpacts,
        fetchedFsr,
        fetchedHrm,
        fetchedHtm
      );

      // Animate cards in
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }).start();

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
    impactData,
    fsrData,
    hrmData,
    htmData
  ) => {
    console.log('[ReportsDetailed] Processing data...');
    
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
      
      // Calculate Avg HR
      const validHrs = hrmData.map(p => {
        const rawValue = p.heartRate;
        const parsedValue = parseFloat(rawValue);
        return !isNaN(parsedValue) ? parsedValue : null;
      }).filter(hr => hr !== null);
      
      const avgHrValue = validHrs.length > 0 ? (validHrs.reduce((a, b) => a + b, 0) / validHrs.length) : NaN;
      const maxHrValue = validHrs.length > 0 ? Math.max(...validHrs) : NaN;

      // Calculate Avg Temp
      const validTemps = htmData.map(p => p.temperature).filter(t => typeof t === 'number' && !isNaN(t));
      const avgTempValue = validTemps.length > 0 ? (validTemps.reduce((a, b) => a + b, 0) / validTemps.length) : NaN;

      // Calculate Avg Bite Force
      const validLeftBites = fsrData.map(p => p.left_bite).filter(b => typeof b === 'number' && !isNaN(b));
      const validRightBites = fsrData.map(p => p.right_bite).filter(b => typeof b === 'number' && !isNaN(b));
      const allValidBites = [...validLeftBites, ...validRightBites];
      const avgBiteValue = allValidBites.length > 0 ? (allValidBites.reduce((a, b) => a + b, 0) / allValidBites.length) : NaN;

      // Set basic session stats
      const basicStats = {
        totalImpacts: 0,
        maxG: 0,
        avgG: 0,
        highImpacts: 0,
        avgHr: !isNaN(avgHrValue) ? avgHrValue.toFixed(0) : '--',
        maxHr: !isNaN(maxHrValue) ? maxHrValue.toFixed(0) : '--',
        avgTemp: !isNaN(avgTempValue) ? avgTempValue.toFixed(1) : '--', 
        avgBite: !isNaN(avgBiteValue) ? avgBiteValue.toFixed(0) : '--',
        concussionRisk: 'Low',
        duration: "N/A", 
        caloriesBurned: "N/A", 
        acceleration: "N/A", 
        biteForce: !isNaN(avgBiteValue) ? avgBiteValue.toFixed(0) : '--',
      };
      
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

    // Calculate HR stats
    const validHrs = hrmData.map(p => {
      const rawValue = p.heartRate;
      const parsedValue = parseFloat(rawValue);
      return !isNaN(parsedValue) ? parsedValue : null;
    }).filter(hr => hr !== null);
    
    const avgHrValue = validHrs.length > 0 ? (validHrs.reduce((a, b) => a + b, 0) / validHrs.length) : NaN;
    const maxHrValue = validHrs.length > 0 ? Math.max(...validHrs) : NaN;

    // Calculate Avg Temp
    const validTemps = htmData.map(p => p.temperature).filter(t => typeof t === 'number' && !isNaN(t));
    const avgTempValue = validTemps.length > 0 ? (validTemps.reduce((a, b) => a + b, 0) / validTemps.length) : NaN;

    // Calculate Avg Bite Force
    const validLeftBites = fsrData.map(p => p.left_bite).filter(b => typeof b === 'number' && !isNaN(b));
    const validRightBites = fsrData.map(p => p.right_bite).filter(b => typeof b === 'number' && !isNaN(b));
    const allValidBites = [...validLeftBites, ...validRightBites];
    const avgBiteValue = allValidBites.length > 0 ? (allValidBites.reduce((a, b) => a + b, 0) / allValidBites.length) : NaN;

    const calculatedStats = {
      totalImpacts,
      maxG: maxG.toFixed(1),
      avgG: avgG.toFixed(1),
      highImpacts,
      avgHr: !isNaN(avgHrValue) ? avgHrValue.toFixed(0) : '--',
      maxHr: !isNaN(maxHrValue) ? maxHrValue.toFixed(0) : '--',
      avgTemp: !isNaN(avgTempValue) ? avgTempValue.toFixed(1) : '--',
      avgBite: !isNaN(avgBiteValue) ? avgBiteValue.toFixed(0) : '--',
      concussionRisk: highImpacts > 0 || maxG > 100 ? 'High' : (maxG > 80 ? 'Moderate' : 'Low'),
      duration: "N/A",
      caloriesBurned: "N/A",
      acceleration: "N/A",
      biteForce: !isNaN(avgBiteValue) ? avgBiteValue.toFixed(0) : '--',
    };
    
    setSessionStats(calculatedStats);

    // 2. Process Impact Timeline Data
    const sortedImpacts = [...impactData].sort((a, b) => a.timestamp - b.timestamp);
    // Apply subsampling for better performance
    const subsampledImpacts = subsampleData(sortedImpacts);
    const timelineLabels = subsampledImpacts.map((_, i) => i.toString());
    const timelineValues = subsampledImpacts.map(i => i.magnitude);
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
    
    // Then subsample the results for display
    const subsampledChieValues = subsampleData(chieValues);
    const chieLabels = Array.from({ length: subsampledChieValues.length }, (_, i) => i.toString());
    
    setChieData({
      labels: chieLabels,
      datasets: [{ 
        data: subsampledChieValues, 
        color: () => 'rgba(0, 122, 255, 1)', 
        strokeWidth: 2,
        index: 0
      }]
    });

    // 5. Process Direction Data
    const directions = impactData.map(impact => ({
      x: impact.x,
      y: impact.y,
      magnitude: impact.magnitude
    }));
    setDirectionData(directions);

    // 6. Process Bite Force Chart
    processBiteForceChart(fsrData);
    // 7. Process HR Chart
    processHrChart(hrmData);
    // 8. Process Temp Chart
    processTempChart(htmData);

    console.log('[ReportsDetailed] Data processing complete.');
  };

  // Helper function to subsample large datasets
  const subsampleData = (data, maxPoints = 100) => {
    if (!data || data.length <= maxPoints) return data;
    
    const step = Math.ceil(data.length / maxPoints);
    const result = [];
    
    for (let i = 0; i < data.length; i += step) {
      result.push(data[i]);
    }
    
    return result;
  };

  // Helper for HR chart
  const processHrChart = (hrmData) => {
    const validHrmData = hrmData.map(p => {
        const parsedValue = parseFloat(p.heartRate);
        return { ...p, heartRate: !isNaN(parsedValue) ? parsedValue : null };
    }).filter(p => p.heartRate !== null);

    if (validHrmData.length === 0) {
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
    
    // Sort and subsample for better performance
    const sortedHrm = [...validHrmData].sort((a, b) => a.appTimestamp - b.appTimestamp);
    const subsampledHrm = subsampleData(sortedHrm);
    
    const hrLabels = subsampledHrm.map((_, i) => i.toString());
    const hrValues = subsampledHrm.map(p => p.heartRate);
    
    const chartData = {
      labels: hrLabels,
      datasets: [{ 
        data: hrValues, 
        color: () => 'rgba(255, 59, 48, 1)', 
        strokeWidth: 2,
        index: 0
      }]
    };
    
    setHrChartData(chartData);
  };

  // Helper for Temp chart
  const processTempChart = (htmData) => {
    const validHtmData = htmData.filter(p => typeof p.temperature === 'number' && !isNaN(p.temperature));

    if (validHtmData.length === 0) {
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
    
    // Sort and subsample for better performance
    const sortedHtm = [...validHtmData].sort((a, b) => a.appTimestamp - b.appTimestamp);
    const subsampledHtm = subsampleData(sortedHtm);
    
    const tempLabels = subsampledHtm.map((_, i) => i.toString());
    const tempValues = subsampledHtm.map(p => p.temperature);
    
    const chartData = {
      labels: tempLabels,
      datasets: [{ 
        data: tempValues, 
        color: () => 'rgba(255, 149, 0, 1)', 
        strokeWidth: 2,
        index: 0
      }]
    };
    
    setTempChartData(chartData);
  };

  // Helper function for bite force chart data
  const processBiteForceChart = (fsrData) => {
    const validFsrData = fsrData.filter(p => 
        (typeof p.left_bite === 'number' && !isNaN(p.left_bite)) || 
        (typeof p.right_bite === 'number' && !isNaN(p.right_bite))
    );
    
    if (validFsrData.length === 0) {
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
    
    // Sort and subsample for better performance
    const sortedFsr = [...validFsrData].sort((a, b) => a.timestamp - b.timestamp);
    const subsampledFsr = subsampleData(sortedFsr);
    
    const biteLabels = subsampledFsr.map((_, i) => i.toString());
    const leftBiteValues = subsampledFsr.map(p => typeof p.left_bite === 'number' ? p.left_bite : 0);
    const rightBiteValues = subsampledFsr.map(p => typeof p.right_bite === 'number' ? p.right_bite : 0);
    
    const chartData = {
      labels: biteLabels,
      datasets: [
        { data: leftBiteValues, color: () => 'rgba(0, 176, 118, 1)', strokeWidth: 2, index: 0 },
        { data: rightBiteValues, color: () => 'rgba(0, 122, 255, 1)', strokeWidth: 2, index: 1 }
      ],
      legend: ['Left', 'Right']
    };
    
    setBiteForceData(chartData);
  };

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
    const handleDataChange = (eventData) => {
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
  }, [deviceId, debouncedFetchData]); // Add debouncedFetchData to dependencies

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
      !biteForceData?.datasets?.[0]?.data?.length && 
      !hrChartData?.datasets?.[0]?.data?.length && 
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

          {/* Heart Rate Card - Refined */}
          <Animated.View style={{opacity: fadeAnim, transform: [{translateY: fadeAnim.interpolate({
            inputRange: [0, 1],
            outputRange: [20, 0]
          })}], marginTop: 8}}>
            <GlassCard style={styles.dataCard}>
              <View style={styles.cardHeader}>
                <View style={[styles.iconContainer, {backgroundColor: 'rgba(255, 59, 48, 0.1)'}]}>
                  <MaterialCommunityIcons name="heart-pulse" size={20} color="rgba(255, 59, 48, 1)" />
                </View>
                <Text style={styles.cardTitle}>Heart Rate</Text>
              </View>
              
              <View style={styles.dataValueContainer}>
                <Text style={styles.dataValue}>{sessionStats?.avgHr ?? '--'}</Text>
                <Text style={styles.dataUnit}>bpm</Text>
              </View>
              
              <Text style={styles.dataSubtext}>Avg: {sessionStats?.avgHr ?? '--'} bpm / Max: {sessionStats?.maxHr ?? '--'} bpm</Text>
              
              <View style={styles.chartContainer}>
                {hrChartData && (
                  <SafeLineChart
                    data={hrChartData}
                    emptyMessage="No heart rate data available"
                    width={Dimensions.get('window').width - 64}
                    height={120}
                    bezier={false}
                  />
                )}
              </View>
            </GlassCard>
          </Animated.View>

          {/* Temperature Card - Refined */}
          <Animated.View style={{opacity: fadeAnim, transform: [{translateY: fadeAnim.interpolate({
            inputRange: [0, 1],
            outputRange: [20, 0]
          })}], marginTop: 8}}>
            <GlassCard style={styles.dataCard}>
              <View style={styles.cardHeader}>
                <View style={[styles.iconContainer, {backgroundColor: 'rgba(255, 149, 0, 0.1)'}]}>
                  <MaterialCommunityIcons name="thermometer" size={20} color="rgba(255, 149, 0, 1)" />
                </View>
                <Text style={styles.cardTitle}>Avg Temperature</Text>
              </View>
              
              <View style={styles.dataValueContainer}>
                <Text style={styles.dataValue}>{sessionStats?.avgTemp ?? '--'}</Text>
                <Text style={styles.dataUnit}>°F</Text>
              </View>
              
              <View style={styles.chartContainer}>
                {tempChartData && (
                  <SafeLineChart
                    data={tempChartData}
                    emptyMessage="No temperature data available"
                    width={Dimensions.get('window').width - 64}
                    height={120}
                    bezier={false}
                  />
                )}
              </View>
            </GlassCard>
          </Animated.View>

          {/* Bite Force Card - Refined */}
          <Animated.View style={{opacity: fadeAnim, transform: [{translateY: fadeAnim.interpolate({
            inputRange: [0, 1],
            outputRange: [20, 0]
          })}], marginTop: 8}}>
            <GlassCard style={styles.dataCard}>
              <View style={styles.cardHeader}>
                <View style={[styles.iconContainer, {backgroundColor: 'rgba(0, 122, 255, 0.1)'}]}>
                  <MaterialCommunityIcons name="tooth-outline" size={20} color="rgba(0, 122, 255, 1)" />
                </View>
                <Text style={styles.cardTitle}>Bite Force (Left/Right)</Text>
              </View>
              
              <View style={styles.dataValueContainer}>
                <Text style={styles.dataValue}>{sessionStats?.avgBite ?? '--'}</Text>
                <Text style={styles.dataUnit}>(Avg)</Text>
              </View>
              
              {biteForceData && biteForceData.datasets[0].data.length > 0 && (
                <View style={styles.legendContainer}>
                  <View style={styles.legendItem}>
                    <View style={[styles.legendDot, {backgroundColor: 'rgba(0, 176, 118, 1)'}]} />
                    <Text style={styles.legendText}>Left</Text>
                  </View>
                  <View style={styles.legendItem}>
                    <View style={[styles.legendDot, {backgroundColor: 'rgba(0, 122, 255, 1)'}]} />
                    <Text style={styles.legendText}>Right</Text>
                  </View>
                </View>
              )}
              
              <View style={styles.chartContainer}>
                {biteForceData && (
                  <SafeLineChart
                    data={biteForceData}
                    emptyMessage="No bite force data available"
                    width={Dimensions.get('window').width - 64}
                    height={120}
                    bezier={false}
                  />
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
              
              <View style={styles.riskValueContainer}>
                <Text style={[styles.riskValue, getRiskStyle(sessionStats?.concussionRisk)]}>
                  {sessionStats?.concussionRisk ?? 'Low'}
                </Text>
              </View>
            </GlassCard>
          </Animated.View>

          {/* Impact Timeline Card - Refined */}
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
                {impactTimelineData && impactTimelineData.datasets[0].data.length > 0 ? (
                  <SafeLineChart
                    data={impactTimelineData}
                    width={Dimensions.get('window').width - 64}
                    height={120}
                    bezier={false}
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
                {severityDistData && severityDistData.datasets[0].data.length > 0 ? (
                  <SafeLineChart
                    data={severityDistData}
                    width={Dimensions.get('window').width - 64}
                    height={120}
                    bezier={false}
                  />
                ) : (
                  <Text style={styles.emptyChartText}>No impact data available</Text>
                )}
              </View>
            </GlassCard>
          </Animated.View>

          {/* CHIE Card - Refined */}
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
                {chieData && chieData.datasets[0].data.length > 0 ? (
                  <SafeLineChart
                    data={chieData}
                    width={Dimensions.get('window').width - 64}
                    height={120}
                    bezier
                  />
                ) : (
                  <Text style={styles.emptyChartText}>No impact data available</Text>
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
  riskCard: {
    minHeight: 120,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
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