import { databaseManager } from "../DatabaseManager";
import { asyncStorageManager } from "./asyncStorageManager";
import { expoSqliteManager } from "./expoSqliteManager";
import { DatabaseService } from "../services/DatabaseService";
import { 
  BONG_HITS_DATABASE_NAME, 
  STRAINS_DATABASE_NAME 
} from "../constants";

/**
 * DbValidator - Utility to validate the database implementation
 * Runs a series of checks to verify that everything is working correctly
 */
export class DbValidator {
  public static async validateDatabaseSetup(): Promise<ValidationResult> {
    console.log('[DbValidator] Starting database validation...');
    const results: ValidationResult = {
      success: true,
      errors: [],
      warnings: [],
      componentResults: {},
    };

    // Validate database manager
    try {
      await this.validateDatabaseManager(results);
    } catch (error) {
      results.success = false;
      results.errors.push(`DatabaseManager validation failed: ${error instanceof Error ? error.message : String(error)}`);
    }

    // Validate AsyncStorage manager
    try {
      await this.validateAsyncStorageManager(results);
    } catch (error) {
      results.success = false;
      results.errors.push(`AsyncStorageManager validation failed: ${error instanceof Error ? error.message : String(error)}`);
    }

    // Validate ExpoSQLite manager
    try {
      await this.validateExpoSqliteManager(results);
    } catch (error) {
      results.success = false;
      results.errors.push(`ExpoSQLiteManager validation failed: ${error instanceof Error ? error.message : String(error)}`);
    }

    // Validate Database Service
    try {
      await this.validateDatabaseService(results);
    } catch (error) {
      results.success = false;
      results.errors.push(`DatabaseService validation failed: ${error instanceof Error ? error.message : String(error)}`);
    }

    console.log('[DbValidator] Database validation completed.');
    console.log('[DbValidator] Success:', results.success);
    
    if (results.errors.length) {
      console.error('[DbValidator] Errors:', results.errors);
    }
    
    if (results.warnings.length) {
      console.warn('[DbValidator] Warnings:', results.warnings);
    }

    return results;
  }

  private static async validateDatabaseManager(results: ValidationResult): Promise<void> {
    console.log('[DbValidator] Validating DatabaseManager...');
    
    // Check if we can initialize
    await databaseManager.ensureInitialized();
    
    // Check if database connections work
    const bongHitsDb = await databaseManager.getDatabase(BONG_HITS_DATABASE_NAME);
    const strainsDb = await databaseManager.getDatabase(STRAINS_DATABASE_NAME);
    
    // Validate BongHits table exists
    try {
      const bongHitsTableInfo = await bongHitsDb.getAllAsync('PRAGMA table_info(bong_hits)');
      results.componentResults.bongHitsTableExists = bongHitsTableInfo.length > 0;
      
      if (!results.componentResults.bongHitsTableExists) {
        results.warnings.push('BongHits table does not exist');
      }
    } catch (error) {
      results.componentResults.bongHitsTableExists = false;
      results.warnings.push(`Error checking BongHits table: ${error instanceof Error ? error.message : String(error)}`);
    }
    
    // Validate Strains table exists
    try {
      const strainsTableInfo = await strainsDb.getAllAsync('PRAGMA table_info(strains)');
      results.componentResults.strainsTableExists = strainsTableInfo.length > 0;
      
      if (!results.componentResults.strainsTableExists) {
        results.warnings.push('Strains table does not exist');
      }
    } catch (error) {
      results.componentResults.strainsTableExists = false;
      results.warnings.push(`Error checking Strains table: ${error instanceof Error ? error.message : String(error)}`);
    }
    
    // Check if transactions work
    try {
      await databaseManager.executeTransactionByName(BONG_HITS_DATABASE_NAME, async (db) => {
        const result = await db.getAllAsync('SELECT 1 as test');
        return result;
      });
      results.componentResults.transactionsWork = true;
    } catch (error) {
      results.componentResults.transactionsWork = false;
      results.errors.push(`Transactions failed: ${error instanceof Error ? error.message : String(error)}`);
    }
    
    console.log('[DbValidator] DatabaseManager validation completed');
  }

