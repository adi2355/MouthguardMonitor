import { SQLiteDatabase } from "expo-sqlite";
import { databaseManager } from "../DatabaseManager";
import { 
  ChartDataPoint, 
  BongHitStats, 
  AverageHourCount, 
  Datapoint, 
  BongHit 
} from "../types";
import { Strain } from "../types";
import { 
  Achievement, 
  UserAchievement, 
  UserAchievementWithDetails 
} from "../types/achievements";

/**
 * ExpoSQLiteManager - Manager for all SQLite database operations
 * Delegates to the centralized DatabaseManager
 */
export class ExpoSQLiteManager {
  private static instance: ExpoSQLiteManager;

  public static getInstance(): ExpoSQLiteManager {
    if (!ExpoSQLiteManager.instance) {
      ExpoSQLiteManager.instance = new ExpoSQLiteManager();
    }
    return ExpoSQLiteManager.instance;
  }

  private constructor() {}

  /**
   * Initialize the database
   */
  public async initialize(): Promise<void> {
    return databaseManager.initialize();
  }

  /**
   * Ensure the database is initialized
   */
  public async ensureInitialized(): Promise<void> {
    return databaseManager.ensureInitialized();
  }

  /**
   * Get a database connection by name
   */
  public async getDatabase(dbName: string): Promise<SQLiteDatabase> {
    return databaseManager.getDatabase(dbName);
  }

  /**
   * Execute a transaction on a specific database
   */
  public async executeTransaction<T>(
    db: SQLiteDatabase, 
    operations: () => Promise<T>
  ): Promise<T> {
    return databaseManager.executeTransaction(db, operations);
  }

  /**
   * Execute a transaction by database name
   */
  public async executeTransactionByName<T>(
    dbName: string, 
    operations: (db: SQLiteDatabase) => Promise<T>
  ): Promise<T> {
    return databaseManager.executeTransactionByName(dbName, operations);
  }

  /**
   * Clean up database connections
   */
  public async cleanup(): Promise<void> {
    return databaseManager.cleanup();
  }

  /* ------------------------------------------------------------------
     BongHits Data Methods
   ------------------------------------------------------------------ */

  /**
   * Get bong hit statistics from the past week
   */
  public async getBongHitStatsFromPastWeek(): Promise<BongHitStats> {
    return databaseManager.getBongHitStatsFromPastWeek();
  }

  /**
   * Query number of hits from the past week
   */
  public async queryNumberOfHitsFromPastWeek(): Promise<Datapoint[]> {
    return databaseManager.queryNumberOfHitsFromPastWeek();
  }

  /**
   * Get daily average datapoints
   */
  public async getDailyAverageDatapoints(): Promise<AverageHourCount[]> {
    return databaseManager.getDailyAverageDatapoints();
  }

  /**
   * Get daily statistics by time range
   */
  public async getDailyStats(timeRange: string) {
    return databaseManager.getDailyStats(timeRange);
  }

  /**
   * Record a new bong hit
   */
  public async recordBongHit(timestamp: string, durationMs: number): Promise<void> {
    return databaseManager.recordBongHit(timestamp, durationMs);
  }

  /* ------------------------------------------------------------------
     Strain Data Methods
   ------------------------------------------------------------------ */

  /**
   * Get strain by ID
   */
  public async getStrainById(id: number): Promise<Strain | null> {
    const db = await databaseManager.getDatabase("strains");
    const results = await db.getAllAsync<Strain>(
      `SELECT * FROM strains WHERE id = ? LIMIT 1`,
      [id]
    );
    return results[0] || null;
  }

  /**
   * Get popular strains
   */
  public async getPopularStrains(limit: number = 10): Promise<Strain[]> {
    const db = await databaseManager.getDatabase("strains");
    const results = await db.getAllAsync<Strain>(
      `SELECT * FROM strains ORDER BY combined_rating DESC LIMIT ?`,
      [limit]
    );
    return results || [];
  }

  /* ------------------------------------------------------------------
     Achievement Methods
   ------------------------------------------------------------------ */

  /**
   * Get user achievements
   */
  public async getUserAchievements(userId: string): Promise<UserAchievementWithDetails[]> {
    return databaseManager.getUserAchievements(userId);
  }

  /**
   * Check achievements for a user action
   */
  public async checkAchievements(
    userId: string, 
    actionType: string, 
    data: any
  ): Promise<UserAchievementWithDetails[]> {
    return databaseManager.checkAchievements(userId, actionType, data);
  }

  /**
   * Update achievement progress
   */
  public async updateAchievementProgress(
    userId: string, 
    achievementId: number, 
    progress: number, 
    data?: any
  ): Promise<void> {
    return databaseManager.updateAchievementProgress(userId, achievementId, progress, data);
  }

  /**
   * Clear the 'new' flags on user achievements
   */
  public async clearAchievementNewFlags(userId: string): Promise<void> {
    return databaseManager.clearAchievementNewFlags(userId);
  }
}

// Export a singleton instance
export const expoSqliteManager = ExpoSQLiteManager.getInstance();

// For backwards compatibility with the original module API
export async function initialize(): Promise<void> {
  return expoSqliteManager.initialize();
}

export async function getDatabase(dbName: string): Promise<SQLiteDatabase> {
  return expoSqliteManager.getDatabase(dbName);
}

export async function executeTransaction<T>(
  db: SQLiteDatabase, 
  operations: () => Promise<T>
): Promise<T> {
  return expoSqliteManager.executeTransaction(db, operations);
}

export async function cleanup(): Promise<void> {
  return expoSqliteManager.cleanup();
}

export default expoSqliteManager;