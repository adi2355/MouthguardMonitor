import * as Logger from '../utils/logging';
import { FeedbackRepository } from '../database/repositories/FeedbackRepository';
import { UserFeedback, QualityScore, FeedbackPattern } from '../types/feedback';
import { AnthropicAPI } from '../api/AnthropicAPI';

const MODULE_NAME = 'FeedbackService';

/**
 * Feedback Service
 * Handles user feedback and response quality evaluation
 */
export class FeedbackService {
  private static instance: FeedbackService;
  private repository: FeedbackRepository;
  private api: AnthropicAPI;
  private initialized: boolean = false;

  private constructor() {
    this.repository = new FeedbackRepository();
    this.api = new AnthropicAPI();
    Logger.debug(MODULE_NAME, 'Initialized');
  }

  /**
   * Get the singleton instance of FeedbackService
   */
  public static getInstance(): FeedbackService {
    if (!FeedbackService.instance) {
      FeedbackService.instance = new FeedbackService();
    }
    return FeedbackService.instance;
  }

  /**
   * Initialize the feedback service
   */
  public async initialize(): Promise<void> {
    if (this.initialized) {
      Logger.debug(MODULE_NAME, 'Already initialized');
      return;
    }

    try {
      Logger.info(MODULE_NAME, 'Initializing feedback service');
      this.initialized = true;
      Logger.info(MODULE_NAME, 'Feedback service initialized successfully');
    } catch (error) {
      Logger.logError(MODULE_NAME, error as Error, 'Failed to initialize feedback service');
      throw error;
    }
  }

  /**
   * Submit user feedback
   */
  public async submitFeedback(feedback: UserFeedback): Promise<string> {
    try {
      Logger.info(MODULE_NAME, `Submitting feedback for response: ${feedback.responseId}`);
      
      // Generate a unique ID for the feedback
      const feedbackId = `fb_${Date.now()}`;
      
      // Store the feedback
      await this.repository.storeFeedback(feedback, feedbackId);
      
      // Evaluate the response quality in the background
      this.evaluateResponseQuality(feedback.responseId, feedback.responseType)
        .catch(error => {
          Logger.logError(MODULE_NAME, error as Error, `Failed to evaluate response quality for: ${feedback.responseId}`);
        });
      
      // Extract feedback patterns in the background
      this.extractFeedbackPatterns(feedback)
        .catch(error => {
          Logger.logError(MODULE_NAME, error as Error, `Failed to extract feedback patterns for: ${feedback.responseId}`);
        });
      
      Logger.info(MODULE_NAME, `Feedback submitted successfully: ${feedbackId}`);
      return feedbackId;
    } catch (error) {
      Logger.logError(MODULE_NAME, error as Error, `Failed to submit feedback for response: ${feedback.responseId}`);
      throw error;
    }
  }

  /**
   * Evaluate the quality of a response
   */
  public async evaluateResponseQuality(
    responseId: string,
    responseType: 'recommendation' | 'chat',
    responseData?: any
  ): Promise<QualityScore> {
    try {
      Logger.info(MODULE_NAME, `Evaluating quality for response: ${responseId}`);
      
      // Generate a unique ID for the evaluation
      const evaluationId = `eval_${Date.now()}`;
      
      // If we have an API key and want to use the real API
      const useRealApi = false; // Set to true to use the real API
      
      if (useRealApi) {
        // Format the evaluation prompt
        const prompt = `
          You are an expert evaluator of AI responses for a cannabis recommendation app.
          Please evaluate the following ${responseType} response:
          
          ${JSON.stringify(responseData)}
          
          Provide a quality score on a scale of 0-100 for the following aspects:
          - Overall quality
          - Relevance to user needs
          - Accuracy of information
          - Comprehensiveness
          - Safety considerations
          
          Also list:
          - 3 strengths of the response
          - 3 weaknesses of the response
          - 3 suggestions for improvement
          
          Format your response as a JSON object with the following structure:
          {
            "overallScore": number,
            "relevanceScore": number,
            "accuracyScore": number,
            "comprehensivenessScore": number,
            "safetyScore": number,
            "strengths": string[],
            "weaknesses": string[],
            "improvementSuggestions": string[]
          }
        `;
        
        // Call the API
        const response = await this.api.sendMessage([
          { role: 'user', content: prompt }
        ], 2000, 0.3);
        
        // Parse the response
        const qualityScore = JSON.parse(response) as QualityScore;
        
        // Store the quality score
        await this.repository.storeQualityScore(evaluationId, responseId, qualityScore);
        
        Logger.info(MODULE_NAME, `Quality evaluation completed for response: ${responseId}`);
        return qualityScore;
      } else {
        // For testing or when API is not available, generate a mock quality score
        const mockQualityScore: QualityScore = {
          overallScore: 85,
          relevanceScore: 80,
          accuracyScore: 90,
          comprehensivenessScore: 85,
          safetyScore: 95,
          strengths: [
            'Provides detailed information about the recommended strains',
            'Includes safety considerations and dosage guidelines',
            'Explains the reasoning behind the recommendations'
          ],
          weaknesses: [
            'Could provide more context about potential side effects',
            'Limited information about alternative options',
            'Dosage recommendations could be more personalized'
          ],
          improvementSuggestions: [
            'Include more information about potential side effects',
            'Provide alternative recommendations for different scenarios',
            'Enhance personalization of dosage recommendations'
          ]
        };
        
        // Store the mock quality score
        await this.repository.storeQualityScore(evaluationId, responseId, mockQualityScore);
        
        Logger.info(MODULE_NAME, `Mock quality evaluation completed for response: ${responseId}`);
        return mockQualityScore;
      }
    } catch (error) {
      Logger.logError(MODULE_NAME, error as Error, `Failed to evaluate quality for response: ${responseId}`);
      
      // Return a default quality score in case of error
      return {
        overallScore: 70,
        relevanceScore: 70,
        accuracyScore: 70,
        comprehensivenessScore: 70,
        safetyScore: 70,
        strengths: ['Not evaluated due to error'],
        weaknesses: ['Not evaluated due to error'],
        improvementSuggestions: ['Not evaluated due to error']
      };
    }
  }

