import AsyncStorage from "@react-native-async-storage/async-storage";

/**
 * Service for managing AsyncStorage operations
 */
export class StorageService {
  /**
   * Store a value in AsyncStorage with retry logic
   * @param key Storage key
   * @param value Value to store (will be JSON stringified)
   * @param retries Number of retries if operation fails
   */
  public async setValue<T>(key: string, value: T, retries: number = 3): Promise<void> {
    try {
      const jsonValue = JSON.stringify(value);
      
      // Special logging for savedDevices
      if (key === 'savedDevices') {
        const devices = value as any[];
        console.log(`[StorageService] Setting '${key}'. Size: ${jsonValue.length} bytes, ${devices.length} devices.`);
        console.log(`[StorageService] Devices preview:`, devices.map(d => ({id: d.id, name: d.name, lastConnected: d.lastConnected ? new Date(d.lastConnected).toISOString() : 'none'})));
      } else {
        console.log(`[StorageService] Attempting to set key: '${key}'`);
      }
      
      await AsyncStorage.setItem(key, jsonValue);
      
      // Verify the value was actually set
      const verifyValue = await AsyncStorage.getItem(key);
      if (verifyValue === null) {
        console.warn(`[StorageService] Verification failed for key: '${key}' - value was not persisted!`);
        if (retries > 0) {
          console.log(`[StorageService] Retrying set operation for key: '${key}', ${retries} attempts left`);
          // Add a small delay before retry
          await new Promise(resolve => setTimeout(resolve, 100));
          return this.setValue(key, value, retries - 1);
        } else {
          throw new Error(`Failed to persist value for key: '${key}' after multiple attempts`);
        }
      }
      
      if (key === 'savedDevices') {
        console.log(`[StorageService] Successfully verified '${key}' with size ${verifyValue?.length || 0} bytes`);
      } else {
        console.log(`[StorageService] Successfully set and verified key: '${key}'`);
      }
    } catch (error) {
      console.error(`[StorageService] Error setting value for key '${key}':`, error);
      
      if (retries > 0) {
        console.log(`[StorageService] Retrying set operation for key: '${key}', ${retries} attempts left`);
        // Add a small delay before retry
        await new Promise(resolve => setTimeout(resolve, 100));
        return this.setValue(key, value, retries - 1);
      }
      
      throw error;
    }
  }

  /**
   * Get a value from AsyncStorage
   * @param key Storage key
   * @returns Retrieved value or null if not found
   */
  public async getValue<T>(key: string): Promise<T | null> {
    try {
      console.log(`[StorageService] Attempting to get value for key: '${key}'`);
      const jsonValue = await AsyncStorage.getItem(key);
      console.log(`[StorageService] Raw value for key '${key}': ${jsonValue === null ? 'null' : jsonValue}`);
      if (jsonValue !== null) {
        try {
          const parsedValue = JSON.parse(jsonValue) as T;
          console.log(`[StorageService] Parsed value for key '${key}':`, parsedValue);
          return parsedValue;
        } catch (parseError) {
          console.error(`[StorageService] Error parsing JSON for key '${key}':`, parseError, `Raw value: ${jsonValue}`);
          return null;
        }
      } else {
        return null;
      }
    } catch (error) {
      console.error(`[StorageService] Error getting value for key '${key}':`, error);
      return null;
    }
  }

  /**
   * Remove a value from AsyncStorage
   * @param key Storage key to remove
   */
  public async removeValue(key: string): Promise<void> {
    try {
      console.log(`[StorageService] Attempting to remove key: '${key}'`);
      await AsyncStorage.removeItem(key);
      console.log(`[StorageService] Successfully removed key: '${key}'`);
    } catch (error) {
      console.error(`[StorageService] Error removing key '${key}':`, error);
      throw error;
    }
  }

  /**
   * Clear all values from AsyncStorage
   * Use with caution!
   */
  public async clearAll(): Promise<void> {
    try {
      console.warn('[StorageService] Attempting to clear all AsyncStorage data!');
      await AsyncStorage.clear();
      console.log('[StorageService] Successfully cleared all AsyncStorage data.');
    } catch (error) {
      console.error('[StorageService] Error clearing AsyncStorage:', error);
      throw error;
    }
  }

  /**
   * Check if a key exists in AsyncStorage
   * @param key Storage key to check
   * @returns Boolean indicating if key exists
   */
  public async hasKey(key: string): Promise<boolean> {
    try {
      console.log(`[StorageService] Checking existence of key: '${key}'`);
      const value = await AsyncStorage.getItem(key);
      const keyExists = value !== null;
      console.log(`[StorageService] Key '${key}' ${keyExists ? 'exists' : 'does NOT exist'}. Raw value: ${value === null ? 'null' : value}`);
      return keyExists;
    } catch (error) {
      console.error(`[StorageService] Error checking key '${key}':`, error);
      return false;
    }
  }

  /**
   * Get multiple values from AsyncStorage
   * @param keys Array of storage keys
   * @returns Object mapping keys to their values
   */
  public async getMultipleValues(keys: string[]): Promise<Record<string, any>> {
    try {
      const result: Record<string, any> = {};
      console.log(`[StorageService] Getting multiple keys: ${keys.join(', ')}`);
      const keyValuePairs = await AsyncStorage.multiGet(keys);
      
      keyValuePairs.forEach(([key, value]) => {
        if (value !== null) {
          try {
            result[key] = JSON.parse(value);
          } catch {
            result[key] = value; // Use raw value if not valid JSON
          }
        }
      });
      
      console.log(`[StorageService] Retrieved multiple values:`, result);
      return result;
    } catch (error) {
      console.error('[StorageService] Error getting multiple values:', error);
      return {};
    }
  }
} 