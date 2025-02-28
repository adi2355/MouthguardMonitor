import * as Logger from '../utils/logging';
import { CacheRepository } from '../database/repositories/CacheRepository';
import { CacheDbEntry } from '../types/common';
import { DatabaseManager } from '../database/DatabaseManager';

const MODULE_NAME = 'PersistentCache';

/**
 * Persistent cache implementation using SQLite
 * Provides durable storage for cache entries
 */
export class PersistentCache {
  private repository: CacheRepository;
  private initialized: boolean = false;

  constructor() {
    this.repository = new CacheRepository();
    Logger.debug(MODULE_NAME, 'Initialized');
  }

  /**
   * Initialize the persistent cache
   */
  private async ensureInitialized(): Promise<void> {
    if (this.initialized) {
      return;
    }

    try {
      // Make sure the database is initialized
      await DatabaseManager.getInstance().initialize();
      this.initialized = true;
      Logger.debug(MODULE_NAME, 'Database initialized');
    } catch (error) {
      Logger.logError(MODULE_NAME, error as Error, 'Failed to initialize database');
      throw new Error('Cache database not initialized');
    }
  }

  /**
   * Store an entry in the persistent cache
   */
  public async set(key: string, data: any, ttl: number): Promise<void> {
    try {
      await this.ensureInitialized();
      
      Logger.debug(MODULE_NAME, `Storing cache entry with key: ${key}`);
      
      // Validate data before storing
      if (data === null || data === undefined) {
        Logger.error(MODULE_NAME, `Cannot store null or undefined data for key: ${key}`);
        throw new Error('Cannot store null or undefined data in cache');
      }
      
      const now = Date.now();
      const expiresAt = now + ttl;
      
      // Serialize data to JSON string
      let serializedData: string;
      try {
        serializedData = JSON.stringify(data);
      } catch (error) {
        Logger.logError(MODULE_NAME, error as Error, `Failed to serialize data for key: ${key}`);
        throw new Error(`Failed to serialize data for cache key: ${key}`);
      }
      
      // Store in persistent cache
      await this.repository.storeResponse(key, serializedData, now, expiresAt, ttl);
      
      Logger.debug(MODULE_NAME, `Cache entry stored successfully: ${key}`);
    } catch (error) {
      Logger.logError(MODULE_NAME, error as Error, `Failed to store cache entry: ${key}`);
      throw error;
    }
  }

  /**
   * Get an entry from the persistent cache
   */
  public async get<T>(key: string): Promise<T | null> {
    try {
      await this.ensureInitialized();
      
      Logger.debug(MODULE_NAME, `Getting cache entry with key: ${key}`);
      
      const entry = await this.repository.getResponse(key);
      
      if (!entry) {
        Logger.debug(MODULE_NAME, `No cache entry found for key: ${key}`);
        return null;
      }
      
      // Check if the entry is expired
      if (entry.expires_at < Date.now()) {
        Logger.debug(MODULE_NAME, `Cache entry expired for key: ${key}`);
        await this.delete(key);
        return null;
      }
      
      // Update hit count and last accessed time
      await this.repository.updateStats(key, entry.hit_count + 1, Date.now());
      
      // Parse the serialized data
      try {
        const data = JSON.parse(entry.data) as T;
        Logger.debug(MODULE_NAME, `Cache hit for key: ${key}`);
        return data;
      } catch (error) {
        Logger.logError(MODULE_NAME, error as Error, `Failed to parse data for key: ${key}`);
        await this.delete(key);
        return null;
      }
    } catch (error) {
      Logger.logError(MODULE_NAME, error as Error, `Failed to get cache entry: ${key}`);
      return null;
    }
  }

  /**
   * Delete an entry from the persistent cache
   */
  public async delete(key: string): Promise<void> {
    try {
      await this.ensureInitialized();
      
      Logger.debug(MODULE_NAME, `Deleting cache entry: ${key}`);
      await this.repository.deleteEntry(key);
      Logger.debug(MODULE_NAME, `Cache entry deleted: ${key}`);
    } catch (error) {
      Logger.logError(MODULE_NAME, error as Error, `Failed to delete cache entry: ${key}`);
      throw error;
    }
  }

  /**
   * Delete entries by pattern
   */
  public async deleteByPattern(pattern: string): Promise<number> {
    try {
      await this.ensureInitialized();
      
      Logger.debug(MODULE_NAME, `Deleting cache entries by pattern: ${pattern}`);
      const count = await this.repository.deleteByPattern(pattern);
      Logger.debug(MODULE_NAME, `Deleted ${count} cache entries matching pattern: ${pattern}`);
      return count;
    } catch (error) {
      Logger.logError(MODULE_NAME, error as Error, `Failed to delete cache entries by pattern: ${pattern}`);
      throw error;
    }
  }

  /**
   * Clear all entries from the persistent cache
   */
  public async clear(): Promise<void> {
    try {
      await this.ensureInitialized();
      
      Logger.debug(MODULE_NAME, 'Clearing all cache entries');
      await this.repository.clearAll();
      Logger.debug(MODULE_NAME, 'All cache entries cleared');
    } catch (error) {
      Logger.logError(MODULE_NAME, error as Error, 'Failed to clear all cache entries');
      throw error;
    }
  }

  /**
   * Delete expired entries
   */
  public async deleteExpired(): Promise<number> {
    try {
      await this.ensureInitialized();
      
      Logger.debug(MODULE_NAME, 'Deleting expired cache entries');
      const count = await this.repository.deleteExpired();
      Logger.debug(MODULE_NAME, `Deleted ${count} expired cache entries`);
      return count;
    } catch (error) {
      Logger.logError(MODULE_NAME, error as Error, 'Failed to delete expired cache entries');
      throw error;
    }
  }

  /**
   * Get the most frequently used cache entries
   */
  public async getMostFrequentlyUsed(limit: number): Promise<CacheDbEntry[]> {
    try {
      await this.ensureInitialized();
      
      Logger.debug(MODULE_NAME, `Getting ${limit} most frequently used cache entries`);
      const entries = await this.repository.getMostFrequentlyUsed(limit);
      Logger.debug(MODULE_NAME, `Found ${entries.length} most frequently used cache entries`);
      return entries;
    } catch (error) {
      Logger.logError(MODULE_NAME, error as Error, 'Failed to get most frequently used cache entries');
      throw error;
    }
  }

  /**
   * Get all keys for a specific user
   */
  public async getKeysForUser(userId: string): Promise<string[]> {
    try {
      await this.ensureInitialized();
      
      Logger.debug(MODULE_NAME, `Getting cache keys for user: ${userId}`);
      const keyEntries = await this.repository.getKeysForUser(userId);
      const keys = keyEntries.map(entry => entry.key);
      Logger.debug(MODULE_NAME, `Found ${keys.length} cache keys for user: ${userId}`);
      return keys;
    } catch (error) {
      Logger.logError(MODULE_NAME, error as Error, `Failed to get cache keys for user: ${userId}`);
      throw error;
    }
  }
} 