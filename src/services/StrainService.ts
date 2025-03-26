import { openDatabaseAsync, SQLiteDatabase } from "expo-sqlite";
import { STRAINS_DATABASE_NAME, SAMPLE_STRAINS } from "../constants";
import { Strain } from "../types";

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
  private db: SQLiteDatabase | null = null;
  private initializationPromise: Promise<void> | null = null;

  private constructor() {}

  static getInstance(): StrainService {
    if (!StrainService.instance) {
      StrainService.instance = new StrainService();
    }
    return StrainService.instance;
  }

  private async initialize(): Promise<void> {
    try {
      console.log('[StrainService] Initializing database...');
      this.db = await openDatabaseAsync(STRAINS_DATABASE_NAME);

      // Drop existing table to ensure clean state
      await this.db.execAsync(`DROP TABLE IF EXISTS ${STRAINS_DATABASE_NAME};`);

      // Create table and indexes
      await this.db.execAsync(`
        PRAGMA journal_mode = WAL;
        
        CREATE TABLE IF NOT EXISTS ${STRAINS_DATABASE_NAME} (
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
        );
        
        CREATE INDEX IF NOT EXISTS idx_strain_name 
        ON ${STRAINS_DATABASE_NAME}(name);
        
        CREATE INDEX IF NOT EXISTS idx_strain_genetic_type 
        ON ${STRAINS_DATABASE_NAME}(genetic_type);
        
        CREATE INDEX IF NOT EXISTS idx_strain_effects 
        ON ${STRAINS_DATABASE_NAME}(effects);
        
        CREATE INDEX IF NOT EXISTS idx_strain_rating 
        ON ${STRAINS_DATABASE_NAME}(combined_rating DESC);
      `);

      // Insert all sample strains
      console.log('[StrainService] Inserting', SAMPLE_STRAINS.length, 'sample strains...');
      
      for (const strain of SAMPLE_STRAINS) {
        try {
          await this.db.runAsync(
            `INSERT INTO ${STRAINS_DATABASE_NAME} (
              name, overview, genetic_type, lineage, thc_range,
              cbd_level, dominant_terpenes, qualitative_insights,
              effects, negatives, uses, thc_rating,
              user_rating, combined_rating
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);`,
            [
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
            ]
          );
        } catch (insertError) {
          console.error(`[StrainService] Failed to insert strain ${strain.name}:`, insertError);
          // Continue with next strain instead of failing completely
        }
      }

      // Verify the data
      const [finalCount] = await this.db.getAllAsync<{ count: number }>(
        `SELECT COUNT(*) as count FROM ${STRAINS_DATABASE_NAME}`
      );
      console.log('[StrainService] Database initialized with', finalCount?.count || 0, 'strains');

    } catch (error) {
      console.error('[StrainService] Failed to initialize database:', error);
      this.db = null;
      throw error;
    }
  }

  private async getDatabase(): Promise<SQLiteDatabase> {
    if (!this.db) {
      if (!this.initializationPromise) {
        this.initializationPromise = this.initialize();
      }
      await this.initializationPromise;
      this.initializationPromise = null;
    }

    if (!this.db) {
      throw new Error('Database initialization failed');
    }

    return this.db;
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
      const [countResult] = await db.getAllAsync<{ total: number }>(
        `SELECT COUNT(*) as total FROM ${STRAINS_DATABASE_NAME} ${whereClause}`,
        params
      );

      // Get filtered results
      const results = await db.getAllAsync<Strain>(
        `SELECT * FROM ${STRAINS_DATABASE_NAME} 
         ${whereClause} 
         ORDER BY ${this.getSortOrder(filters.sort)}
         LIMIT ? OFFSET ?`,
        [...params, limit, offset]
      );

      const total = countResult?.total || 0;
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
      const [strain] = await db.getAllAsync<Strain>(
        `SELECT * FROM ${STRAINS_DATABASE_NAME} WHERE id = ? LIMIT 1`,
        [id]
      );
      return strain || null;
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
    if (this.db) {
      try {
        await this.db.closeAsync();
        this.db = null;
        this.initializationPromise = null;
      } catch (error) {
        console.error('[StrainService] Error during cleanup:', error);
        throw error;
      }
    }
  }
}

// Export a default instance
export default StrainService.getInstance(); 