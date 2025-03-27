// File: src/DatabaseManager.ts
// Refactored DatabaseManager that focuses on database connection management and migrations.

import AsyncStorage from "@react-native-async-storage/async-storage";
import { openDatabaseAsync, SQLiteDatabase } from "expo-sqlite";
import {
  BONG_HITS_DATABASE_NAME,
  STRAINS_DATABASE_NAME,
  SAMPLE_STRAINS
} from "./constants";
import { migrations } from "./migrations";

// Export constants for use by other modules
export const DB_VERSION_KEY = "dbVersion";
export const CURRENT_DB_VERSION = 1; // Increment this when schema changes
export const SAFETY_DB_NAME = "SafetyRecords";
export const ACHIEVEMENTS_DB_NAME = "achievements.db";

// Define the pagination parameters interface
export interface PaginationParams {
  page: number;
  limit: number;
}

// Define the strain search filters interface
export interface StrainSearchFilters {
  geneticType?: string;
  effects?: string[];
  sort?: 'rating' | 'name' | 'thc';
}

/**
 * DatabaseManager: Handles database connections and migrations
 */
export class DatabaseManager {
  private databaseConnections: Map<string, SQLiteDatabase> = new Map();
  private initialized: boolean = false;
  private initializationPromise: Promise<void> | null = null;
  private static instance: DatabaseManager;

  /**
   * Get the singleton instance of DatabaseManager
   */
  public static getInstance(): DatabaseManager {
    if (!DatabaseManager.instance) {
      DatabaseManager.instance = new DatabaseManager();
    }
    return DatabaseManager.instance;
  }

  /**
   * Constructor for DatabaseManager
   */
  public constructor() {}

  /**
   * Initializes all databases and manages migrations
   */
  public async initialize(options: { forceCleanup?: boolean } = {}): Promise<void> {
    // If forced cleanup is requested, close existing connections first
    if (options.forceCleanup) {
      await this.cleanup();
      this.initialized = false; // Reset initialized state after cleanup
    }

    // If already initialized, return immediately
    if (this.initialized) {
      return;
    }
    
    // If initialization is in progress, wait for it to complete
    if (this.initializationPromise) {
      return this.initializationPromise;
    }
    
    console.info('[DatabaseManager] Initializing databases...');
    
    // Create a promise for initialization
    this.initializationPromise = this.doInitialize().finally(() => {
      this.initializationPromise = null;
    });
    
    return this.initializationPromise;
  }

  /**
   * Internal method to perform actual initialization logic
   */
  private async doInitialize(): Promise<void> {
    try {
      console.log('[DatabaseManager] Starting database initialization...');
      
      // Get current DB version
      const storedVersion = parseInt(await AsyncStorage.getItem(DB_VERSION_KEY) || '0');
      
      // Check if we need to update/initialize
      if (storedVersion < CURRENT_DB_VERSION) {
        await this.runMigrations(storedVersion);
        
        // Update the stored version
        await AsyncStorage.setItem(DB_VERSION_KEY, CURRENT_DB_VERSION.toString());
        console.log(`[DatabaseManager] Database upgraded to version ${CURRENT_DB_VERSION}`);
      } else {
        console.log('[DatabaseManager] Database already at current version');
      }
      
      this.initialized = true;
      console.log('[DatabaseManager] Database initialization successful');
    } catch (error) {
      this.initialized = false; // Ensure state reflects failure
      console.error('[DatabaseManager] Error during database initialization:', error);
      throw error;
    }
  }

