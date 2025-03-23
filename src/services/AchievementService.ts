import { Achievement, UserAchievement, UserAchievementWithDetails } from '../types/achievements';
import { BongHit } from '../types';
import { openDatabaseAsync, SQLiteDatabase } from "expo-sqlite";
import { ACHIEVEMENTS, ACHIEVEMENT_ICONS, ACHIEVEMENT_TRIGGERS, ACHIEVEMENT_ACTION_TYPES } from '../constants';

export class AchievementService {
  private static instance: AchievementService;
  private db: SQLiteDatabase | null = null;
  private initialized: boolean = false;
  private initializationPromise: Promise<void> | null = null;
  
  private constructor() {}
  
  static getInstance(): AchievementService {
    if (!AchievementService.instance) {
      AchievementService.instance = new AchievementService();
    }
    return AchievementService.instance;
  }
  
  private async initialize(): Promise<void> {
    try {
      console.log('[AchievementService] Initializing...');
      this.db = await openDatabaseAsync('achievements.db');
      
      // Create tables if they don't exist
      await this.db.execAsync(`
        PRAGMA journal_mode = WAL;
        
        CREATE TABLE IF NOT EXISTS achievements (
          id INTEGER PRIMARY KEY,
          category TEXT NOT NULL,
          name TEXT NOT NULL,
          unlock_condition TEXT NOT NULL,
          notes TEXT,
          icon TEXT,
          complexity INTEGER DEFAULT 1
        );

        CREATE TABLE IF NOT EXISTS user_achievements (
          user_id TEXT NOT NULL,
          achievement_id INTEGER NOT NULL,
          progress REAL DEFAULT 0,
          date_unlocked TEXT,
          is_unlocked INTEGER DEFAULT 0,
          is_new INTEGER DEFAULT 0,
          progress_data TEXT,
          PRIMARY KEY (user_id, achievement_id),
          FOREIGN KEY (achievement_id) REFERENCES achievements(id)
        );
      `);
      
      // Check if achievements are already imported
      const result = await this.db.getFirstAsync<{count: number}>('SELECT COUNT(*) as count FROM achievements');
      const count = result?.count ?? 0;
      
      if (count === 0) {
        console.log('[AchievementService] Importing initial achievements...');
        const achievements = this.getInitialAchievements();
        
        // Batch insert achievements
        for (const achievement of achievements) {
          // Validate that the achievement has all required fields
          if (!achievement.category || !achievement.name || !achievement.unlockCondition) {
            console.error(`[AchievementService] Skipping achievement with missing required fields:`, achievement);
            continue;
          }
          
          // Insert with proper SQL syntax
          await this.db.execAsync(`
            INSERT INTO achievements 
              (id, category, name, unlock_condition, notes, icon, complexity)
            VALUES 
              (${achievement.id}, 
              '${achievement.category}', 
              '${achievement.name}', 
              '${achievement.unlockCondition}', 
              '${achievement.notes || ""}', 
              '${achievement.icon || this.getCategoryIcon(achievement.category)}', 
              ${achievement.complexity || 1})
          `);
        }
        console.log(`[AchievementService] Imported ${achievements.length} achievements`);
      } else {
        console.log(`[AchievementService] ${count} achievements already exist`);
      }
      
      this.initialized = true;
      console.log('[AchievementService] Initialization complete');
    } catch (error) {
      console.error('[AchievementService] Failed to initialize:', error);
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
      throw new Error('Achievement database initialization failed');
    }

    return this.db;
  }
  
