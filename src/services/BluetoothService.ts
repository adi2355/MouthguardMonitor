import { Alert, PermissionsAndroid, Platform, AppState } from "react-native";
import * as ExpoDevice from "expo-device";
import { BleError, BleManager, Characteristic, Device } from 'react-native-ble-plx';
import base64 from "react-native-base64";
import { Buffer } from 'buffer'; // Import Buffer for binary data parsing
import { BluetoothHandler, SensorCallbacks } from "../contexts/BluetoothContext";
import { DeviceService } from "./DeviceService";
import { SensorDataRepository } from "../repositories/SensorDataRepository";
import { AthleteRepository } from "../repositories/AthleteRepository";
import { DeviceStatus, LiveDataPoint, Session, MotionPacket, FSRPacket, HRMPacket, HTMPacket, ConcussionAlert } from "../types";
import { dataChangeEmitter, dbEvents } from "../utils/EventEmitter";
import { v4 as uuidv4 } from 'uuid';
import { MOUTHGUARD_UUIDS } from '../bleConstants'; // Import the new UUIDs

// Event key for device status updates
const DEVICE_STATUS_UPDATE_EVENT = 'deviceStatusUpdate';
const SENSOR_DATA_EVENT = 'sensorDataEvent';

// Add threshold constants at the top of the file
const CONCUSSION_THRESHOLD_G = 80; // 80g threshold for potential concussion
const MAX_HR_THRESHOLD = 190; // Maximum heart rate threshold
const MIN_HR_THRESHOLD = 40; // Minimum heart rate threshold
const MAX_TEMP_THRESHOLD = 39; // Maximum temperature threshold in Celsius
const MIN_TEMP_THRESHOLD = 35; // Minimum temperature threshold in Celsius

type DeviceStatusSubscription = {
  remove: () => void;
};

type SensorDataSubscription = {
  remove: () => void;
};

/**
 * BluetoothService uses composition with BluetoothHandler and integrates with DeviceService
 * for saving connected devices and with SensorDataRepository for recording sensor data
 */
export class BluetoothService {
  private bluetoothHandler: BluetoothHandler;
  private deviceService: DeviceService;
  private sensorDataRepository: SensorDataRepository;
  private athleteRepository: AthleteRepository;
  private deviceStatusMap: Map<string, DeviceStatus> = new Map();
  private currentSession: Session | null = null;
  private manager: BleManager; // BLE manager instance
  private connectedDevices: Map<string, Device> = new Map(); // Store Device directly

  /**
   * Constructor
   * @param deviceService Service for saving devices
   * @param sensorDataRepository Repository for recording sensor data
   * @param athleteRepository Repository for athlete data
   * @param bluetoothHandler Optional BluetoothHandler instance (creates one if not provided)
   */
  constructor(
    deviceService: DeviceService, 
    sensorDataRepository: SensorDataRepository,
    athleteRepository: AthleteRepository,
    bluetoothHandler?: BluetoothHandler
  ) {
    this.bluetoothHandler = bluetoothHandler || new BluetoothHandler();
    this.deviceService = deviceService;
    this.sensorDataRepository = sensorDataRepository;
    this.athleteRepository = athleteRepository;
    this.manager = new BleManager();
    
    // Set up the callbacks to handle data from bluetooth
    this.setupSensorCallbacks();
    
    // Listen for app state changes to manage connections
    AppState.addEventListener('change', this.handleAppStateChange);
  }

  /**
   * Handle app state changes
   */
  private handleAppStateChange = (nextAppState: string): void => {
    if (nextAppState === 'active') {
      // App came to foreground
      console.log('[BluetoothService] App is active, syncing time with all devices');
      this.bluetoothHandler.syncTimeWithAllDevices();
      
      // Refresh device status
      this.refreshAllDeviceStatus();
    }
  };

  /**
   * Refresh status for all connected devices
   */
  private async refreshAllDeviceStatus(): Promise<void> {
    try {
      // Get all connected devices
      const connectedDevices = this.bluetoothHandler.getConnectedDevices();
      
      // Process each device
      for (const [deviceId, device] of connectedDevices.entries()) {
        await this.updateDeviceStatus(deviceId, true);
      }
    } catch (error) {
      console.error('[BluetoothService] Error refreshing device status:', error);
    }
  }

