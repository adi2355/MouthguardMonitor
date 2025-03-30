import { Alert, PermissionsAndroid, Platform, AppState } from "react-native";
import * as ExpoDevice from "expo-device";
import { BleError, BleManager, Characteristic, Device } from 'react-native-ble-plx';
import base64 from "react-native-base64";
import { BluetoothHandler } from "../contexts/BluetoothContext";
import { DeviceService } from "./DeviceService";
import { BongHitsRepository } from "../repositories/BongHitsRepository";
import { parseRawTimestamp } from "../utils/functions";
import { dataChangeEmitter, dbEvents } from "../utils/EventEmitter";

/**
 * BluetoothService uses composition with BluetoothHandler and integrates with DeviceService
 * for saving connected devices and with BongHitsRepository for recording hits
 */
export class BluetoothService {
  private bluetoothHandler: BluetoothHandler;
  private deviceService: DeviceService;
  private bongHitsRepository: BongHitsRepository;

  /**
   * Constructor
   * @param deviceService Service for saving devices
   * @param bongHitsRepository Repository for recording bong hits
   * @param bluetoothHandler Optional BluetoothHandler instance (creates one if not provided)
   */
  constructor(
    deviceService: DeviceService, 
    bongHitsRepository: BongHitsRepository,
    bluetoothHandler?: BluetoothHandler
  ) {
    this.bluetoothHandler = bluetoothHandler || new BluetoothHandler();
    this.deviceService = deviceService;
    this.bongHitsRepository = bongHitsRepository;
    
    // Set up the callback to handle data from bluetooth
    this.bluetoothHandler.setOnDataCallback(this.handleReceivedData.bind(this));
    
    // Listen for app state changes to manage connections
    // platform-specific imports and setup would go here
  }

  /**
   * Handle data received from the Bluetooth device
   * @param rawTimestamp The original timestamp string from the device
   * @param timestamp ISO string timestamp (parsed)
   * @param duration Duration in milliseconds
   */
  private async handleReceivedData(rawTimestamp: string, timestamp: string, duration: number): Promise<void> {
    try {
      console.log(`[BluetoothService] BG Received data - Raw: ${rawTimestamp}, Parsed: ${timestamp}, Duration: ${duration}ms`);
      
      // Validate that the timestamp is in ISO format before proceeding
      if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}.\d{3}Z$/.test(timestamp)) {
        const errorMsg = `Invalid timestamp format: ${timestamp}`;
        console.error(`[BluetoothService] ${errorMsg}`);
        // Don't show alert in background mode
        if (Platform.OS === 'ios' && AppState.currentState === 'active') {
          Alert.alert('Error', errorMsg);
        }
        return;
      }
      
      // Validate duration is positive
      if (duration <= 0) {
        const errorMsg = `Invalid duration: ${duration}`;
        console.error(`[BluetoothService] ${errorMsg}`);
        // Don't show alert in background mode
        if (Platform.OS === 'ios' && AppState.currentState === 'active') {
          Alert.alert('Error', errorMsg);
        }
        return;
      }
      
      // Only show alert when app is in foreground
      if (Platform.OS === 'ios' && AppState.currentState === 'active') {
        Alert.alert(`Timestamp: ${timestamp}\n Duration: ${duration}ms`);
      }
      
      // Record the bong hit using the validated timestamp
      await this.bongHitsRepository.recordBongHit(timestamp, duration);
      console.log(`[BluetoothService] BG Bong hit recorded successfully.`);
      
