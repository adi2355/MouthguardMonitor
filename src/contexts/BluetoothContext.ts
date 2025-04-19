import { createContext } from "react";
import { Alert, PermissionsAndroid, Platform } from "react-native";
import * as ExpoDevice from "expo-device";
import { BleError, BleManager, Characteristic, Device } from 'react-native-ble-plx';
import base64 from "react-native-base64";
import { parseRawTimestamp } from "../utils/functions";
import AsyncStorage from "@react-native-async-storage/async-storage";

// Storage key for device UUIDs
const DEVICE_UUIDS_STORAGE_KEY = "MOUTHGUARD_DEVICE_UUIDS";

// Define UUIDs for mouthguard services
const SERVICE_UUIDS = {
  BATTERY: '0x180F',
  IMU: 'c8553001-5a23-4b2e-b161-b22252abb885', // Custom UUID for IMU
  ACCELEROMETER: 'c8553002-5a23-4b2e-b161-b22252abb885', // Custom UUID for accelerometer
  TEMPERATURE: 'c8553003-5a23-4b2e-b161-b22252abb885', // Custom UUID for temperature
  FORCE: 'c8553004-5a23-4b2e-b161-b22252abb885', // Custom UUID for force sensor
  HEART_RATE: '0x180D' // Standard UUID for heart rate
};

// Define UUIDs for characteristics
const CHARACTERISTIC_UUIDS = {
  BATTERY_LEVEL: '0x2A19',
  IMU_1: 'c8553101-5a23-4b2e-b161-b22252abb885',
  IMU_2: 'c8553102-5a23-4b2e-b161-b22252abb885',
  ACCEL_1: 'c8553201-5a23-4b2e-b161-b22252abb885',
  ACCEL_2: 'c8553202-5a23-4b2e-b161-b22252abb885',
  TEMP_1: 'c8553301-5a23-4b2e-b161-b22252abb885',
  TEMP_2: 'c8553302-5a23-4b2e-b161-b22252abb885',
  FORCE_1: 'c8553401-5a23-4b2e-b161-b22252abb885',
  FORCE_2: 'c8553402-5a23-4b2e-b161-b22252abb885',
  HEART_RATE_MEASUREMENT: '0x2A37'
};

// Interface for state restoration event based on react-native-ble-plx implementation
interface StateRestoredEvent {
    connectedPeripherals: Device[];
}

// Updated to support multiple sensor data
type SensorData = {
  timestamp: number;
  values: number[];
};

// Updated to handle multiple service/characteristic pairs
type ConnectedDevice = {
    device: Device;
    services: {
      [key: string]: {
        uuid: string;
        characteristics: {
          [key: string]: string;
        }
      }
    }
}

type StoredDeviceUUIDs = {
    [deviceId: string]: {
        services: {
          [serviceName: string]: {
            uuid: string;
            characteristics: {
              [characteristicName: string]: string;
            }
          }
        }
    }
}

// Callbacks for different sensor types
export interface SensorCallbacks {
  onImuData?: (deviceId: string, sensorId: number, data: SensorData) => void;
  onAccelerometerData?: (deviceId: string, sensorId: number, data: SensorData) => void;
  onTemperatureData?: (deviceId: string, sensorId: number, data: SensorData) => void;
  onForceData?: (deviceId: string, sensorId: number, data: SensorData) => void;
  onHeartRateData?: (deviceId: string, heartRate: number) => void;
  onBatteryLevel?: (deviceId: string, level: number) => void;
}

// Create a context with a default undefined value
export const BluetoothContext = createContext<BluetoothHandler | undefined>(undefined);

export class BluetoothHandler {
    private manager: BleManager;
    private connectedDevices: Map<string, ConnectedDevice>; // Support multiple devices
    private callbacks: SensorCallbacks = {};
    private isRestoringState: boolean = false;

    constructor() {
        console.log('[BluetoothHandler] Initializing BleManager with state restoration');
        this.manager = new BleManager({
            // Unique identifier for state restoration
            restoreStateIdentifier: "MouthguardAppBluetoothRestoreID",

            // Function called when state is restored
            restoreStateFunction: this.handleStateRestoration.bind(this)
        });
        this.connectedDevices = new Map();
    }

