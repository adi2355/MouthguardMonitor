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
import { getWeeklyStatsQuery, getMonthlyStatsQuery, getTimeDistributionQuery, getUsageStatsQuery, getDateRangeFilter } from "./utils/SqlTemplates";

// Export constants for use by other modules
export const DB_VERSION_KEY = "dbVersion";
export const CURRENT_DB_VERSION = 1; // Keeping at version 1 since there's no v2 migration
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
 * Helper function to format weekly stats results
 */
function formatWeeklyResults(results: any[]): any[] {
  // Format results for day names
  const dayMapping: { [key: string]: string } = {
    '0': 'Sun', '1': 'Mon', '2': 'Tue', '3': 'Wed', 
    '4': 'Thu', '5': 'Fri', '6': 'Sat'
  };
  
  // If no results, return zero values for each day
  if (!results || results.length === 0) {
    console.log('[DatabaseManager] No weekly data found, returning zeros');
    return [
      { label: 'Sun', value: 0 },
      { label: 'Mon', value: 0 },
      { label: 'Tue', value: 0 },
      { label: 'Wed', value: 0 },
      { label: 'Thu', value: 0 },
      { label: 'Fri', value: 0 },
      { label: 'Sat', value: 0 }
    ];
  }
  
  console.log('[DatabaseManager] Formatting weekly data:', JSON.stringify(results));
  
  // Convert the results to the expected format
  const formattedResults = results.map((row: any) => ({
    label: dayMapping[row.day_of_week] || 'Unknown',
    value: row.count || 0,
    // Include the original day number for sorting
    dayNumber: parseInt(row.day_of_week, 10)
  }));
  
  // Make sure all days are represented
  const dayValues = Object.keys(dayMapping).sort().map(day => dayMapping[day]);
  const dataByDay = new Map(formattedResults.map(item => [item.label, item]));
  
  // Create array with all days in order, using values from results when available
  const orderedData = dayValues.map(day => 
    dataByDay.get(day) || { label: day, value: 0 }
  );
  
  return orderedData;
}

/**
 * Helper function to format monthly stats results
 */
