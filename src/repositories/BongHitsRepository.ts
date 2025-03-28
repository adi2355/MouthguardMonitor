import { BaseRepository } from "./BaseRepository";
import { 
  BongHit, 
  BongHitStats, 
  Datapoint, 
  AverageHourCount, 
  DatabaseResponse,
  ChartDataPoint,
  UsageStats,
  TimeDistribution,
} from "../types";
import { BONG_HITS_DATABASE_NAME, dayLookUpTable } from "../constants";
import { validateBongHit } from "../utils/validators";
import { getWeeklyStatsQuery, getMonthlyStatsQuery, getTimeDistributionQuery, getUsageStatsQuery } from "../utils/SqlTemplates";

/**
 * Repository for managing bong hit data
 */
export class BongHitsRepository extends BaseRepository {
  /**
   * Record a new bong hit
   * @param timestamp ISO string timestamp of the hit
   * @param durationMs Duration of the hit in milliseconds
   */
  public async recordBongHit(timestamp: string, durationMs: number): Promise<void> {
    // const hit: BongHit = { timestamp: timestamp, duration_ms: durationMs };
    // const validationError = validateBongHit(hit);
    
    // if (validationError) {
    //   throw new Error(validationError);
    // }
    
    try {
      await this.executeTransaction(async () => {
        await this.db.runAsync(
          `INSERT INTO ${BONG_HITS_DATABASE_NAME} (timestamp, duration_ms) 
           VALUES (?, ?)`,
          [timestamp, durationMs]
        );
      });
    } catch (error) {
      console.error('[BongHitsRepository] Error recording bong hit:', error);
      throw error;
    }
  }

  /**
   * Retrieves average and max duration over the past n days
   * @param days Number of days to look back
   */
  public async getBongHitStats(days: number = 7): Promise<BongHitStats> {
    try {
      // Calculate start date based on days parameter
      const startDate = this.getStartDateISO(days);
      
      const results = await this.db.getAllAsync<{avg_duration: number, max_duration: number}>(`
        SELECT
          AVG(duration_ms) AS avg_duration,
          MAX(duration_ms) AS max_duration
        FROM ${BONG_HITS_DATABASE_NAME}
        WHERE timestamp >= ?
      `, [startDate]);

      if (!results.length) {
        // Fallback if no data
        return this.validateBongHitStats({ averageDuration: 0, longestHit: 0 });
      }

      const row = results[0];
      return this.validateBongHitStats({
        averageDuration: row.avg_duration || 0,
        longestHit: row.max_duration || 0,
      });
    } catch (error) {
      console.error("[BongHitsRepository] Error in getBongHitStats:", error);
      throw error;
    }
  }

  /**
   * Counts hits per day over the past week (filling day indices 0..6)
   * @param days Number of days to look back
   */
  public async getHitsPerDay(days: number = 7): Promise<DatabaseResponse<Datapoint[]>> {
    try {
      // Calculate start date based on days parameter
      const startDate = this.getStartDateISO(days);
      
      const results = await this.db.getAllAsync<{day: string, hit_count: number}>(`
        SELECT 
          strftime('%w', timestamp) AS day,
          COUNT(*) AS hit_count
        FROM ${BONG_HITS_DATABASE_NAME}
        WHERE timestamp >= ?
        GROUP BY day
        ORDER BY day
      `, [startDate]);

      // Prepare an array for Sunday..Saturday
      const weekData: Datapoint[] = Array.from({ length: 7 }, (_, i) => ({
        x: dayLookUpTable.get(i) || "",
        y: 0,
      }));

      results.forEach(row => {
        const dayIndex = parseInt(row.day, 10);
        if (dayIndex >= 0 && dayIndex < 7) {
          weekData[dayIndex] = this.validateDatapoint({
            label: dayLookUpTable.get(dayIndex) || "",
            value: row.hit_count,
          });
        }
      });

      return {
        success: true,
        data: weekData
      };
    } catch (error) {
      return this.handleError(error, "getHitsPerDay");
    }
  }