  /**
   * Update status for a specific device
   */
  private async updateDeviceStatus(deviceId: string, isConnected: boolean): Promise<void> {
    try {
      // Get device details
      let deviceStatus: DeviceStatus = {
        id: deviceId,
        name: 'Unknown Device',
        connected: isConnected,
        lastSeen: Date.now()
      };
      
      // Try to get saved device
      const savedDevices = await this.deviceService.getSavedDevices();
      const savedDevice = savedDevices.find(d => d.id === deviceId);
      
      if (savedDevice) {
        deviceStatus.name = savedDevice.name;
        deviceStatus.batteryLevel = savedDevice.batteryLevel;
      }
      
      // Try to get assigned athlete
      if (savedDevice?.athleteId) {
        const athlete = await this.athleteRepository.getAthleteById(savedDevice.athleteId);
        if (athlete) {
          deviceStatus.athleteInfo = {
            id: athlete.id,
            name: athlete.name
          };
        }
      } else {
        // Or check if this device is assigned to any athlete
        const athlete = await this.athleteRepository.getAthleteByDeviceId(deviceId);
        if (athlete) {
          deviceStatus.athleteInfo = {
            id: athlete.id,
            name: athlete.name
          };
          
          // Update saved device with athlete ID if not already set
          if (savedDevice && !savedDevice.athleteId) {
            await this.deviceService.updateDeviceAthleteAssignment(deviceId, athlete.id);
          }
        }
      }
      
      // Store in the map
      this.deviceStatusMap.set(deviceId, deviceStatus);
      
      // Emit update event
      dataChangeEmitter.emit(DEVICE_STATUS_UPDATE_EVENT, deviceStatus);
      
    } catch (error) {
      console.error(`[BluetoothService] Error updating status for device ${deviceId}:`, error);
    }
  }

  /**
   * Subscribe to device status updates
   */
  public subscribeToDeviceStatusUpdates(callback: (status: DeviceStatus) => void): DeviceStatusSubscription {
    const handler = (status: DeviceStatus) => {
      callback(status);
    };
    
    dataChangeEmitter.on(DEVICE_STATUS_UPDATE_EVENT, handler);
    
    // Initial status emission for all known devices
    for (const status of this.deviceStatusMap.values()) {
      callback(status);
    }
    
    return {
      remove: () => {
        dataChangeEmitter.off(DEVICE_STATUS_UPDATE_EVENT, handler);
      }
    };
  }

  /**
   * Setup callbacks for different sensor types
   */
  private setupSensorCallbacks(): void {
    const callbacks: SensorCallbacks = {
      onImuData: this.handleImuData.bind(this),
      onAccelerometerData: this.handleAccelerometerData.bind(this),
      onTemperatureData: this.handleTemperatureData.bind(this),
      onForceData: this.handleForceData.bind(this),
      onHeartRateData: this.handleHeartRateData.bind(this),
      onBatteryLevel: this.handleBatteryLevel.bind(this)
    };
    
    this.bluetoothHandler.setSensorCallbacks(callbacks);
  }

  /**
   * Handle IMU data from the device
   */
  private async handleImuData(deviceId: string, sensorId: number, data: { timestamp: number, values: number[] }): Promise<void> {
    try {
      const [x, y, z] = data.values;
      // console.log(`[BluetoothService] IMU data from ${deviceId} sensor ${sensorId}: x=${x}, y=${y}, z=${z}`);
      
      // Update device's last seen timestamp
      await this.updateDeviceLastSeen(deviceId);
      
      // Emit live data event
      const liveDataPoint: LiveDataPoint = {
        deviceId,
        timestamp: data.timestamp,
        type: 'imu',
        values: [x, y, z]
      };
      dataChangeEmitter.emit(SENSOR_DATA_EVENT, deviceId, liveDataPoint);
      
      // Save to repository
      await this.sensorDataRepository.recordImuData(deviceId, sensorId, data.timestamp, x, y, z);
      
      // Emit data change event
      dataChangeEmitter.emit(dbEvents.DATA_CHANGED);
    } catch (error) {
      console.error('[BluetoothService] Error processing IMU data:', error);
    }
  }

