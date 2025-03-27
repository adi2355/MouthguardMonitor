import * as Logger from './utils/logging';
import { DatabaseManager } from './database/DatabaseManager';
import { CacheManager } from './cache/CacheManager';
import { FeedbackService } from './feedback/FeedbackService';
import { AnthropicAPI } from './api/AnthropicAPI';
import { AIServiceError, AIServiceErrorType } from './types/errors';
import { 
  RecommendationRequest, 
  ChatRequest 
} from './types/requests';
import { 
  RecommendationResponse, 
  ChatResponse,
  JournalAnalysisResult,
  SafetyValidationResult,
  DrugInteractionResult,
  OveruseDetectionResult
} from './types/responses';
import { UserFeedback, QualityScore } from './types/feedback';
import { DEFAULT_CACHE_TTL } from './types/common';
// Import types from the main app types
import { 
  UserProfile, 
  JournalEntry, 
  StrainRecommendation, 
  DosageSuggestion,
  ChatMessage
} from '../../types';
import { MemoryCache } from './cache/MemoryCache';
import { PersistentCache } from './cache/PersistentCache';
import { databaseManager } from "../../DatabaseManager";
import { Strain } from "@/src/types";

const MODULE_NAME = 'AIService';

/**
 * AI Service
 * Main service for AI-powered features in the Canova app
 */
export class AIService {
  private static instance: AIService;
  private cacheManager: CacheManager;
  private feedbackService: FeedbackService;
  private api: AnthropicAPI;
  private initialized: boolean = false;
  private useMockResponses: boolean = false;
  private initializationPromise: Promise<void> | null = null;

  private constructor() {
    this.cacheManager = CacheManager.getInstance();
    this.feedbackService = FeedbackService.getInstance();
    this.api = new AnthropicAPI();
    Logger.debug(MODULE_NAME, 'Initialized');
  }

  /**
   * Get the singleton instance of AIService
   */
  public static getInstance(): AIService {
    if (!AIService.instance) {
      AIService.instance = new AIService();
    }
    return AIService.instance;
  }

  /**
   * Initialize the AI service and its dependencies
   */
  public async initialize(): Promise<void> {
    // If already initialized, return immediately
    if (this.initialized) {
      return;
    }
    
    // If initialization is in progress, wait for it to complete
    if (this.initializationPromise) {
      return this.initializationPromise;
    }

    console.info('[AIService] Initializing AI service');
    
    // Create a promise for initialization
    this.initializationPromise = (async () => {
      try {
        // First ensure DatabaseManager is initialized
        await databaseManager.ensureInitialized();
        
        // Initialize cache manager
        console.info('[CacheManager] Initializing cache manager');
        this.cacheManager = CacheManager.getInstance();
        await this.cacheManager.initialize();
        console.info('[CacheManager] Cache manager initialized successfully');
        
        // Initialize feedback service (after cache manager)
        console.info('[FeedbackService] Initializing feedback service');
        this.feedbackService = FeedbackService.getInstance();
        await this.feedbackService.initialize();
        console.info('[FeedbackService] Feedback service initialized successfully');
        
        // Initialize API client - use existing method
        this.api = new AnthropicAPI();
        
        this.initialized = true;
        console.info('[AIService] AI service initialized successfully');
      } catch (error) {
        console.error('[AIService] Failed to initialize:', error);
        throw error;
      } finally {
        this.initializationPromise = null;
      }
    })();
    
    return this.initializationPromise;
  }

  /**
   * Configure the AI service
   */
  public configure(options: {
    useMockResponses?: boolean;
    cacheEnabled?: boolean;
    cacheTtl?: number;
    cacheMaxSize?: number;
  }): void {
    if (options.useMockResponses !== undefined) {
      this.useMockResponses = options.useMockResponses;
      Logger.info(MODULE_NAME, `Mock responses ${this.useMockResponses ? 'enabled' : 'disabled'}`);
    }
    
    // Configure cache if options provided
    if (options.cacheEnabled !== undefined || options.cacheTtl !== undefined || options.cacheMaxSize !== undefined) {
      try {
        this.cacheManager.configure(
          options.cacheEnabled ?? true,
          options.cacheTtl ?? DEFAULT_CACHE_TTL,
          options.cacheMaxSize ?? 100
        );
      } catch (error) {
        Logger.logError(MODULE_NAME, error as Error, 'Failed to configure cache manager');
      }
    }
  }

  /**
   * Check if the service is initialized
   */
  private checkInitialized(): void {
    if (!this.initialized) {
      console.warn('[AIService] AI service not initialized, initializing now...');
      // Instead of throwing an error, start initialization and continue
      // This prevents errors when components try to use the service before initialization
      this.initialize().catch(err => {
        console.error('[AIService] Initialization failed:', err);
      });
    }
  }