  /**
   * Returns a list of (hourOfDay -> # of hits) since n days ago,
   * filling missing hours with 0
   * @param days Number of days to look back
   */
  public async getHourlyAverages(days: number = 7): Promise<DatabaseResponse<AverageHourCount[]>> {
    try {
      // Calculate start date based on days parameter
      const startDate = this.getStartDateISO(days);
      
      const results = await this.db.getAllAsync<{hourOfDay: string, count: number}>(`
        SELECT 
          strftime('%H', timestamp) AS hourOfDay,
          COUNT(*) AS count
        FROM ${BONG_HITS_DATABASE_NAME}
        WHERE timestamp >= ?
        GROUP BY hourOfDay
        ORDER BY hourOfDay
      `, [startDate]);

      // Hours "00" through "23"
      const allHours = Array.from({ length: 24 }, (_, i) => i.toString().padStart(2, "0"));
      const dataMap = new Map<string, number>(
        results.map(item => [item.hourOfDay, item.count])
      );

      const data = allHours.map((hour) =>
        this.validateAverageHourCount({
          hourOfDay: hour,
          count: dataMap.get(hour) || 0,
        })
      );

      return {
        success: true,
        data
      };
    } catch (error) {
      return this.handleError(error, "getHourlyAverages");
    }
  }

  /**
   * Get weekly statistics
   * @param days Number of days to look back
   */
  public async getWeeklyStats(days: number = 30): Promise<DatabaseResponse<ChartDataPoint[]>> {
    try {
      // Calculate start date based on days parameter
      const startDate = this.getStartDateISO(days);
      
      // Modify SQL template to accept date parameter
      const templateQuery = getWeeklyStatsQuery(BONG_HITS_DATABASE_NAME);
      const query = templateQuery.replace(/WHERE timestamp >= '[^']+'/g, 'WHERE timestamp >= ?');
      
      const weekData = await this.db.getAllAsync<{ label: string; value: number; avg_duration: number }>(
        query, [startDate]
      );
      
      if (!weekData || weekData.length === 0) {
        return {
          success: true,
          data: []
        };
      }
      
      // Format data for chart display
      const data: ChartDataPoint[] = weekData.map(point => ({
        label: point.label,
        value: parseInt(String(point.value || 0)),
        meta: { avgDuration: Math.round(point.avg_duration || 0) }
      }));
      
      return { success: true, data };
    } catch (error) {
      return this.handleError(error, 'getWeeklyStats');
    }
  }
  
  /**
   * Get monthly statistics
   * @param days Number of days to look back
   */
  public async getMonthlyStats(days: number = 90): Promise<DatabaseResponse<ChartDataPoint[]>> {
    try {
      // Calculate start date based on days parameter
      const startDate = this.getStartDateISO(days);
      
      // Modify SQL template to accept date parameter
      const templateQuery = getMonthlyStatsQuery(BONG_HITS_DATABASE_NAME);
      const query = templateQuery.replace(/WHERE timestamp >= '[^']+'/g, 'WHERE timestamp >= ?');
      
      const monthData = await this.db.getAllAsync<{ label: string; value: number; avg_duration: number }>(
        query, [startDate]
      );
      
      if (!monthData || monthData.length === 0) {
        return {
          success: true,
          data: []
        };
      }
      
      // Format data for chart display
      const data: ChartDataPoint[] = monthData.map(point => ({
        label: point.label,
        value: parseInt(String(point.value || 0)),
        meta: { avgDuration: Math.round(point.avg_duration || 0) }
      }));
      
      return { success: true, data };
    } catch (error) {
      return this.handleError(error, 'getMonthlyStats');
    }
  }

  /**
   * Get time distribution of usage
   * @param days Number of days to look back
   */
  public async getTimeDistribution(days: number = 30): Promise<DatabaseResponse<TimeDistribution>> {
    try {
      // Calculate start date based on days parameter
      const startDate = this.getStartDateISO(days);
      
      // Modify SQL template to accept date parameter
      const templateQuery = getTimeDistributionQuery(BONG_HITS_DATABASE_NAME, days);
      const query = templateQuery.replace(/WHERE timestamp >= '[^']+'/g, 'WHERE timestamp >= ?');
      
      const [result] = await this.db.getAllAsync<{ 
        morning: number, 
        afternoon: number, 
        evening: number, 
        night: number 
      }>(query, [startDate]);
      
      if (!result) {
        return {
          success: true,
          data: {
            morning: 0,
            afternoon: 0,
            evening: 0,
            night: 0
          }
        };
      }

      const distribution: TimeDistribution = {
        morning: Number(result.morning || 0),
        afternoon: Number(result.afternoon || 0),
        evening: Number(result.evening || 0),
        night: Number(result.night || 0)
      };

      return { success: true, data: distribution };
    } catch (error) {
      return this.handleError(error, 'getTimeDistribution');
    }
  }