  /**
   * Handle Accelerometer data from the device
   */
  private async handleAccelerometerData(deviceId: string, sensorId: number, data: { timestamp: number, values: number[] }): Promise<void> {
    try {
      const [x, y, z, magnitude] = data.values;
      // console.log(`[BluetoothService] Accelerometer data from ${deviceId} sensor ${sensorId}: x=${x}, y=${y}, z=${z}, magnitude=${magnitude}`);
      
      // Update device's last seen timestamp
      await this.updateDeviceLastSeen(deviceId);
      
      // Emit live data event for real-time display
      const liveDataPoint: LiveDataPoint = {
        deviceId,
        timestamp: data.timestamp,
        type: 'accelerometer',
        values: data.values
      };
      dataChangeEmitter.emit(SENSOR_DATA_EVENT, deviceId, liveDataPoint);
      
      // If we have a high-G event, detect potential concussion
      if (magnitude > CONCUSSION_THRESHOLD_G) {
        console.log(`[BluetoothService] HIGH-G IMPACT DETECTED: ${magnitude.toFixed(1)}g from device ${deviceId}`);
        
        // Get athlete info if available
        let athleteId: string | undefined;
        let athleteName: string | undefined;
        
        try {
          const savedDevices = await this.deviceService.getSavedDevices();
          const device = savedDevices.find(d => d.id === deviceId);
          
          if (device?.athleteId) {
            const athlete = await this.athleteRepository.getAthleteById(device.athleteId);
            if (athlete) {
              athleteId = athlete.id;
              athleteName = athlete.name;
            }
          }
        } catch (error) {
          console.error('[BluetoothService] Error getting athlete info for impact alert:', error);
        }
        
        // Generate a concussion alert
        const alertId = `alert_${Date.now()}_${Math.floor(Math.random() * 10000)}`;
        const severity = 
          magnitude > 120 ? 'critical' :
          magnitude > 100 ? 'severe' :
          magnitude > 80 ? 'moderate' : 'low';
          
        const alert: ConcussionAlert = {
          id: alertId,
          deviceId,
          athleteId,
          athleteName,
          timestamp: data.timestamp,
          magnitude,
          severity: severity as any,
          acknowledged: false
        };
        
        // COMMENT OUT: Emit alert event
        // dataChangeEmitter.emit('ALERT_TRIGGERED', alert);
        
        // Record impact event
        try {
          await this.sensorDataRepository.recordImpactEvent({
            deviceId,
            athleteId,
            timestamp: data.timestamp,
            magnitude,
            x, y, z,
            severity: severity as any,
            createdAt: Date.now()
          });
        } catch (error) {
          console.error('[BluetoothService] Error recording impact event:', error);
        }
      }
      
      // Record the accelerometer data
      await this.sensorDataRepository.recordAccelerometerData({
        deviceId,
        sensorId,
        timestamp: data.timestamp,
        x, y, z,
        magnitude,
        createdAt: Date.now()
      });
    } catch (error) {
      console.error(`[BluetoothService] Error handling accelerometer data: ${error}`);
    }
  }

  /**
   * Handle Temperature data from the device
   */
  private async handleTemperatureData(deviceId: string, sensorId: number, data: { timestamp: number, values: number[] }): Promise<void> {
    try {
      const temperature = data.values[0];
      // console.log(`[BluetoothService] Temperature data from ${deviceId} sensor ${sensorId}: ${temperature}°C`);
      
      // Update device's last seen timestamp
      await this.updateDeviceLastSeen(deviceId);
      
      // Emit live data for real-time display
      const liveDataPoint: LiveDataPoint = {
        deviceId,
        timestamp: data.timestamp,
        type: 'temperature',
        values: data.values
      };
      dataChangeEmitter.emit(SENSOR_DATA_EVENT, deviceId, liveDataPoint);
      
      // Check for temperature threshold violations
      if (temperature > MAX_TEMP_THRESHOLD || temperature < MIN_TEMP_THRESHOLD) {
        console.log(`[BluetoothService] TEMPERATURE ALERT: ${temperature.toFixed(1)}°C from device ${deviceId}`);
        
        // Get athlete info if available
        let athleteId: string | undefined;
        let athleteName: string | undefined;
        
        try {
          const savedDevices = await this.deviceService.getSavedDevices();
          const device = savedDevices.find(d => d.id === deviceId);
          
          if (device?.athleteId) {
            const athlete = await this.athleteRepository.getAthleteById(device.athleteId);
            if (athlete) {
              athleteId = athlete.id;
              athleteName = athlete.name;
            }
          }
        } catch (error) {
          console.error('[BluetoothService] Error getting athlete info for temperature alert:', error);
        }
        
        // Generate an alert
        const alertId = `alert_${Date.now()}_${Math.floor(Math.random() * 10000)}`;
        const severity = 
          temperature > MAX_TEMP_THRESHOLD ? 'severe' :
          temperature < MIN_TEMP_THRESHOLD ? 'moderate' : 'low';
          
        const alert: ConcussionAlert = {
          id: alertId,
          deviceId,
          athleteId,
          athleteName,
          timestamp: data.timestamp,
          magnitude: temperature, // Using temperature as magnitude
          severity: severity as any,
          acknowledged: false,
          notes: `Temperature: ${temperature.toFixed(1)}°C (${temperature > MAX_TEMP_THRESHOLD ? 'above maximum threshold' : 'below minimum threshold'})`
        };
        
        // Emit alert event
        dataChangeEmitter.emit('ALERT_TRIGGERED', alert);
      }
      
      // Record the temperature data
      await this.sensorDataRepository.recordTemperatureData({
        deviceId,
        sensorId,
        timestamp: data.timestamp,
        temperature,
        createdAt: Date.now()
      });
    } catch (error) {
      console.error(`[BluetoothService] Error handling temperature data: ${error}`);
    }
  }