function formatMonthlyResults(results: any[]): any[] {
  // Month name mapping
  const monthMapping: { [key: string]: string } = {
    '01': 'Jan', '02': 'Feb', '03': 'Mar', '04': 'Apr', 
    '05': 'May', '06': 'Jun', '07': 'Jul', '08': 'Aug',
    '09': 'Sep', '10': 'Oct', '11': 'Nov', '12': 'Dec',
    // Add single-digit versions for robustness
    '1': 'Jan', '2': 'Feb', '3': 'Mar', '4': 'Apr',
    '5': 'May', '6': 'Jun', '7': 'Jul', '8': 'Aug',
    '9': 'Sep'
  };
  
  // If no results, return zero values for each month
  if (!results || results.length === 0) {
    console.log('[DatabaseManager] No monthly data found, returning zeros');
    return Object.entries(monthMapping)
      .filter(([key]) => key.length === 2) // Only use the two-digit keys 
      .map(([_, month]) => ({
        label: month,
        value: 0
      }));
  }
  
  console.log('[DatabaseManager] Formatting monthly data:', JSON.stringify(results));
  
  // Convert the results to the expected format
  const formattedResults = results.map((row: any) => {
    // Ensure month is properly padded with leading zero if needed
    const monthKey = row.month?.length === 1 ? `0${row.month}` : row.month;
    return {
      label: monthMapping[monthKey] || 'Unknown',
      value: row.count || 0,
      // Store numeric month for sorting
      monthNum: parseInt(row.month, 10)
    };
  });
  
  // Make sure all months are represented (use two-digit keys)
  const monthValues = Object.entries(monthMapping)
    .filter(([key]) => key.length === 2)
    .map(([_, label]) => label);
  
  const dataByMonth = new Map(formattedResults.map(item => [item.label, item]));
  
  // Create array with all months, using values from results when available
  return monthValues.map(month => 
    dataByMonth.get(month) || { label: month, value: 0 }
  );
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
      
      // Set WAL mode immediately after opening, BEFORE any transactions start
      try {
        await db.execAsync('PRAGMA journal_mode = WAL;');
        console.log(`[DatabaseManager] Set journal mode to WAL for ${dbName}`);
      } catch (walError) {
        // WAL mode might fail in some specific scenarios (e.g., certain file systems)
        // Log the error but don't necessarily fail the connection
        console.warn(`[DatabaseManager] Failed to set WAL mode for ${dbName}:`, walError);
      }
      
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
   * @param startDate Optional ISO date string for the start of the date range 
   * @param endDate Optional ISO date string for the end of the date range
   */
  public async getWeeklyStats(startDate?: string, endDate?: string) {
    try {
      await this.ensureInitialized();
      const db = await this.getDatabase(BONG_HITS_DATABASE_NAME);
      
      console.log(`[DatabaseManager] Fetching weekly stats from ${startDate || 'all'} to ${endDate || 'now'}`);
      
      // Use the SQL template with date filtering
      const templateQuery = getWeeklyStatsQuery(BONG_HITS_DATABASE_NAME);
      const { clause, params } = getDateRangeFilter(startDate, endDate);
      const finalQuery = templateQuery.replace('-- DATE FILTER ADDED EXTERNALLY', clause);
      
      console.log(`[DatabaseManager] Weekly Stats Query: ${finalQuery}, Params: ${JSON.stringify(params)}`);
      const results = await db.getAllAsync(finalQuery, params);
      
      // Process the results to get the proper format for charts
      const formattedResults = formatWeeklyResults(results);
      
      console.log(`[DatabaseManager] Formatting weekly data: ${JSON.stringify(results)} -> Formatted: ${JSON.stringify(formattedResults)}`);
      
      return {
        success: true,
        data: formattedResults
      };
    } catch (error) {
      console.error('[DatabaseManager] Error getting weekly stats:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        data: null
      };
    }
  }

  /**
   * Gets monthly stats for data visualization
   * @param startDate Optional ISO date string for the start of the date range 
   * @param endDate Optional ISO date string for the end of the date range
   */
  public async getMonthlyStats(startDate?: string, endDate?: string) {
    try {
      await this.ensureInitialized();
      const db = await this.getDatabase(BONG_HITS_DATABASE_NAME);
      
      console.log(`[DatabaseManager] Fetching monthly stats from ${startDate || 'all'} to ${endDate || 'now'}`);
      
      // Use the SQL template with date filtering
      const templateQuery = getMonthlyStatsQuery(BONG_HITS_DATABASE_NAME);
      const { clause, params } = getDateRangeFilter(startDate, endDate);
      const finalQuery = templateQuery.replace('-- DATE FILTER ADDED EXTERNALLY', clause);
      
      console.log(`[DatabaseManager] Monthly Stats Query: ${finalQuery}, Params: ${JSON.stringify(params)}`);
      const results = await db.getAllAsync(finalQuery, params);
      
      // Format the results for the UI
      const formattedResults = formatMonthlyResults(results);
      
      console.log(`[DatabaseManager] Formatting monthly data: ${JSON.stringify(results)} -> Formatted: ${JSON.stringify(formattedResults)}`);
      
      return {
        success: true,
        data: formattedResults
      };
    } catch (error) {
      console.error('[DatabaseManager] Error getting monthly stats:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        data: null
      };
    }
  }

  /**
   * Gets usage statistics with date range filtering
   * @param startDate Optional ISO date string for the start of the date range 
   * @param endDate Optional ISO date string for the end of the date range
   */
  public async getUsageStats(startDate?: string, endDate?: string) {
    try {
      await this.ensureInitialized();
      const db = await this.getDatabase(BONG_HITS_DATABASE_NAME);
      
      console.log(`[DatabaseManager] Fetching usage stats from ${startDate || 'all'} to ${endDate || 'now'}`);
      
      // Get usage statistics with date range
      const templateQuery = getUsageStatsQuery(BONG_HITS_DATABASE_NAME);
      const { clause, params } = getDateRangeFilter(startDate, endDate);
      const finalQuery = templateQuery.replace('-- DATE FILTER ADDED EXTERNALLY', clause);
      
      console.log(`[DatabaseManager] Usage Stats Query: ${finalQuery}, Params: ${JSON.stringify(params)}`);
      
      // Define the expected type for better TypeScript support
      interface UsageStatsResult {
        total_hits: number;
        active_days: number;
        avg_hits_per_active_day: number;
        avg_duration_ms: number;
        total_duration_ms: number;
        max_hits_in_day: number;
        min_hits_in_day: number;
        longest_hit: number;
        shortest_hit: number;
        most_active_hour: number;
        least_active_hour: number;
      }
      
      // Use type assertion to handle the database result
      const usageStats = await db.getFirstAsync(finalQuery, params) as UsageStatsResult | null;
      
      // No need to check for results - if the query returns no rows, we'll get empty data
      if (!usageStats) {
        return {
          success: true,
          data: {
            totalHits: 0,
            averageHitsPerDay: 0,
            peakDayHits: 0,
            lowestDayHits: 0,
            averageDuration: 0,
            totalDuration: 0,
            longestHit: 0,
            shortestHit: 0,
            mostActiveHour: 0,
            leastActiveHour: 0,
            averageHitsPerHour: 0,
            weekdayStats: null,
            consistency: 0
          }
        };
      }
      
      // Get weekday vs weekend stats with the same date range
      const weekdayStats = await this.getWeekdayStats(db, startDate, endDate);
      
      // Format the results
      const formattedResults = {
        totalHits: usageStats.total_hits || 0,
        averageHitsPerDay: usageStats.avg_hits_per_active_day || 0,
        peakDayHits: usageStats.max_hits_in_day || 0,
        lowestDayHits: usageStats.min_hits_in_day || 0, // Updated to use min_hits_in_day
        averageDuration: usageStats.avg_duration_ms || 0,
        totalDuration: usageStats.total_duration_ms || 0,
        longestHit: usageStats.longest_hit || 0, // Updated to use longest_hit
        shortestHit: usageStats.shortest_hit || 0, // Updated to use shortest_hit
        mostActiveHour: usageStats.most_active_hour || 0, // Updated to use most_active_hour
        leastActiveHour: usageStats.least_active_hour || 0, // Updated to use least_active_hour
        averageHitsPerHour: 0, // Not calculated in the query
        weekdayStats: weekdayStats,
        consistency: 0 // This needs to be calculated
      };
      
      console.log(`[DatabaseManager] Usage Stats Result: ${JSON.stringify(usageStats)} -> Formatted: ${JSON.stringify(formattedResults)}`);
      
      return {
        success: true,
        data: formattedResults
      };
    } catch (error) {
      console.error('[DatabaseManager] Error getting usage stats:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        data: null
      };
    }
  }

  /**
   * Gets weekday vs weekend statistics
   */
  private async getWeekdayStats(db: SQLiteDatabase, startDate?: string, endDate?: string) {
    // Create SQL with date filtering
    const { clause, params } = getDateRangeFilter(startDate, endDate);
    
    const query = `
      WITH NormalizedData AS (
        SELECT
          strftime('%w', timestamp, 'utc') as weekday,
          strftime('%Y-%m-%d', timestamp, 'utc') as date_str
        FROM ${BONG_HITS_DATABASE_NAME}
        ${clause}
      )
      SELECT
        SUM(CASE WHEN weekday IN ('1','2','3','4','5') THEN 1 ELSE 0 END) as weekday_hits,
        SUM(CASE WHEN weekday IN ('0','6') THEN 1 ELSE 0 END) as weekend_hits,
        COUNT(DISTINCT CASE WHEN weekday IN ('1','2','3','4','5') 
          THEN date_str END) as weekday_days,
        COUNT(DISTINCT CASE WHEN weekday IN ('0','6') 
          THEN date_str END) as weekend_days
      FROM NormalizedData
    `;
    
    try {
      console.log(`[DatabaseManager] Weekday Stats Query: ${query}, Params: ${JSON.stringify(params)}`);
      
      // Define type for better TypeScript support
      interface WeekdayStatsResult {
        weekday_hits: number;
        weekend_hits: number;
        weekday_days: number;
        weekend_days: number;
      }
      
      // Use type assertion to handle the database result
      const result = await db.getFirstAsync(query, params) as WeekdayStatsResult | null;
      
      if (!result) {
        return {
          weekday: { total: 0, avg: 0 },
          weekend: { total: 0, avg: 0 }
        };
      }
      
      const weekdayAvg = result.weekday_days > 0 ? result.weekday_hits / result.weekday_days : 0;
      const weekendAvg = result.weekend_days > 0 ? result.weekend_hits / result.weekend_days : 0;
      
      return {
        weekday: { total: result.weekday_hits || 0, avg: weekdayAvg },
        weekend: { total: result.weekend_hits || 0, avg: weekendAvg }
      };
    } catch (error) {
      console.error('[DatabaseManager] Error getting weekday stats:', error);
      return {
        weekday: { total: 0, avg: 0 },
        weekend: { total: 0, avg: 0 }
      };
    }
  }

  /**
   * Gets time distribution statistics based on date range
   * @param startDate Optional ISO date string for the start of the date range 
   * @param endDate Optional ISO date string for the end of the date range
   */
  public async getTimeDistribution(startDate?: string, endDate?: string) {
    try {
      await this.ensureInitialized();
      const db = await this.getDatabase(BONG_HITS_DATABASE_NAME);
      
      console.log(`[DatabaseManager] Fetching time distribution from ${startDate || 'all'} to ${endDate || 'now'}`);
      
      // Use the SQL template with date filtering
      const templateQuery = getTimeDistributionQuery(BONG_HITS_DATABASE_NAME);
      const { clause, params } = getDateRangeFilter(startDate, endDate);
      const finalQuery = templateQuery.replace('-- DATE FILTER ADDED EXTERNALLY', clause);
      
      console.log(`[DatabaseManager] Time Distribution Query: ${finalQuery}, Params: ${JSON.stringify(params)}`);
      
      // Define the expected result type
      interface TimeDistributionResult {
        morning: number;
        afternoon: number;
        evening: number;
        night: number;
      }
      
      const result = await db.getFirstAsync(finalQuery, params) as TimeDistributionResult | null;
      
      console.log(`[DatabaseManager] Time Distribution Result: ${JSON.stringify(result)}`);
      
      // If no data, return zeros
      if (!result) {
        return {
          success: true,
          data: {
            morning: 0,
            afternoon: 0, 
            evening: 0,
            night: 0
          }
        };
      }
      
      return {
        success: true,
        data: {
          morning: result.morning || 0,
          afternoon: result.afternoon || 0,
          evening: result.evening || 0,
          night: result.night || 0
        }
      };
    } catch (error) {
      console.error('[DatabaseManager] Error getting time distribution:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        data: null
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
      
      const results = await db.getAllAsync(`
        SELECT 
          timestamp,
          duration_ms
        FROM ${BONG_HITS_DATABASE_NAME}
        ORDER BY timestamp DESC
      `);
      
      return {
        success: true,
        data: results
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
          strain.genetic_type.includes(filters.geneticType!)
        );
      }
      
      // Apply effects filter if provided - using AND logic
      if (filters.effects && filters.effects.length > 0) {
        filteredStrains = filteredStrains.filter(strain => {
          if (!strain.effects) return false;
          // Check if ALL of the filter effects are included in the strain effects
          return filters.effects!.every((effect: string) => 
            strain.effects.toLowerCase().includes(effect.toLowerCase())
          );
        });
      }
      
      // Apply sort - default is rating in descending order
      filteredStrains.sort((a, b) => b.combined_rating - a.combined_rating); // Default sort
      
      if (filters.sort) {
        switch(filters.sort) {
          case 'name':
            filteredStrains.sort((a, b) => a.name.localeCompare(b.name));
            break;
          case 'thc':
            filteredStrains.sort((a, b) => b.thc_rating - a.thc_rating);
            break;
          // 'rating' is already handled by default above
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
      
      // Count strains by genetic type
      const indicaCount = SAMPLE_STRAINS.filter(strain => 
        strain.genetic_type.includes('Indica')).length;
      
      const sativaCount = SAMPLE_STRAINS.filter(strain => 
        strain.genetic_type.includes('Sativa')).length;
      
      const hybridCount = SAMPLE_STRAINS.filter(strain => 
        strain.genetic_type.includes('Hybrid')).length;
      
      const total = SAMPLE_STRAINS.length;
      
      return {
        'Sativa': sativaCount,
        'Indica': indicaCount,
        'Hybrid': hybridCount,
        'Total': total
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