  /**
   * Get real strain recommendations from the database based on user preferences
   */
  private async getRealStrainRecommendations(request: RecommendationRequest): Promise<RecommendationResponse> {
    try {
      Logger.info(MODULE_NAME, 'Getting real strain recommendations from database');
      
      // Extract desired effects from the request
      const { desiredEffects, context, medicalNeeds } = request;
      Logger.info(MODULE_NAME, `Desired effects: ${desiredEffects.join(', ')}`);
      
      // Get all strains from the database
      const allStrainsResult = await databaseManager.searchStrains('', {}, { page: 1, limit: 100 });
      Logger.info(MODULE_NAME, `All strains search result: Found ${allStrainsResult.data?.length || 0} strains`);
      
      if (!allStrainsResult.data || allStrainsResult.data.length === 0) {
        Logger.warn(MODULE_NAME, 'No strains found in database at all');
        return this.getMockRecommendations(request); // Fallback to mock data if no results
      }
      
      // Log some sample effects from the database to understand what's available
      const sampleEffects = allStrainsResult.data.slice(0, 5).map((strain: Strain) => {
        return `${strain.name}: ${strain.effects}`;
      });
      Logger.info(MODULE_NAME, `Sample effects in database: ${sampleEffects.join(' | ')}`);
      
      // Use the AI to interpret the natural language query and match it to strain effects
      const matchedStrains = await this.matchStrainsWithAI(desiredEffects, allStrainsResult.data, context, medicalNeeds);
      
      // If we don't have any recommendations, use mock data
      if (!matchedStrains || matchedStrains.length === 0) {
        Logger.warn(MODULE_NAME, 'No matching strains found after AI matching');
        return this.getMockRecommendations(request);
      }
      
      // Log the top 5 scored strains
      const topScores = matchedStrains.slice(0, 5).map(s => `${s.strain.name}: ${s.matchScore}%`);
      Logger.info(MODULE_NAME, `Top scored strains: ${topScores.join(', ')}`);
      
      // Take top 5 recommendations
      const topRecommendations = matchedStrains
        .slice(0, 5)
        .map(s => ({
          strainId: s.strain.id || 0,
          strainName: s.strain.name,
          matchScore: s.matchScore,
          reasoningFactors: s.reasoningFactors,
          alternativeStrains: [] // Could be populated with similar strains
        }));
      
      Logger.info(MODULE_NAME, `Returning ${topRecommendations.length} recommendations`);
      
      return {
        recommendations: topRecommendations,
        reasoning: `Based on your request for "${desiredEffects.join(', ')}", I've found strains that are likely to match your preferences.`,
        confidenceScore: 90,
        disclaimers: [
          'Individual experiences may vary',
          'Start with a low dose and gradually increase as needed',
          'Consult with a healthcare professional before use, especially if you have medical conditions or take medications'
        ],
        dosageSuggestion: {
          minDosage: 5,
          maxDosage: 10,
          unit: 'mg THC',
          gradualApproach: true,
          notes: 'Start low and go slow. Wait at least 2 hours before consuming more edibles.'
        },
        safetyNotes: [
          'Do not drive or operate heavy machinery after use',
          'Keep out of reach of children and pets',
          'Store in a cool, dry place away from direct sunlight'
        ]
      };
    } catch (error) {
      Logger.logError(MODULE_NAME, error as Error, 'Failed to get real strain recommendations');
      // Fallback to mock data if there's an error
      return this.getMockRecommendations(request);
    }
  }