  /**
   * Handle Force data from the device
   */
  private async handleForceData(deviceId: string, sensorId: number, data: { timestamp: number, values: number[] }): Promise<void> {
    try {
      const force = data.values[0];
      // console.log(`[BluetoothService] Force data from ${deviceId} sensor ${sensorId}: force=${force}N`);
      
      // Update device's last seen timestamp
      await this.updateDeviceLastSeen(deviceId);
      
      // Emit live data event
      const liveDataPoint: LiveDataPoint = {
        deviceId,
        timestamp: data.timestamp,
        type: 'force',
        values: [force]
      };
      dataChangeEmitter.emit(SENSOR_DATA_EVENT, deviceId, liveDataPoint);
      
      // Save to repository
      await this.sensorDataRepository.recordForceData(deviceId, sensorId, data.timestamp, force);
      
      // Emit data change event
      dataChangeEmitter.emit(dbEvents.DATA_CHANGED);
    } catch (error) {
      console.error('[BluetoothService] Error processing force data:', error);
    }
  }

  /**
   * Handle Heart Rate data from the device
   */
  private async handleHeartRateData(deviceId: string, heartRate: number): Promise<void> {
    try {
      // Update device's last seen timestamp
      await this.updateDeviceLastSeen(deviceId);
      
      // Emit live data for real-time display
      const liveDataPoint: LiveDataPoint = {
        deviceId,
        timestamp: Date.now(),
        type: 'heartRate',
        values: [heartRate]
      };
      dataChangeEmitter.emit(SENSOR_DATA_EVENT, deviceId, liveDataPoint);
      
      // Check for heart rate threshold violations
      if (heartRate > MAX_HR_THRESHOLD || heartRate < MIN_HR_THRESHOLD) {
        console.log(`[BluetoothService] HEART RATE ALERT: ${heartRate} bpm from device ${deviceId}`);
        
        // Get athlete info if available
        let athleteId: string | undefined;
        let athleteName: string | undefined;
        
        try {
          const savedDevices = await this.deviceService.getSavedDevices();
          const device = savedDevices.find(d => d.id === deviceId);
          
          if (device?.athleteId) {
            const athlete = await this.athleteRepository.getAthleteById(device.athleteId);
            if (athlete) {
              athleteId = athlete.id;
              athleteName = athlete.name;
            }
          }
        } catch (error) {
          console.error('[BluetoothService] Error getting athlete info for heart rate alert:', error);
        }
        
        // Generate an alert
        const alertId = `alert_${Date.now()}_${Math.floor(Math.random() * 10000)}`;
        const severity = 
          heartRate > MAX_HR_THRESHOLD ? 'severe' :
          heartRate < MIN_HR_THRESHOLD ? 'critical' : 'moderate';
          
        const alert: ConcussionAlert = {
          id: alertId,
          deviceId,
          athleteId,
          athleteName,
          timestamp: Date.now(),
          magnitude: heartRate, // Using heartRate as magnitude for visualization
          severity: severity as any,
          acknowledged: false,
          notes: `Heart rate: ${heartRate} bpm (${heartRate > MAX_HR_THRESHOLD ? 'above maximum threshold' : 'below minimum threshold'})`
        };
        
        // Emit alert event
        dataChangeEmitter.emit('ALERT_TRIGGERED', alert);
      }
      
      // Record the heart rate data
      await this.sensorDataRepository.recordHeartRateData({
        deviceId,
        timestamp: Date.now(),
        heartRate,
        createdAt: Date.now()
      });
    } catch (error) {
      console.error(`[BluetoothService] Error handling heart rate data: ${error}`);
    }
  }

