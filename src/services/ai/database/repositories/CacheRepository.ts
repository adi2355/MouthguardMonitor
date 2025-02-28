import { SQLiteDatabase } from "expo-sqlite";
import { DatabaseManager } from "../DatabaseManager";
import * as Logger from '../../utils/logging';
import { CacheDbEntry, KeyEntry, CountResult } from '../../types/common';

const MODULE_NAME = 'CacheRepository';

/**
 * Repository for cache database operations
 */
export class CacheRepository {
  private db: SQLiteDatabase | null = null;

  constructor() {
    try {
      this.db = DatabaseManager.getInstance().getCacheDb();
    } catch (error) {
      Logger.logError(MODULE_NAME, error as Error, 'Failed to get cache database');
    }
  }

  /**
   * Ensure database is available
   */
  private ensureDatabase(): SQLiteDatabase {
    if (!this.db) {
      try {
        this.db = DatabaseManager.getInstance().getCacheDb();
      } catch (error) {
        Logger.logError(MODULE_NAME, error as Error, 'Failed to get cache database');
        throw new Error('Cache database not initialized');
      }
    }
    return this.db;
  }

  /**
   * Store a response in the cache
   */
  public async storeResponse(
    key: string, 
    data: string, 
    timestamp: number, 
    expiresAt: number, 
    ttl: number
  ): Promise<void> {
    try {
      const db = this.ensureDatabase();
      Logger.debug(MODULE_NAME, `Storing cache entry with key: ${key}`);
      
      // Validate data before storing
      if (!data) {
        Logger.error(MODULE_NAME, `Cannot store null or empty data for key: ${key}`);
        throw new Error('Cannot store null or empty data in cache');
      }
      
      const now = Date.now();
      
      await db.getAllAsync(`
        INSERT OR REPLACE INTO ai_response_cache (
          key, 
          data, 
          timestamp, 
          expires_at, 
          ttl, 
          hit_count, 
          last_accessed
        ) VALUES (?, ?, ?, ?, ?, ?, ?)
      `, [key, data, timestamp, expiresAt, ttl, 0, now]);
      
      Logger.debug(MODULE_NAME, `Cache entry stored successfully: ${key}`);
    } catch (error) {
      Logger.logError(MODULE_NAME, error as Error, `Failed to store cache entry: ${key}`);
      throw error;
    }
  }

  /**
   * Get a response from the cache by key
   */
  public async getResponse(key: string): Promise<CacheDbEntry | null> {
    try {
      const db = this.ensureDatabase();
      Logger.debug(MODULE_NAME, `Getting cache entry with key: ${key}`);
      
      const results = await db.getAllAsync<CacheDbEntry>(`
        SELECT * FROM ai_response_cache WHERE key = ?
      `, [key]);
      
      if (results.length === 0) {
        Logger.debug(MODULE_NAME, `No cache entry found for key: ${key}`);
        return null;
      }
      
      Logger.debug(MODULE_NAME, `Cache entry found for key: ${key}`);
      return results[0];
    } catch (error) {
      Logger.logError(MODULE_NAME, error as Error, `Failed to get cache entry: ${key}`);
      throw error;
    }
  }

  /**
   * Update cache entry statistics
   */
  public async updateStats(key: string, hitCount: number, lastAccessed: number): Promise<void> {
    try {
      const db = this.ensureDatabase();
      Logger.debug(MODULE_NAME, `Updating stats for cache entry: ${key}`);
      
      await db.getAllAsync(`
        UPDATE ai_response_cache 
        SET hit_count = ?, last_accessed = ? 
        WHERE key = ?
      `, [hitCount, lastAccessed, key]);
      
      Logger.debug(MODULE_NAME, `Stats updated for cache entry: ${key}`);
    } catch (error) {
      Logger.logError(MODULE_NAME, error as Error, `Failed to update stats for cache entry: ${key}`);
      throw error;
    }
  }

  /**
   * Delete a cache entry by key
   */
  public async deleteEntry(key: string): Promise<void> {
    try {
      const db = this.ensureDatabase();
      Logger.debug(MODULE_NAME, `Deleting cache entry: ${key}`);
      
      await db.getAllAsync(`
        DELETE FROM ai_response_cache WHERE key = ?
      `, [key]);
      
      Logger.debug(MODULE_NAME, `Cache entry deleted: ${key}`);
    } catch (error) {
      Logger.logError(MODULE_NAME, error as Error, `Failed to delete cache entry: ${key}`);
      throw error;
    }
  }

