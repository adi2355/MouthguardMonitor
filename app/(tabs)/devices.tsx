import { BluetoothContext, BluetoothHandler } from '@/src/contexts/BluetoothContext';
import { getSavedDevices, saveDevices } from '@/src/dbManager';
import { SavedDevice } from '@/src/types';
import React, { useState, useEffect, useRef, useContext } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  ScrollView
} from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import base64 from 'react-native-base64';
import { BleError, BleManager, Characteristic, Device } from 'react-native-ble-plx';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { COLORS } from '@/src/constants';
import { LinearGradient } from 'expo-linear-gradient';

export default function Devices() {
  const [savedDevices, setSavedDevices] = useState<SavedDevice[]>([]);
  const [scannedDevices, setScannedDevices] = useState<Device[]>([]);
  const [scanning, setScanning] = useState<boolean>(false);
  const [deviceConnectedId, setDeviceConnectedId] = useState<string|null >(null);
  const [connectionError, setConnectionError] = useState<string|null>(null);

  //Track devices to avoid duplicate keys when scanning
  const undiscoveredDeviceSet: React.MutableRefObject<Set<string>> = useRef(new Set<string>());
  
  const bluetoothHandler: BluetoothHandler = useContext(BluetoothContext)!;

  useEffect(() => {
    updateSavedDevices();
    
    // Check if there's already a connected device
    const connectedDevice = bluetoothHandler.getConnectedDevice();
    if (connectedDevice) {
      setDeviceConnectedId(connectedDevice.id);
    }
  }, []);

  useEffect(() => {
    // This effect will run whenever savedDevices or deviceConnectedId changes
    console.log(`Connected device ID: ${deviceConnectedId}`);
  }, [savedDevices, deviceConnectedId]);

 
  function connectAndListenToDevice(deviceId: string, device?: Device): void {
    if (deviceConnectedId === deviceId) {
      return;
    }
    
    setConnectionError(null);

    bluetoothHandler.connectToDevice(deviceId)
      .then(() => {
        try {
          bluetoothHandler.streamOnConnectedDevice();
          if (device) {
            saveDevices([device])
              .then(() => updateSavedDevices())
              .catch(err => console.error("Error saving device:", err));
          }
          setDeviceConnectedId(deviceId);
        } catch (error) {
          console.error("Error setting up stream:", error);
          setConnectionError("Failed to stream data from device");
        }
      })
      .catch(error => {
        console.error("Connection error:", error);
        setConnectionError("Failed to connect to device");
      });
  }
  
  function updateSavedDevices() {
    getSavedDevices()
      .then(devices => {
        console.log("Saved devices:", devices);
        setSavedDevices(devices);
   
        // Prevent saved devices from showing during scanning
        devices.forEach(device => {
          undiscoveredDeviceSet.current.add(device.id);
        });
      })
      .catch(error => {
        console.error("Error getting saved devices:", error);
        // Initialize with empty array if there's an error
        setSavedDevices([]);
      });
  }

  function scanDevices(): void {
    const manager: BleManager = bluetoothHandler.getBLEManager();
    setScanning(true);
    setScannedDevices([]);
    
    // Only clear the set for new devices, keep saved devices in the set
    const savedIds = new Set(savedDevices.map(device => device.id));
    undiscoveredDeviceSet.current = savedIds;

    manager.startDeviceScan(null, null, (error: BleError | null, device: Device | null) => {
      if (error) {
        console.error('Error scanning devices:', error.message);
        setScanning(false);
        return;
      }

      if (device && device.name && !undiscoveredDeviceSet.current.has(device.id)) {
        undiscoveredDeviceSet.current.add(device.id); // Add device ID to the Set
        setScannedDevices((prevDevices) => [...prevDevices, device]);
      }
    });

    // Stop scanning after 10 seconds
    setTimeout(() => {
      manager.stopDeviceScan();
      setScanning(false);
    }, 10000);
  }

  // Renders device
  const renderDevice = ({ item }: { item: Device | SavedDevice }): JSX.Element => (
    <TouchableOpacity 
      style={styles.deviceItem} 
      onPress={() => { (item instanceof Device) ? connectAndListenToDevice(item.id, item) : connectAndListenToDevice(item.id) }}
    >
      <View style={styles.deviceIconContainer}>
        <MaterialCommunityIcons name="bluetooth" size={22} color={COLORS.primary} />
      </View>
      <View style={styles.deviceInfo}>
        <Text style={styles.deviceName}>{item.name}</Text>
        <Text style={styles.deviceStatus}>
          {item.id === deviceConnectedId ? "Connected" : "Not Connected"}
        </Text>
      </View>
      <MaterialCommunityIcons 
        name="chevron-right" 
        size={24} 
        color={COLORS.text.secondary} 
      />
    </TouchableOpacity>
  );

  return (
    <SafeAreaProvider>
      <ScrollView 
        style={styles.container}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Devices</Text>
        </View>

        {/* My Devices Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>My Devices</Text>
          <View style={styles.sectionCard}>
            {savedDevices.length > 0 ? (
              <FlatList
                data={savedDevices}
                keyExtractor={(item) => item.id}
                renderItem={renderDevice}
                scrollEnabled={false}
                ItemSeparatorComponent={() => <View style={styles.deviceSeparator} />}
              />
            ) : (
              <View style={styles.emptyStateContainer}>
                <MaterialCommunityIcons name="devices" size={40} color={COLORS.text.tertiary} />
                <Text style={styles.emptyStateText}>No paired devices</Text>
              </View>
            )}
          </View>
        </View>

        {/* Available Devices Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Available Devices</Text>
          
          <TouchableOpacity 
            style={styles.scanButton} 
            onPress={scanDevices} 
            disabled={scanning}
          >
            <LinearGradient
              colors={[COLORS.primary, COLORS.primaryDark || '#00C853']}
              style={styles.scanButtonGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <MaterialCommunityIcons 
                name="bluetooth-settings" 
                size={20} 
                color="#000" 
              />
              <Text style={styles.scanButtonText}>
                {scanning ? 'Scanning...' : 'Scan for Devices'}
              </Text>
            </LinearGradient>
          </TouchableOpacity>
          
          {scanning && (
            <View style={styles.scanningIndicator}>
              <ActivityIndicator size="small" color={COLORS.primary} />
              <Text style={styles.scanningText}>Searching for devices...</Text>
            </View>
          )}
          
          {scannedDevices.length > 0 && (
            <View style={styles.sectionCard}>
              <FlatList
                data={scannedDevices}
                keyExtractor={(item) => item.id}
                renderItem={renderDevice}
                scrollEnabled={false}
                ItemSeparatorComponent={() => <View style={styles.deviceSeparator} />}
              />
            </View>
          )}
          
          {!scanning && scannedDevices.length === 0 && (
            <View style={styles.sectionCard}>
              <View style={styles.emptyStateContainer}>
                <MaterialCommunityIcons name="bluetooth-off" size={40} color={COLORS.text.tertiary} />
                <Text style={styles.emptyStateText}>No devices found</Text>
                <Text style={styles.emptyStateSubtext}>Tap the scan button to search for devices</Text>
              </View>
            </View>
          )}
        </View>
        
        {/* Connection Info Card */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Connection Info</Text>
          <View style={styles.infoCard}>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Status:</Text>
              <Text style={[
                styles.infoValue, 
                deviceConnectedId ? styles.connectedText : styles.disconnectedText
              ]}>
                {deviceConnectedId ? 'Connected' : 'Disconnected'}
              </Text>
            </View>
            {deviceConnectedId && (
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Device ID:</Text>
                <Text style={styles.infoValue}>{deviceConnectedId}</Text>
              </View>
            )}
            {connectionError && (
              <View style={styles.errorContainer}>
                <MaterialCommunityIcons name="alert-circle" size={18} color="#FF5252" />
                <Text style={styles.errorText}>{connectionError}</Text>
              </View>
            )}
          </View>
        </View>
      </ScrollView>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  contentContainer: {
    paddingBottom: 32,
  },
  header: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
    marginTop: 30
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: COLORS.text.primary,
    letterSpacing: 0.35,
  },
  section: {
    marginBottom: 24,
    paddingHorizontal: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.text.primary,
    marginBottom: 12,
  },
  sectionCard: {
    backgroundColor: COLORS.cardBackground,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(0, 230, 118, 0.1)',
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
    overflow: 'hidden',
  },
  deviceItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  deviceSeparator: {
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    marginLeft: 56,
  },
  deviceIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0, 230, 118, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  deviceInfo: {
    flex: 1,
  },
  deviceName: {
    fontSize: 16,
    fontWeight: '500',
    color: COLORS.text.primary,
    marginBottom: 4,
  },
  deviceStatus: {
    fontSize: 14,
    color: COLORS.text.secondary,
  },
  scanButton: {
    marginBottom: 16,
    borderRadius: 12,
    overflow: 'hidden',
  },
  scanButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    paddingHorizontal: 24,
  },
  scanButtonText: {
    color: '#000',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  scanningIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  scanningText: {
    marginLeft: 8,
    color: COLORS.text.secondary,
    fontSize: 14,
  },
  emptyStateContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  emptyStateText: {
    fontSize: 16,
    color: COLORS.text.secondary,
    marginTop: 12,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: COLORS.text.tertiary,
    marginTop: 4,
    textAlign: 'center',
  },
  infoCard: {
    backgroundColor: COLORS.cardBackground,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(0, 230, 118, 0.1)',
    padding: 16,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
  },
  infoRow: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  infoLabel: {
    width: 100,
    fontSize: 14,
    color: COLORS.text.secondary,
  },
  infoValue: {
    flex: 1,
    fontSize: 14,
    color: COLORS.text.primary,
  },
  connectedText: {
    color: COLORS.primary,
    fontWeight: '500',
  },
  disconnectedText: {
    color: '#FF5252',
    fontWeight: '500',
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 82, 82, 0.1)',
    padding: 12,
    borderRadius: 8,
    marginTop: 8,
  },
  errorText: {
    color: '#FF5252',
    fontSize: 14,
    marginLeft: 8,
  }
});