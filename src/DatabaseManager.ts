// File: src/DatabaseManager.ts
// Renamed from dbManager.ts to better reflect the class-based architecture

import AsyncStorage from "@react-native-async-storage/async-storage";
import { openDatabaseAsync, SQLiteDatabase } from "expo-sqlite";
import {
  BONG_HITS_DATABASE_NAME,
  STRAINS_DATABASE_NAME,
  SAMPLE_STRAINS,
  ACHIEVEMENTS,
  ACHIEVEMENT_ICONS,
  ACHIEVEMENT_TRIGGERS
} from "./constants";
import { 
  BongHitStats, 
  Datapoint, 
  AverageHourCount, 
  SavedDevice, 
  Strain, 
  DatabaseResponse, 
  ChartDataPoint
} from "./types";
import { 
  Achievement, 
  UserAchievement, 
  UserAchievementWithDetails 
} from "./types/achievements";
import { Device } from 'react-native-ble-plx';

const FIRST_LAUNCH_KEY = "hasLaunched";
const SAVED_DEVICES_KEY: string = 'savedDevices';
const DB_VERSION_KEY = "dbVersion";
const CURRENT_DB_VERSION = 1; // Increment this when schema changes
const SAFETY_DB_NAME = "SafetyRecords"; // Define safety DB name here since it's not in constants
const ACHIEVEMENTS_DB_NAME = "achievements.db"; // Achievements database name

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
 * Uses singleton pattern to ensure only one instance exists
 */