  /**
   * Use AI to match strains with natural language queries
   */
  private async matchStrainsWithAI(
    desiredEffects: string[], 
    strains: Strain[], 
    context?: string,
    medicalNeeds?: string[]
  ): Promise<Array<{
    strain: Strain;
    matchScore: number;
    reasoningFactors: Array<{ factor: string; weight: number }>;
  }>> {
    try {
      // If we're not using the real API, use a simpler matching approach
      if (this.useMockResponses) {
        return this.matchStrainsSimple(desiredEffects, strains, context, medicalNeeds);
      }
      
      // Create a prompt for the AI to match strains
      const prompt = `
        You are an expert cannabis strain matcher. I need you to match the following user's desired effects with the most appropriate strains from our database.
        
        User's desired effects: "${desiredEffects.join(', ')}"
        ${context ? `Context: ${context}` : ''}
        ${medicalNeeds && medicalNeeds.length > 0 ? `Medical needs: ${medicalNeeds.join(', ')}` : ''}
        
        Here are the available strains with their effects:
        ${strains.slice(0, 50).map(strain => 
          `- ${strain.name} (${strain.genetic_type}, THC: ${strain.thc_range}): ${strain.effects}${strain.uses ? ` | Uses: ${strain.uses}` : ''}`
        ).join('\n')}
        
        Please analyze the user's request and match it with the most appropriate strains. For each matched strain, provide:
        1. The strain name
        2. A match score (0-100)
        3. 2-3 specific reasoning factors explaining why this strain matches the user's request
        
        Return your response as a JSON array with the following structure:
        [
          {
            "strainName": "Strain Name",
            "matchScore": 85,
            "reasoningFactors": [
              {"factor": "Specific reason this strain matches", "weight": 0.5},
              {"factor": "Another specific reason", "weight": 0.3},
              {"factor": "Additional information about the strain", "weight": 0.2}
            ]
          }
        ]
        
        Only include strains with a match score above 50. Limit your response to the top 10 matches.
      `;
      
      // Call the AI API
      const response = await this.api.sendMessage([
        { role: 'user', content: prompt }
      ], 2000, 0.7);
      
      // Parse the response
      try {
        // Extract JSON from the response (it might be wrapped in markdown code blocks)
        const jsonMatch = response.match(/```(?:json)?\s*([\s\S]*?)\s*```/) || 
                          response.match(/\[\s*\{\s*"strainName"/);
        
        const jsonStr = jsonMatch ? jsonMatch[1] || response : response;
        const matches = JSON.parse(jsonStr);
        
        if (!Array.isArray(matches)) {
          throw new Error('Response is not an array');
        }
        
        // Map the AI matches to our strain objects
        const matchedStrains = matches.map(match => {
          // Find the corresponding strain object
          const strain = strains.find(s => s.name === match.strainName);
          
          if (!strain) {
            Logger.warn(MODULE_NAME, `Strain not found: ${match.strainName}`);
            return null;
          }
          
          return {
            strain,
            matchScore: match.matchScore,
            reasoningFactors: match.reasoningFactors
          };
        }).filter((match): match is { 
          strain: Strain; 
          matchScore: number; 
          reasoningFactors: Array<{ factor: string; weight: number }> 
        } => match !== null);
        
        Logger.info(MODULE_NAME, `AI matched ${matchedStrains.length} strains`);
        
        return matchedStrains;
      } catch (error) {
        Logger.logError(MODULE_NAME, error as Error, 'Failed to parse AI strain matching response');
        // Fallback to simple matching
        return this.matchStrainsSimple(desiredEffects, strains, context, medicalNeeds);
      }
    } catch (error) {
      Logger.logError(MODULE_NAME, error as Error, 'Failed to match strains with AI');
      // Fallback to simple matching
      return this.matchStrainsSimple(desiredEffects, strains, context, medicalNeeds);
    }
  }
  
  /**
   * Simple strain matching algorithm as a fallback
   */
  private matchStrainsSimple(
    desiredEffects: string[], 
    strains: Strain[], 
    context?: string,
    medicalNeeds?: string[]
  ): Array<{
    strain: Strain;
    matchScore: number;
    reasoningFactors: Array<{ factor: string; weight: number }>;
  }> {
    // Common cannabis effects for basic matching
    const commonEffects = {
      'happy': ['euphoric', 'uplifted', 'joyful', 'cheerful', 'blissful'],
      'relaxed': ['calm', 'peaceful', 'tranquil', 'mellow', 'soothing'],
      'creative': ['inspired', 'imaginative', 'artistic', 'focused'],
      'energetic': ['active', 'lively', 'stimulating', 'invigorating'],
      'sleepy': ['sedated', 'drowsy', 'restful', 'sleep', 'tired'],
      'hungry': ['appetite', 'munchies', 'food'],
      'pain relief': ['analgesic', 'pain', 'ache', 'sore'],
      'stress relief': ['stress', 'anxiety', 'tension', 'worry']
    };
    
    // Score each strain
    const scoredStrains = strains.map(strain => {
      // Parse effects into an array
      const strainEffects = strain.effects.split(',').map(e => e.trim().toLowerCase());
      
      // Calculate a basic match score
      let matchScore = 0;
      const matchedEffects: string[] = [];
      
      // Check each desired effect against strain effects
      desiredEffects.forEach(desiredEffect => {
        const desiredLower = desiredEffect.toLowerCase();
        
        // Direct match
        const directMatch = strainEffects.some(effect => 
          effect.includes(desiredLower) || desiredLower.includes(effect)
        );
        
        if (directMatch) {
          matchScore += 25;
          matchedEffects.push(desiredEffect);
          return;
        }
        
        // Check against common effects
        for (const [effect, synonyms] of Object.entries(commonEffects)) {
          // If desired effect contains this effect or synonyms
          if (desiredLower.includes(effect) || synonyms.some(s => desiredLower.includes(s))) {
            // Check if strain has this effect
            const hasEffect = strainEffects.some(strainEffect => 
              strainEffect.includes(effect) || synonyms.some(s => strainEffect.includes(s))
            );
            
            if (hasEffect) {
              matchScore += 20;
              matchedEffects.push(effect);
              return;
            }
          }
        }
        
        // Check for partial word matches
        const desiredWords = desiredLower.split(/\s+/).filter(w => w.length > 3);
        const hasPartialMatch = strainEffects.some(effect => 
          desiredWords.some(word => effect.includes(word))
        );
        
        if (hasPartialMatch) {
          matchScore += 10;
        }
      });
      
      // Boost score for context matches
      if (context === 'medical' && strain.uses && 
          (strain.uses.toLowerCase().includes('medical') || 
           (medicalNeeds && medicalNeeds.some(need => strain.uses.toLowerCase().includes(need.toLowerCase()))))) {
        matchScore += 15;
      } else if (context === 'recreational' && strainEffects.some(e => e.includes('euphoric'))) {
        matchScore += 15;
      }
      
      // Cap score at 100
      matchScore = Math.min(matchScore, 100);
      
      // Create reasoning factors
      const reasoningFactors = [];
      
      if (matchedEffects.length > 0) {
        reasoningFactors.push({
          factor: `Matches your desired effects: ${matchedEffects.join(', ')}`,
          weight: 0.5
        });
      }
      
      if (context === 'medical' && strain.uses) {
        reasoningFactors.push({
          factor: `Good for medical use: ${strain.uses}`,
          weight: 0.3
        });
      }
      
      reasoningFactors.push({
        factor: `${strain.genetic_type} with ${strain.thc_range} THC content`,
        weight: 0.2
      });
      
      return {
        strain,
        matchScore,
        reasoningFactors
      };
    });
    
    // Sort by match score (highest first) and filter out low scores
    return scoredStrains
      .filter(s => s.matchScore > 0)
      .sort((a, b) => b.matchScore - a.matchScore);
  }

  /**
   * Get strain recommendations based on user profile and preferences
   */
  public async getRecommendations(request: RecommendationRequest): Promise<RecommendationResponse> {
    this.checkInitialized();
    
    try {
      Logger.info(MODULE_NAME, 'Getting strain recommendations');
      
      // Generate a unique response ID
      const responseId = `rec_${Date.now()}`;
      
      // Check cache first
      const cacheKey = this.cacheManager.generateKey(request);
      const cachedResponse = await this.cacheManager.get<RecommendationResponse>(cacheKey);
      
      if (cachedResponse) {
        Logger.info(MODULE_NAME, 'Returning cached recommendations');
        // Add the responseId to the cached response
        return { ...cachedResponse, responseId };
      }
      
      // If using mock responses, return a mock response
      if (this.useMockResponses) {
        const mockResponse = this.getMockRecommendations(request);
        
        // Cache the response
        await this.cacheManager.set(cacheKey, mockResponse);
        
        Logger.info(MODULE_NAME, 'Returning mock recommendations');
        return { ...mockResponse, responseId };
      }
      
      // Get real recommendations from the database
      const realRecommendations = await this.getRealStrainRecommendations(request);
      
      // Add the responseId
      const result: RecommendationResponse = {
        ...realRecommendations,
        responseId
      };
      
      // Cache the response
      await this.cacheManager.set(cacheKey, result);
      
      Logger.info(MODULE_NAME, 'Recommendations generated successfully');
      return result;
    } catch (error) {
      Logger.logError(MODULE_NAME, error as Error, 'Failed to get recommendations');
      throw error;
    }
  }

  /**
   * Format a recommendation prompt for the AI
   */
  private formatRecommendationPrompt(request: RecommendationRequest): string {
    // Create a detailed prompt for the AI
    return `
      You are an AI assistant for a cannabis recommendation app called Canova.
      Please provide personalized cannabis strain recommendations based on the following user profile and preferences:
      
      User Profile:
      ${JSON.stringify(request.userProfile, null, 2)}
      
      Desired Effects:
      ${request.desiredEffects.join(', ')}
      
      ${request.medicalNeeds ? `Medical Needs: ${request.medicalNeeds.join(', ')}` : ''}
      ${request.context ? `Context: ${request.context}` : ''}
      ${request.locationCode ? `Location Code: ${request.locationCode}` : ''}
      
      ${request.journalEntries ? `Recent Journal Entries:
      ${JSON.stringify(request.journalEntries, null, 2)}` : ''}
      
      Please provide:
      1. A list of 3-5 strain recommendations with detailed information about each
      2. A brief explanation of why each strain was recommended
      3. Suggested dosage guidelines
      4. Any safety considerations or warnings
      
      Format your response as a JSON object with the following structure:
      {
        "recommendations": [
          {
            "name": "Strain Name",
            "type": "Indica/Sativa/Hybrid",
            "thcContent": "THC percentage range",
            "cbdContent": "CBD percentage range",
            "effects": ["effect1", "effect2", ...],
            "medicalBenefits": ["benefit1", "benefit2", ...],
            "flavors": ["flavor1", "flavor2", ...],
            "description": "Detailed description"
          }
        ],
        "reasoning": "Explanation of recommendations",
        "confidenceScore": 0-100,
        "disclaimers": ["disclaimer1", "disclaimer2", ...],
        "dosageSuggestion": {
          "beginner": "Beginner dosage",
          "intermediate": "Intermediate dosage",
          "experienced": "Experienced dosage",
          "notes": "Additional notes"
        },
        "safetyNotes": ["note1", "note2", ...]
      }
    `;
  }

  /**
   * Parse the AI response into a structured recommendation
   */
  private parseRecommendationResponse(response: string): RecommendationResponse {
    try {
      // Try to parse the response as JSON
      const parsedResponse = JSON.parse(response) as RecommendationResponse;
      
      // Validate the response structure
      if (!parsedResponse.recommendations || !Array.isArray(parsedResponse.recommendations)) {
        throw new Error('Invalid response structure: recommendations array missing');
      }
      
      return parsedResponse;
    } catch (error) {
      Logger.logError(MODULE_NAME, error as Error, 'Failed to parse recommendation response');
      
      // If parsing fails, try to extract information from the text response
      // This is a fallback mechanism for when the AI doesn't return valid JSON
      
      // For now, return a simple error response
      return {
        recommendations: [],
        reasoning: 'Failed to parse AI response',
        confidenceScore: 0,
        disclaimers: ['The AI response could not be properly parsed'],
        error: {
          message: 'Failed to parse AI response',
          type: 'parsing_error',
          recoverable: false
        }
      };
    }
  }

  /**
   * Generate mock recommendations for testing
   */
  private getMockRecommendations(request: RecommendationRequest): RecommendationResponse {
    return {
      recommendations: [
        {
          strainId: 1,
          strainName: 'Blue Dream',
          matchScore: 95,
          reasoningFactors: [
            { factor: 'Matches desired effects', weight: 0.5 },
            { factor: 'Good for stress relief', weight: 0.3 },
            { factor: 'Balanced hybrid', weight: 0.2 }
          ],
          alternativeStrains: [
            { strainId: 4, strainName: 'Harlequin', reason: 'Higher CBD content' }
          ]
        },
        {
          strainId: 2,
          strainName: 'OG Kush',
          matchScore: 90,
          reasoningFactors: [
            { factor: 'Strong pain relief', weight: 0.6 },
            { factor: 'Matches user experience level', weight: 0.4 }
          ],
          alternativeStrains: [
            { strainId: 5, strainName: 'Bubba Kush', reason: 'Similar effects with more sedation' }
          ]
        },
        {
          strainId: 3,
          strainName: 'Granddaddy Purple',
          matchScore: 85,
          reasoningFactors: [
            { factor: 'Good for sleep', weight: 0.7 },
            { factor: 'Matches flavor preferences', weight: 0.3 }
          ],
          alternativeStrains: [
            { strainId: 6, strainName: 'Northern Lights', reason: 'Similar relaxation effects' }
          ]
        }
      ],
      reasoning: `Based on the user's profile and preferences, I've recommended strains that align with their desired effects and medical needs. Blue Dream offers a balanced experience, OG Kush provides potent relief, and Granddaddy Purple is excellent for relaxation and sleep.`,
      confidenceScore: 85,
      disclaimers: [
        'Individual experiences may vary',
        'Start with a low dose and gradually increase as needed',
        'Consult with a healthcare professional before use, especially if you have medical conditions or take medications'
      ],
      dosageSuggestion: {
        minDosage: 5,
        maxDosage: 10,
        unit: 'mg THC',
        gradualApproach: true,
        notes: 'Start low and go slow. Wait at least 2 hours before consuming more edibles.'
      },
      safetyNotes: [
        'Do not drive or operate heavy machinery after use',
        'Keep out of reach of children and pets',
        'Store in a cool, dry place away from direct sunlight'
      ]
    };
  }

  /**
   * Submit user feedback for a recommendation
   */
  public async submitRecommendationFeedback(
    userId: string,
    responseId: string,
    helpful: boolean,
    accurate: boolean,
    relevance: number,
    comments?: string
  ): Promise<string> {
    this.checkInitialized();
    
    try {
      Logger.info(MODULE_NAME, `Submitting recommendation feedback for response: ${responseId}`);
      
      const feedback: UserFeedback = {
        userId,
        responseId,
        responseType: 'recommendation',
        helpful,
        accurate,
        relevance,
        comments,
        timestamp: Date.now()
      };
      
      // Submit the feedback using the feedback service
      const feedbackId = await this.feedbackService.submitFeedback(feedback);
      
      Logger.info(MODULE_NAME, `Recommendation feedback submitted: ${feedbackId}`);
      return feedbackId;
    } catch (error) {
      Logger.logError(MODULE_NAME, error as Error, `Failed to submit recommendation feedback for response: ${responseId}`);
      
      if (error instanceof AIServiceError) {
        throw error;
      }
      
      throw new AIServiceError(
        'Failed to submit recommendation feedback',
        AIServiceErrorType.UNKNOWN,
        undefined,
        true,
        'An error occurred while submitting your feedback. Please try again later.'
      );
    }
  }

  /**
   * Get a response to a user's chat message
   */
  public async getChatResponse(request: ChatRequest): Promise<ChatResponse> {
    this.checkInitialized();
    
    try {
      Logger.info(MODULE_NAME, 'Getting chat response');
      
      // Generate a unique response ID
      const responseId = `chat_${Date.now()}`;
      
      // Check cache first
      const cacheKey = this.cacheManager.generateKey(request);
      const cachedResponse = await this.cacheManager.get<ChatResponse>(cacheKey);
      
      if (cachedResponse) {
        Logger.info(MODULE_NAME, 'Returning cached chat response');
        return cachedResponse;
      }
      
      // If using mock responses, return a mock response
      if (this.useMockResponses) {
        const mockResponse = this.getMockChatResponse(request);
        
        // Cache the response
        await this.cacheManager.set(cacheKey, mockResponse);
        
        Logger.info(MODULE_NAME, 'Returning mock chat response');
        return mockResponse;
      }
      
      // Format messages for the API
      const messages = this.formatChatMessages(request);
      
      // Call the API
      const response = await this.api.sendMessage(messages, 2000, 0.7);
      
      // Parse the response
      const chatResponse = this.parseChatResponse(response);
      
      // Cache the response
      await this.cacheManager.set(cacheKey, chatResponse);
      
      Logger.info(MODULE_NAME, 'Chat response generated successfully');
      return chatResponse;
    } catch (error) {
      Logger.logError(MODULE_NAME, error as Error, 'Failed to get chat response');
      
      if (error instanceof AIServiceError) {
        throw error;
      }
      
      throw new AIServiceError(
        'Failed to get chat response',
        AIServiceErrorType.UNKNOWN,
        undefined,
        true,
        'An error occurred while generating a response. Please try again later.'
      );
    }
  }

  /**
   * Format chat messages for the API
   */
  private formatChatMessages(request: ChatRequest): Array<{ role: 'user' | 'assistant'; content: string }> {
    const messages: Array<{ role: 'user' | 'assistant'; content: string }> = [];
    
    // Add system message with context
    messages.push({
      role: 'user',
      content: `You are an AI assistant for a cannabis app called Canova. You provide helpful, accurate, and educational information about cannabis. 
      
      User Profile:
      ${JSON.stringify(request.userProfile, null, 2)}
      
      ${request.locationCode ? `Location Code: ${request.locationCode}` : ''}
      
      Please provide informative, educational responses. Include relevant scientific information when appropriate. Always prioritize safety and responsible use. If you don't know something, say so rather than providing incorrect information.`
    });
    
    // Add previous messages if available
    if (request.previousMessages && request.previousMessages.length > 0) {
      request.previousMessages.forEach(msg => {
        messages.push({
          role: msg.role as 'user' | 'assistant',
          content: msg.content
        });
      });
    }
    
    // Add the current message
    messages.push({
      role: 'user',
      content: request.message
    });
    
    return messages;
  }

  /**
   * Parse the AI response into a structured chat response
   */
  private parseChatResponse(response: string): ChatResponse {
    // For chat, we can use the response text directly
    const chatResponse: ChatResponse = {
      response: response,
      // Extract educational links if present
      educationalLinks: this.extractLinks(response),
      // Add disclaimers
      disclaimers: [
        'This information is for educational purposes only and not medical advice.',
        'Consult with a healthcare professional before using cannabis, especially for medical conditions.'
      ]
    };
    
    return chatResponse;
  }

  /**
   * Extract links from a text response
   */
  private extractLinks(text: string): string[] {
    const links: string[] = [];
    const linkRegex = /https?:\/\/[^\s]+/g;
    const matches = text.match(linkRegex);
    
    if (matches) {
      matches.forEach(link => {
        links.push(link);
      });
    }
    
    return links;
  }

  /**
   * Generate a mock chat response for testing
   */
  private getMockChatResponse(request: ChatRequest): ChatResponse {
    // Simple mock response based on the request message
    const message = request.message.toLowerCase();
    
    if (message.includes('strain') || message.includes('recommend')) {
      return {
        response: `Based on your profile, I'd recommend considering strains like Blue Dream, OG Kush, or Granddaddy Purple. Blue Dream is a balanced hybrid that provides relaxation without sedation, OG Kush offers potent relief from stress and pain, and Granddaddy Purple is excellent for sleep and deep relaxation. Always start with a low dose, especially if you're new to cannabis.`,
        educationalLinks: ['https://www.leafly.com/strains/blue-dream', 'https://www.leafly.com/strains/og-kush'],
        disclaimers: [
          'This information is for educational purposes only and not medical advice.',
          'Consult with a healthcare professional before using cannabis, especially for medical conditions.'
        ]
      };
    } else if (message.includes('cbd') || message.includes('thc')) {
      return {
        response: `THC (tetrahydrocannabinol) and CBD (cannabidiol) are the two most well-known cannabinoids in cannabis. THC is primarily responsible for the psychoactive effects or "high," while CBD is non-intoxicating and associated with various potential therapeutic benefits. The ratio of THC to CBD in a strain can significantly influence its effects. High-THC strains tend to be more intoxicating, while high-CBD strains are often used for their potential therapeutic properties without strong psychoactive effects.`,
        educationalLinks: ['https://www.ncbi.nlm.nih.gov/pmc/articles/PMC5345356/'],
        disclaimers: [
          'This information is for educational purposes only and not medical advice.',
          'Consult with a healthcare professional before using cannabis, especially for medical conditions.'
        ]
      };
    } else {
      return {
        response: `Thank you for your question about cannabis. I'm here to provide educational information and guidance based on scientific research. If you have specific questions about strains, effects, consumption methods, or safety considerations, feel free to ask. Remember that individual experiences with cannabis can vary significantly based on factors like body chemistry, tolerance, and the specific product used.`,
        disclaimers: [
          'This information is for educational purposes only and not medical advice.',
          'Consult with a healthcare professional before using cannabis, especially for medical conditions.'
        ]
      };
    }
  }

  /**
   * Submit user feedback for a chat response
   */
  public async submitChatFeedback(
    userId: string,
    responseId: string,
    helpful: boolean,
    accurate: boolean,
    relevance: number,
    comments?: string
  ): Promise<string> {
    this.checkInitialized();
    
    try {
      Logger.info(MODULE_NAME, `Submitting chat feedback for response: ${responseId}`);
      
      const feedback: UserFeedback = {
        userId,
        responseId,
        responseType: 'chat',
        helpful,
        accurate,
        relevance,
        comments,
        timestamp: Date.now()
      };
      
      // Submit the feedback using the feedback service
      const feedbackId = await this.feedbackService.submitFeedback(feedback);
      
      Logger.info(MODULE_NAME, `Chat feedback submitted: ${feedbackId}`);
      return feedbackId;
    } catch (error) {
      Logger.logError(MODULE_NAME, error as Error, `Failed to submit chat feedback for response: ${responseId}`);
      
      if (error instanceof AIServiceError) {
        throw error;
      }
      
      throw new AIServiceError(
        'Failed to submit chat feedback',
        AIServiceErrorType.UNKNOWN,
        undefined,
        true,
        'An error occurred while submitting your feedback. Please try again later.'
      );
    }
  }

  /**
   * Analyze journal entries for patterns and insights
   */
  public async analyzeJournalEntries(
    userId: string,
    journalEntries: JournalEntry[]
  ): Promise<JournalAnalysisResult> {
    this.checkInitialized();
    
    try {
      Logger.info(MODULE_NAME, `Analyzing journal entries for user: ${userId}`);
      
      // If no entries, return empty analysis
      if (!journalEntries || journalEntries.length === 0) {
        Logger.info(MODULE_NAME, 'No journal entries to analyze');
        return {
          patterns: [],
          insights: [],
          recommendations: []
        };
      }
      
      // Check cache first
      const cacheKey = this.cacheManager.generateKey({
        userId,
        journalEntries: journalEntries.map(entry => ({
          id: entry.id,
          created_at: entry.created_at
        }))
      });
      
      const cachedAnalysis = await this.cacheManager.get<JournalAnalysisResult>(cacheKey);
      
      if (cachedAnalysis) {
        Logger.info(MODULE_NAME, 'Returning cached journal analysis');
        return cachedAnalysis;
      }
      
      // If using mock responses, return a mock analysis
      if (this.useMockResponses) {
        const mockAnalysis = this.getMockJournalAnalysis(journalEntries);
        
        // Cache the analysis
        await this.cacheManager.set(cacheKey, mockAnalysis);
        
        Logger.info(MODULE_NAME, 'Returning mock journal analysis');
        return mockAnalysis;
      }
      
      // Format the prompt for the AI
      const prompt = this.formatJournalAnalysisPrompt(journalEntries);
      
      // Call the API
      const response = await this.api.sendMessage([
        { role: 'user', content: prompt }
      ], 2000, 0.7);
      
      // Parse the response
      const analysis = this.parseJournalAnalysisResponse(response);
      
      // Cache the analysis
      await this.cacheManager.set(cacheKey, analysis);
      
      Logger.info(MODULE_NAME, 'Journal analysis completed successfully');
      return analysis;
    } catch (error) {
      Logger.logError(MODULE_NAME, error as Error, `Failed to analyze journal entries for user: ${userId}`);
      
      if (error instanceof AIServiceError) {
        throw error;
      }
      
      throw new AIServiceError(
        'Failed to analyze journal entries',
        AIServiceErrorType.UNKNOWN,
        undefined,
        true,
        'An error occurred while analyzing your journal entries. Please try again later.'
      );
    }
  }

  /**
   * Format a journal analysis prompt for the AI
   */
  private formatJournalAnalysisPrompt(journalEntries: JournalEntry[]): string {
    return `
      You are an AI assistant for a cannabis app called Canova.
      Please analyze the following journal entries to identify patterns, insights, and potential recommendations:
      
      Journal Entries:
      ${JSON.stringify(journalEntries, null, 2)}
      
      For each entry, consider:
      - Strain used
      - Dosage
      - Consumption method
      - Effects experienced
      - Time of day
      - User's mood before and after
      - Any side effects
      
      Please provide:
      1. Patterns you've identified across entries
      2. Insights about what works well and what doesn't for this user
      3. Recommendations for strains, dosages, or consumption methods based on the data
      4. Any safety flags or concerns that should be addressed
      
      Format your response as a JSON object with the following structure:
      {
        "patterns": ["pattern1", "pattern2", ...],
        "insights": ["insight1", "insight2", ...],
        "recommendations": ["recommendation1", "recommendation2", ...],
        "safetyFlags": ["flag1", "flag2", ...] // Optional, include only if relevant
      }
    `;
  }

  /**
   * Parse the AI response into a structured journal analysis
   */
  private parseJournalAnalysisResponse(response: string): JournalAnalysisResult {
    try {
      // Try to parse the response as JSON
      const parsedResponse = JSON.parse(response) as JournalAnalysisResult;
      
      // Validate the response structure
      if (!parsedResponse.patterns || !parsedResponse.insights || !parsedResponse.recommendations) {
        throw new Error('Invalid response structure: required fields missing');
      }
      
      return parsedResponse;
    } catch (error) {
      Logger.logError(MODULE_NAME, error as Error, 'Failed to parse journal analysis response');
      
      // Return a simple error response
      return {
        patterns: ['Could not identify patterns due to parsing error'],
        insights: ['Could not generate insights due to parsing error'],
        recommendations: ['Please try again later or contact support']
      };
    }
  }

  /**
   * Generate mock journal analysis for testing
   */
  private getMockJournalAnalysis(journalEntries: JournalEntry[]): JournalAnalysisResult {
    // Simple mock analysis based on the number of entries
    if (journalEntries.length >= 5) {
      return {
        patterns: [
          'Higher satisfaction with indica strains in the evening',
          'Edibles tend to cause more anxiety than vaping',
          'Morning use of low-THC strains improves focus without impairment'
        ],
        insights: [
          'You respond well to balanced THC:CBD ratios for pain management',
          'Strains high in limonene terpenes seem to elevate your mood consistently',
          'Consumption 2-3 hours before bedtime improves sleep quality'
        ],
        recommendations: [
          'Try Granddaddy Purple for evening relaxation',
          'Consider microdosing with a 1:1 THC:CBD tincture for daytime pain relief',
          'Experiment with lower temperatures when vaping to reduce throat irritation'
        ]
      };
    } else {
      return {
        patterns: [
          'Not enough entries to identify reliable patterns yet',
          'Initial preference for hybrid strains noted'
        ],
        insights: [
          'More journal entries needed for meaningful insights',
          'Consider recording more details about effects and context'
        ],
        recommendations: [
          'Continue journaling consistently to build more data',
          'Try varying your consumption methods to compare effects',
          'Record your experience with different terpene profiles'
        ]
      };
    }
  }

  /**
   * Validate the safety of a recommendation request
   */
  public async validateRecommendationSafety(
    request: RecommendationRequest
  ): Promise<SafetyValidationResult> {
    this.checkInitialized();
    
    try {
      Logger.info(MODULE_NAME, 'Validating recommendation request safety');
      
      // Check for basic safety issues
      const basicSafetyCheck = this.performBasicSafetyCheck(request);
      if (!basicSafetyCheck.valid) {
        Logger.info(MODULE_NAME, `Safety validation failed: ${basicSafetyCheck.reason}`);
        return basicSafetyCheck;
      }
      
      // Check for potential drug interactions
      const interactionResult = await this.checkDrugInteractions(request);
      if (interactionResult.hasInteractions && interactionResult.severity === 'severe') {
        Logger.info(MODULE_NAME, 'Safety validation failed: Severe drug interactions detected');
        return {
          valid: false,
          reason: 'Potential severe drug interactions detected',
          safetyFlags: interactionResult.details,
          warningLevel: 'critical'
        };
      }
      
      // Check for potential overuse
      const overuseResult = await this.detectOveruse(request.userProfile.id);
      if (overuseResult.detected && overuseResult.level === 'severe') {
        Logger.info(MODULE_NAME, 'Safety validation failed: Severe overuse pattern detected');
        return {
          valid: false,
          reason: 'Potential overuse pattern detected',
          safetyFlags: [overuseResult.details || 'Frequent high-dose usage pattern detected'],
          warningLevel: 'critical'
        };
      }
      
      // If there are moderate concerns, return valid but with warnings
      if (
        (interactionResult.hasInteractions && interactionResult.severity === 'moderate') ||
        (overuseResult.detected && overuseResult.level === 'moderate')
      ) {
        const safetyFlags = [
          ...(interactionResult.hasInteractions ? interactionResult.details || [] : []),
          ...(overuseResult.detected && overuseResult.details ? [overuseResult.details] : [])
        ];
        
        Logger.info(MODULE_NAME, 'Safety validation passed with warnings');
        return {
          valid: true,
          safetyFlags,
          warningLevel: 'warning'
        };
      }
      
      // If there are mild concerns, return valid but with info
      if (
        (interactionResult.hasInteractions && interactionResult.severity === 'mild') ||
        (overuseResult.detected && overuseResult.level === 'mild')
      ) {
        const safetyFlags = [
          ...(interactionResult.hasInteractions ? interactionResult.details || [] : []),
          ...(overuseResult.detected && overuseResult.details ? [overuseResult.details] : [])
        ];
        
        Logger.info(MODULE_NAME, 'Safety validation passed with information');
        return {
          valid: true,
          safetyFlags,
          warningLevel: 'info'
        };
      }
      
      // All checks passed
      Logger.info(MODULE_NAME, 'Safety validation passed');
      return {
        valid: true
      };
    } catch (error) {
      Logger.logError(MODULE_NAME, error as Error, 'Failed to validate recommendation safety');
      
      // Return a conservative result in case of error
      return {
        valid: true,
        reason: 'Safety validation could not be completed',
        safetyFlags: ['Safety validation encountered an error, proceed with caution'],
        warningLevel: 'warning'
      };
    }
  }

  /**
   * Perform basic safety checks on a recommendation request
   */
  private performBasicSafetyCheck(request: RecommendationRequest): SafetyValidationResult {
    // Check for underage users based on experience level
    if (request.userProfile.experience_level === 'beginner') {
      // For beginners, we'll add extra caution
      return {
        valid: true,
        safetyFlags: ['User is a beginner, recommend starting with low doses'],
        warningLevel: 'info'
      };
    }
    
    // Check for pregnancy or other medical conditions
    if (request.userProfile.medical_needs && 
        request.userProfile.medical_needs.some((condition: string) => 
          condition.toLowerCase().includes('pregnant') || 
          condition.toLowerCase().includes('pregnancy')
        )) {
      return {
        valid: false,
        reason: 'Cannabis use is not recommended during pregnancy',
        warningLevel: 'critical'
      };
    }
    
    // Check for severe mental health conditions
    const severeConditions = ['schizophrenia', 'psychosis', 'severe depression', 'bipolar disorder'];
    if (request.userProfile.medical_needs && 
        request.userProfile.medical_needs.some((condition: string) => 
          severeConditions.some(severe => condition.toLowerCase().includes(severe))
        )) {
      return {
        valid: false,
        reason: 'Cannabis use may exacerbate certain mental health conditions',
        warningLevel: 'critical'
      };
    }
    
    // All basic checks passed
    return {
      valid: true
    };
  }

  /**
   * Check for potential drug interactions
   */
  private async checkDrugInteractions(request: RecommendationRequest): Promise<DrugInteractionResult> {
    // In a real implementation, this would check against a database of known drug interactions
    // For now, we'll just check for some common medications that have known interactions
    
    const highRiskMedications = [
      'warfarin', 'clopidogrel', 'amiodarone', 'tacrolimus', 'cyclosporine',
      'sedative', 'benzodiazepine', 'opioid', 'alcohol'
    ];
    
    const moderateRiskMedications = [
      'antidepressant', 'ssri', 'antipsychotic', 'stimulant', 'adhd medication',
      'blood pressure', 'hypertension', 'beta blocker'
    ];
    
    if (!request.userProfile.medications || request.userProfile.medications.length === 0) {
      return {
        hasInteractions: false
      };
    }
    
    const highRiskFound = request.userProfile.medications.some((med: string) => 
      highRiskMedications.some(risk => med.toLowerCase().includes(risk))
    );
    
    if (highRiskFound) {
      return {
        hasInteractions: true,
        severity: 'severe',
        details: [
          'Potential severe interaction with one or more medications',
          'Cannabis may increase or decrease the effects of certain medications',
          'Consult with a healthcare provider before using cannabis'
        ],
        recommendations: [
          'Consult with a healthcare provider before using cannabis',
          'Consider alternative treatments',
          'If approved by a healthcare provider, start with very low doses and monitor closely'
        ]
      };
    }
    
    const moderateRiskFound = request.userProfile.medications.some((med: string) => 
      moderateRiskMedications.some(risk => med.toLowerCase().includes(risk))
    );
    
    if (moderateRiskFound) {
      return {
        hasInteractions: true,
        severity: 'moderate',
        details: [
          'Potential moderate interaction with one or more medications',
          'Cannabis may affect how your medications work'
        ],
        recommendations: [
          'Consult with a healthcare provider before using cannabis',
          'Start with low doses and monitor for any adverse effects',
          'Keep a journal of effects to share with your healthcare provider'
        ]
      };
    }
    
    // No known interactions found
    return {
      hasInteractions: false
    };
  }

  /**
   * Detect potential overuse patterns
   */
  private async detectOveruse(userId: string): Promise<OveruseDetectionResult> {
    // In a real implementation, this would analyze usage patterns from the user's history
    // For now, we'll just return a mock result
    
    // Simulate a 10% chance of detecting mild overuse
    const randomValue = Math.random();
    
    if (randomValue < 0.01) {
      // 1% chance of severe overuse
      return {
        detected: true,
        level: 'severe',
        details: 'Frequent high-dose usage pattern detected',
        recommendedAction: 'Consider taking a tolerance break and consulting with a healthcare provider',
        coolingOffPeriod: 14 // 14 days
      };
    } else if (randomValue < 0.05) {
      // 4% chance of moderate overuse
      return {
        detected: true,
        level: 'moderate',
        details: 'Increasing frequency of use detected',
        recommendedAction: 'Consider moderating use and monitoring effects more closely',
        coolingOffPeriod: 7 // 7 days
      };
    } else if (randomValue < 0.10) {
      // 5% chance of mild overuse
      return {
        detected: true,
        level: 'mild',
        details: 'Slight increase in usage frequency noted',
        recommendedAction: 'Be mindful of consumption patterns and consider occasional breaks',
        coolingOffPeriod: 2 // 2 days
      };
    }
    
    // No overuse detected
    return {
      detected: false
    };
  }
} 