  /**
   * Handle Battery Level data from the device
   */
  private async handleBatteryLevel(deviceId: string, level: number): Promise<void> {
    try {
      console.log(`[BluetoothService] Battery level from ${deviceId}: ${level}%`);
      
      // Update device battery level in storage
      await this.deviceService.updateDeviceBatteryLevel(deviceId, level);
      
      // Update device status map
      if (this.deviceStatusMap.has(deviceId)) {
        const updatedStatus = {
          ...this.deviceStatusMap.get(deviceId)!,
          batteryLevel: level,
          lastSeen: Date.now()
        };
        this.deviceStatusMap.set(deviceId, updatedStatus);
        
        // Emit update
        dataChangeEmitter.emit(DEVICE_STATUS_UPDATE_EVENT, updatedStatus);
      }
      
      // Low battery warning
      if (level < 20 && AppState.currentState === 'active') {
        // Get device name
        let deviceName = `Device ${deviceId}`;
        if (this.deviceStatusMap.has(deviceId)) {
          deviceName = this.deviceStatusMap.get(deviceId)!.name;
        }
        
        Alert.alert('Low Battery', `${deviceName} battery level is ${level}%. Please charge soon.`);
      }
    } catch (error) {
      console.error('[BluetoothService] Error processing battery level data:', error);
    }
  }

  /**
   * Update the last seen timestamp for a device
   */
  private async updateDeviceLastSeen(deviceId: string): Promise<void> {
    // Update the status map
    if (this.deviceStatusMap.has(deviceId)) {
      const currentStatus = this.deviceStatusMap.get(deviceId)!;
      // Only update if it's been more than 5 seconds since the last update
      // to avoid excessive update events
      if (!currentStatus.lastSeen || Date.now() - currentStatus.lastSeen > 5000) {
        const updatedStatus = {
          ...currentStatus,
          lastSeen: Date.now()
        };
        this.deviceStatusMap.set(deviceId, updatedStatus);
        
        // Emit update
        dataChangeEmitter.emit(DEVICE_STATUS_UPDATE_EVENT, updatedStatus);
      }
    }
  }

  /**
   * Connect to a device by ID and save it to storage
   * @param deviceId ID of the device to connect to
   */
  public async connectToDevice(deviceId: string): Promise<void> {
    try {
      console.log(`[BluetoothService] Connecting to device: ${deviceId}`);
      
      // Check if already connected
      if (this.connectedDevices.has(deviceId)) {
        console.log(`[BluetoothService] Device ${deviceId} already connected`);
        this.updateDeviceStatus(deviceId, true);
        return;
      }
      
      // Attempt connection
      const device = await this.manager.connectToDevice(deviceId);
      console.log(`[BluetoothService] Connected to device: ${deviceId}`);
      
      // Store in connected devices map
      this.connectedDevices.set(deviceId, device);
      
      // Update device status
      this.updateDeviceStatus(deviceId, true);

      // Discover services and characteristics
      console.log(`[BluetoothService] Discovering services for device: ${deviceId}`);
      await device.discoverAllServicesAndCharacteristics();
      console.log(`[BluetoothService] Services discovered for device: ${deviceId}`);
      
      // Setup monitoring for relevant characteristics
      this.setupMonitoringForDevice(deviceId);
      
      // Update saved device with lastConnected
      const savedDevices = await this.deviceService.getSavedDevices();
      const savedDevice = savedDevices.find(d => d.id === deviceId);
      
      if (savedDevice) {
        await this.deviceService.updateDeviceLastConnected(deviceId);
      } else {
        // Save the actual Device object
        await this.deviceService.saveDevice(device);
      }
      
    } catch (error) {
      console.error(`[BluetoothService] Error connecting to device ${deviceId}:`, error);
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
      const hasPermission = await this.bluetoothHandler.requestPermissions();
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
      
      // Stop scan after timeout
      return new Promise((resolve) => {
        setTimeout(() => {
          manager.stopDeviceScan();
          console.log('[BluetoothService] Device scan stopped');
          resolve();
        }, timeoutMs);
      });
    } catch (error) {
      console.error('[BluetoothService] Error scanning for devices:', error);
      throw error;
    }
  }

  /**
   * Disconnect from a device
   * @param deviceId ID of the device to disconnect from
   */
  public disconnectFromDevice(deviceId: string): void {
    try {
      this.bluetoothHandler.disconnectFromDevice(deviceId);
      
      // Update status
      if (this.deviceStatusMap.has(deviceId)) {
        const disconnectedStatus = {
          ...this.deviceStatusMap.get(deviceId)!,
          connected: false,
          lastSeen: Date.now()
        };
        this.deviceStatusMap.set(deviceId, disconnectedStatus);
        dataChangeEmitter.emit(DEVICE_STATUS_UPDATE_EVENT, disconnectedStatus);
      }
    } catch (error) {
      console.error(`[BluetoothService] Error disconnecting from device ${deviceId}:`, error);
    }
  }

  /**
   * Get all connected devices
   * @returns Map of connected devices
   */
  public getConnectedDevices(): Map<string, Device> {
    // Return a copy of the connected devices map
    return new Map(this.connectedDevices);
  }

