import { SQLiteDatabase } from "expo-sqlite";
import { 
  BongHit, 
  ChartDataPoint, 
  DatabaseResponse, 
  UsageStats,
  TimeDistribution,
  DatabaseRow 
} from "@/src/types";
import { BONG_HITS_DATABASE_NAME, dayLookUpTable } from "@/src/constants";
import { databaseManager } from "@/src/DatabaseManager";

interface CountResult {
  count: number;
}

/*
 * Service for accessing and managing bong hit data
 */

export class DataService {
  private static instance: DataService;

  public static getInstance(): DataService {
    if (!DataService.instance) {
      DataService.instance = new DataService();
    }
    return DataService.instance;
  }

  private constructor() {
    // Initialize on first use
  }

  public async cleanup() {
    console.log('[DataService] Starting cleanup...');
    try {
      // No need to close the database directly, the DatabaseManager handles that
      console.log('[DataService] Cleanup completed successfully');
    } catch (error) {
      console.error('[DataService] Error during cleanup:', error);
      throw error;
    }
  }

  public async getWeeklyStats(): Promise<DatabaseResponse<ChartDataPoint[]>> {
    try {
      console.log('[DataService] Fetching weekly stats...');
      const db = await this.getDatabase();
      const results = await db.getAllAsync<DatabaseRow>(`
        SELECT 
          strftime('%w', timestamp) as day,
          COUNT(*) as hit_count
        FROM ${BONG_HITS_DATABASE_NAME}
        WHERE timestamp >= '2024-12-24'
        GROUP BY day
        ORDER BY day
      `);

      console.log('[DataService] Raw weekly results:', results);

      if (!results?.length) {
        console.log('[DataService] No weekly data found, returning empty dataset');
        return {
          success: true,
          data: Array.from({ length: 7 }, (_, i) => ({
            label: dayLookUpTable.get(i) || "",
            value: 0
          }))
        };
      }

      const validatedData = this.validateWeeklyData(results);
      return {
        success: true,
        data: validatedData
      };

    } catch (error) {
      return this.handleError(error, 'getWeeklyStats');
    }
  }

  public async getMonthlyStats(): Promise<DatabaseResponse<ChartDataPoint[]>> {
    try {
      console.log('[DataService] Fetching monthly stats...');
      const db = await this.getDatabase();
      const results = await db.getAllAsync<DatabaseRow>(`
        SELECT 
          strftime('%m', timestamp) as month,
          COUNT(*) as hit_count
        FROM ${BONG_HITS_DATABASE_NAME}
        WHERE timestamp >= '2024-12-24'
        GROUP BY month
        ORDER BY month
      `);

      console.log('[DataService] Raw monthly results:', results);

      if (!results?.length) {
        console.log('[DataService] No monthly data found, returning empty dataset');
        return {
          success: true,
          data: Array.from({ length: 12 }, (_, i) => ({
            label: new Date(2024, i).toLocaleString('default', { month: 'short' }),
            value: 0
          }))
        };
      }

      const validatedData = this.validateMonthlyData(results);
      return {
        success: true,
        data: validatedData
      };

    } catch (error) {
      return this.handleError(error, 'getMonthlyStats');
    }
  }