export class DatabaseManager {
  private static instance: DatabaseManager;
  private databaseConnections: Map<string, SQLiteDatabase> = new Map();
  private initialized: boolean = false;
  private initializationPromise: Promise<void> | null = null;
  private migrationLock: boolean = false;

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
  public async initialize(): Promise<void> {
    if (this.initializationPromise) {
      // If initialization is already in progress, return that promise
      return this.initializationPromise;
    }

    this.initializationPromise = this.doInitialize();
    try {
      await this.initializationPromise;
      this.initialized = true;
    } finally {
      this.initializationPromise = null;
    }
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

      console.log('[DatabaseManager] All databases initialized successfully');
    } catch (error) {
      console.error('[DatabaseManager] Error initializing databases:', error);
      throw error;
    }
  }

  /**
   * Run migrations from the current version to the latest version
   */
  private async runMigrations(currentVersion: number): Promise<void> {
    // Prevent concurrent migrations
    if (this.migrationLock) {
      throw new Error('Migration already in progress');
    }
    
    try {
      this.migrationLock = true;
      console.log(`[DatabaseManager] Running migrations from version ${currentVersion} to ${CURRENT_DB_VERSION}`);
      
      // Apply migrations sequentially
      for (let version = currentVersion + 1; version <= CURRENT_DB_VERSION; version++) {
        console.log(`[DatabaseManager] Applying migration to version ${version}`);
        await this.applyMigration(version);
      }
      
      console.log('[DatabaseManager] All migrations completed successfully');
    } finally {
      this.migrationLock = false;
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
          name TEXT NOT NULL,
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
        ON ${STRAINS_DATABASE_NAME}(combined_rating DESC);`
      );

      // Check if strains already exist to avoid duplicate insertion
      const results = await db.getAllAsync<{count: number}>(`SELECT COUNT(*) as count FROM ${STRAINS_DATABASE_NAME}`);
      if (!results.length) {
        // Insert sample strain data if no results or count is 0
        await this.insertStrainData(db);
        console.log('[DatabaseManager] Sample strain data inserted');
      } else {
        const count = results[0];
        if (count.count === 0) {
          await this.insertStrainData(db);
          console.log('[DatabaseManager] Sample strain data inserted after count check');
        } else {
          console.log(`[DatabaseManager] Strains database already contains ${count.count} records`);
        }
      }
      
      console.log('[DatabaseManager] Strains database initialized');
    } catch (error) {
      console.error('[DatabaseManager] Error initializing Strains database:', error);
      throw error;
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
        ON ${SAFETY_DB_NAME}(created_at);`
      );
      
      console.log('[DatabaseManager] Safety database initialized');
    } catch (error) {
      console.error('[DatabaseManager] Error initializing Safety database:', error);
      throw error;
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
        await this.executeTransaction(db, async () => {
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
      console.log('[DatabaseManager] Starting strain data insertion...');
      
      // Use a transaction for better performance and data integrity
      await this.executeTransaction(db, async () => {
        // Insert strains in batches for better performance
        const batchSize = 50;
        for (let i = 0; i < SAMPLE_STRAINS.length; i += batchSize) {
          const batch = SAMPLE_STRAINS.slice(i, i + batchSize);
          
          const placeholders = batch.map(() => 
            '(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
          ).join(',');
  
          const values = batch.flatMap((strain: Strain) => [
            strain.name,
            strain.overview,
            strain.genetic_type,
            strain.lineage,
            strain.thc_range,
            strain.cbd_level,
            strain.dominant_terpenes,
            strain.qualitative_insights,
            strain.effects,
            strain.negatives,
            strain.uses,
            strain.thc_rating,
            strain.user_rating,
            strain.combined_rating
          ]);
  
          await db.runAsync(
            `INSERT OR IGNORE INTO ${STRAINS_DATABASE_NAME} (
              name, overview, genetic_type, lineage, thc_range,
              cbd_level, dominant_terpenes, qualitative_insights,
              effects, negatives, uses, thc_rating,
              user_rating, combined_rating
            ) VALUES ${placeholders}`,
            values
          );
        }
      });

      console.log('[DatabaseManager] Strain data insertion completed');
    } catch (error) {
      console.error('[DatabaseManager] Error inserting strain data:', error);
      throw error;
    }
  }

  /**
   * Execute operations in a transaction for a specific database
   * @param db Database connection to use
   * @param operations Function containing operations to execute within the transaction
   * @returns Result of the operations
   */
  public async executeTransaction<T>(
    db: SQLiteDatabase, 
    operations: () => Promise<T>
  ): Promise<T> {
    try {
      await db.execAsync('BEGIN TRANSACTION');
      const result = await operations();
      await db.execAsync('COMMIT');
      return result;
    } catch (error) {
      // Rollback on error
      try {
        await db.execAsync('ROLLBACK');
      } catch (rollbackError) {
        console.error('[DatabaseManager] Error rolling back transaction:', rollbackError);
      }
      console.error('[DatabaseManager] Transaction failed:', error);
      throw error;
    }
  }

  /**
   * Execute operations in a transaction for a specific database by name
   * @param dbName Name of the database
   * @param operations Function containing operations to execute within the transaction
   * @returns Result of the operations
   */
  public async executeTransactionByName<T>(
    dbName: string, 
    operations: (db: SQLiteDatabase) => Promise<T>
  ): Promise<T> {
    const db = await this.getDatabase(dbName);
    return this.executeTransaction(db, async () => operations(db));
  }

  /**
   * Get a database connection by name, creating it if it doesn't exist
   */
  public async getDatabase(dbName: string): Promise<SQLiteDatabase> {
    // First check if we already have an open connection
    if (this.databaseConnections.has(dbName)) {
      const db = this.databaseConnections.get(dbName);
      if (db) return db;
    }
    
    try {
      // Open the database and store the connection
      const db = await openDatabaseAsync(dbName);
      this.databaseConnections.set(dbName, db);
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
    if (!this.initialized) {
      await this.initialize();
    }
  }

  /**
   * Close all database connections
   */
  public async cleanup(): Promise<void> {
    try {
      console.log('[DatabaseManager] Closing all database connections...');
      
      for (const [name, db] of this.databaseConnections.entries()) {
        try {
          await db.closeAsync();
          console.log(`[DatabaseManager] Closed database: ${name}`);
        } catch (closeError) {
          console.error(`[DatabaseManager] Error closing database ${name}:`, closeError);
        }
      }
      
      this.databaseConnections.clear();
      this.initialized = false;
      console.log('[DatabaseManager] All database connections closed');
    } catch (error) {
      console.error('[DatabaseManager] Error during cleanup:', error);
      throw error;
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
      await this.ensureInitialized();
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
      
      // Convert SQLite's numeric booleans to actual booleans
      return results.map(achievement => ({
        ...achievement,
        isUnlocked: Boolean(achievement.isUnlocked),
        isNew: Boolean(achievement.isNew)
      }));
    } catch (error) {
      console.error('[DatabaseManager] Failed to get user achievements:', error);
      return [];
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
   * Ensure all achievements are in the user's record
   */
  private async ensureUserAchievements(userId: string): Promise<void> {
    try {
      await this.ensureInitialized();
      const db = await this.getDatabase(ACHIEVEMENTS_DB_NAME);
      
      // Get all achievement IDs
      const achievements = await db.getAllAsync<{id: number}>('SELECT id FROM achievements');
      
      // Get user's existing achievement entries
      const userAchievements = await db.getAllAsync<{achievement_id: number}>(
        'SELECT achievement_id FROM user_achievements WHERE user_id = ?',
        [userId]
      );
      
      const existingIds = new Set(userAchievements.map(ua => ua.achievement_id));
      
      // Create missing entries
      await this.executeTransaction(db, async () => {
        for (const achievement of achievements) {
          if (!existingIds.has(achievement.id)) {
            await db.runAsync(
              `INSERT INTO user_achievements (user_id, achievement_id, progress) VALUES (?, ?, 0)`,
              [userId, achievement.id]
            );
          }
        }
      });
    } catch (error) {
      console.error('[DatabaseManager] Failed to ensure user achievements:', error);
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
    // Return achievements from constants
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
            WHERE date(timestamp) = date('now')
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
            WHERE date(timestamp) = date('now')
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
    try {
      await this.ensureInitialized();
      const db = await this.getDatabase(BONG_HITS_DATABASE_NAME);
      
      await db.runAsync(
        `INSERT INTO ${BONG_HITS_DATABASE_NAME} (timestamp, duration_ms) VALUES (?, ?)`,
        [timestamp, durationMs]
      );
      
      console.log(`[DatabaseManager] Recorded bong hit: ${timestamp}, duration: ${durationMs}ms`);
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