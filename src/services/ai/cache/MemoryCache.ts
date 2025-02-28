import * as Logger from '../utils/logging';
import { CacheEntry, MAX_CACHE_SIZE } from '../types/common';

const MODULE_NAME = 'MemoryCache';

/**
 * In-memory cache implementation
 * Provides fast access to frequently used cache entries
 */
export class MemoryCache {
  private cache: Map<string, CacheEntry<any>> = new Map();
  private maxSize: number;

  constructor(maxSize: number = MAX_CACHE_SIZE) {
    this.maxSize = maxSize;
    Logger.debug(MODULE_NAME, `Initialized with max size: ${maxSize}`);
  }

  /**
   * Set the maximum size of the cache
   */
  public setMaxSize(size: number): void {
    this.maxSize = size;
    Logger.debug(MODULE_NAME, `Max size updated to: ${size}`);
    
    // If the current size exceeds the new max size, prune the cache
    if (this.cache.size > this.maxSize) {
      this.prune();
    }
  }

  /**
   * Get the current size of the cache
   */
  public size(): number {
    return this.cache.size;
  }

  /**
   * Check if the cache contains an entry with the given key
   */
  public has(key: string): boolean {
    return this.cache.has(key);
  }

  /**
   * Get an entry from the cache
   */
  public get<T>(key: string): CacheEntry<T> | undefined {
    const entry = this.cache.get(key) as CacheEntry<T> | undefined;
    
    if (entry) {
      // Update hit count and last accessed time
      entry.hitCount += 1;
      entry.lastAccessed = Date.now();
      Logger.debug(MODULE_NAME, `Cache hit for key: ${key}, hit count: ${entry.hitCount}`);
    } else {
      Logger.debug(MODULE_NAME, `Cache miss for key: ${key}`);
    }
    
    return entry;
  }

  /**
   * Set an entry in the cache
   */
  public set<T>(key: string, data: T, ttl: number): void {
    const now = Date.now();
    const expiresAt = now + ttl;
    
    // Check if we need to make room in the cache
    if (!this.cache.has(key) && this.cache.size >= this.maxSize) {
      this.evictOne();
    }
    
    // Create or update the cache entry
    this.cache.set(key, {
      key,
      data,
      timestamp: now,
      expiresAt,
      ttl,
      hitCount: 0,
      lastAccessed: now
    });
    
    Logger.debug(MODULE_NAME, `Set cache entry for key: ${key}, expires at: ${new Date(expiresAt).toISOString()}`);
  }

  /**
   * Delete an entry from the cache
   */
  public delete(key: string): boolean {
    const result = this.cache.delete(key);
    Logger.debug(MODULE_NAME, `Deleted cache entry for key: ${key}, success: ${result}`);
    return result;
  }

  /**
   * Clear all entries from the cache
   */
  public clear(): void {
    this.cache.clear();
    Logger.debug(MODULE_NAME, 'Cleared all cache entries');
  }

  /**
   * Get all keys in the cache
   */
  public keys(): string[] {
    return Array.from(this.cache.keys());
  }

  /**
   * Get all entries in the cache
   */
  public entries<T>(): Array<[string, CacheEntry<T>]> {
    return Array.from(this.cache.entries()) as Array<[string, CacheEntry<T>]>;
  }

  /**
   * Delete all entries that match a pattern
   */
  public deleteByPattern(pattern: string): number {
    let count = 0;
    const regex = new RegExp(pattern);
    
    // Convert keys iterator to array before iterating
    const keys = Array.from(this.cache.keys());
    for (const key of keys) {
      if (regex.test(key)) {
        this.cache.delete(key);
        count++;
      }
    }
    
    Logger.debug(MODULE_NAME, `Deleted ${count} entries matching pattern: ${pattern}`);
    return count;
  }

  /**
   * Delete all expired entries
   */
  public deleteExpired(): number {
    let count = 0;
    const now = Date.now();
    
    // Convert entries iterator to array before iterating
    const entries = Array.from(this.cache.entries());
    for (const [key, entry] of entries) {
      if (entry.expiresAt <= now) {
        this.cache.delete(key);
        count++;
      }
    }
    
    Logger.debug(MODULE_NAME, `Deleted ${count} expired entries`);
    return count;
  }

  /**
   * Prune the cache to the maximum size
   */
  private prune(): void {
    if (this.cache.size <= this.maxSize) {
      return;
    }
    
    const entriesToRemove = this.cache.size - this.maxSize;
    Logger.debug(MODULE_NAME, `Pruning cache, removing ${entriesToRemove} entries`);
    
    // Sort entries by last accessed time (oldest first)
    const sortedEntries = Array.from(this.cache.entries())
      .sort((a, b) => a[1].lastAccessed - b[1].lastAccessed);
    
    // Remove the oldest entries
    for (let i = 0; i < entriesToRemove; i++) {
      this.cache.delete(sortedEntries[i][0]);
    }
  }

  /**
   * Evict one entry from the cache
   * Uses a combination of last accessed time and hit count to determine which entry to evict
   */
  private evictOne(): void {
    if (this.cache.size === 0) {
      return;
    }
    
    Logger.debug(MODULE_NAME, 'Evicting one entry from cache');
    
    // Sort entries by a score that combines last accessed time and hit count
    // Lower score = better candidate for eviction
    const now = Date.now();
    const sortedEntries = Array.from(this.cache.entries())
      .map(([key, entry]) => {
        // Calculate a score based on recency and popularity
        // More recent access and higher hit count = higher score = less likely to be evicted
        const recency = (now - entry.lastAccessed) / 1000; // seconds since last access
        const popularity = Math.log1p(entry.hitCount); // logarithmic scaling of hit count
        const score = popularity / recency; // higher hit count and more recent = higher score
        return { key, score };
      })
      .sort((a, b) => a.score - b.score); // sort by score (ascending)
    
    // Evict the entry with the lowest score
    const keyToEvict = sortedEntries[0].key;
    this.cache.delete(keyToEvict);
    Logger.debug(MODULE_NAME, `Evicted cache entry for key: ${keyToEvict}`);
  }
} 