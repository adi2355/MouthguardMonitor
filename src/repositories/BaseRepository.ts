import { SQLiteDatabase } from "expo-sqlite";
import { DatabaseResponse } from "../types";

/**
 * Base Repository class that all repositories will extend
 * Provides common functionality like transaction management
 */
export class BaseRepository {
  protected db: SQLiteDatabase;

  /**
   * Constructor for the repository
   * @param db SQLiteDatabase instance from DatabaseManager
   */
  constructor(db: SQLiteDatabase) {
    this.db = db;
  }

  /**
   * Execute multiple database operations in a transaction
   * @param operations Function containing database operations to execute in transaction
   * @returns Result of operations
   */
  protected async executeTransaction<T>(operations: () => Promise<T>): Promise<T> {
    try {
      await this.db.execAsync('BEGIN TRANSACTION');
      const result = await operations();
      await this.db.execAsync('COMMIT');
      return result;
    } catch (error) {
      console.error('[Transaction] Error during transaction, rolling back:', error);
      try {
        await this.db.execAsync('ROLLBACK');
      } catch (rollbackError) {
        console.error('[Transaction] Error rolling back transaction:', rollbackError);
      }
      throw error;
    }
  }

  /**
   * Standard error handler for database operations
   * @param error The error that occurred
   * @param operation Description of the operation that failed
   * @returns Standardized error response
   */
  protected handleError<T>(error: unknown, operation: string): DatabaseResponse<T> {
    const errorMessage = error instanceof Error ? error.message : `Failed to ${operation}`;
    console.error(`[Repository] Error in ${operation}:`, error);
    return {
      success: false,
      error: errorMessage
    };
  }
} 