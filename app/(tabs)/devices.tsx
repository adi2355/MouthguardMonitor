import { Athlete, DeviceStatus, SavedDevice } from '@/src/types';
import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  ScrollView,
  RefreshControl,
  Platform
} from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useBluetoothService, useAthleteRepository } from '@/src/providers/AppProvider';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';

// Custom theme colors for beige theme
const THEME = {
  background: '#f2efe4', // Beige background matching bottom bar
  cardBackground: '#ffffff',
  primary: '#00b076', // Green primary color
  success: '#34c759',
  error: '#ff3b30',
  warning: '#ff9500',
  text: {
    primary: '#333333',
    secondary: '#666666',
    tertiary: '#999999',
    onPrimary: '#ffffff',
  },
  divider: 'rgba(0,0,0,0.08)',
  card: {
    shadow: 'rgba(0,0,0,0.12)',
    border: 'rgba(0,0,0,0.05)',
  }
};

// Premium Glass Card component
const GlassCard = ({ style, children, intensity = 15 }: { 
  style?: any; 
  children: React.ReactNode; 
  intensity?: number 
}) => {
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

export default function Devices() {
  const router = useRouter();
  const bluetoothService = useBluetoothService();
  const athleteRepository = useAthleteRepository();
  
  const [savedDevices, setSavedDevices] = useState<DeviceStatus[]>([]);
  const [scannedDevices, setScannedDevices] = useState<{id: string, name: string}[]>([]);
  const [scanning, setScanning] = useState(false);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [connectionInProgress, setConnectionInProgress] = useState(false);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const [selectedDeviceId, setSelectedDeviceId] = useState<string | null>(null);
  const [athleteListVisible, setAthleteListVisible] = useState(false);
  const [athletes, setAthletes] = useState<Athlete[]>([]);
  
  // Load devices and status
  const loadDevices = useCallback(async () => {
    try {
      setLoading(true);
      // Get device statuses from BluetoothService
      const deviceStatuses = bluetoothService.getDeviceStatuses();
      setSavedDevices(deviceStatuses);

      // Load athletes for assignment
      const athleteList = await athleteRepository.getAllAthletes();
      setAthletes(athleteList);
    } catch (error) {
      console.error('Error loading devices:', error);
      Alert.alert('Error', 'Failed to load devices');
    } finally {
      setLoading(false);
    }
  }, [bluetoothService, athleteRepository]);
  
  // Handle refresh
  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadDevices();
    setRefreshing(false);
  }, [loadDevices]);
  
  // Initial load
  useEffect(() => {
    loadDevices();
  }, [loadDevices]);
  
  // Subscribe to device status updates
  useEffect(() => {
    const unsubscribe = bluetoothService.subscribeToDeviceStatusUpdates((status: DeviceStatus) => {
      // Use a function to update based on previous state
      setSavedDevices(prevStatuses => {
        // Check if this status is already in our list
        const statusIndex = prevStatuses.findIndex(s => s.id === status.id);
        
        if (statusIndex >= 0) {
          // Update existing status
          return prevStatuses.map(s => 
            s.id === status.id ? status : s
          );
        } else {
          // Add new status
          return [...prevStatuses, status];
        }
      });
    });
    
    // Call the remove method on the unsubscribe object instead of treating it as a function
    return () => {
      if (unsubscribe && typeof unsubscribe.remove === 'function') {
        unsubscribe.remove();
      } else {
        console.warn("[Devices] Cleanup function received invalid unsubscribe object:", unsubscribe);
      }
    };
  }, [bluetoothService]);
  
  // Connect to a device
  const connectToDevice = async (deviceId: string, deviceName: string) => {
    try {
      setConnectionInProgress(true);
      setConnectionError(null);
      
      await bluetoothService.connectToDevice(deviceId);
      
      // Success will be reflected via the subscription to device status updates
      Alert.alert('Success', `Connected to ${deviceName || deviceId}`);
    } catch (error) {
      console.error('Error connecting to device:', error);
      setConnectionError('Failed to connect to device. Please try again.');
      Alert.alert('Connection Error', 'Failed to connect to device. Please try again.');
    } finally {
      setConnectionInProgress(false);
    }
  };
  
  // Disconnect from a device
  const disconnectDevice = async (deviceId: string) => {
    try {
      await bluetoothService.disconnectFromDevice(deviceId);
      
      // Success will be reflected via the subscription to device status updates
    } catch (error) {
      console.error('Error disconnecting from device:', error);
      Alert.alert('Disconnection Error', 'Failed to disconnect from device. Please try again.');
    }
  };
  
  // Scan for devices
  const scanDevices = async () => {
    try {
      setScanning(true);
      setScannedDevices([]);
      
      await bluetoothService.scanForDevices((device) => {
        setScannedDevices(prevDevices => {
          const deviceMap = new Map(prevDevices.map(d => [d.id, d]));
          if (!deviceMap.has(device.id) && device.name) {
            deviceMap.set(device.id, { id: device.id, name: device.name });
            return Array.from(deviceMap.values());
          }
          return prevDevices;
        });
      });
      
    } catch (error) {
      console.error('Error scanning for devices:', error);
      Alert.alert('Scan Error', 'Failed to scan for devices. Please check Bluetooth permissions and try again.');
    } finally {
      setScanning(false);
    }
  };
  
  // Open the athlete assignment modal
  const openAssignDeviceModal = (deviceId: string) => {
    setSelectedDeviceId(deviceId);
    setAthleteListVisible(true);
  };
  
  // Assign device to athlete
  const assignDeviceToAthlete = async (athleteId: string) => {
    if (!selectedDeviceId) return;
    
    try {
      await athleteRepository.assignDeviceToAthlete(athleteId, selectedDeviceId);
      
      // Update local saved devices
      await loadDevices();
      
      // Close the modal
      setAthleteListVisible(false);
      setSelectedDeviceId(null);
      
      Alert.alert('Success', 'Device assigned to athlete');
    } catch (error) {
      console.error('Error assigning device to athlete:', error);
      Alert.alert('Assignment Error', 'Failed to assign device to athlete. Please try again.');
    }
  };
  
  // Renders saved device
  const renderDevice = ({ item }: { item: DeviceStatus }) => {
    const isConnected = item.connected;
    
    return (
      <TouchableOpacity 
        style={styles.deviceItem}
        activeOpacity={0.7}
      >
        <LinearGradient
          colors={[isConnected ? 'rgba(0,176,118,0.15)' : 'rgba(0,0,0,0.08)', isConnected ? 'rgba(0,176,118,0.05)' : 'rgba(0,0,0,0.02)']}
          style={[styles.deviceIcon, { borderRadius: 20 }]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <MaterialCommunityIcons 
            name="tooth-outline" 
            size={22} 
            color={isConnected ? THEME.primary : THEME.text.secondary} 
          />
        </LinearGradient>
        <View style={styles.deviceInfo}>
          <Text style={styles.deviceName}>{item.name}</Text>
          <Text style={[styles.deviceStatus, isConnected ? styles.connectedText : styles.disconnectedText]}>
            {isConnected ? "Connected" : "Not Connected"}
          </Text>
          {item.batteryLevel !== undefined && (
            <View style={styles.batteryContainer}>
              <MaterialCommunityIcons 
                name={getBatteryIcon(item.batteryLevel)} 
                size={14} 
                color={getBatteryColor(item.batteryLevel)} 
              />
              <Text style={[styles.batteryText, {color: getBatteryColor(item.batteryLevel)}]}>
                {item.batteryLevel}%
              </Text>
            </View>
          )}
          {item.athleteInfo && (
            <Text style={styles.athleteText}>Assigned to: {item.athleteInfo.name}</Text>
          )}
        </View>
        <View style={styles.deviceActions}>
          {connectionInProgress && selectedDeviceId === item.id ? (
            <View style={styles.loadingButton}>
              <ActivityIndicator size="small" color={THEME.primary} />
            </View>
          ) : isConnected ? (
            <TouchableOpacity 
              onPress={() => disconnectDevice(item.id)}
              style={styles.actionButton}
              disabled={connectionInProgress}
              activeOpacity={0.7}
            >
              <MaterialCommunityIcons name="bluetooth-off" size={20} color={THEME.error} />
            </TouchableOpacity>
          ) : (
            <TouchableOpacity 
              onPress={() => connectToDevice(item.id, item.name)}
              style={styles.actionButton}
              disabled={connectionInProgress}
              activeOpacity={0.7}
            >
              <MaterialCommunityIcons name="bluetooth-connect" size={20} color={THEME.primary} />
            </TouchableOpacity>
          )}
          
          <TouchableOpacity 
            onPress={() => openAssignDeviceModal(item.id)}
            style={styles.actionButton}
            activeOpacity={0.7}
          >
            <MaterialCommunityIcons name="account-plus" size={20} color={THEME.text.primary} />
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    );
  };
  
  // Renders scanned device
  const renderScannedDevice = ({ item }: { item: any }) => {
    // Check if this device is already saved
    const isAlreadySaved = savedDevices.some(device => device.id === item.id);
    
    return (
      <TouchableOpacity 
        style={styles.deviceItem}
        activeOpacity={0.7}
      >
        <LinearGradient
          colors={['#4c669f', '#3b5998']}
          style={{
            width: 50,
            height: 50,
            borderRadius: 25,
            justifyContent: 'center',
            alignItems: 'center',
            marginRight: 10,
            borderWidth: 2,
            borderColor: 'white',
          }}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
        >
          <MaterialCommunityIcons 
            name="bluetooth-connect" 
            size={22} 
            color={THEME.primary} 
          />
        </LinearGradient>
        <View style={styles.deviceInfo}>
          <Text style={styles.deviceName}>{item.name || item.id}</Text>
          <Text style={styles.newDeviceLabel}>New Device</Text>
        </View>
        <View style={styles.deviceActions}>
          {!isAlreadySaved && (
            <TouchableOpacity 
              onPress={() => connectToDevice(item.id, item.name)}
              style={styles.actionButton}
              disabled={connectionInProgress}
              activeOpacity={0.7}
            >
              <MaterialCommunityIcons name="bluetooth-connect" size={20} color={THEME.primary} />
            </TouchableOpacity>
          )}
        </View>
      </TouchableOpacity>
    );
  };
  
  // Renders athlete for assignment
  const renderAthlete = ({ item }: { item: Athlete }) => {
    const hasDevice = item.deviceId !== undefined && item.deviceId !== null;
    
    return (
      <TouchableOpacity 
        style={[styles.athleteItem, hasDevice && styles.athleteItemDisabled]}
        onPress={() => !hasDevice && assignDeviceToAthlete(item.id)}
        disabled={hasDevice}
        activeOpacity={0.7}
      >
        <LinearGradient
          colors={[hasDevice ? 'rgba(0,0,0,0.05)' : 'rgba(0,176,118,0.15)', hasDevice ? 'rgba(0,0,0,0.02)' : 'rgba(0,176,118,0.05)']}
          style={[styles.deviceIcon, { borderRadius: 20 }]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <MaterialCommunityIcons 
            name="account" 
            size={22} 
            color={hasDevice ? THEME.text.tertiary : THEME.primary} 
          />
        </LinearGradient>
        <View style={styles.athleteInfo}>
          <Text style={[styles.athleteName, hasDevice && styles.textDisabled]}>{item.name}</Text>
          {hasDevice ? (
            <Text style={styles.textDisabled}>Already has device assigned</Text>
          ) : (
            <Text style={styles.availableText}>Available for assignment</Text>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  // Connected Devices section
  const connectedDevicesSection = (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Connected Devices</Text>
      <GlassCard style={styles.sectionCard}>
        <LinearGradient
          colors={['rgba(255,255,255,0.95)', 'rgba(255,255,255,0.75)']}
          style={styles.cardGradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 0, y: 1 }}
        />
        <View style={styles.cardInner}>
          {loading ? (
            <ActivityIndicator color={THEME.primary} />
          ) : savedDevices.filter(device => device.connected).length > 0 ? (
            <FlatList
              data={savedDevices.filter(device => device.connected)}
              keyExtractor={(item) => item.id}
              renderItem={renderDevice}
              scrollEnabled={false}
              ItemSeparatorComponent={() => <View style={styles.deviceSeparator} />}
              extraData={savedDevices} // Add extraData to ensure updates
            />
          ) : (
            <View style={styles.emptyStateContainer}>
              <LinearGradient
                colors={['rgba(0,0,0,0.06)', 'rgba(0,0,0,0.03)']}
                style={[styles.emptyStateIcon, { borderRadius: 30 }]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                <MaterialCommunityIcons name="bluetooth-off" size={36} color={THEME.text.tertiary} />
              </LinearGradient>
              <Text style={styles.emptyStateText}>No connected devices</Text>
              <Text style={styles.emptyStateSubtext}>Connect to a mouthguard device to monitor impacts</Text>
            </View>
          )}
        </View>
      </GlassCard>
    </View>
  );
  
  // Available Devices section
  const availableDevicesSection = (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Available Devices</Text>
      <GlassCard style={styles.sectionCard}>
        <LinearGradient
          colors={['rgba(255,255,255,0.95)', 'rgba(255,255,255,0.75)']}
          style={styles.cardGradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 0, y: 1 }}
        />
        <View style={styles.cardInner}>
          {loading ? (
            <ActivityIndicator color={THEME.primary} />
          ) : savedDevices.filter(device => !device.connected).length > 0 ? (
            <FlatList
              data={savedDevices.filter(device => !device.connected)}
              keyExtractor={(item) => item.id}
              renderItem={renderDevice}
              scrollEnabled={false}
              ItemSeparatorComponent={() => <View style={styles.deviceSeparator} />}
              extraData={savedDevices} // Add extraData to ensure updates
            />
          ) : (
            <View style={styles.emptyStateContainer}>
              <LinearGradient
                colors={['rgba(0,0,0,0.06)', 'rgba(0,0,0,0.03)']}
                style={[styles.emptyStateIcon, { borderRadius: 30 }]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                <MaterialCommunityIcons name="bluetooth-settings" size={36} color={THEME.text.tertiary} />
              </LinearGradient>
              <Text style={styles.emptyStateText}>No available devices</Text>
              <Text style={styles.emptyStateSubtext}>All saved devices are currently connected</Text>
            </View>
          )}
        </View>
      </GlassCard>
    </View>
  );

  // Scan for devices button (bottom)
  const scanDevicesButton = connectionInProgress ? (
    <View style={styles.scanButtonContainer}>
      <TouchableOpacity
        style={[styles.scanButton, styles.scanningButton]}
        disabled={true}
      >
        <View style={styles.scanButtonInner}>
          <ActivityIndicator color="#fff" size="small" style={styles.scanningIcon} />
          <Text style={styles.scanButtonText}>Connecting...</Text>
        </View>
      </TouchableOpacity>
    </View>
  ) : (
    <View style={styles.scanButtonContainer}>
      <TouchableOpacity
        style={styles.scanButton}
        onPress={scanDevices}
        disabled={scanning}
      >
        <View style={styles.scanButtonInner}>
          {scanning ? (
            <ActivityIndicator color="#fff" size="small" style={styles.scanningIcon} />
          ) : (
            <MaterialCommunityIcons name="bluetooth-connect" size={24} color="#fff" />
          )}
          <Text style={styles.scanButtonText}>{scanning ? 'Scanning...' : 'Scan for Devices'}</Text>
        </View>
      </TouchableOpacity>
      
      <TouchableOpacity 
        style={styles.addDeviceButton}
        onPress={() => router.push('/')}
      >
        <LinearGradient
          colors={['rgba(0,176,118,0.1)', 'rgba(0,176,118,0.05)']}
          style={styles.addDeviceButton}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <MaterialCommunityIcons name="account-plus" size={24} color={THEME.primary} />
        </LinearGradient>
        <View style={styles.addDeviceText}>
          <Text style={styles.addDeviceTitle}>Athlete Management</Text>
          <Text style={styles.addDeviceDescription}>Manage athletes and assign devices</Text>
        </View>
        <TouchableOpacity
          style={styles.addDeviceAction}
          onPress={() => router.push('/')}
          activeOpacity={0.7}
        >
          <MaterialCommunityIcons name="chevron-right" size={24} color={THEME.primary} />
        </TouchableOpacity>
      </TouchableOpacity>
    </View>
  );

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
            progressBackgroundColor="rgba(0,0,0,0.05)"
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
            <Text style={styles.headerTitle}>Devices</Text>
          </View>
        </View>

        {connectedDevicesSection}
        {availableDevicesSection}

        {/* Scan Devices Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Discover New Devices</Text>
            {scanDevicesButton}
          </View>
          
          <GlassCard style={styles.sectionCard}>
            <LinearGradient
              colors={['rgba(255,255,255,0.95)', 'rgba(255,255,255,0.75)']}
              style={styles.cardGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 0, y: 1 }}
            />
            <View style={styles.cardInner}>
              {scanning ? (
                <View style={styles.loadingContainer}>
                  <ActivityIndicator size="large" color={THEME.primary} />
                  <Text style={styles.loadingText}>Scanning for devices...</Text>
                </View>
              ) : scannedDevices.length > 0 ? (
                <FlatList
                  data={scannedDevices}
                  keyExtractor={(item) => item.id}
                  renderItem={renderScannedDevice}
                  scrollEnabled={false}
                  ItemSeparatorComponent={() => <View style={styles.deviceSeparator} />}
                />
              ) : (
                <View style={styles.emptyStateContainer}>
                  <LinearGradient
                    colors={['rgba(0,0,0,0.06)', 'rgba(0,0,0,0.03)']}
                    style={[styles.emptyStateIcon, { borderRadius: 30 }]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                  >
                    <MaterialCommunityIcons name="bluetooth-transfer" size={36} color={THEME.text.tertiary} />
                  </LinearGradient>
                  <Text style={styles.emptyStateText}>No devices found</Text>
                  <Text style={styles.emptyStateSubtext}>Tap the Scan button to search for nearby mouthguard devices</Text>
                </View>
              )}
            </View>
          </GlassCard>
        </View>

        {/* Athletes Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Athletes & Assignments</Text>
            <TouchableOpacity 
              style={styles.addButton}
              onPress={() => router.push('/')}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={['#00d68f', '#00b076']}
                style={[StyleSheet.absoluteFill, { borderRadius: 24 }]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              />
              <MaterialCommunityIcons name="account-plus" size={20} color="#fff" />
              <Text style={styles.scanButtonText}>Add Athlete</Text>
            </TouchableOpacity>
          </View>
          
          <GlassCard style={styles.sectionCard}>
            <LinearGradient
              colors={['rgba(255,255,255,0.95)', 'rgba(255,255,255,0.75)']}
              style={styles.cardGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 0, y: 1 }}
            />
            <View style={styles.cardInner}>
              {athletes.length > 0 ? (
                <FlatList
                  data={athletes}
                  keyExtractor={(item) => item.id}
                  renderItem={renderAthlete}
                  scrollEnabled={false}
                  ItemSeparatorComponent={() => <View style={styles.deviceSeparator} />}
                />
              ) : (
                <View style={styles.emptyStateContainer}>
                  <LinearGradient
                    colors={['rgba(0,0,0,0.06)', 'rgba(0,0,0,0.03)']}
                    style={[styles.emptyStateIcon, { borderRadius: 30 }]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                  >
                    <MaterialCommunityIcons name="account-group" size={36} color={THEME.text.tertiary} />
                  </LinearGradient>
                  <Text style={styles.emptyStateText}>No athletes found</Text>
                  <Text style={styles.emptyStateSubtext}>Add athletes to start assigning devices</Text>
                </View>
              )}
            </View>
          </GlassCard>
        </View>

        {connectionError && (
          <View style={styles.errorContainer}>
            <MaterialCommunityIcons name="alert-circle" size={20} color={THEME.error} />
            <Text style={styles.errorText}>{connectionError}</Text>
          </View>
        )}
        
        {/* Bottom tab spacer */}
        <View style={{ height: 24 }} />
      </ScrollView>
    </SafeAreaProvider>
  );
}

// Helper functions
const getBatteryIcon = (level: number | undefined) => {
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

const getBatteryColor = (level: number | undefined) => {
  if (level === undefined) return '#999999';
  if (level <= 20) return '#ff3b30'; // Red
  if (level <= 40) return '#ff9500'; // Orange
  return '#34c759'; // Green
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: THEME.background, // Beige background
  },
  contentContainer: {
    paddingBottom: 32,
    paddingHorizontal: 16,
  },
  // Premium header styling
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
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: THEME.text.primary,
    marginBottom: 12,
    letterSpacing: 0.3,
  },
  // Glass card styles
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
  cardInner: {
    padding: 16,
  },
  sectionCard: {
    position: 'relative',
  },
  deviceItem: {
    flexDirection: 'row',
    paddingVertical: 14,
    paddingHorizontal: 4,
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
  deviceIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    borderWidth: 1,
    borderColor: 'rgba(0, 176, 118, 0.2)',
  },
  deviceInfo: {
    flex: 1,
  },
  deviceName: {
    fontSize: 16,
    fontWeight: '600',
    color: THEME.text.primary,
    marginBottom: 4,
    letterSpacing: 0.2,
  },
  deviceStatus: {
    fontSize: 14,
    marginBottom: 4,
    letterSpacing: 0.2,
  },
  connectedText: {
    color: THEME.success,
    fontWeight: '500',
  },
  disconnectedText: {
    color: THEME.text.tertiary,
  },
  newDeviceLabel: {
    color: THEME.primary,
    fontSize: 14,
    fontWeight: '500',
    letterSpacing: 0.2,
  },
  batteryContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.03)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
    alignSelf: 'flex-start',
    marginBottom: 4,
  },
  batteryText: {
    fontSize: 12,
    marginLeft: 4,
    fontWeight: '500',
  },
  athleteText: {
    fontSize: 12,
    color: THEME.primary,
    fontWeight: '500',
    letterSpacing: 0.2,
  },
  deviceActions: {
    flexDirection: 'row',
  },
  actionButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(0,0,0,0.03)',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 6,
    shadowColor: THEME.card.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  loadingButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(0,0,0,0.03)',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 6,
  },
  deviceSeparator: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: THEME.divider,
    marginHorizontal: 4,
  },
  // Premium scan button
  scanButton: {
    position: 'relative',
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
  },
  addButton: {
    position: 'relative',
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
  },
  scanButtonText: {
    color: THEME.text.onPrimary,
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 6,
  },
  emptyStateContainer: {
    padding: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyStateIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  emptyStateText: {
    fontSize: 17,
    fontWeight: '600',
    color: THEME.text.primary,
    marginBottom: 8,
    textAlign: 'center',
    letterSpacing: 0.2,
  },
  emptyStateSubtext: {
    fontSize: 15,
    color: THEME.text.secondary,
    textAlign: 'center',
    lineHeight: 22,
    maxWidth: '80%',
  },
  loadingContainer: {
    padding: 32,
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
  loadingText: {
    marginTop: 12,
    color: THEME.text.secondary,
    fontSize: 15,
    letterSpacing: 0.2,
  },
  errorContainer: {
    backgroundColor: 'rgba(255, 50, 50, 0.08)',
    padding: 12,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 59, 48, 0.2)',
  },
  errorText: {
    color: THEME.error,
    fontSize: 14,
    marginLeft: 8,
    flex: 1,
  },
  athleteItem: {
    flexDirection: 'row',
    paddingVertical: 14,
    paddingHorizontal: 4,
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
  athleteInfo: {
    flex: 1,
  },
  athleteName: {
    fontSize: 16,
    fontWeight: '600',
    color: THEME.text.primary,
    marginBottom: 4,
    letterSpacing: 0.2,
  },
  textDisabled: {
    color: THEME.text.tertiary,
  },
  availableText: {
    color: THEME.primary,
    fontSize: 12,
  },
  athleteItemDisabled: {
    opacity: 0.7,
  },
  emptyMessage: {
    fontSize: 16,
    fontWeight: '500',
    color: THEME.text.tertiary,
    textAlign: 'center',
    marginBottom: 16,
  },
  scanButtonContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  scanningButton: {
    opacity: 0.5,
  },
  scanButtonInner: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  scanningIcon: {
    marginRight: 8,
  },
  addDeviceButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: THEME.primary,
  },
  addDeviceText: {
    flex: 1,
    marginLeft: 12,
  },
  addDeviceTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: THEME.text.onPrimary,
  },
  addDeviceDescription: {
    fontSize: 14,
    color: THEME.text.onPrimary,
  },
  addDeviceAction: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: THEME.primary,
  },
});