  /**
   * Get usage statistics
   * @param days Number of days to look back
   */
  public async getUsageStats(days: number = 30): Promise<DatabaseResponse<UsageStats>> {
    try {
      // Calculate start date based on days parameter
      const startDate = this.getStartDateISO(days);
      
      // First get daily hits to calculate variance with parameterized date
      const dailyHitsQuery = `
        SELECT COUNT(*) as daily_hits
        FROM ${BONG_HITS_DATABASE_NAME}
        WHERE timestamp >= ?
        GROUP BY strftime('%Y-%m-%d', timestamp)
      `;

      const dailyHits = await this.db.getAllAsync<{ daily_hits: number }>(dailyHitsQuery, [startDate]);
      
      // Handle case with no data
      if (!dailyHits.length) {
        return {
          success: true,
          data: {
            totalHits: 0,
            averageHitsPerDay: 0,
            averageHitsPerHour: 0,
            averageDuration: 0,
            totalDuration: 0,
            peakDayHits: 0,
            lowestDayHits: 0,
            mostActiveHour: 0,
            leastActiveHour: 0,
            longestHit: 0,
            shortestHit: 0,
            consistency: 0,
            weekdayStats: {
              weekday: { total: 0, avg: 0 },
              weekend: { total: 0, avg: 0 }
            }
          }
        };
      }

      // Calculate consistency score based on standard deviation of daily hits
      const hitValues = dailyHits.map(row => row.daily_hits);
      const stdDev = this.calculateStandardDeviation(hitValues);
      const mean = hitValues.reduce((a, b) => a + b, 0) / hitValues.length;
      const cv = mean > 0 ? (stdDev / mean) * 100 : 0;
      const consistencyScore = Math.min(10, 10 * Math.exp(-0.05 * cv)); // Scale to 0-10
      
      // Modify usage stats query to accept date parameter
      const templateQuery = getUsageStatsQuery(BONG_HITS_DATABASE_NAME, days);
      const query = templateQuery.replace(/WHERE timestamp >= '[^']+'/g, 'WHERE timestamp >= ?');
      
      const statsResult = await this.db.getFirstAsync<{ 
        total_hits: number, 
        active_days: number, 
        avg_hits_per_active_day: number, 
        avg_duration_ms: number, 
        total_duration_ms: number, 
        max_hits_in_day: number 
      }>(query, [startDate]);
      
      if (!statsResult) {
        return { success: false, error: "Failed to get usage stats" };
      }
      
      // Get hourly distribution for most/least active hour with parameterized date
      const hourlyQuery = `
        SELECT 
          CAST(strftime('%H', timestamp) AS INTEGER) as hour,
          COUNT(*) as hits
        FROM ${BONG_HITS_DATABASE_NAME}
        WHERE timestamp >= ?
        GROUP BY hour
        ORDER BY hits DESC
      `;
      
      const hourlyResults = await this.db.getAllAsync<{ hour: number, hits: number }>(hourlyQuery, [startDate]);
      const mostActiveHour = hourlyResults.length > 0 ? hourlyResults[0].hour : 0;
      const leastActiveHour = hourlyResults.length > 0 ? hourlyResults[hourlyResults.length - 1].hour : 0;
      
      // Get min/max duration with parameterized date
      const durationQuery = `
        SELECT 
          MIN(duration_ms) as min_duration,
          MAX(duration_ms) as max_duration
        FROM ${BONG_HITS_DATABASE_NAME}
        WHERE timestamp >= ?
      `;
      
      const durationResult = await this.db.getFirstAsync<{ min_duration: number, max_duration: number }>(
        durationQuery, [startDate]
      );
      
      // Calculate weekday vs weekend stats with parameterized date
      const weekdayQuery = `
        WITH DayStats AS (
          SELECT 
            CASE WHEN strftime('%w', timestamp) IN ('0', '6') THEN 'weekend' ELSE 'weekday' END as day_type,
            strftime('%Y-%m-%d', timestamp) as date,
            COUNT(*) as hits
          FROM ${BONG_HITS_DATABASE_NAME}
          WHERE timestamp >= ?
          GROUP BY day_type, date
        )
        SELECT 
          day_type,
          SUM(hits) as total_hits,
          AVG(hits) as avg_hits
        FROM DayStats
        GROUP BY day_type
      `;
      
      const weekdayResults = await this.db.getAllAsync<{ day_type: string, total_hits: number, avg_hits: number }>(
        weekdayQuery, [startDate]
      );
      
      const weekdayStats = {
        weekday: { total: 0, avg: 0 },
        weekend: { total: 0, avg: 0 }
      };
      
      weekdayResults.forEach(row => {
        if (row.day_type === 'weekday') {
          weekdayStats.weekday.total = row.total_hits;
          weekdayStats.weekday.avg = row.avg_hits;
        } else {
          weekdayStats.weekend.total = row.total_hits;
          weekdayStats.weekend.avg = row.avg_hits;
        }
      });
      
      // Create final stats object
      const stats: UsageStats = {
        totalHits: statsResult.total_hits || 0,
        averageHitsPerDay: statsResult.avg_hits_per_active_day || 0,
        averageHitsPerHour: statsResult.total_hits ? (statsResult.total_hits / (24 * (statsResult.active_days || 1))) : 0,
        averageDuration: statsResult.avg_duration_ms || 0,
        totalDuration: statsResult.total_duration_ms || 0,
        peakDayHits: statsResult.max_hits_in_day || 0,
        lowestDayHits: Math.min(...hitValues),
        mostActiveHour,
        leastActiveHour,
        longestHit: durationResult?.max_duration || 0,
        shortestHit: durationResult?.min_duration || 0,
        consistency: Number(consistencyScore.toFixed(2)),
        weekdayStats
      };
      
      return {
        success: true,
        data: stats
      };
    } catch (error) {
      return this.handleError(error, "getUsageStats");
    }
  }

