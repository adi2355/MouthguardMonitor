import { SQLiteDatabase } from "expo-sqlite";
import { DatabaseManager } from "../DatabaseManager";
import * as Logger from '../../utils/logging';
import { UserFeedback, QualityScore, FeedbackPattern } from '../../types/feedback';
import { FeedbackStats, PatternEntry, QualityStats } from '../../types/feedback';

const MODULE_NAME = 'FeedbackRepository';

/**
 * Repository for feedback database operations
 */
export class FeedbackRepository {
  private db: SQLiteDatabase | null = null;

  constructor() {
    try {
      this.db = DatabaseManager.getInstance().getFeedbackDb();
    } catch (error) {
      Logger.logError(MODULE_NAME, error as Error, 'Failed to get feedback database');
    }
  }

  /**
   * Ensure database is available
   */
  private ensureDatabase(): SQLiteDatabase {
    if (!this.db) {
      try {
        this.db = DatabaseManager.getInstance().getFeedbackDb();
      } catch (error) {
        Logger.logError(MODULE_NAME, error as Error, 'Failed to get feedback database');
        throw new Error('Feedback database not initialized');
      }
    }
    return this.db;
  }

  /**
   * Store user feedback
   */
  public async storeFeedback(feedback: UserFeedback, feedbackId: string = `fb_${Date.now()}`): Promise<string> {
    try {
      const db = this.ensureDatabase();
      Logger.debug(MODULE_NAME, `Storing feedback for response: ${feedback.responseId}`);
      
      await db.getAllAsync(`
        INSERT OR REPLACE INTO user_feedback (
          id,
          user_id,
          response_id,
          response_type,
          helpful,
          accurate,
          relevance,
          comments,
          timestamp
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        feedbackId,
        feedback.userId,
        feedback.responseId,
        feedback.responseType,
        feedback.helpful ? 1 : 0,
        feedback.accurate ? 1 : 0,
        feedback.relevance,
        feedback.comments || null,
        feedback.timestamp
      ]);
      
      Logger.debug(MODULE_NAME, `Feedback stored with ID: ${feedbackId}`);
      return feedbackId;
    } catch (error) {
      Logger.logError(MODULE_NAME, error as Error, `Failed to store feedback for response: ${feedback.responseId}`);
      throw error;
    }
  }

  /**
   * Store quality score
   */
  public async storeQualityScore(
    evaluationId: string,
    responseId: string,
    qualityScore: QualityScore
  ): Promise<void> {
    try {
      const db = this.ensureDatabase();
      Logger.debug(MODULE_NAME, `Storing quality score for response: ${responseId}`);
      
      await db.getAllAsync(`
        INSERT OR REPLACE INTO response_quality_scores (
          id,
          response_id,
          overall_score,
          relevance_score,
          accuracy_score,
          comprehensiveness_score,
          safety_score,
          strengths,
          weaknesses,
          improvement_suggestions,
          timestamp
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        evaluationId,
        responseId,
        qualityScore.overallScore,
        qualityScore.relevanceScore,
        qualityScore.accuracyScore,
        qualityScore.comprehensivenessScore,
        qualityScore.safetyScore,
        JSON.stringify(qualityScore.strengths),
        JSON.stringify(qualityScore.weaknesses),
        JSON.stringify(qualityScore.improvementSuggestions),
        Date.now()
      ]);
      
      Logger.debug(MODULE_NAME, `Quality score stored for response: ${responseId}`);
    } catch (error) {
      Logger.logError(MODULE_NAME, error as Error, `Failed to store quality score for response: ${responseId}`);
      throw error;
    }
  }

  /**
   * Store or update feedback pattern
   */
  public async storePattern(pattern: FeedbackPattern): Promise<void> {
    try {
      Logger.debug(MODULE_NAME, `Storing feedback pattern: ${pattern.patternId}`);
      
      await this.db.getAllAsync(`
        INSERT OR REPLACE INTO feedback_patterns (
          pattern_id,
          response_type,
          user_profile_factors,
          request_factors,
          positive_outcome_rate,
          sample_size,
          last_updated
        ) VALUES (?, ?, ?, ?, ?, ?, ?)
      `, [
        pattern.patternId,
        pattern.responseType,
        JSON.stringify(pattern.userProfileFactors),
        JSON.stringify(pattern.requestFactors),
        pattern.positiveOutcomeRate,
        pattern.sampleSize,
        pattern.lastUpdated
      ]);
      
      Logger.debug(MODULE_NAME, `Feedback pattern stored: ${pattern.patternId}`);
    } catch (error) {
      Logger.logError(MODULE_NAME, error as Error, `Failed to store feedback pattern: ${pattern.patternId}`);
      throw error;
    }
  }

  /**
   * Get feedback pattern by ID
   */
  public async getPattern(patternId: string): Promise<PatternEntry | null> {
    try {
      Logger.debug(MODULE_NAME, `Getting feedback pattern: ${patternId}`);
      
      const results = await this.db.getAllAsync<PatternEntry>(`
        SELECT 
          pattern_id,
          user_profile_factors,
          request_factors,
          positive_outcome_rate,
          sample_size
        FROM feedback_patterns 
        WHERE pattern_id = ?
      `, [patternId]);
      
      if (results.length === 0) {
        Logger.debug(MODULE_NAME, `No feedback pattern found for ID: ${patternId}`);
        return null;
      }
      
      Logger.debug(MODULE_NAME, `Feedback pattern found: ${patternId}`);
      return results[0];
    } catch (error) {
      Logger.logError(MODULE_NAME, error as Error, `Failed to get feedback pattern: ${patternId}`);
      throw error;
    }
  }