  /**
   * Get saved devices from storage
   */
  public async getSavedDevices() {
    return this.deviceService.getSavedDevices();
  }

  /**
   * Get all device statuses
   */
  public getDeviceStatuses(): DeviceStatus[] {
    return Array.from(this.deviceStatusMap.values());
  }

  /**
   * Subscribe to sensor data updates
   * @param callback Called when new sensor data is received
   * @returns Subscription object with remove method
   */
  public subscribeSensorData(
    callback: (deviceId: string, dataPoint: LiveDataPoint) => void
  ): SensorDataSubscription {
    const handler = (deviceId: string, dataPoint: LiveDataPoint) => {
      callback(deviceId, dataPoint);
    };
    
    dataChangeEmitter.on(SENSOR_DATA_EVENT, handler);
    
    return {
      remove: () => {
        dataChangeEmitter.off(SENSOR_DATA_EVENT, handler);
      }
    };
  }

  /**
   * Start a monitoring session
   * Creates a new session in the database
   */
  public async startSession(): Promise<string> {
    if (this.currentSession) {
      throw new Error('A session is already active. Stop it before starting a new one.');
    }
    
    try {
      // Create session ID
      const sessionId = `session_${uuidv4()}`;
      const now = Date.now();
      
      // Create session object
      this.currentSession = {
        id: sessionId,
        name: `Session ${new Date(now).toLocaleString()}`,
        startTime: now,
        createdAt: now
      };
      
      // Save session to database
      // TODO: Implement SessionRepository and save session
      console.log(`[BluetoothService] Started session ${sessionId}`);
      
      // Get all connected devices with athletes
      const connectedDevices = Array.from(this.deviceStatusMap.values())
        .filter(device => device.connected && device.athleteInfo);
      
      // Record session-athlete associations
      for (const device of connectedDevices) {
        if (device.athleteInfo) {
          // TODO: Save session-athlete relationship in database
          console.log(`[BluetoothService] Added athlete ${device.athleteInfo.id} to session ${sessionId}`);
        }
      }
      
      return sessionId;
    } catch (error) {
      console.error('[BluetoothService] Error starting session:', error);
      throw error;
    }
  }

  /**
   * Stop the current monitoring session
   */
  public async stopSession(): Promise<void> {
    if (!this.currentSession) {
      throw new Error('No active session to stop.');
    }
    
    try {
      const now = Date.now();
      
      // Update session with end time
      this.currentSession.endTime = now;
      
      // Save updated session to database
      // TODO: Implement SessionRepository and update session
      console.log(`[BluetoothService] Stopped session ${this.currentSession.id}`);
      
      // Update session-athlete records with end time
      // TODO: Implement SessionAthleteRepository and update records
      
      // Clear current session
      this.currentSession = null;
    } catch (error) {
      console.error('[BluetoothService] Error stopping session:', error);
      throw error;
    }
  }

  /**
   * Setup monitoring for BLE characteristics for a connected device
   */
  private setupMonitoringForDevice(deviceId: string) {
    const device = this.connectedDevices.get(deviceId);
    if (!device) {
        console.error(`[BluetoothService] Device ${deviceId} not found for monitoring setup`);
        return;
    }

    console.log(`[BluetoothService] Setting up monitoring for device ${deviceId}`);

    // Characteristics to monitor
    const characteristicsToMonitor = [
        { service: MOUTHGUARD_UUIDS.services.hrm, characteristic: MOUTHGUARD_UUIDS.characteristics.hrmData },
        { service: MOUTHGUARD_UUIDS.services.htm, characteristic: MOUTHGUARD_UUIDS.characteristics.htmData },
        { service: MOUTHGUARD_UUIDS.services.imu, characteristic: MOUTHGUARD_UUIDS.characteristics.imuData },
        { service: MOUTHGUARD_UUIDS.services.fsr, characteristic: MOUTHGUARD_UUIDS.characteristics.fsrData },
        // Add battery if needed
        { service: MOUTHGUARD_UUIDS.services.battery, characteristic: MOUTHGUARD_UUIDS.characteristics.batteryLevel },
    ];

    characteristicsToMonitor.forEach(({ service, characteristic }) => {
        try {
            console.log(`[BluetoothService] - Monitoring ${service}/${characteristic}`);
            device.monitorCharacteristicForService(
                service,
                characteristic,
                (error, char) => this.handleCharacteristicUpdate(
                    deviceId, service, characteristic, error, char
                )
            );
        } catch (error) {
            console.error(`[BluetoothService] Error setting up monitoring for ${service}/${characteristic}:`, error);
        }
    });

    console.log(`[BluetoothService] Monitoring setup complete for device ${deviceId}`);
  }

