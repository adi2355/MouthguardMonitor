import { databaseManager } from "@/src/DatabaseManager";
import { SQLiteDatabase } from "expo-sqlite";
import { 
  // Generic types
  BongHit, ChartDataPoint, DatabaseResponse, UsageStats, TimeDistribution,
  Strain, DatabaseRow, Datapoint
} from "@/src/types";
import {
  Achievement, UserAchievement, UserAchievementWithDetails
} from "@/src/types/achievements";
import { BONG_HITS_DATABASE_NAME, STRAINS_DATABASE_NAME } from "@/src/constants";
import { StrainSearchFilters, PaginationParams, StrainSearchResult } from "../services/StrainService";

/**
 * DatabaseService - Unified service for all database operations
 * Consolidates functionality from:
 * - DataService
 * - StrainService
 * - SafetyService
 * - AchievementService
 */
export class DatabaseService {
  private static instance: DatabaseService;
  
  public static getInstance(): DatabaseService {
    if (!DatabaseService.instance) {
      DatabaseService.instance = new DatabaseService();
    }
    return DatabaseService.instance;
  }
  
  private constructor() {
    // Initialize database manager on first use
  }
  
  public async cleanup(): Promise<void> {
    await databaseManager.cleanup();
  }
  
  /* ------------------------------------------------------------------
     Data methods (previously in DataService)
   ------------------------------------------------------------------ */
  
  public async getWeeklyStats(): Promise<DatabaseResponse<ChartDataPoint[]>> {
    return {
      success: true,
      data: await this.formatDatapoints(await databaseManager.queryNumberOfHitsFromPastWeek())
    };
  }
  
  public async getMonthlyStats(): Promise<DatabaseResponse<ChartDataPoint[]>> {
    try {
      // Use database manager to get data
      const db = await databaseManager.getDatabase(BONG_HITS_DATABASE_NAME);
      const results = await db.getAllAsync<DatabaseRow>(`
        SELECT 
          strftime('%m', timestamp) as month,
          COUNT(*) as hit_count
        FROM ${BONG_HITS_DATABASE_NAME}
        WHERE timestamp >= '2024-12-24'
        GROUP BY month
        ORDER BY month
      `);

      if (!results?.length) {
        return {
          success: true,
          data: Array.from({ length: 12 }, (_, i) => ({
            label: new Date(2024, i).toLocaleString('default', { month: 'short' }),
            value: 0
          }))
        };
      }

      // Convert month numbers to month names
      const monthlyData = results.map(row => ({
        label: new Date(2024, Number(row.month) - 1).toLocaleString('default', { month: 'short' }),
        value: Number(row.hit_count || 0)
      }));

      return {
        success: true,
        data: monthlyData
      };
    } catch (error) {
      return this.handleError(error, 'getMonthlyStats');
    }
  }
  
  public async getUsageStats(): Promise<DatabaseResponse<UsageStats>> {
    try {
      // This complex query is delegated to DatabaseManager
      const result = await databaseManager.getDailyStats("W");
      
      // TODO: Implement complete usage stats calculation
      // For now, returning a simplified version
      return {
        success: true,
        data: {
          averageHitsPerDay: result.stats.totalHits / 7,
          totalHits: result.stats.totalHits,
          peakDayHits: result.stats.totalHits,
          lowestDayHits: 0,
          averageDuration: result.stats.avgDuration,
          longestHit: result.stats.avgDuration * 2, // Estimate
          shortestHit: result.stats.avgDuration / 2, // Estimate
          mostActiveHour: result.stats.peakHour ? parseInt(result.stats.peakHour) : 0,
          leastActiveHour: 0,
          totalDuration: result.stats.avgDuration * result.stats.totalHits,
          averageHitsPerHour: result.stats.totalHits / 24,
          consistency: 0,
          weekdayStats: {
            weekday: { avg: 0, total: 0 },
            weekend: { avg: 0, total: 0 }
          }
        }
      };
    } catch (error) {
      return this.handleError(error, 'getUsageStats');
    }
  }
  
  public async getTimeDistribution(): Promise<DatabaseResponse<TimeDistribution>> {
    try {
      const db = await databaseManager.getDatabase(BONG_HITS_DATABASE_NAME);
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

      const results = await db.getAllAsync<DatabaseRow>(query);
      const result = results[0] || {};

      return {
        success: true,
        data: {
          morning: Number(result.morning || 0),
          afternoon: Number(result.afternoon || 0),
          evening: Number(result.evening || 0),
          night: Number(result.night || 0)
        }
      };
    } catch (error) {
      return this.handleError(error, 'getTimeDistribution');
    }
  }
  
