import { BluetoothContext } from '@/src/contexts/BluetoothContext';
import AntDesign from '@expo/vector-icons/AntDesign';
import React, { useState, useEffect, useRef, useContext } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert
} from 'react-native';
import base64 from 'react-native-base64';
import { BleError, BleManager, Characteristic, Device } from 'react-native-ble-plx';

export default function Devices() {

  const [savedDevices, setSavedDevice] = useState<Device[]>([]);
  const [devices, setDevices] = useState<Device[]>([]);
  const [scanning, setScanning] = useState<boolean>(false);

  //Track devices to avoid duplicate keys when scanning
  const undiscoveredDeviceSet = useRef(new Set<string>());

  const bluetoothHandler = useContext(BluetoothContext)!;

  useEffect(() => {
    setSavedDevice(bluetoothHandler.getSavedDevices());
  }, []);

  // THIS WILL decode BONG HIT DATA
  function onDataUpdate(error: BleError | null, characteristic: Characteristic | null) {
    if (error) {
      console.log(error);
      return -1;
    } else if (!characteristic?.value) {
      console.log("No Data was recieved");
      return -1;
    }
    const rawData = base64.decode(characteristic.value);
    Alert.alert(`Raw Data: ${rawData}`);
  }

  function scanDevices(): void {
    const manager: BleManager = bluetoothHandler.getBLEManager();
    setScanning(true);
    setDevices([]);

    manager.startDeviceScan(null, null, (error, device) => {
      if (error) {
        console.error('Error scanning devices:', error.message);
        setScanning(false);
        return;
      }

      if (device && device.name && !undiscoveredDeviceSet.current.has(device.id)) {
        undiscoveredDeviceSet.current.add(device.id); // Add device ID to the Set
        setDevices((prevDevices) => [...prevDevices, device]);
      }
    });

    // Stop scanning after 10 seconds
    setTimeout(() => {
      manager.stopDeviceScan();
      setScanning(false);
    }, 10000);
  };

  // Renders device
  const renderDevice = ({ item }: { item: Device }): JSX.Element => (
    <TouchableOpacity style={styles.deviceItem} onPress={() => bluetoothHandler.connectToDevice(item)}>
      <AntDesign name="hdd" size={24} color="black" />
      <View style={styles.deviceInfo}>
        <Text style={styles.deviceName}>{item.name}</Text>
      </View>
      {item.id === bluetoothHandler.getConnectedDevice()?.id ? <Text>Connected</Text> : <Text>Not Connected</Text>}
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <View style={styles.devicesFlatMapContainer}>
        <View style={styles.header}>
          <Text style={styles.headerText}>My Devices</Text>
        </View>
        <FlatList
          data={savedDevices}
          keyExtractor={(item) => item.id}
          renderItem={renderDevice}
          contentContainerStyle={styles.list}
        />
      </View>
      <View style={styles.devicesFlatMapContainer}>
        <View style={styles.header}>
          <Text style={styles.headerText}>Other Devices</Text>
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
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f8f8',
  },
  devicesFlatMapContainer: {
    marginBottom: 20
  },
  header: {
    backgroundColor: '#ffffff',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e6e6e6'
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
