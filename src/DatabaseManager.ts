// File: src/DatabaseManager.ts
// Consolidated DatabaseManager that incorporates functionality from:
// - Previous DatabaseManager
// - AsyncStorageManager
// - DataService
// - StrainService
// - ExpoSQLiteManager
// - SafetyService
// - AchievementService

import AsyncStorage from "@react-native-async-storage/async-storage";
import { openDatabaseAsync, SQLiteDatabase } from "expo-sqlite";
import {
  BONG_HITS_DATABASE_NAME,
  STRAINS_DATABASE_NAME,
  SAMPLE_STRAINS,
  ACHIEVEMENTS,
  ACHIEVEMENT_ICONS,
  ACHIEVEMENT_TRIGGERS,
  getStrainInsertStatements
} from "./constants";
import { 
  BongHit,
  BongHitStats, 
  Datapoint, 
  AverageHourCount, 
  SavedDevice, 
  Strain,
  DatabaseResponse, 
  ChartDataPoint,
  UsageStats,
  TimeDistribution,
  DatabaseRow,
  StrainSearchFilters,
  PaginationParams,
  StrainSearchResult
} from "./types";
import { 
  Achievement, 
  UserAchievement, 
  UserAchievementWithDetails 
} from "./types";
import { Device } from 'react-native-ble-plx';
import { validateBongHit, validateStrain, createValidationError, createValidationSuccess, ValidationResult } from './utils/validators';
import { getWeeklyStatsQuery, getMonthlyStatsQuery, getTimeDistributionQuery, getUsageStatsQuery } from './utils/SqlTemplates';

// Re-export types for use throughout the app
export { StrainSearchFilters, PaginationParams, StrainSearchResult };

// Import types for SafetyService methods
import {
  RecommendationRequest,
  RecommendationResponse,
  SafetyValidationResult,
  DrugInteractionResult,
  OveruseDetectionResult,
  SafetyRecord,
  JournalEntry,
  UserProfile
} from "./types";

// Near the top of the file with other interfaces
interface RawUsageStats {
  total_hits: number;
  active_days: number;
  avg_hits_per_active_day: number;
  avg_hits_per_day: number;
  avg_duration_ms: number;
  total_duration_ms: number;
  max_hits_in_day: number;
  max_avg_duration: number;
  max_duration_in_day: number;
  most_active_day: string;
  least_active_day: string;
}

const FIRST_LAUNCH_KEY = "hasLaunched";
const SAVED_DEVICES_KEY: string = 'savedDevices';
const DB_VERSION_KEY = "dbVersion";
const CURRENT_DB_VERSION = 1; // Increment this when schema changes
const SAFETY_DB_NAME = "SafetyRecords"; // Define safety DB name here since it's not in constants
const ACHIEVEMENTS_DB_NAME = "achievements.db"; // Achievements database name
const USER_ACHIEVEMENTS_TABLE = "user_achievements"; // User achievements table name

// Map of days to their abbreviations
const dayLookUpTable = new Map<number, string>([
  [0, "Sun"],
  [1, "Mon"],
  [2, "Tue"],
  [3, "Wed"],
  [4, "Thu"],
  [5, "Fri"],
  [6, "Sat"],
]);

/**
 * DatabaseManager: Centralized manager for all database operations
 * Consolidates functionality from:
 * - Previous DatabaseManager
 * - AsyncStorageManager
 * - DataService
 * - StrainService
 * - ExpoSQLiteManager
 */
export class DatabaseManager {
  private static instance: DatabaseManager;
  private databaseConnections: Map<string, SQLiteDatabase> = new Map();
  private initialized: boolean = false;
  private initializationPromise: Promise<void> | null = null;
  private migrationLock: boolean = false;
  private transactionInProgress: Map<string, boolean> = new Map(); // Database-specific transaction locks
  private lastAccessTimes: Map<string, number> = new Map(); // Track last access time
  private connectionMonitoringInterval: NodeJS.Timeout | null = null; // Interval for monitoring connections
  private connectionTimeout = 5 * 60 * 1000; // 5 minutes timeout for idle connections

  // Private constructor to prevent direct instantiation
  private constructor() {}

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
   * Checks if the application is launching for the first time.
   */
  public async isFirstLaunch(): Promise<boolean> {
    try {
      return (await AsyncStorage.getItem(FIRST_LAUNCH_KEY)) === null;
    } catch (error) {
      console.error('[DatabaseManager] Error checking first launch:', error);
      return false;
    }
  }

  /**
   * Called on first launch to run any initial setup (e.g. DB creation).
   */
  public async initializeAppOnFirstLaunch(): Promise<void> {
    try {
      await this.initialize();
      await AsyncStorage.setItem(FIRST_LAUNCH_KEY, "true");
      await AsyncStorage.setItem(SAVED_DEVICES_KEY, JSON.stringify([]));
    } catch (error) {
      console.error('[DatabaseManager] Error initializing app:', error);
      throw error;
    }
  }

