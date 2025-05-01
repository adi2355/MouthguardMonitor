import React, { useState, useEffect, useCallback, useRef } from 'react';
import { 
  StyleSheet, 
  View, 
  Text, 
  TouchableOpacity, 
  ActivityIndicator,
  ScrollView,
  Alert,
  RefreshControl,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { 
  COLORS, 
  SAMPLE_ATHLETES, 
  SAMPLE_IMPACT_EVENTS, 
  SAMPLE_SENSOR_READINGS,
  playerData,
} from '@/src/constants';
import { useBluetoothService, useDeviceService, useSessionRepository, useSensorDataRepository } from '@/src/providers/AppProvider';
import { LiveDataPoint, SavedDevice, DeviceStatus } from '@/src/types';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import LineChart from '../../app/components/charts/LineChart';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { useSession } from '@/src/contexts/SessionContext';
import { throttle } from 'lodash';
import { dataChangeEmitter, dbEvents } from '@/src/utils/EventEmitter';
import { processHrmForChart, processTempForChart, processMotionForChart } from '@/src/utils/dataProcessing';

// Sample data remains the same
const SAMPLE_DEVICES = [
  {
    id: 'mouthguard_A',
    name: 'Mouthguard A',
    connected: true,
    batteryLevel: 85,
    athlete: SAMPLE_ATHLETES.find(a => a.deviceId === 'mouthguard_A')
  },
  {
    id: 'mouthguard_B',
    name: 'Mouthguard B',
    connected: true,
    batteryLevel: 72,
    athlete: SAMPLE_ATHLETES.find(a => a.deviceId === 'mouthguard_B')
  }
];

// Get some sample accelerometer data for charting
const accelerometerData = SAMPLE_SENSOR_READINGS
  .find(group => group.table === 'accelerometer_data')?.data || [];

// Custom theme colors for beige theme
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
  },
  error: COLORS.error,
  warning: COLORS.warning,
};

// Premium Glass Card component with proper TypeScript types
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

