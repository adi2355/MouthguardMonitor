// File: src/dbManager.ts

//TODO: refactor into correct files

import AsyncStorage from "@react-native-async-storage/async-storage";
import { openDatabaseAsync, SQLiteDatabase } from "expo-sqlite";
import {
  BONG_HITS_DATABASE_NAME,
  STRAINS_DATABASE_NAME,
  SAMPLE_STRAINS
} from "./constants";
import { BongHitStats, Datapoint, AverageHourCount, SavedDevice, Strain } from "./types";
import { Device } from 'react-native-ble-plx';

const FIRST_LAUNCH_KEY = "hasLaunched";
const SAVED_DEVICES_KEY: string = 'savedDevices';

/**
 * Checks if the application is launching for the first time.
 */
export async function isFirstLaunch(): Promise<boolean> {
  try {
    return (await AsyncStorage.getItem(FIRST_LAUNCH_KEY)) === null;
  } catch (error) {
    console.error('[dbManager] Error checking first launch:', error);
    return false;
  }
}

/**
 * Called on first launch to run any initial setup (e.g. DB creation).
 */
export async function initializeAppOnFirstLaunch() {
  try {
    await initializeExpoSqliteDbs();
    await initializeAsyncDb();
  } catch (error) {
    console.error('[dbManager] Error initializing app:', error);
    throw error;
  }
}

export async function initializeAsyncDb(): Promise<void> {
  await AsyncStorage.setItem(FIRST_LAUNCH_KEY, "true");
  await AsyncStorage.setItem(SAVED_DEVICES_KEY, JSON.stringify([]));
}

/**
 * Initializes all databases and tables with initial data.
 */
async function initializeExpoSqliteDbs(): Promise<void> {
  try {
    console.log('[dbManager] Starting database initialization...');

    // Initialize BongHits database
    const bongHitsDb = await openDatabaseAsync(BONG_HITS_DATABASE_NAME);
    await bongHitsDb.execAsync(
      'PRAGMA journal_mode = WAL;' +
      `CREATE TABLE IF NOT EXISTS ${BONG_HITS_DATABASE_NAME} (
        timestamp TIMESTAMP PRIMARY KEY NOT NULL,
        duration_ms INTEGER NOT NULL
      );` +
      `CREATE INDEX IF NOT EXISTS idx_timestamp 
      ON ${BONG_HITS_DATABASE_NAME}(timestamp);`
    );
    console.log('[dbManager] BongHits database initialized');

    // Initialize Strains database
    const strainsDb = await openDatabaseAsync(STRAINS_DATABASE_NAME);
    await strainsDb.execAsync(
      'PRAGMA journal_mode = WAL;' +
      `CREATE TABLE IF NOT EXISTS ${STRAINS_DATABASE_NAME} (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
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
      );` +
      `CREATE INDEX IF NOT EXISTS idx_strain_name 
      ON ${STRAINS_DATABASE_NAME}(name);` +
      `CREATE INDEX IF NOT EXISTS idx_strain_genetic_type 
      ON ${STRAINS_DATABASE_NAME}(genetic_type);` +
      `CREATE INDEX IF NOT EXISTS idx_strain_effects 
      ON ${STRAINS_DATABASE_NAME}(effects);` +
      `CREATE INDEX IF NOT EXISTS idx_strain_rating 
      ON ${STRAINS_DATABASE_NAME}(combined_rating DESC);`
    );

    // Insert sample strain data
    await insertStrainData(strainsDb);
    console.log('[dbManager] Strains database initialized');

    console.log('[dbManager] All databases initialized successfully');
  } catch (error) {
    console.error('[dbManager] Error initializing databases:', error);
    throw error;
  }
}

/**
 * Inserts sample strain data into the database
 */
async function insertStrainData(db: SQLiteDatabase): Promise<void> {
  try {
    console.log('[dbManager] Starting strain data insertion...');
    
    // Insert strains in batches for better performance
    const batchSize = 50;
    for (let i = 0; i < SAMPLE_STRAINS.length; i += batchSize) {
      const batch = SAMPLE_STRAINS.slice(i, i + batchSize);
      
      const placeholders = batch.map(() => 
        '(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
      ).join(',');

      const values = batch.flatMap((strain: Strain) => [
        strain.name,
        strain.overview,
        strain.genetic_type,
        strain.lineage,
        strain.thc_range,
        strain.cbd_level,
        strain.dominant_terpenes,
        strain.qualitative_insights,
        strain.effects,
        strain.negatives,
        strain.uses,
        strain.thc_rating,
        strain.user_rating,
        strain.combined_rating
      ]);

      await db.execAsync(
        `INSERT OR IGNORE INTO ${STRAINS_DATABASE_NAME} (
          name, overview, genetic_type, lineage, thc_range,
          cbd_level, dominant_terpenes, qualitative_insights,
          effects, negatives, uses, thc_rating,
          user_rating, combined_rating
        ) VALUES ${placeholders}`,
        values
      );
    }

    console.log('[dbManager] Strain data insertion completed');
  } catch (error) {
    console.error('[dbManager] Error inserting strain data:', error);
    throw error;
  }
}

