import { SQLiteDatabase } from 'expo-sqlite';
import { Session } from '../types';
import { BaseRepository } from './BaseRepository';
import { dataChangeEmitter, dbEvents } from '../utils/EventEmitter';

/**
 * Repository for managing session data
 */
export class SessionRepository extends BaseRepository {
  constructor(db: SQLiteDatabase) {
    super(db);
  }

  /**
   * Save a new session to the database
   */
  public async saveSession(session: Session): Promise<void> {
    console.log(`[SessionRepo] Saving new session: ${session.id} - ${session.name}`);
    try {
      await this.db.runAsync(
        `INSERT INTO sessions (id, name, start_time, end_time, team, notes, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [
          session.id,
          session.name,
          session.startTime,
          session.endTime || null,
          session.team || null,
          session.notes || null,
          session.createdAt
        ]
      );
      // Emit event for session creation
      dataChangeEmitter.emit(dbEvents.SESSION_CREATED, { sessionId: session.id });
    } catch (error) {
      console.error(`[SessionRepo] Error saving session:`, error);
      throw error;
    }
  }

  /**
   * Update an existing session
   */
  public async updateSession(session: Session): Promise<void> {
    console.log(`[SessionRepo] Updating session: ${session.id}`);
    try {
      await this.db.runAsync(
        `UPDATE sessions 
         SET name = ?, start_time = ?, end_time = ?, team = ?, notes = ?
         WHERE id = ?`,
        [
          session.name,
          session.startTime,
          session.endTime || null,
          session.team || null,
          session.notes || null,
          session.id
        ]
      );
      // Emit event for session update
      dataChangeEmitter.emit(dbEvents.SESSION_UPDATED, { sessionId: session.id });
    } catch (error) {
      console.error(`[SessionRepo] Error updating session:`, error);
      throw error;
    }
  }

  /**
   * Get a session by ID
   */
  public async getSessionById(id: string): Promise<Session | null> {
    try {
      const session = await this.db.getFirstAsync<Session>(
        `SELECT * FROM sessions WHERE id = ?`, 
        [id]
      );
      return session || null;
    } catch (error) {
      console.error(`[SessionRepo] Error getting session by ID:`, error);
      throw error;
    }
  }

  /**
   * Get all sessions
   */
  public async getAllSessions(limit: number = 50, offset: number = 0): Promise<Session[]> {
    try {
      const sessions = await this.db.getAllAsync<Session>(
        `SELECT * FROM sessions
         ORDER BY start_time DESC
         LIMIT ? OFFSET ?`,
        [limit, offset]
      );
      return sessions || [];
    } catch (error) {
      console.error(`[SessionRepo] Error getting all sessions:`, error);
      throw error;
    }
  }

  /**
   * Find most recent active (unfinished) session if any
   */
  public async findUnfinishedSession(): Promise<Session | null> {
    try {
      const session = await this.db.getFirstAsync<Session>(
        `SELECT * FROM sessions
         WHERE end_time IS NULL
         ORDER BY start_time DESC
         LIMIT 1`
      );
      return session || null;
    } catch (error) {
      console.error(`[SessionRepo] Error finding unfinished session:`, error);
      throw error;
    }
  }

  /**
   * Delete a session by ID
   */
  public async deleteSession(id: string): Promise<void> {
    try {
      await this.db.runAsync(`DELETE FROM sessions WHERE id = ?`, [id]);
      // Emit event for session deletion
      dataChangeEmitter.emit(dbEvents.SESSION_DELETED, { sessionId: id });
    } catch (error) {
      console.error(`[SessionRepo] Error deleting session:`, error);
      throw error;
    }
  }

  /**
   * Get session summary statistics
   */
  public async getSessionStats(sessionId: string): Promise<{
    impactCount: number,
    maxImpactMagnitude: number,
    avgImpactMagnitude: number,
  }> {
    try {
      const stats = await this.db.getFirstAsync<{
        impactCount: number,
        maxImpactMagnitude: number,
        avgImpactMagnitude: number,
      }>(
        `SELECT
          COUNT(*) as impactCount,
          MAX(magnitude) as maxImpactMagnitude,
          AVG(magnitude) as avgImpactMagnitude
         FROM impact_events
         WHERE session_id = ?`,
        [sessionId]
      );
      
      return stats || { impactCount: 0, maxImpactMagnitude: 0, avgImpactMagnitude: 0 };
    } catch (error) {
      console.error(`[SessionRepo] Error getting session stats:`, error);
      throw error;
    }
  }

  /**
   * Get all sessions for a specific team
   */
  public async getSessionsByTeam(team: string, limit: number = 50): Promise<Session[]> {
    try {
      const sessions = await this.db.getAllAsync<Session>(
        `SELECT * FROM sessions
         WHERE team = ?
         ORDER BY start_time DESC
         LIMIT ?`,
        [team, limit]
      );
      return sessions || [];
    } catch (error) {
      console.error(`[SessionRepo] Error getting sessions by team:`, error);
      throw error;
    }
  }
} 