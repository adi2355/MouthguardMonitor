import * as Logger from '../utils/logging';
import { MemoryCache } from './MemoryCache';
import { PersistentCache } from './PersistentCache';
import { SHA256 } from '../utils/hash';
import { DEFAULT_CACHE_TTL, MAX_CACHE_SIZE, CacheDbEntry } from '../types/common';

const MODULE_NAME = 'CacheManager';

/**
 * Cache Manager
 * Orchestrates both memory and persistent caches
 */
export class CacheManager {
  private static instance: CacheManager;
  private memoryCache: MemoryCache;
  private persistentCache: PersistentCache;
  private enabled: boolean = true;
  private defaultTtl: number = DEFAULT_CACHE_TTL;
  private initialized: boolean = false;

  private constructor() {
    this.memoryCache = new MemoryCache(MAX_CACHE_SIZE);
    this.persistentCache = new PersistentCache();
    Logger.debug(MODULE_NAME, 'Initialized');
  }

  /**
   * Get the singleton instance of CacheManager
   */
  public static getInstance(): CacheManager {
    if (!CacheManager.instance) {
      CacheManager.instance = new CacheManager();
    }
    return CacheManager.instance;
  }

  /**
   * Initialize the cache manager
   */
  public async initialize(): Promise<void> {
    if (this.initialized) {
      Logger.debug(MODULE_NAME, 'Already initialized');
      return;
    }

    try {
      Logger.info(MODULE_NAME, 'Initializing cache manager');
      
      // Load frequently accessed entries into memory cache
      await this.loadFrequentEntries();
      
      // Delete expired entries
      await this.pruneCache();
      
      this.initialized = true;
      Logger.info(MODULE_NAME, 'Cache manager initialized successfully');
    } catch (error) {
      Logger.logError(MODULE_NAME, error as Error, 'Failed to initialize cache manager');
      throw error;
    }
  }

  /**
   * Configure the cache
   */
  public configure(enabled: boolean, ttlMs: number = DEFAULT_CACHE_TTL, maxSize: number = MAX_CACHE_SIZE): void {
    this.enabled = enabled;
    this.defaultTtl = ttlMs;
    this.memoryCache.setMaxSize(maxSize);
    
    Logger.info(MODULE_NAME, `Cache configured: enabled=${enabled}, ttl=${ttlMs}ms, maxSize=${maxSize}`);
  }

  /**
   * Generate a cache key from request data
   */
  public generateKey(requestData: any): string {
    try {
      // Create a stable representation of the request data
      const stableRepresentation = this.createStableRepresentation(requestData);
      
      // Generate a hash of the stable representation
      const hash = SHA256(stableRepresentation);
      
      // Extract user ID if available for easier cache invalidation
      let userId = '';
      if (requestData.userProfile && requestData.userProfile.id) {
        userId = requestData.userProfile.id;
      } else if (requestData.userId) {
        userId = requestData.userId;
      }
      
      // Create a key with user ID prefix for easier user-specific cache invalidation
      const key = userId ? `user:${userId}:${hash}` : hash;
      
      Logger.debug(MODULE_NAME, `Generated cache key: ${key}`);
      return key;
    } catch (error) {
      Logger.logError(MODULE_NAME, error as Error, 'Failed to generate cache key');
      // Return a timestamp-based key as fallback
      return `fallback:${Date.now()}`;
    }
  }

  /**
   * Create a stable representation of an object
   * Ensures that the same object always produces the same string
   * regardless of property order
   */
  private createStableRepresentation(obj: any): string {
    if (obj === null || obj === undefined) {
      return '';
    }
    
    if (typeof obj !== 'object') {
      return String(obj);
    }
    
    if (Array.isArray(obj)) {
      return '[' + obj.map(item => this.createStableRepresentation(item)).join(',') + ']';
    }
    
    // Sort keys to ensure stable order
    const sortedKeys = Object.keys(obj).sort();
    
    return '{' + sortedKeys.map(key => {
      // Skip functions and undefined values
      if (typeof obj[key] === 'function' || obj[key] === undefined) {
        return '';
      }
      return `"${key}":${this.createStableRepresentation(obj[key])}`;
    }).filter(Boolean).join(',') + '}';
  }

  /**
   * Get a value from the cache
   */
  public async get<T>(key: string): Promise<T | null> {
    if (!this.enabled) {
      Logger.debug(MODULE_NAME, 'Cache is disabled, skipping get');
      return null;
    }
    
    try {
      // Check if initialized
      if (!this.initialized) {
        Logger.warn(MODULE_NAME, 'Cache not initialized, initializing now...');
        await this.initialize();
      }
      
      Logger.debug(MODULE_NAME, `Getting cache entry with key: ${key}`);
      
      // Try memory cache first
      const memoryEntry = this.memoryCache.get<T>(key);
      if (memoryEntry) {
        // Check if the entry is expired
        if (memoryEntry.expiresAt < Date.now()) {
          Logger.debug(MODULE_NAME, `Memory cache entry expired for key: ${key}`);
          this.memoryCache.delete(key);
          return null;
        }
        
        Logger.debug(MODULE_NAME, `Memory cache hit for key: ${key}`);
        return memoryEntry.data;
      }
      
      // Try persistent cache
      const persistentData = await this.persistentCache.get<T>(key);
      if (persistentData) {
        // Store in memory cache for faster access next time
        this.memoryCache.set(key, persistentData, this.defaultTtl);
        
        Logger.debug(MODULE_NAME, `Persistent cache hit for key: ${key}`);
        return persistentData;
      }
      
      Logger.debug(MODULE_NAME, `Cache miss for key: ${key}`);
      return null;
    } catch (error) {
      Logger.logError(MODULE_NAME, error as Error, `Failed to get cache entry: ${key}`);
      return null;
    }
  }

