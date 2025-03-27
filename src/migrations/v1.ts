import { SQLiteDatabase } from 'expo-sqlite';
import { 
  BONG_HITS_DATABASE_NAME, 
  STRAINS_DATABASE_NAME,
  SAMPLE_STRAINS
} from '../constants';

// Helper to execute schema - breaking statements by semicolons
async function executeSchema(db: SQLiteDatabase, schema: string): Promise<void> {
  const statements = schema.split(';').filter(s => s.trim() !== '');
  for (const statement of statements) {
    await db.execAsync(statement.trim() + ';');
  }
}

/**
 * Migration v1: Creates initial schemas for all databases
 */
export async function up(db: SQLiteDatabase): Promise<void> {
  console.log('[Migration V1] Applying migration...');

  // BongHits DB Schema
  const bongHitsSchema = `
    PRAGMA journal_mode = WAL;
    CREATE TABLE IF NOT EXISTS ${BONG_HITS_DATABASE_NAME} (
      timestamp TIMESTAMP PRIMARY KEY NOT NULL,
      duration_ms INTEGER NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_timestamp ON ${BONG_HITS_DATABASE_NAME}(timestamp)
  `;
  await executeSchema(db, bongHitsSchema);
  console.log('[Migration V1] BongHits schema applied.');

  // Strains DB Schema - we'll apply it to the same database for simplicity
  // In a real app, this might be better separated
  const strainsSchema = `
    PRAGMA journal_mode = WAL;
    CREATE TABLE IF NOT EXISTS ${STRAINS_DATABASE_NAME} (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE,
      overview TEXT,
      genetic_type TEXT,
      lineage TEXT,
      thc_range TEXT,
      cbd_level TEXT,
      dominant_terpenes TEXT,
      qualitative_insights TEXT,
      effects TEXT,
      negatives TEXT,
      uses TEXT,
      thc_rating REAL,
      user_rating REAL,
      combined_rating REAL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
    CREATE INDEX IF NOT EXISTS idx_strain_name ON ${STRAINS_DATABASE_NAME}(name);
    CREATE INDEX IF NOT EXISTS idx_strain_genetic_type ON ${STRAINS_DATABASE_NAME}(genetic_type);
    CREATE INDEX IF NOT EXISTS idx_strain_effects ON ${STRAINS_DATABASE_NAME}(effects);
    CREATE INDEX IF NOT EXISTS idx_strain_rating ON ${STRAINS_DATABASE_NAME}(combined_rating DESC)
  `;
  await executeSchema(db, strainsSchema);
  console.log('[Migration V1] Strains schema applied.');

  // Safety DB Schema
  const safetySchema = `
    PRAGMA journal_mode = WAL;
    CREATE TABLE IF NOT EXISTS safety_records (
      id TEXT PRIMARY KEY NOT NULL,
      user_id TEXT NOT NULL,
      concern_type TEXT NOT NULL,
      concern_details TEXT NOT NULL,
      resolution_suggestions TEXT,
      cooling_off_until INTEGER,
      created_at INTEGER NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_user_id ON safety_records(user_id);
    CREATE INDEX IF NOT EXISTS idx_created_at ON safety_records(created_at);
    CREATE INDEX IF NOT EXISTS idx_concern_type ON safety_records(concern_type);
    CREATE INDEX IF NOT EXISTS idx_cooling_off_until ON safety_records(cooling_off_until)
  `;
  await executeSchema(db, safetySchema);
  console.log('[Migration V1] Safety schema applied.');

  // Achievements DB Schema
  const achievementsSchema = `
    PRAGMA journal_mode = WAL;
    CREATE TABLE IF NOT EXISTS achievements (
      id INTEGER PRIMARY KEY,
      category TEXT NOT NULL,
      name TEXT NOT NULL,
      unlock_condition TEXT NOT NULL,
      notes TEXT,
      icon TEXT,
      complexity INTEGER DEFAULT 1
    );
    CREATE TABLE IF NOT EXISTS user_achievements (
      user_id TEXT NOT NULL,
      achievement_id INTEGER NOT NULL,
      progress REAL DEFAULT 0,
      date_unlocked TEXT,
      is_unlocked INTEGER DEFAULT 0,
      is_new INTEGER DEFAULT 0,
      progress_data TEXT,
      PRIMARY KEY (user_id, achievement_id),
      FOREIGN KEY (achievement_id) REFERENCES achievements(id)
    )
  `;
  await executeSchema(db, achievementsSchema);
  console.log('[Migration V1] Achievements schema applied.');

  // Journal DB Schema
  const journalSchema = `
    PRAGMA journal_mode = WAL;
    CREATE TABLE IF NOT EXISTS journal_entries (
      id TEXT PRIMARY KEY NOT NULL,
      user_id TEXT NOT NULL,
      entry_date INTEGER NOT NULL,
      strain_id INTEGER NOT NULL,
      strain_name TEXT NOT NULL,
      consumption_method TEXT NOT NULL,
      dosage REAL NOT NULL,
      dosage_unit TEXT NOT NULL,
      effects_felt TEXT NOT NULL,
      rating INTEGER NOT NULL,
      effectiveness INTEGER NOT NULL,
      notes TEXT,
      mood_before TEXT,
      mood_after TEXT,
      medical_symptoms_relieved TEXT,
      negative_effects TEXT,
      duration_minutes INTEGER,
      created_at INTEGER NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_journal_user_id ON journal_entries(user_id);
    CREATE INDEX IF NOT EXISTS idx_journal_entry_date ON journal_entries(entry_date);
    CREATE INDEX IF NOT EXISTS idx_journal_strain_id ON journal_entries(strain_id);
    CREATE INDEX IF NOT EXISTS idx_journal_strain_name ON journal_entries(strain_name);
    CREATE INDEX IF NOT EXISTS idx_journal_consumption_method ON journal_entries(consumption_method);
    CREATE INDEX IF NOT EXISTS idx_journal_rating ON journal_entries(rating);
    CREATE INDEX IF NOT EXISTS idx_journal_effectiveness ON journal_entries(effectiveness)
  `;
  await executeSchema(db, journalSchema);
  console.log('[Migration V1] Journal schema applied.');

  console.log('[Migration V1] Migration completed successfully.');
}

/**
 * Optional down migration to revert changes
 */
export async function down(db: SQLiteDatabase): Promise<void> {
  console.log('[Migration V1] Rolling back migration...');
  
  // Drop tables in reverse order of creation (for proper foreign key constraints)
  await db.execAsync('DROP TABLE IF EXISTS journal_entries');
  await db.execAsync('DROP TABLE IF EXISTS user_achievements');
  await db.execAsync('DROP TABLE IF EXISTS achievements');
  await db.execAsync('DROP TABLE IF EXISTS safety_records');
  await db.execAsync(`DROP TABLE IF EXISTS ${STRAINS_DATABASE_NAME}`);
  await db.execAsync(`DROP TABLE IF EXISTS ${BONG_HITS_DATABASE_NAME}`);
  
  console.log('[Migration V1] Migration rolled back successfully.');
} 