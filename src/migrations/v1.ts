import { SQLiteDatabase } from 'expo-sqlite';

// Helper to execute schema - breaking statements by semicolons
async function executeSchema(db: SQLiteDatabase, schema: string): Promise<void> {
  console.log(`[executeSchema] Starting execution of schema with ${schema.split(';').filter(s => s.trim() !== '').length} statements`);
  const statements = schema.split(';').filter(s => s.trim() !== '');
  for (let i = 0; i < statements.length; i++) {
    const statement = statements[i].trim() + ';';
    try {
      console.log(`[executeSchema] Executing statement ${i+1}/${statements.length}: ${statement.substring(0, 50)}...`);
      await db.execAsync(statement);
      console.log(`[executeSchema] Statement ${i+1} executed successfully`);
    } catch (error) {
      console.error(`[executeSchema] Error executing statement ${i+1}: ${error}`);
      console.error(`[executeSchema] Full statement that failed: ${statement}`);
      throw error;
    }
  }
  console.log(`[executeSchema] Schema execution completed successfully`);
}

/**
 * Migration v1: Creates initial schemas for all databases
 */
export async function up(db: SQLiteDatabase): Promise<void> {
  console.log('[Migration V1] Applying migration...');

  try {
    // Athletes Table Schema
    const athletesSchema = `
      CREATE TABLE IF NOT EXISTS athletes (
        id TEXT PRIMARY KEY NOT NULL,
        name TEXT NOT NULL,
        team TEXT,
        position TEXT,
        age INTEGER,
        height TEXT,
        weight TEXT,
        device_id TEXT,
        notes TEXT,
        number TEXT,
        active BOOLEAN DEFAULT 1,
        created_at INTEGER NOT NULL,
        updated_at INTEGER NOT NULL
      );
      CREATE INDEX IF NOT EXISTS idx_athlete_name ON athletes(name);
      CREATE INDEX IF NOT EXISTS idx_athlete_team ON athletes(team);
      CREATE INDEX IF NOT EXISTS idx_athlete_device ON athletes(device_id)
    `;
    await executeSchema(db, athletesSchema);
    console.log('[Migration V1] Athletes schema applied.');

    // IMU Data Table Schema
    const imuDataSchema = `
      CREATE TABLE IF NOT EXISTS imu_data (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        device_id TEXT NOT NULL,
        sensor_id INTEGER NOT NULL,
        timestamp INTEGER NOT NULL,
        x REAL NOT NULL,
        y REAL NOT NULL,
        z REAL NOT NULL,
        created_at INTEGER NOT NULL
      );
      CREATE INDEX IF NOT EXISTS idx_imu_device_id ON imu_data(device_id);
      CREATE INDEX IF NOT EXISTS idx_imu_timestamp ON imu_data(timestamp)
    `;
    await executeSchema(db, imuDataSchema);
    console.log('[Migration V1] IMU data schema applied.');

    // Accelerometer Data Table Schema
    const accelerometerDataSchema = `
      CREATE TABLE IF NOT EXISTS accelerometer_data (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        device_id TEXT NOT NULL,
        sensor_id INTEGER NOT NULL,
        timestamp INTEGER NOT NULL,
        x REAL NOT NULL,
        y REAL NOT NULL,
        z REAL NOT NULL,
        magnitude REAL NOT NULL,
        created_at INTEGER NOT NULL
      );
      CREATE INDEX IF NOT EXISTS idx_accel_device_id ON accelerometer_data(device_id);
      CREATE INDEX IF NOT EXISTS idx_accel_timestamp ON accelerometer_data(timestamp);
      CREATE INDEX IF NOT EXISTS idx_accel_magnitude ON accelerometer_data(magnitude)
    `;
    await executeSchema(db, accelerometerDataSchema);
    console.log('[Migration V1] Accelerometer data schema applied.');

    // Temperature Data Table Schema
    const temperatureDataSchema = `
      CREATE TABLE IF NOT EXISTS temperature_data (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        device_id TEXT NOT NULL,
        sensor_id INTEGER NOT NULL,
        timestamp INTEGER NOT NULL,
        temperature REAL NOT NULL,
        created_at INTEGER NOT NULL
      );
      CREATE INDEX IF NOT EXISTS idx_temp_device_id ON temperature_data(device_id);
      CREATE INDEX IF NOT EXISTS idx_temp_timestamp ON temperature_data(timestamp)
    `;
    await executeSchema(db, temperatureDataSchema);
    console.log('[Migration V1] Temperature data schema applied.');

    // Force Data Table Schema
    const forceDataSchema = `
      CREATE TABLE IF NOT EXISTS force_data (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        device_id TEXT NOT NULL,
        sensor_id INTEGER NOT NULL,
        timestamp INTEGER NOT NULL,
        force REAL NOT NULL,
        created_at INTEGER NOT NULL
      );
      CREATE INDEX IF NOT EXISTS idx_force_device_id ON force_data(device_id);
      CREATE INDEX IF NOT EXISTS idx_force_timestamp ON force_data(timestamp)
    `;
    await executeSchema(db, forceDataSchema);
    console.log('[Migration V1] Force data schema applied.');

    // Heart Rate Data Table Schema
    const heartRateDataSchema = `
      CREATE TABLE IF NOT EXISTS heart_rate_data (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        device_id TEXT NOT NULL,
        timestamp INTEGER NOT NULL,
        heart_rate INTEGER NOT NULL,
        created_at INTEGER NOT NULL
      );
      CREATE INDEX IF NOT EXISTS idx_hr_device_id ON heart_rate_data(device_id);
      CREATE INDEX IF NOT EXISTS idx_hr_timestamp ON heart_rate_data(timestamp)
    `;
    await executeSchema(db, heartRateDataSchema);
    console.log('[Migration V1] Heart Rate data schema applied.');

    // Impact Events Table Schema
    const impactEventsSchema = `
      CREATE TABLE IF NOT EXISTS impact_events (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        device_id TEXT NOT NULL,
        athlete_id TEXT,
        timestamp INTEGER NOT NULL,
        magnitude REAL NOT NULL,
        x REAL NOT NULL,
        y REAL NOT NULL,
        z REAL NOT NULL,
        duration_ms INTEGER,
        location TEXT,
        processed BOOLEAN DEFAULT 0,
        severity TEXT,
        notes TEXT,
        created_at INTEGER NOT NULL,
        FOREIGN KEY (athlete_id) REFERENCES athletes(id)
      );
      CREATE INDEX IF NOT EXISTS idx_impact_device_id ON impact_events(device_id);
      CREATE INDEX IF NOT EXISTS idx_impact_athlete_id ON impact_events(athlete_id);
      CREATE INDEX IF NOT EXISTS idx_impact_timestamp ON impact_events(timestamp);
      CREATE INDEX IF NOT EXISTS idx_impact_magnitude ON impact_events(magnitude);
      CREATE INDEX IF NOT EXISTS idx_impact_processed ON impact_events(processed)
    `;
    await executeSchema(db, impactEventsSchema);
    console.log('[Migration V1] Impact Events schema applied.');

    // Sessions Table Schema
    const sessionsSchema = `
      CREATE TABLE IF NOT EXISTS sessions (
        id TEXT PRIMARY KEY NOT NULL,
        name TEXT NOT NULL,
        start_time INTEGER NOT NULL,
        end_time INTEGER,
        team TEXT,
        created_at INTEGER NOT NULL,
        notes TEXT
      );
      CREATE INDEX IF NOT EXISTS idx_session_start ON sessions(start_time);
      CREATE INDEX IF NOT EXISTS idx_session_team ON sessions(team)
    `;
    await executeSchema(db, sessionsSchema);
    console.log('[Migration V1] Sessions schema applied.');

    // Session Athletes Table Schema (many-to-many)
    const sessionAthletesSchema = `
      CREATE TABLE IF NOT EXISTS session_athletes (
        session_id TEXT NOT NULL,
        athlete_id TEXT NOT NULL,
        start_time INTEGER NOT NULL,
        end_time INTEGER,
        PRIMARY KEY (session_id, athlete_id),
        FOREIGN KEY (session_id) REFERENCES sessions(id),
        FOREIGN KEY (athlete_id) REFERENCES athletes(id)
      );
      CREATE INDEX IF NOT EXISTS idx_sa_session ON session_athletes(session_id);
      CREATE INDEX IF NOT EXISTS idx_sa_athlete ON session_athletes(athlete_id)
    `;
    await executeSchema(db, sessionAthletesSchema);
    console.log('[Migration V1] Session Athletes schema applied.');

    // Calibration Data Table Schema
    const calibrationSchema = `
      CREATE TABLE IF NOT EXISTS calibration_data (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        device_id TEXT NOT NULL,
        sensor_type TEXT NOT NULL,
        timestamp INTEGER NOT NULL,
        offset_x REAL,
        offset_y REAL,
        offset_z REAL,
        scale_x REAL,
        scale_y REAL,
        scale_z REAL,
        created_at INTEGER NOT NULL
      );
      CREATE INDEX IF NOT EXISTS idx_calib_device_id ON calibration_data(device_id);
      CREATE UNIQUE INDEX IF NOT EXISTS idx_calib_device_sensor ON calibration_data(device_id, sensor_type)
    `;
    await executeSchema(db, calibrationSchema);
    console.log('[Migration V1] Calibration Data schema applied.');

    console.log('[Migration V1] Migration completed successfully.');
  } catch (error) {
    console.error('[Migration V1] Migration failed with error:', error);
    throw error;
  }
}

/**
 * Optional down migration to revert changes
 */
export async function down(db: SQLiteDatabase): Promise<void> {
  console.log('[Migration V1] Rolling back migration...');
  
  // Drop tables in reverse order of creation (for proper foreign key constraints)
  await db.execAsync('DROP TABLE IF EXISTS calibration_data');
  await db.execAsync('DROP TABLE IF EXISTS session_athletes');
  await db.execAsync('DROP TABLE IF EXISTS sessions');
  await db.execAsync('DROP TABLE IF EXISTS impact_events');
  await db.execAsync('DROP TABLE IF EXISTS heart_rate_data');
  await db.execAsync('DROP TABLE IF EXISTS force_data');
  await db.execAsync('DROP TABLE IF EXISTS temperature_data');
  await db.execAsync('DROP TABLE IF EXISTS accelerometer_data');
  await db.execAsync('DROP TABLE IF EXISTS imu_data');
  await db.execAsync('DROP TABLE IF EXISTS athletes');
  
  console.log('[Migration V1] Migration rolled back successfully.');
} 