/* ------------------------------------------------------------------
   TODO: Segregate to correct file
   Helpers to validate results before returning them
 ------------------------------------------------------------------ */

const validateBongHitStats = (stats: BongHitStats): BongHitStats => ({
  averageDuration: Math.max(0, Number(stats.averageDuration) || 0),
  longestHit: Math.max(0, Number(stats.longestHit) || 0),
});

const validateDatapoint = (point: Datapoint): Datapoint => ({
  label: String(point.label || ""),
  value: Math.max(0, Number(point.value) || 0),
});

const validateAverageHourCount = (count: AverageHourCount): AverageHourCount => ({
  hourOfDay: String(count.hourOfDay || "00"),
  count: Math.max(0, Number(count.count) || 0),
});

/* ------------------------------------------------------------------
   Data-Fetching / Query Functions
   (Now using execAsync, parse the result sets)
 ------------------------------------------------------------------ */

/**
 * Retrieves average and max duration over the past 7 days.
 */
export async function getBongHitStatsFromPastWeek(): Promise<BongHitStats> {
  try {
    const db: SQLiteDatabase = await openDatabaseAsync(BONG_HITS_DATABASE_NAME);
    const results = await db.execAsync(`
      SELECT
        AVG(duration_ms) AS avg_duration,
        MAX(duration_ms) AS max_duration
      FROM ${BONG_HITS_DATABASE_NAME}
      WHERE timestamp >= DATETIME('now', '-7 days')
    `);

    // execAsync returns an array of result sets; we only have one query
    const row = results[0]?.rows?._array[0];
    if (!row) {
      // Fallback if no data
      return validateBongHitStats({ averageDuration: 0, longestHit: 0 });
    }

    return validateBongHitStats({
      averageDuration: row.avg_duration,
      longestHit: row.max_duration,
    });
  } catch (error) {
    console.error("Error in getBongHitStatsFromPastWeek:", error);
    throw error;
  }
}

/**
 * Counts hits per day over the past week (filling day indices 0..6).
 */
export async function queryNumberOfHitsFromPastWeek(): Promise<Datapoint[]> {
  try {
    const db: SQLiteDatabase = await openDatabaseAsync(BONG_HITS_DATABASE_NAME);
    const results = await db.execAsync(`
      SELECT 
        strftime('%w', timestamp) AS day,
        COUNT(*) AS hit_count
      FROM ${BONG_HITS_DATABASE_NAME}
      WHERE timestamp >= '2024-12-24'
      GROUP BY day
      ORDER BY day;
    `);

    const rows = results[0]?.rows?._array || [];
    console.log("Weekly query results:", rows);

    // Prepare an array for Sunday..Saturday
    const weekData: Datapoint[] = Array.from({ length: 7 }, (_, i) => ({
      label: dayLookUpTable.get(i) || "",
      value: 0,
    }));

    rows.forEach((row: any) => {
      const dayIndex = parseInt(row.day, 10);
      if (dayIndex >= 0 && dayIndex < 7) {
        weekData[dayIndex] = validateDatapoint({
          label: dayLookUpTable.get(dayIndex) || "",
          value: row.hit_count,
        });
      }
    });

    return weekData;
  } catch (error) {
    console.error("Error in queryNumberOfHitsFromPastWeek:", error);
    throw error;
  }
}

/**
 * Returns a list of (hourOfDay -> # of hits) since 2024-12-24,
 * filling missing hours with 0.
 */