  /**
   * Get all bong hit logs from the database
   */
  public async getAllBongHitLogs(): Promise<DatabaseResponse<BongHit[]>> {
    try {
      const results = await this.db.getAllAsync<BongHit>(`
        SELECT 
          timestamp,
          duration_ms
        FROM ${BONG_HITS_DATABASE_NAME}
        ORDER BY timestamp DESC
      `);

      return {
        success: true,
        data: results
      };
    } catch (error) {
      return this.handleError(error, 'getAllBongHitLogs');
    }
  }

  /**
   * Calculate the standard deviation of an array of numbers
   */
  private calculateStandardDeviation(values: number[]): number {
    if (values.length === 0) return 0;
    
    const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
    const squaredDifferences = values.map(val => Math.pow(val - mean, 2));
    const variance = squaredDifferences.reduce((sum, val) => sum + val, 0) / values.length;
    
    return Math.sqrt(variance);
  }

  /**
   * Helper to get ISO date string for n days ago
   */
  private getStartDateISO(days: number): string {
    const date = new Date();
    date.setDate(date.getDate() - days);
    return date.toISOString();
  }

  /**
   * Validate BongHitStats to ensure correct types/values
   */
  private validateBongHitStats = (stats: BongHitStats): BongHitStats => ({
    averageDuration: Math.max(0, Number(stats.averageDuration) || 0),
    longestHit: Math.max(0, Number(stats.longestHit) || 0),
  });

  /**
   * Convert ChartDataPoint to Datapoint
   */
  private chartDataToDatapoint(point: ChartDataPoint): Datapoint {
    return {
      x: point.label,
      y: point.value
    };
  }

  /**
   * Validate Datapoint to ensure correct types/values
   */
  private validateDatapoint = (point: {label: string, value: number}): Datapoint => ({
    x: String(point.label || ""),
    y: Math.max(0, Number(point.value) || 0),
  });

  /**
   * Validate AverageHourCount to ensure correct types/values
   */
  private validateAverageHourCount = (count: AverageHourCount): AverageHourCount => ({
    hourOfDay: String(count.hourOfDay || "00"),
    count: Math.max(0, Number(count.count) || 0),
  });
} 