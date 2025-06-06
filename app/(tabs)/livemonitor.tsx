import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  ActivityIndicator, 
  TouchableOpacity, 
  Platform,
  RefreshControl 
} from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { COLORS } from '@/src/constants';
import { useBluetoothService, useSensorDataRepository } from '@/src/providers/AppProvider';
import { DeviceStatus, LiveDataPoint } from '@/src/types';
import LineChart from '../components/charts/LineChart';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { throttle } from 'lodash';
import { useSession } from '@/src/contexts/SessionContext';
import { dataChangeEmitter, dbEvents } from '@/src/utils/EventEmitter';

// Maximum number of data points to keep per device
const MAX_DATA_POINTS = 50; // Increased for smoother scrollable charts
const THROTTLE_INTERVAL = 250; // Update UI max 4 times per second

// Custom theme colors to match the beige theme from index.tsx
const THEME = {
  background: '#f2efe4', // Beige background matching bottom bar
  cardBackground: '#ffffff',
  primary: '#00b076', // Green primary color
  text: {
    primary: '#333333',
    secondary: '#666666',
    tertiary: '#999999',
  },
  divider: 'rgba(0,0,0,0.08)',
  card: {
    shadow: 'rgba(0,0,0,0.12)',
    border: 'rgba(0,0,0,0.05)',
  }
};

// Premium Glass Card component with proper types
const GlassCard: React.FC<{style?: any, children: React.ReactNode, intensity?: number}> = 
  ({ style, children, intensity = 15 }) => {
  return Platform.OS === 'ios' ? (
    <BlurView intensity={intensity} tint="light" style={[styles.glassCard, style]}>
      {children}
    </BlurView>
  ) : (
    <View style={[styles.glassCardFallback, style]}>
      {children}
    </View>
  );
};