  /**
   * Delete cache entries by pattern
   */
  public async deleteByPattern(pattern: string): Promise<number> {
    try {
      const db = this.ensureDatabase();
      Logger.debug(MODULE_NAME, `Deleting cache entries by pattern: ${pattern}`);
      
      // First get the keys that match the pattern
      const keys = await db.getAllAsync<KeyEntry>(`
        SELECT key FROM ai_response_cache WHERE key LIKE ?
      `, [`%${pattern}%`]);
      
      if (keys.length === 0) {
        Logger.debug(MODULE_NAME, `No cache entries found matching pattern: ${pattern}`);
        return 0;
      }
      
      // Delete the entries
      await db.getAllAsync(`
        DELETE FROM ai_response_cache WHERE key LIKE ?
      `, [`%${pattern}%`]);
      
      Logger.debug(MODULE_NAME, `Deleted ${keys.length} cache entries matching pattern: ${pattern}`);
      return keys.length;
    } catch (error) {
      Logger.logError(MODULE_NAME, error as Error, `Failed to delete cache entries by pattern: ${pattern}`);
      throw error;
    }
  }

  /**
   * Clear all cache entries
   */
  public async clearAll(): Promise<void> {
    try {
      const db = this.ensureDatabase();
      Logger.debug(MODULE_NAME, 'Clearing all cache entries');
      
      await db.getAllAsync(`DELETE FROM ai_response_cache`);
      
      Logger.debug(MODULE_NAME, 'All cache entries cleared');
    } catch (error) {
      Logger.logError(MODULE_NAME, error as Error, 'Failed to clear all cache entries');
      throw error;
    }
  }

  /**
   * Get the total number of cache entries
   */
  public async getCount(): Promise<number> {
    try {
      const db = this.ensureDatabase();
      Logger.debug(MODULE_NAME, 'Getting cache entry count');
      
      const result = await db.getAllAsync<CountResult>(`
        SELECT COUNT(*) as count FROM ai_response_cache
      `);
      
      Logger.debug(MODULE_NAME, `Cache entry count: ${result[0].count}`);
      return result[0].count;
    } catch (error) {
      Logger.logError(MODULE_NAME, error as Error, 'Failed to get cache entry count');
      throw error;
    }
  }

  /**
   * Delete expired cache entries
   */
  public async deleteExpired(): Promise<number> {
    try {
      const db = this.ensureDatabase();
      Logger.debug(MODULE_NAME, 'Deleting expired cache entries');
      
      const now = Date.now();
      
      // First get the keys that are expired
      const keys = await db.getAllAsync<KeyEntry>(`
        SELECT key FROM ai_response_cache WHERE expires_at < ?
      `, [now]);
      
      if (keys.length === 0) {
        Logger.debug(MODULE_NAME, 'No expired cache entries found');
        return 0;
      }
      
      // Delete the expired entries
      await db.getAllAsync(`
        DELETE FROM ai_response_cache WHERE expires_at < ?
      `, [now]);
      
      Logger.debug(MODULE_NAME, `Deleted ${keys.length} expired cache entries`);
      return keys.length;
    } catch (error) {
      Logger.logError(MODULE_NAME, error as Error, 'Failed to delete expired cache entries');
      throw error;
    }
  }

  /**
   * Get the least recently used cache entries
   */
  public async getLeastRecentlyUsed(limit: number): Promise<KeyEntry[]> {
    try {
      const db = this.ensureDatabase();
      Logger.debug(MODULE_NAME, `Getting ${limit} least recently used cache entries`);
      
      const keys = await db.getAllAsync<KeyEntry>(`
        SELECT key FROM ai_response_cache 
        ORDER BY last_accessed ASC 
        LIMIT ?
      `, [limit]);
      
      Logger.debug(MODULE_NAME, `Found ${keys.length} least recently used cache entries`);
      return keys;
    } catch (error) {
      Logger.logError(MODULE_NAME, error as Error, 'Failed to get least recently used cache entries');
      throw error;
    }
  }

  /**
   * Get the most frequently used cache entries
   */
  public async getMostFrequentlyUsed(limit: number): Promise<CacheDbEntry[]> {
    try {
      const db = this.ensureDatabase();
      Logger.debug(MODULE_NAME, `Getting ${limit} most frequently used cache entries`);
      
      const entries = await db.getAllAsync<CacheDbEntry>(`
        SELECT * FROM ai_response_cache 
        ORDER BY hit_count DESC 
        LIMIT ?
      `, [limit]);
      
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
  public async getKeysForUser(userId: string): Promise<KeyEntry[]> {
    try {
      const db = this.ensureDatabase();
      Logger.debug(MODULE_NAME, `Getting cache keys for user: ${userId}`);
      
      const keys = await db.getAllAsync<KeyEntry>(`
        SELECT key FROM ai_response_cache 
        WHERE key LIKE ?
      `, [`%user:${userId}%`]);
      
      Logger.debug(MODULE_NAME, `Found ${keys.length} cache keys for user: ${userId}`);
      return keys;
    } catch (error) {
      Logger.logError(MODULE_NAME, error as Error, `Failed to get cache keys for user: ${userId}`);
      throw error;
    }
  }
} 