  /**
   * Get all feedback for a user
   */
  public async getUserFeedback(userId: string): Promise<UserFeedback[]> {
    try {
      Logger.debug(MODULE_NAME, `Getting all feedback for user: ${userId}`);
      
      // Define the interface for the raw database results
      interface RawFeedbackRow {
        userId: string;
        responseId: string;
        responseType: 'recommendation' | 'chat';
        helpful: number;
        accurate: number;
        relevance: number;
        comments?: string;
        timestamp: number;
      }
      
      const results = await this.db.getAllAsync<RawFeedbackRow>(`
        SELECT 
          user_id as userId,
          response_id as responseId,
          response_type as responseType,
          helpful,
          accurate,
          relevance,
          comments,
          timestamp
        FROM user_feedback 
        WHERE user_id = ?
        ORDER BY timestamp DESC
      `, [userId]);
      
      // Convert boolean fields from SQLite integers
      const feedback: UserFeedback[] = results.map(row => ({
        userId: row.userId,
        responseId: row.responseId,
        responseType: row.responseType,
        helpful: row.helpful === 1,
        accurate: row.accurate === 1,
        relevance: row.relevance,
        comments: row.comments,
        timestamp: row.timestamp
      }));
      
      Logger.debug(MODULE_NAME, `Found ${feedback.length} feedback entries for user: ${userId}`);
      return feedback;
    } catch (error) {
      Logger.logError(MODULE_NAME, error as Error, `Failed to get feedback for user: ${userId}`);
      throw error;
    }
  }

  /**
   * Get feedback statistics for a user
   */
  public async getUserFeedbackStats(userId: string): Promise<FeedbackStats> {
    try {
      Logger.debug(MODULE_NAME, `Getting feedback stats for user: ${userId}`);
      
      const results = await this.db.getAllAsync<FeedbackStats>(`
        SELECT 
          COUNT(*) as total,
          SUM(CASE WHEN helpful = 1 THEN 1 ELSE 0 END) as positive,
          SUM(relevance) as relevance_sum
        FROM user_feedback 
        WHERE user_id = ?
      `, [userId]);
      
      Logger.debug(MODULE_NAME, `Retrieved feedback stats for user: ${userId}`);
      return results[0];
    } catch (error) {
      Logger.logError(MODULE_NAME, error as Error, `Failed to get feedback stats for user: ${userId}`);
      throw error;
    }
  }

  /**
   * Get quality score statistics
   */
  public async getQualityScoreStats(): Promise<QualityStats> {
    try {
      Logger.debug(MODULE_NAME, 'Getting quality score statistics');
      
      const results = await this.db.getAllAsync<QualityStats>(`
        SELECT 
          AVG(overall_score) as avg_overall,
          AVG(relevance_score) as avg_relevance,
          AVG(safety_score) as avg_safety,
          COUNT(*) as total
        FROM response_quality_scores
      `);
      
      Logger.debug(MODULE_NAME, 'Retrieved quality score statistics');
      return results[0];
    } catch (error) {
      Logger.logError(MODULE_NAME, error as Error, 'Failed to get quality score statistics');
      throw error;
    }
  }

  /**
   * Get all patterns for a response type
   */
  public async getPatternsByType(responseType: string): Promise<PatternEntry[]> {
    try {
      Logger.debug(MODULE_NAME, `Getting patterns for response type: ${responseType}`);
      
      const results = await this.db.getAllAsync<PatternEntry>(`
        SELECT 
          pattern_id,
          user_profile_factors,
          request_factors,
          positive_outcome_rate,
          sample_size
        FROM feedback_patterns 
        WHERE response_type = ?
        ORDER BY positive_outcome_rate DESC
      `, [responseType]);
      
      Logger.debug(MODULE_NAME, `Found ${results.length} patterns for response type: ${responseType}`);
      return results;
    } catch (error) {
      Logger.logError(MODULE_NAME, error as Error, `Failed to get patterns for response type: ${responseType}`);
      throw error;
    }
  }

  /**
   * Delete all feedback for a user
   */
  public async deleteUserFeedback(userId: string): Promise<number> {
    try {
      Logger.debug(MODULE_NAME, `Deleting all feedback for user: ${userId}`);
      
      // First count how many entries will be deleted
      const countResult = await this.db.getAllAsync<{ count: number }>(`
        SELECT COUNT(*) as count FROM user_feedback WHERE user_id = ?
      `, [userId]);
      
      const count = countResult[0].count;
      
      // Delete the entries
      await this.db.getAllAsync(`
        DELETE FROM user_feedback WHERE user_id = ?
      `, [userId]);
      
      Logger.debug(MODULE_NAME, `Deleted ${count} feedback entries for user: ${userId}`);
      return count;
    } catch (error) {
      Logger.logError(MODULE_NAME, error as Error, `Failed to delete feedback for user: ${userId}`);
      throw error;
    }
  }
} 