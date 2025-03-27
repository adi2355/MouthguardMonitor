import AsyncStorage from "@react-native-async-storage/async-storage";

/**
 * Service for managing AsyncStorage operations
 */
export class StorageService {
  /**
   * Store a value in AsyncStorage
   * @param key Storage key
   * @param value Value to store (will be JSON stringified)
   */
  public async setValue<T>(key: string, value: T): Promise<void> {
    try {
      const jsonValue = JSON.stringify(value);
      await AsyncStorage.setItem(key, jsonValue);
    } catch (error) {
      console.error(`[StorageService] Error setting value for key ${key}:`, error);
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
      const jsonValue = await AsyncStorage.getItem(key);
      return jsonValue !== null ? JSON.parse(jsonValue) as T : null;
    } catch (error) {
      console.error(`[StorageService] Error getting value for key ${key}:`, error);
      return null;
    }
  }

  /**
   * Remove a value from AsyncStorage
   * @param key Storage key to remove
   */
  public async removeValue(key: string): Promise<void> {
    try {
      await AsyncStorage.removeItem(key);
    } catch (error) {
      console.error(`[StorageService] Error removing key ${key}:`, error);
      throw error;
    }
  }

  /**
   * Clear all values from AsyncStorage
   * Use with caution!
   */
  public async clearAll(): Promise<void> {
    try {
      await AsyncStorage.clear();
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
      const value = await AsyncStorage.getItem(key);
      return value !== null;
    } catch (error) {
      console.error(`[StorageService] Error checking key ${key}:`, error);
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
      
      return result;
    } catch (error) {
      console.error('[StorageService] Error getting multiple values:', error);
      return {};
    }
  }
} 