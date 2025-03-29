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
import { getWeeklyStatsQuery, getMonthlyStatsQuery, getTimeDistributionQuery, getUsageStatsQuery, getDateRangeFilter } from "../utils/SqlTemplates";

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
    const hit: BongHit = { timestamp: timestamp, duration_ms: durationMs };
    const validationError = validateBongHit(hit);
    
    if (validationError) {
      console.error(`[BongHitsRepository] Validation error: ${validationError}`);
      throw new Error(validationError);
    }
    
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
  public async getBongHitStats(days?: number, range?: { startDate: Date, endDate: Date }): Promise<BongHitStats> {
    try {
      let filterClause = '';
      let filterParams: string[] = [];

      if (range) {
        const { clause, params } = getDateRangeFilter(range.startDate.toISOString(), range.endDate.toISOString());
        filterClause = clause;
        filterParams = params;
      } else if (days) {
        const startDate = this.getStartDateISO(days);
        const { clause, params } = getDateRangeFilter(startDate);
        filterClause = clause;
        filterParams = params;
      }
      // If neither is provided, query runs without date filter

      const query = `
        SELECT
          AVG(duration_ms) AS avg_duration,
          MAX(duration_ms) AS max_duration
        FROM ${BONG_HITS_DATABASE_NAME}
        ${filterClause}
      `;
      console.log(`[BongHitsRepository] getBongHitStats Query: ${query}, Params: ${JSON.stringify(filterParams)}`);
      const results = await this.db.getAllAsync<{avg_duration: number, max_duration: number}>(query, filterParams);
      
      if (!results.length) return this.validateBongHitStats({ averageDuration: 0, longestHit: 0 });
      const row = results[0];
      return this.validateBongHitStats({ averageDuration: row.avg_duration || 0, longestHit: row.max_duration || 0 });
    } catch (error) {
      console.error("[BongHitsRepository] Error in getBongHitStats:", error);
      throw error;
    }
  }

  /**
   * Counts hits per day over the past week (filling day indices 0..6)
   * @param days Number of days to look back
   */
  public async getHitsPerDay(days?: number, range?: { startDate: Date, endDate: Date }): Promise<DatabaseResponse<Datapoint[]>> {
    try {
      let filterClause = '';
      let filterParams: string[] = [];

      if (range) {
        const { clause, params } = getDateRangeFilter(range.startDate.toISOString(), range.endDate.toISOString());
        filterClause = clause;
        filterParams = params;
      } else if (days) {
        const startDate = this.getStartDateISO(days);
        const { clause, params } = getDateRangeFilter(startDate);
        filterClause = clause;
        filterParams = params;
      }

      const query = `
        SELECT 
          strftime('%w', timestamp, 'utc') AS day,
          COUNT(*) AS hit_count
        FROM ${BONG_HITS_DATABASE_NAME}
        ${filterClause}
        GROUP BY day
        ORDER BY day
      `;
      console.log(`[BongHitsRepository] getHitsPerDay Query: ${query}, Params: ${JSON.stringify(filterParams)}`);
      const results = await this.db.getAllAsync<{day: string, hit_count: number}>(query, filterParams);

      // Prepare an array for Sunday..Saturday
      const weekData: Datapoint[] = Array.from({ length: 7 }, (_, i) => ({
        x: dayLookUpTable.get(i) || "", // Use Map for day names
        y: 0,
      }));

      // Populate with actual data
      results.forEach(row => {
        const dayIndex = parseInt(row.day, 10);
        if (dayIndex >= 0 && dayIndex < 7) {
          weekData[dayIndex] = this.validateDatapoint({
            label: dayLookUpTable.get(dayIndex) || "", // Use Map
            value: row.hit_count,
          });
        }
      });

      return { success: true, data: weekData };
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
      const templateQuery = getTimeDistributionQuery(BONG_HITS_DATABASE_NAME);
      const { clause, params } = getDateRangeFilter(startDate);
      const finalQuery = templateQuery.replace('-- DATE FILTER ADDED EXTERNALLY', clause);
      
      // Execute query with proper params
      const result = await this.db.getFirstAsync<TimeDistribution>(finalQuery, params);
      
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
      
      return {
        success: true,
        data: {
          morning: result.morning || 0,
          afternoon: result.afternoon || 0,
          evening: result.evening || 0,
          night: result.night || 0
        }
      };
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
      
      // Modify SQL template to accept date parameter
      const templateQuery = getUsageStatsQuery(BONG_HITS_DATABASE_NAME);
      const { clause, params } = getDateRangeFilter(startDate);
      const finalQuery = templateQuery.replace('-- DATE FILTER ADDED EXTERNALLY', clause);
      
      // Execute the query
      const rawStats = await this.db.getFirstAsync<any>(finalQuery, params);
      
      if (!rawStats) {
        return {
          success: true,
          data: this.createEmptyUsageStats()
        };
      }
      
      // Fetch daily patterns
      const { weekdayAvg, weekendAvg } = await this.calculateWeekdayWeekendAverage(startDate);
      
      // Format the usage stats
      const usageStats: UsageStats = {
        totalHits: rawStats.total_hits || 0,
        averageHitsPerDay: rawStats.avg_hits_per_active_day || 0,
        peakDayHits: rawStats.max_hits_in_day || 0,
        lowestDayHits: rawStats.min_hits_in_day || 0,
        averageDuration: rawStats.avg_duration_ms || 0,
        totalDuration: rawStats.total_duration_ms || 0,
        longestHit: rawStats.longest_hit || 0,
        shortestHit: rawStats.shortest_hit || 0,
        mostActiveHour: rawStats.most_active_hour || 0,
        leastActiveHour: rawStats.least_active_hour || 0,
        
        // For these more complex statistics, we'd need to do deeper analysis
        averageHitsPerHour: 0, // Not implemented yet
        consistency: 0, // Not implemented yet
        
        // Weekday vs Weekend stats
        weekdayStats: {
          weekday: { avg: weekdayAvg, total: 0 }, // We're only interested in the average
          weekend: { avg: weekendAvg, total: 0 }  // Total counts less relevant for comparison
        }
      };
      
      return { success: true, data: usageStats };
    } catch (error) {
      return this.handleError(error, 'getUsageStats');
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

  /**
   * Get the number of hits recorded on a specific date.
   * @param date The date to check (as a Date object).
   */
  public async getHitsForDate(date: Date): Promise<DatabaseResponse<number>> {
    const startOfDay = new Date(date.getFullYear(), date.getMonth(), date.getDate(), 0, 0, 0, 0);
    const endOfDay = new Date(date.getFullYear(), date.getMonth(), date.getDate(), 23, 59, 59, 999);
    return this.getHitCountForDateRange(startOfDay, endOfDay);
  }

  /**
   * Gets the total hit count within a specific date range.
   * @param startDate The start date (local).
   * @param endDate The end date (local).
   */
  public async getHitCountForDateRange(startDate: Date, endDate: Date): Promise<DatabaseResponse<number>> {
    try {
      // Convert local Date objects to ISO strings for the filter function
      const startDateStr = startDate.toISOString();
      const endDateStr = endDate.toISOString();

      console.log(`[BongHitsRepository] Fetching hit count for range: ${startDateStr} to ${endDateStr}`);

      const { clause, params } = getDateRangeFilter(startDateStr, endDateStr);

      const query = `
        SELECT COUNT(*) as count
        FROM ${BONG_HITS_DATABASE_NAME}
        ${clause}
      `;

      console.log(`[BongHitsRepository] getHitCountForDateRange Query: ${query}, Params: ${JSON.stringify(params)}`);
      const result = await this.db.getFirstAsync<{ count: number }>(query, params);

      const count = result?.count ?? 0;
      console.log(`[BongHitsRepository] Hits found for range: ${count}`);

      return { success: true, data: count };
    } catch (error) {
      console.error(`[BongHitsRepository] Error getting hit count for range:`, error);
      return this.handleError(error, "getHitCountForDateRange");
    }
  }

  /**
   * Gets the average hits per day within a specific date range.
   * @param startDate The start date (local).
   * @param endDate The end date (local).
   */
  public async getAverageHitsPerDayForDateRange(startDate: Date, endDate: Date): Promise<DatabaseResponse<number>> {
    try {
      const startDateStr = startDate.toISOString();
      const endDateStr = endDate.toISOString();

      console.log(`[BongHitsRepository] Calculating average hits for range: ${startDateStr} to ${endDateStr}`);

      const { clause, params } = getDateRangeFilter(startDateStr, endDateStr);

      const query = `
        SELECT
          COUNT(*) as total_hits,
          COUNT(DISTINCT strftime('%Y-%m-%d', timestamp, 'utc')) as active_days_in_range
        FROM ${BONG_HITS_DATABASE_NAME}
        ${clause}
      `;

      console.log(`[BongHitsRepository] Range Avg Query: ${query}, Params: ${JSON.stringify(params)}`);
      const result = await this.db.getFirstAsync<{ total_hits: number; active_days_in_range: number }>(query, params);

      const totalHits = result?.total_hits ?? 0;
      const activeDays = result?.active_days_in_range ?? 0;

      // Calculate duration of the range in days for averaging
      const diffTime = Math.abs(endDate.getTime() - startDate.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      const numberOfDaysInRange = Math.max(1, diffDays); // Ensure at least 1 day

      // Average based on the number of days in the range
      const average = numberOfDaysInRange > 0 ? totalHits / numberOfDaysInRange : 0;

      console.log(`[BongHitsRepository] Range Hits: ${totalHits}, Days in Range: ${numberOfDaysInRange}, Average: ${average}`);

      return { success: true, data: average };
    } catch (error) {
      console.error(`[BongHitsRepository] Error getting average hits for range:`, error);
      return this.handleError(error, "getAverageHitsPerDayForDateRange");
    }
  }

  /**
   * Gets the average hits per day for the current calendar week (Sunday to Saturday).
   */
  public async getAverageHitsForCurrentWeek(): Promise<DatabaseResponse<number>> {
    const now = new Date();
    const todayDayOfWeek = now.getDay(); // 0 = Sunday

    // Calculate start of the week (Sunday)
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - todayDayOfWeek);
    startOfWeek.setHours(0, 0, 0, 0);

    // Use end of *today* for the range
    const endOfToday = new Date();
    endOfToday.setHours(23, 59, 59, 999);

    // Fetch total hits for the range Sun -> Today
    const hitsResponse = await this.getHitCountForDateRange(startOfWeek, endOfToday);

    if (!hitsResponse.success) {
      return hitsResponse; // Propagate error
    }

    const totalHits = hitsResponse.data ?? 0;
    const daysPassedInWeek = todayDayOfWeek + 1; // 1 for Sun, ..., 7 for Sat
    const average = daysPassedInWeek > 0 ? totalHits / daysPassedInWeek : 0;

    console.log(`[BongHitsRepository] Current Week Avg Recalculated - Hits: ${totalHits}, Days Passed: ${daysPassedInWeek}, Average: ${average}`);
    return { success: true, data: average };
  }

  /**
   * Helper method to create empty usage stats object
   */
  private createEmptyUsageStats(): UsageStats {
    return {
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
    };
  }

  /**
   * Calculate average hits for weekdays and weekends
   */
  private async calculateWeekdayWeekendAverage(startDate: string): Promise<{ weekdayAvg: number, weekendAvg: number }> {
    try {
      const query = `
        WITH DayStats AS (
          SELECT 
            CASE WHEN strftime('%w', timestamp, 'utc') IN ('0', '6') THEN 'weekend' ELSE 'weekday' END as day_type,
            strftime('%Y-%m-%d', timestamp, 'utc') as date,
            COUNT(*) as hits
          FROM ${BONG_HITS_DATABASE_NAME}
          WHERE timestamp >= ?
          GROUP BY day_type, date
        )
        SELECT 
          day_type,
          AVG(hits) as avg_hits
        FROM DayStats
        GROUP BY day_type
      `;
      
      const results = await this.db.getAllAsync<{ day_type: string, avg_hits: number }>(query, [startDate]);
      
      let weekdayAvg = 0;
      let weekendAvg = 0;
      
      results.forEach(row => {
        if (row.day_type === 'weekday') {
          weekdayAvg = row.avg_hits || 0;
        } else {
          weekendAvg = row.avg_hits || 0;
        }
      });
      
      return { weekdayAvg, weekendAvg };
    } catch (error) {
      console.error('[BongHitsRepository] Error calculating weekday/weekend averages:', error);
      return { weekdayAvg: 0, weekendAvg: 0 };
    }
  }

  /**
   * Gets hourly averages for a specific day, grouped into 3-hour segments for better visualization
   * @param startDate The start date (local).
   * @param endDate The end date (local).
   */
  public async getHourlyAveragesForDay(startDate: Date, endDate: Date): Promise<DatabaseResponse<ChartDataPoint[]>> {
    try {
      const startDateStr = startDate.toISOString();
      const endDateStr = endDate.toISOString();
      const { clause, params } = getDateRangeFilter(startDateStr, endDateStr);

      // Group by hour of day in local time
      const query = `
        SELECT
          strftime('%H', timestamp, 'localtime') AS hourOfDay, 
          COUNT(*) AS count
        FROM ${BONG_HITS_DATABASE_NAME}
        ${clause}
        GROUP BY hourOfDay
        ORDER BY hourOfDay
      `;
      
      console.log(`[BongHitsRepository] getHourlyAveragesForDay Query: ${query}, Params: ${JSON.stringify(params)}`);
      const results = await this.db.getAllAsync<{hourOfDay: string, count: number}>(query, params);

      // Fill missing hours with zeros and create 3-hour segments
      const hourSegments = [
        { label: "12-3 AM", hours: ["00", "01", "02"], value: 0 },
        { label: "3-6 AM", hours: ["03", "04", "05"], value: 0 },
        { label: "6-9 AM", hours: ["06", "07", "08"], value: 0 },
        { label: "9-12 PM", hours: ["09", "10", "11"], value: 0 },
        { label: "12-3 PM", hours: ["12", "13", "14"], value: 0 },
        { label: "3-6 PM", hours: ["15", "16", "17"], value: 0 },
        { label: "6-9 PM", hours: ["18", "19", "20"], value: 0 },
        { label: "9-12 AM", hours: ["21", "22", "23"], value: 0 }
      ];

      // Map hourOfDay -> count for easy lookup
      const hourMap = new Map<string, number>();
      results.forEach(row => {
        hourMap.set(row.hourOfDay, row.count);
      });

      // Aggregate hours into segments
      hourSegments.forEach(segment => {
        segment.hours.forEach(hour => {
          segment.value += hourMap.get(hour) || 0;
        });
      });

      // Convert to ChartDataPoint
      const data: ChartDataPoint[] = hourSegments.map(segment => ({
        label: segment.label,
        value: segment.value
      }));

      return { success: true, data };
    } catch (error) {
      console.error(`[BongHitsRepository] Error getting hourly averages for day:`, error);
      return this.handleError(error, "getHourlyAveragesForDay");
    }
  }

  /**
   * Gets hits grouped by day of the month and organized into weeks
   * @param startDate The start date (local).
   * @param endDate The end date (local).
   */
  public async getHitsByDayOfMonth(startDate: Date, endDate: Date): Promise<DatabaseResponse<ChartDataPoint[]>> {
    try {
      const startDateStr = startDate.toISOString();
      const endDateStr = endDate.toISOString();
      const { clause, params } = getDateRangeFilter(startDateStr, endDateStr);

      // Query to get hits by date
      const query = `
        SELECT
          strftime('%Y-%m-%d', timestamp, 'localtime') as date,
          COUNT(*) as count
        FROM ${BONG_HITS_DATABASE_NAME}
        ${clause}
        GROUP BY date
        ORDER BY date ASC
      `;

      console.log(`[BongHitsRepository] getHitsByDayOfMonth Query: ${query}, Params: ${JSON.stringify(params)}`);
      const results = await this.db.getAllAsync<{ date: string; count: number }>(query, params);

      // If no results, return empty array
      if (!results || results.length === 0) {
        return { success: true, data: [] };
      }

      // Group days into week segments
      const firstDate = new Date(results[0].date);
      const weekSunday = new Date(firstDate);
      weekSunday.setDate(firstDate.getDate() - firstDate.getDay()); // Go back to the previous Sunday

      // Prepare week segments
      const weekSegments: { startDate: Date; endDate: Date; label: string; value: number }[] = [];
      let currentWeekStart = new Date(weekSunday);

      // Create segments for the weeks in the month
      for (let i = 0; i < 5; i++) { // Max 5 weeks in a month
        const weekEnd = new Date(currentWeekStart);
        weekEnd.setDate(currentWeekStart.getDate() + 6); // Saturday

        if (weekEnd < startDate) {
          // Skip weeks before our date range
          currentWeekStart.setDate(currentWeekStart.getDate() + 7);
          continue;
        }

        if (currentWeekStart > endDate) {
          // Stop if we've gone beyond our date range
          break;
        }

        const formattedStartDate = `${currentWeekStart.getDate()}`;
        const formattedEndDate = `${weekEnd.getDate()}`;

        weekSegments.push({
          startDate: new Date(currentWeekStart),
          endDate: new Date(weekEnd),
          label: `${formattedStartDate}-${formattedEndDate}`,
          value: 0
        });

        currentWeekStart.setDate(currentWeekStart.getDate() + 7);
      }

      // Map date string -> count for easy lookup
      const dateMap = new Map<string, number>();
      results.forEach(row => {
        dateMap.set(row.date, row.count);
      });

      // Aggregate days into week segments
      for (const segment of weekSegments) {
        let currentDate = new Date(segment.startDate);
        while (currentDate <= segment.endDate) {
          const dateString = currentDate.toISOString().split('T')[0]; // YYYY-MM-DD
          segment.value += dateMap.get(dateString) || 0;
          currentDate.setDate(currentDate.getDate() + 1);
        }
      }

      // Convert to ChartDataPoint
      const data: ChartDataPoint[] = weekSegments.map(segment => ({
        label: segment.label,
        value: segment.value
      }));

      return { success: true, data };
    } catch (error) {
      console.error(`[BongHitsRepository] Error getting hits by day of month:`, error);
      return this.handleError(error, "getHitsByDayOfMonth");
    }
  }
} 