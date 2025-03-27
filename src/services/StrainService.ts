import { SQLiteDatabase } from "expo-sqlite";
import { STRAINS_DATABASE_NAME } from "../constants";
import { Strain } from "../types";
import { databaseManager } from "../DatabaseManager";

export interface StrainSearchFilters {
  geneticType?: string;
  effects?: string[];
  minTHC?: number;
  maxTHC?: number;
  sort?: 'rating' | 'name' | 'thc';
}

export interface PaginationParams {
  page: number;
  limit: number;
}

export interface StrainSearchResult {
  success: boolean;
  data: Strain[];
  error?: string;
  total: number;
  currentPage: number;
  totalPages: number;
  hasMore: boolean;
}

export class StrainService {
  private static instance: StrainService;

  private constructor() {}

  static getInstance(): StrainService {
    if (!StrainService.instance) {
      StrainService.instance = new StrainService();
    }
    return StrainService.instance;
  }

  private async getDatabase(): Promise<SQLiteDatabase> {
    // Use centralized database manager
    await databaseManager.ensureInitialized();
    return databaseManager.getDatabase(STRAINS_DATABASE_NAME);
  }

  private parseTHCRange(thcRange: string): { min: number; max: number } {
    const matches = thcRange.match(/(\d+(?:\.\d+)?)-(\d+(?:\.\d+)?)/);
    if (matches) {
      return {
        min: parseFloat(matches[1]),
        max: parseFloat(matches[2])
      };
    }
    return { min: 0, max: 0 };
  }

  async searchStrains(
    query: string = '',
    filters: StrainSearchFilters = {},
    pagination: PaginationParams = { page: 1, limit: 20 }
  ): Promise<StrainSearchResult> {
    try {
      const db = await this.getDatabase();
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
      console.error('[StrainService] Search error:', error);
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

  private getSortOrder(sort?: StrainSearchFilters['sort']): string {
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

  async getStrainById(id: number): Promise<Strain | null> {
    try {
      const db = await this.getDatabase();
      const results = await db.getAllAsync<Strain>(
        `SELECT * FROM ${STRAINS_DATABASE_NAME} WHERE id = ? LIMIT 1`,
        [id]
      );
      return results[0] || null;
    } catch (error) {
      console.error('[StrainService] Error getting strain by id:', error);
      return null;
    }
  }

  async getPopularStrains(limit: number = 10): Promise<Strain[]> {
    try {
      const db = await this.getDatabase();
      const results = await db.getAllAsync<Strain>(
        `SELECT * FROM ${STRAINS_DATABASE_NAME} ORDER BY combined_rating DESC LIMIT ?`,
        [limit]
      );
      return results || [];
    } catch (error) {
      console.error('[StrainService] Error getting popular strains:', error);
      return [];
    }
  }

  async getRelatedStrains(strain: Strain): Promise<Strain[]> {
    try {
      const db = await this.getDatabase();
      // Get strains with similar genetic type and effects
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
      console.error('[StrainService] Error getting related strains:', error);
      return [];
    }
  }

  async getStrainCategories(): Promise<{ [key: string]: number }> {
    try {
      const db = await this.getDatabase();
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
      console.error('[StrainService] Error getting strain categories:', error);
      return {};
    }
  }

  async cleanup(): Promise<void> {
    // Nothing to clean up - database connection is managed by DatabaseManager
    console.log('[StrainService] Cleanup completed');
  }
}

// Export a default instance
export default StrainService.getInstance(); 