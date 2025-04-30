import { SQLiteDatabase } from 'expo-sqlite';

async function addSessionIdColumn(db: SQLiteDatabase, tableName: string) {
  try {
    // Check if column exists first to make migration repeatable
    const tableInfo = await db.getAllAsync(`PRAGMA table_info(${tableName})`);
    const columnExists = tableInfo.some((col: any) => col.name === 'session_id');
    if (!columnExists) {
      await db.execAsync(`ALTER TABLE ${tableName} ADD COLUMN session_id TEXT;`);
      await db.execAsync(`CREATE INDEX IF NOT EXISTS idx_${tableName}_session_id ON ${tableName}(session_id);`);
      console.log(`[Migration V4] Added session_id to ${tableName}`);
    } else {
      console.log(`[Migration V4] session_id already exists on ${tableName}`);
    }
  } catch (error) {
    console.error(`[Migration V4] Error adding session_id to ${tableName}:`, error);
    throw error; // Re-throw to stop migration on critical error
  }
}

export async function up(db: SQLiteDatabase): Promise<void> {
  console.log('[Migration V4] Applying migration: Add session_id to data tables...');

  // Create sessions table first if it doesn't exist (though it should from v1)
  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS sessions (
      id TEXT PRIMARY KEY NOT NULL,
      name TEXT NOT NULL,
      start_time INTEGER NOT NULL,
      end_time INTEGER,
      team TEXT,
      created_at INTEGER NOT NULL,
      notes TEXT
    );
  `);
  await db.execAsync(`CREATE INDEX IF NOT EXISTS idx_session_start ON sessions(start_time);`);
  console.log('[Migration V4] Ensured sessions table exists.');

  // Add session_id to relevant tables
  const tablesToUpdate = [
    'motion_packets',
    'fsr_packets',
    'hrm_packets',
    'htm_packets',
    'impact_events',
    'accelerometer_data',
    'imu_data',
    'temperature_data',
    'force_data',
    'heart_rate_data'
  ];

  for (const table of tablesToUpdate) {
    await addSessionIdColumn(db, table);
  }

  console.log('[Migration V4] Migration completed successfully.');
}

// Optional Down Migration (Potentially complex/lossy)
export async function down(db: SQLiteDatabase): Promise<void> {
  console.warn('[Migration V4 Down] Down migration not implemented for safety reasons.');
  // SQLite doesn't easily support dropping columns.
  // You'd typically need to recreate each table and copy data, which is risky.
} 