  /**
   * Run migrations from the current version to the latest version
   */
  private async runMigrations(currentVersion: number): Promise<void> {
    console.log('[DatabaseManager] Starting migrations from version', currentVersion);
    
    // Use a consistent DB for migration tracking
    const migrationTrackingDb = await this.getDatabase(BONG_HITS_DATABASE_NAME);

    await migrationTrackingDb.execAsync(
      `CREATE TABLE IF NOT EXISTS migrations (
        version INTEGER PRIMARY KEY,
        applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )`
    );
    
    const appliedMigrations = await migrationTrackingDb.getAllAsync<{ version: number }>(
      'SELECT version FROM migrations ORDER BY version ASC'
    );
    
    const appliedVersions = appliedMigrations.map(m => m.version);
    
    for (let v = currentVersion + 1; v <= CURRENT_DB_VERSION; v++) {
      if (appliedVersions.includes(v)) continue;

      console.log(`[DatabaseManager] Applying migration version ${v}`);
      try {
        await migrationTrackingDb.execAsync('BEGIN TRANSACTION');

        // Use the migration registry instead of dynamic require
        if (migrations[v] && typeof migrations[v].up === 'function') {
          await migrations[v].up(migrationTrackingDb);
        } else {
          throw new Error(`Migration script v${v} is invalid or missing 'up' function.`);
        }

        await migrationTrackingDb.runAsync('INSERT INTO migrations (version) VALUES (?)', [v]);
        await migrationTrackingDb.execAsync('COMMIT');
        console.log(`[DatabaseManager] Migration version ${v} applied successfully`);
      } catch (migrationError) {
        console.error(`[DatabaseManager] Migration version ${v} failed:`, migrationError);
        try { 
          await migrationTrackingDb.execAsync('ROLLBACK'); 
        } catch (rbError) { 
          console.error('Rollback failed:', rbError); 
        }
        throw migrationError; // Stop further migrations
      }
    }
    console.log('[DatabaseManager] All migrations applied successfully');
  }

  /**
   * Ensures the database manager has been initialized
   */
  public async ensureInitialized(): Promise<void> {
    if (this.initialized) {
      return;
    }
    if (this.initializationPromise) {
      return this.initializationPromise;
    }
    // Should ideally be called early in app lifecycle, but this handles lazy init
    console.warn('[DatabaseManager] ensureInitialized called before explicit initialization. Initializing now.');
    return this.initialize();
  }

  /**
   * Gets a database connection, opening it if necessary
   */
  public async getDatabase(dbName: string): Promise<SQLiteDatabase> {
    if (this.databaseConnections.has(dbName)) {
      const db = this.databaseConnections.get(dbName)!;
      // Basic check if connection might be closed
      try {
        await db.getFirstAsync('SELECT 1');
        return db;
      } catch (e) {
        console.warn(`[DatabaseManager] Connection test failed for ${dbName}, reopening.`);
        this.databaseConnections.delete(dbName);
      }
    }

    try {
      console.log(`[DatabaseManager] Opening database: ${dbName}`);
      const db = await openDatabaseAsync(dbName);
      this.databaseConnections.set(dbName, db);
      return db;
    } catch (error) {
      console.error(`[DatabaseManager] Error opening database ${dbName}:`, error);
      throw error;
    }
  }

  /**
   * Closes all open database connections
   */
  public async cleanup(): Promise<void> {
    console.log('[DatabaseManager] Closing all cached database connections...');
    const closePromises = Array.from(this.databaseConnections.entries())
      .map(async ([name, db]) => {
        try {
          await db.closeAsync();
          console.log(`[DatabaseManager] Closed database: ${name}`);
        } catch (closeError) {
          console.error(`[DatabaseManager] Error closing database ${name}:`, closeError);
        }
      });
    
    await Promise.all(closePromises);
    this.databaseConnections.clear();
    this.initialized = false;
    console.log('[DatabaseManager] All cached database connections closed.');
  }

