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
} 