export async function getDailyAverageDatapoints(): Promise<AverageHourCount[]> {
  try {
    const db: SQLiteDatabase = await openDatabaseAsync(BONG_HITS_DATABASE_NAME);
    const results = await db.execAsync(`
      SELECT 
        strftime('%H', timestamp) AS hourOfDay,
        COUNT(*) AS count
      FROM ${BONG_HITS_DATABASE_NAME}
      WHERE timestamp >= '2024-12-24'
      GROUP BY hourOfDay
      ORDER BY hourOfDay
    `);

    const rows = results[0]?.rows?._array || [];
    // Hours "00" through "23"
    const allHours = Array.from({ length: 24 }, (_, i) => i.toString().padStart(2, "0"));
    const dataMap = new Map<string, number>(
      rows.map((item: any) => [item.hourOfDay, item.count])
    );

    return allHours.map((hour) =>
      validateAverageHourCount({
        hourOfDay: hour,
        count: dataMap.get(hour) || 0,
      })
    );
  } catch (error) {
    console.error("Error in getDailyAverageDatapoints:", error);
    throw error;
  }
}

/**
 * Generic function to get data based on a time range (D=Day, W=Week, M=Month).
 * Returns both chartData and some aggregated stats.
 */
export async function getDailyStats(timeRange: string) {
  let query = "";

  switch (timeRange) {
    case "D":
      query = `
        SELECT strftime('%H', timestamp) as label,
               COUNT(*) as value,
               AVG(duration_ms) as avg_duration
        FROM ${BONG_HITS_DATABASE_NAME}
        WHERE date(timestamp) = date('now')
        GROUP BY label
        ORDER BY label
      `;
      break;
    case "W":
      query = `
        SELECT strftime('%w', timestamp) as label,
               COUNT(*) as value,
               AVG(duration_ms) as avg_duration
        FROM ${BONG_HITS_DATABASE_NAME}
        WHERE timestamp >= date('now', '-7 days')
        GROUP BY label
        ORDER BY label
      `;
      break;
    case "M":
      query = `
        SELECT strftime('%d', timestamp) as label,
               COUNT(*) as value,
               AVG(duration_ms) as avg_duration
        FROM ${BONG_HITS_DATABASE_NAME}
        WHERE timestamp >= date('now', '-30 days')
        GROUP BY label
        ORDER BY label
      `;
      break;
    default:
      // fallback same as 'D'
      query = `
        SELECT strftime('%H', timestamp) as label,
               COUNT(*) as value,
               AVG(duration_ms) as avg_duration
        FROM ${BONG_HITS_DATABASE_NAME}
        WHERE date(timestamp) = date('now')
        GROUP BY label
        ORDER BY label
      `;
  }

  try {
    const db: SQLiteDatabase = await openDatabaseAsync(BONG_HITS_DATABASE_NAME);
    const results = await db.execAsync(query);
    const rows = results[0]?.rows?._array || [];

    // Build chart data
    const chartData = {
      labels: rows.map((r: any) => `${r.label}h`),
      datasets: [
        {
          data: rows.map((r: any) => r.value),
          color: (opacity = 1) => `rgba(0, 122, 255, ${opacity})`,
          strokeWidth: 2,
        },
      ],
      legend: ["Hits"],
    };

    // Build aggregated stats
    // If no rows, handle safely
    if (!rows.length) {
      return {
        chartData,
        stats: {
          avgDuration: 0,
          totalHits: 0,
          peakHour: null,
        },
      };
    }

    const avgDuration =
      rows.reduce((acc: number, curr: any) => acc + curr.avg_duration, 0) /
      rows.length;
    const totalHits = rows.reduce((acc: number, curr: any) => acc + curr.value, 0);
    const peak = rows.reduce((a: any, b: any) => (a.value > b.value ? a : b));
    const peakHour = peak.label;

    return {
      chartData,
      stats: {
        avgDuration,
        totalHits,
        peakHour,
      },
    };
  } catch (error) {
    console.error("Error in getDailyStats:", error);
    throw error;
  }
}

export async function getSavedDevices(): Promise<SavedDevice[]> {
  const savedDevices = await AsyncStorage.getItem(SAVED_DEVICES_KEY);
  if (savedDevices) {
    return JSON.parse(savedDevices) as SavedDevice[];
  }
  throw new Error("Failed to find saved devices");
}

export async function saveDevices(devices: Device[]): Promise<void> {
  console.log(devices)
  let savedDevices: SavedDevice[] = [];
  try {
    savedDevices = await getSavedDevices();
  } catch(e) {
    console.error(e);
    throw e;
  }

  console.log(devices)
  devices.forEach(device => {
    console.log(`device ${device}`)
    const savedDevice: SavedDevice = {id: device.id, name: device.name ? device.name : "Unknown Name"}
    console.log(savedDevice)
    savedDevices.push(savedDevice);
  });
  
  await AsyncStorage.setItem(SAVED_DEVICES_KEY, JSON.stringify(savedDevices));
}
