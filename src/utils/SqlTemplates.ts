/**
 * SQL Templates
 * 
 * This file contains template functions for commonly used SQL queries.
 * It helps to keep the SQL queries organized, maintainable, and separated
 * from the database logic.
 */

/**
 * Get the query for usage statistics
 * @param tableName The table name to query from
 * @param daysBack Number of days to look back
 * @returns SQL query string
 */
export function getUsageStatsQuery(tableName: string, daysBack: number): string {
  return `
    WITH DailyStats AS (
      SELECT 
        strftime('%Y-%m-%d', timestamp) as day,
        strftime('%w', timestamp) as weekday,
        COUNT(*) as daily_hits,
        AVG(duration_ms) as avg_duration_per_day,
        MIN(duration_ms) as min_duration,
        MAX(duration_ms) as max_duration,
        SUM(duration_ms) as total_duration_per_day
      FROM ${tableName}
      WHERE timestamp >= '2024-12-24' -- Hardcoded date for testing
      GROUP BY day
    ),
    TotalStats AS (
      SELECT 
        COUNT(*) as total_hits,
        COUNT(DISTINCT strftime('%Y-%m-%d', timestamp)) as active_days,
        AVG(duration_ms) as overall_avg_duration,
        SUM(duration_ms) as total_duration
      FROM ${tableName}
      WHERE timestamp >= '2024-12-24' -- Hardcoded date for testing
    ),
    DayOfWeekStats AS (
      SELECT 
        weekday, 
        COUNT(*) as total_hits,
        AVG(daily_hits) as avg_hits_per_day
      FROM DailyStats
      GROUP BY weekday
    )
    SELECT 
      (SELECT total_hits FROM TotalStats) as total_hits,
      (SELECT active_days FROM TotalStats) as active_days,
      (SELECT CAST(total_hits AS REAL) / active_days FROM TotalStats) as avg_hits_per_active_day,
      (SELECT CAST(total_hits AS REAL) / ${daysBack} FROM TotalStats) as avg_hits_per_day,
      (SELECT overall_avg_duration FROM TotalStats) as avg_duration_ms,
      (SELECT total_duration FROM TotalStats) as total_duration_ms,
      (SELECT MAX(daily_hits) FROM DailyStats) as max_hits_in_day,
      (SELECT MAX(avg_duration_per_day) FROM DailyStats) as max_avg_duration,
      (SELECT MAX(total_duration_per_day) FROM DailyStats) as max_duration_in_day,
      (SELECT weekday FROM DayOfWeekStats ORDER BY total_hits DESC LIMIT 1) as most_active_day,
      (SELECT weekday FROM DayOfWeekStats ORDER BY total_hits ASC LIMIT 1) as least_active_day
  `;
}

/**
 * Get the query for time distribution of usage
 * @param tableName The table name to query from
 * @param daysBack Number of days to look back
 * @returns SQL query string
 */
export function getTimeDistributionQuery(tableName: string, daysBack: number): string {
  return `
    WITH HourlyHits AS (
      SELECT 
        CAST(strftime('%H', timestamp) AS INTEGER) as hour,
        COUNT(*) as hits
      FROM ${tableName}
      WHERE timestamp >= '2024-12-24' -- Hardcoded date for testing
      GROUP BY hour
    ),
    TotalHits AS (
      SELECT SUM(hits) as total FROM HourlyHits
    )
    SELECT
      CAST((SELECT COALESCE(SUM(hits), 0) FROM HourlyHits WHERE hour >= 5 AND hour < 12) AS REAL) / 
        (SELECT CASE WHEN total = 0 THEN 1 ELSE total END FROM TotalHits) as morning,
      CAST((SELECT COALESCE(SUM(hits), 0) FROM HourlyHits WHERE hour >= 12 AND hour < 17) AS REAL) / 
        (SELECT CASE WHEN total = 0 THEN 1 ELSE total END FROM TotalHits) as afternoon,
      CAST((SELECT COALESCE(SUM(hits), 0) FROM HourlyHits WHERE hour >= 17 AND hour < 22) AS REAL) / 
        (SELECT CASE WHEN total = 0 THEN 1 ELSE total END FROM TotalHits) as evening,
      CAST((SELECT COALESCE(SUM(hits), 0) FROM HourlyHits WHERE hour >= 22 OR hour < 5) AS REAL) / 
        (SELECT CASE WHEN total = 0 THEN 1 ELSE total END FROM TotalHits) as night
  `;
}

/**
 * Get the query for weekly stats
 * @param tableName The table name to query from
 * @returns SQL query string
 */
export function getWeeklyStatsQuery(tableName: string): string {
  return `
    WITH WeekData AS (
      SELECT 
        strftime('%W', timestamp) as week,
        COUNT(*) as count,
        AVG(duration_ms) as avg_duration
      FROM ${tableName}
      WHERE timestamp >= '2024-12-24' -- Hardcoded date for testing
      GROUP BY week
      ORDER BY week DESC
      LIMIT 7
    )
    SELECT 
      week as label,
      count as value,
      avg_duration
    FROM WeekData
    ORDER BY week ASC
  `;
}

/**
 * Get the query for monthly stats
 * @param tableName The table name to query from
 * @returns SQL query string
 */
export function getMonthlyStatsQuery(tableName: string): string {
  return `
    WITH MonthData AS (
      SELECT 
        strftime('%m', timestamp) as month,
        COUNT(*) as count,
        AVG(duration_ms) as avg_duration
      FROM ${tableName}
      WHERE timestamp >= '2024-12-24' -- Hardcoded date for testing
      GROUP BY month
      ORDER BY month DESC
      LIMIT 12
    )
    SELECT 
      month as label,
      count as value,
      avg_duration
    FROM MonthData
    ORDER BY month ASC
  `;
}

/**
 * Get query for finding strains with filter conditions
 * @param filters Filter conditions 
 * @returns SQL query parts (where clause, params)
 */
export function buildStrainFilterQuery(
  query: string,
  filters: {
    genetic_type?: string;
    effects?: string[];
    minThc?: number;
    maxThc?: number;
  }
): { whereClause: string, params: any[] } {
  const whereClauses = [];
  const params: any[] = [];

  // Search by name if query is provided
  if (query && query.trim() !== '') {
    whereClauses.push('(name LIKE ? OR genetic_type LIKE ? OR effects LIKE ?)');
    const searchTerm = `%${query}%`;
    params.push(searchTerm, searchTerm, searchTerm);
  }

  // Filter by genetic type
  if (filters.genetic_type) {
    whereClauses.push('genetic_type = ?');
    params.push(filters.genetic_type);
  }

  // Filter by effects
  if (filters.effects && filters.effects.length > 0) {
    const effectClauses = filters.effects.map(() => 'effects LIKE ?');
    whereClauses.push(`(${effectClauses.join(' OR ')})`);
    filters.effects.forEach(effect => params.push(`%${effect}%`));
  }

  // Filter by THC range
  if (filters.minThc !== undefined) {
    whereClauses.push('thc_rating >= ?');
    params.push(filters.minThc);
  }

  if (filters.maxThc !== undefined) {
    whereClauses.push('thc_rating <= ?');
    params.push(filters.maxThc);
  }

  return {
    whereClause: whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '',
    params
  };
} 