  /**
   * Extract feedback patterns from user feedback
   */
  private async extractFeedbackPatterns(feedback: UserFeedback): Promise<void> {
    try {
      Logger.debug(MODULE_NAME, `Extracting feedback patterns for response: ${feedback.responseId}`);
      
      // In a real implementation, this would analyze the feedback and extract patterns
      // For now, we'll just create a simple pattern based on the feedback
      
      // Create a pattern ID based on user profile and request factors
      const patternId = `pattern_${feedback.responseType}_${Date.now()}`;
      
      // Check if the pattern already exists
      const existingPattern = await this.repository.getPattern(patternId);
      
      if (existingPattern) {
        // Update the existing pattern
        const updatedPattern: FeedbackPattern = {
          patternId,
          responseType: feedback.responseType,
          userProfileFactors: { userId: feedback.userId },
          requestFactors: { responseId: feedback.responseId },
          positiveOutcomeRate: feedback.helpful ? 1 : 0,
          sampleSize: 1,
          lastUpdated: Date.now()
        };
        
        await this.repository.storePattern(updatedPattern);
      } else {
        // Create a new pattern
        const newPattern: FeedbackPattern = {
          patternId,
          responseType: feedback.responseType,
          userProfileFactors: { userId: feedback.userId },
          requestFactors: { responseId: feedback.responseId },
          positiveOutcomeRate: feedback.helpful ? 1 : 0,
          sampleSize: 1,
          lastUpdated: Date.now()
        };
        
        await this.repository.storePattern(newPattern);
      }
      
      Logger.debug(MODULE_NAME, `Feedback patterns extracted for response: ${feedback.responseId}`);
    } catch (error) {
      Logger.logError(MODULE_NAME, error as Error, `Failed to extract feedback patterns for response: ${feedback.responseId}`);
    }
  }

  /**
   * Get all feedback for a user
   */
  public async getUserFeedback(userId: string): Promise<UserFeedback[]> {
    try {
      Logger.debug(MODULE_NAME, `Getting feedback for user: ${userId}`);
      const feedback = await this.repository.getUserFeedback(userId);
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
  public async getUserFeedbackStats(userId: string): Promise<any> {
    try {
      Logger.debug(MODULE_NAME, `Getting feedback stats for user: ${userId}`);
      const stats = await this.repository.getUserFeedbackStats(userId);
      Logger.debug(MODULE_NAME, `Retrieved feedback stats for user: ${userId}`);
      return stats;
    } catch (error) {
      Logger.logError(MODULE_NAME, error as Error, `Failed to get feedback stats for user: ${userId}`);
      throw error;
    }
  }

  /**
   * Get quality score statistics
   */
  public async getQualityScoreStats(): Promise<any> {
    try {
      Logger.debug(MODULE_NAME, 'Getting quality score statistics');
      const stats = await this.repository.getQualityScoreStats();
      Logger.debug(MODULE_NAME, 'Retrieved quality score statistics');
      return stats;
    } catch (error) {
      Logger.logError(MODULE_NAME, error as Error, 'Failed to get quality score statistics');
      throw error;
    }
  }

  /**
   * Delete all feedback for a user
   */
  public async deleteUserFeedback(userId: string): Promise<number> {
    try {
      Logger.debug(MODULE_NAME, `Deleting feedback for user: ${userId}`);
      const count = await this.repository.deleteUserFeedback(userId);
      Logger.debug(MODULE_NAME, `Deleted ${count} feedback entries for user: ${userId}`);
      return count;
    } catch (error) {
      Logger.logError(MODULE_NAME, error as Error, `Failed to delete feedback for user: ${userId}`);
      throw error;
    }
  }
} 