  // Core achievement methods
  async getUserAchievements(userId: string): Promise<UserAchievementWithDetails[]> {
    try {
      const db = await this.getDatabase();
      
      // First ensure user has entries for all achievements
      await this.ensureUserAchievements(userId);
      
      // Get achievements with progress
      const results = await db.getAllAsync<UserAchievementWithDetails>(
        `SELECT 
          a.id, a.category, a.name, a.unlock_condition as unlockCondition, 
          a.notes, a.icon, a.complexity,
          ua.user_id as userId, a.id as achievementId, ua.progress, 
          ua.date_unlocked as dateUnlocked, 
          ua.is_unlocked as isUnlocked, ua.is_new as isNew,
          ua.progress_data as progressData
        FROM achievements a
        JOIN user_achievements ua ON a.id = ua.achievement_id
        WHERE ua.user_id = ?`,
        [userId]
      );
      
      // Convert SQLite's numeric booleans to actual booleans
      return results.map(achievement => ({
        ...achievement,
        isUnlocked: Boolean(achievement.isUnlocked),
        isNew: Boolean(achievement.isNew)
      }));
    } catch (error) {
      console.error('[AchievementService] Failed to get user achievements:', error);
      return [];
    }
  }
  
  // Check and update achievements based on user action
  async checkAchievements(userId: string, actionType: string, data: any): Promise<UserAchievementWithDetails[]> {
    try {
      // Only check relevant achievements for the action type
      const relevantAchievements = await this.getAchievementsByActionType(actionType);
      const unlockedAchievements: UserAchievementWithDetails[] = [];
      
      // Process only relevant achievements for better performance
      for (const achievement of relevantAchievements) {
        const updated = await this.processAchievement(userId, achievement, actionType, data);
        if (updated && updated.isUnlocked && updated.isNew) {
          unlockedAchievements.push(updated);
        }
      }
      
      return unlockedAchievements;
    } catch (error) {
      console.error('[AchievementService] Failed to check achievements:', error);
      return [];
    }
  }
  
  async updateAchievementProgress(userId: string, achievementId: number, progress: number, data?: any): Promise<void> {
    try {
      const db = await this.getDatabase();
      
      // Ensure progress is between 0 and 100
      progress = Math.max(0, Math.min(100, progress));
      
      // Check if achievement is already unlocked
      const existing = await db.getFirstAsync<{is_unlocked: number}>(
        'SELECT is_unlocked FROM user_achievements WHERE user_id = ? AND achievement_id = ?',
        [userId, achievementId]
      );
      
      if (existing && existing.is_unlocked) {
        // Achievement already unlocked, don't update progress
        return;
      }
      
      // Format progress data if provided
      const progressData = data ? JSON.stringify(data) : null;
      
      // Check if this achievement should be unlocked
      const isUnlocked = progress >= 100 ? 1 : 0;
      const dateUnlocked = isUnlocked ? `'${new Date().toISOString()}'` : 'NULL';
      const progressDataStr = progressData ? `'${progressData}'` : 'NULL';
      
      // Update progress and unlock if needed
      await db.execAsync(`
        UPDATE user_achievements 
        SET progress = ${progress}, 
            is_unlocked = ${isUnlocked}, 
            is_new = ${isUnlocked},
            date_unlocked = ${dateUnlocked},
            progress_data = ${progressDataStr}
        WHERE user_id = '${userId}' AND achievement_id = ${achievementId}
      `);
    } catch (error) {
      console.error(`[AchievementService] Failed to update achievement progress:`, error);
    }
  }
  
  async clearNewFlags(userId: string): Promise<void> {
    try {
      const db = await this.getDatabase();
      await db.execAsync(`
        UPDATE user_achievements 
        SET is_new = 0 
        WHERE user_id = '${userId}'
      `);
    } catch (error) {
      console.error('[AchievementService] Failed to clear new flags:', error);
    }
  }
  
