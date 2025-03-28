import { SQLiteDatabase } from 'expo-sqlite';
import { BaseRepository } from './BaseRepository';
import { UserAchievementWithDetails } from '../types';
import { validateNotEmpty } from '../utils/validators';
import { ACHIEVEMENTS } from '../constants';

/**
 * Repository for managing achievement data
 */
export class AchievementsRepository extends BaseRepository {
  /**
   * Constructor for AchievementsRepository
   * @param db SQLite database connection
   */
  constructor(db: SQLiteDatabase) {
    super(db);
  }

  /**
   * Initializes the achievements table with data from ACHIEVEMENTS constant if it's empty
   */
  public async initializeData(): Promise<void> {
    try {
      console.log('[AchievementsRepository] Checking if achievements need to be seeded...');
      
      // Check if achievements table is already populated
      const result = await this.db.getFirstAsync<{ count: number }>(
        `SELECT COUNT(*) as count FROM achievements`
      );
      
      const count = result?.count ?? 0;
      
      if (count === 0) {
        console.log('[AchievementsRepository] Seeding achievements data...');
        
        // Use a transaction for better performance and atomicity
        await this.executeTransaction(async () => {
          for (const achievement of ACHIEVEMENTS) {
            await this.db.runAsync(
              `INSERT INTO achievements (
                id, category, name, unlock_condition, notes, icon, complexity
              ) VALUES (?, ?, ?, ?, ?, ?, ?)`,
              [
                achievement.id,
                achievement.category,
                achievement.name,
                achievement.unlockCondition,
                achievement.notes || null,
                achievement.icon || null,
                achievement.complexity || 1
              ]
            );
          }
        });
        
        console.log(`[AchievementsRepository] Seeded ${ACHIEVEMENTS.length} achievements.`);
      } else {
        console.log(`[AchievementsRepository] Achievements table already contains ${count} records.`);
      }
    } catch (error) {
      console.error('[AchievementsRepository] Failed to initialize achievements data:', error);
      throw error;
    }
  }

  /**
   * Get achievements for a user with details
   * @param userId The user ID
   * @returns List of user achievements with details
   */
  async getUserAchievements(userId: string): Promise<UserAchievementWithDetails[]> {
    try {
      validateNotEmpty(userId, 'userId');

      const query = `
        SELECT 
          a.id, 
          a.category, 
          a.name, 
          a.unlock_condition AS unlockCondition, 
          a.notes, 
          a.icon, 
          a.complexity,
          ua.progress, 
          ua.date_unlocked AS dateUnlocked, 
          ua.is_unlocked AS isUnlocked,
          ua.is_new AS isNew
        FROM achievements a
        LEFT JOIN user_achievements ua ON a.id = ua.achievement_id AND ua.user_id = ?
        ORDER BY a.category, a.name
      `;

      const achievements = await this.db.getAllAsync<UserAchievementWithDetails>(query, [userId]);
      return achievements || [];
    } catch (error) {
      console.error('[AchievementsRepository] Error getting user achievements:', error);
      return [];
    }
  }

  /**
   * Clear the 'new' flag for achievements that have been viewed
   * @param userId The user ID
   */
  async clearAchievementNewFlags(userId: string): Promise<void> {
    try {
      validateNotEmpty(userId, 'userId');

      await this.db.runAsync(
        'UPDATE user_achievements SET is_new = 0 WHERE user_id = ? AND is_new = 1',
        [userId]
      );
    } catch (error) {
      console.error('[AchievementsRepository] Error clearing achievement new flags:', error);
    }
  }

