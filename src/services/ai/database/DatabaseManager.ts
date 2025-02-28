import { openDatabaseAsync, SQLiteDatabase } from "expo-sqlite";
import * as FileSystem from 'expo-file-system';
import * as Logger from '../utils/logging';

// Import constants
import { 
  AI_USAGE_DB_NAME, 
  RECOMMENDATION_FEEDBACK_DB_NAME, 
  CACHE_DB_NAME 
} from '../types/common';

const MODULE_NAME = 'DatabaseManager';

/**
 * Database Manager class
 * Handles database connections and initialization
 */
export class DatabaseManager {
  private static instance: DatabaseManager;
  private usageDb: SQLiteDatabase | null = null;
  private feedbackDb: SQLiteDatabase | null = null;
  private cacheDb: SQLiteDatabase | null = null;
  private initialized: boolean = false;

  private constructor() {
    // Private constructor to enforce singleton pattern
  }

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
   * Initialize all databases
   */
  public async initialize(): Promise<void> {
    if (this.initialized) {
      Logger.debug(MODULE_NAME, 'Databases already initialized');
      return;
    }

    try {
      Logger.info(MODULE_NAME, 'Initializing databases...');
      
      // Initialize usage database
      try {
        this.usageDb = await this.openDatabase(AI_USAGE_DB_NAME);
        await this.initializeUsageDb();
        Logger.info(MODULE_NAME, 'Usage database initialized successfully');
      } catch (error) {
        Logger.logError(MODULE_NAME, error as Error, 'Failed to initialize usage database');
      }
      
      // Initialize feedback database
      try {
        this.feedbackDb = await this.openDatabase(RECOMMENDATION_FEEDBACK_DB_NAME);
        await this.initializeFeedbackDb();
        Logger.info(MODULE_NAME, 'Feedback database initialized successfully');
      } catch (error) {
        Logger.logError(MODULE_NAME, error as Error, 'Failed to initialize feedback database');
      }
      
      // Initialize cache database
      try {
        this.cacheDb = await this.openDatabase(CACHE_DB_NAME);
        await this.initializeCacheDb();
        Logger.info(MODULE_NAME, 'Cache database initialized successfully');
      } catch (error) {
        Logger.logError(MODULE_NAME, error as Error, 'Failed to initialize cache database');
      }
      
      // Mark as initialized if at least one database was successfully initialized
      if (this.usageDb || this.feedbackDb || this.cacheDb) {
        this.initialized = true;
        Logger.info(MODULE_NAME, 'Database initialization completed with some databases available');
      } else {
        Logger.error(MODULE_NAME, 'Failed to initialize any databases');
        throw new Error('Failed to initialize any databases');
      }
    } catch (error) {
      Logger.logError(MODULE_NAME, error as Error, 'Failed to initialize databases');
      throw error;
    }
  }

  /**
   * Get the usage database instance
   */
  public getUsageDb(): SQLiteDatabase {
    if (!this.usageDb) {
      if (!this.initialized) {
        Logger.warn(MODULE_NAME, 'Database not initialized, attempting to initialize now');
        this.initialize().catch(error => {
          Logger.logError(MODULE_NAME, error as Error, 'Failed to initialize database on demand');
        });
      }
      throw new Error('Usage database not initialized');
    }
    return this.usageDb;
  }

  /**
   * Get the feedback database instance
   */
  public getFeedbackDb(): SQLiteDatabase {
    if (!this.feedbackDb) {
      if (!this.initialized) {
        Logger.warn(MODULE_NAME, 'Database not initialized, attempting to initialize now');
        this.initialize().catch(error => {
          Logger.logError(MODULE_NAME, error as Error, 'Failed to initialize database on demand');
        });
      }
      throw new Error('Feedback database not initialized');
    }
    return this.feedbackDb;
  }

  /**
   * Get the cache database instance
   */
  public getCacheDb(): SQLiteDatabase {
    if (!this.cacheDb) {
      if (!this.initialized) {
        Logger.warn(MODULE_NAME, 'Database not initialized, attempting to initialize now');
        this.initialize().catch(error => {
          Logger.logError(MODULE_NAME, error as Error, 'Failed to initialize database on demand');
        });
      }
      throw new Error('Cache database not initialized');
    }
    return this.cacheDb;
  }