      // Emit an event to notify listeners that data has changed
      dataChangeEmitter.emit(dbEvents.DATA_CHANGED);
      console.log(`[BluetoothService] BG Emitted '${dbEvents.DATA_CHANGED}' event.`);
    } catch (error) {
      console.error('[BluetoothService] BG Error handling received data:', error);
      
      // Only show alert when app is in foreground
      if (Platform.OS === 'ios' && AppState.currentState === 'active') {
        Alert.alert('Error', 'Failed to process or record received data');
      }
    }
  }

  /**
   * Connect to a device by ID and save it to storage
   * @param deviceId ID of the device to connect to
   */
  public async connectToDevice(deviceId: string): Promise<void> {
    try {
      await this.bluetoothHandler.connectToDevice(deviceId);
      
      // Get the connected device
      const connectedDevice = this.bluetoothHandler.getConnectedDevice();
      if (connectedDevice) {
        // Save the device to persistent storage
        await this.deviceService.saveDevices([connectedDevice]);
        console.log(`[BluetoothService] Device ${deviceId} saved to storage`);
        
        // Set up the streaming on connected device
        // This will trigger the bluetoothHandler's handleBluetoothConnection internally
        await this.setupDeviceListeners();
      }
    } catch (error) {
      console.error('[BluetoothService] Error connecting to device:', error);
      throw error;
    }
  }
  
  /**
   * Set up listeners for the connected device
   */
  private async setupDeviceListeners(): Promise<void> {
    try {
      // Start streaming data from the device
      // This will use the internal handleBluetoothConnection in BluetoothHandler
      this.bluetoothHandler.streamOnConnectedDevice();
      
      // Additional setup could be done here
    } catch (error) {
      console.error('[BluetoothService] Error setting up device listeners:', error);
      throw error;
    }
  }

  /**
   * Scan for BLE devices
   * @param onDeviceFound Callback function for each device found
   * @param timeoutMs Optional scan timeout in milliseconds
   * @returns Promise that resolves when scan is complete
   */
  public async scanForDevices(
    onDeviceFound: (device: Device) => void,
    timeoutMs: number = 10000
  ): Promise<void> {
    try {
      // Get BLE manager from handler
      const manager = this.bluetoothHandler.getBLEManager();
      
      // Request permissions first
      const hasPermission = await this.requestPermissions();
      if (!hasPermission) {
        throw new Error('Bluetooth permissions not granted');
      }
      
      // Start scanning
      console.log('[BluetoothService] Starting device scan...');
      manager.startDeviceScan(null, null, (error, device) => {
        if (error) {
          console.error('[BluetoothService] Scan error:', error);
          return;
        }
        
        if (device && device.name) {
          // Call the callback with the found device
          onDeviceFound(device);
        }
      });
      
      // Set a timeout to stop scanning
      return new Promise((resolve) => {
        setTimeout(() => {
          manager.stopDeviceScan();
          console.log('[BluetoothService] Device scan complete');
          resolve();
        }, timeoutMs);
      });
    } catch (error) {
      console.error('[BluetoothService] Error scanning for devices:', error);
      throw error;
    }
  }

  /**
   * Disconnect from the current device
   */
  public disconnectFromCurrentDevice(): void {
    const device = this.bluetoothHandler.getConnectedDevice();
    if (device) {
      this.bluetoothHandler.disconnectFromDevice(device);
      console.log('[BluetoothService] Disconnected from device:', device.id);
    }
  }

  /**
   * Get the currently connected device
   */
  public getConnectedDevice(): Device | undefined {
    return this.bluetoothHandler.getConnectedDevice();
  }

  /**
   * Get a list of previously connected devices
   * @returns Promise that resolves with array of saved devices
   */
  public async getSavedDevices() {
    return this.deviceService.getSavedDevices();
  }

  /**
   * Request Bluetooth permissions based on platform and Android version
   */
  private async requestPermissions(): Promise<boolean> {
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
        // Android version 31 and above (Android 12+)
        return this.requestAndroid31Permissions();
      }
    } else {
      // iOS doesn't need permission in the same way
      return true;
    }
  }

  /**
   * Request the required permissions for Android 12+
   */
  private async requestAndroid31Permissions(): Promise<boolean> {
    const bluetoothScanPermission = await PermissionsAndroid.request(
      PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN,
      {
        title: "Bluetooth Scan Permission",
        message: "App needs permission to scan for Bluetooth devices",
        buttonPositive: "OK",
      }
    );
    const bluetoothConnectPermission = await PermissionsAndroid.request(
      PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT,
      {
        title: "Bluetooth Connect Permission",
        message: "App needs permission to connect to Bluetooth devices",
        buttonPositive: "OK",
      }
    );
    const fineLocationPermission = await PermissionsAndroid.request(
      PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
      {
        title: "Location Permission",
        message: "Bluetooth scanning requires precise location",
        buttonPositive: "OK",
      }
    );

    return (
      bluetoothScanPermission === PermissionsAndroid.RESULTS.GRANTED &&
      bluetoothConnectPermission === PermissionsAndroid.RESULTS.GRANTED &&
      fineLocationPermission === PermissionsAndroid.RESULTS.GRANTED
    );
  }
} 