  public async getDailyAverageDatapoints(): Promise<DatabaseResponse<ChartDataPoint[]>> {
    try {
      const hourCounts = await databaseManager.getDailyAverageDatapoints();
      
      // Convert to ChartDataPoint format
      const chartData = hourCounts.map(item => ({
        label: item.hourOfDay,
        value: item.count
      }));
      
      return {
        success: true,
        data: chartData
      };
    } catch (error) {
      return this.handleError(error, 'getDailyAverageDatapoints');
    }
  }
  
  /**
   * Get all bong hit logs from the database
   */
  public async getAllBongHitLogs(): Promise<DatabaseResponse<BongHit[]>> {
    try {
      const db = await databaseManager.getDatabase(BONG_HITS_DATABASE_NAME);
      const results = await db.getAllAsync<BongHit>(`
        SELECT 
          timestamp,
          duration_ms
        FROM ${BONG_HITS_DATABASE_NAME}
        ORDER BY timestamp DESC
      `);

      console.log('[DatabaseService] Retrieved', results.length, 'bong hit logs');
      return {
        success: true,
        data: results
      };
    } catch (error) {
      return this.handleError(error, 'getAllBongHitLogs');
    }
  }
  
  /**
   * Record a new bong hit
   */
  public async recordBongHit(timestamp: string, durationMs: number): Promise<DatabaseResponse<void>> {
    try {
      await databaseManager.recordBongHit(timestamp, durationMs);
      return { success: true };
    } catch (error) {
      return this.handleError(error, 'recordBongHit');
    }
  }
  
  /* ------------------------------------------------------------------
     Strain methods (previously in StrainService)
   ------------------------------------------------------------------ */
  
  public async searchStrains(
    query: string = '',
    filters: StrainSearchFilters = {},
    pagination: PaginationParams = { page: 1, limit: 20 }
  ): Promise<StrainSearchResult> {
    try {
      const db = await databaseManager.getDatabase(STRAINS_DATABASE_NAME);
      const { page, limit } = pagination;
      const offset = (page - 1) * limit;
      
      let whereConditions: string[] = [];
      let params: any[] = [];

      // Add search query conditions
      if (query.trim()) {
        const searchTerms = query.trim().split(/\s+/);
        searchTerms.forEach(term => {
          whereConditions.push('(name LIKE ? OR effects LIKE ? OR genetic_type LIKE ? OR uses LIKE ?)');
          const searchTerm = `%${term}%`;
          params.push(searchTerm, searchTerm, searchTerm, searchTerm);
        });
      }

      // Add filter conditions
      if (filters.geneticType) {
        whereConditions.push('genetic_type = ?');
        params.push(filters.geneticType);
      }

      if (filters.effects?.length) {
        filters.effects.forEach(effect => {
          whereConditions.push('effects LIKE ?');
          params.push(`%${effect}%`);
        });
      }

      if (filters.minTHC !== undefined) {
        whereConditions.push('CAST(SUBSTR(thc_range, 1, INSTR(thc_range, "-")-1) AS FLOAT) >= ?');
        params.push(filters.minTHC);
      }

      if (filters.maxTHC !== undefined) {
        whereConditions.push('CAST(SUBSTR(thc_range, INSTR(thc_range, "-")+1) AS FLOAT) <= ?');
        params.push(filters.maxTHC);
      }

      const whereClause = whereConditions.length 
        ? `WHERE ${whereConditions.join(' AND ')}` 
        : '';

      // Get total count
      const countQuery = `SELECT COUNT(*) as total FROM ${STRAINS_DATABASE_NAME} ${whereClause}`;
      const countResults = await db.getAllAsync<{ total: number }>(countQuery, params);
      const total = countResults[0]?.total || 0;

      // Get filtered results
      const searchQuery = `
        SELECT * FROM ${STRAINS_DATABASE_NAME} 
        ${whereClause} 
        ORDER BY ${this.getSortOrder(filters.sort)}
        LIMIT ? OFFSET ?`;
      
      const results = await db.getAllAsync<Strain>(
        searchQuery,
        [...params, limit, offset]
      );

      const totalPages = Math.ceil(total / limit);

      return {
        success: true,
        data: results,
        total,
        currentPage: page,
        totalPages,
        hasMore: (page * limit) < total
      };
    } catch (error) {
      console.error('[DatabaseService] Search error:', error);
      return {
        success: false,
        data: [],
        error: error instanceof Error ? error.message : 'Search failed',
        total: 0,
        currentPage: 1,
        totalPages: 1,
        hasMore: false
      };
    }
  }
  