  /**
   * Parse and handle incoming BLE characteristic updates from the device
   */
  private handleCharacteristicUpdate(
    deviceId: string,
    serviceUuid: string,
    characteristicUuid: string,
    error: BleError | null,
    characteristic: Characteristic | null
  ) {
    if (error) {
        // Handle connection errors, log them, potentially update device status
        console.error(`[BluetoothService] Error monitoring ${characteristicUuid}:`, error.message);
        if (error.errorCode === 201 || error.errorCode === 205) { // Device disconnected codes
             this.updateDeviceStatus(deviceId, false); // Update status to disconnected
             this.connectedDevices.delete(deviceId);
        }
        return;
    }

    if (!characteristic?.value) {
        console.warn(`[BluetoothService] No data received from ${characteristicUuid}`);
        return;
    }

    try {
        // Decode Base64 value to a Buffer
        const buffer = Buffer.from(characteristic.value, 'base64');
        const appTimestamp = Date.now(); // Timestamp when app received data

        // --- PARSING LOGIC BASED ON CHARACTERISTIC UUID ---

        // --- HRM Data ---
        if (characteristicUuid.toLowerCase() === MOUTHGUARD_UUIDS.characteristics.hrmData.toLowerCase()) {
            if (buffer.length >= 5) { // Expected size: 1 byte HR + 4 bytes timestamp
                const hrmPacket: HRMPacket = {
                    heartRate: buffer.readUInt8(0),
                    // Assuming device_timestamp is uint32_t LE at offset 1
                    deviceTimestamp: buffer.readUInt32LE(1),
                    flags: 0, // Flags aren't in your custom struct, set default or derive if needed
                    appTimestamp: appTimestamp
                };
                console.log(`[BluetoothService] Parsed HRM: HR=${hrmPacket.heartRate}, DevTS=${hrmPacket.deviceTimestamp}`);
                this.sensorDataRepository.recordHRMPacket(deviceId, hrmPacket); // Store raw packet
                dataChangeEmitter.emit(SENSOR_DATA_EVENT, deviceId, { type: 'heartRate', deviceId, timestamp: appTimestamp, values: [hrmPacket.heartRate] } as LiveDataPoint);
                dataChangeEmitter.emit(dbEvents.DATA_CHANGED, { type: 'hrm', deviceId });
            } else {
                 console.warn(`[BluetoothService] HRM data has unexpected length: ${buffer.length} bytes`);
            }
        }

        // --- HTM Data ---
        else if (characteristicUuid.toLowerCase() === MOUTHGUARD_UUIDS.characteristics.htmData.toLowerCase()) {
             if (buffer.length >= 6) { // Expected size: 2 bytes temp + 4 bytes timestamp
                // Read temperature (int16_t, scaled by 100)
                const rawTempValue = buffer.readInt16LE(0);
                const temperatureCelsius = rawTempValue / 100.0; // Reverse the scaling
                const deviceTimestamp = buffer.readUInt32LE(2);

                const htmPacket: HTMPacket = {
                     temperature: temperatureCelsius, // Store the actual temperature
                     timestamp: deviceTimestamp, // Use the timestamp property from the interface
                     flags: 0, // Flags aren't in your custom struct
                     appTimestamp: appTimestamp
                };
                console.log(`[BluetoothService] Parsed HTM: Temp=${htmPacket.temperature.toFixed(2)}C, DevTS=${htmPacket.timestamp}`);
                this.sensorDataRepository.recordHTMPacket(deviceId, htmPacket); // Store parsed packet
                dataChangeEmitter.emit(SENSOR_DATA_EVENT, deviceId, { type: 'temperature', deviceId, timestamp: appTimestamp, values: [htmPacket.temperature] } as LiveDataPoint);
                dataChangeEmitter.emit(dbEvents.DATA_CHANGED, { type: 'htm', deviceId });
            } else {
                 console.warn(`[BluetoothService] HTM data has unexpected length: ${buffer.length} bytes`);
            }
        }

        // --- IMU Data ---
        else if (characteristicUuid.toLowerCase() === MOUTHGUARD_UUIDS.characteristics.imuData.toLowerCase()) {
            if (buffer.length >= 32) { // Expected size based on motion_packet struct
                const motionPacket: MotionPacket = {
                    gyro: [buffer.readInt16LE(0), buffer.readInt16LE(2), buffer.readInt16LE(4)],
                    accel16: [buffer.readInt16LE(6), buffer.readInt16LE(8), buffer.readInt16LE(10)],
                    accel200: [buffer.readInt16LE(12), buffer.readInt16LE(14), buffer.readInt16LE(16)],
                    mag: [buffer.readInt16LE(18), buffer.readInt16LE(20), buffer.readInt16LE(22)],
                    bite_l: buffer.readUInt16LE(24),
                    bite_r: buffer.readUInt16LE(26),
                    timestamp: buffer.readUInt32LE(28) // Device timestamp
                };
                console.log(`[BluetoothService] Parsed IMU: Gyro=${motionPacket.gyro[0]}, Acc16=${motionPacket.accel16[0]}, Acc200=${motionPacket.accel200[0]}, Mag=${motionPacket.mag[0]}, BiteL=${motionPacket.bite_l}, DevTS=${motionPacket.timestamp}`);
                this.sensorDataRepository.recordMotionPacket(deviceId, motionPacket); // Store raw packet
                // Emit specific live data points as needed (e.g., high-G accel)
                const SENSITIVITY_200G = 16384 / 200; // Example, adjust as needed
                const gForceX = motionPacket.accel200[0] / SENSITIVITY_200G;
                const gForceY = motionPacket.accel200[1] / SENSITIVITY_200G;
                const gForceZ = motionPacket.accel200[2] / SENSITIVITY_200G;
                const magnitude = Math.sqrt(gForceX**2 + gForceY**2 + gForceZ**2);
                dataChangeEmitter.emit(SENSOR_DATA_EVENT, deviceId, { type: 'accelerometer', deviceId, timestamp: appTimestamp, values: [gForceX, gForceY, gForceZ, magnitude] } as LiveDataPoint);
                 dataChangeEmitter.emit(dbEvents.DATA_CHANGED, { type: 'motion', deviceId });
            } else {
                 console.warn(`[BluetoothService] IMU data has unexpected length: ${buffer.length} bytes`);
            }
        }

        // --- FSR (Bite Force) Data ---
        else if (characteristicUuid.toLowerCase() === MOUTHGUARD_UUIDS.characteristics.fsrData.toLowerCase()) {
            if (buffer.length >= 8) { // Expected size: 2 bytes left + 2 bytes right + 4 bytes timestamp
                // Read bite forces (int16_t, scaled by 100)
                const rawLeftBite = buffer.readInt16LE(0);
                const rawRightBite = buffer.readInt16LE(2);
                const leftBiteForce = rawLeftBite / 100.0;   // Reverse scaling
                const rightBiteForce = rawRightBite / 100.0; // Reverse scaling
                const deviceTimestamp = buffer.readUInt32LE(4);

                const fsrPacket: FSRPacket = {
                    left_bite: leftBiteForce,  // Store actual force
                    right_bite: rightBiteForce, // Store actual force
                    timestamp: deviceTimestamp // Device timestamp
                };
                console.log(`[BluetoothService] Parsed FSR: L=${fsrPacket.left_bite.toFixed(2)}, R=${fsrPacket.right_bite.toFixed(2)}, DevTS=${fsrPacket.timestamp}`);
                this.sensorDataRepository.recordFSRPacket(deviceId, fsrPacket); // Store parsed packet
                dataChangeEmitter.emit(SENSOR_DATA_EVENT, deviceId, { type: 'force', deviceId, timestamp: appTimestamp, values: [fsrPacket.left_bite, fsrPacket.right_bite] } as LiveDataPoint);
                dataChangeEmitter.emit(dbEvents.DATA_CHANGED, { type: 'fsr', deviceId });
            } else {
                 console.warn(`[BluetoothService] FSR data has unexpected length: ${buffer.length} bytes`);
            }
        }

        // --- Battery Level ---
         else if (characteristicUuid.toLowerCase() === MOUTHGUARD_UUIDS.characteristics.batteryLevel.toLowerCase()) {
            const level = buffer.readUInt8(0);
            this.handleBatteryLevel(deviceId, level); // Use existing handler
        }

        // --- Add other characteristic handling if needed ---

        else {
            // Optional: Log data from characteristics you don't explicitly handle
            // console.log(`[BluetoothService] Data from unhandled characteristic ${characteristicUuid}: ${buffer.toString('hex')}`);
        }

         // Update last seen timestamp after successful processing
        this.updateDeviceLastSeen(deviceId);

    } catch (parseError) {
        console.error(`[BluetoothService] Error parsing data from ${characteristicUuid}:`, parseError);
        console.error(`[BluetoothService] Raw Base64 Data: ${characteristic.value}`);
    }
  }
} 