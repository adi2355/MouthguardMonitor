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
import { useBluetoothService, useDeviceService } from '@/src/providers/AppProvider';
import { LiveDataPoint, SavedDevice, DeviceStatus } from '@/src/types';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import LineChart from '../../app/components/charts/LineChart';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';

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
  
  // Session State
  const [isSessionActive, setIsSessionActive] = useState(false);
  const [sessionStartTime, setSessionStartTime] = useState<Date | null>(null);
  const [elapsedTime, setElapsedTime] = useState(0);
  
  // Loading & Refreshing State
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  
  // Data State 
  const [connectedDevices, setConnectedDevices] = useState<DeviceStatus[]>([]);
  const [recentImpacts, setRecentImpacts] = useState(SAMPLE_IMPACT_EVENTS);
  const [deviceHistory, setDeviceHistory] = useState<SavedDevice[]>([]); 
  
  // Live Data State
  const [currentAcceleration, setCurrentAcceleration] = useState<number | null>(null);
  const [currentHeartRate, setCurrentHeartRate] = useState<number | null>(null);
  const [maxHeartRateSession, setMaxHeartRateSession] = useState<number | null>(null);
  
  // Create a ref to track the latest connectedDevices state without triggering effect reruns
  const connectedDevicesRef = useRef<DeviceStatus[]>([]);
  
  // Update the ref whenever connectedDevices changes
  useEffect(() => {
    connectedDevicesRef.current = connectedDevices;
  }, [connectedDevices]);
  
  // Timer interval for session timing remains the same
  useEffect(() => {
    let timerInterval = null;
    
    if (isSessionActive && sessionStartTime) {
      timerInterval = setInterval(() => {
        const now = new Date();
        const elapsed = now.getTime() - sessionStartTime.getTime();
        setElapsedTime(elapsed);
      }, 1000);
    }
    
    return () => {
      if (timerInterval) {
        clearInterval(timerInterval);
      }
    };
  }, [isSessionActive, sessionStartTime]);
  
  // Load data function with real data
  const loadData = useCallback(async () => {
    console.log("[Dashboard] Loading data...");
    setLoading(true);
    try {
      // Fetch device statuses from bluetooth service
      const initialStatuses = bluetoothService.getDeviceStatuses();
      setConnectedDevices(initialStatuses.filter(d => d.connected));

      // Fetch saved device history
      const saved = await deviceService.getSavedDevices();
      // Sort by last connected time (most recent first) and take top 5
      const sortedHistory = saved
        .filter(d => d.lastConnected)
        .sort((a, b) => (b.lastConnected || 0) - (a.lastConnected || 0))
        .slice(0, 5);
      setDeviceHistory(sortedHistory);

      // For now, keep sample impacts until we implement the repository
      // const impacts = await sensorDataRepository.getRecentImpacts(5);
      // setRecentImpacts(impacts);

      console.log("[Dashboard] Initial data loaded");
    } catch (error) {
      console.error('Error loading dashboard data:', error);
      Alert.alert('Error', 'Failed to load dashboard data');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [bluetoothService, deviceService]);

  // Modify the useEffect for Bluetooth subscriptions to remove connectedDevices dependency
  useEffect(() => {
    loadData(); // Initial load

    // Subscribe to device status updates
    const statusSubscription = bluetoothService.subscribeToDeviceStatusUpdates(deviceStatus => {
      // Update the list of connected devices
      setConnectedDevices(prev => {
        const existingIndex = prev.findIndex(d => d.id === deviceStatus.id);
        if (deviceStatus.connected) {
          if (existingIndex > -1) {
            // Update existing
            const updated = [...prev];
            updated[existingIndex] = deviceStatus;
            return updated;
          } else {
            // Add new connected device
            return [...prev, deviceStatus];
          }
        } else {
          // Remove disconnected device
          return prev.filter(d => d.id !== deviceStatus.id);
        }
      });
    });

    // Subscribe to live sensor data
    const sensorSubscription = bluetoothService.subscribeSensorData((deviceId, dataPoint: LiveDataPoint) => {
      // Use the ref instead of the state to check if device is connected
      const deviceIsConnected = connectedDevicesRef.current.some(d => d.id === deviceId);
      if (!deviceIsConnected) return;

      if (dataPoint.type === 'accelerometer') {
        const magnitude = dataPoint.values[3]; // Assuming magnitude is the 4th value
        setCurrentAcceleration(magnitude);
      } else if (dataPoint.type === 'heartRate') {
        const hr = dataPoint.values[0];
        setCurrentHeartRate(hr);
        // Update session max HR if needed
        if (isSessionActive) {
          setMaxHeartRateSession(prevMax => (hr > (prevMax ?? 0) ? hr : prevMax));
        }
      }
    });

    return () => {
      statusSubscription.remove();
      sensorSubscription.remove();
    };
  }, [bluetoothService, loadData, isSessionActive]);

  // Handle refresh
  const onRefresh = useCallback(() => {
    console.log("[Dashboard] Refresh triggered");
    setRefreshing(true);
    loadData();
  }, [loadData]);
  
  // Session control functions remain the same
  const handleStartSession = () => {
    setIsSessionActive(true);
    setSessionStartTime(new Date());
    setElapsedTime(0);
    setMaxHeartRateSession(null); // Reset max HR for new session
    Alert.alert('Session Started', 'Monitoring session has begun. All connected devices will record data.');
  };
  
  const handleStopSession = async () => {
    if (!isSessionActive || !sessionStartTime) return;
    
    const endTime = new Date();
    const duration = endTime.getTime() - sessionStartTime.getTime();
    setIsSessionActive(false);
    
    try {
      // Simulate saving session
      await new Promise(resolve => setTimeout(resolve, 500));
      
      Alert.alert(
        'Session Ended',
        `Duration: ${formatDuration(duration)}`,
        [{ text: 'View Report', onPress: () => router.push('/(tabs)/reports') }, { text: 'OK' }]
      );
    } catch (error) {
      console.error('Error ending session:', error);
      Alert.alert('Error', 'Failed to end session');
    }
  };
  
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

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
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
            <Text style={styles.headerTitle}>{name}</Text>
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

        {/* --- Alert Banner (Conditional) --- */}
        {concussionRisk === 'High' && (
          <View style={styles.alertBanner}>
            <MaterialCommunityIcons name="alert-decagram" size={24} color="#fff" style={styles.alertIcon} />
            <Text style={styles.alertText}>High Concussion Risk Detected</Text>
          </View>
        )}

        {/* --- Session Control (Keep this GlassCard) --- */}
        <GlassCard style={styles.card}>
          <View style={styles.sessionHeader}>
            <View>
              <Text style={styles.sessionTitle}>
                {isSessionActive ? 'Session in Progress' : 'Start New Session'}
              </Text>
              {isSessionActive && sessionStartTime && (
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
                >
                  <MaterialCommunityIcons name="stop-circle" size={20} color="#fff" />
                  <Text style={styles.sessionButtonText}>End</Text>
                </TouchableOpacity>
              ) : (
                <TouchableOpacity
                  style={[styles.sessionButton, styles.startButton]}
                  onPress={handleStartSession}
                >
                  <LinearGradient
                    colors={['#00d68f', '#00b076']}
                    style={StyleSheet.absoluteFill}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                  />
                  <MaterialCommunityIcons name="play-circle" size={20} color="#fff" />
                  <Text style={styles.sessionButtonText}>Start</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        </GlassCard>

        {/* --- NEW: Summary Tiles Card --- */}
        <GlassCard style={styles.card}>
          <View style={styles.summaryTilesContainer}>
            {/* Heart Rate Tile */}
            <TouchableOpacity style={styles.summaryTile} onPress={() => handleTilePress('heartRate')}>
              <MaterialCommunityIcons name="heart-pulse" size={32} color={THEME.primary} />
              <Text style={styles.summaryTileValue}>{sessionStats?.heartRate?.avg ?? '--'} bpm</Text>
              <Text style={styles.summaryTileLabel}>Avg Heart Rate</Text>
            </TouchableOpacity>

            {/* Temperature Tile */}
            <TouchableOpacity style={styles.summaryTile} onPress={() => handleTilePress('temperature')}>
              <MaterialCommunityIcons name="thermometer" size={32} color={THEME.primary} />
              <Text style={styles.summaryTileValue}>{sessionStats?.temperature ?? '--'} °F</Text>
              <Text style={styles.summaryTileLabel}>Avg Temp</Text>
            </TouchableOpacity>

            {/* Acceleration Tile */}
            <TouchableOpacity style={styles.summaryTile} onPress={() => handleTilePress('acceleration')}>
              <MaterialCommunityIcons name="run-fast" size={32} color={THEME.primary} />
              <Text style={styles.summaryTileValue}>{sessionStats?.acceleration ?? '--'} mph</Text>
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
            <TouchableOpacity style={styles.summaryTile} onPress={navigateToLogs}>
              <MaterialCommunityIcons name="chart-line" size={32} color={THEME.primary} />
              <Text style={styles.summaryTileValue}>Logs</Text>
              <Text style={styles.summaryTileLabel}>View Data</Text>
            </TouchableOpacity>
            
            {/* Test Data Generator Tile */}
            <TouchableOpacity style={styles.summaryTile} onPress={() => router.push('/screens/TestDataScreen')}>
              <MaterialCommunityIcons name="database-plus" size={32} color={THEME.primary} />
              <Text style={styles.summaryTileValue}>Test Data</Text>
              <Text style={styles.summaryTileLabel}>Insert Data</Text>
            </TouchableOpacity>
            
            {/* Reports Tile */}
            <TouchableOpacity style={styles.summaryTile} onPress={() => router.push('/(tabs)/reportsDetailed')}>
              <MaterialCommunityIcons name="chart-timeline-variant" size={32} color={THEME.primary} />
              <Text style={styles.summaryTileValue}>Reports</Text>
              <Text style={styles.summaryTileLabel}>Analytics</Text>
            </TouchableOpacity>
            
            {/* Settings Tile */}
            <TouchableOpacity style={styles.summaryTile} onPress={() => router.push('/(tabs)/settings')}>
              <MaterialCommunityIcons name="cog-outline" size={32} color={THEME.primary} />
              <Text style={styles.summaryTileValue}>Settings</Text>
              <Text style={styles.summaryTileLabel}>Configure</Text>
            </TouchableOpacity>
          </View>
        </GlassCard>

        {/* Bottom tab spacer */}
        <View style={{ height: 80 }} /> {/* Increased height to accommodate footer */}

      </ScrollView>

      {/* --- Connection Status Footer --- */}
      <View style={styles.connectionStatusFooter}>
        <Text style={styles.connectionStatusText}>
          {isDeviceConnected ? 'Device Connected' : 'No Device Connected'}
        </Text>
      </View>
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
    justifyContent: 'space-around',
    padding: 16,
  },
  summaryTile: {
    flex: 1,
    alignItems: 'center',
    padding: 10,
    marginHorizontal: 4,
    borderRadius: 12,
    backgroundColor: 'rgba(0,0,0,0.03)',
    minHeight: 120,
    justifyContent: 'center',
  },
  summaryTileValue: {
    fontSize: 18,
    fontWeight: '700',
    color: THEME.text.primary,
    marginVertical: 8,
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
});