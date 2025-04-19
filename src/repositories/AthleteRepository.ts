import { SQLiteDatabase } from 'expo-sqlite';
import { Athlete } from '../types';
import { BaseRepository } from './BaseRepository';

/**
 * Repository for managing athletes
 */
export class AthleteRepository extends BaseRepository {
  constructor(db: SQLiteDatabase) {
    super(db);
    console.log('[AthleteRepository CONSTRUCTOR] Received DB object:', this.db);
  }

  /**
   * Get all athletes
   */
  public async getAllAthletes(): Promise<Athlete[]> {
    console.log('[AthleteRepository getAllAthletes] Attempting query using DB object:', this.db);
    try {
      const result = await this.db.getAllAsync('SELECT * FROM athletes ORDER BY name ASC');
      console.log('[AthleteRepository getAllAthletes] Query result:', result);
      
      // Check if result or result.rows is undefined/null
      if (!result || !result.rows) {
        console.log('[AthleteRepository getAllAthletes] No rows returned, returning empty array');
        return [];
      }
      
      return result.rows.map(row => ({
        id: row.id,
        name: row.name,
        team: row.team,
        position: row.position,
        age: row.age,
        height: row.height,
        weight: row.weight,
        deviceId: row.device_id,
        notes: row.notes,
        number: row.number,
        active: row.active === 1,
        createdAt: row.created_at,
        updatedAt: row.updated_at
      }));
    } catch (error) {
      console.error('Error getting all athletes:', error);
      console.error('[AthleteRepository getAllAthletes] Failed using DB object:', this.db);
      throw error;
    }
  }

  /**
   * Get athlete by ID
   */
  public async getAthleteById(id: string): Promise<Athlete | null> {
    try {
      const result = await this.db.getAllAsync('SELECT * FROM athletes WHERE id = ?', [id]);
      console.log('[AthleteRepository getAthleteById] Query result:', result);
      
      // Check if result or result.rows is undefined/null
      if (!result || !result.rows || !result.rows.length) {
        console.log('[AthleteRepository getAthleteById] No athlete found with ID:', id);
        return null;
      }
      
      const row = result.rows[0];
      return {
        id: row.id,
        name: row.name,
        team: row.team,
        position: row.position,
        age: row.age,
        height: row.height,
        weight: row.weight,
        deviceId: row.device_id,
        notes: row.notes,
        number: row.number,
        active: row.active === 1,
        createdAt: row.created_at,
        updatedAt: row.updated_at
      };
    } catch (error) {
      console.error(`Error getting athlete by ID ${id}:`, error);
      throw error;
    }
  }

  /**
   * Get athlete by device ID
   */
  public async getAthleteByDeviceId(deviceId: string): Promise<Athlete | null> {
    return new Promise<Athlete | null>((resolve, reject) => {
      this.db.transaction(tx => {
        tx.executeSql(
          'SELECT * FROM athletes WHERE device_id = ?',
          [deviceId],
          (_, { rows }) => {
            if (rows.length === 0) {
              resolve(null);
              return;
            }
            
            const row = rows.item(0);
            resolve({
              id: row.id,
              name: row.name,
              team: row.team,
              position: row.position,
              age: row.age,
              height: row.height,
              weight: row.weight,
              deviceId: row.device_id,
              notes: row.notes,
              createdAt: row.created_at,
              updatedAt: row.updated_at
            });
          },
          (_, error) => {
            reject(error);
            return false;
          }
        );
      });
    });
  }

  /**
   * Get athletes by team
   */
  public async getAthletesByTeam(team: string): Promise<Athlete[]> {
    return new Promise<Athlete[]>((resolve, reject) => {
      this.db.transaction(tx => {
        tx.executeSql(
          'SELECT * FROM athletes WHERE team = ? ORDER BY name ASC',
          [team],
          (_, { rows }) => {
            const athletes: Athlete[] = [];
            for (let i = 0; i < rows.length; i++) {
              const row = rows.item(i);
              athletes.push({
                id: row.id,
                name: row.name,
                team: row.team,
                position: row.position,
                age: row.age,
                height: row.height,
                weight: row.weight,
                deviceId: row.device_id,
                notes: row.notes,
                createdAt: row.created_at,
                updatedAt: row.updated_at
              });
            }
            resolve(athletes);
          },
          (_, error) => {
            reject(error);
            return false;
          }
        );
      });
    });
  }

  /**
   * Add a new athlete
   */
  public async addAthlete(athlete: Omit<Athlete, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    try {
      const now = Date.now();
      const id = `athlete_${now}_${Math.floor(Math.random() * 10000)}`;
      
      await this.db.runAsync(
        `INSERT INTO athletes (
          id, name, team, position, age, height, weight, device_id, notes, number, active, sport, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          id,
          athlete.name,
          athlete.team || null,
          athlete.position || null,
          athlete.age || null,
          athlete.height || null,
          athlete.weight || null,
          athlete.deviceId || null,
          athlete.notes || null,
          athlete.number || null,
          athlete.active === false ? 0 : 1,
          athlete.sport || null,
          now,
          now
        ]
      );
      
      return id;
    } catch (error) {
      console.error('Error adding athlete:', error);
      throw error;
    }
  }

  /**
   * Update an existing athlete
   */
  public async updateAthlete(athlete: Athlete): Promise<void> {
    try {
      const now = Date.now();
      
      await this.db.runAsync(
        `UPDATE athletes SET 
          name = ?, 
          team = ?, 
          position = ?, 
          age = ?, 
          height = ?, 
          weight = ?, 
          device_id = ?, 
          notes = ?, 
          number = ?, 
          active = ?,
          sport = ?,
          updated_at = ? 
        WHERE id = ?`,
        [
          athlete.name,
          athlete.team || null,
          athlete.position || null,
          athlete.age || null,
          athlete.height || null,
          athlete.weight || null,
          athlete.deviceId || null,
          athlete.notes || null,
          athlete.number || null,
          athlete.active === false ? 0 : 1,
          athlete.sport || null,
          now,
          athlete.id
        ]
      );
    } catch (error) {
      console.error(`Error updating athlete ${athlete.id}:`, error);
      throw error;
    }
  }

  /**
   * Assign device to athlete
   */
  public async assignDeviceToAthlete(athleteId: string, deviceId: string): Promise<void> {
    try {
      const now = Date.now();
      
      await this.executeTransaction(async (tx) => {
        // First, remove this device from any other athletes that may have it
        await tx.executeSqlAsync(
          'UPDATE athletes SET device_id = NULL, updated_at = ? WHERE device_id = ?',
          [now, deviceId]
        );
        
        // Then assign it to this athlete
        await tx.executeSqlAsync(
          'UPDATE athletes SET device_id = ?, updated_at = ? WHERE id = ?',
          [deviceId, now, athleteId]
        );
      });
    } catch (error) {
      console.error('Error assigning device to athlete:', error);
      throw error;
    }
  }

  /**
   * Remove device from athlete
   */
  public async removeDeviceFromAthlete(deviceId: string): Promise<void> {
    try {
      const now = Date.now();
      
      await this.db.runAsync(
        'UPDATE athletes SET device_id = NULL, updated_at = ? WHERE device_id = ?',
        [now, deviceId]
      );
    } catch (error) {
      console.error('Error removing device from athlete:', error);
      throw error;
    }
  }

  /**
   * Delete an athlete
   */
  public async deleteAthlete(id: string): Promise<void> {
    try {
      await this.db.runAsync('DELETE FROM athletes WHERE id = ?', [id]);
    } catch (error) {
      console.error('Error deleting athlete:', error);
      throw error;
    }
  }
} 