  private getSortOrder(sort?: 'rating' | 'name' | 'thc'): string {
    switch (sort) {
      case 'name':
        return 'name ASC';
      case 'thc':
        return 'CAST(SUBSTR(thc_range, 1, INSTR(thc_range, "-")-1) AS FLOAT) DESC';
      case 'rating':
      default:
        return 'combined_rating DESC';
    }
  }
  
  public async getStrainById(id: number): Promise<Strain | null> {
    try {
      const db = await databaseManager.getDatabase(STRAINS_DATABASE_NAME);
      const results = await db.getAllAsync<Strain>(
        `SELECT * FROM ${STRAINS_DATABASE_NAME} WHERE id = ? LIMIT 1`,
        [id]
      );
      return results[0] || null;
    } catch (error) {
      console.error('[DatabaseService] Error getting strain by id:', error);
      return null;
    }
  }
  
  public async getPopularStrains(limit: number = 10): Promise<Strain[]> {
    try {
      const db = await databaseManager.getDatabase(STRAINS_DATABASE_NAME);
      const results = await db.getAllAsync<Strain>(
        `SELECT * FROM ${STRAINS_DATABASE_NAME} ORDER BY combined_rating DESC LIMIT ?`,
        [limit]
      );
      return results || [];
    } catch (error) {
      console.error('[DatabaseService] Error getting popular strains:', error);
      return [];
    }
  }
  
  public async getRelatedStrains(strain: Strain): Promise<Strain[]> {
    try {
      const db = await databaseManager.getDatabase(STRAINS_DATABASE_NAME);
      const results = await db.getAllAsync<Strain>(
        `SELECT * FROM ${STRAINS_DATABASE_NAME}
         WHERE id != ? 
         AND (
           genetic_type = ? 
           OR effects LIKE ?
         )
         ORDER BY combined_rating DESC
         LIMIT 5`,
        [strain.id!, strain.genetic_type, `%${strain.effects.split(',')[0]}%`]
      );
      return results || [];
    } catch (error) {
      console.error('[DatabaseService] Error getting related strains:', error);
      return [];
    }
  }
  
  public async getStrainCategories(): Promise<{ [key: string]: number }> {
    try {
      const db = await databaseManager.getDatabase(STRAINS_DATABASE_NAME);
      const results = await db.getAllAsync<{ genetic_type: string; count: number }>(
        `SELECT genetic_type, COUNT(*) as count
         FROM ${STRAINS_DATABASE_NAME}
         GROUP BY genetic_type`
      );
      
      return results.reduce((acc, { genetic_type, count }) => {
        if (genetic_type) {
          acc[genetic_type] = count;
        }
        return acc;
      }, {} as { [key: string]: number });
    } catch (error) {
      console.error('[DatabaseService] Error getting strain categories:', error);
      return {};
    }
  }
  
  /* ------------------------------------------------------------------
     Achievement methods (previously in AchievementService)
   ------------------------------------------------------------------ */
  
  public async getUserAchievements(userId: string): Promise<UserAchievementWithDetails[]> {
    return databaseManager.getUserAchievements(userId);
  }
  
  public async checkAchievements(userId: string, actionType: string, data: any): Promise<UserAchievementWithDetails[]> {
    return databaseManager.checkAchievements(userId, actionType, data);
  }
  
  public async updateAchievementProgress(userId: string, achievementId: number, progress: number, data?: any): Promise<void> {
    return databaseManager.updateAchievementProgress(userId, achievementId, progress, data);
  }
  
  public async clearAchievementNewFlags(userId: string): Promise<void> {
    return databaseManager.clearAchievementNewFlags(userId);
  }
  
  /* ------------------------------------------------------------------
     Helper methods 
   ------------------------------------------------------------------ */
  
  private handleError<T>(error: unknown, operation: string): DatabaseResponse<T> {
    const errorMessage = error instanceof Error ? error.message : `Failed to ${operation}`;
    console.error(`[DatabaseService] Error in ${operation}:`, error);
    return {
      success: false,
      error: errorMessage
    };
  }
  
  private async formatDatapoints(datapoints: Datapoint[]): Promise<ChartDataPoint[]> {
    return datapoints.map(dp => ({
      label: String(dp.x),
      value: dp.y
    }));
  }
}

// Create and export a default instance
export const databaseService = DatabaseService.getInstance();

export default databaseService; 