  /**
   * Set a value in the cache
   */
  public async set<T>(key: string, data: T, ttl: number = this.defaultTtl): Promise<void> {
    if (!this.enabled) {
      Logger.debug(MODULE_NAME, 'Cache is disabled, skipping set');
      return;
    }
    
    if (data === null || data === undefined) {
      Logger.error(MODULE_NAME, `Cannot cache null or undefined data for key: ${key}`);
      return;
    }
    
    try {
      // Check if initialized
      if (!this.initialized) {
        Logger.warn(MODULE_NAME, 'Cache not initialized, initializing now...');
        await this.initialize();
      }
      
      Logger.debug(MODULE_NAME, `Setting cache entry with key: ${key}`);
      
      // Store in memory cache
      this.memoryCache.set(key, data, ttl);
      
      // Store in persistent cache
      await this.persistentCache.set(key, data, ttl);
      
      Logger.debug(MODULE_NAME, `Cache entry set for key: ${key}`);
    } catch (error) {
      Logger.logError(MODULE_NAME, error as Error, `Failed to set cache entry: ${key}`);
      // If persistent cache fails, delete from memory cache to maintain consistency
      this.memoryCache.delete(key);
    }
  }

  /**
   * Delete a value from the cache
   */
  public async delete(key: string): Promise<void> {
    try {
      Logger.debug(MODULE_NAME, `Deleting cache entry: ${key}`);
      
      // Delete from memory cache
      this.memoryCache.delete(key);
      
      // Delete from persistent cache
      await this.persistentCache.delete(key);
      
      Logger.debug(MODULE_NAME, `Cache entry deleted: ${key}`);
    } catch (error) {
      Logger.logError(MODULE_NAME, error as Error, `Failed to delete cache entry: ${key}`);
    }
  }

  /**
   * Delete all cache entries that match a pattern
   */
  public async deleteByPattern(pattern: string): Promise<number> {
    try {
      Logger.debug(MODULE_NAME, `Deleting cache entries by pattern: ${pattern}`);
      
      // Delete from memory cache
      const memoryCount = this.memoryCache.deleteByPattern(pattern);
      
      // Delete from persistent cache
      const persistentCount = await this.persistentCache.deleteByPattern(pattern);
      
      Logger.debug(MODULE_NAME, `Deleted ${memoryCount} memory cache entries and ${persistentCount} persistent cache entries matching pattern: ${pattern}`);
      return Math.max(memoryCount, persistentCount);
    } catch (error) {
      Logger.logError(MODULE_NAME, error as Error, `Failed to delete cache entries by pattern: ${pattern}`);
      return 0;
    }
  }

  /**
   * Clear all cache entries
   */
  public async clear(): Promise<void> {
    try {
      Logger.debug(MODULE_NAME, 'Clearing all cache entries');
      
      // Clear memory cache
      this.memoryCache.clear();
      
      // Clear persistent cache
      await this.persistentCache.clear();
      
      Logger.debug(MODULE_NAME, 'All cache entries cleared');
    } catch (error) {
      Logger.logError(MODULE_NAME, error as Error, 'Failed to clear all cache entries');
    }
  }

  /**
   * Delete all cache entries for a specific user
   */
  public async deleteForUser(userId: string): Promise<number> {
    try {
      Logger.debug(MODULE_NAME, `Deleting cache entries for user: ${userId}`);
      
      // Delete from memory cache
      const memoryCount = this.memoryCache.deleteByPattern(`user:${userId}`);
      
      // Get all keys for the user from persistent cache
      const keys = await this.persistentCache.getKeysForUser(userId);
      
      // Delete each key from persistent cache
      for (const key of keys) {
        await this.persistentCache.delete(key);
      }
      
      Logger.debug(MODULE_NAME, `Deleted ${memoryCount} memory cache entries and ${keys.length} persistent cache entries for user: ${userId}`);
      return keys.length;
    } catch (error) {
      Logger.logError(MODULE_NAME, error as Error, `Failed to delete cache entries for user: ${userId}`);
      return 0;
    }
  }

  /**
   * Prune the cache by removing expired entries
   */
  public async pruneCache(): Promise<void> {
    try {
      Logger.debug(MODULE_NAME, 'Pruning cache');
      
      // Delete expired entries from memory cache
      const memoryCount = this.memoryCache.deleteExpired();
      
      // Delete expired entries from persistent cache
      const persistentCount = await this.persistentCache.deleteExpired();
      
      Logger.debug(MODULE_NAME, `Pruned ${memoryCount} memory cache entries and ${persistentCount} persistent cache entries`);
    } catch (error) {
      Logger.logError(MODULE_NAME, error as Error, 'Failed to prune cache');
    }
  }

  /**
   * Load frequently accessed entries into memory cache
   */
  private async loadFrequentEntries(limit: number = 20): Promise<void> {
    try {
      Logger.debug(MODULE_NAME, `Loading ${limit} most frequently accessed cache entries into memory`);
      
      // Get most frequently used entries from persistent cache
      const entries = await this.persistentCache.getMostFrequentlyUsed(limit);
      
      // Load each entry into memory cache
      for (const entry of entries) {
        try {
          const data = JSON.parse(entry.data);
          const ttl = entry.expires_at - Date.now();
          
          // Only load if not expired
          if (ttl > 0) {
            this.memoryCache.set(entry.key, data, ttl);
          }
        } catch (error) {
          Logger.logError(MODULE_NAME, error as Error, `Failed to parse data for key: ${entry.key}`);
        }
      }
      
      Logger.debug(MODULE_NAME, `Loaded ${entries.length} cache entries into memory`);
    } catch (error) {
      Logger.logError(MODULE_NAME, error as Error, 'Failed to load frequent cache entries');
    }
  }
} 