  // Private helper methods
  private async ensureUserAchievements(userId: string): Promise<void> {
    try {
      const db = await this.getDatabase();
      
      // Get all achievement IDs
      const achievements = await db.getAllAsync<{id: number}>('SELECT id FROM achievements');
      
      // Get user's existing achievement entries
      const userAchievements = await db.getAllAsync<{achievement_id: number}>(
        'SELECT achievement_id FROM user_achievements WHERE user_id = ?',
        [userId]
      );
      
      const existingIds = new Set(userAchievements.map(ua => ua.achievement_id));
      
      // Create missing entries
      for (const achievement of achievements) {
        if (!existingIds.has(achievement.id)) {
          await db.execAsync(`
            INSERT INTO user_achievements (user_id, achievement_id, progress) 
            VALUES ('${userId}', ${achievement.id}, 0)
          `);
        }
      }
    } catch (error) {
      console.error('[AchievementService] Failed to ensure user achievements:', error);
    }
  }
  
  private async getAchievementsByActionType(actionType: string): Promise<Achievement[]> {
    try {
      // Get all achievement IDs that should be checked for this action type
      const relevantIds = Object.entries(ACHIEVEMENT_TRIGGERS)
        .filter(([_, triggers]) => Array.isArray(triggers) && triggers.includes(actionType))
        .map(([id]) => parseInt(id));
      
      if (relevantIds.length === 0) return [];
      
      // Get achievement details for these IDs
      return ACHIEVEMENTS.filter(achievement => relevantIds.includes(achievement.id));
    } catch (error) {
      console.error('[AchievementService] Failed to get achievements by action type:', error);
      return [];
    }
  }
  
  private async processAchievement(
    userId: string, 
    achievement: Achievement, 
    actionType: string, 
    data: any
  ): Promise<UserAchievementWithDetails | null> {
    try {
      const db = await this.getDatabase();
      
      // Get current progress
      const current = await db.getFirstAsync<{progress: number, is_unlocked: number}>(
        'SELECT progress, is_unlocked FROM user_achievements WHERE user_id = ? AND achievement_id = ?',
        [userId, achievement.id]
      );
      
      // If already unlocked or not found, exit early
      if (!current) return null;
      if (current.is_unlocked) return null;
      
      // Calculate new progress based on achievement type and action
      let newProgress = current.progress;
      
      // This is where you'd implement the logic for different achievement types
      // For now, this is a simplified example
      switch (achievement.category) {
        case 'Daily & Weekly Streaks':
          // Example: First usage achievement
          if (achievement.id === 1 && actionType === 'log_consumption') {
            newProgress = 100; // Immediately complete
          }
          break;
          
        case 'Strain Exploration':
          // Example: Try different strains
          if (actionType === 'explore_strain') {
            // Increment progress by a fixed amount, or calculate based on unique strains
            newProgress = Math.min(100, newProgress + 10);
          }
          break;
          
        // Add more category handlers
      }
      
      // Update progress
      if (newProgress !== current.progress) {
        await this.updateAchievementProgress(userId, achievement.id, newProgress);
      }
      
      // If newly unlocked, return full achievement details
      if (newProgress >= 100 && current.progress < 100) {
        const updated = await db.getFirstAsync<UserAchievementWithDetails>(
          `SELECT 
            a.id, a.category, a.name, a.unlock_condition as unlockCondition, 
            a.notes, a.icon, a.complexity,
            ua.user_id as userId, a.id as achievementId, ua.progress, 
            ua.date_unlocked as dateUnlocked, 
            ua.is_unlocked as isUnlocked, ua.is_new as isNew
          FROM achievements a
          JOIN user_achievements ua ON a.id = ua.achievement_id
          WHERE ua.user_id = ? AND a.id = ?`,
          [userId, achievement.id]
        );
        
        if (updated) {
          return {
            ...updated,
            isUnlocked: Boolean(updated.isUnlocked),
            isNew: Boolean(updated.isNew)
          };
        }
      }
      
      return null;
    } catch (error) {
      console.error('[AchievementService] Failed to process achievement:', error);
      return null;
    }
  }
  
  private getInitialAchievements(): Achievement[] {
    // Return achievements from constants
    return ACHIEVEMENTS;
  }
  
  private getCategoryIcon(category: string): string {
    // Get icon from constants or use default
    return (ACHIEVEMENT_ICONS as Record<string, string>)[category] || 'trophy';
  }
} 