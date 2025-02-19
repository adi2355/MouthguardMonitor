// File: src/dbManager.ts

import AsyncStorage from "@react-native-async-storage/async-storage";
import { openDatabaseAsync, SQLiteDatabase } from "expo-sqlite";
import {
  BONG_HITS_DATABASE_NAME,
  SAVED_DEVICES_DATABASE_NAME,
  getInsertStatements,
  dayLookUpTable,
} from "./constants";
import { BongHitStats, Datapoint, AverageHourCount } from "./types";

const FIRST_LAUNCH_KEY = "hasLaunched";

/**
 * Checks if the application is launching for the first time.
 */
export async function isFirstLaunch(): Promise<boolean> {
  return (await AsyncStorage.getItem(FIRST_LAUNCH_KEY)) === null;
}

/**
 * Called on first launch to run any initial setup (e.g. DB creation).
 */
export async function initializeAppOnFirstLaunch() {
  await AsyncStorage.setItem(FIRST_LAUNCH_KEY, "true");
  await initializeDatabase();
}

/**
 * Initializes the BongHits and SavedDevices databases/tables
 * and inserts mock data, using expo-sqlite's newer async methods.
 */
async function initializeDatabase(): Promise<void> {
  try {
    // 1) Open and init BongHits database
    const bongHitsDb: SQLiteDatabase = await openDatabaseAsync(BONG_HITS_DATABASE_NAME);
    // Multi-statement: WAL mode, create table, insert mock data
    await bongHitsDb.execAsync(`
      PRAGMA journal_mode = WAL;
      CREATE TABLE IF NOT EXISTS ${BONG_HITS_DATABASE_NAME} (
        timestamp TIMESTAMP PRIMARY KEY NOT NULL,
        duration_ms INTEGER NOT NULL
      );
    `.concat(getInsertStatements()));

    // 2) Open and init SavedDevices database
    const savedDevicesDb: SQLiteDatabase = await openDatabaseAsync(SAVED_DEVICES_DATABASE_NAME);
    await savedDevicesDb.execAsync(`
      PRAGMA journal_mode = WAL;
      CREATE TABLE IF NOT EXISTS ${SAVED_DEVICES_DATABASE_NAME} (
        uuid TEXT PRIMARY KEY NOT NULL,
        name TEXT NOT NULL
      );
    `);

    console.log("Databases initialized successfully.");
  } catch (error) {
    console.error("Error initializing databases:", error);
    throw error;
  }
}

/* ------------------------------------------------------------------
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
