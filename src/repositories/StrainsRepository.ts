import { BaseRepository } from "./BaseRepository";
import { 
  Strain, 
  DatabaseResponse,
  StrainSearchFilters,
  PaginationParams,
  StrainSearchResult
} from "../types";
import { STRAINS_DATABASE_NAME, SAMPLE_STRAINS } from "../constants";
import { validateStrain, createValidationError, createValidationSuccess, ValidationResult } from "../utils/validators";

/**
 * Repository for managing strain data
 */
export class StrainsRepository extends BaseRepository {
  /**
   * Initialize the strains database with sample data if empty
   */
  public async initializeData(): Promise<void> {
    try {
      // Check if we already have strains data
      const result = await this.db.getFirstAsync<{ count: number }>(
        `SELECT COUNT(*) as count FROM ${STRAINS_DATABASE_NAME}`
      );
      
      const count = result?.count ?? 0;
      
      if (count === 0) {
        console.log('[StrainsRepository] Inserting initial strain data...');
        
        // Use a transaction for better performance and atomicity
        await this.executeTransaction(async () => {
          for (const strain of SAMPLE_STRAINS) {
            // Validate strain data before inserting
            const validationError = validateStrain(strain);
            if (validationError) {
              console.warn(`[StrainsRepository] Skipping invalid strain: ${validationError}`, strain);
              continue;
            }
            
            await this.db.runAsync(
              `INSERT INTO ${STRAINS_DATABASE_NAME} (
                name, overview, genetic_type, lineage, thc_range, 
                cbd_level, dominant_terpenes, qualitative_insights, 
                effects, negatives, uses, thc_rating, user_rating, combined_rating
              ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
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
          }
        });
        
        console.log(`[StrainsRepository] Inserted ${SAMPLE_STRAINS.length} initial strains.`);
      } else {
        console.log(`[StrainsRepository] Strains table already contains ${count} records.`);
      }
    } catch (error) {
      console.error('[StrainsRepository] Failed to initialize strain data:', error);
      throw error;
    }
  }

  /**
   * Search strains with filters and pagination
   */
  public async searchStrains(
    query: string,
    filters: StrainSearchFilters = {},
    pagination: PaginationParams = { page: 1, limit: 10 }
  ): Promise<DatabaseResponse<StrainSearchResult<Strain>>> {
    try {
      const { page, limit } = pagination;
      const offset = (page - 1) * limit;

      // Build where clause and parameters
      const whereClauses = [];
      const params: any[] = [];

      // Search by name if query is provided
      if (query && query.trim()) {
        whereClauses.push('name LIKE ?');
        params.push(`%${query.trim()}%`);
      }

      // Filter by genetic type
      if (filters.geneticType) {
        whereClauses.push('genetic_type = ?');
        params.push(filters.geneticType);
      }

      // Filter by effects
      if (filters.effects && filters.effects.length > 0) {
        const effectClauses = filters.effects.map(() => 'effects LIKE ?');
        whereClauses.push(`(${effectClauses.join(' OR ')})`);
        filters.effects.forEach(effect => params.push(`%${effect}%`));
      }

      // Filter by THC range
      if (filters.minTHC !== undefined) {
        whereClauses.push('CAST(SUBSTR(thc_range, 1, INSTR(thc_range, "-")-1) AS FLOAT) >= ?');
        params.push(filters.minTHC);
      }

      if (filters.maxTHC !== undefined) {
        whereClauses.push('CAST(SUBSTR(thc_range, INSTR(thc_range, "-")+1) AS FLOAT) <= ?');
        params.push(filters.maxTHC);
      }

      // Construct the final WHERE clause
      const whereClause = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';

      // Get total count for pagination
      const [countResult] = await this.db.getAllAsync<{ total: number }>(
        `SELECT COUNT(*) as total FROM ${STRAINS_DATABASE_NAME} ${whereClause}`,
        params
      );

      // Get filtered results
      const results = await this.db.getAllAsync<Strain>(
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
        data: {
          data: results,
          total,
          currentPage: page,
          totalPages,
          hasMore: page < totalPages
        }
      };
    } catch (error) {
      return this.handleError(error, 'searchStrains');
    }
  }

  /**
   * Get strain by ID
   */
  public async getStrainById(id: number): Promise<ValidationResult<Strain | null>> {
    try {
      // Validate input
      if (!id || typeof id !== 'number' || id <= 0) {
        return createValidationError('INVALID_ID', 'Invalid strain ID provided');
      }
      
      const results = await this.db.getAllAsync<Strain>(
        `SELECT * FROM ${STRAINS_DATABASE_NAME} WHERE id = ? LIMIT 1`,
        [id]
      );
      
      const strain = results[0] || null;
      
      if (strain) {
        const validationError = validateStrain(strain);
        if (validationError) {
          return createValidationError('INVALID_STRAIN_DATA', validationError, { id });
        }
      }
      
      return createValidationSuccess(strain);
    } catch (error) {
      console.error('[StrainsRepository] Error getting strain by id:', error);
      return createValidationError('DB_ERROR', 'Failed to retrieve strain', { id });
    }
  }

  /**
   * Get popular strains
   */
  public async getPopularStrains(limit: number = 10): Promise<DatabaseResponse<Strain[]>> {
    try {
      const results = await this.db.getAllAsync<Strain>(
        `SELECT * FROM ${STRAINS_DATABASE_NAME} ORDER BY combined_rating DESC LIMIT ?`,
        [limit]
      );
      
      return {
        success: true,
        data: results
      };
    } catch (error) {
      return this.handleError(error, 'getPopularStrains');
    }
  }

  /**
   * Get related strains
   */
  public async getRelatedStrains(strain: Strain): Promise<ValidationResult<Strain[]>> {
    try {
      // Validate input
      const validationError = validateStrain(strain);
      if (validationError) {
        return createValidationError('INVALID_STRAIN', validationError);
      }
      
      if (!strain.id) {
        return createValidationError('MISSING_ID', 'Strain ID is required');
      }
      
      // Get strains with similar genetic type and effects
      const results = await this.db.getAllAsync<Strain>(
        `SELECT * FROM ${STRAINS_DATABASE_NAME}
         WHERE id != ? 
         AND (
           genetic_type = ? 
           OR effects LIKE ?
         )
         ORDER BY combined_rating DESC
         LIMIT 5`,
        [strain.id, strain.genetic_type, `%${strain.effects.split(',')[0]}%`]
      );
      
      // Validate results
      for (const relatedStrain of results) {
        const strainError = validateStrain(relatedStrain);
        if (strainError) {
          console.warn(`[StrainsRepository] Invalid related strain: ${strainError}`, relatedStrain);
        }
      }
      
      return createValidationSuccess(results);
    } catch (error) {
      console.error('[StrainsRepository] Error getting related strains:', error);
      return createValidationError('DB_ERROR', 'Failed to retrieve related strains');
    }
  }

  /**
   * Get strain categories
   */
  public async getStrainCategories(): Promise<DatabaseResponse<{ [key: string]: number }>> {
    try {
      const results = await this.db.getAllAsync<{ genetic_type: string; count: number }>(
        `SELECT genetic_type, COUNT(*) as count
         FROM ${STRAINS_DATABASE_NAME}
         GROUP BY genetic_type`
      );
      
      const categories = results.reduce((acc, { genetic_type, count }) => {
        if (genetic_type) {
          acc[genetic_type] = count;
        }
        return acc;
      }, {} as { [key: string]: number });
      
      return {
        success: true,
        data: categories
      };
    } catch (error) {
      return this.handleError(error, 'getStrainCategories');
    }
  }

  /**
   * Helper method to get sort order for strain queries
   */
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
} 