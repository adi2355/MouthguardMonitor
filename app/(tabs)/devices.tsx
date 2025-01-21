import AntDesign from '@expo/vector-icons/AntDesign';
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { BleManager, Device } from 'react-native-ble-plx';

const Devices: React.FC = () => {
  const [devices, setDevices] = useState<Device[]>([]);
  const [scanning, setScanning] = useState<boolean>(false);
  const manager = new BleManager();

  useEffect(() => {
    return () => {
      manager.destroy(); // Clean up the BLE manager on unmount
    };
  }, []);

  const scanDevices = (): void => {
    setScanning(true);
    setDevices([]);

    manager.startDeviceScan(null, null, (error, device) => {
      if (error) {
        console.error('Error scanning devices:', error.message);
        setScanning(false);
        return;
      }

      if (device && device.name && !devices.some((d) => d.id === device.id)) {
        setDevices((prevDevices) => [...prevDevices, device]);
      }
    });

    // Stop scanning after 10 seconds
    setTimeout(() => {
      manager.stopDeviceScan();
      setScanning(false);
    }, 10000);
  };

  const renderDevice = ({ item }: { item: Device }): JSX.Element => (
    <TouchableOpacity style={styles.deviceItem}>
       <AntDesign name="hdd" size={24} color="black" />
      <View style={styles.deviceInfo}>
        <Text style={styles.deviceName}>{item.name}</Text>
        <Text style={styles.deviceId}>{item.id}</Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerText}>Bluetooth</Text>
      </View>
      <TouchableOpacity style={styles.scanButton} onPress={scanDevices} disabled={scanning}>
        <Text style={styles.scanButtonText}>
          {scanning ? 'Scanning...' : 'Scan for Devices'}
        </Text>
      </TouchableOpacity>
      {scanning && <ActivityIndicator style={styles.loader} size="large" color="#007AFF" />}
      <FlatList
        data={devices}
        keyExtractor={(item) => item.id}
        renderItem={renderDevice}
        contentContainerStyle={styles.list}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f8f8',
  },
  header: {
    backgroundColor: '#ffffff',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e6e6e6',
  },
  headerText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#000',
  },
  scanButton: {
    backgroundColor: '#12a35f',
    padding: 12,
    margin: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  scanButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  loader: {
    marginTop: 10,
  },
  list: {
    padding: 16,
  },
  deviceItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e6e6e6',
    borderRadius: 6,
    marginVertical: 4,
  },
  deviceInfo: {
    marginLeft: 12,
    flex: 1,
  },
  deviceName: {
    fontSize: 16,
    fontWeight: '500',
  },
  deviceId: {
    color: '#8e8e93',
    fontSize: 12,
  },
});

export default Devices;
