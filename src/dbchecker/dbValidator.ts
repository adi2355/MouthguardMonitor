import { databaseManager } from "../DatabaseManager";
import { 
  BONG_HITS_DATABASE_NAME, 
  STRAINS_DATABASE_NAME 
} from "../constants";
import { DatabaseResponse, Strain } from "../types";

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
    
    // Check if we can get weekly stats
    try {
      const weeklyStats = await databaseManager.getWeeklyStats();
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
      const popularStrains: Strain[] = await databaseManager.getPopularStrains(1);
      if (popularStrains && popularStrains.length > 0) {
        results.componentResults.strainsDataWorks = true;
      } else {
        results.componentResults.strainsDataWorks = false;
        results.warnings.push('No strain data returned');
      }
    } catch (error) {
      results.componentResults.strainsDataWorks = false;
      results.warnings.push(`Strain data retrieval failed: ${error instanceof Error ? error.message : String(error)}`);
    }
    
    // Check if we can perform AsyncStorage operations
    try {
      const testKey = 'dbValidator_test';
      const testValue = { test: true, timestamp: Date.now() };
      
      await databaseManager.setValue(testKey, testValue);
      const retrievedValue = await databaseManager.getValue<{ test: boolean; timestamp: number }>(testKey);
      
      results.componentResults.asyncStorageWorks = 
        retrievedValue !== null && typeof retrievedValue === 'object' && 'test' in retrievedValue;
      
      // Clean up
      await databaseManager.removeValue(testKey);
    } catch (error) {
      results.componentResults.asyncStorageWorks = false;
      results.errors.push(`AsyncStorage operations failed: ${error instanceof Error ? error.message : String(error)}`);
    }
    
    console.log('[DbValidator] DatabaseManager validation completed');
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