import { openDatabaseAsync } from "expo-sqlite";
import { STRAINS_DATABASE_NAME } from "../constants";
import { Strain } from "../dbManager";

/**
 * Search strains by name, effects, or genetic type
 */
export async function searchStrains(query: string): Promise<Strain[]> {
  try {
    const db = await openDatabaseAsync(STRAINS_DATABASE_NAME);
    const searchQuery = `%${query}%`;
    
    const results = await db.getAllAsync<Strain>(`
      SELECT * FROM ${STRAINS_DATABASE_NAME}
      WHERE name LIKE ?
      OR effects LIKE ?
      OR genetic_type LIKE ?
      ORDER BY combined_rating DESC
      LIMIT 20;
    `, [searchQuery, searchQuery, searchQuery]);

    return results;
  } catch (error) {
    console.error("[queries/strains] Error searching strains:", error);
    throw error;
  }
}

/**
 * Get a specific strain by ID
 */
export async function getStrainById(id: number): Promise<Strain | null> {
  try {
    const db = await openDatabaseAsync(STRAINS_DATABASE_NAME);
    const [result] = await db.getAllAsync<Strain>(`
      SELECT * FROM ${STRAINS_DATABASE_NAME}
      WHERE id = ?;
    `, [id]);
    
    return result || null;
  } catch (error) {
    console.error("[queries/strains] Error getting strain:", error);
    throw error;
  }
}

/**
 * Get all strains sorted by rating
 */
export async function getTopStrains(limit: number = 20): Promise<Strain[]> {
  try {
    const db = await openDatabaseAsync(STRAINS_DATABASE_NAME);
    const results = await db.getAllAsync<Strain>(`
      SELECT * FROM ${STRAINS_DATABASE_NAME}
      ORDER BY combined_rating DESC
      LIMIT ?;
    `, [limit]);
    
    return results;
  } catch (error) {
    console.error("[queries/strains] Error getting top strains:", error);
    throw error;
  }
}

/**
 * Get strains by genetic type
 */
export async function getStrainsByType(geneticType: string): Promise<Strain[]> {
  try {
    const db = await openDatabaseAsync(STRAINS_DATABASE_NAME);
    const results = await db.getAllAsync<Strain>(`
      SELECT * FROM ${STRAINS_DATABASE_NAME}
      WHERE genetic_type LIKE ?
      ORDER BY combined_rating DESC;
    `, [`%${geneticType}%`]);
    
    return results;
  } catch (error) {
    console.error("[queries/strains] Error getting strains by type:", error);
    throw error;
  }
}

/**
 * Get strains by effect
 */
export async function getStrainsByEffect(effect: string): Promise<Strain[]> {
  try {
    const db = await openDatabaseAsync(STRAINS_DATABASE_NAME);
    const results = await db.getAllAsync<Strain>(`
      SELECT * FROM ${STRAINS_DATABASE_NAME}
      WHERE effects LIKE ?
      ORDER BY combined_rating DESC;
    `, [`%${effect}%`]);
    
    return results;
  } catch (error) {
    console.error("[queries/strains] Error getting strains by effect:", error);
    throw error;
  }
} 