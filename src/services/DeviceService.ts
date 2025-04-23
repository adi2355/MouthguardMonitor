import { Device } from 'react-native-ble-plx';
import { SavedDevice } from '../types';
import { StorageService } from './StorageService';

const SAVED_DEVICES_KEY = 'savedDevices';

/**
 * Service for managing saved devices
 */
export class DeviceService {
  private storageService: StorageService;

  /**
   * Constructor
   * @param storageService Injected storage service
   */
  constructor(storageService: StorageService) {
    this.storageService = storageService;
  }

  /**
   * Get all saved devices
   * @returns Array of saved devices
   */
  public async getSavedDevices(): Promise<SavedDevice[]> {
    try {
      const devices = await this.storageService.getValue<SavedDevice[]>(SAVED_DEVICES_KEY);
      return devices || [];
    } catch (error) {
      console.error('[DeviceService] Error getting saved devices:', error);
      return [];
    }
  }

  /**
   * Save a single device to storage
   * @param device BLE device to save
   */
  public async saveDevice(device: Device): Promise<void> {
    try {
      // Get existing devices
      const existingDevices = await this.getSavedDevices();
      
      // Create SavedDevice from Device
      const savedDevice: SavedDevice = {
        id: device.id,
        name: device.name || 'Unknown Device',
        lastConnected: Date.now(),
        batteryLevel: undefined // Will be updated when we get battery data
      };
      
      // Check if device already exists
      const existingIndex = existingDevices.findIndex(d => d.id === device.id);
      
      if (existingIndex !== -1) {
        // Update existing device
        existingDevices[existingIndex] = {
          ...existingDevices[existingIndex],
          name: savedDevice.name,
          lastConnected: savedDevice.lastConnected
          // Preserve existing battery level and athlete ID
        };
      } else {
        // Add new device
        existingDevices.push(savedDevice);
      }
      
      // Save to storage
      await this.storageService.setValue(SAVED_DEVICES_KEY, existingDevices);
      
      console.log(`[DeviceService] Saved device: ${device.id}`);
    } catch (error) {
      console.error('[DeviceService] Error saving device:', error);
      throw error;
    }
  }

  /**
   * Save devices to storage
   * @param devices Array of BLE devices to save
   */
  public async saveDevices(devices: Device[]): Promise<void> {
    try {
      // Get existing devices
      const existingDevices = await this.getSavedDevices();
      
      // Map new devices to SavedDevice format
      const newDevices: SavedDevice[] = devices.map(device => ({
        id: device.id,
        name: device.name || 'Unknown Device',
        lastConnected: Date.now()
      }));
      
      // Combine with existing, avoiding duplicates
      const combinedDevices = [...existingDevices];
      
      for (const newDevice of newDevices) {
        const existingIndex = combinedDevices.findIndex(d => d.id === newDevice.id);
        if (existingIndex !== -1) {
          // Update the existing device with a new lastConnected timestamp
          combinedDevices[existingIndex] = {
            ...combinedDevices[existingIndex],
            lastConnected: Date.now()
          };
        } else {
          // Add the new device
          combinedDevices.push(newDevice);
        }
      }
      
      // Save to storage
      await this.storageService.setValue(SAVED_DEVICES_KEY, combinedDevices);
      
      console.log(`[DeviceService] Saved ${newDevices.length} devices, total: ${combinedDevices.length}`);
    } catch (error) {
      console.error('[DeviceService] Error saving devices:', error);
      throw error;
    }
  }

  /**
   * Update the battery level for a device
   * @param deviceId ID of the device to update
   * @param batteryLevel Battery level (0-100)
   */
  public async updateDeviceBatteryLevel(deviceId: string, batteryLevel: number): Promise<void> {
    try {
      const devices = await this.getSavedDevices();
      const deviceIndex = devices.findIndex(d => d.id === deviceId);
      
      if (deviceIndex !== -1) {
        // Update the battery level
        devices[deviceIndex] = {
          ...devices[deviceIndex],
          batteryLevel
        };
        
        // Save to storage
        await this.storageService.setValue(SAVED_DEVICES_KEY, devices);
        console.log(`[DeviceService] Updated battery level for device ${deviceId}: ${batteryLevel}%`);
      }
    } catch (error) {
      console.error('[DeviceService] Error updating device battery level:', error);
      throw error;
    }
  }

  /**
   * Update the athlete assignment for a device
   * @param deviceId ID of the device to update
   * @param athleteId ID of the athlete to assign
   */
  public async updateDeviceAthleteAssignment(deviceId: string, athleteId: string | undefined): Promise<void> {
    try {
      const devices = await this.getSavedDevices();
      const deviceIndex = devices.findIndex(d => d.id === deviceId);
      
      if (deviceIndex !== -1) {
        // Update the athlete assignment
        devices[deviceIndex] = {
          ...devices[deviceIndex],
          athleteId
        };
        
        // Save to storage
        await this.storageService.setValue(SAVED_DEVICES_KEY, devices);
        console.log(`[DeviceService] Updated athlete assignment for device ${deviceId}: ${athleteId}`);
      }
    } catch (error) {
      console.error('[DeviceService] Error updating device athlete assignment:', error);
      throw error;
    }
  }

  /**
   * Get device by ID
   * @param deviceId ID of the device to get
   */
  public async getDeviceById(deviceId: string): Promise<SavedDevice | null> {
    try {
      const devices = await this.getSavedDevices();
      return devices.find(d => d.id === deviceId) || null;
    } catch (error) {
      console.error(`[DeviceService] Error getting device by ID (${deviceId}):`, error);
      return null;
    }
  }

  /**
   * Remove a device from saved devices
   * @param device Device or deviceId to remove
   */
  public async removeDevice(device: SavedDevice | string): Promise<void> {
    try {
      const devices = await this.getSavedDevices();
      const deviceId = typeof device === 'string' ? device : device.id;
      const filteredDevices = devices.filter(d => d.id !== deviceId);
      
      if (filteredDevices.length !== devices.length) {
        await this.storageService.setValue(SAVED_DEVICES_KEY, filteredDevices);
        console.log(`[DeviceService] Removed device: ${deviceId}`);
      }
    } catch (error) {
      console.error(`[DeviceService] Error removing device:`, error);
      throw error;
    }
  }

  /**
   * Clear all saved devices
   */
  public async clearDevices(): Promise<void> {
    try {
      await this.storageService.setValue(SAVED_DEVICES_KEY, []);
      console.log('[DeviceService] Cleared all saved devices');
    } catch (error) {
      console.error('[DeviceService] Error clearing devices:', error);
      throw error;
    }
  }

  /**
   * Update the last connected timestamp for a device
   * @param deviceId ID of the device to update
   */
  public async updateDeviceLastConnected(deviceId: string): Promise<void> {
    try {
      const devices = await this.getSavedDevices();
      const deviceIndex = devices.findIndex(d => d.id === deviceId);

      if (deviceIndex !== -1) {
        // Update the lastConnected timestamp
        devices[deviceIndex] = {
          ...devices[deviceIndex],
          lastConnected: Date.now() // Set to current time
        };

        // Save updated list back to storage
        await this.storageService.setValue(SAVED_DEVICES_KEY, devices);
        console.log(`[DeviceService] Updated lastConnected for device ${deviceId}`);
      } else {
        console.warn(`[DeviceService] Device ${deviceId} not found when trying to update lastConnected`);
      }
    } catch (error) {
      console.error('[DeviceService] Error updating device lastConnected:', error);
      // Don't throw, maybe log or handle differently
    }
  }
} 