  public async getUsageStats(): Promise<DatabaseResponse<UsageStats>> {
    try {
      console.log('[DataService] Fetching usage stats...');
      const db = await this.getDatabase();
      
      // First get daily hits to calculate variance
      const dailyHitsQuery = `
        SELECT COUNT(*) as daily_hits
        FROM ${BONG_HITS_DATABASE_NAME}
        WHERE timestamp >= '2024-12-24'
        GROUP BY strftime('%Y-%m-%d', timestamp)
      `;

      const dailyHits = await db.getAllAsync<{ daily_hits: number }>(dailyHitsQuery);
      
      // Handle case with no data
      if (!dailyHits.length) {
        return {
          success: true,
          data: this.getEmptyUsageStats()
        };
      }
      
      const dailyHitsArray = dailyHits.map(row => Number(row.daily_hits));
      const mean = dailyHitsArray.reduce((sum, val) => sum + val, 0) / dailyHitsArray.length;
      const variance = dailyHitsArray.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / dailyHitsArray.length;
      const consistency = Math.sqrt(variance);
      
      const query = `
        WITH DailyStats AS (
          SELECT 
            strftime('%Y-%m-%d', timestamp) as day,
            strftime('%w', timestamp) as weekday,
            COUNT(*) as daily_hits,
            AVG(duration_ms) as avg_duration_per_day,
            MIN(duration_ms) as min_duration,
            MAX(duration_ms) as max_duration,
            SUM(duration_ms) as total_duration_per_day
          FROM ${BONG_HITS_DATABASE_NAME}
          WHERE timestamp >= '2024-12-24'
          GROUP BY day
        ),
        WeekdayStats AS (
          SELECT
            CASE WHEN weekday IN ('0', '6') THEN 'weekend' ELSE 'weekday' END as day_type,
            AVG(daily_hits) as avg_hits,
            SUM(daily_hits) as total_hits
          FROM DailyStats
          GROUP BY day_type
        ),
        HourlyStats AS (
          SELECT 
            strftime('%H', timestamp) as hour,
            COUNT(*) as hits
          FROM ${BONG_HITS_DATABASE_NAME}
          WHERE timestamp >= '2024-12-24'
          GROUP BY hour
          ORDER BY hits DESC
        )
        SELECT 
          ROUND(AVG(d.daily_hits), 2) as average_hits_per_day,
          MAX(d.daily_hits) as peak_day_hits,
          MIN(d.daily_hits) as lowest_day_hits,
          SUM(d.daily_hits) as total_hits,
          ROUND(AVG(d.avg_duration_per_day), 2) as avg_duration,
          MIN(d.min_duration) as shortest_hit,
          MAX(d.max_duration) as longest_hit,
          SUM(d.total_duration_per_day) as total_duration,
          (SELECT hour FROM HourlyStats LIMIT 1) as most_active_hour,
          (SELECT hour FROM HourlyStats ORDER BY hits ASC LIMIT 1) as least_active_hour,
          ROUND((SELECT AVG(hits) FROM HourlyStats), 2) as avg_hits_per_hour,
          (SELECT avg_hits FROM WeekdayStats WHERE day_type = 'weekday') as weekday_avg,
          (SELECT total_hits FROM WeekdayStats WHERE day_type = 'weekday') as weekday_total,
          (SELECT avg_hits FROM WeekdayStats WHERE day_type = 'weekend') as weekend_avg,
          (SELECT total_hits FROM WeekdayStats WHERE day_type = 'weekend') as weekend_total
        FROM DailyStats d
      `;

      const [result] = await db.getAllAsync<DatabaseRow>(query);
      console.log('[DataService] Raw usage stats:', result);

      if (!result) {
        return {
          success: true,
          data: this.getEmptyUsageStats()
        };
      }

      const stats: UsageStats = {
        averageHitsPerDay: Number(result.average_hits_per_day || 0),
        totalHits: Number(result.total_hits || 0),
        peakDayHits: Number(result.peak_day_hits || 0),
        lowestDayHits: Number(result.lowest_day_hits || 0),
        averageDuration: Number(result.avg_duration || 0),
        longestHit: Number(result.longest_hit || 0),
        shortestHit: Number(result.shortest_hit || 0),
        mostActiveHour: Number(result.most_active_hour || 0),
        leastActiveHour: Number(result.least_active_hour || 0),
        totalDuration: Number(result.total_duration || 0),
        averageHitsPerHour: Number(result.avg_hits_per_hour || 0),
        consistency: Math.round(consistency * 100) / 100,
        weekdayStats: {
          weekday: {
            avg: Number(result.weekday_avg || 0),
            total: Number(result.weekday_total || 0)
          },
          weekend: {
            avg: Number(result.weekend_avg || 0),
            total: Number(result.weekend_total || 0)
          }
        }
      };

      console.log('[DataService] Processed usage stats:', stats);
      return { success: true, data: stats };
    } catch (error) {
      return this.handleError(error, 'getUsageStats');
    }
  }