    /**
     * Handle BLE state restoration when app is relaunched in background
     */
    private async handleStateRestoration(restoredState: StateRestoredEvent | null) {
        try {
            if (!restoredState) {
                console.log("[BluetoothHandler] No BLE state to restore.");
                return;
            }
            
            this.isRestoringState = true;
            console.log("[BluetoothHandler] Restoring BLE state...");
            
            // Get the previously connected peripherals
            const connectedPeripherals = restoredState.connectedPeripherals || [];
            console.log(`[BluetoothHandler] Found ${connectedPeripherals.length} connected peripheral(s) in restored state.`);
            
            if (connectedPeripherals.length === 0) {
                console.log("[BluetoothHandler] No connected peripherals to restore.");
                this.isRestoringState = false;
                return;
            }
            
            try {
                // Get stored device UUIDs from AsyncStorage
                const storedUUIDs = await this.getStoredUUIDs();
                
                for (const peripheral of connectedPeripherals) {
                    if (!peripheral || !peripheral.id) {
                        console.warn("[BluetoothHandler] Invalid peripheral in restored state");
                        continue;
                    }
                    
                    console.log(`[BluetoothHandler] Attempting to restore connection for device: ${peripheral.id}`);
                    
                    // Check if we have stored UUIDs for this device
                    if (storedUUIDs && storedUUIDs[peripheral.id]) {
                        const deviceServices = storedUUIDs[peripheral.id].services;
                        
                        if (!deviceServices) {
                            console.warn(`[BluetoothHandler] No service UUIDs for device ${peripheral.id}`);
                            continue;
                        }
                        
                        // Create connected device object to store
                        const connectedDevice: ConnectedDevice = {
                            device: peripheral,
                            services: deviceServices
                        };
                        
                        // Add to connected devices map
                        this.connectedDevices.set(peripheral.id, connectedDevice);
                        
                        // Re-establish characteristic monitoring for all services/characteristics
                        this.setupMonitoringForDevice(peripheral.id);
                    } else {
                        console.warn(`[BluetoothHandler] No stored UUIDs found for device ${peripheral.id}`);
                    }
                }
            } catch (storageError) {
                console.error('[BluetoothHandler] Error accessing stored UUIDs:', storageError);
            }
        } catch (error) {
            console.error('[BluetoothHandler] Error during state restoration:', error);
        } finally {
            // Always reset the restoration flag to prevent lock-ups
            this.isRestoringState = false;
        }
    }

    /**
     * Get stored service and characteristic UUIDs for devices
     */
    private async getStoredUUIDs(): Promise<StoredDeviceUUIDs | null> {
        try {
            const uuidsJson = await AsyncStorage.getItem(DEVICE_UUIDS_STORAGE_KEY);
            if (!uuidsJson) return null;
            
            // Safely parse JSON
            try {
                return JSON.parse(uuidsJson);
            } catch (parseError) {
                console.error('[BluetoothHandler] Error parsing stored UUIDs JSON:', parseError);
                return null;
            }
        } catch (error) {
            console.error('[BluetoothHandler] Error retrieving stored UUIDs:', error);
            // Don't throw error, just return null to prevent app crashes
            return null;
        }
    }

    /**
     * Store service and characteristic UUIDs for a device
     */
    private async storeDeviceUUIDs(deviceId: string, services: ConnectedDevice['services']): Promise<void> {
        try {
            // Get existing stored UUIDs
            const existingUUIDs = await this.getStoredUUIDs() || {};
            
            // Add or update the UUIDs for this device
            existingUUIDs[deviceId] = { services };
            
            // Store the updated UUIDs
            const jsonValue = JSON.stringify(existingUUIDs);
            await AsyncStorage.setItem(DEVICE_UUIDS_STORAGE_KEY, jsonValue);
            console.log(`[BluetoothHandler] Stored UUIDs for device ${deviceId}`);
        } catch (error) {
            // Log but don't throw to prevent app crashes
            console.error('[BluetoothHandler] Error storing device UUIDs:', error);
        }
    }