  /**
   * Gets weekly stats for data visualization
   */
  public async getWeeklyStats() {
    try {
      await this.ensureInitialized();
      const db = await this.getDatabase(BONG_HITS_DATABASE_NAME);
      // Implement your weekly stats logic here
      // For now, returning mock data
      return {
        success: true,
        data: [
          { x: 'Sun', y: 0 },
          { x: 'Mon', y: 0 },
          { x: 'Tue', y: 0 },
          { x: 'Wed', y: 0 },
          { x: 'Thu', y: 0 },
          { x: 'Fri', y: 0 },
          { x: 'Sat', y: 0 }
        ]
      };
    } catch (error) {
      console.error('[DatabaseManager] Error getting weekly stats:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Gets monthly stats for data visualization
   */
  public async getMonthlyStats() {
    try {
      await this.ensureInitialized();
      const db = await this.getDatabase(BONG_HITS_DATABASE_NAME);
      // Implement your monthly stats logic here
      // For now, returning mock data
      return {
        success: true,
        data: Array.from({ length: 30 }, (_, i) => ({ 
          x: (i + 1).toString(), 
          y: 0 
        }))
      };
    } catch (error) {
      console.error('[DatabaseManager] Error getting monthly stats:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Gets usage statistics
   */
  public async getUsageStats() {
    try {
      await this.ensureInitialized();
      const db = await this.getDatabase(BONG_HITS_DATABASE_NAME);
      // Implement your usage stats logic here
      // For now, returning mock data
      return {
        success: true,
        data: {
          averageHitsPerDay: 0,
          totalHits: 0,
          peakDayHits: 0,
          lowestDayHits: 0,
          averageDuration: 0,
          longestHit: 0,
          shortestHit: 0,
          mostActiveHour: 0,
          leastActiveHour: 0,
          totalDuration: 0,
          averageHitsPerHour: 0,
          consistency: 0,
          weekdayStats: {
            weekday: { avg: 0, total: 0 },
            weekend: { avg: 0, total: 0 }
          }
        }
      };
    } catch (error) {
      console.error('[DatabaseManager] Error getting usage stats:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Gets time distribution data
   */
  public async getTimeDistribution() {
    try {
      await this.ensureInitialized();
      const db = await this.getDatabase(BONG_HITS_DATABASE_NAME);
      // Implement your time distribution logic here
      // For now, returning mock data
      return {
        success: true,
        data: {
          morning: 0,
          afternoon: 0,
          evening: 0,
          night: 0
        }
      };
    } catch (error) {
      console.error('[DatabaseManager] Error getting time distribution:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Gets all bong hit logs
   */
  public async getAllBongHitLogs() {
    try {
      await this.ensureInitialized();
      const db = await this.getDatabase(BONG_HITS_DATABASE_NAME);
      // Implement your bong hit logs retrieval logic here
      // For now, returning empty data
      return {
        success: true,
        data: []
      };
    } catch (error) {
      console.error('[DatabaseManager] Error getting bong hit logs:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Gets saved devices
   */
  public async getSavedDevices() {
    try {
      await this.ensureInitialized();
      // For now, returning empty data
      return {
        success: true,
        data: []
      };
    } catch (error) {
      console.error('[DatabaseManager] Error getting saved devices:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Gets popular strains
   */
  public async getPopularStrains() {
    try {
      await this.ensureInitialized();
      // Use the imported sample strains
      
      // Add IDs to the strains
      const popularStrains = SAMPLE_STRAINS.map((strain, index) => ({
        ...strain,
        id: index + 1 // Add sequential IDs starting from 1
      }));
      
      return popularStrains;
    } catch (error) {
      console.error('[DatabaseManager] Error getting popular strains:', error);
      return [];
    }
  }

  /**
   * Search strains based on criteria
   */
  public async searchStrains(
    query: string,
    filters: StrainSearchFilters = {},
    pagination: PaginationParams = { page: 1, limit: 10 }
  ) {
    try {
      await this.ensureInitialized();
      
      // Add IDs to the strains
      const strainsWithIds = SAMPLE_STRAINS.map((strain, index) => ({
        ...strain,
        id: index + 1
      }));
      
      // Filter by query if provided
      let filteredStrains = strainsWithIds;
      if (query) {
        const lowerQuery = query.toLowerCase();
        filteredStrains = filteredStrains.filter(strain => 
          strain.name.toLowerCase().includes(lowerQuery) || 
          strain.overview.toLowerCase().includes(lowerQuery)
        );
      }
      
      // Apply genetic type filter if specified
      if (filters.geneticType) {
        filteredStrains = filteredStrains.filter(strain => 
          strain.genetic_type === filters.geneticType
        );
      }
      
      // Apply effects filter if provided
      if (filters.effects && filters.effects.length > 0) {
        filteredStrains = filteredStrains.filter(strain => {
          if (!strain.effects) return false;
          // Check if any of the filter effects are included in the strain effects
          return filters.effects!.some((effect: string) => 
            strain.effects.toLowerCase().includes(effect.toLowerCase())
          );
        });
      }
      
      // Apply sort
      if (filters.sort) {
        switch(filters.sort) {
          case 'rating':
            filteredStrains.sort((a, b) => b.combined_rating - a.combined_rating);
            break;
          case 'name':
            filteredStrains.sort((a, b) => a.name.localeCompare(b.name));
            break;
          case 'thc':
            filteredStrains.sort((a, b) => b.thc_rating - a.thc_rating);
            break;
        }
      }
      
      // Calculate pagination
      const total = filteredStrains.length;
      const totalPages = Math.ceil(total / pagination.limit);
      const startIndex = (pagination.page - 1) * pagination.limit;
      const endIndex = startIndex + pagination.limit;
      const paginatedStrains = filteredStrains.slice(startIndex, endIndex);
      
      return {
        data: paginatedStrains,
        total,
        currentPage: pagination.page,
        totalPages,
        hasMore: pagination.page < totalPages
      };
      
    } catch (error) {
      console.error('[DatabaseManager] Error searching strains:', error);
      return {
        data: [],
        total: 0,
        currentPage: 1,
        totalPages: 0,
        hasMore: false
      };
    }
  }
  
  /**
   * Gets strain categories
   */
  public async getStrainCategories() {
    try {
      await this.ensureInitialized();
      
      return {
        'Sativa': 15,
        'Indica': 12,
        'Hybrid': 25,
        'Sativa-dominant Hybrid': 18,
        'Indica-dominant Hybrid': 14
      };
    } catch (error) {
      console.error('[DatabaseManager] Error getting strain categories:', error);
      return {};
    }
  }
  
  /**
   * Gets strain by ID
   */
  public async getStrainById(id: number) {
    try {
      await this.ensureInitialized();
      
      // Find the strain with the matching ID (arrays are 0-based but we use 1-based IDs)
      if (id > 0 && id <= SAMPLE_STRAINS.length) {
        return {
          ...SAMPLE_STRAINS[id - 1],
          id
        };
      }
      
      return null;
    } catch (error) {
      console.error('[DatabaseManager] Error getting strain by ID:', error);
      return null;
    }
  }
  
  /**
   * Gets related strains
   */
  public async getRelatedStrains(strain: any) {
    try {
      await this.ensureInitialized();
      
      // Get strains with the same genetic type
      const strainsWithIds = SAMPLE_STRAINS.map((s, index) => ({
        ...s,
        id: index + 1
      }));
      
      // Filter to get related strains (same genetic type, excluding the original strain)
      const relatedStrains = strainsWithIds.filter(s => 
        s.genetic_type === strain.genetic_type && 
        s.name !== strain.name
      );
      
      // Return the first few related strains
      return relatedStrains.slice(0, 3);
    } catch (error) {
      console.error('[DatabaseManager] Error getting related strains:', error);
      return [];
    }
  }

  /**
   * Validates a recommendation request for safety concerns
   * @param request The recommendation request to validate
   * @returns SafetyValidationResult indicating if the request is valid
   */
  public async validateRecommendationRequest(request: any): Promise<any> {
    try {
      await this.ensureInitialized();
      
      // Basic safety check - in a real implementation, this would check against a database
      // For now, we'll just return a valid result to allow the application to function
      return {
        valid: true,
        safetyFlags: [],
        warningLevel: 'info'
      };
    } catch (error) {
      console.error('[DatabaseManager] Error validating recommendation request:', error);
      // In case of error, return a valid result with a warning
      return {
        valid: true,
        safetyFlags: ['Safety validation could not be completed'],
        warningLevel: 'warning'
      };
    }
  }

  /**
   * Process a recommendation response for safety
   * @param response The raw recommendation response
   * @param userProfile The user profile
   * @param journalEntries Recent journal entries
   * @returns Processed recommendation response
   */
  public async processRecommendationResponse(response: any, userProfile: any, journalEntries: any[] = []): Promise<any> {
    try {
      await this.ensureInitialized();
      
      // In a real implementation, this would process the response through safety checks
      // For now, we'll just return the response as is
      return response;
    } catch (error) {
      console.error('[DatabaseManager] Error processing recommendation response:', error);
      return response;
    }
  }

  /**
   * Get safety history for a user
   * @param userId The user ID
   * @returns Array of safety records
   */
  public async getSafetyHistory(userId: string): Promise<any[]> {
    try {
      await this.ensureInitialized();
      
      // For now, return an empty array
      return [];
    } catch (error) {
      console.error('[DatabaseManager] Error getting safety history:', error);
      return [];
    }
  }
}

// Export a singleton instance
export const databaseManager = DatabaseManager.getInstance(); 