  public async getTimeDistribution(): Promise<DatabaseResponse<TimeDistribution>> {
    try {
      const db = await this.getDatabase();
      const query = `
        WITH HourlyHits AS (
          SELECT 
            CAST(strftime('%H', timestamp) AS INTEGER) as hour,
            COUNT(*) as hits
          FROM ${BONG_HITS_DATABASE_NAME}
          WHERE timestamp >= '2024-12-24'
          GROUP BY hour
        )
        SELECT 
          SUM(CASE WHEN hour BETWEEN 6 AND 11 THEN hits ELSE 0 END) as morning,
          SUM(CASE WHEN hour BETWEEN 12 AND 17 THEN hits ELSE 0 END) as afternoon,
          SUM(CASE WHEN hour BETWEEN 18 AND 23 THEN hits ELSE 0 END) as evening,
          SUM(CASE WHEN hour < 6 OR hour = 0 THEN hits ELSE 0 END) as night
        FROM HourlyHits
      `;

      const [result] = await db.getAllAsync<DatabaseRow>(query);

      return {
        success: true,
        data: {
          morning: Number(result?.morning || 0),
          afternoon: Number(result?.afternoon || 0),
          evening: Number(result?.evening || 0),
          night: Number(result?.night || 0)
        }
      };
    } catch (error) {
      return this.handleError(error, 'getTimeDistribution');
    }
  }

  public async getDailyAverageDatapoints(): Promise<DatabaseResponse<ChartDataPoint[]>> {
    try {
      console.log('[DataService] Fetching daily average datapoints...');
      const db = await this.getDatabase();
      const results = await db.getAllAsync<DatabaseRow>(`
        SELECT 
          strftime('%H', timestamp) as hour,
          COUNT(*) as count
        FROM ${BONG_HITS_DATABASE_NAME}
        WHERE timestamp >= '2024-12-24'
        GROUP BY hour
        ORDER BY hour
      `);

      console.log('[DataService] Raw daily average results:', results);

      const processedData = Array.from({ length: 24 }, (_, i) => ({
        label: i.toString().padStart(2, '0'),
        value: 0
      }));

      results.forEach(row => {
        const hourIndex = Number(row.hour);
        if (hourIndex >= 0 && hourIndex < 24) {
          processedData[hourIndex].value = Number(row.count || 0);
        }
      });

      console.log('[DataService] Processed daily average data:', processedData);
      return {
        success: true,
        data: processedData
      };

    } catch (error) {
      return this.handleError(error, 'getDailyAverageDatapoints');
    }
  }

  private async getDatabase(): Promise<SQLiteDatabase> {
    // Use centralized database manager instead of managing our own connection
    await databaseManager.ensureInitialized();
    return databaseManager.getDatabase(BONG_HITS_DATABASE_NAME);
  }

  private handleError<T>(error: unknown, operation: string): DatabaseResponse<T> {
    const errorMessage = error instanceof Error ? error.message : `Failed to ${operation}`;
    console.error(`[DataService] Error in ${operation}:`, error);
    return {
      success: false,
      error: errorMessage
    };
  }

  private validateWeeklyData(data: DatabaseRow[]): ChartDataPoint[] {
    console.log('[DataService] Validating weekly data:', data);
    const weekData = Array.from({ length: 7 }, (_, i) => ({
      label: dayLookUpTable.get(i) || "",
      value: 0
    }));
    
    data.forEach(row => {
      const dayIndex = Number(row.day);
      if (dayIndex >= 0 && dayIndex < 7) {
        weekData[dayIndex].value = Number(row.hit_count || 0);
      }
    });
    
    console.log('[DataService] Validated weekly data:', weekData);
    return weekData;
  }