    // Set callbacks for sensor data
    public setSensorCallbacks(callbacks: SensorCallbacks): void {
        this.callbacks = { ...this.callbacks, ...callbacks };
    }

    public async connectToDevice(deviceId: string) {
        try {
            console.log(`[BluetoothHandler] Connecting to device ${deviceId}`);
            const deviceConnection: Device = await this.manager.connectToDevice(deviceId);
            await deviceConnection.discoverAllServicesAndCharacteristics();
            
            const services = await deviceConnection.services();
            console.log(`[BluetoothHandler] Discovered ${services.length} services`);
            
            // Initialize empty structure for service/characteristic UUIDs
            const connectedDevice: ConnectedDevice = {
                device: deviceConnection,
                services: {}
            };
            
            for (const service of services) {
                console.log(`[BluetoothHandler] Processing service: ${service.uuid}`);
                const characteristics = await service.characteristics();
                
                // Initialize empty characteristics mapping
                connectedDevice.services[service.uuid] = {
                    uuid: service.uuid,
                    characteristics: {}
                };
                
                for (const characteristic of characteristics) {
                    console.log(`[BluetoothHandler] - Characteristic: ${characteristic.uuid}`);
                    connectedDevice.services[service.uuid].characteristics[characteristic.uuid] = characteristic.uuid;
                }
            }
            
            // Store the device in our map
            this.connectedDevices.set(deviceId, connectedDevice);
            
            // Store UUIDs for later restoration
            await this.storeDeviceUUIDs(deviceId, connectedDevice.services);
            
            // Set up monitoring for all characteristics
            this.setupMonitoringForDevice(deviceId);
            
            console.log(`[BluetoothHandler] Successfully connected to device ${deviceId}`);
            
            return true;
        } catch (error) {
            console.error(`[BluetoothHandler] Error connecting to device ${deviceId}:`, error);
            throw error;
        } finally {
            this.manager.stopDeviceScan();
        }
    }

    private setupMonitoringForDevice(deviceId: string) {
        const device = this.connectedDevices.get(deviceId);
        if (!device) {
            console.error(`[BluetoothHandler] Device ${deviceId} not found for monitoring setup`);
            return;
        }
        
        console.log(`[BluetoothHandler] Setting up monitoring for device ${deviceId}`);
        
        // For each service
        Object.entries(device.services).forEach(([serviceUuid, service]) => {
            // For each characteristic in the service
            Object.entries(service.characteristics).forEach(([characteristicUuid, _]) => {
                try {
                    console.log(`[BluetoothHandler] - Monitoring ${serviceUuid}/${characteristicUuid}`);
                    
                    // Set up monitoring for this characteristic
                    device.device.monitorCharacteristicForService(
                        serviceUuid,
                        characteristicUuid,
                        (error, characteristic) => this.handleCharacteristicUpdate(
                            deviceId, serviceUuid, characteristicUuid, error, characteristic
                        )
                    );
                } catch (error) {
                    console.error(`[BluetoothHandler] Error setting up monitoring for ${serviceUuid}/${characteristicUuid}:`, error);
                }
            });
        });
        
        console.log(`[BluetoothHandler] Monitoring setup complete for device ${deviceId}`);
    }

    public disconnectFromDevice(deviceId: string) {
        const device = this.connectedDevices.get(deviceId)?.device;
        if (device) {
            this.manager.cancelDeviceConnection(deviceId);
            this.connectedDevices.delete(deviceId);
            console.log(`[BluetoothHandler] Disconnected from device ${deviceId}`);
        } else {
            console.warn(`[BluetoothHandler] Attempted to disconnect from unknown device ${deviceId}`);
        }
    }

