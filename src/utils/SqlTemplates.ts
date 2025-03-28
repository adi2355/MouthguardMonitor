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
 * @returns SQL query string
 */
export function getUsageStatsQuery(tableName: string): string {
  // Date filter clause will be added externally
  return `
    WITH FilteredData AS (
      SELECT timestamp, duration_ms
      FROM ${tableName}
      -- DATE FILTER ADDED EXTERNALLY
    ),
    DailyStats AS (
      SELECT
        strftime('%Y-%m-%d', timestamp, 'utc') as day,
        strftime('%w', timestamp, 'utc') as weekday,
        COUNT(*) as daily_hits,
        AVG(duration_ms) as avg_duration_per_day,
        MIN(duration_ms) as min_duration,
        MAX(duration_ms) as max_duration,
        SUM(duration_ms) as total_duration_per_day
      FROM FilteredData
      GROUP BY day
    ),
    TotalStats AS (
      SELECT
        COUNT(*) as total_hits,
        COUNT(DISTINCT strftime('%Y-%m-%d', timestamp, 'utc')) as active_days,
        AVG(duration_ms) as overall_avg_duration,
        SUM(duration_ms) as total_duration
      FROM FilteredData
    ),
    DayOfWeekStats AS (
      SELECT
        weekday,
        COUNT(*) as total_hits,
        AVG(daily_hits) as avg_hits_per_day
      FROM DailyStats
      GROUP BY weekday
    ),
    HourlyStats AS (
       SELECT
         CAST(strftime('%H', timestamp, 'utc') AS INTEGER) as hour,
         COUNT(*) as hits
       FROM FilteredData
       GROUP BY hour
    )
    SELECT
      COALESCE((SELECT total_hits FROM TotalStats), 0) as total_hits,
      COALESCE((SELECT active_days FROM TotalStats), 0) as active_days,
      CASE WHEN COALESCE((SELECT active_days FROM TotalStats), 0) > 0
           THEN CAST(COALESCE((SELECT total_hits FROM TotalStats), 0) AS REAL) / (SELECT active_days FROM TotalStats)
           ELSE 0
      END as avg_hits_per_active_day,
      COALESCE((SELECT overall_avg_duration FROM TotalStats), 0) as avg_duration_ms,
      COALESCE((SELECT total_duration FROM TotalStats), 0) as total_duration_ms,
      COALESCE((SELECT MAX(daily_hits) FROM DailyStats), 0) as max_hits_in_day,
      COALESCE((SELECT MIN(daily_hits) FROM DailyStats WHERE daily_hits > 0), 0) as min_hits_in_day,
      COALESCE((SELECT MAX(max_duration) FROM DailyStats), 0) as longest_hit,
      COALESCE((SELECT MIN(min_duration) FROM DailyStats WHERE min_duration > 0), 0) as shortest_hit,
      COALESCE((SELECT hour FROM HourlyStats ORDER BY hits DESC LIMIT 1), -1) as most_active_hour,
      COALESCE((SELECT hour FROM HourlyStats ORDER BY hits ASC LIMIT 1), -1) as least_active_hour
  `;
}

/**
 * Get the query for time distribution of usage
 * @param tableName The table name to query from
 * @returns SQL query string
 */
export function getTimeDistributionQuery(tableName: string): string {
  // Date filter clause will be added externally
  return `
    WITH HourlyHits AS (
      SELECT
        CAST(strftime('%H', timestamp, 'utc') AS INTEGER) as hour,
        COUNT(*) as hits
      FROM ${tableName}
      -- DATE FILTER ADDED EXTERNALLY
      GROUP BY hour
    ),
    TotalHits AS (
      -- Use COALESCE to ensure total is not NULL if HourlyHits is empty
      SELECT COALESCE(SUM(hits), 0) as total FROM HourlyHits
    )
    SELECT
      -- Use MAX(1, ...) to prevent division by zero
      CAST(COALESCE((SELECT SUM(hits) FROM HourlyHits WHERE hour >= 5 AND hour < 12), 0) AS REAL) / MAX(1, (SELECT total FROM TotalHits)) as morning,
      CAST(COALESCE((SELECT SUM(hits) FROM HourlyHits WHERE hour >= 12 AND hour < 17), 0) AS REAL) / MAX(1, (SELECT total FROM TotalHits)) as afternoon,
      CAST(COALESCE((SELECT SUM(hits) FROM HourlyHits WHERE hour >= 17 AND hour < 22), 0) AS REAL) / MAX(1, (SELECT total FROM TotalHits)) as evening,
      CAST(COALESCE((SELECT SUM(hits) FROM HourlyHits WHERE hour >= 22 OR hour < 5), 0) AS REAL) / MAX(1, (SELECT total FROM TotalHits)) as night
  `;
}

/**
 * Get the query for weekly stats
 * @param tableName The table name to query from
 * @returns SQL query string
 */
export function getWeeklyStatsQuery(tableName: string): string {
  // Date filter clause will be added externally
  return `
    SELECT
      strftime('%w', timestamp, 'utc') as day_of_week,
      COUNT(*) as count,
      AVG(duration_ms) as avg_duration
    FROM ${tableName}
    -- DATE FILTER ADDED EXTERNALLY
    GROUP BY day_of_week
    ORDER BY day_of_week ASC
  `;
}

/**
 * Get the query for monthly stats
 * @param tableName The table name to query from
 * @returns SQL query string
 */
export function getMonthlyStatsQuery(tableName: string): string {
  // Date filter clause will be added externally
  return `
    SELECT
      strftime('%m', timestamp, 'utc') as month,
      COUNT(*) as count
    FROM ${tableName}
    -- DATE FILTER ADDED EXTERNALLY
    GROUP BY month
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

// Helper function to create WHERE clause for date filtering using ISO strings
export function getDateRangeFilter(startDate?: string, endDate?: string): { clause: string, params: string[] } {
  if (!startDate && !endDate) {
    // No date range specified, return empty clause and params
    return { clause: '', params: [] };
  }

  const conditions: string[] = [];
  const params: string[] = [];

  if (startDate) {
    console.log(`[SqlTemplates] Adding start date condition: timestamp >= ${startDate}`);
    conditions.push(`timestamp >= ?`);
    params.push(startDate); // Pass the ISO string as a parameter
  }

  if (endDate) {
    console.log(`[SqlTemplates] Adding end date condition: timestamp <= ${endDate}`);
    conditions.push(`timestamp <= ?`);
    params.push(endDate); // Pass the ISO string as a parameter
  }

  // Combine conditions with AND
  const clause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

  return { clause, params };
} 