import { SQLiteDatabase } from 'expo-sqlite';

// Helper (can be moved to a shared utils file)
async function executeSchema(db: SQLiteDatabase, schema: string): Promise<void> {
  const statements = schema.split(';').filter(s => s.trim() !== '');
  for (const statement of statements) {
    await db.execAsync(statement.trim() + ';');
  }
}

/**
 * Migration v3: Add tables for raw device packets
 */
export async function up(db: SQLiteDatabase): Promise<void> {
  console.log('[Migration V3] Applying migration...');

  const motionPacketSchema = `
    CREATE TABLE IF NOT EXISTS motion_packets (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      device_id TEXT NOT NULL,
      device_timestamp INTEGER NOT NULL, -- Store the uint32_t directly
      gyro_x INTEGER NOT NULL,
      gyro_y INTEGER NOT NULL,
      gyro_z INTEGER NOT NULL,
      accel16_x INTEGER NOT NULL,
      accel16_y INTEGER NOT NULL,
      accel16_z INTEGER NOT NULL,
      accel200_x INTEGER NOT NULL,
      accel200_y INTEGER NOT NULL,
      accel200_z INTEGER NOT NULL,
      mag_x INTEGER NOT NULL,
      mag_y INTEGER NOT NULL,
      mag_z INTEGER NOT NULL,
      bite_l INTEGER NOT NULL,
      bite_r INTEGER NOT NULL,
      app_timestamp INTEGER NOT NULL -- When the app received/recorded it
    );
    CREATE INDEX IF NOT EXISTS idx_motion_device_time ON motion_packets(device_id, device_timestamp);
  `;
  await executeSchema(db, motionPacketSchema);
  console.log('[Migration V3] motion_packets schema applied.');

  const fsrPacketSchema = `
    CREATE TABLE IF NOT EXISTS fsr_packets (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      device_id TEXT NOT NULL,
      device_timestamp INTEGER NOT NULL, -- Store the uint32_t directly
      left_bite REAL NOT NULL, -- Changed to REAL to store unscaled force values
      right_bite REAL NOT NULL, -- Changed to REAL to store unscaled force values
      app_timestamp INTEGER NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_fsr_device_time ON fsr_packets(device_id, device_timestamp);
  `;
  await executeSchema(db, fsrPacketSchema);
  console.log('[Migration V3] fsr_packets schema applied.');

  const hrmPacketSchema = `
    CREATE TABLE IF NOT EXISTS hrm_packets (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      device_id TEXT NOT NULL,
      flags INTEGER NOT NULL,
      heart_rate INTEGER NOT NULL,
      app_timestamp INTEGER NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_hrm_device_time ON hrm_packets(device_id, app_timestamp);
  `;
  await executeSchema(db, hrmPacketSchema);
  console.log('[Migration V3] hrm_packets schema applied.');

   const htmPacketSchema = `
    CREATE TABLE IF NOT EXISTS htm_packets (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      device_id TEXT NOT NULL,
      flags INTEGER NOT NULL,
      temperature REAL NOT NULL, -- Store parsed temp
      type INTEGER,
      app_timestamp INTEGER NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_htm_device_time ON htm_packets(device_id, app_timestamp);
  `;
  await executeSchema(db, htmPacketSchema);
  console.log('[Migration V3] htm_packets schema applied.');

  console.log('[Migration V3] Migration completed successfully.');
}

export async function down(db: SQLiteDatabase): Promise<void> {
  console.log('[Migration V3] Rolling back migration...');
  await db.execAsync('DROP TABLE IF EXISTS motion_packets;');
  await db.execAsync('DROP TABLE IF EXISTS fsr_packets;');
  await db.execAsync('DROP TABLE IF EXISTS hrm_packets;');
  await db.execAsync('DROP TABLE IF EXISTS htm_packets;');
  console.log('[Migration V3] Migration rolled back successfully.');
} 