    private handleCharacteristicUpdate(
        deviceId: string, 
        serviceUuid: string, 
        characteristicUuid: string,
        error: BleError | null, 
        characteristic: Characteristic | null
    ) {
        if (error) {
            console.error(`[BluetoothHandler] Error from ${serviceUuid}/${characteristicUuid}:`, error);
            return;
        }
        
        if (!characteristic?.value) {
            console.warn(`[BluetoothHandler] No data received from ${serviceUuid}/${characteristicUuid}`);
            return;
        }
        
        try {
            const buffer = Buffer.from(characteristic.value, 'base64');
            
            // Process based on service/characteristic
            if (serviceUuid === SERVICE_UUIDS.BATTERY && characteristicUuid === CHARACTERISTIC_UUIDS.BATTERY_LEVEL) {
                // Handle battery level
                const level = buffer.readUInt8(0);
                console.log(`[BluetoothHandler] Battery level: ${level}%`);
                if (this.callbacks.onBatteryLevel) {
                    this.callbacks.onBatteryLevel(deviceId, level);
                }
            } 
            else if (serviceUuid === SERVICE_UUIDS.HEART_RATE && characteristicUuid === CHARACTERISTIC_UUIDS.HEART_RATE_MEASUREMENT) {
                // Handle heart rate
                // Format according to GATT specification for Heart Rate Measurement
                const flags = buffer.readUInt8(0);
                const heartRate = (flags & 0x1) === 0 ? buffer.readUInt8(1) : buffer.readUInt16LE(1);
                console.log(`[BluetoothHandler] Heart rate: ${heartRate} BPM`);
                if (this.callbacks.onHeartRateData) {
                    this.callbacks.onHeartRateData(deviceId, heartRate);
                }
            } 
            else if (serviceUuid === SERVICE_UUIDS.IMU) {
                // Handle IMU data
                const sensorId = characteristicUuid === CHARACTERISTIC_UUIDS.IMU_1 ? 1 : 2;
                const timestamp = buffer.readUInt32LE(0);
                const x = buffer.readInt16LE(4);
                const y = buffer.readInt16LE(6);
                const z = buffer.readInt16LE(8);
                console.log(`[BluetoothHandler] IMU ${sensorId} data: t=${timestamp}, x=${x}, y=${y}, z=${z}`);
                if (this.callbacks.onImuData) {
                    this.callbacks.onImuData(deviceId, sensorId, {
                        timestamp,
                        values: [x, y, z]
                    });
                }
            } 
            else if (serviceUuid === SERVICE_UUIDS.ACCELEROMETER) {
                // Handle accelerometer data
                const sensorId = characteristicUuid === CHARACTERISTIC_UUIDS.ACCEL_1 ? 1 : 2;
                const timestamp = buffer.readUInt32LE(0);
                const x = buffer.readInt16LE(4);
                const y = buffer.readInt16LE(6);
                const z = buffer.readInt16LE(8);
                console.log(`[BluetoothHandler] Accelerometer ${sensorId} data: t=${timestamp}, x=${x}, y=${y}, z=${z}`);
                if (this.callbacks.onAccelerometerData) {
                    this.callbacks.onAccelerometerData(deviceId, sensorId, {
                        timestamp,
                        values: [x, y, z]
                    });
                }
            } 
            else if (serviceUuid === SERVICE_UUIDS.TEMPERATURE) {
                // Handle temperature data
                const sensorId = characteristicUuid === CHARACTERISTIC_UUIDS.TEMP_1 ? 1 : 2;
                const timestamp = buffer.readUInt32LE(0);
                const temperature = buffer.readInt16LE(4); // Temperature in 0.01 degree units
                console.log(`[BluetoothHandler] Temperature ${sensorId} data: t=${timestamp}, temp=${temperature/100}°C`);
                if (this.callbacks.onTemperatureData) {
                    this.callbacks.onTemperatureData(deviceId, sensorId, {
                        timestamp,
                        values: [temperature]
                    });
                }
            } 
            else if (serviceUuid === SERVICE_UUIDS.FORCE) {
                // Handle force sensor data
                const sensorId = characteristicUuid === CHARACTERISTIC_UUIDS.FORCE_1 ? 1 : 2;
                const timestamp = buffer.readUInt32LE(0);
                const force = buffer.readUInt8(4); // Force as 8-bit value
                console.log(`[BluetoothHandler] Force ${sensorId} data: t=${timestamp}, force=${force}`);
                if (this.callbacks.onForceData) {
                    this.callbacks.onForceData(deviceId, sensorId, {
                        timestamp,
                        values: [force]
                    });
                }
            }
        } catch (error) {
            console.error(`[BluetoothHandler] Error processing data from ${serviceUuid}/${characteristicUuid}:`, error);
        }
    }