  /**
   * Check for achievements that may be unlocked based on an action
   * @param userId The user ID
   * @param actionType The type of action performed
   * @param actionData Data associated with the action
   * @returns Newly unlocked achievements
   */
  async checkAchievements(
    userId: string, 
    actionType: string, 
    actionData: any
  ): Promise<UserAchievementWithDetails[]> {
    try {
      validateNotEmpty(userId, 'userId');
      validateNotEmpty(actionType, 'actionType');

      // Start a transaction
      await this.db.execAsync('BEGIN TRANSACTION');

      // Get achievements that could be affected by this action type
      const eligibleAchievements = await this.db.getAllAsync<{
        id: number;
        name: string;
        category: string;
        unlockCondition: string;
        notes: string;
        icon: string;
        complexity: number;
      }>(`
        SELECT 
          id, 
          name, 
          category, 
          unlock_condition AS unlockCondition, 
          notes, 
          icon, 
          complexity
        FROM achievements 
        WHERE unlock_condition LIKE ?
      `, [`%${actionType}%`]);

      if (!eligibleAchievements || eligibleAchievements.length === 0) {
        await this.db.execAsync('COMMIT');
        return [];
      }

      // For each eligible achievement, check if it should be unlocked
      const newlyUnlocked: UserAchievementWithDetails[] = [];

      for (const achievement of eligibleAchievements) {
        // Check if already unlocked
        const userAchievement = await this.db.getFirstAsync<{
          isUnlocked: number;
          progress: number;
        }>(`
          SELECT is_unlocked AS isUnlocked, progress 
          FROM user_achievements 
          WHERE user_id = ? AND achievement_id = ?
        `, [userId, achievement.id]);

        // If already unlocked, skip
        if (userAchievement?.isUnlocked) continue;

        // Calculate new progress based on the action
        let newProgress = userAchievement?.progress || 0;
        let shouldUnlock = false;

        // Different logic based on action type
        switch (actionType) {
          case 'bong_hit_recorded':
            // For bong hit related achievements
            newProgress = await this.calculateBongHitProgress(userId, achievement.id);
            shouldUnlock = newProgress >= 100;
            break;
          
          case 'strain_added':
            // For strain related achievements
            newProgress = await this.calculateStrainProgress(userId, achievement.id);
            shouldUnlock = newProgress >= 100;
            break;
            
          // Add more action types as needed
            
          default:
            newProgress = Math.min(100, newProgress + 10); // Default increment
            shouldUnlock = newProgress >= 100;
        }

        // Insert or update user achievement record
        if (userAchievement) {
          // Update existing record
          await this.db.runAsync(`
            UPDATE user_achievements 
            SET 
              progress = ?, 
              is_unlocked = ?, 
              date_unlocked = ?, 
              is_new = ?
            WHERE user_id = ? AND achievement_id = ?
          `, [
            newProgress,
            shouldUnlock ? 1 : 0,
            shouldUnlock ? new Date().toISOString() : null,
            shouldUnlock ? 1 : 0,
            userId,
            achievement.id
          ]);
        } else {
          // Insert new record
          await this.db.runAsync(`
            INSERT INTO user_achievements (
              user_id, 
              achievement_id, 
              progress, 
              is_unlocked, 
              date_unlocked, 
              is_new
            ) VALUES (?, ?, ?, ?, ?, ?)
          `, [
            userId,
            achievement.id,
            newProgress,
            shouldUnlock ? 1 : 0,
            shouldUnlock ? new Date().toISOString() : null,
            shouldUnlock ? 1 : 0
          ]);
        }

        // If newly unlocked, add to return array
        if (shouldUnlock) {
          newlyUnlocked.push({
            ...achievement,
            userId,
            achievementId: achievement.id,
            progress: 100,
            isUnlocked: true,
            dateUnlocked: new Date().toISOString(),
            isNew: true
          });
        }
      }

      await this.db.execAsync('COMMIT');
      return newlyUnlocked;
    } catch (error) {
      // Rollback on error
      try {
        await this.db.execAsync('ROLLBACK');
      } catch (rollbackError) {
        console.error('[AchievementsRepository] Error rolling back transaction:', rollbackError);
      }
      
      console.error('[AchievementsRepository] Error checking achievements:', error);
      return [];
    }
  }

  /**
   * Calculate progress for bong hit related achievements
   * @private
   */
  private async calculateBongHitProgress(userId: string, achievementId: number): Promise<number> {
    try {
      // Get achievement details to determine criteria
      const achievement = await this.db.getFirstAsync<{ unlockCondition: string }>(
        'SELECT unlock_condition AS unlockCondition FROM achievements WHERE id = ?',
        [achievementId]
      );

      if (!achievement) return 0;

      // Calculate progress based on unlock condition
      if (achievement.unlockCondition.includes('first_bong_hit')) {
        // Check if user has any bong hits
        const hitCount = await this.db.getFirstAsync<{ count: number }>(
          'SELECT COUNT(*) as count FROM bong_hits',
          []
        );
        return hitCount && hitCount.count > 0 ? 100 : 0;
      }

      if (achievement.unlockCondition.includes('hit_count_10')) {
        // Check if user has at least 10 bong hits
        const hitCount = await this.db.getFirstAsync<{ count: number }>(
          'SELECT COUNT(*) as count FROM bong_hits',
          []
        );
        return hitCount ? Math.min(100, (hitCount.count / 10) * 100) : 0;
      }

      // Add more achievement criteria as needed
      
      return 0;
    } catch (error) {
      console.error('[AchievementsRepository] Error calculating bong hit progress:', error);
      return 0;
    }
  }

  /**
   * Calculate progress for strain related achievements
   * @private
   */
  private async calculateStrainProgress(userId: string, achievementId: number): Promise<number> {
    try {
      // Similar implementation to calculateBongHitProgress but for strains
      return 0;
    } catch (error) {
      console.error('[AchievementsRepository] Error calculating strain progress:', error);
      return 0;
    }
  }
} 