  /**
   * Open a database with the given name
   */
  private async openDatabase(dbName: string): Promise<SQLiteDatabase> {
    try {
      Logger.debug(MODULE_NAME, `Opening database: ${dbName}`);
      return await openDatabaseAsync(dbName);
    } catch (error) {
      Logger.logError(MODULE_NAME, error as Error, `Failed to open database: ${dbName}`);
      throw error;
    }
  }

  /**
   * Initialize the usage database schema
   */
  private async initializeUsageDb(): Promise<void> {
    try {
      Logger.debug(MODULE_NAME, 'Initializing usage database schema');
      await this.usageDb?.execAsync(`
        CREATE TABLE IF NOT EXISTS ai_usage (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          user_id TEXT NOT NULL,
          request_type TEXT NOT NULL,
          tokens_used INTEGER NOT NULL,
          timestamp INTEGER NOT NULL
        );
      `);
    } catch (error) {
      Logger.logError(MODULE_NAME, error as Error, 'Failed to initialize usage database schema');
      throw error;
    }
  }

  /**
   * Initialize the feedback database schema
   */
  private async initializeFeedbackDb(): Promise<void> {
    try {
      Logger.debug(MODULE_NAME, 'Initializing feedback database schema');
      
      // Create user feedback table
      await this.feedbackDb?.execAsync(`
        CREATE TABLE IF NOT EXISTS user_feedback (
          id TEXT PRIMARY KEY,
          user_id TEXT NOT NULL,
          response_id TEXT NOT NULL,
          response_type TEXT NOT NULL,
          helpful INTEGER NOT NULL,
          accurate INTEGER NOT NULL,
          relevance INTEGER NOT NULL,
          comments TEXT,
          timestamp INTEGER NOT NULL
        );
      `);
      
      // Create response quality scores table
      await this.feedbackDb?.execAsync(`
        CREATE TABLE IF NOT EXISTS response_quality_scores (
          id TEXT PRIMARY KEY,
          response_id TEXT NOT NULL,
          overall_score REAL NOT NULL,
          relevance_score REAL NOT NULL,
          accuracy_score REAL NOT NULL,
          comprehensiveness_score REAL NOT NULL,
          safety_score REAL NOT NULL,
          strengths TEXT NOT NULL,
          weaknesses TEXT NOT NULL,
          improvement_suggestions TEXT NOT NULL,
          timestamp INTEGER NOT NULL
        );
      `);
      
      // Create feedback patterns table
      await this.feedbackDb?.execAsync(`
        CREATE TABLE IF NOT EXISTS feedback_patterns (
          pattern_id TEXT PRIMARY KEY,
          response_type TEXT NOT NULL,
          user_profile_factors TEXT NOT NULL,
          request_factors TEXT NOT NULL,
          positive_outcome_rate REAL NOT NULL,
          sample_size INTEGER NOT NULL,
          last_updated INTEGER NOT NULL
        );
      `);
    } catch (error) {
      Logger.logError(MODULE_NAME, error as Error, 'Failed to initialize feedback database schema');
      throw error;
    }
  }

  /**
   * Initialize the cache database schema
   */
  private async initializeCacheDb(): Promise<void> {
    try {
      Logger.debug(MODULE_NAME, 'Initializing cache database schema');
      await this.cacheDb?.execAsync(`
        CREATE TABLE IF NOT EXISTS ai_response_cache (
          key TEXT PRIMARY KEY,
          data TEXT NOT NULL,
          timestamp INTEGER NOT NULL,
          expires_at INTEGER NOT NULL,
          ttl INTEGER NOT NULL,
          hit_count INTEGER NOT NULL DEFAULT 0,
          last_accessed INTEGER NOT NULL
        );
      `);
    } catch (error) {
      Logger.logError(MODULE_NAME, error as Error, 'Failed to initialize cache database schema');
      throw error;
    }
  }

  /**
   * Close all database connections
   */
  public async closeAll(): Promise<void> {
    try {
      Logger.info(MODULE_NAME, 'Closing all database connections');
      
      if (this.usageDb) {
        await this.usageDb.closeAsync();
        this.usageDb = null;
      }
      
      if (this.feedbackDb) {
        await this.feedbackDb.closeAsync();
        this.feedbackDb = null;
      }
      
      if (this.cacheDb) {
        await this.cacheDb.closeAsync();
        this.cacheDb = null;
      }
      
      this.initialized = false;
      Logger.info(MODULE_NAME, 'All database connections closed');
    } catch (error) {
      Logger.logError(MODULE_NAME, error as Error, 'Failed to close database connections');
      throw error;
    }
  }
} 