    /**
     * Sync time with all connected mouthguard devices
     */
    public async syncTimeWithAllDevices(): Promise<void> {
        for (const [deviceId, _] of this.connectedDevices) {
            await this.syncTimeWithDevice(deviceId);
        }
    }

    /**
     * Sync time with a specific mouthguard device
     */
    private async syncTimeWithDevice(deviceId: string): Promise<boolean> {
        const device = this.connectedDevices.get(deviceId);
        if (!device) {
            console.error(`[BluetoothHandler] Device ${deviceId} not found for time sync`);
            return false;
        }
        
        try {
            // Calculate current timestamp and timezone offset
            const timestamp = Math.floor(Date.now() / 1000); // Seconds, not milliseconds
            const gmtOffset = new Date().getTimezoneOffset() * 60;  // Offset in seconds
            const base64Timestamp = base64.encode(`${timestamp},${gmtOffset}`);
            
            // Find the time sync characteristic (choose one that's appropriate)
            // We'll use IMU service for time sync as a convention
            const imuService = Object.entries(device.services).find(([uuid, _]) => uuid === SERVICE_UUIDS.IMU);
            
            if (!imuService) {
                console.error(`[BluetoothHandler] IMU service not found for time sync`);
                return false;
            }
            
            const [serviceUuid, service] = imuService;
            const characteristicUuid = Object.keys(service.characteristics)[0]; // Use first characteristic
            
            if (!characteristicUuid) {
                console.error(`[BluetoothHandler] No characteristic found for time sync`);
                return false;
            }
            
            // Write the timestamp
            await this.manager.writeCharacteristicWithResponseForDevice(
                deviceId,
                serviceUuid,
                characteristicUuid,
                base64Timestamp
            );
            
            console.log(`[BluetoothHandler] Time sync sent to device ${deviceId}: ${timestamp}, GMT offset ${gmtOffset}`);
            return true;
        } catch (error) {
            console.error(`[BluetoothHandler] Error syncing time with device ${deviceId}:`, error);
            return false;
        }
    }

    public getBLEManager(): BleManager {
        return this.manager;
    }

    public getConnectedDevices(): Map<string, Device> {
        // Return just the Device objects, not the full ConnectedDevice
        const devices = new Map<string, Device>();
        for (const [deviceId, connectedDevice] of this.connectedDevices) {
            devices.set(deviceId, connectedDevice.device);
        }
        return devices;
    }

    /*
     * Requests bluetooth permissions, accounting for platform differences
     */
    public async requestPermissions() {
        if (Platform.OS === "android") {
            if ((ExpoDevice.platformApiLevel ?? -1) < 31) {
                // Android version below 31
                const granted = await PermissionsAndroid.request(
                    PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
                    {
                        title: "Location Permission",
                        message: "Bluetooth Low Energy requires Location",
                        buttonPositive: "OK",
                    }
                );
                return granted === PermissionsAndroid.RESULTS.GRANTED;
            } else {
                // Android version above 31
                const isAndroid31PermissionsGranted = await this.requestAndroid31Permissions();

                return isAndroid31PermissionsGranted;
            }
        } else {
            //ios
            return true;
        }
    }

    private async requestAndroid31Permissions() {
        const bluetoothScanPermission = await PermissionsAndroid.request(
            PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN,
            {
                title: "Bluetooth Scan Permission",
                message: "Required to discover mouthguard devices",
                buttonPositive: "OK",
            }
        );
        const bluetoothConnectPermission = await PermissionsAndroid.request(
            PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT,
            {
                title: "Bluetooth Connect Permission",
                message: "Required to connect to mouthguard devices",
                buttonPositive: "OK",
            }
        );
        const fineLocationPermission = await PermissionsAndroid.request(
            PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
            {
                title: "Location Permission",
                message: "Bluetooth Low Energy requires Location",
                buttonPositive: "OK",
            }
        );

        return (
            bluetoothScanPermission === "granted" &&
            bluetoothConnectPermission === "granted" &&
            fineLocationPermission === "granted"
        );
    }
}
