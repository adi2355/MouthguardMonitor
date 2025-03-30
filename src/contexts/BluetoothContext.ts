import { createContext } from "react";
import { Alert, PermissionsAndroid, Platform } from "react-native";
import * as ExpoDevice from "expo-device";
import { BleError, BleManager, Characteristic, Device } from 'react-native-ble-plx';
import base64 from "react-native-base64";
import { parseRawTimestamp } from "../utils/functions";
import AsyncStorage from "@react-native-async-storage/async-storage";

// Storage key for device UUIDs
const DEVICE_UUIDS_STORAGE_KEY = "CANOVA_DEVICE_UUIDS";

// Interface for state restoration event based on react-native-ble-plx implementation
interface StateRestoredEvent {
    connectedPeripherals: Device[];
}

type ConnectedDevice = {
    device: Device;
    serviceUUID: string;
    characteristicUUID: string
}

type StoredDeviceUUIDs = {
    [deviceId: string]: {
        serviceUUID: string;
        characteristicUUID: string;
    }
}

export class BluetoothHandler {
    private manager: BleManager;
    private connectedDevice: ConnectedDevice | null;
    private onDataCallback: ((rawTimestamp: string, timestamp: string, duration: number) => void) | null = null;
    private isRestoringState: boolean = false;

    constructor() {
        console.log('[BluetoothHandler] Initializing BleManager with state restoration');
        this.manager = new BleManager({
            // Unique identifier for state restoration
            restoreStateIdentifier: "CanovaAppBluetoothRestoreID",

            // Function called when state is restored
            restoreStateFunction: this.handleStateRestoration.bind(this)
        });
        this.connectedDevice = null;
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
                        const { serviceUUID, characteristicUUID } = storedUUIDs[peripheral.id];
                        
                        if (!serviceUUID || !characteristicUUID) {
                            console.warn(`[BluetoothHandler] Incomplete UUIDs for device ${peripheral.id}`);
                            continue;
                        }
                        
                        console.log(`[BluetoothHandler] Found stored UUIDs for ${peripheral.id}: ${serviceUUID}, ${characteristicUUID}`);
                        
                        try {
                            // Set up the connectedDevice state
                            this.connectedDevice = {
                                device: peripheral,
                                serviceUUID,
                                characteristicUUID
                            };
                            
                            // Re-establish the characteristic monitoring
                            this.streamOnConnectedDevice();
                            console.log(`[BluetoothHandler] Successfully re-attached monitor for ${peripheral.id}`);
                        } catch (monitorError) {
                            console.error(`[BluetoothHandler] Error re-attaching monitor for ${peripheral.id}:`, monitorError);
                            // Continue with the next peripheral rather than trying to reconnect to avoid potential cascading errors
                        }
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
    private async storeDeviceUUIDs(deviceId: string, serviceUUID: string, characteristicUUID: string): Promise<void> {
        try {
            // Get existing stored UUIDs
            const existingUUIDs = await this.getStoredUUIDs() || {};
            
            // Add or update the UUIDs for this device
            existingUUIDs[deviceId] = { serviceUUID, characteristicUUID };
            
            // Store the updated UUIDs
            const jsonValue = JSON.stringify(existingUUIDs);
            await AsyncStorage.setItem(DEVICE_UUIDS_STORAGE_KEY, jsonValue);
            console.log(`[BluetoothHandler] Stored UUIDs for device ${deviceId}`);
        } catch (error) {
            // Log but don't throw to prevent app crashes
            console.error('[BluetoothHandler] Error storing device UUIDs:', error);
        }
    }

    // Update the expected callback signature
    public setOnDataCallback(callback: (rawTimestamp: string, timestamp: string, duration: number) => void): void {
        this.onDataCallback = callback;
    }

    public async connectToDevice(deviceId: string) {
        if (this.connectedDevice !== null) {
            // If we already have a connected device, we should:
            // 1. Check if it's the same device - if so, just return
            // 2. If it's a different device, disconnect from the current one first
            if (this.connectedDevice.device.id === deviceId) {
                console.log("Already connected to this device");
                return;
            }
            
            console.log("Disconnecting from current device before connecting to new one");
            this.disconnectFromDevice(this.connectedDevice.device);
            this.connectedDevice = null;
        }
        
        try {
            const deviceConnection: Device = await this.manager.connectToDevice(deviceId);
            await deviceConnection.discoverAllServicesAndCharacteristics();
            const services = await deviceConnection.services();
            if (services.length !== 1) {
                throw Error("Bad number of services");
            }

            const service = services[0];
            const characteristics = await service.characteristics();
            if (characteristics.length !== 1) {
                throw Error("Bad number of characteristics");
            }
            const characteristic = characteristics[0];
            
            // Store the discovered UUIDs for state restoration
            await this.storeDeviceUUIDs(deviceId, service.uuid, characteristic.uuid);
            
            this.connectedDevice = {
                device: deviceConnection,
                serviceUUID: service.uuid,
                characteristicUUID: characteristic.uuid
            };
            
            console.log(`[BluetoothHandler] Connected to device ${deviceId}, Service: ${service.uuid}, Characteristic: ${characteristic.uuid}`);

        } catch (error) {
            console.error('Error discovering services/characteristics:', error);
            throw error; // Re-throw to allow caller to handle the error
        } finally {
            this.manager.stopDeviceScan();
        }
    }

    public disconnectFromDevice(connectedDevice: Device) {
        if (connectedDevice) {
            this.manager.cancelDeviceConnection(connectedDevice.id);
            if (this.connectedDevice?.device.id === connectedDevice.id) {
                this.connectedDevice = null;
            }
        }
    }

    /**
     * This function starts listening for data on the connected device
     */
    public streamOnConnectedDevice() {
        if (this.connectedDevice === null) {
            console.error("[BluetoothHandler] Tried to stream with no device connected");
            return; // Just return instead of throwing error when in restoration
        } 
        
        try {
            // Only try to sync timestamp if not in state restoration
            if (!this.isRestoringState) {
                try {
                    this.sendCurrentTimestamp();
                } catch (syncError) {
                    console.error("[BluetoothHandler] Error syncing timestamp:", syncError);
                    // Continue with monitoring even if timestamp sync fails
                }
            }
            
            // Set up monitoring
            console.log(`[BluetoothHandler] Setting up monitoring for ${this.connectedDevice.serviceUUID}, ${this.connectedDevice.characteristicUUID}`);
            this.connectedDevice.device.monitorCharacteristicForService(
                this.connectedDevice.serviceUUID,
                this.connectedDevice.characteristicUUID,
                this.handleBluetoothConnection.bind(this)
            );
            console.log(`[BluetoothHandler] Monitoring set up successfully`);
        } catch (error) {
            console.error("[BluetoothHandler] Error starting stream:", error);
            // Don't rethrow to avoid crashing the app during background restoration
        }
    }

    /* 
     * This function encapsulates all logic relating to listening to on the bluetooth conneciton
     */
    private handleBluetoothConnection(error: BleError | null, characteristic: Characteristic | null) {
        if (error) {
          console.log("Stream error:", error);
          return; // Return void instead of -1
        } else if (!characteristic?.value) {
          console.log("No data was received");
          return; // Return void instead of -1
        }

        try {
            const rawData: string[] = base64.decode(characteristic.value).split(';');
            // Ensure we handle cases where split might not produce enough parts
            if (rawData.length < 2) {
                console.error("Received malformed data:", rawData);
                return;
            }
            const rawTimestamp: string = rawData[0]; //Tuesday, March 25 2025 21:40:12
            const duration: number = parseFloat(rawData[1])*1000; // 0.17
            
            if (isNaN(duration) || duration <= 0) {
                console.error(`[BluetoothContext] Invalid duration value: ${rawData[1]}`);
                return;
            }
            
            console.log(`[BluetoothContext] Raw timestamp received: ${rawTimestamp}`);
            const timestamp: string = parseRawTimestamp(rawTimestamp);
            console.log(`[BluetoothContext] Parsed ISO timestamp: ${timestamp}`);
            
            // Instead of directly calling databaseManager, use the callback
            if (this.onDataCallback) {
                // Pass rawTimestamp along with parsed timestamp and duration
                this.onDataCallback(rawTimestamp, timestamp, duration);
            } else {
                console.error("No data callback set to handle bong hit data");
                // Fallback alert if no callback is set
                Alert.alert(`(No Callback) Timestamp: ${rawTimestamp}\n Duration: ${duration}ms`);
            }
        } catch (error) {
            console.error('[BluetoothContext] Error processing Bluetooth data:', error);
            Alert.alert('Error', 'Failed to process data from device');
        }
    }

    /**
     * This function generates the current timestamp which will be used to sync the Trak+ to an accurate timestamp on connection.
     */
    private async sendCurrentTimestamp() {
        if (!this.connectedDevice) {
            console.error("[BluetoothHandler] Tried to send timestamp to device, but connection not found");
            return false;
        }
        
        try {
            const timestamp = Math.floor(Date.now() / 1000); // Seconds, not milliseconds
            const gmtOffset = new Date().getTimezoneOffset() * 60;  // Offset in seconds (e.g., GMT-5 -> -18000)
            const base64Timestamp = base64.encode(`${timestamp},${gmtOffset}`);

            // Write data to the characteristic
            await this.manager.writeCharacteristicWithResponseForDevice(
                this.connectedDevice.device.id,
                this.connectedDevice.serviceUUID,
                this.connectedDevice.characteristicUUID,
                base64Timestamp
            );
      
            console.log(`[BluetoothHandler] Sent: Timestamp ${timestamp}, GMT Offset ${gmtOffset}`);
            return true;
        } catch (error) {
            console.error('[BluetoothHandler] Error sending data:', error);
            return false;
        }
    }

    public getBLEManager(): BleManager {
        return this.manager;
    }

    public getConnectedDevice(): Device | undefined {
        return this.connectedDevice?.device;
    }

    /*
     * Requests bluetooth permissions, accounting for platform differences
     */
    private async requestPermissions() {
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
                title: "Location Permission",
                message: "Bluetooth Low Energy requires Location",
                buttonPositive: "OK",
            }
        );
        const bluetoothConnectPermission = await PermissionsAndroid.request(
            PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT,
            {
                title: "Location Permission",
                message: "Bluetooth Low Energy requires Location",
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

export const BluetoothContext = createContext<BluetoothHandler | undefined>(undefined);