  private validateMonthlyData(data: DatabaseRow[]): ChartDataPoint[] {
    console.log('[DataService] Validating monthly data:', data);
    const monthlyData = data.map(row => ({
      label: new Date(2024, Number(row.month) - 1).toLocaleString('default', { month: 'short' }),
      value: Number(row.hit_count || 0)
    }));
    console.log('[DataService] Validated monthly data:', monthlyData);
    return monthlyData;
  }

  private getEmptyUsageStats(): UsageStats {
    return {
      averageHitsPerDay: 0,
      totalHits: 0,
      peakDayHits: 0,
      lowestDayHits: 0,
      averageDuration: 0,
      longestHit: 0,
      shortestHit: 0,
      mostActiveHour: 0,
      leastActiveHour: 0,
      totalDuration: 0,
      averageHitsPerHour: 0,
      consistency: 0,
      weekdayStats: {
        weekday: { avg: 0, total: 0 },
        weekend: { avg: 0, total: 0 }
      }
    };
  }

  /**
   * Diagnostic function to check timestamp range of records
   */
  public async checkTimestampRange(): Promise<void> {
    try {
      const db = await this.getDatabase();
      const results = await db.getAllAsync<{min_ts: string, max_ts: string, count: number}>(`
        SELECT 
          MIN(timestamp) as min_ts,
          MAX(timestamp) as max_ts,
          COUNT(*) as count
        FROM ${BONG_HITS_DATABASE_NAME}
      `);

      if (results.length && results[0]) {
        const range = results[0];
        console.log('[DataService] TIMESTAMP DIAGNOSTIC:');
        console.log('  - Earliest record:', range.min_ts);
        console.log('  - Latest record:', range.max_ts);
        console.log('  - Record count:', range.count);
        
        // Check how many records fall in various date ranges
        const recentCounts = await db.getAllAsync<{range_name: string, count: number}>(`
          SELECT 
            'Since 2024-12-24' as range_name,
            COUNT(*) as count
          FROM ${BONG_HITS_DATABASE_NAME}
          WHERE timestamp >= '2024-12-24'
          
          UNION ALL
          
          SELECT 
            'Last 7 days' as range_name,
            COUNT(*) as count
          FROM ${BONG_HITS_DATABASE_NAME}
          WHERE timestamp >= date('now', '-7 days')
          
          UNION ALL
          
          SELECT 
            'Last 30 days' as range_name,
            COUNT(*) as count
          FROM ${BONG_HITS_DATABASE_NAME}
          WHERE timestamp >= date('now', '-30 days')
          
          UNION ALL
          
          SELECT 
            'Last 365 days' as range_name,
            COUNT(*) as count
          FROM ${BONG_HITS_DATABASE_NAME}
          WHERE timestamp >= date('now', '-365 days')
        `);
        
        console.log('[DataService] RECORDS BY TIME RANGE:');
        recentCounts.forEach(item => {
          console.log(`  - ${item.range_name}: ${item.count} records`);
        });
      }
    } catch (error) {
      console.error('[DataService] Error checking timestamp range:', error);
    }
  }

  /**
   * Get all bong hit logs from the database
   * @returns Promise with database response containing array of BongHit objects
   */
  public async getAllBongHitLogs(): Promise<DatabaseResponse<BongHit[]>> {
    try {
      console.log('[DataService] Fetching all bong hit logs...');
      const db = await this.getDatabase();
      const results = await db.getAllAsync<BongHit>(`
        SELECT 
          timestamp,
          duration_ms
        FROM ${BONG_HITS_DATABASE_NAME}
        ORDER BY timestamp DESC
      `);

      console.log('[DataService] Retrieved', results.length, 'bong hit logs');
      return {
        success: true,
        data: results
      };
    } catch (error) {
      return this.handleError(error, 'getAllBongHitLogs');
    }
  }
} 