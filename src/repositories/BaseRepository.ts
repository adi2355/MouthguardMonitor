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
      console.log('[Transaction] Beginning transaction...');
      await this.db.execAsync('BEGIN TRANSACTION');
      console.log('[Transaction] Transaction started, executing operations...');
      
      const result = await operations();
      
      console.log('[Transaction] Operations completed successfully, committing transaction...');
      await this.db.execAsync('COMMIT');
      console.log('[Transaction] Transaction committed.');
      return result;
    } catch (error) {
      console.error('[Transaction] Error during transaction, rolling back:', error);
      
      // Try to get more specific error info
      let errorMessage = 'Unknown error';
      if (error instanceof Error) {
        errorMessage = error.message;
        console.error('[Transaction] Error details:', {
          message: error.message,
          name: error.name,
          stack: error.stack
        });
      } else {
        console.error('[Transaction] Non-Error object thrown:', error);
      }
      
      try {
        console.log('[Transaction] Attempting to roll back transaction...');
        await this.db.execAsync('ROLLBACK');
        console.log('[Transaction] Transaction rolled back successfully.');
      } catch (rollbackError) {
        console.error('[Transaction] Error rolling back transaction:', rollbackError);
        if (rollbackError instanceof Error) {
          console.error('[Transaction] Rollback error details:', {
            message: rollbackError.message,
            name: rollbackError.name,
            stack: rollbackError.stack
          });
        }
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