export default function Dashboard() {
  const router = useRouter();
  const bluetoothService = useBluetoothService();
  const deviceService = useDeviceService();
  const sensorDataRepository = useSensorDataRepository();
  const { activeSession, startNewSession, endCurrentSession, isSessionActive, sessionLoading, sessionInitError } = useSession();
  const sessionRepository = useSessionRepository();
  
  // Session State - derived from SessionContext
  const [elapsedTime, setElapsedTime] = useState(0);
  const [isTogglingSession, setIsTogglingSession] = useState(false);
  
  // Loading & Refreshing State
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  
  // Data State 
  const [connectedDevices, setConnectedDevices] = useState<DeviceStatus[]>([]);
  const [recentImpacts, setRecentImpacts] = useState(SAMPLE_IMPACT_EVENTS);
  const [deviceHistory, setDeviceHistory] = useState<SavedDevice[]>([]); 
  
  // Live Data State
  const [currentAcceleration, setCurrentAcceleration] = useState<number | null>(null);
  const [currentHeartRate, setCurrentHeartRate] = useState<number | null>(null);
  const [maxHeartRateSession, setMaxHeartRateSession] = useState<number | null>(null);
  const [currentTemperature, setCurrentTemperature] = useState<number | null>(null);
  
  // Average data state - used for displays
  const [avgHeartRate, setAvgHeartRate] = useState<number | null>(null);
  const [avgTemperature, setAvgTemperature] = useState<number | null>(null);
  const [avgAcceleration, setAvgAcceleration] = useState<number | null>(null);
  
  // Target device ID for fetching data
  const [targetDeviceId, setTargetDeviceId] = useState<string | null>(null);
  
  // Create a ref to track the latest connectedDevices state without triggering effect reruns
  const connectedDevicesRef = useRef<DeviceStatus[]>([]);
  
  // Add a reference for device history to prevent state updates triggering more renders
  const deviceHistoryRef = useRef<SavedDevice[]>([]);
  
  // Update the history ref when state changes
  useEffect(() => {
    deviceHistoryRef.current = deviceHistory;
  }, [deviceHistory]);
  
  // Update the ref whenever connectedDevices changes
  useEffect(() => {
    connectedDevicesRef.current = connectedDevices;
  }, [connectedDevices]);
  
  // Timer interval for session timing based on activeSession
  useEffect(() => {
    let timerInterval: NodeJS.Timeout | null = null;
    
    if (isSessionActive && activeSession) {
      // Add validation to ensure startTime is valid
      if (typeof activeSession.startTime === 'number' && !isNaN(activeSession.startTime)) {
        timerInterval = setInterval(() => {
          const now = Date.now();
          const elapsed = now - activeSession.startTime;
          setElapsedTime(elapsed);
        }, 1000);
      } else {
        // Handle invalid startTime
        console.warn(`[Dashboard] Active session ${activeSession.id} has invalid startTime. Resetting elapsed time.`);
        setElapsedTime(0); // Reset to 0 or an indicator value
      }
    } else {
      setElapsedTime(0);
    }
    
    return () => {
      if (timerInterval) {
        clearInterval(timerInterval);
      }
    };
  }, [isSessionActive, activeSession]);

  // Effect to find and set the target device ID for data fetching
  useEffect(() => {
    const findDevice = async () => {
      let foundId: string | null = null;
      try {
        // 1. Check actively connected devices first (highest priority)
        if (bluetoothService) {
          const connectedIds = bluetoothService.getConnectedDeviceIds();
          if (connectedIds.length > 0) {
            foundId = connectedIds[0]; // Use the first connected device
            console.log(`[Dashboard] Using actively connected device: ${foundId}`);
          }
        } else {
          console.log('[Dashboard] BluetoothService not available yet');
        }

        // If no connected devices found or bluetoothService isn't available
        if (!foundId) {
          // 2. If none connected, check saved devices
          const savedDevices = await deviceService.getSavedDevices();
          console.log(`[Dashboard] Found ${savedDevices.length} saved devices`);
          
          if (savedDevices.length > 0) {
            // Sort by lastConnected (most recent first)
            const sortedDevices = [...savedDevices].sort((a: SavedDevice, b: SavedDevice) => {
              const aTime = a.lastConnected || 0;
              const bTime = b.lastConnected || 0;
              return bTime - aTime;
            });
            
            // Use the most recently connected device
            foundId = sortedDevices[0].id;
            console.log(`[Dashboard] Using most recently connected saved device: ${foundId}`);
          }
        }
        
        // 3. Fall back to simulation device
        if (!foundId) {
          console.log(`[Dashboard] No connected or saved devices found, falling back to simulation device ID.`);
          foundId = 'simulated_mouthguard_1';
        }
        
        // Set the target device ID
        setTargetDeviceId(foundId);
        
      } catch (err) {
        console.error('[Dashboard] Error finding device:', err);
        // Fall back to simulation device on error
        setTargetDeviceId('simulated_mouthguard_1');
      }
    };
    
    findDevice();
  }, [bluetoothService, deviceService]);
  
  // Add a serviceReady state to track when BluetoothService is available
  const [serviceReady, setServiceReady] = useState(false);

  useEffect(() => {
    // Check if the bluetoothService is available
    if (bluetoothService) {
      setServiceReady(true);
    }
  }, [bluetoothService]);
  
  // Fetch functions for different data types
  const fetchHrmData = useCallback(async () => {
    if (!targetDeviceId || !activeSession?.id) {
      setAvgHeartRate(null);
      return;
    }
    
    try {
      const options = { sessionId: activeSession.id, limit: 500 };
      const fetchedHrm = await sensorDataRepository.getSensorData(targetDeviceId, 'hrm_packets', options);
      
      if (fetchedHrm.length > 0) {
        const hrmResults = processHrmForChart(fetchedHrm);
        setAvgHeartRate(hrmResults.avgHr);
        setCurrentHeartRate(fetchedHrm[fetchedHrm.length - 1]?.heartRate || null);
      } else {
        // No data available
        setAvgHeartRate(null);
        setCurrentHeartRate(null);
      }
    } catch (err) {
      console.error('[Dashboard] Error fetching HRM data:', err);
      setAvgHeartRate(null);
    }
  }, [targetDeviceId, activeSession, sensorDataRepository]);
  
  const fetchTempData = useCallback(async () => {
    if (!targetDeviceId || !activeSession?.id) {
      setAvgTemperature(null);
      return;
    }
    
    try {
      const options = { sessionId: activeSession.id, limit: 500 };
      const fetchedTemp = await sensorDataRepository.getSensorData(targetDeviceId, 'htm_packets', options);
      
      if (fetchedTemp.length > 0) {
        const tempResults = processTempForChart(fetchedTemp);
        setAvgTemperature(tempResults.avgTemp);
        setCurrentTemperature(tempResults.currentTemp);
      } else {
        // No data available
        setAvgTemperature(null);
        setCurrentTemperature(null);
      }
    } catch (err) {
      console.error('[Dashboard] Error fetching temperature data:', err);
      setAvgTemperature(null);
    }
  }, [targetDeviceId, activeSession, sensorDataRepository]);
  
  const fetchMotionData = useCallback(async () => {
    if (!targetDeviceId || !activeSession?.id) {
      setAvgAcceleration(null);
      return;
    }
    
    try {
      const options = { sessionId: activeSession.id, limit: 500 };
      const fetchedMotion = await sensorDataRepository.getSensorData(targetDeviceId, 'motion_packets', options);
      
      if (fetchedMotion.length > 0) {
        const motionResults = processMotionForChart(fetchedMotion);
        // Convert G-force to mph (rough approximation)
        const avgAccelG = motionResults.peakAccel;
        const avgAccelMph = avgAccelG ? parseFloat((avgAccelG * 2.23694).toFixed(1)) : null;
        setAvgAcceleration(avgAccelMph);
      } else {
        // No data available
        setAvgAcceleration(null);
      }
    } catch (err) {
      console.error('[Dashboard] Error fetching motion data:', err);
      setAvgAcceleration(null);
    }
  }, [targetDeviceId, activeSession, sensorDataRepository]);

  // Create throttled versions of the fetch functions
  const throttledFetchHrm = useRef(
    throttle(fetchHrmData, 3000, { leading: true, trailing: true })
  ).current;
  
  const throttledFetchTemp = useRef(
    throttle(fetchTempData, 3000, { leading: true, trailing: true })
  ).current;
  
  const throttledFetchMotion = useRef(
    throttle(fetchMotionData, 3000, { leading: true, trailing: true })
  ).current;
  
  // Fetch all sensor data
  const fetchAllSensorData = useCallback(() => {
    if (isSessionActive && activeSession && targetDeviceId) {
      console.log("[Dashboard] fetchAllSensorData triggered (throttled)");
      throttledFetchHrm();
      throttledFetchTemp();
      throttledFetchMotion();
    } else {
      // Clear data when no active session
      setAvgHeartRate(null);
      setAvgTemperature(null);
      setAvgAcceleration(null);
      setCurrentHeartRate(null);
      setCurrentTemperature(null);
      setCurrentAcceleration(null);
    }
  }, [isSessionActive, activeSession, targetDeviceId, throttledFetchHrm, throttledFetchTemp, throttledFetchMotion]);

  // Use a single effect for initial loading with stable dependencies
  useEffect(() => {
    // Skip if services aren't ready
    if (!serviceReady || sessionLoading) {
      return;
    }
    
    let isMounted = true;
    
    const loadDataAsync = async () => {
      if (!isMounted) return;
      
      console.log('[Dashboard] Loading data...');
      
      try {
        // Get device statuses - only if bluetoothService is available
        if (bluetoothService) {
          const statuses = bluetoothService.getDeviceStatuses();
          if (isMounted) {
            setConnectedDevices(statuses.filter(d => d.connected));
          }
        }

        // Fetch saved device history
        const saved = await deviceService.getSavedDevices();
        // Sort by last connected time (most recent first) and take top 5
        const sortedHistory = saved
          .filter(d => d.lastConnected)
          .sort((a, b) => (b.lastConnected || 0) - (a.lastConnected || 0))
          .slice(0, 5);
        
        if (isMounted) {
          setDeviceHistory(sortedHistory);
          console.log("[Dashboard] Initial data loaded");
          setLoading(false);
          setRefreshing(false);
        }
      } catch (err: any) {
        console.error('Error loading dashboard data:', err);
        if (isMounted) {
          setLoading(false);
          setRefreshing(false);
        }
      }
    };
    
    // Load data once
    loadDataAsync();
    
    // Cleanup function
    return () => {
      isMounted = false;
    };
  // Remove unnecessary dependencies to prevent rerenders
  }, [serviceReady, sessionLoading, bluetoothService, deviceService]);

  // Listen for data changes when there's an active session
  useEffect(() => {
    if (!isSessionActive || !activeSession || !targetDeviceId) {
      return;
    }
    
    // Fetch initial data
    fetchAllSensorData();
    
    // Set up listeners for data changes
    const handleHrmChange = (eventData: { deviceId: string; sessionId?: string }) => {
      if (eventData.deviceId === targetDeviceId && eventData.sessionId === activeSession.id) {
        throttledFetchHrm();
      }
    };
    
    const handleHtmChange = (eventData: { deviceId: string; sessionId?: string }) => {
      if (eventData.deviceId === targetDeviceId && eventData.sessionId === activeSession.id) {
        throttledFetchTemp();
      }
    };
    
    const handleMotionChange = (eventData: { deviceId: string; sessionId?: string }) => {
      if (eventData.deviceId === targetDeviceId && eventData.sessionId === activeSession.id) {
        throttledFetchMotion();
      }
    };
    
    // Register all listeners
    dataChangeEmitter.on(dbEvents.HRM_DATA_CHANGED, handleHrmChange);
    dataChangeEmitter.on(dbEvents.HTM_DATA_CHANGED, handleHtmChange);
    dataChangeEmitter.on(dbEvents.MOTION_DATA_CHANGED, handleMotionChange);
    
    // Generic data change event as a fallback
    const handleDataChange = (eventData: { deviceId: string; type: string; sessionId?: string }) => {
      if (eventData.deviceId === targetDeviceId && eventData.sessionId === activeSession.id) {
        // Determine which data to update based on type
        if (eventData.type.includes('hrm') || eventData.type.includes('heart')) {
          throttledFetchHrm();
        } else if (eventData.type.includes('htm') || eventData.type.includes('temp')) {
          throttledFetchTemp();
        } else if (eventData.type.includes('motion') || eventData.type.includes('accel')) {
          throttledFetchMotion();
        } else {
          // If type is unknown, refresh all data
          fetchAllSensorData();
        }
      }
    };
    
    dataChangeEmitter.on(dbEvents.DATA_CHANGED, handleDataChange);
    
    // Also set a regular polling interval as a fallback
    const pollingInterval = setInterval(fetchAllSensorData, 5000);
    
    return () => {
      // Clean up listeners
      dataChangeEmitter.off(dbEvents.HRM_DATA_CHANGED, handleHrmChange);
      dataChangeEmitter.off(dbEvents.HTM_DATA_CHANGED, handleHtmChange);
      dataChangeEmitter.off(dbEvents.MOTION_DATA_CHANGED, handleMotionChange);
      dataChangeEmitter.off(dbEvents.DATA_CHANGED, handleDataChange);
      
      // Clear interval
      clearInterval(pollingInterval);
      
      // Cancel any pending throttled fetches
      throttledFetchHrm.cancel();
      throttledFetchTemp.cancel();
      throttledFetchMotion.cancel();
    };
  }, [isSessionActive, activeSession, targetDeviceId, fetchAllSensorData, throttledFetchHrm, throttledFetchTemp, throttledFetchMotion]);

  // Create a function to load data with access to the latest state
  const loadData = useCallback(async () => {
    if (!bluetoothService) {
      console.log("[Dashboard] Bluetooth service not available");
      setLoading(false);
      setRefreshing(false);
      return;
    }
    
    console.log('[Dashboard] Refreshing data...');
    
    try {
      // Refresh device statuses
      const statuses = bluetoothService.getDeviceStatuses();
      setConnectedDevices(statuses.filter(d => d.connected));
      
      // Refresh saved device history
      const saved = await deviceService.getSavedDevices();
      // Sort by last connected time (most recent first) and take top 5
      const sortedHistory = saved
        .filter(d => d.lastConnected)
        .sort((a, b) => (b.lastConnected || 0) - (a.lastConnected || 0))
        .slice(0, 5);
      
      setDeviceHistory(sortedHistory);
      
      // Also refresh sensor data if there's an active session
      if (isSessionActive && activeSession && targetDeviceId) {
        fetchAllSensorData();
      }
      
    } catch (err: any) {
      console.error('Error refreshing dashboard data:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [bluetoothService, deviceService, isSessionActive, activeSession, targetDeviceId, fetchAllSensorData]);

  // Pull-to-refresh handler with stable identity
  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadData();
  }, [loadData]);

  // Use a separate effect for subscriptions
  useEffect(() => {
    // Skip if services aren't ready
    if (!serviceReady || sessionLoading || !bluetoothService) {
      return;
    }
    
    // Subscribe to device status updates
    // bluetoothService is guaranteed to be non-null at this point
    const statusSubscription = bluetoothService.subscribeToDeviceStatusUpdates((status) => {
      // Update the local state when device status changes
      setConnectedDevices(prev => {
        const existingIndex = prev.findIndex(d => d.id === status.id);
        if (status.connected) {
          if (existingIndex > -1) {
            // Update existing
            const updated = [...prev];
            updated[existingIndex] = status;
            return updated;
          } else {
            // Add new connected device
            return [...prev, status];
          }
        } else {
          // Remove disconnected device
          return prev.filter(d => d.id !== status.id);
        }
      });
    });
    
    // Subscribe to live sensor data
    // bluetoothService is guaranteed to be non-null at this point
    const sensorSubscription = bluetoothService.subscribeSensorData((deviceId, dataPoint: LiveDataPoint) => {
      // Use the ref instead of the state to check if device is connected
      const deviceIsConnected = connectedDevicesRef.current.some(d => d.id === deviceId);
      if (!deviceIsConnected) return;

      if (dataPoint.type === 'accelerometer') {
        const magnitude = dataPoint.values[3]; // Assuming magnitude is the 4th value
        if (magnitude !== undefined) {
          setCurrentAcceleration(magnitude);
        }
      } else if (dataPoint.type === 'heartRate') {
        const hr = dataPoint.values[0];
        if (hr !== undefined) {
          setCurrentHeartRate(hr);
          // Update max heart rate
          setMaxHeartRateSession(prev => {
            if (prev === null || hr > prev) {
              return hr;
            }
            return prev;
          });
        }
      } else if (dataPoint.type === 'temperature') {
        const temp = dataPoint.values[0];
        if (temp !== undefined) {
          setCurrentTemperature(temp);
        }
      }
    });
    
    // Return cleanup function
    return () => {
      // Clean up subscriptions
      statusSubscription.remove();
      sensorSubscription.remove();
    };
  }, [serviceReady, sessionLoading, bluetoothService]);

  // Session management functions using SessionContext
  const handleStartSession = async () => {
    if (isTogglingSession) return; // Prevent double taps
    
    // Ensure target device ID is available before starting
    if (!targetDeviceId) {
      Alert.alert('Device Not Ready', 'Waiting to identify the primary device. Please wait a moment.');
      return;
    }
    
    if (connectedDevices.length === 0) {
      Alert.alert(
        'No Devices Connected',
        'Please connect at least one device before starting a session.',
        [{ text: 'OK' }]
      );
      return;
    }

    setIsTogglingSession(true);
    try {
      const sessionName = `Session ${new Date().toLocaleString()}`;
      // Start session via context - this updates activeSession state
      const newSession = await startNewSession(sessionName);
      
      // Reset session stats
      setMaxHeartRateSession(null);
      setCurrentAcceleration(null);
      setCurrentHeartRate(null);
      setCurrentTemperature(null);
      setAvgHeartRate(null);
      setAvgTemperature(null);
      setAvgAcceleration(null);
      
      // Added: Immediate, Non-Throttled Fetch after session start
      console.log(`[Dashboard] Session ${newSession.id} started. Triggering IMMEDIATE data fetch.`);
      // Call the original, non-throttled fetch functions directly
      // Use Promise.allSettled to fetch concurrently and ignore individual errors
      await Promise.allSettled([
        fetchHrmData(),
        fetchTempData(),
        fetchMotionData()
      ]);
      console.log(`[Dashboard] Initial data fetch attempt complete after session start.`);
      // The UI will update once these fetches complete and set state
      
      console.log(`[Dashboard] Session started: ${sessionName}`);
    } catch (error) {
      console.error('Error starting session:', error);
      Alert.alert('Error', 'Failed to start session. Please try again.');
    } finally {
      setIsTogglingSession(false);
    }
  };

  const handleStopSession = async () => {
    if (isTogglingSession) return; // Prevent double taps
    
    setIsTogglingSession(true);
    try {
      // Confirm before stopping
      Alert.alert(
        'End Session',
        'Are you sure you want to end the current session?',
        [
          { text: 'Cancel', style: 'cancel', onPress: () => setIsTogglingSession(false) },
          { 
            text: 'End Session', 
            style: 'destructive',
            onPress: async () => {
              try {
                // End the session via context
                await endCurrentSession();
                console.log('[Dashboard] Session ended');
              } catch (error) {
                console.error('Error stopping session:', error);
                Alert.alert('Error', 'Failed to stop session. Please try again.');
              } finally {
                setIsTogglingSession(false);
              }
            }
          }
        ]
      );
    } catch (error) {
      console.error('Error stopping session:', error);
      Alert.alert('Error', 'Failed to stop session. Please try again.');
      setIsTogglingSession(false);
    }
  };

  // Format milliseconds into readable duration
  const formatDuration = (ms: number) => {
    const totalSeconds = Math.floor(ms / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    
    // Format: hh:mm:ss
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  // Extract data for the accelerometer magnitude chart
  const magnitudeData = accelerometerData.map(d => {
    // Handle different sensor data types
    if ('x' in d && 'y' in d && 'z' in d) {
      const x = d.x || 0;
      const y = d.y || 0;
      const z = d.z || 0;
      return Math.sqrt(x*x + y*y + z*z);
    }
    return 0;
  });
  const magnitudeLabels = accelerometerData.map((_, i) => `${i}`);

  // Prepare data for athletes summary
  const totalAthletes = SAMPLE_ATHLETES.length;
  const assignedAthletes = SAMPLE_ATHLETES.filter(a => a.deviceId).length;
  const unassignedAthletes = totalAthletes - assignedAthletes;

  const formatTimestamp = (ts: number | undefined): string => {
    if (!ts) return 'Never';
    const date = new Date(ts);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  // --- Data from constants.ts ---
  const { name, sessions, isDeviceConnected } = playerData;
  // Get data for the latest session to display summaries
  const latestSession = sessions.length > 0 ? sessions[0] : null;
  const sessionStats = latestSession?.stats;
  const concussionRisk = sessionStats?.concussionRisk;

  // --- Navigation Handler for Tiles ---
  const handleTilePress = (focusSection: string) => {
    router.push({
      pathname: '/reportsDetailed', // Navigate to the NEW reports screen
      params: { focus: focusSection } // Optional: pass parameter
    });
  };

  const navigateToLogs = () => {
    // Fix navigation path to avoid conflicts
    router.push('/screens/logs');
  };

  // Render Session Control with error handling and loading states
  const renderSessionControl = () => {
    if (sessionLoading) {
      return (
        <View style={styles.sessionHeader}>
          <ActivityIndicator color={THEME.primary} style={{padding: 20}} />
        </View>
      );
    }
    
    if (sessionInitError) {
      return (
        <View style={styles.errorBox}>
          <Text style={styles.errorTitle}>Session Error:</Text>
          <Text style={styles.errorTextDetail}>{sessionInitError}</Text>
        </View>
      );
    }
    
    return (
      <View style={styles.sessionHeader}>
        <View>
          <Text style={styles.sessionTitle}>
            {isSessionActive ? 'Session in Progress' : 'Start New Session'}
          </Text>
          {isSessionActive && activeSession && (
            <Text style={styles.sessionTime}>
              Duration: {formatDuration(elapsedTime)}
            </Text>
          )}
        </View>
        <View style={styles.sessionControls}>
          {isSessionActive ? (
            <TouchableOpacity
              style={[styles.sessionButton, styles.stopButton]}
              onPress={handleStopSession}
              disabled={isTogglingSession}
            >
              {isTogglingSession ? (
                <ActivityIndicator color="#fff" size="small" style={styles.buttonLoader} />
              ) : (
                <MaterialCommunityIcons name="stop-circle" size={20} color="#fff" />
              )}
              <Text style={styles.sessionButtonText}>
                {isTogglingSession ? 'Ending...' : 'End'}
              </Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={[styles.sessionButton, styles.startButton]}
              onPress={handleStartSession}
              disabled={isTogglingSession}
            >
              <LinearGradient
                colors={['#00d68f', '#00b076']}
                style={StyleSheet.absoluteFill}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              />
              {isTogglingSession ? (
                <ActivityIndicator color="#fff" size="small" style={styles.buttonLoader} />
              ) : (
                <MaterialCommunityIcons name="play-circle" size={20} color="#fff" />
              )}
              <Text style={styles.sessionButtonText}>
                {isTogglingSession ? 'Starting...' : 'Start'}
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
  };

  // Show loading state until services are ready
  if (!serviceReady || sessionLoading || loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loadingText}>Loading dashboard...</Text>
      </View>
    );
  }

  // Render error state if there's a session initialization error
  if (sessionInitError) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorTitle}>Session Error</Text>
        <Text style={styles.errorText}>{sessionInitError}</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={THEME.primary}
            colors={[THEME.primary]}
            progressBackgroundColor="rgba(0,0,0,0.05)"
          />
        }
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
            <Text style={styles.headerTitle}>Dashboard</Text>
            <TouchableOpacity 
              style={styles.profileContainer} 
              onPress={() => router.push('/(tabs)/settings')}
            >
              <MaterialCommunityIcons 
                name="account-circle-outline" 
                size={28} 
                color={THEME.primary} 
              />
            </TouchableOpacity>
          </View>
        </View>

        {/* --- Session Control (Keep this GlassCard) --- */}
        <GlassCard style={styles.card}>
          {renderSessionControl()}
        </GlassCard>

        {/* --- NEW: Summary Tiles Card --- */}
        <GlassCard style={styles.card}>
          <View style={styles.summaryTilesContainer}>
            {/* Heart Rate Tile */}
            <TouchableOpacity style={styles.summaryTile} onPress={() => handleTilePress('heartRate')}>
              <MaterialCommunityIcons name="heart-pulse" size={32} color={THEME.primary} />
              <Text style={styles.summaryTileValue}>
                {isSessionActive ? 
                  (avgHeartRate !== null ? `${avgHeartRate}` : '--') : 
                  '--'} bpm
              </Text>
              <Text style={styles.summaryTileLabel}>Avg Heart Rate</Text>
            </TouchableOpacity>

            {/* Temperature Tile */}
            <TouchableOpacity style={styles.summaryTile} onPress={() => handleTilePress('temperature')}>
              <MaterialCommunityIcons name="thermometer" size={32} color={THEME.primary} />
              <Text style={styles.summaryTileValue}>
                {isSessionActive ? 
                  (avgTemperature !== null ? `${avgTemperature}` : '--') : 
                  '--'} °F
              </Text>
              <Text style={styles.summaryTileLabel}>Avg Temp</Text>
            </TouchableOpacity>

            {/* Acceleration Tile */}
            <TouchableOpacity style={styles.summaryTile} onPress={() => handleTilePress('acceleration')}>
              <MaterialCommunityIcons name="run-fast" size={32} color={THEME.primary} />
              <Text style={styles.summaryTileValue}>
                {isSessionActive ? 
                  (avgAcceleration !== null ? `${avgAcceleration}` : '--') : 
                  '--'} mph
              </Text>
              <Text style={styles.summaryTileLabel}>Avg Accel</Text>
            </TouchableOpacity>
          </View>
        </GlassCard>
        
        {/* --- Data Logs & Analytics Card --- */}
        <GlassCard style={styles.card}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Data & Analytics</Text>
          </View>
          <View style={styles.summaryTilesContainer}>
            {/* Data Logs Tile */}
            <TouchableOpacity style={styles.dataActionTile} onPress={navigateToLogs}>
              <MaterialCommunityIcons name="chart-line" size={28} color={THEME.primary} />
              <Text style={styles.dataActionValue}>Logs</Text>
              <Text style={styles.dataActionLabel}>View Data</Text>
            </TouchableOpacity>
            
            {/* Test Data Generator Tile */}
            <TouchableOpacity style={styles.dataActionTile} onPress={() => router.push('/screens/TestDataScreen')}>
              <MaterialCommunityIcons name="database-plus" size={28} color={THEME.primary} />
              <Text style={styles.dataActionValue}>Test Data</Text>
              <Text style={styles.dataActionLabel}>Insert Data</Text>
            </TouchableOpacity>
            
            {/* Reports Tile */}
            <TouchableOpacity style={styles.dataActionTile} onPress={() => router.push('/(tabs)/reportsDetailed')}>
              <MaterialCommunityIcons name="chart-timeline-variant" size={28} color={THEME.primary} />
              <Text style={styles.dataActionValue}>Reports</Text>
              <Text style={styles.dataActionLabel}>Analytics</Text>
            </TouchableOpacity>
            
            {/* Settings Tile */}
            <TouchableOpacity style={styles.dataActionTile} onPress={() => router.push('/(tabs)/settings')}>
              <MaterialCommunityIcons name="cog-outline" size={28} color={THEME.primary} />
              <Text style={styles.dataActionValue}>Settings</Text>
              <Text style={styles.dataActionLabel}>Configure</Text>
            </TouchableOpacity>
          </View>
        </GlassCard>

        {/* Bottom tab spacer */}
        <View style={{ height: 80 }}><Text style={{ display: 'none' }}>Spacer for footer</Text></View>

      </ScrollView>

      {/* --- Connection Status Footer (Using real connected devices data) --- */}
      {connectedDevices.length > 0 && (
        <View style={[styles.connectionStatusFooter, { backgroundColor: 'rgba(0, 176, 118, 0.7)' }]}>
          <Text style={styles.connectionStatusText}>
            {connectedDevices.length === 1 
              ? '1 Device Connected' 
              : `${connectedDevices.length} Devices Connected`}
          </Text>
        </View>
      )}
    </View>
  );
}

// Helper functions remain similar with updated colors
const getSeverityColor = (severity: string) => {
  switch (severity.toLowerCase()) {
    case 'severe':
      return '#ff3b30'; // Red
    case 'moderate':
      return '#ff9500'; // Orange
    case 'mild':
      return '#00b076'; // Green
    default:
      return '#00b076'; // Green
  }
};

const getBatteryIcon = (level: number) => {
  if (level === undefined) return 'battery-unknown';
  if (level <= 10) return 'battery-10';
  if (level <= 20) return 'battery-20';
  if (level <= 30) return 'battery-30';
  if (level <= 40) return 'battery-40';
  if (level <= 50) return 'battery-50';
  if (level <= 60) return 'battery-60';
  if (level <= 70) return 'battery-70';
  if (level <= 80) return 'battery-80';
  if (level <= 90) return 'battery-90';
  return 'battery';
};

const getBatteryColor = (level: number) => {
  if (level === undefined) return '#999999';
  if (level <= 20) return '#ff3b30'; // Red
  if (level <= 40) return '#ff9500'; // Orange
  return '#34c759'; // Green
};

const formatTime = (timestamp: number) => {
  const date = new Date(timestamp);
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: THEME.background,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    paddingBottom: 32,
  },
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
    flex: 1,
  },
  profileContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,176,118,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(0,176,118,0.2)',
    marginLeft: 16,
  },
  alertBanner: {
    backgroundColor: THEME.error,
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 16,
    marginHorizontal: 16,
    borderRadius: 8,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  alertIcon: {
    marginRight: 10,
  },
  alertText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    flex: 1,
  },
  card: {
    marginHorizontal: 16,
    marginBottom: 16,
  },
  sessionHeader: {
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sessionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: THEME.text.primary,
    marginBottom: 4,
  },
  sessionTime: {
    fontSize: 14,
    color: THEME.text.secondary,
  },
  sessionControls: {
    flexDirection: 'row',
  },
  sessionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 24,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    minWidth: 80,
    justifyContent: 'center',
  },
  startButton: {
    position: 'relative',
  },
  stopButton: {
    backgroundColor: THEME.error,
  },
  sessionButtonText: {
    color: '#fff',
    fontWeight: '600',
    marginLeft: 4,
    fontSize: 14,
  },
  summaryTilesContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    padding: 16,
  },
  summaryTile: {
    width: '30%',
    alignItems: 'center',
    padding: 10,
    borderRadius: 12,
    backgroundColor: 'rgba(0,0,0,0.03)',
    minHeight: 115,
    justifyContent: 'center',
  },
  summaryTileValue: {
    fontSize: 18,
    fontWeight: '700',
    color: THEME.text.primary,
    marginVertical: 8,
    textAlign: 'center',
  },
  summaryTileLabel: {
    fontSize: 13,
    color: THEME.text.secondary,
    textAlign: 'center',
  },
  sectionHeader: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: THEME.divider,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: THEME.text.primary,
  },
  connectionStatusFooter: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    paddingVertical: 8,
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
  },
  connectionStatusText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '500',
  },
  glassCard: {
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
    borderRadius: 16,
    backgroundColor: THEME.cardBackground,
    borderColor: THEME.card.border,
    borderWidth: 1,
    shadowColor: THEME.card.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
    marginHorizontal: 16,
    marginBottom: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: THEME.primary,
    fontSize: 18,
    fontWeight: '600',
    marginTop: 20,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorTitle: {
    color: THEME.error,
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 20,
  },
  errorText: {
    color: THEME.text.secondary,
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 20,
  },
  errorBox: {
    padding: 16,
    backgroundColor: 'rgba(255, 69, 58, 0.1)', // Light red background
    borderRadius: 8,
    borderWidth: 1,
    borderColor: THEME.error,
    alignItems: 'center',
    marginHorizontal: 16,
    marginBottom: 16,
  },
  errorTextDetail: {
    color: THEME.error,
    fontSize: 14,
    marginTop: 4,
    textAlign: 'center',
  },
  buttonLoader: {
    marginRight: 6,
  },
  dataActionTile: {
    width: '22%', // Slightly narrower to fit 4 tiles
    alignItems: 'center',
    padding: 8,
    marginHorizontal: 2,
    borderRadius: 12,
    backgroundColor: 'rgba(0,0,0,0.03)',
    minHeight: 110,
    justifyContent: 'center',
  },
  dataActionValue: {
    fontSize: 14,
    fontWeight: '700',
    color: THEME.text.primary,
    marginVertical: 6,
    textAlign: 'center',
  },
  dataActionLabel: {
    fontSize: 12,
    color: THEME.text.secondary,
    textAlign: 'center',
  },
});