export default function LiveMonitorScreen() {
  const [connectedDevices, setConnectedDevices] = useState<DeviceStatus[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [liveData, setLiveData] = useState<Record<string, LiveDataPoint[]>>({});
  const [serviceReady, setServiceReady] = useState(false);
  
  // Add session context
  const { activeSession, isSessionActive } = useSession();
  const sensorDataRepository = useSensorDataRepository();
  const bluetoothService = useBluetoothService();
  
  // Create throttled state updater with proper typing
  const throttledSetLiveData = useRef(
    throttle((updater: React.SetStateAction<Record<string, LiveDataPoint[]>>) => {
      setLiveData(updater);
    }, THROTTLE_INTERVAL, { leading: true, trailing: true })
  ).current;
  
  // Check if bluetoothService is available and set serviceReady state
  useEffect(() => {
    setServiceReady(!!bluetoothService && !!sensorDataRepository);
  }, [bluetoothService, sensorDataRepository]);
  
  // Reference to store sensor data subscriptions - updated to match the correct return type
  const sensorDataSubscriptionRef = useRef<any>(null);
  
  // Fetch initial force data from DB
  const fetchForceData = useCallback(async (deviceId: string) => {
    if (!sensorDataRepository || !activeSession?.id) return;
    
    try {
      console.log(`[LiveMonitor] Fetching initial force data for device ${deviceId}`);
      const options = { sessionId: activeSession.id, limit: MAX_DATA_POINTS };
      const forceData = await sensorDataRepository.getSensorData(deviceId, 'fsr_packets', options);
      
      if (forceData && forceData.length > 0) {
        console.log(`[LiveMonitor] Retrieved ${forceData.length} force data points`);
        
        // Convert to LiveDataPoint format
        const formattedData: LiveDataPoint[] = forceData.map(data => ({
          timestamp: data.appTimestamp || data.timestamp,
          deviceId: deviceId,
          type: 'force',
          values: [data.left_bite || 0, data.right_bite || 0]
        }));
        
        // Update liveData state with force data
        setLiveData(prev => {
          return {
            ...prev,
            [deviceId]: [...(prev[deviceId] || []), ...formattedData].slice(-MAX_DATA_POINTS)
          };
        });
      } else {
        console.log(`[LiveMonitor] No force data available yet for device ${deviceId}`);
      }
    } catch (error) {
      console.error('[LiveMonitor] Error fetching force data:', error);
    }
  }, [sensorDataRepository, activeSession]);
  
  // Fetch initial heart rate data from DB
  const fetchHeartRateData = useCallback(async (deviceId: string) => {
    if (!sensorDataRepository || !activeSession?.id) return;
    
    try {
      console.log(`[LiveMonitor] Fetching initial heart rate data for device ${deviceId}`);
      const options = { sessionId: activeSession.id, limit: MAX_DATA_POINTS };
      const heartRateData = await sensorDataRepository.getSensorData(deviceId, 'hrm_packets', options);
      
      if (heartRateData && heartRateData.length > 0) {
        console.log(`[LiveMonitor] Retrieved ${heartRateData.length} heart rate data points`);
        
        // Convert to LiveDataPoint format
        const formattedData: LiveDataPoint[] = heartRateData.map(data => ({
          timestamp: data.appTimestamp || data.timestamp,
          deviceId: deviceId,
          type: 'heartRate',
          values: [data.heart_rate || 0]
        }));
        
        // Update liveData state with heart rate data
        setLiveData(prev => {
          return {
            ...prev,
            [deviceId]: [...(prev[deviceId] || []), ...formattedData].slice(-MAX_DATA_POINTS)
          };
        });
      } else {
        console.log(`[LiveMonitor] No heart rate data available yet for device ${deviceId}`);
      }
    } catch (error) {
      console.error('[LiveMonitor] Error fetching heart rate data:', error);
    }
  }, [sensorDataRepository, activeSession]);
  
  // Fetch initial temperature data from DB
  const fetchTemperatureData = useCallback(async (deviceId: string) => {
    if (!sensorDataRepository || !activeSession?.id) return;
    
    try {
      console.log(`[LiveMonitor] Fetching initial temperature data for device ${deviceId}`);
      const options = { sessionId: activeSession.id, limit: MAX_DATA_POINTS };
      const temperatureData = await sensorDataRepository.getSensorData(deviceId, 'htm_packets', options);
      
      if (temperatureData && temperatureData.length > 0) {
        console.log(`[LiveMonitor] Retrieved ${temperatureData.length} temperature data points`);
        
        // Convert to LiveDataPoint format
        const formattedData: LiveDataPoint[] = temperatureData.map(data => ({
          timestamp: data.appTimestamp || data.timestamp,
          deviceId: deviceId,
          type: 'temperature',
          values: [data.temperature || 0]
        }));
        
        // Update liveData state with temperature data
        setLiveData(prev => {
          return {
            ...prev,
            [deviceId]: [...(prev[deviceId] || []), ...formattedData].slice(-MAX_DATA_POINTS)
          };
        });
      } else {
        console.log(`[LiveMonitor] No temperature data available yet for device ${deviceId}`);
      }
    } catch (error) {
      console.error('[LiveMonitor] Error fetching temperature data:', error);
    }
  }, [sensorDataRepository, activeSession]);
  
  // Initialize device status and data
  useEffect(() => {
    console.log('[LiveMonitorScreen] useEffect running. Subscribing...');

    // Skip if bluetoothService is not available
    if (!bluetoothService) {
      // Keep loading state true until service is available
      return;
    }

    // Flag to prevent setting loading state multiple times if updates come fast
    let initialLoadComplete = false;
    
    // Subscribe to device status updates
    const subscription = bluetoothService.subscribeToDeviceStatusUpdates((deviceStatus: DeviceStatus) => {
      console.log('[LiveMonitorScreen] Device Status Update Received:', deviceStatus);
      
      if (deviceStatus.connected) {
        // Fetch initial data for newly connected device
        fetchForceData(deviceStatus.id);
        fetchHeartRateData(deviceStatus.id);
        fetchTemperatureData(deviceStatus.id);
      }
      
      setConnectedDevices(prevDevices => {
        // Update or add device
        const updatedDevices = [...prevDevices];
        const existingIndex = updatedDevices.findIndex(d => d.id === deviceStatus.id);
        
        if (existingIndex >= 0) {
          updatedDevices[existingIndex] = deviceStatus;
        } else if (deviceStatus.connected) {
          updatedDevices.push(deviceStatus);
        }
        
        // Filter out disconnected devices
        return updatedDevices.filter(d => d.connected);
      });
      
      // Set loading to false ONCE on the first update received
      if (!initialLoadComplete) {
        setLoading(false);
        initialLoadComplete = true;
        console.log('[LiveMonitorScreen] Initial load complete via status update.');
      }
    });
    
    // Subscribe to sensor data updates - using throttled updates now
    const unsubscribeSensorData = bluetoothService.subscribeSensorData((deviceId: string, dataPoint: LiveDataPoint) => {
      console.log(`[LiveMonitor] Received sensor data: ${dataPoint.type} from ${deviceId}`);
      
      // Add debug logs for received data values
      if (dataPoint.values && dataPoint.values.length > 0) {
        console.log(`[LiveMonitor] Data values: ${JSON.stringify(dataPoint.values)}`);
      }
      
      // Use throttled function to update state
      throttledSetLiveData((prevData: Record<string, LiveDataPoint[]>) => {
        // Initialize array for this device if it doesn't exist
        const deviceData = prevData[deviceId] || [];
        
        // Add new data point and limit length
        const updatedData = [...deviceData, dataPoint];
        
        // Limit data points after adding the new one
        while (updatedData.length > MAX_DATA_POINTS) {
          updatedData.shift(); // Remove oldest data point
        }
        
        return {
          ...prevData,
          [deviceId]: updatedData
        };
      });
    });
    
    // Add force data event handler to listen for FSR_DATA_CHANGED events
    const handleForceDataChange = (eventData: { deviceId: string, sessionId?: string }) => {
      if (isSessionActive && eventData.sessionId === activeSession?.id) {
        console.log(`[LiveMonitor] Force data changed for device ${eventData.deviceId}`);
        fetchForceData(eventData.deviceId);
      }
    };
    
    // Add heart rate data event handler to listen for HRM_DATA_CHANGED events
    const handleHeartRateDataChange = (eventData: { deviceId: string, sessionId?: string }) => {
      if (isSessionActive && eventData.sessionId === activeSession?.id) {
        console.log(`[LiveMonitor] Heart rate data changed for device ${eventData.deviceId}`);
        fetchHeartRateData(eventData.deviceId);
      }
    };
    
    // Add temperature data event handler to listen for HTM_DATA_CHANGED events
    const handleTemperatureDataChange = (eventData: { deviceId: string, sessionId?: string }) => {
      if (isSessionActive && eventData.sessionId === activeSession?.id) {
        console.log(`[LiveMonitor] Temperature data changed for device ${eventData.deviceId}`);
        fetchTemperatureData(eventData.deviceId);
      }
    };
    
    // Register for data change events
    dataChangeEmitter.on(dbEvents.FSR_DATA_CHANGED, handleForceDataChange);
    dataChangeEmitter.on(dbEvents.HRM_DATA_CHANGED, handleHeartRateDataChange);
    dataChangeEmitter.on(dbEvents.HTM_DATA_CHANGED, handleTemperatureDataChange);
    
    // --- FIX: Ensure loading becomes false even if no initial status update ---
    // Use a small timeout to allow initial updates to potentially arrive first,
    // but guarantee the loading state resolves.
    const loadingTimeout = setTimeout(() => {
      if (!initialLoadComplete) {
        setLoading(false);
        initialLoadComplete = true;
        console.log('[LiveMonitorScreen] Initial load complete via timeout.');
      }
    }, 1500); // Wait 1.5 seconds
    
    // Save unsubscribe function to ref - this is the actual function to call for cleanup
    if (typeof unsubscribeSensorData === 'function') {
      sensorDataSubscriptionRef.current = unsubscribeSensorData;
    } else if (unsubscribeSensorData && typeof unsubscribeSensorData.remove === 'function') {
      // If it's an object with a remove method (like an EventSubscription)
      sensorDataSubscriptionRef.current = unsubscribeSensorData.remove.bind(unsubscribeSensorData);
    }
    
    // Initial data load for connected devices
    bluetoothService.getConnectedDeviceIds().forEach(deviceId => {
      fetchForceData(deviceId);
      fetchHeartRateData(deviceId);
      fetchTemperatureData(deviceId);
    });
    
    return () => {
      console.log('[LiveMonitorScreen] Cleaning up subscriptions.');
      clearTimeout(loadingTimeout); // Clear the timeout on cleanup
      subscription.remove();
      dataChangeEmitter.off(dbEvents.FSR_DATA_CHANGED, handleForceDataChange);
      dataChangeEmitter.off(dbEvents.HRM_DATA_CHANGED, handleHeartRateDataChange);
      dataChangeEmitter.off(dbEvents.HTM_DATA_CHANGED, handleTemperatureDataChange);
      if (sensorDataSubscriptionRef.current) {
        // Call the appropriate cleanup function
        sensorDataSubscriptionRef.current();
      }
      throttledSetLiveData.cancel(); // Cancel any pending throttled updates on unmount
    };
  }, [bluetoothService, throttledSetLiveData, fetchForceData, fetchHeartRateData, fetchTemperatureData, isSessionActive, activeSession]);
  
  // Handle refresh (manual pull-to-refresh)
  const handleRefresh = useCallback(async () => {
    if (!serviceReady) return;
    
    setRefreshing(true);
    console.log('[LiveMonitor] Manual refresh triggered');
    
    // Reload connected devices status
    if (bluetoothService) {
      const deviceStatuses = bluetoothService.getDeviceStatuses();
      setConnectedDevices(deviceStatuses.filter(d => d.connected));
    }
    
    // Reload data for each connected device
    connectedDevices.forEach(device => {
      fetchForceData(device.id);
      fetchHeartRateData(device.id);
      fetchTemperatureData(device.id);
    });
    
    setRefreshing(false);
  }, [serviceReady, fetchForceData, fetchHeartRateData, fetchTemperatureData, bluetoothService, connectedDevices]);
  
  // Handle session start/stop
  const toggleSession = async () => {
    if (!bluetoothService) {
      console.error('Bluetooth service not available');
      return;
    }
  
    if (isSessionActive) {
      // Stop session
      try {
        await bluetoothService.stopSession();
      } catch (error) {
        console.error('Error stopping session:', error);
      }
    } else {
      // Start session
      try {
        await bluetoothService.startSession();
      } catch (error) {
        console.error('Error starting session:', error);
      }
    }
  };
  
  // Render chart for a device's data with proper typing
  const renderDeviceChart = (deviceId: string) => {
    const deviceData = liveData[deviceId] || [];
    
    if (deviceData.length === 0) {
      return (
        <View style={styles.emptyChart}>
          <Text style={styles.emptyChartText}>Waiting for data...</Text>
        </View>
      );
    }
    
    // Get the latest data point to display current values
    const latestData = deviceData[deviceData.length - 1];
    
    // For accelerometer data, for example
    if (latestData.type === 'accelerometer') {
      const chartData = {
        labels: deviceData.map((_, i) => ''),
        datasets: [
          {
            data: deviceData.map(d => d.values[0] || 0), // X
            color: () => 'rgba(255, 0, 0, 0.8)',
            strokeWidth: 2
          },
          {
            data: deviceData.map(d => d.values[1] || 0), // Y
            color: () => 'rgba(0, 255, 0, 0.8)',
            strokeWidth: 2
          },
          {
            data: deviceData.map(d => d.values[2] || 0), // Z
            color: () => 'rgba(0, 0, 255, 0.8)',
            strokeWidth: 2
          }
        ],
        legend: ['X', 'Y', 'Z']
      };
      
      return (
        <View>
          <View style={styles.currentValues}>
            <Text style={styles.currentValueLabel}>Current: </Text>
            <Text style={[styles.currentValue, {color: 'rgba(255, 0, 0, 0.8)'}]}>
              X: {(latestData.values[0] || 0).toFixed(2)}
            </Text>
            <Text style={[styles.currentValue, {color: 'rgba(0, 255, 0, 0.8)'}]}>
              Y: {(latestData.values[1] || 0).toFixed(2)}
            </Text>
            <Text style={[styles.currentValue, {color: 'rgba(0, 0, 255, 0.8)'}]}>
              Z: {(latestData.values[2] || 0).toFixed(2)}
            </Text>
          </View>
          
          <LineChart
            data={chartData}
            width={320}
            height={180}
            chartConfig={{
              backgroundColor: THEME.cardBackground,
              backgroundGradientFrom: THEME.cardBackground,
              backgroundGradientTo: THEME.cardBackground,
              decimalPlaces: 1,
              color: (opacity = 1) => `rgba(0, 176, 118, ${opacity})`,
              labelColor: (opacity = 1) => `rgba(51, 51, 51, ${opacity})`,
              propsForDots: {
                r: '3',
                strokeWidth: '1',
                stroke: THEME.primary,
              }
            }}
            bezier
            style={styles.chart}
          />
        </View>
      );
    }
    
    // For temperature data
    if (latestData.type === 'temperature') {
      const chartData = {
        labels: deviceData.map((_, i) => ''),
        datasets: [
          {
            data: deviceData.map(d => d.values[0] || 0),
            color: () => 'rgba(255, 193, 7, 0.8)',
            strokeWidth: 2
          }
        ]
      };
      
      return (
        <View>
          <View style={styles.currentValues}>
            <Text style={styles.currentValueLabel}>Current Temperature: </Text>
            <Text style={[styles.currentValue, {color: 'rgba(255, 193, 7, 0.8)'}]}>
              {(latestData.values[0] || 0).toFixed(1)}°C
            </Text>
          </View>
          
          <LineChart
            data={chartData}
            width={320}
            height={180}
            chartConfig={{
              backgroundColor: THEME.cardBackground,
              backgroundGradientFrom: THEME.cardBackground,
              backgroundGradientTo: THEME.cardBackground,
              decimalPlaces: 1,
              color: (opacity = 1) => `rgba(255, 193, 7, ${opacity})`,
              labelColor: (opacity = 1) => `rgba(51, 51, 51, ${opacity})`,
              propsForDots: {
                r: '3',
                strokeWidth: '1',
                stroke: 'rgba(255, 193, 7, 1)',
              }
            }}
            bezier
            style={styles.chart}
          />
        </View>
      );
    }
    
    // For heart rate data
    if (latestData.type === 'heartRate') {
      const chartData = {
        labels: deviceData.map((_, i) => ''),
        datasets: [
          {
            data: deviceData.map(d => d.values[0] || 0),
            color: () => 'rgba(244, 67, 54, 0.8)', // Red for heart rate
            strokeWidth: 2
          }
        ]
      };
      
      return (
        <View>
          <View style={styles.currentValues}>
            <Text style={styles.currentValueLabel}>Current Heart Rate: </Text>
            <Text style={[styles.currentValue, {color: 'rgba(244, 67, 54, 0.8)'}]}>
              {(latestData.values[0] || 0).toFixed(0)} bpm
            </Text>
          </View>
          
          <LineChart
            data={chartData}
            width={320}
            height={180}
            chartConfig={{
              backgroundColor: THEME.cardBackground,
              backgroundGradientFrom: THEME.cardBackground,
              backgroundGradientTo: THEME.cardBackground,
              decimalPlaces: 0,
              color: (opacity = 1) => `rgba(244, 67, 54, ${opacity})`,
              labelColor: (opacity = 1) => `rgba(51, 51, 51, ${opacity})`,
              propsForDots: {
                r: '3',
                strokeWidth: '1',
                stroke: 'rgba(244, 67, 54, 1)',
              }
            }}
            bezier
            style={styles.chart}
          />
        </View>
      );
    }
    
    // For force data (FSR) - Implement the visualization
    if (latestData.type === 'force') {
      const chartData = {
        labels: deviceData.map((_, i) => ''),
        datasets: [
          {
            data: deviceData.map(d => d.values[0] || 0), // Left bite
            color: () => 'rgba(0, 122, 255, 0.8)', // Blue for left bite
            strokeWidth: 2
          },
          {
            data: deviceData.map(d => d.values[1] || 0), // Right bite
            color: () => 'rgba(255, 45, 85, 0.8)', // Pink for right bite
            strokeWidth: 2
          }
        ],
        legend: ['Left Bite', 'Right Bite']
      };
      
      return (
        <View>
          <View style={styles.currentValues}>
            <Text style={styles.currentValueLabel}>Current Force: </Text>
            <Text style={[styles.currentValue, {color: 'rgba(0, 122, 255, 0.8)'}]}>
              Left: {(latestData.values[0] || 0).toFixed(1)}
            </Text>
            <Text style={[styles.currentValue, {color: 'rgba(255, 45, 85, 0.8)'}]}>
              Right: {(latestData.values[1] || 0).toFixed(1)}
            </Text>
          </View>
          
          <LineChart
            data={chartData}
            width={320}
            height={180}
            chartConfig={{
              backgroundColor: THEME.cardBackground,
              backgroundGradientFrom: THEME.cardBackground,
              backgroundGradientTo: THEME.cardBackground,
              decimalPlaces: 1,
              color: (opacity = 1) => `rgba(0, 176, 118, ${opacity})`,
              labelColor: (opacity = 1) => `rgba(51, 51, 51, ${opacity})`,
              propsForDots: {
                r: '3',
                strokeWidth: '1',
                stroke: THEME.primary,
              }
            }}
            bezier
            style={styles.chart}
          />
        </View>
      );
    }
    
    // Generic fallback chart for other data types
    return (
      <View style={styles.emptyChart}>
        <Text style={styles.emptyChartText}>
          No visualization available for {latestData.type} data
        </Text>
      </View>
    );
  };
  
  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={THEME.primary} />
        <Text style={styles.loadingText}>Initializing monitor...</Text>
      </View>
    );
  }
  
  return (
    <SafeAreaProvider>
      <ScrollView 
        style={styles.container}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={THEME.primary}
            colors={[THEME.primary]}
            progressBackgroundColor={THEME.cardBackground}
          />
        }
      >
        {/* Premium Header with Gradient */}
        <View style={styles.header}>
          <LinearGradient
            colors={['rgba(0,176,118,0.15)', 'rgba(0,176,118,0.05)', 'transparent']}
            style={styles.headerGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          />
          <View style={styles.headerContent}>
            <Text style={styles.headerTitle}>Live Monitor</Text>
            <TouchableOpacity
              onPress={toggleSession}
              style={[
                styles.sessionToggle,
                isSessionActive ? styles.sessionActive : styles.sessionInactive
              ]}
            >
              <LinearGradient
                colors={isSessionActive ? ['#ff5252', '#ff3b30'] : ['rgba(100,100,100,0.1)', 'rgba(100,100,100,0.2)']}
                style={[StyleSheet.absoluteFill, { borderRadius: 24 }]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              />
              <MaterialCommunityIcons 
                name={isSessionActive ? "record-circle" : "record-circle-outline"} 
                size={16} 
                color={isSessionActive ? "#fff" : "#555"} 
              />
              <Text style={isSessionActive ? styles.sessionActiveText : styles.sessionInactiveText}>
                {isSessionActive ? "Session Active" : "Session Inactive"}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
        
        {/* Connected Devices Section */}
        <GlassCard style={styles.card}>
          <LinearGradient
            colors={['rgba(255,255,255,0.95)', 'rgba(255,255,255,0.75)']}
            style={styles.cardGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 0, y: 1 }}
          />
          <View style={styles.cardInner}>
            <View style={styles.cardHeader}>
              <Text style={styles.cardTitle}>Monitoring {connectedDevices.length} Athletes</Text>
            </View>
            
            {connectedDevices.length === 0 ? (
              <View style={styles.emptyState}>
                <MaterialCommunityIcons name="bluetooth-off" size={40} color={THEME.text.tertiary} />
                <Text style={styles.emptyStateText}>No connected devices</Text>
                <Text style={styles.emptyStateSubtext}>Connect to mouthguard devices to begin monitoring</Text>
              </View>
            ) : (
              connectedDevices.map(device => (
                <View key={device.id} style={styles.deviceItem}>
                  <LinearGradient
                    colors={['rgba(0,176,118,0.15)', 'rgba(0,176,118,0.05)']}
                    style={[styles.deviceIcon, { borderRadius: 20 }]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                  >
                    <MaterialCommunityIcons 
                      name="tooth-outline" 
                      size={22} 
                      color={THEME.primary} 
                    />
                  </LinearGradient>
                  <View style={styles.deviceInfo}>
                    <Text style={styles.deviceName}>
                      {device.athleteInfo?.name || device.name}
                    </Text>
                    <Text style={styles.deviceDetail}>
                      {device.batteryLevel ? `Battery: ${device.batteryLevel}%` : 'No battery data'}
                    </Text>
                  </View>
                  
                  <View style={styles.statusIndicator}>
                    <View style={[styles.statusDot, styles.statusConnected]} />
                    <Text style={styles.statusText}>Connected</Text>
                  </View>
                </View>
              ))
            )}
          </View>
        </GlassCard>
        
        {/* Real-time Data Visualizations Section */}
        {connectedDevices.length > 0 && (
          <GlassCard style={styles.card}>
            <LinearGradient
              colors={['rgba(255,255,255,0.95)', 'rgba(255,255,255,0.75)']}
              style={styles.cardGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 0, y: 1 }}
            />
            <View style={styles.cardInner}>
              <View style={styles.cardHeader}>
                <Text style={styles.cardTitle}>Real-time Data</Text>
              </View>
              
              {connectedDevices.map(device => (
                <View key={device.id} style={styles.chartContainer}>
                  <Text style={styles.chartTitle}>{device.athleteInfo?.name || device.name}</Text>
                  {renderDeviceChart(device.id)}
                </View>
              ))}
            </View>
          </GlassCard>
        )}
        
        {/* Team Overview Section */}
        <GlassCard style={styles.card}>
          <LinearGradient
            colors={['rgba(255,255,255,0.95)', 'rgba(255,255,255,0.75)']}
            style={styles.cardGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 0, y: 1 }}
          />
          <View style={styles.cardInner}>
            <View style={styles.cardHeader}>
              <Text style={styles.cardTitle}>Team Overview</Text>
            </View>
            <View style={styles.emptyState}>
              <MaterialCommunityIcons name="chart-line" size={40} color={THEME.text.tertiary} />
              <Text style={styles.emptyStateText}>Team-wide data visualization will be displayed here</Text>
            </View>
          </View>
        </GlassCard>

        {/* Bottom tab spacer */}
        <View style={{ height: 24 }} />
      </ScrollView>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: THEME.background,
  },
  contentContainer: {
    paddingBottom: 32,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: THEME.background,
  },
  loadingText: {
    marginTop: 16,
    color: THEME.text.primary,
    fontSize: 16,
  },
  // Premium Header styles
  header: {
    height: 140,
    position: 'relative',
    marginBottom: 20,
  },
  headerGradient: {
    ...StyleSheet.absoluteFillObject,
  },
  headerContent: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 34,
    fontWeight: '700',
    color: THEME.text.primary,
    letterSpacing: 0.5,
  },
  // Glass card styles
  glassCard: {
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 16,
    overflow: 'hidden',
    borderColor: THEME.card.border,
    borderWidth: 1,
    shadowColor: THEME.card.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  glassCardFallback: {
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: THEME.cardBackground,
    borderColor: THEME.card.border,
    borderWidth: 1,
    shadowColor: THEME.card.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  cardGradient: {
    ...StyleSheet.absoluteFillObject,
  },
  card: {
    marginHorizontal: 16,
    marginBottom: 16,
  },
  cardInner: {
    padding: 16,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: THEME.text.primary,
    letterSpacing: 0.3,
  },
  // Session toggle styles
  sessionToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 24,
    overflow: 'hidden',
    position: 'relative',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sessionActive: {
    borderWidth: 1,
    borderColor: 'rgba(255,82,82,0.3)',
  },
  sessionInactive: {
    borderWidth: 1,
    borderColor: 'rgba(100,100,100,0.1)',
  },
  sessionActiveText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '500',
    marginLeft: 4,
  },
  sessionInactiveText: {
    color: '#555',
    fontSize: 14,
    fontWeight: '500',
    marginLeft: 4,
  },
  // Device Item styles
  deviceItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 4,
    borderRadius: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: THEME.divider,
    marginBottom: 12,
  },
  deviceIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    borderWidth: 1,
    borderColor: 'rgba(0,176,118,0.2)',
  },
  deviceInfo: {
    flex: 1,
  },
  deviceName: {
    fontSize: 16,
    fontWeight: '500',
    color: THEME.text.primary,
    marginBottom: 2,
  },
  deviceDetail: {
    fontSize: 12,
    color: THEME.text.secondary,
  },
  statusIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 6,
    borderRadius: 12,
    backgroundColor: 'rgba(0,0,0,0.03)',
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  statusConnected: {
    backgroundColor: '#4CAF50',
  },
  statusText: {
    fontSize: 14,
    color: THEME.text.secondary,
  },
  // Empty state styles
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
    backgroundColor: 'rgba(0,0,0,0.02)',
    borderRadius: 12,
  },
  emptyStateText: {
    marginTop: 16,
    fontSize: 18,
    fontWeight: '500',
    color: THEME.text.primary,
  },
  emptyStateSubtext: {
    marginTop: 8,
    fontSize: 14,
    color: THEME.text.secondary,
    textAlign: 'center',
  },
  // Chart styles
  chartContainer: {
    marginTop: 8,
    padding: 12,
    backgroundColor: 'rgba(0,0,0,0.02)',
    borderRadius: 12,
    marginBottom: 16,
  },
  chartTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: THEME.text.primary,
    marginBottom: 12,
  },
  chart: {
    borderRadius: 12,
    padding: 8,
    backgroundColor: THEME.cardBackground,
    marginTop: 8,
    overflow: 'hidden',
  },
  emptyChart: {
    height: 180,
    borderRadius: 8,
    backgroundColor: 'rgba(0,0,0,0.05)',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8,
  },
  emptyChartText: {
    color: THEME.text.secondary,
    fontSize: 16,
  },
  currentValues: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    marginTop: 8,
    marginBottom: 8,
    padding: 8,
    backgroundColor: 'rgba(0,0,0,0.02)',
    borderRadius: 8,
  },
  currentValueLabel: {
    color: THEME.text.secondary,
    fontSize: 14,
  },
  currentValue: {
    fontSize: 14,
    fontWeight: '500',
    marginRight: 10,
  },
});