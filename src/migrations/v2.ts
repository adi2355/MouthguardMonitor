import { SQLiteDatabase } from 'expo-sqlite';

// Define a type for the SQLite table column info
interface TableColumnInfo {
  cid: number;
  name: string;
  type: string;
  notnull: number;
  dflt_value: string | null;
  pk: number;
}

/**
 * Migration v2: Add sport column to athletes table
 */
export async function up(db: SQLiteDatabase): Promise<void> {
  console.log('[Migration V2] Applying migration...');

  try {
    let sportColumnExists = false;
    
    try {
      // First check if the column already exists using PRAGMA
      const tableInfoResult = await db.getAllAsync("PRAGMA table_info(athletes)");
      
      // Try different ways to access the data based on the database driver implementation
      if (tableInfoResult && typeof tableInfoResult === 'object') {
        // SQLite result might be in .rows property
        if ('rows' in tableInfoResult && Array.isArray(tableInfoResult.rows)) {
          sportColumnExists = tableInfoResult.rows.some((col: any) => col.name === 'sport');
        } 
        // Or it might be an array directly
        else if (Array.isArray(tableInfoResult)) {
          sportColumnExists = tableInfoResult.some((col: any) => col.name === 'sport');
        }
      }
      
      console.log(`[Migration V2] Sport column exists check result: ${sportColumnExists}`);
    } catch (checkError) {
      console.warn('[Migration V2] Error checking if column exists, will try to add anyway:', checkError);
      // Continue with migration even if check fails - the ALTER TABLE will fail
      // if the column already exists and we'll catch that error
    }
    
    if (!sportColumnExists) {
      // Add sport column to athletes table only if it doesn't exist
      console.log('[Migration V2] Adding sport column to athletes table');
      await db.execAsync('ALTER TABLE athletes ADD COLUMN sport TEXT;');
      console.log('[Migration V2] Sport column added successfully');
    } else {
      console.log('[Migration V2] Sport column already exists, skipping migration');
    }
    
    console.log('[Migration V2] Migration completed successfully.');
  } catch (error) {
    // Check if the error is about duplicate column - that's actually success
    const errorMessage = String(error);
    if (errorMessage.includes('duplicate column name: sport')) {
      console.log('[Migration V2] Sport column already exists, counting migration as successful');
      return; // Exit without throwing error - migration is successful
    }
    
    console.error('[Migration V2] Migration failed with error:', error);
    throw error;
  }
}

/**
 * Optional down migration to revert changes
 * Note: SQLite does not support dropping columns without recreating the table
 * This is left as a placeholder since we cannot easily revert this change
 */
export async function down(db: SQLiteDatabase): Promise<void> {
  console.log('[Migration V2] SQLite does not support dropping columns without recreating the table.');
  console.log('[Migration V2] The sport column will remain in the athletes table.');
} 