  /**
   * Initializes all databases and tables with initial data.
   */
  public async initialize(options: { forceCleanup?: boolean } = {}): Promise<void> {
    // If forced cleanup is requested, close existing connections first
    if (options.forceCleanup) {
      await this.cleanup();
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
    this.initializationPromise = this.doInitialize();
    
    return this.initializationPromise;
  }

  /**
   * Internal method to perform actual initialization logic
   */
  private async doInitialize(): Promise<void> {
    try {
      console.log('[DatabaseManager] Starting database initialization...');
      
      // Get current DB version
      const storedVersion = await AsyncStorage.getItem(DB_VERSION_KEY);
      const currentVersion = storedVersion ? parseInt(storedVersion) : 0;
      
      // Check if we need to update/initialize
      if (currentVersion < CURRENT_DB_VERSION) {
        await this.runMigrations(currentVersion);
        
        // Update the stored version
        await AsyncStorage.setItem(DB_VERSION_KEY, CURRENT_DB_VERSION.toString());
        console.log(`[DatabaseManager] Database upgraded to version ${CURRENT_DB_VERSION}`);
      } else {
        console.log('[DatabaseManager] Database already at current version');
      }

      // Existing database initialization logic here
      
      this.initialized = true;
      console.log('[DatabaseManager] All databases initialized successfully');
    } catch (error) {
      console.error('[DatabaseManager] Error initializing database:', error);
      throw error;
    } finally {
      // Clean up the promise so subsequent calls will start fresh if needed
      this.initializationPromise = null;
    }
  }

  /**
   * Run migrations from the current version to the latest version
   */
  private async runMigrations(currentVersion: number): Promise<void> {
    if (this.migrationLock) {
      console.log('[DatabaseManager] Migration already in progress, waiting...');
      return;
    }
    
    this.migrationLock = true;
    try {
      console.log('[DatabaseManager] Starting migrations from version', currentVersion);
      
      // Get the database for migrations
      const db = await this.getDatabase('migrations.db');
      
      // Set up the migrations table if it doesn't exist
      await db.execAsync(
        `CREATE TABLE IF NOT EXISTS migrations (
          version INTEGER PRIMARY KEY,
          applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )`
      );
      
      // Get the list of applied migrations
      const appliedMigrations = await db.getAllAsync<{version: number}>(
        'SELECT version FROM migrations ORDER BY version ASC'
      );
      
      const appliedVersions = appliedMigrations.map(m => m.version);
      
      // Apply migrations in sequence
      for (let v = currentVersion + 1; v <= CURRENT_DB_VERSION; v++) {
        if (appliedVersions.includes(v)) {
          console.log(`[DatabaseManager] Migration version ${v} already applied, skipping`);
          continue;
        }
        
        console.log(`[DatabaseManager] Applying migration version ${v}`);
        
        // Start a transaction for the migration
        await this.executeTransaction(db, 'migrations.db', async () => {
          // Apply the migration
          await this.applyMigration(v);
          
          // Record the migration
          await db.runAsync(
            'INSERT INTO migrations (version) VALUES (?)',
            [v]
          );
        });
        
        console.log(`[DatabaseManager] Migration version ${v} applied successfully`);
      }
      
      console.log('[DatabaseManager] All migrations applied successfully');
    } catch (error) {
      console.error('[DatabaseManager] Migration failed:', error);
      throw error;
    } finally {
      this.migrationLock = false;
    }
  }

  /**
   * Validate database schemas to ensure they match expected structures
   */
  private async validateSchema(): Promise<boolean> {
    try {
      console.log('[DatabaseManager] Validating database schema...');
      
      // Validate BongHits table
      const bongHitsDb = await this.getDatabase(BONG_HITS_DATABASE_NAME);
      const bongHitsValid = await this.validateTableSchema(bongHitsDb, BONG_HITS_DATABASE_NAME, [
        'timestamp', 'duration_ms'
      ]);
      
      if (!bongHitsValid) {
        console.error('[DatabaseManager] BongHits table schema validation failed');
        return false;
      }
      
      // Validate Strains table
      const strainsDb = await this.getDatabase(STRAINS_DATABASE_NAME);
      const strainsValid = await this.validateTableSchema(strainsDb, STRAINS_DATABASE_NAME, [
        'id', 'name', 'genetic_type', 'effects', 'thc_rating', 'combined_rating'
      ]);
      
      if (!strainsValid) {
        console.error('[DatabaseManager] Strains table schema validation failed');
        return false;
      }
      
      console.log('[DatabaseManager] Database schema validation successful');
      return true;
    } catch (error) {
      console.error('[DatabaseManager] Schema validation error:', error);
      return false;
    }
  }

  /**
   * Apply a specific migration version
   */
  private async applyMigration(version: number): Promise<void> {
    switch (version) {
      case 1:
        // Initial schema creation
        await this.migrationV1();
        break;
      // Add future migrations here:
      // case 2:
      //   await this.migrationV2();
      //   break;
      default:
        console.warn(`[DatabaseManager] No migration found for version ${version}`);
    }
  }

  /**
   * Migration v1: Initialize all databases and tables
   */
  private async migrationV1(): Promise<void> {
    await this.initializeBongHitsDb();
    await this.initializeStrainsDb();
    await this.initializeSafetyDb();
    await this.initializeAchievementsDb();
  }

  /**
   * Initialize the BongHits database
   */
  private async initializeBongHitsDb(): Promise<void> {
    try {
      const db = await this.getDatabase(BONG_HITS_DATABASE_NAME);
      await db.execAsync(
        'PRAGMA journal_mode = WAL;' +
        `CREATE TABLE IF NOT EXISTS ${BONG_HITS_DATABASE_NAME} (
          timestamp TIMESTAMP PRIMARY KEY NOT NULL,
          duration_ms INTEGER NOT NULL
        );` +
        `CREATE INDEX IF NOT EXISTS idx_timestamp 
        ON ${BONG_HITS_DATABASE_NAME}(timestamp);`
      );
      console.log('[DatabaseManager] BongHits database initialized');
    } catch (error) {
      console.error('[DatabaseManager] Error initializing BongHits database:', error);
      throw error;
    }
  }

  /**
   * Initialize the Strains database
   */
  private async initializeStrainsDb(): Promise<void> {
    try {
      const db = await this.getDatabase(STRAINS_DATABASE_NAME);
      await db.execAsync(
        'PRAGMA journal_mode = WAL;' +
        `CREATE TABLE IF NOT EXISTS ${STRAINS_DATABASE_NAME} (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          name TEXT NOT NULL UNIQUE,
          overview TEXT,
          genetic_type TEXT,
          lineage TEXT,
          thc_range TEXT,
          cbd_level TEXT,
          dominant_terpenes TEXT,
          qualitative_insights TEXT,
          effects TEXT,
          negatives TEXT,
          uses TEXT,
          thc_rating REAL,
          user_rating REAL,
          combined_rating REAL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );` +
        `CREATE INDEX IF NOT EXISTS idx_strain_name 
        ON ${STRAINS_DATABASE_NAME}(name);` +
        `CREATE INDEX IF NOT EXISTS idx_strain_genetic_type 
        ON ${STRAINS_DATABASE_NAME}(genetic_type);` +
        `CREATE INDEX IF NOT EXISTS idx_strain_effects 
        ON ${STRAINS_DATABASE_NAME}(effects);` +
        `CREATE INDEX IF NOT EXISTS idx_strain_rating 
        ON ${STRAINS_DATABASE_NAME}(combined_rating DESC);` +
        `CREATE UNIQUE INDEX IF NOT EXISTS idx_unique_strain_name 
        ON ${STRAINS_DATABASE_NAME}(name);`
      );

      // Simple count check to avoid duplicate data
      const [result] = await db.getAllAsync<{count: number}>(`SELECT COUNT(*) as count FROM ${STRAINS_DATABASE_NAME}`);
      
      if (result && result.count === 0) {
        await this.insertStrainData(db);
        console.log('[DatabaseManager] Sample strain data inserted');
      } else {
        console.log(`[DatabaseManager] Strains database already contains ${result ? result.count : 0} records`);
      }
      
      console.log('[DatabaseManager] Strains database initialized');
    } catch (error) {
      throw this.handleDatabaseError(error, 'initializeStrainsDb');
    }
  }

  /**
   * Initialize the Safety database
   */
  private async initializeSafetyDb(): Promise<void> {
    try {
      const db = await this.getDatabase(SAFETY_DB_NAME);
      await db.execAsync(
        'PRAGMA journal_mode = WAL;' +
        `CREATE TABLE IF NOT EXISTS ${SAFETY_DB_NAME} (
          id TEXT PRIMARY KEY NOT NULL,
          user_id TEXT NOT NULL,
          concern_type TEXT NOT NULL,
          concern_details TEXT NOT NULL,
          resolution_suggestions TEXT,
          cooling_off_until INTEGER,
          created_at INTEGER NOT NULL
        );` +
        `CREATE INDEX IF NOT EXISTS idx_user_id 
        ON ${SAFETY_DB_NAME}(user_id);` +
        `CREATE INDEX IF NOT EXISTS idx_created_at 
        ON ${SAFETY_DB_NAME}(created_at);` +
        `CREATE INDEX IF NOT EXISTS idx_concern_type 
        ON ${SAFETY_DB_NAME}(concern_type);` +
        `CREATE INDEX IF NOT EXISTS idx_cooling_off_until 
        ON ${SAFETY_DB_NAME}(cooling_off_until);`
      );
      
      console.log('[DatabaseManager] Safety database initialized');
    } catch (error) {
      throw this.handleDatabaseError(error, 'initializeSafetyDb');
    }
  }

  /**
   * Initialize the Achievements database
   */
  private async initializeAchievementsDb(): Promise<void> {
    try {
      const db = await this.getDatabase(ACHIEVEMENTS_DB_NAME);
      
      await db.execAsync(`
        PRAGMA journal_mode = WAL;
        
        CREATE TABLE IF NOT EXISTS achievements (
          id INTEGER PRIMARY KEY,
          category TEXT NOT NULL,
          name TEXT NOT NULL,
          unlock_condition TEXT NOT NULL,
          notes TEXT,
          icon TEXT,
          complexity INTEGER DEFAULT 1
        );

        CREATE TABLE IF NOT EXISTS user_achievements (
          user_id TEXT NOT NULL,
          achievement_id INTEGER NOT NULL,
          progress REAL DEFAULT 0,
          date_unlocked TEXT,
          is_unlocked INTEGER DEFAULT 0,
          is_new INTEGER DEFAULT 0,
          progress_data TEXT,
          PRIMARY KEY (user_id, achievement_id),
          FOREIGN KEY (achievement_id) REFERENCES achievements(id)
        );
      `);
      
      // Check if achievements are already imported
      const result = await db.getFirstAsync<{count: number}>('SELECT COUNT(*) as count FROM achievements');
      const count = result?.count ?? 0;
      
      if (count === 0) {
        console.log('[DatabaseManager] Importing initial achievements...');
        const achievements = this.getInitialAchievements();
        
        // Use transactions for better performance and reliability
        await this.executeTransaction(db, ACHIEVEMENTS_DB_NAME, async () => {
          // Batch insert achievements
          for (const achievement of achievements) {
            // Validate that the achievement has all required fields
            if (!achievement.category || !achievement.name || !achievement.unlockCondition) {
              console.error(`[DatabaseManager] Skipping achievement with missing required fields:`, achievement);
              continue;
            }
            
            // Insert with parameterized query for safety
            await db.runAsync(
              `INSERT INTO achievements 
                (id, category, name, unlock_condition, notes, icon, complexity)
              VALUES (?, ?, ?, ?, ?, ?, ?)`,
              [
                achievement.id,
                achievement.category,
                achievement.name,
                achievement.unlockCondition,
                achievement.notes || "",
                achievement.icon || this.getCategoryIcon(achievement.category),
                achievement.complexity || 1
              ]
            );
          }
        });
        
        console.log(`[DatabaseManager] Imported ${achievements.length} achievements`);
      } else {
        console.log(`[DatabaseManager] ${count} achievements already exist`);
      }
      
      console.log('[DatabaseManager] Achievements database initialized');
    } catch (error) {
      console.error('[DatabaseManager] Error initializing Achievements database:', error);
      throw error;
    }
  }

  /**
   * Inserts sample strain data into the database
   */
  private async insertStrainData(db: SQLiteDatabase): Promise<void> {
    try {
      console.log('[DatabaseManager] Inserting initial strain data...');
      
      // Use a transaction for better performance and atomicity
      await this.executeTransaction(db, STRAINS_DATABASE_NAME, async () => {
        // Get the SQL statements for strain insertion
        const insertStatements = getStrainInsertStatements();
        
        // Execute all insert statements
        await db.execAsync(insertStatements);
      });
      
      console.log('[DatabaseManager] Strain data inserted successfully');
    } catch (error) {
      console.error('[DatabaseManager] Failed to insert strain data:', error);
      throw error;
    }
  }

  /**
   * Execute a transaction for a specific database
   */
  public async executeTransaction<T>(
    db: SQLiteDatabase,
    dbName: string,
    operations: () => Promise<T>
  ): Promise<T> {
    try {
      // Check if there's already a transaction in progress for this database
      if (this.transactionInProgress.get(dbName)) {
        console.log(`[DatabaseManager] Transaction already in progress for ${dbName}, waiting...`);
        // Wait for the current transaction to complete
        await this._waitForTransactionToComplete(dbName);
      }
      
      this.transactionInProgress.set(dbName, true);
      await db.execAsync('BEGIN TRANSACTION');
      
      const result = await operations();
      
      await db.execAsync('COMMIT');
      return result;
    } catch (error) {
      try {
        await db.execAsync('ROLLBACK');
      } catch (rollbackError) {
        console.error('[DatabaseManager] Error rolling back transaction:', rollbackError);
      }
      throw error;
    } finally {
      this.transactionInProgress.set(dbName, false);
    }
  }

  /**
   * Wait for a transaction to complete on a specific database
   */
  private async _waitForTransactionToComplete(dbName: string): Promise<void> {
    return new Promise(resolve => {
      const checkInterval = setInterval(() => {
        if (!this.transactionInProgress.get(dbName)) {
          clearInterval(checkInterval);
          resolve();
        }
      }, 50);
    });
  }

  /**
   * Execute a read transaction (no locks needed)
   */
  public async executeReadTransaction<T>(
    db: SQLiteDatabase,
    dbName: string, 
    operations: () => Promise<T>
  ): Promise<T> {
    // Read transactions don't need locks in SQLite
    return operations();
  }

  /**
   * Execute a write transaction (requires locks)
   */
  public async executeWriteTransaction<T>(
    db: SQLiteDatabase,
    dbName: string,
    operations: () => Promise<T>
  ): Promise<T> {
    // Use locking for write transactions
    return this.executeTransaction(db, dbName, operations);
  }

  /**
   * Execute a transaction by database name (backward compatibility)
   */
  public async executeTransactionByName<T>(
    dbName: string, 
    operations: (db: SQLiteDatabase) => Promise<T>
  ): Promise<T> {
    const db = await this.getDatabase(dbName);
    return this.executeTransaction(db, dbName, () => operations(db));
  }

  /**
   * Get a database connection by name, creating it if it doesn't exist
   */
  public async getDatabase(dbName: string): Promise<SQLiteDatabase> {
    // Record access time
    this.lastAccessTimes.set(dbName, Date.now());
    
    // First check if we already have an open connection
    if (this.databaseConnections.has(dbName)) {
      const db = this.databaseConnections.get(dbName);
      if (db) {
        // Start monitoring if not already monitoring
        this._startConnectionMonitoring();
        return db;
      }
    }
    
    try {
      // Open the database and store the connection
      const db = await openDatabaseAsync(dbName);
      this.databaseConnections.set(dbName, db);
      
      // Start monitoring if not already monitoring
      this._startConnectionMonitoring();
      
      return db;
    } catch (error) {
      console.error(`[DatabaseManager] Error opening database ${dbName}:`, error);
      throw error;
    }
  }

  /**
   * Ensure the database manager is initialized
   */
  public async ensureInitialized(): Promise<void> {
    if (this.initialized) {
      return;
    }
    
    if (this.initializationPromise) {
      // If initialization is already in progress, wait for it to complete
      return this.initializationPromise;
    }
    
    // Otherwise, start initialization
    console.info('[DatabaseManager] Database not initialized, starting initialization now');
    return this.initialize();
  }

  /**
   * Close all database connections
   */
  public async cleanup(): Promise<void> {
    try {
      console.log('[DatabaseManager] Closing all database connections...');
      
      // Stop connection monitoring
      this._stopConnectionMonitoring();
      
      for (const [name, db] of this.databaseConnections.entries()) {
        try {
          await db.closeAsync();
          console.log(`[DatabaseManager] Closed database: ${name}`);
        } catch (closeError) {
          console.error(`[DatabaseManager] Error closing database ${name}:`, closeError);
        }
      }
      
      this.databaseConnections.clear();
      this.lastAccessTimes.clear();
      this.initialized = false;
      console.log('[DatabaseManager] All database connections closed');
    } catch (error) {
      console.error('[DatabaseManager] Error during cleanup:', error);
      throw error;
    }
  }

  /**
   * Start monitoring for idle connections
   */
  private _startConnectionMonitoring(): void {
    if (this.connectionMonitoringInterval) return;
    
    this.connectionMonitoringInterval = setInterval(() => {
      const now = Date.now();
      for (const [dbName, lastAccess] of this.lastAccessTimes.entries()) {
        if (now - lastAccess > this.connectionTimeout) {
          // Close idle connection
          this._closeIdleConnection(dbName);
        }
      }
    }, 60000); // Check every minute
    
    console.log('[DatabaseManager] Started connection monitoring');
  }

  /**
   * Stop connection monitoring
   */
  private _stopConnectionMonitoring(): void {
    if (this.connectionMonitoringInterval) {
      clearInterval(this.connectionMonitoringInterval);
      this.connectionMonitoringInterval = null;
      console.log('[DatabaseManager] Stopped connection monitoring');
    }
  }

  /**
   * Close an idle connection
   */
  private async _closeIdleConnection(dbName: string): Promise<void> {
    try {
      const db = this.databaseConnections.get(dbName);
      if (db) {
        await db.closeAsync();
        this.databaseConnections.delete(dbName);
        this.lastAccessTimes.delete(dbName);
        console.log(`[DatabaseManager] Closed idle connection: ${dbName}`);
      }
    } catch (error) {
      console.error(`[DatabaseManager] Error closing idle connection ${dbName}:`, error);
    }
  }

  /* ------------------------------------------------------------------
     Result validation helpers
   ------------------------------------------------------------------ */

  private validateBongHitStats = (stats: BongHitStats): BongHitStats => ({
    averageDuration: Math.max(0, Number(stats.averageDuration) || 0),
    longestHit: Math.max(0, Number(stats.longestHit) || 0),
  });

  // Convert ChartDataPoint to Datapoint
  private chartDataToDatapoint(point: ChartDataPoint): Datapoint {
    return {
      x: point.label,
      y: point.value
    };
  }

  private validateDatapoint = (point: {label: string, value: number}): Datapoint => ({
    x: String(point.label || ""),
    y: Math.max(0, Number(point.value) || 0),
  });

  private validateAverageHourCount = (count: AverageHourCount): AverageHourCount => ({
    hourOfDay: String(count.hourOfDay || "00"),
    count: Math.max(0, Number(count.count) || 0),
  });

  /* ------------------------------------------------------------------
     Generic error handler
   ------------------------------------------------------------------ */

  protected handleError<T>(error: unknown, operation: string): DatabaseResponse<T> {
    const errorMessage = error instanceof Error ? error.message : `Failed to ${operation}`;
    console.error(`[DatabaseManager] Error in ${operation}:`, error);
    return {
      success: false,
      error: errorMessage
    };
  }

  /* ------------------------------------------------------------------
     Achievement-related methods from AchievementService
   ------------------------------------------------------------------ */

  /**
   * Get user achievements from the database
   */
  public async getUserAchievements(userId: string): Promise<UserAchievementWithDetails[]> {
    try {
      console.log('[DatabaseManager] Getting user achievements for', userId);
      await this.ensureInitialized();
      
      // Remove redundant initialization - rely on ensureInitialized() instead
      // try {
      //   await this.initializeAchievementsDb();
      // } catch (error) {
      //   console.error('[DatabaseManager] Error ensuring achievements database is initialized:', error);
      //   return [];
      // }
      
      const db = await this.getDatabase(ACHIEVEMENTS_DB_NAME);
      
      // First ensure user has entries for all achievements
      await this.ensureUserAchievements(userId);
      
      // Get achievements with progress
      const results = await db.getAllAsync<UserAchievementWithDetails>(
        `SELECT 
          a.id, a.category, a.name, a.unlock_condition as unlockCondition, 
          a.notes, a.icon, a.complexity,
          ua.user_id as userId, a.id as achievementId, ua.progress, 
          ua.date_unlocked as dateUnlocked, 
          ua.is_unlocked as isUnlocked, ua.is_new as isNew,
          ua.progress_data as progressData
        FROM achievements a
        JOIN user_achievements ua ON a.id = ua.achievement_id
        WHERE ua.user_id = ?`,
        [userId]
      );
      
      console.log(`[DatabaseManager] Found ${results.length} achievements for user ${userId}`);
      
      // Convert SQLite's numeric booleans to actual booleans
      return results.map(achievement => ({
        ...achievement,
        isUnlocked: Boolean(achievement.isUnlocked),
        isNew: Boolean(achievement.isNew)
      }));
    } catch (error) {
      return this.handleDatabaseError(error, 'getUserAchievements', []);
    }
  }

  /**
   * Standardized error handling method
   */
  private handleDatabaseError<T>(error: unknown, operation: string, fallback?: T): T | never {
    console.error(`[DatabaseManager] Error during ${operation}:`, error);
    
    if (fallback !== undefined) {
      // Return fallback value if provided
      return fallback;
    }
    
    // Otherwise throw with a standard format
    throw new Error(`Database operation failed: ${operation}`);
  }

  /**
   * Ensure all achievements are in the user's record
   */
  private async ensureUserAchievements(userId: string): Promise<void> {
    try {
      await this.ensureInitialized();
      const db = await this.getDatabase(ACHIEVEMENTS_DB_NAME);
      
      // Check if the user already has achievement records
      const existingAchievements = await db.getAllAsync<{achievement_id: number}>(
        `SELECT achievement_id FROM ${USER_ACHIEVEMENTS_TABLE} WHERE user_id = ? LIMIT 1`,
        [userId]
      );
   
      if (existingAchievements.length === 0) {
        console.log(`[DatabaseManager] Creating initial achievement records for user ${userId}`);
        
        // Get all achievements
        const achievements = this.getInitialAchievements();
        
        // Create achievement records for the user
        await this.executeTransaction(db, ACHIEVEMENTS_DB_NAME, async () => {
          for (const achievement of achievements) {
            await db.runAsync(
              `INSERT INTO ${USER_ACHIEVEMENTS_TABLE} (
                user_id, achievement_id, progress, is_unlocked, is_new, progress_data
              ) VALUES (?, ?, ?, ?, ?, ?)`,
              [
                userId,
                achievement.id,
                0,
                0,
                0,
                JSON.stringify({})
              ]
            );
          }
        });
   
        console.log(`[DatabaseManager] Created ${achievements.length} achievement records for user ${userId}`);
      }
    } catch (error) {
      console.error('[DatabaseManager] Error ensuring user achievements:', error);
    }
  }
  
  /**
   * Check and update achievements based on user action
   */
  public async checkAchievements(userId: string, actionType: string, data: any): Promise<UserAchievementWithDetails[]> {
    try {
      await this.ensureInitialized();
      // Only check relevant achievements for the action type
      const relevantAchievements = await this.getAchievementsByActionType(actionType);
      const unlockedAchievements: UserAchievementWithDetails[] = [];
      
      // Process only relevant achievements for better performance
      for (const achievement of relevantAchievements) {
        const updated = await this.processAchievement(userId, achievement, actionType, data);
        if (updated && updated.isUnlocked && updated.isNew) {
          unlockedAchievements.push(updated);
        }
      }
      
      return unlockedAchievements;
      } catch (error) {
      console.error('[DatabaseManager] Failed to check achievements:', error);
        return [];
    }
  }
  
  /**
   * Update achievement progress
   */
  public async updateAchievementProgress(userId: string, achievementId: number, progress: number, data?: any): Promise<void> {
    try {
      await this.ensureInitialized();
      const db = await this.getDatabase(ACHIEVEMENTS_DB_NAME);
      
      // Ensure progress is between 0 and 100
      progress = Math.max(0, Math.min(100, progress));
      
      // Check if achievement is already unlocked
      const existing = await db.getFirstAsync<{is_unlocked: number}>(
        'SELECT is_unlocked FROM user_achievements WHERE user_id = ? AND achievement_id = ?',
        [userId, achievementId]
      );
      
      if (existing && existing.is_unlocked) {
        // Achievement already unlocked, don't update progress
        return;
      }
      
      // Check if this achievement should be unlocked
      const isUnlocked = progress >= 100 ? 1 : 0;
      
      // Update with parameterized queries
      await db.runAsync(
        `UPDATE user_achievements 
        SET progress = ?, 
            is_unlocked = ?, 
            is_new = ?,
            date_unlocked = ?,
            progress_data = ?
        WHERE user_id = ? AND achievement_id = ?`,
        [
          progress,
          isUnlocked,
          isUnlocked,
          isUnlocked ? new Date().toISOString() : null,
          data ? JSON.stringify(data) : null,
          userId,
          achievementId
        ]
      );
    } catch (error) {
      console.error(`[DatabaseManager] Failed to update achievement progress:`, error);
    }
  }
  
  /**
   * Clear 'new' flags on achievements
   */
  public async clearAchievementNewFlags(userId: string): Promise<void> {
    try {
      await this.ensureInitialized();
      const db = await this.getDatabase(ACHIEVEMENTS_DB_NAME);
      
      await db.runAsync(
        `UPDATE user_achievements SET is_new = 0 WHERE user_id = ?`,
        [userId]
      );
    } catch (error) {
      console.error('[DatabaseManager] Failed to clear achievement new flags:', error);
    }
  }
  
  /**
   * Get achievements that should be checked for a given action type
   */
  private async getAchievementsByActionType(actionType: string): Promise<Achievement[]> {
    try {
      // Get all achievement IDs that should be checked for this action type
      const relevantIds = Object.entries(ACHIEVEMENT_TRIGGERS)
        .filter(([_, triggers]) => Array.isArray(triggers) && triggers.includes(actionType))
        .map(([id]) => parseInt(id));
      
      if (relevantIds.length === 0) return [];
      
      // Get achievement details for these IDs
      return ACHIEVEMENTS.filter(achievement => relevantIds.includes(achievement.id));
    } catch (error) {
      console.error('[DatabaseManager] Failed to get achievements by action type:', error);
      return [];
    }
  }
  
  /**
   * Process an achievement to check if it should be updated
   */
  private async processAchievement(
    userId: string, 
    achievement: Achievement, 
    actionType: string, 
    data: any
  ): Promise<UserAchievementWithDetails | null> {
    try {
      await this.ensureInitialized();
      const db = await this.getDatabase(ACHIEVEMENTS_DB_NAME);
      
      // Get current progress
      const current = await db.getFirstAsync<{progress: number, is_unlocked: number}>(
        'SELECT progress, is_unlocked FROM user_achievements WHERE user_id = ? AND achievement_id = ?',
        [userId, achievement.id]
      );
      
      // If already unlocked or not found, exit early
      if (!current) return null;
      if (current.is_unlocked) return null;
      
      // Calculate new progress based on achievement type and action
      let newProgress = current.progress;
      
      // This is where you'd implement the logic for different achievement types
      // For now, this is a simplified example
      switch (achievement.category) {
        case 'Daily & Weekly Streaks':
          // Example: First usage achievement
          if (achievement.id === 1 && actionType === 'log_consumption') {
            newProgress = 100; // Immediately complete
          }
          break;
          
        case 'Strain Exploration':
          // Example: Try different strains
          if (actionType === 'explore_strain') {
            // Increment progress by a fixed amount, or calculate based on unique strains
            newProgress = Math.min(100, newProgress + 10);
          }
          break;
          
        // Add more category handlers
      }
      
      // Update progress
      if (newProgress !== current.progress) {
        await this.updateAchievementProgress(userId, achievement.id, newProgress);
      }
      
      // If newly unlocked, return full achievement details
      if (newProgress >= 100 && current.progress < 100) {
        const updated = await db.getFirstAsync<UserAchievementWithDetails>(
          `SELECT 
            a.id, a.category, a.name, a.unlock_condition as unlockCondition, 
            a.notes, a.icon, a.complexity,
            ua.user_id as userId, a.id as achievementId, ua.progress, 
            ua.date_unlocked as dateUnlocked, 
            ua.is_unlocked as isUnlocked, ua.is_new as isNew
          FROM achievements a
          JOIN user_achievements ua ON a.id = ua.achievement_id
          WHERE ua.user_id = ? AND a.id = ?`,
          [userId, achievement.id]
        );
        
        if (updated) {
          return {
            ...updated,
            isUnlocked: Boolean(updated.isUnlocked),
            isNew: Boolean(updated.isNew)
          };
        }
      }
      
      return null;
    } catch (error) {
      console.error('[DatabaseManager] Failed to process achievement:', error);
      return null;
    }
  }
  
  /**
   * Get initial achievements list
   */
  private getInitialAchievements(): Achievement[] {
    // Make sure ACHIEVEMENTS is defined and has values
    if (!ACHIEVEMENTS || !Array.isArray(ACHIEVEMENTS) || ACHIEVEMENTS.length === 0) {
      const error = new Error('[DatabaseManager] ACHIEVEMENTS array is not properly defined in constants.ts');
      console.error(error);
      throw error; // Throw instead of creating a fallback
    }
    
    // Return achievements from constants
    console.log(`[DatabaseManager] Returning ${ACHIEVEMENTS.length} achievements from constants`);
    return ACHIEVEMENTS;
  }
  
  /**
   * Get icon for achievement category
   */
  private getCategoryIcon(category: string): string {
    // Get icon from constants or use default
    return (ACHIEVEMENT_ICONS as Record<string, string>)[category] || 'trophy';
  }

  /* ------------------------------------------------------------------
     BongHits Data-Fetching / Query Functions
   ------------------------------------------------------------------ */

  /**
   * Retrieves average and max duration over the past 7 days.
   */
  public async getBongHitStatsFromPastWeek(): Promise<BongHitStats> {
    try {
      await this.ensureInitialized();
      const db: SQLiteDatabase = await this.getDatabase(BONG_HITS_DATABASE_NAME);
      const results = await db.getAllAsync<{avg_duration: number, max_duration: number}>(`
        SELECT
          AVG(duration_ms) AS avg_duration,
          MAX(duration_ms) AS max_duration
        FROM ${BONG_HITS_DATABASE_NAME}
        WHERE timestamp >= '2024-12-24'
      `);

      if (!results.length) {
        // Fallback if no data
        return this.validateBongHitStats({ averageDuration: 0, longestHit: 0 });
      }

      const row = results[0];
      return this.validateBongHitStats({
        averageDuration: row.avg_duration,
        longestHit: row.max_duration,
      });
    } catch (error) {
      console.error("Error in getBongHitStatsFromPastWeek:", error);
      throw error;
    }
  }

  /**
   * Counts hits per day over the past week (filling day indices 0..6).
   */
  public async queryNumberOfHitsFromPastWeek(): Promise<Datapoint[]> {
    try {
      await this.ensureInitialized();
      const db: SQLiteDatabase = await this.getDatabase(BONG_HITS_DATABASE_NAME);
      const results = await db.getAllAsync<{day: string, hit_count: number}>(`
        SELECT 
          strftime('%w', timestamp) AS day,
          COUNT(*) AS hit_count
        FROM ${BONG_HITS_DATABASE_NAME}
        WHERE timestamp >= '2024-12-24'
        GROUP BY day
        ORDER BY day
      `);

      console.log("Weekly query results:", results);

      // Prepare an array for Sunday..Saturday
      const weekData: Datapoint[] = Array.from({ length: 7 }, (_, i) => ({
        x: dayLookUpTable.get(i) || "",
        y: 0,
      }));

      results.forEach(row => {
        const dayIndex = parseInt(row.day, 10);
        if (dayIndex >= 0 && dayIndex < 7) {
          weekData[dayIndex] = this.validateDatapoint({
            label: dayLookUpTable.get(dayIndex) || "",
            value: row.hit_count,
          });
        }
      });

      return weekData;
    } catch (error) {
      console.error("Error in queryNumberOfHitsFromPastWeek:", error);
      throw error;
    }
  }

  /**
   * Returns a list of (hourOfDay -> # of hits) since a week ago,
   * filling missing hours with 0.
   */
  public async getDailyAverageDatapoints(): Promise<AverageHourCount[]> {
    try {
      await this.ensureInitialized();
      const db: SQLiteDatabase = await this.getDatabase(BONG_HITS_DATABASE_NAME);
      const results = await db.getAllAsync<{hourOfDay: string, count: number}>(`
        SELECT 
          strftime('%H', timestamp) AS hourOfDay,
          COUNT(*) AS count
        FROM ${BONG_HITS_DATABASE_NAME}
        WHERE timestamp >= '2024-12-24'
        GROUP BY hourOfDay
        ORDER BY hourOfDay
      `);

      // Hours "00" through "23"
      const allHours = Array.from({ length: 24 }, (_, i) => i.toString().padStart(2, "0"));
      const dataMap = new Map<string, number>(
        results.map(item => [item.hourOfDay, item.count])
      );

      return allHours.map((hour) =>
        this.validateAverageHourCount({
          hourOfDay: hour,
          count: dataMap.get(hour) || 0,
        })
      );
    } catch (error) {
      console.error("Error in getDailyAverageDatapoints:", error);
      throw error;
    }
  }

  /**
   * Generic function to get data based on a time range (D=Day, W=Week, M=Month).
   * Returns both chartData and some aggregated stats.
   */
  public async getDailyStats(timeRange: string) {
    try {
      await this.ensureInitialized();
      let query = "";

      switch (timeRange) {
        case "D":
          query = `
            SELECT strftime('%H', timestamp) as label,
                 COUNT(*) as value,
                 AVG(duration_ms) as avg_duration
            FROM ${BONG_HITS_DATABASE_NAME}
            WHERE timestamp >= '2024-12-24'
            GROUP BY label
            ORDER BY label
          `;
          break;
        case "W":
          query = `
            SELECT strftime('%w', timestamp) as label,
                 COUNT(*) as value,
                 AVG(duration_ms) as avg_duration
            FROM ${BONG_HITS_DATABASE_NAME}
            WHERE timestamp >= '2024-12-24'
            GROUP BY label
            ORDER BY label
          `;
          break;
        case "M":
          query = `
            SELECT strftime('%d', timestamp) as label,
                 COUNT(*) as value,
                 AVG(duration_ms) as avg_duration
            FROM ${BONG_HITS_DATABASE_NAME}
            WHERE timestamp >= '2024-12-24'
            GROUP BY label
            ORDER BY label
          `;
          break;
        default:
          // fallback same as 'D'
          query = `
            SELECT strftime('%H', timestamp) as label,
                 COUNT(*) as value,
                 AVG(duration_ms) as avg_duration
            FROM ${BONG_HITS_DATABASE_NAME}
            WHERE timestamp >= '2024-12-24'
            GROUP BY label
            ORDER BY label
          `;
      }

      const db: SQLiteDatabase = await this.getDatabase(BONG_HITS_DATABASE_NAME);
      const results = await db.getAllAsync<{label: string, value: number, avg_duration: number}>(query);

      // Build chart data
      const chartData = {
        labels: results.map(r => `${r.label}h`),
        datasets: [
          {
            data: results.map(r => r.value),
            color: (opacity = 1) => `rgba(0, 122, 255, ${opacity})`,
            strokeWidth: 2,
          },
        ],
        legend: ["Hits"],
      };

      // Build aggregated stats
      // If no rows, handle safely
      if (!results.length) {
        return {
          chartData,
          stats: {
            avgDuration: 0,
            totalHits: 0,
            peakHour: null,
          },
        };
      }

      const avgDuration =
        results.reduce((acc: number, curr) => acc + curr.avg_duration, 0) /
        results.length;
      const totalHits = results.reduce((acc: number, curr) => acc + curr.value, 0);
      const peak = results.reduce((a, b) => (a.value > b.value ? a : b));
      const peakHour = peak.label;

      return {
        chartData,
        stats: {
          avgDuration,
          totalHits,
          peakHour,
        },
      };
    } catch (error) {
      console.error("Error in getDailyStats:", error);
      throw error;
    }
  }

  /**
   * Record a new bong hit
   * @param timestamp ISO string timestamp of the hit
   * @param durationMs Duration of the hit in milliseconds
   */
  public async recordBongHit(timestamp: string, durationMs: number): Promise<void> {
    const hit: BongHit = { timestamp, duration_ms: durationMs };
    const validationError = validateBongHit(hit);
    
    if (validationError) {
      throw new Error(validationError);
    }
    
    try {
      await this.ensureInitialized();
      const db = await this.getDatabase(BONG_HITS_DATABASE_NAME);
      
      await db.runAsync(
        `INSERT INTO ${BONG_HITS_DATABASE_NAME} (timestamp, duration_ms) 
         VALUES (?, ?)`,
        [timestamp, durationMs]
      );
    } catch (error) {
      console.error('[DatabaseManager] Error recording bong hit:', error);
      throw error;
    }
  }

  /* ------------------------------------------------------------------
     Saved devices management via AsyncStorage
   ------------------------------------------------------------------ */

  public async getSavedDevices(): Promise<SavedDevice[]> {
    try {
      const savedDevices = await AsyncStorage.getItem(SAVED_DEVICES_KEY);
      if (savedDevices) {
        return JSON.parse(savedDevices) as SavedDevice[];
      }
      return [];
    } catch (error) {
      console.error("Error getting saved devices:", error);
      throw error;
    }
  }

  public async saveDevices(devices: Device[]): Promise<void> {
    try {
      let savedDevices: SavedDevice[] = await this.getSavedDevices();
      
      devices.forEach(device => {
        const savedDevice: SavedDevice = {
          id: device.id, 
          name: device.name ? device.name : "Unknown Name"
        };
        savedDevices.push(savedDevice);
      });
      
      await AsyncStorage.setItem(SAVED_DEVICES_KEY, JSON.stringify(savedDevices));
    } catch (error) {
      console.error("Error saving devices:", error);
      throw error;
    }
  }

  /* ------------------------------------------------------------------
     AsyncStorage Methods (Moved from AsyncStorageManager)
   ------------------------------------------------------------------ */

  /**
   * Generic method to get a value from AsyncStorage
   */
  public async getValue<T>(key: string): Promise<T | null> {
    try {
      const value = await AsyncStorage.getItem(key);
      if (value !== null) {
        return JSON.parse(value) as T;
      }
      return null;
    } catch (error) {
      console.error(`[DatabaseManager] Error getting value for key ${key}:`, error);
      return null;
    }
  }

  /**
   * Generic method to set a value in AsyncStorage
   */
  public async setValue<T>(key: string, value: T): Promise<void> {
    try {
      await AsyncStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
      console.error(`[DatabaseManager] Error setting value for key ${key}:`, error);
      throw error;
    }
  }

  /**
   * Remove a key from AsyncStorage
   */
  public async removeValue(key: string): Promise<void> {
    try {
      await AsyncStorage.removeItem(key);
    } catch (error) {
      console.error(`[DatabaseManager] Error removing key ${key}:`, error);
      throw error;
    }
  }

  /**
   * Clear all data in AsyncStorage
   * Use with caution!
   */
  public async clearAll(): Promise<void> {
    try {
      await AsyncStorage.clear();
    } catch (error) {
      console.error('[DatabaseManager] Error clearing AsyncStorage:', error);
      throw error;
    }
  }

  /* ------------------------------------------------------------------
     Strain Methods (Moved from StrainService)
   ------------------------------------------------------------------ */

  /**
   * Search strains with filters and pagination
   */
  public async searchStrains(
    query: string,
    filters: StrainSearchFilters = {},
    pagination: PaginationParams = { page: 1, limit: 10 }
  ): Promise<StrainSearchResult<Strain>> {
    try {
      await this.ensureInitialized();
      const db = await this.getDatabase(STRAINS_DATABASE_NAME);
      const { page, limit } = pagination;
      const offset = (page - 1) * limit;

      // Build where clause and parameters
      const whereClauses = [];
      const params: any[] = [];

      // Search by name if query is provided
      if (query && query.trim()) {
        whereClauses.push('name LIKE ?');
        params.push(`%${query.trim()}%`);
      }

      // Filter by genetic type
      if (filters.geneticType) {
        whereClauses.push('genetic_type = ?');
        params.push(filters.geneticType);
      }

      // Filter by effects
      if (filters.effects && filters.effects.length > 0) {
        const effectClauses = filters.effects.map(() => 'effects LIKE ?');
        whereClauses.push(`(${effectClauses.join(' OR ')})`);
        filters.effects.forEach(effect => params.push(`%${effect}%`));
      }

      // Filter by THC range
      if (filters.minTHC !== undefined) {
        whereClauses.push('CAST(SUBSTR(thc_range, 1, INSTR(thc_range, "-")-1) AS FLOAT) >= ?');
        params.push(filters.minTHC);
      }

      if (filters.maxTHC !== undefined) {
        whereClauses.push('CAST(SUBSTR(thc_range, INSTR(thc_range, "-")+1) AS FLOAT) <= ?');
        params.push(filters.maxTHC);
      }

      // Construct the final WHERE clause
      const whereClause = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';

      // Get total count for pagination
      const [countResult] = await db.getAllAsync<{ total: number }>(
        `SELECT COUNT(*) as total FROM ${STRAINS_DATABASE_NAME} ${whereClause}`,
        params
      );

      // Get filtered results
      const results = await db.getAllAsync<Strain>(
        `SELECT * FROM ${STRAINS_DATABASE_NAME} 
         ${whereClause} 
         ORDER BY ${this.getSortOrder(filters.sort)}
         LIMIT ? OFFSET ?`,
        [...params, limit, offset]
      );

      const total = countResult?.total || 0;
      const totalPages = Math.ceil(total / limit);

      return {
        data: results,
        total,
        currentPage: page,
        totalPages,
        hasMore: page < totalPages
      };
      
    } catch (error) {
      console.error('[DatabaseManager] Error searching strains:', error);
      // Return an empty result in case of error
      return {
        data: [],
        total: 0,
        currentPage: pagination.page,
        totalPages: 0,
        hasMore: false
      };
    }
  }

  /**
   * Helper method to get sort order for strain queries
   */
  private getSortOrder(sort?: StrainSearchFilters['sort']): string {
    switch (sort) {
      case 'name':
        return 'name ASC';
      case 'thc':
        return 'CAST(SUBSTR(thc_range, 1, INSTR(thc_range, "-")-1) AS FLOAT) DESC';
      case 'rating':
      default:
        return 'combined_rating DESC';
    }
  }

  /**
   * Get strain by ID
   */
  public async getStrainById(id: number): Promise<ValidationResult<Strain | null>> {
    try {
      await this.ensureInitialized();
      const db = await this.getDatabase(STRAINS_DATABASE_NAME);
      
      // Validate input
      if (!id || typeof id !== 'number' || id <= 0) {
        return createValidationError('INVALID_ID', 'Invalid strain ID provided');
      }
      
      const results = await db.getAllAsync<Strain>(
        `SELECT * FROM ${STRAINS_DATABASE_NAME} WHERE id = ? LIMIT 1`,
        [id]
      );
      
      const strain = results[0] || null;
      
      if (strain) {
        const validationError = validateStrain(strain);
        if (validationError) {
          return createValidationError('INVALID_STRAIN_DATA', validationError, { id });
        }
      }
      
      return createValidationSuccess(strain);
    } catch (error) {
      console.error('[DatabaseManager] Error getting strain by id:', error);
      return createValidationError('DB_ERROR', 'Failed to retrieve strain', { id });
    }
  }

  /**
   * Get popular strains
   */
  public async getPopularStrains(limit: number = 10): Promise<Strain[]> {
    try {
      await this.ensureInitialized();
      const db = await this.getDatabase(STRAINS_DATABASE_NAME);
      const results = await db.getAllAsync<Strain>(
        `SELECT * FROM ${STRAINS_DATABASE_NAME} ORDER BY combined_rating DESC LIMIT ?`,
        [limit]
      );
      return results || [];
    } catch (error) {
      console.error('[DatabaseManager] Error getting popular strains:', error);
      return [];
    }
  }

  /**
   * Get related strains
   */
  public async getRelatedStrains(strain: Strain): Promise<ValidationResult<Strain[]>> {
    try {
      // Validate input
      const validationError = validateStrain(strain);
      if (validationError) {
        return createValidationError('INVALID_STRAIN', validationError);
      }
      
      if (!strain.id) {
        return createValidationError('MISSING_ID', 'Strain ID is required');
      }
      
      await this.ensureInitialized();
      const db = await this.getDatabase(STRAINS_DATABASE_NAME);
      
      // Get strains with similar genetic type and effects
      const results = await db.getAllAsync<Strain>(
        `SELECT * FROM ${STRAINS_DATABASE_NAME}
         WHERE id != ? 
         AND (
           genetic_type = ? 
           OR effects LIKE ?
         )
         ORDER BY combined_rating DESC
         LIMIT 5`,
        [strain.id, strain.genetic_type, `%${strain.effects.split(',')[0]}%`]
      );
      
      // Validate results
      for (const relatedStrain of results) {
        const strainError = validateStrain(relatedStrain);
        if (strainError) {
          console.warn(`[DatabaseManager] Invalid related strain: ${strainError}`, relatedStrain);
        }
      }
      
      return createValidationSuccess(results);
    } catch (error) {
      console.error('[DatabaseManager] Error getting related strains:', error);
      return createValidationError('DB_ERROR', 'Failed to retrieve related strains');
    }
  }

  /**
   * Get strain categories
   */
  public async getStrainCategories(): Promise<{ [key: string]: number }> {
    try {
      await this.ensureInitialized();
      const db = await this.getDatabase(STRAINS_DATABASE_NAME);
      const results = await db.getAllAsync<{ genetic_type: string; count: number }>(
        `SELECT genetic_type, COUNT(*) as count
         FROM ${STRAINS_DATABASE_NAME}
         GROUP BY genetic_type`
      );
      
      return results.reduce((acc, { genetic_type, count }) => {
        if (genetic_type) {
          acc[genetic_type] = count;
        }
        return acc;
      }, {} as { [key: string]: number });
    } catch (error) {
      console.error('[DatabaseManager] Error getting strain categories:', error);
      return {};
    }
  }

  /* ------------------------------------------------------------------
     Safety Methods (Moved from SafetyService)
   ------------------------------------------------------------------ */

  /**
   * Validate recommendation request for safety concerns
   */
  public async validateRecommendationRequest(request: RecommendationRequest): Promise<SafetyValidationResult> {
    try {
      await this.ensureInitialized();
      
      const { userProfile, desiredEffects, medicalNeeds, context } = request;
      const safetyFlags: string[] = [];
      let isValid = true;
      let reason = '';
      let modifications: Partial<RecommendationRequest> = {};
      let warningLevel: 'info' | 'warning' | 'critical' = 'info';
      
      // Check for required fields
      if (!userProfile) {
        return {
          valid: false,
          reason: 'User profile is required for personalized recommendations',
          warningLevel: 'critical'
        };
      }

      // Verify age restrictions (if age is provided)
      if (userProfile.experience_level === 'beginner') {
        // For beginners, add a safety flag
        safetyFlags.push('Recommendations tailored for beginners. Start with lower doses.');
      }
      
      // Check for cooling off period
      const coolingOffStatus = await this.checkCoolingOffStatus(userProfile.id);
      if (coolingOffStatus.inCoolingOff) {
        return {
          valid: false,
          reason: `Cooling off period in effect until ${new Date(coolingOffStatus.endTime!).toLocaleDateString()}`,
          warningLevel: 'critical'
        };
      }
      
      // Check for overdose concerns based on user profile
      const overuseCheck = await this.detectOverusePatterns(userProfile.id);
      if (overuseCheck.detected) {
        if (overuseCheck.level === 'severe') {
          return {
            valid: false,
            reason: overuseCheck.details || 'Usage patterns indicate potential health concerns',
            warningLevel: 'critical'
          };
        } else {
          safetyFlags.push(overuseCheck.details || 'Frequent use detected. Consider moderating consumption.');
          warningLevel = overuseCheck.level === 'moderate' ? 'warning' : 'info';
        }
      }
      
      // Check for medication interactions if applicable
      if (userProfile.medications && userProfile.medications.length > 0) {
        const interactionCheck = await this.checkMedicationInteractions(
          userProfile.medications
        );
        
        if (interactionCheck.hasInteractions) {
          if (interactionCheck.severity === 'severe') {
            return {
              valid: false,
              reason: 'Potential serious interaction with medications detected',
              safetyFlags: interactionCheck.details,
              warningLevel: 'critical'
            };
          } else {
            safetyFlags.push(...(interactionCheck.details || []));
            warningLevel = interactionCheck.severity === 'moderate' ? 'warning' : 'info';
          }
        }
      }
      
      // Adjust recommendations for beginners
      if (userProfile.experience_level === 'beginner') {
        // Modify the request to prioritize lower THC content for beginners
        modifications = {
          ...modifications,
          context: 'wellness', // Override context for beginners
          desiredEffects: [...(request.desiredEffects || []), 'mild', 'gentle']
        };
        
        safetyFlags.push('Recommendations adjusted for beginner experience level.');
      }
      
      // Handle medical context with extra care
      if (context === 'medical' && medicalNeeds && medicalNeeds.length > 0) {
        safetyFlags.push('Medical disclaimer: Consult with a healthcare professional before use.');
        
        // Check if any medical needs require special attention
        const sensitiveConditions = ['anxiety', 'heart', 'psychiatric', 'pregnancy'];
        const hasSensitiveCondition = medicalNeeds.some(need => 
          sensitiveConditions.some(condition => need.toLowerCase().includes(condition))
        );
        
        if (hasSensitiveCondition) {
          safetyFlags.push('Some conditions may require extra caution. Medical supervision is strongly advised.');
          warningLevel = 'warning';
        }
      }
      
      // Return validation result
      return {
        valid: isValid,
        reason: reason,
        modifications: Object.keys(modifications).length > 0 ? modifications : undefined,
        safetyFlags: safetyFlags.length > 0 ? safetyFlags : undefined,
        warningLevel
      };
      
    } catch (error) {
      console.error('[DatabaseManager] Error validating recommendation request:', error);
      return {
        valid: false,
        reason: 'Internal safety check error. Please try again later.',
        warningLevel: 'critical'
      };
    }
  }

  /**
   * Process recommendation response to add safety information
   */
  public async processRecommendationResponse(
    response: RecommendationResponse, 
    userProfile: UserProfile,
    recentEntries: JournalEntry[]
  ): Promise<RecommendationResponse> {
    try {
      await this.ensureInitialized();
      
      let additionalDisclaimers: string[] = [];
      let enhancedSafetyNotes = [...(response.safetyNotes || [])];
      let recommendations = [...response.recommendations];
      
      // Ensure we always have basic disclaimers
      if (!response.disclaimers || response.disclaimers.length === 0) {
        additionalDisclaimers.push(
          "Cannabis affects individuals differently. Start with a low dose.",
          "Do not drive or operate machinery while using cannabis.",
          "Keep cannabis products away from children and pets."
        );
      }
      
      // Add experience level specific notes
      if (userProfile.experience_level === 'beginner') {
        additionalDisclaimers.push(
          "As a beginner, start with a very small amount and wait at least 2 hours before considering more.",
          "Effects may be stronger than expected for new users."
        );
      }
      
      // Check journal entries for negative patterns
      if (recentEntries.length > 0) {
        // Look for commonly reported negative effects
        const negativeEffectsMap = new Map<string, number>();
        recentEntries.forEach(entry => {
          if (entry.negative_effects) {
            entry.negative_effects.forEach(effect => {
              negativeEffectsMap.set(effect, (negativeEffectsMap.get(effect) || 0) + 1);
            });
          }
        });
        
        // Find frequent negative effects
        const frequentNegativeEffects = Array.from(negativeEffectsMap.entries())
          .filter(([_, count]) => count >= 2)
          .map(([effect]) => effect);
        
        if (frequentNegativeEffects.length > 0) {
          enhancedSafetyNotes.push(
            `Based on your journal, watch for these effects you've reported: ${frequentNegativeEffects.join(', ')}.`
          );
        }
      }
      
      // Return enhanced response
      return {
        ...response,
        disclaimers: [...(response.disclaimers || []), ...additionalDisclaimers],
        safetyNotes: enhancedSafetyNotes,
        recommendations
      };
      
    } catch (error) {
      console.error('[DatabaseManager] Error processing recommendation response:', error);
      // Return original response if processing fails
      return response;
    }
  }

  /**
   * Detect overuse patterns in user behavior
   */
  public async detectOverusePatterns(userId: string): Promise<OveruseDetectionResult> {
    try {
      await this.ensureInitialized();
      
      // Get recent journal entries for analysis
      const entries = await this.getRecentJournalEntries(userId, 30); // Last 30 days
      
      if (entries.length === 0) {
        return { detected: false };
      }
      
      // Check for daily use
      const dailyUseCount = entries.length;
      const daysInPeriod = 30;
      const usageFrequency = dailyUseCount / daysInPeriod;
      
      // Check for increasing dosage trend
      const weeklyDosages = this.getWeeklyAverageDosages(entries);
      const increasingDosage = this.detectIncreasingTrend(weeklyDosages);
      
      // Check for decreasing effectiveness
      const effectivenessRatios = this.getEffectivenessRatios(entries);
      const decreasingEffectiveness = this.detectDecreasingTrend(effectivenessRatios);
      
      // Check for withdrawal symptoms
      const withdrawalSymptoms = this.detectWithdrawalSymptoms(entries);
      
      // Evaluate severity
      let level: 'mild' | 'moderate' | 'severe' = 'mild';
      let detected = false;
      let details = '';
      
      if (usageFrequency > 0.8 && increasingDosage && decreasingEffectiveness) {
        level = 'severe';
        detected = true;
        details = 'Daily use with increasing dosage and decreasing effectiveness detected.';
      } else if ((usageFrequency > 0.7 && (increasingDosage || decreasingEffectiveness)) || withdrawalSymptoms) {
        level = 'moderate';
        detected = true;
        details = 'Frequent use with potential tolerance or dependency signs detected.';
      } else if (usageFrequency > 0.5) {
        level = 'mild';
        detected = true;
        details = 'Regular use detected. Consider occasional breaks.';
      }
      
      return {
        detected,
        level,
        details
      };
      
    } catch (error) {
      console.error('[DatabaseManager] Error detecting overuse patterns:', error);
      return { detected: false };
    }
  }

  /**
   * Check for medication interactions with cannabis
   */
  public async checkMedicationInteractions(
    medications: string[]
  ): Promise<DrugInteractionResult> {
    try {
      await this.ensureInitialized();
      
      // Known medications with potential interactions
      const highRiskMedications = [
        'warfarin', 'coumadin', 'eliquis', 'xarelto', // Blood thinners
        'celexa', 'lexapro', 'prozac', 'zoloft', 'paxil', // SSRIs
        'xanax', 'valium', 'klonopin', 'ativan', // Benzodiazepines
        'vicodin', 'percocet', 'oxycodone', 'morphine', // Opioids
        'lithium', 'lamictal', 'depakote', // Mood stabilizers
      ];
      
      const moderateRiskMedications = [
        'lisinopril', 'losartan', 'metoprolol', // Blood pressure meds
        'metformin', 'glipizide', 'insulin', // Diabetes medications
        'atorvastatin', 'simvastatin', 'lipitor', // Statins
        'albuterol', 'advair', 'spiriva', // Asthma/COPD medications
      ];
      
      // Convert all to lowercase for case-insensitive matching
      const normalizedMedications = medications.map(med => med.toLowerCase());
      
      // Check for interactions
      const highRiskMatches = highRiskMedications.filter(med => 
        normalizedMedications.some(userMed => userMed.includes(med))
      );
      
      const moderateRiskMatches = moderateRiskMedications.filter(med => 
        normalizedMedications.some(userMed => userMed.includes(med))
      );
      
      // Generate detailed information
      const details: string[] = [];
      
      if (highRiskMatches.length > 0) {
        details.push(`Potential serious interactions with: ${highRiskMatches.join(', ')}.`);
        details.push('Cannabis may significantly affect how these medications work. Consult your doctor.');
      }
      
      if (moderateRiskMatches.length > 0) {
        details.push(`Possible interactions with: ${moderateRiskMatches.join(', ')}.`);
        details.push('Monitor for changes in medication effectiveness and side effects.');
      }
      
      // Determine severity
      const hasHighRisk = highRiskMatches.length > 0;
      const hasModerateRisk = moderateRiskMatches.length > 0;
      
      const severity = hasHighRisk ? 'severe' : hasModerateRisk ? 'moderate' : undefined;
      
      return {
        hasInteractions: hasHighRisk || hasModerateRisk,
        severity,
        details: details.length > 0 ? details : undefined
      };
      
    } catch (error) {
      console.error('[DatabaseManager] Error checking drug interactions:', error);
      return {
        hasInteractions: false,
        severity: undefined
      };
    }
  }

  /**
   * Log a safety concern for a user
   */
  public async logSafetyConcern(data: {
    userId: string;
    concernType: 'overuse' | 'negative_effects' | 'interactions';
    concernDetails: string;
    timestamp: number;
    resolutionSuggestions?: string[];
    coolingOffUntil?: number;
  }): Promise<void> {
    try {
      await this.ensureInitialized();
      const db = await this.getDatabase(SAFETY_DB_NAME);
      
      // Generate unique ID
      const id = `${data.userId}_${data.concernType}_${Date.now()}`;
      
      await db.runAsync(
        `INSERT INTO ${SAFETY_DB_NAME} (
          id, user_id, concern_type, concern_details, 
          resolution_suggestions, cooling_off_until, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [
          id,
          data.userId,
          data.concernType,
          data.concernDetails,
          data.resolutionSuggestions ? JSON.stringify(data.resolutionSuggestions) : null,
          data.coolingOffUntil || null,
          data.timestamp
        ]
      );
      
      console.log('[DatabaseManager] Safety concern logged for user', data.userId);
    } catch (error) {
      console.error('[DatabaseManager] Error logging safety concern:', error);
    }
  }

  /**
   * Get safety history for a user
   */
  public async getSafetyHistory(userId: string): Promise<SafetyRecord[]> {
    try {
      await this.ensureInitialized();
      const db = await this.getDatabase(SAFETY_DB_NAME);
      
      const records = await db.getAllAsync<{
        id: string;
        user_id: string;
        concern_type: string;
        concern_details: string;
        resolution_suggestions: string | null;
        cooling_off_until: number | null;
        created_at: number;
      }>(
        `SELECT * FROM ${SAFETY_DB_NAME}
         WHERE user_id = ?
         ORDER BY created_at DESC`,
        [userId]
      );
      
      // Convert to SafetyRecord format expected by the application
      return records.map(record => ({
        id: record.id,
        user_id: record.user_id,
        concern_type: record.concern_type as 'overuse' | 'negative_effects' | 'interactions',
        concern_details: record.concern_details,
        resolution_suggestions: record.resolution_suggestions ? JSON.parse(record.resolution_suggestions) : [],
        cooling_off_until: record.cooling_off_until,
        created_at: new Date(record.created_at).toISOString()
      }));
    } catch (error) {
      console.error('[DatabaseManager] Error getting safety history:', error);
      return [];
    }
  }

  /**
   * Check if user is in cooling off period
   */
  public async checkCoolingOffStatus(userId: string): Promise<{
    inCoolingOff: boolean;
    endTime?: number;
    reason?: string;
  }> {
    try {
      await this.ensureInitialized();
      const db = await this.getDatabase(SAFETY_DB_NAME);
      
      const now = Date.now();
      
      const record = await db.getFirstAsync<{
        cooling_off_until: number;
        concern_details: string;
      }>(
        `SELECT cooling_off_until, concern_details 
         FROM ${SAFETY_DB_NAME}
         WHERE user_id = ? 
         AND cooling_off_until IS NOT NULL 
         AND cooling_off_until > ?
         ORDER BY cooling_off_until DESC 
         LIMIT 1`,
        [userId, now]
      );
      
      if (record && record.cooling_off_until) {
        return {
          inCoolingOff: true,
          endTime: record.cooling_off_until,
          reason: record.concern_details
        };
      }
      
      return { inCoolingOff: false };
    } catch (error) {
      console.error('[DatabaseManager] Error checking cooling off status:', error);
      return { inCoolingOff: false };
    }
  }

  /**
   * Get recent journal entries for a user
   */
  private async getRecentJournalEntries(userId: string, days: number): Promise<JournalEntry[]> {
    try {
      await this.ensureInitialized();
      
      // Make sure journal database is initialized
      try {
        await this.initializeJournalDb();
      } catch (error) {
        console.error('[DatabaseManager] Error ensuring journal database is initialized:', error);
        return [];
      }
      
      const db = await this.getDatabase('journal.db');
      
      const entries = await db.getAllAsync<{
        id: string;
        user_id: string;
        entry_date: number;
        strain_id: number;
        strain_name: string;
        consumption_method: string;
        dosage: number;
        dosage_unit: string;
        effects_felt: string;
        rating: number;
        effectiveness: number;
        notes: string | null;
        mood_before: string | null;
        mood_after: string | null;
        medical_symptoms_relieved: string | null;
        negative_effects: string | null;
        duration_minutes: number | null;
        created_at: number;
      }>(
        `SELECT * FROM journal_entries 
         WHERE user_id = ? AND entry_date >= ?
         ORDER BY entry_date DESC`,
        [userId, Date.now() - (days * 24 * 60 * 60 * 1000)]
      );
      
      // Convert DB rows to JournalEntry format
      return entries.map(entry => ({
        id: entry.id,
        user_id: entry.user_id,
        strain_id: entry.strain_id,
        strain_name: entry.strain_name,
        consumption_method: entry.consumption_method,
        dosage: entry.dosage,
        dosage_unit: entry.dosage_unit,
        effects_felt: entry.effects_felt ? JSON.parse(entry.effects_felt) : [],
        rating: entry.rating,
        effectiveness: entry.effectiveness,
        notes: entry.notes || undefined,
        mood_before: entry.mood_before || undefined,
        mood_after: entry.mood_after || undefined,
        medical_symptoms_relieved: entry.medical_symptoms_relieved ? JSON.parse(entry.medical_symptoms_relieved) : undefined,
        negative_effects: entry.negative_effects ? JSON.parse(entry.negative_effects) : undefined,
        duration_minutes: entry.duration_minutes || undefined,
        created_at: new Date(entry.created_at).toISOString()
      }));
      
    } catch (error) {
      console.error('[DatabaseManager] Error getting recent journal entries:', error);
      return []; 
    }
  }

  /**
   * Get weekly average dosages from journal entries
   */
  private getWeeklyAverageDosages(entries: JournalEntry[]): number[] {
    // Group entries by week and calculate average dosage
    // This is a simplified implementation
    const result: number[] = [0, 0, 0, 0];
    
    if (entries.length === 0) return result;
    
    // In an actual implementation, group entries by week and calculate averages
    
    return result;
  }

  /**
   * Get effectiveness ratios from journal entries
   */
  private getEffectivenessRatios(entries: JournalEntry[]): number[] {
    // Calculate ratio of positive to negative effects over time
    // This is a simplified implementation
    return [0.8, 0.7, 0.6, 0.5]; // Example of decreasing effectiveness
  }

  /**
   * Detect increasing trend in numeric values
   */
  private detectIncreasingTrend(values: number[]): boolean {
    // Simple trend detection - check if values are generally increasing
    if (values.length < 2) return false;
    
    let increases = 0;
    let decreases = 0;
    
    for (let i = 1; i < values.length; i++) {
      if (values[i] > values[i-1]) {
        increases++;
      } else if (values[i] < values[i-1]) {
        decreases++;
      }
    }
    
    return increases > decreases;
  }

  /**
   * Detect decreasing trend in numeric values
   */
  private detectDecreasingTrend(values: number[]): boolean {
    // Simple trend detection - check if values are generally decreasing
    if (values.length < 2) return false;
    
    let increases = 0;
    let decreases = 0;
    
    for (let i = 1; i < values.length; i++) {
      if (values[i] < values[i-1]) {
        decreases++;
      } else if (values[i] > values[i-1]) {
        increases++;
      }
    }
    
    return decreases > increases;
  }

  /**
   * Detect withdrawal symptoms from journal entries
   */
  private detectWithdrawalSymptoms(entries: JournalEntry[]): boolean {
    // Check for common withdrawal symptoms in recent entries
    // This is a simplified implementation
    const withdrawalKeywords = [
      'insomnia', 'can\'t sleep', 'trouble sleeping',
      'anxiety', 'anxious', 'nervous',
      'irritable', 'irritability', 'annoyed',
      'appetite', 'hungry', 'not hungry',
      'headache', 'migraine',
      'nausea', 'sick', 'stomach',
      'sweating', 'sweats', 'night sweats',
      'craving', 'want to use'
    ];
    
    // In a real implementation, analyze entry notes for these keywords
    
    return false;
  }

  /* ------------------------------------------------------------------
     Data Methods (Moved from DataService)
   ------------------------------------------------------------------ */

  /**
   * Get weekly statistics
   */
  public async getWeeklyStats(): Promise<DatabaseResponse<ChartDataPoint[]>> {
    try {
      await this.ensureInitialized();
      const db = await this.getDatabase(BONG_HITS_DATABASE_NAME);
      
      // Use SQL template
      const query = getWeeklyStatsQuery(BONG_HITS_DATABASE_NAME);
      const weekData = await db.getAllAsync<{ label: string; value: number; avg_duration: number }>(query);
      
      if (!weekData || weekData.length === 0) {
        return {
          success: true,
          data: []
        };
      }
      
      // Format data for chart display
      const data: ChartDataPoint[] = weekData.map(point => ({
        label: point.label,
        value: parseInt(String(point.value || 0)),
        meta: { avgDuration: Math.round(point.avg_duration || 0) }
      }));
      
      return { success: true, data };
    } catch (error) {
      return this.handleError(error, 'getWeeklyStats');
    }
  }
  
  /**
   * Get monthly statistics
   */
  public async getMonthlyStats(): Promise<DatabaseResponse<ChartDataPoint[]>> {
    try {
      await this.ensureInitialized();
      const db = await this.getDatabase(BONG_HITS_DATABASE_NAME);
      
      // Use SQL template
      const query = getMonthlyStatsQuery(BONG_HITS_DATABASE_NAME);
      const monthData = await db.getAllAsync<{ label: string; value: number; avg_duration: number }>(query);
      
      if (!monthData || monthData.length === 0) {
        return {
          success: true,
          data: []
        };
      }
      
      // Format data for chart display
      const data: ChartDataPoint[] = monthData.map(point => ({
        label: point.label,
        value: parseInt(String(point.value || 0)),
        meta: { avgDuration: Math.round(point.avg_duration || 0) }
      }));
      
      return { success: true, data };
    } catch (error) {
      return this.handleError(error, 'getMonthlyStats');
    }
  }

  /**
   * Get time distribution of usage
   */
  public async getTimeDistribution(): Promise<DatabaseResponse<TimeDistribution>> {
    try {
      await this.ensureInitialized();
      const db = await this.getDatabase(BONG_HITS_DATABASE_NAME);
      
      // Use SQL template
      const query = getTimeDistributionQuery(BONG_HITS_DATABASE_NAME, 30); // Last 30 days
      const [result] = await db.getAllAsync<DatabaseRow>(query);
      
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

      const distribution: TimeDistribution = {
        morning: Number(result.morning || 0),
        afternoon: Number(result.afternoon || 0),
        evening: Number(result.evening || 0),
        night: Number(result.night || 0)
      };

      return { success: true, data: distribution };
    } catch (error) {
      return this.handleError(error, 'getTimeDistribution');
    }
  }

  /**
   * Get usage statistics
   */
  public async getUsageStats(daysBack: number = 30): Promise<DatabaseResponse<UsageStats>> {
    try {
      await this.ensureInitialized();
      const db = await this.getDatabase(BONG_HITS_DATABASE_NAME);
      
      // First get daily hits to calculate variance
      const dailyHitsQuery = `
        SELECT COUNT(*) as daily_hits
        FROM ${BONG_HITS_DATABASE_NAME}
        WHERE timestamp >= '2024-12-24' -- Hardcoded date for testing
        GROUP BY strftime('%Y-%m-%d', timestamp)
      `;

      const dailyHits = await db.getAllAsync<{ daily_hits: number }>(dailyHitsQuery);
      
      // Handle case with no data
      if (!dailyHits.length) {
        return {
          success: true,
          data: {
            totalHits: 0,
            averageHitsPerDay: 0,
            averageHitsPerHour: 0,
            averageDuration: 0,
            totalDuration: 0,
            peakDayHits: 0,
            lowestDayHits: 0,
            mostActiveHour: 0,
            leastActiveHour: 0,
            longestHit: 0,
            shortestHit: 0,
            consistency: 0,
            weekdayStats: {
              weekday: { total: 0, avg: 0 },
              weekend: { total: 0, avg: 0 }
            }
          }
        };
      }

      // Calculate consistency score based on standard deviation of daily hits
      const hitValues = dailyHits.map(row => row.daily_hits);
      const stdDev = this.calculateStandardDeviation(hitValues);
      const mean = hitValues.reduce((a, b) => a + b, 0) / hitValues.length;
      const cv = mean > 0 ? (stdDev / mean) * 100 : 0;
      const consistencyScore = Math.min(10, 10 * Math.exp(-0.05 * cv)); // Scale to 0-10
      
      // Get main usage stats query
      const query = getUsageStatsQuery(BONG_HITS_DATABASE_NAME, daysBack);
      const statsResult = await db.getFirstAsync<RawUsageStats>(query);
      
      if (!statsResult) {
        return { success: false, error: "Failed to get usage stats" };
      }
      
      console.log(`[DatabaseManager] Raw usage stats:`, statsResult);
      
      // Get hourly distribution for most/least active hour
      const hourlyQuery = `
        SELECT 
          CAST(strftime('%H', timestamp) AS INTEGER) as hour,
          COUNT(*) as hits
        FROM ${BONG_HITS_DATABASE_NAME}
        WHERE timestamp >= '2024-12-24' -- Hardcoded date for testing
        GROUP BY hour
        ORDER BY hits DESC
      `;
      
      const hourlyResults = await db.getAllAsync<{ hour: number, hits: number }>(hourlyQuery);
      const mostActiveHour = hourlyResults.length > 0 ? hourlyResults[0].hour : 0;
      const leastActiveHour = hourlyResults.length > 0 ? hourlyResults[hourlyResults.length - 1].hour : 0;
      
      // Get min/max duration
      const durationQuery = `
        SELECT 
          MIN(duration_ms) as min_duration,
          MAX(duration_ms) as max_duration
        FROM ${BONG_HITS_DATABASE_NAME}
        WHERE timestamp >= '2024-12-24' -- Hardcoded date for testing
      `;
      
      const durationResult = await db.getFirstAsync<{ min_duration: number, max_duration: number }>(durationQuery);
      
      // Calculate weekday vs weekend stats
      const weekdayQuery = `
        WITH DayStats AS (
          SELECT 
            CASE WHEN strftime('%w', timestamp) IN ('0', '6') THEN 'weekend' ELSE 'weekday' END as day_type,
            strftime('%Y-%m-%d', timestamp) as date,
            COUNT(*) as hits
          FROM ${BONG_HITS_DATABASE_NAME}
          WHERE timestamp >= '2024-12-24' -- Hardcoded date for testing
          GROUP BY day_type, date
        )
        SELECT 
          day_type,
          SUM(hits) as total_hits,
          AVG(hits) as avg_hits
        FROM DayStats
        GROUP BY day_type
      `;
      
      const weekdayResults = await db.getAllAsync<{ day_type: string, total_hits: number, avg_hits: number }>(weekdayQuery);
      
      const weekdayStats = {
        weekday: { total: 0, avg: 0 },
        weekend: { total: 0, avg: 0 }
      };
      
      weekdayResults.forEach(row => {
        if (row.day_type === 'weekday') {
          weekdayStats.weekday.total = row.total_hits;
          weekdayStats.weekday.avg = row.avg_hits;
        } else {
          weekdayStats.weekend.total = row.total_hits;
          weekdayStats.weekend.avg = row.avg_hits;
        }
      });
      
      // Create final stats object
      const stats: UsageStats = {
        totalHits: statsResult.total_hits,
        averageHitsPerDay: statsResult.avg_hits_per_active_day, // Use avg per active day instead of dividing by fixed period
        averageHitsPerHour: statsResult.total_hits / 24 / statsResult.active_days, // Also adjust hourly rate by active days
        averageDuration: statsResult.avg_duration_ms,
        totalDuration: statsResult.total_duration_ms,
        peakDayHits: statsResult.max_hits_in_day,
        lowestDayHits: Math.min(...hitValues),
        mostActiveHour: mostActiveHour,
        leastActiveHour: leastActiveHour,
        longestHit: durationResult?.max_duration || 0,
        shortestHit: durationResult?.min_duration || 0,
        consistency: Number(consistencyScore.toFixed(2)),
        weekdayStats
      };
      
      console.log(`[DatabaseManager] Processed usage stats:`, stats);
      
      return {
        success: true,
        data: stats
      };
    } catch (error) {
      return this.handleError(error, "getUsageStats");
    }
  }

  /**
   * Initialize a journal database
   */
  private async initializeJournalDb(): Promise<void> {
    try {
      const db = await this.getDatabase('journal.db');
      await db.execAsync(
        'PRAGMA journal_mode = WAL;' +
        `CREATE TABLE IF NOT EXISTS journal_entries (
          id TEXT PRIMARY KEY NOT NULL,
          user_id TEXT NOT NULL,
          entry_date INTEGER NOT NULL,
          strain_id INTEGER NOT NULL,
          strain_name TEXT NOT NULL,
          consumption_method TEXT NOT NULL,
          dosage REAL NOT NULL,
          dosage_unit TEXT NOT NULL,
          effects_felt TEXT NOT NULL,
          rating INTEGER NOT NULL,
          effectiveness INTEGER NOT NULL,
          notes TEXT,
          mood_before TEXT,
          mood_after TEXT,
          medical_symptoms_relieved TEXT,
          negative_effects TEXT,
          duration_minutes INTEGER,
          created_at INTEGER NOT NULL
        );` +
        `CREATE INDEX IF NOT EXISTS idx_journal_user_id ON journal_entries(user_id);` +
        `CREATE INDEX IF NOT EXISTS idx_journal_entry_date ON journal_entries(entry_date);` +
        `CREATE INDEX IF NOT EXISTS idx_journal_strain_id ON journal_entries(strain_id);` +
        `CREATE INDEX IF NOT EXISTS idx_journal_strain_name ON journal_entries(strain_name);` +
        `CREATE INDEX IF NOT EXISTS idx_journal_consumption_method ON journal_entries(consumption_method);` +
        `CREATE INDEX IF NOT EXISTS idx_journal_rating ON journal_entries(rating);` +
        `CREATE INDEX IF NOT EXISTS idx_journal_effectiveness ON journal_entries(effectiveness);`
      );
      
      console.log('[DatabaseManager] Journal database initialized');
    } catch (error) {
      throw this.handleDatabaseError(error, 'initializeJournalDb');
    }
  }

  /**
   * Get all bong hit logs from the database
   */
  public async getAllBongHitLogs(): Promise<DatabaseResponse<BongHit[]>> {
    try {
      await this.ensureInitialized();
      const db = await this.getDatabase(BONG_HITS_DATABASE_NAME);
      const results = await db.getAllAsync<BongHit>(`
        SELECT 
          timestamp,
          duration_ms
        FROM ${BONG_HITS_DATABASE_NAME}
        ORDER BY timestamp DESC
      `);

      console.log('[DatabaseManager] Retrieved', results.length, 'bong hit logs');
      return {
        success: true,
        data: results
      };
    } catch (error) {
      return this.handleError(error, 'getAllBongHitLogs');
    }
  }

  /**
   * Check if two SQL types are compatible
   * @param actual The actual type from the database
   * @param expected The expected type from the schema definition
   * @returns Whether the types are compatible
   */
  private isCompatibleType(actual: string, expected: string): boolean {
    actual = actual.toUpperCase();
    expected = expected.toUpperCase();
    
    // Check integer types
    if (expected.includes('INTEGER') || expected.includes('INT')) {
      return actual.includes('INT') || actual.includes('INTEGER') || actual.includes('BIGINT');
    }
    
    // Check text types
    if (expected.includes('TEXT')) {
      return actual.includes('TEXT') || actual.includes('CHAR') || actual.includes('CLOB');
    }
    
    // Check real/float types
    if (expected.includes('REAL') || expected.includes('FLOAT')) {
      return actual.includes('REAL') || actual.includes('FLOA') || actual.includes('DOUB');
    }
    
    // Default to exact match
    return actual === expected;
  }

  /**
   * Validate column type in database table
   * @param db Database connection
   * @param table Table name
   * @param column Column name
   * @param expectedType Expected column type
   * @returns Whether the column has a compatible type
   */
  private async validateColumnType(db: SQLiteDatabase, table: string, column: string, expectedType: string): Promise<boolean> {
    const tableInfo = await db.getAllAsync<{name: string, type: string}>(`PRAGMA table_info(${table})`);
    const columnInfo = tableInfo.find(info => info.name === column);
    
    if (!columnInfo) return false;
    return this.isCompatibleType(columnInfo.type, expectedType);
  }

  /**
   * Validate that a table schema contains all required columns
   * @param db Database connection
   * @param table Table name
   * @param requiredColumns Column names that must exist in the table
   * @returns Whether all required columns exist
   */
  private async validateTableSchema(db: SQLiteDatabase, table: string, requiredColumns: string[]): Promise<boolean> {
    const tableInfo = await db.getAllAsync<{name: string}>(`PRAGMA table_info(${table})`);
    const columnNames = tableInfo.map(col => col.name);
    
    // Check if all required columns exist
    return requiredColumns.every(col => columnNames.includes(col));
  }

  /**
   * Calculate the standard deviation of an array of numbers
   */
  private calculateStandardDeviation(values: number[]): number {
    if (values.length === 0) return 0;
    
    const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
    const squaredDifferences = values.map(val => Math.pow(val - mean, 2));
    const variance = squaredDifferences.reduce((sum, val) => sum + val, 0) / values.length;
    
    return Math.sqrt(variance);
  }
}

// Export a singleton instance for backwards compatibility
export const databaseManager = DatabaseManager.getInstance();

// Export functions for backwards compatibility with the original module API
export async function isFirstLaunch(): Promise<boolean> {
  return databaseManager.isFirstLaunch();
}

export async function initializeAppOnFirstLaunch(): Promise<void> {
  return databaseManager.initializeAppOnFirstLaunch();
}

export async function initializeAsyncDb(): Promise<void> {
  // This is now handled by the DatabaseManager initialize method
  await databaseManager.initialize();
}

export async function getBongHitStatsFromPastWeek(): Promise<BongHitStats> {
  return databaseManager.getBongHitStatsFromPastWeek();
}

export async function queryNumberOfHitsFromPastWeek(): Promise<Datapoint[]> {
  return databaseManager.queryNumberOfHitsFromPastWeek();
}

export async function getDailyAverageDatapoints(): Promise<AverageHourCount[]> {
  return databaseManager.getDailyAverageDatapoints();
}

export async function getDailyStats(timeRange: string) {
  return databaseManager.getDailyStats(timeRange);
}

export async function getSavedDevices(): Promise<SavedDevice[]> {
  return databaseManager.getSavedDevices();
}

export async function saveDevices(devices: Device[]): Promise<void> {
  return databaseManager.saveDevices(devices);
} 