  private static async validateAsyncStorageManager(results: ValidationResult): Promise<void> {
    console.log('[DbValidator] Validating AsyncStorageManager...');
    
    // Check if we can get/set values
    try {
      const testKey = 'dbValidator_test';
      const testValue = { test: true, timestamp: Date.now() };
      
      await databaseManager.setValue(testKey, testValue);
      const retrievedValue = await asyncStorageManager.getValue<{ test: boolean; timestamp: number }>(testKey);
      
      results.componentResults.asyncStorageWorks = 
        retrievedValue !== null && typeof retrievedValue === 'object' && 'test' in retrievedValue;
      
      // Clean up
      await databaseManager.removeValue(testKey);
    } catch (error) {
      results.componentResults.asyncStorageWorks = false;
      results.errors.push(`AsyncStorage operations failed: ${error instanceof Error ? error.message : String(error)}`);
    }
    
    console.log('[DbValidator] AsyncStorageManager validation completed');
  }

  private static async validateExpoSqliteManager(results: ValidationResult): Promise<void> {
    console.log('[DbValidator] Validating ExpoSQLiteManager...');
    
    // Check if we can get database connections
    try {
      const db = await expoSqliteManager.getDatabase(BONG_HITS_DATABASE_NAME);
      const result = await db.getAllAsync<{ version: string }>('SELECT sqlite_version() as version');
      
      results.componentResults.expoSqliteWorks = result.length > 0;
      
      if (results.componentResults.expoSqliteWorks) {
        console.log('[DbValidator] SQLite version:', result[0].version);
      }
    } catch (error) {
      results.componentResults.expoSqliteWorks = false;
      results.errors.push(`ExpoSQLite operations failed: ${error instanceof Error ? error.message : String(error)}`);
    }
    
    console.log('[DbValidator] ExpoSQLiteManager validation completed');
  }

  private static async validateDatabaseService(results: ValidationResult): Promise<void> {
    console.log('[DbValidator] Validating DatabaseService...');
    
    const dbService = DatabaseService.getInstance();
    
    // Check if we can get weekly stats
    try {
      const weeklyStats = await dbService.getWeeklyStats();
      results.componentResults.weeklyStatsWork = weeklyStats.success;
      
      if (!weeklyStats.success) {
        results.warnings.push(`Weekly stats failed: ${weeklyStats.error}`);
      }
    } catch (error) {
      results.componentResults.weeklyStatsWork = false;
      results.warnings.push(`Weekly stats failed with exception: ${error instanceof Error ? error.message : String(error)}`);
    }
    
    // Check if we can get strain data
    try {
      const popularStrains = await dbService.getPopularStrains(1);
      results.componentResults.strainsDataWorks = popularStrains && popularStrains.length > 0;
      
      if (!results.componentResults.strainsDataWorks) {
        results.warnings.push('No strain data returned');
      }
    } catch (error) {
      results.componentResults.strainsDataWorks = false;
      results.warnings.push(`Strain data retrieval failed: ${error instanceof Error ? error.message : String(error)}`);
    }
    
    console.log('[DbValidator] DatabaseService validation completed');
  }
}

export interface ValidationResult {
  success: boolean;
  errors: string[];
  warnings: string[];
  componentResults: {
    [key: string]: boolean | undefined;
    bongHitsTableExists?: boolean;
    strainsTableExists?: boolean;
    transactionsWork?: boolean;
    asyncStorageWorks?: boolean;
    expoSqliteWorks?: boolean;
    weeklyStatsWork?: boolean;
    strainsDataWorks?: boolean;
  };
}

// Export a function to run the validation
export async function validateDatabase(): Promise<ValidationResult> {
  return DbValidator.validateDatabaseSetup();
}

export default validateDatabase; 