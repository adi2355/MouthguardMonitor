import { openDatabaseAsync } from "expo-sqlite";
import { BONG_HITS_DATABASE_NAME } from "../constants";

export interface BongHit {
  timestamp: string;
  duration_ms: number;
}

/**
 * Get all bong hits within a date range
 */
export async function getBongHits(startDate: Date, endDate: Date): Promise<BongHit[]> {
  try {
    const db = await openDatabaseAsync(BONG_HITS_DATABASE_NAME);
    const results = await db.getAllAsync<BongHit>(`
      SELECT * FROM ${BONG_HITS_DATABASE_NAME}
      WHERE timestamp BETWEEN ? AND ?
      ORDER BY timestamp DESC;
    `, [startDate.toISOString(), endDate.toISOString()]);
    
    return results;
  } catch (error) {
    console.error("[queries/bongHits] Error getting bong hits:", error);
    throw error;
  }
}

/**
 * Get average duration of bong hits by hour
 */
export async function getAverageByHour(): Promise<{ hour: number; average_duration: number; }[]> {
  try {
    const db = await openDatabaseAsync(BONG_HITS_DATABASE_NAME);
    const results = await db.getAllAsync<{ hour: number; average_duration: number; }>(`
      SELECT 
        strftime('%H', timestamp) as hour,
        AVG(duration_ms) as average_duration
      FROM ${BONG_HITS_DATABASE_NAME}
      GROUP BY hour
      ORDER BY hour;
    `);
    
    return results;
  } catch (error) {
    console.error("[queries/bongHits] Error getting hourly averages:", error);
    throw error;
  }
}

/**
 * Get total number of bong hits by day
 */
export async function getTotalByDay(): Promise<{ date: string; total: number; }[]> {
  try {
    const db = await openDatabaseAsync(BONG_HITS_DATABASE_NAME);
    const results = await db.getAllAsync<{ date: string; total: number; }>(`
      SELECT 
        date(timestamp) as date,
        COUNT(*) as total
      FROM ${BONG_HITS_DATABASE_NAME}
      GROUP BY date
      ORDER BY date DESC;
    `);
    
    return results;
  } catch (error) {
    console.error("[queries/bongHits] Error getting daily totals:", error);
    throw error;
  }
}

/**
 * Get average duration of bong hits by day of week
 */
export async function getAverageByDayOfWeek(): Promise<{ day: number; average_duration: number; }[]> {
  try {
    const db = await openDatabaseAsync(BONG_HITS_DATABASE_NAME);
    const results = await db.getAllAsync<{ day: number; average_duration: number; }>(`
      SELECT 
        strftime('%w', timestamp) as day,
        AVG(duration_ms) as average_duration
      FROM ${BONG_HITS_DATABASE_NAME}
      GROUP BY day
      ORDER BY day;
    `);
    
    return results;
  } catch (error) {
    console.error("[queries/bongHits] Error getting day of week averages:", error);
    throw error;
  }
} 