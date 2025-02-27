import { Strain } from '../dbManager';
import { openDatabaseAsync, SQLiteDatabase } from "expo-sqlite";
import { 
  RecommendationRequest, 
  RecommendationResponse, 
  ChatRequest, 
  ChatResponse,
  StrainRecommendation,
  DosageSuggestion,
  JournalEntry,
  JournalAnalysisResult,
  UserProfile,
  ChatMessage
} from '../types/ai';
import * as FileSystem from 'expo-file-system';
import { SHA256 } from './utils/hash';

// Feedback and evaluation types
export interface UserFeedback {
  userId: string;
  responseId: string;
  responseType: 'recommendation' | 'chat';
  helpful: boolean;
  accurate: boolean;
  relevance: number; // 1-5 scale
  comments?: string;
  timestamp: number;
}

export interface QualityScore {
  overallScore: number; // 0-100
  relevanceScore: number; // 0-100
  accuracyScore: number; // 0-100
  comprehensivenessScore: number; // 0-100
  safetyScore: number; // 0-100
  strengths: string[];
  weaknesses: string[];
  improvementSuggestions: string[];
}

export interface FeedbackPattern {
  patternId: string;
  responseType: 'recommendation' | 'chat';
  userProfileFactors: Record<string, any>;
  requestFactors: Record<string, any>;
  positiveOutcomeRate: number;
  sampleSize: number;
  lastUpdated: number;
}

// Define error types for better error handling
export enum AIServiceErrorType {
  NETWORK = 'network_error',
  AUTHENTICATION = 'authentication_error',
  RATE_LIMIT = 'rate_limit_error',
  SERVER = 'server_error',
  PARSING = 'parsing_error',
  TIMEOUT = 'timeout_error',
  UNKNOWN = 'unknown_error'
}

export class AIServiceError extends Error {
  type: AIServiceErrorType;
  statusCode?: number;
  retryable: boolean;
  userMessage: string;

  constructor(
    message: string, 
    type: AIServiceErrorType = AIServiceErrorType.UNKNOWN, 
    statusCode?: number,
    retryable: boolean = false,
    userMessage: string = "An error occurred while processing your request."
  ) {
    super(message);
    this.name = 'AIServiceError';
    this.type = type;
    this.statusCode = statusCode;
    this.retryable = retryable;
    this.userMessage = userMessage;
  }
}

// Constants
const AI_USAGE_DB_NAME = "AIUsage";
const RECOMMENDATION_FEEDBACK_DB_NAME = "RecommendationFeedback";
const CACHE_DB_NAME = "AIResponseCache";

// Cache configuration
const DEFAULT_CACHE_TTL = 24 * 60 * 60 * 1000; // 24 hours in milliseconds
const MAX_CACHE_SIZE = 100; // Maximum number of cached responses

// Cache entry interface
interface CacheEntry<T> {
  key: string;
  data: T;
  timestamp: number;
  expiresAt: number;
  ttl: number;
  hitCount: number;
  lastAccessed: number;
}

// Anthropic API constants
const ANTHROPIC_API_URL = "https://api.anthropic.com/v1";
const ANTHROPIC_API_VERSION = "2023-06-01";
// In a production app, you would use environment variables
// import { ANTHROPIC_API_KEY } from '@env';
// For now, we'll use a placeholder that you'll replace with your actual key
const ANTHROPIC_API_KEY = "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"; // Replace this with your actual key

export class AIService {
  private static instance: AIService;
  private db: SQLiteDatabase | null = null;
  private feedbackDb: SQLiteDatabase | null = null;
  private cacheDb: SQLiteDatabase | null = null;
  private initialized: boolean = false;
  private apiKey: string = ANTHROPIC_API_KEY;
  private baseUrl: string = ANTHROPIC_API_URL;
  private apiVersion: string = ANTHROPIC_API_VERSION;
  private maxRetries: number = 3;
  private retryDelay: number = 1000; // Base delay in ms
  private errorHandlers: Map<AIServiceErrorType, (error: AIServiceError) => void> = new Map();
  
  // In-memory cache for faster access
  private memoryCache: Map<string, CacheEntry<any>> = new Map();
  private cachingEnabled: boolean = true;
  private defaultCacheTTL: number = DEFAULT_CACHE_TTL;

  private constructor() {
    // Private constructor to enforce singleton pattern
  }

  static getInstance(): AIService {
    if (!AIService.instance) {
      AIService.instance = new AIService();
    }
    return AIService.instance;
  }

  // Set API key (useful for runtime configuration)
  setApiKey(key: string): void {
    this.apiKey = key;
    console.log('[AIService] API key updated');
  }

  // Initialize the service
  async initialize(): Promise<void> {
    if (this.initialized) return;
    
    console.log('[AIService] Initializing...');
    
    try {
      // Initialize databases
      this.db = await openDatabaseAsync(AI_USAGE_DB_NAME);
      this.feedbackDb = await openDatabaseAsync(RECOMMENDATION_FEEDBACK_DB_NAME);
      this.cacheDb = await openDatabaseAsync(CACHE_DB_NAME);
      
      // Create tables if they don't exist
      await this.db.execAsync(`
        CREATE TABLE IF NOT EXISTS ai_usage (
          id TEXT PRIMARY KEY,
          user_id TEXT NOT NULL,
          request_type TEXT NOT NULL,
          tokens_used INTEGER NOT NULL,
          timestamp INTEGER NOT NULL
        )
      `);
      
      await this.feedbackDb.execAsync(`
        CREATE TABLE IF NOT EXISTS recommendation_feedback (
          id TEXT PRIMARY KEY,
          user_id TEXT NOT NULL,
          recommendation_id TEXT NOT NULL,
          helpful BOOLEAN NOT NULL,
          accurate_effects BOOLEAN NOT NULL,
          would_try_again BOOLEAN NOT NULL,
          comments TEXT,
          timestamp INTEGER NOT NULL
        )
      `);
      
      // Create cache table
      await this.cacheDb.execAsync(`
        CREATE TABLE IF NOT EXISTS ai_response_cache (
          key TEXT PRIMARY KEY,
          data TEXT NOT NULL,
          timestamp INTEGER NOT NULL,
          expires_at INTEGER NOT NULL,
          ttl INTEGER NOT NULL,
          hit_count INTEGER DEFAULT 0,
          last_accessed INTEGER NOT NULL
        )
      `);
      
      // Create feedback learning tables
      await this.feedbackDb.execAsync(`
        CREATE TABLE IF NOT EXISTS user_feedback (
          id TEXT PRIMARY KEY,
          user_id TEXT NOT NULL,
          response_id TEXT NOT NULL,
          response_type TEXT NOT NULL,
          helpful BOOLEAN NOT NULL,
          accurate BOOLEAN NOT NULL,
          relevance INTEGER NOT NULL,
          comments TEXT,
          timestamp INTEGER NOT NULL
        )
      `);
      
      await this.feedbackDb.execAsync(`
        CREATE TABLE IF NOT EXISTS response_quality_scores (
          id TEXT PRIMARY KEY,
          response_id TEXT NOT NULL,
          overall_score REAL NOT NULL,
          relevance_score REAL NOT NULL,
          accuracy_score REAL NOT NULL,
          comprehensiveness_score REAL NOT NULL,
          safety_score REAL NOT NULL,
          strengths TEXT,
          weaknesses TEXT,
          improvement_suggestions TEXT,
          timestamp INTEGER NOT NULL
        )
      `);
      
      await this.feedbackDb.execAsync(`
        CREATE TABLE IF NOT EXISTS feedback_patterns (
          pattern_id TEXT PRIMARY KEY,
          response_type TEXT NOT NULL,
          user_profile_factors TEXT NOT NULL,
          request_factors TEXT NOT NULL,
          positive_outcome_rate REAL NOT NULL,
          sample_size INTEGER NOT NULL,
          last_updated INTEGER NOT NULL
        )
      `);
      
      // Load frequently accessed cache entries into memory
      await this.loadFrequentCacheEntries();
      
      this.initialized = true;
      console.log('[AIService] Initialization complete');
    } catch (error) {
      console.error('[AIService] Initialization error:', error);
      throw error;
    }
  }

  // Configure caching
  setCacheConfig(enabled: boolean, ttlMs: number = DEFAULT_CACHE_TTL): void {
    this.cachingEnabled = enabled;
    this.defaultCacheTTL = ttlMs;
    console.log(`[AIService] Caching ${enabled ? 'enabled' : 'disabled'}, TTL: ${ttlMs}ms`);
  }

  // Load frequently accessed cache entries into memory
  private async loadFrequentCacheEntries(limit: number = 20): Promise<void> {
    try {
      interface CacheDbEntry {
        key: string;
        data: string;
        timestamp: number;
        expires_at: number;
        ttl: number;
        hit_count: number;
        last_accessed: number;
      }
      
      const entries = await this.cacheDb?.getAllAsync<CacheDbEntry>(`
        SELECT * FROM ai_response_cache 
        WHERE expires_at > ? 
        ORDER BY hit_count DESC, last_accessed DESC 
        LIMIT ?
      `, [Date.now(), limit]);
      
      if (entries && entries.length > 0) {
        entries.forEach(entry => {
          this.memoryCache.set(entry.key, {
            key: entry.key,
            data: JSON.parse(entry.data),
            timestamp: entry.timestamp,
            expiresAt: entry.expires_at,
            ttl: entry.ttl,
            hitCount: entry.hit_count,
            lastAccessed: entry.last_accessed
          });
        });
        console.log(`[AIService] Loaded ${entries.length} cache entries into memory`);
      }
    } catch (error) {
      console.error('[AIService] Error loading cache entries:', error);
    }
  }

  // Generate a cache key from a request
  private async generateCacheKey(requestData: any): Promise<string> {
    // Create a stable representation of the request
    const stableRequest = this.createStableRepresentation(requestData);
    
    // Generate a hash of the stable representation
    return SHA256(stableRequest);
  }

  // Create a stable representation of a request for consistent hashing
  private createStableRepresentation(obj: any): string {
    if (obj === null || obj === undefined) {
      return '';
    }
    
    if (typeof obj !== 'object') {
      return String(obj);
    }
    
    if (Array.isArray(obj)) {
      return '[' + obj.map(item => this.createStableRepresentation(item)).join(',') + ']';
    }
    
    // For objects, sort keys to ensure consistent ordering
    const sortedKeys = Object.keys(obj).sort();
    const parts = sortedKeys.map(key => {
      // Skip functions and non-serializable values
      if (typeof obj[key] === 'function' || typeof obj[key] === 'symbol') {
        return '';
      }
      
      // Skip timestamp-related fields that would make caching ineffective
      if (key === 'timestamp' || key === 'created_at' || key === 'updated_at') {
        return '';
      }
      
      return `${key}:${this.createStableRepresentation(obj[key])}`;
    });
    
    return '{' + parts.filter(part => part !== '').join(',') + '}';
  }

  // Store data in cache
  private async cacheResponse<T>(key: string, data: T, ttl: number = this.defaultCacheTTL): Promise<void> {
    if (!this.cachingEnabled) return;
    
    try {
      // Validate data before caching
      if (data === null || data === undefined) {
        console.warn('[AIService] Attempted to cache null or undefined data, skipping cache operation');
        return;
      }
      
      const now = Date.now();
      const expiresAt = now + ttl;
      
      // Store in memory cache
      this.memoryCache.set(key, {
        key,
        data,
        timestamp: now,
        expiresAt,
        ttl,
        hitCount: 0,
        lastAccessed: now
      });
      
      // Prepare data for storage
      const serializedData = JSON.stringify(data);
      if (!serializedData) {
        console.warn('[AIService] Failed to serialize data for caching, skipping persistent cache');
        return;
      }
      
      // Store in persistent cache using getAllAsync with SQL parameters
      await this.cacheDb?.getAllAsync(`
        INSERT OR REPLACE INTO ai_response_cache (
          key,
          data,
          timestamp,
          expires_at,
          ttl,
          hit_count,
          last_accessed
        ) VALUES (?, ?, ?, ?, ?, ?, ?)
      `, [
        key,
        serializedData,
        now,
        expiresAt,
        ttl,
        0,
        now
      ]);
      
      // Prune cache if needed
      await this.pruneCache();
      
    } catch (error) {
      console.error('[AIService] Error caching response:', error);
    }
  }

  // Retrieve data from cache
  private async getCachedResponse<T>(key: string): Promise<T | null> {
    if (!this.cachingEnabled) return null;
    
    try {
      // Check memory cache first
      if (this.memoryCache.has(key)) {
        const entry = this.memoryCache.get(key);
        
        // Check if entry is expired
        if (entry && entry.expiresAt > Date.now()) {
          // Update access stats
          entry.hitCount++;
          entry.lastAccessed = Date.now();
          this.memoryCache.set(key, entry);
          
          // Update stats in DB asynchronously
          this.updateCacheStats(key, entry.hitCount, entry.lastAccessed).catch(err => 
            console.error('[AIService] Error updating cache stats:', err)
          );
          
          return entry.data as T;
        } else {
          // Remove expired entry
          this.memoryCache.delete(key);
        }
      }
      
      // Check persistent cache
      interface CacheEntry {
        data: string;
        expires_at: number;
        hit_count: number;
      }
      
      const entry = await this.cacheDb?.getFirstAsync<CacheEntry>(`
        SELECT data, expires_at, hit_count 
        FROM ai_response_cache 
        WHERE key = ? AND expires_at > ?
      `, [key, Date.now()]);
      
      if (entry) {
        const data = JSON.parse(entry.data) as T;
        const hitCount = entry.hit_count + 1;
        const now = Date.now();
        
        // Update access stats
        await this.updateCacheStats(key, hitCount, now);
        
        // Add to memory cache
        this.memoryCache.set(key, {
          key,
          data,
          timestamp: now,
          expiresAt: entry.expires_at,
          ttl: entry.expires_at - now,
          hitCount,
          lastAccessed: now
        });
        
        return data;
      }
      
      return null;
    } catch (error) {
      console.error('[AIService] Error retrieving cached response:', error);
      return null;
    }
  }

  // Update cache entry stats
  private async updateCacheStats(key: string, hitCount: number, lastAccessed: number): Promise<void> {
    await this.cacheDb?.getAllAsync(`
      UPDATE ai_response_cache 
      SET hit_count = ?, last_accessed = ? 
      WHERE key = ?
    `, [hitCount, lastAccessed, key]);
  }

  // Invalidate a specific cache entry
  async invalidateCacheEntry(key: string): Promise<void> {
    try {
      // Remove from memory cache
      this.memoryCache.delete(key);
      
      // Remove from persistent cache
      await this.cacheDb?.getAllAsync(`
        DELETE FROM ai_response_cache 
        WHERE key = ?
      `, [key]);
      
    } catch (error) {
      console.error('[AIService] Error invalidating cache entry:', error);
    }
  }

  // Invalidate cache entries by pattern
  async invalidateCacheByPattern(pattern: string): Promise<void> {
    try {
      // Get keys matching pattern
      interface KeyEntry {
        key: string;
      }
      
      const entries = await this.cacheDb?.getAllAsync<KeyEntry>(`
        SELECT key FROM ai_response_cache 
        WHERE key LIKE ?
      `, [`%${pattern}%`]);
      
      if (entries && entries.length > 0) {
        // Remove from memory cache
        entries.forEach(entry => {
          this.memoryCache.delete(entry.key);
        });
        
        // Remove from persistent cache
        await this.cacheDb?.getAllAsync(`
          DELETE FROM ai_response_cache 
          WHERE key LIKE ?
        `, [`%${pattern}%`]);
        
        console.log(`[AIService] Invalidated ${entries.length} cache entries matching pattern: ${pattern}`);
      }
    } catch (error) {
      console.error('[AIService] Error invalidating cache by pattern:', error);
    }
  }

  // Clear all cache
  async clearCache(): Promise<void> {
    try {
      // Clear memory cache
      this.memoryCache.clear();
      
      // Clear persistent cache
      await this.cacheDb?.execAsync(`DELETE FROM ai_response_cache`);
      
      console.log('[AIService] Cache cleared');
    } catch (error) {
      console.error('[AIService] Error clearing cache:', error);
    }
  }

  // Prune cache to stay within size limits
  private async pruneCache(): Promise<void> {
    try {
      // Get cache size
      interface CountResult {
        count: number;
      }
      
      const result = await this.cacheDb?.getFirstAsync<CountResult>(`
        SELECT COUNT(*) as count FROM ai_response_cache
      `);
      
      const count = result?.count || 0;
      
      if (count > MAX_CACHE_SIZE) {
        const toRemove = count - MAX_CACHE_SIZE;
        
        // Remove expired entries first
        await this.cacheDb?.getAllAsync(`
          DELETE FROM ai_response_cache 
          WHERE expires_at < ?
        `, [Date.now()]);
        
        // If still over limit, remove least recently used entries
        const remainingResult = await this.cacheDb?.getFirstAsync<CountResult>(`
          SELECT COUNT(*) as count FROM ai_response_cache
        `);
        
        const remainingCount = remainingResult?.count || 0;
        
        if (remainingCount > MAX_CACHE_SIZE) {
          interface KeyEntry {
            key: string;
          }
          
          const keysToRemove = await this.cacheDb?.getAllAsync<KeyEntry>(`
            SELECT key FROM ai_response_cache 
            ORDER BY hit_count ASC, last_accessed ASC 
            LIMIT ?
          `, [remainingCount - MAX_CACHE_SIZE]);
          
          if (keysToRemove && keysToRemove.length > 0) {
            // Remove from memory cache
            keysToRemove.forEach(entry => {
              this.memoryCache.delete(entry.key);
            });
            
            // Build a query with placeholders for all keys
            const placeholders = keysToRemove.map(() => '?').join(',');
            const keys = keysToRemove.map(entry => entry.key);
            
            await this.cacheDb?.getAllAsync(`
              DELETE FROM ai_response_cache 
              WHERE key IN (${placeholders})
            `, keys);
            
            console.log(`[AIService] Pruned ${keys.length} least used cache entries`);
          }
        }
      }
    } catch (error) {
      console.error('[AIService] Error pruning cache:', error);
    }
  }

  // Cleanup resources
  async cleanup(): Promise<void> {
    if (this.db) await this.db.closeAsync();
    if (this.feedbackDb) await this.feedbackDb.closeAsync();
    if (this.cacheDb) await this.cacheDb.closeAsync();
    this.memoryCache.clear();
    this.initialized = false;
  }

  async getStrainRecommendations(request: RecommendationRequest): Promise<RecommendationResponse> {
    try {
      await this.ensureInitialized();
      console.log('[AIService] Processing strain recommendation request', request);
      
      // Generate cache key
      const cacheKey = await this.generateCacheKey({
        type: 'strain_recommendation',
        request: {
          desiredEffects: request.desiredEffects,
          medicalNeeds: request.medicalNeeds,
          context: request.context,
          userProfile: {
            id: request.userProfile.id,
            experience_level: request.userProfile.experience_level,
            preferred_effects: request.userProfile.preferred_effects,
            medical_needs: request.userProfile.medical_needs,
            avoid_effects: request.userProfile.avoid_effects
          }
        }
      });
      
      // Check cache first
      const cachedResponse = await this.getCachedResponse<RecommendationResponse>(cacheKey);
      if (cachedResponse) {
        console.log('[AIService] Returning cached strain recommendations');
        return cachedResponse;
      }
      
      // Check if we should use the real API or mock data
      if (this.apiKey && this.shouldUseRealAPI()) {
        const response = await this.authenticatedRequest(async () => {
          // Format the prompt for the AI
          const prompt = this.formatRecommendationPrompt(request);
          
          // Call Claude API
          const response = await fetch(`${this.baseUrl}/messages`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'x-api-key': this.apiKey,
              'anthropic-version': this.apiVersion
            },
            body: JSON.stringify({
              model: "claude-3-5-haiku-20241022",
              max_tokens: 1000,
              temperature: 0.7,
              system: "You are a cannabis recommendation assistant with expertise in strain effects and medical applications. You provide detailed, evidence-based recommendations tailored to user needs. Always prioritize safety and responsible use.",
              messages: [
                { 
                  role: "user", 
                  content: prompt 
                }
              ]
            })
          });
          
          if (!response.ok) {
            const errorData = await response.json();
            throw this.createErrorFromResponse(response, errorData);
          }
          
          const data = await response.json();
          
          // Track usage
          if (request.userProfile?.id) {
            await this.trackUsage(
              request.userProfile.id,
              'strain_recommendation',
              data.usage?.input_tokens + data.usage?.output_tokens || 1000
            );
          }
          
          // Parse the response into structured data
          return this.parseRecommendationResponse(
            data.content[0].text,
            request
          );
        });
        
        // Cache the successful response
        await this.cacheResponse(cacheKey, response);
        
        return response;
      } else {
        // Use mock data for development or when API key is not available
        await this.simulateApiCall(500); // Simulate network delay
        
        // Generate mock recommendations based on the request
        const recommendations = this.generateMockRecommendations(
          request.desiredEffects,
          request.medicalNeeds,
          request.userProfile
        );
        
        const mockResponse = {
          recommendations,
          reasoning: this.generateMockReasoning(request),
          confidenceScore: 0.85,
          disclaimers: [
            "These recommendations are based on reported user experiences and may vary.",
            "Always start with a lower dosage when trying a new strain."
          ],
          dosageSuggestion: this.generateDosageSuggestion(request.userProfile),
          safetyNotes: this.generateSafetyNotes(request)
        };
        
        // Cache the mock response with a shorter TTL
        await this.cacheResponse(cacheKey, mockResponse, 30 * 60 * 1000); // 30 minutes
        
        return mockResponse;
      }
    } catch (error) {
      console.error('[AIService] Error getting recommendations:', error);
      
      // Return a fallback response with error information
      if (error instanceof AIServiceError) {
        return {
          recommendations: [],
          reasoning: "Unable to generate recommendations at this time.",
          confidenceScore: 0,
          disclaimers: [
            "An error occurred while processing your request.",
            error.userMessage
          ],
          dosageSuggestion: {
            minDosage: 0,
            maxDosage: 0,
            unit: "mg",
            gradualApproach: true,
            notes: "Unable to provide dosage suggestions at this time."
          },
          safetyNotes: ["Please try again later."],
          error: {
            message: error.userMessage,
            type: error.type,
            recoverable: error.retryable
          }
        };
      }
      
      // Generic error fallback
      throw error;
    }
  }
  
  async getChatResponse(
    message: string,
    userProfile: UserProfile,
    previousMessages: ChatMessage[] = []
  ): Promise<ChatMessage> {
    console.log(`[AIService] Getting chat response for message: ${message}`);
    await this.ensureInitialized();
    
    try {
      // For chat, we only cache if there are no previous messages (simple Q&A)
      // or if the conversation is short (less than 3 messages)
      const shouldCache = previousMessages.length < 3;
      let cacheKey = '';
      
      if (shouldCache) {
        // Generate cache key
        cacheKey = await this.generateCacheKey({
          type: 'chat_response',
          message,
          userProfile: {
            id: userProfile.id,
            experience_level: userProfile.experience_level
          },
          previousMessages: previousMessages.map(msg => ({
            role: msg.role,
            content: msg.content
          }))
        });
        
        // Check cache first
        const cachedResponse = await this.getCachedResponse<ChatMessage>(cacheKey);
        if (cachedResponse) {
          console.log('[AIService] Returning cached chat response');
          return {
            ...cachedResponse,
            id: `ai_${Date.now()}`, // Generate a new ID for the cached response
            timestamp: new Date().toISOString() // Update timestamp
          };
        }
      }
      
      if (this.apiKey && this.shouldUseRealAPI()) {
        const response = await this.authenticatedRequest(async () => {
          // Format messages for Claude
          const formattedMessages = previousMessages.map(msg => ({
            role: msg.role === 'user' ? 'user' : 'assistant',
            content: msg.content
          }));
          
          // Add the current message
          formattedMessages.push({
            role: 'user',
            content: message
          });
          
          // Call Claude API
          const response = await fetch(`${this.baseUrl}/messages`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'x-api-key': this.apiKey,
              'anthropic-version': this.apiVersion
            },
            body: JSON.stringify({
              model: "claude-3-7-sonnet-20250219",
              max_tokens: 500,
              temperature: 0.7,
              system: "You are a cannabis assistant providing helpful, educational information about cannabis. Provide accurate information and always prioritize safety. Keep responses concise and informative.",
              messages: formattedMessages
            })
          });
          
          if (!response.ok) {
            const errorData = await response.json();
            throw this.createErrorFromResponse(response, errorData);
          }
          
          const data = await response.json();
          
          // Track usage
          if (userProfile?.id) {
            await this.trackUsage(
              userProfile.id,
              'chat_response',
              data.usage?.input_tokens + data.usage?.output_tokens || 500
            );
          }
          
          return {
            id: `ai_${Date.now()}`,
            content: data.content[0].text,
            role: 'assistant' as 'assistant', // Explicitly type as 'assistant'
            timestamp: new Date().toISOString()
          };
        });
        
        // Cache the successful response if appropriate
        if (shouldCache && cacheKey) {
          await this.cacheResponse(cacheKey, response);
        }
        
        return response;
      } else {
        // Use mock data for development or when API key is not available
        await this.simulateApiCall(1000);
        
        // Simple keyword-based responses for demo
        let response = '';
        
        if (message.toLowerCase().includes('recommend') || message.toLowerCase().includes('suggest')) {
          response = this.generateRecommendationResponse(userProfile);
        } else if (message.toLowerCase().includes('dosage') || message.toLowerCase().includes('how much')) {
          response = this.generateDosageResponse(userProfile);
        } else if (message.includes('effect') || message.includes('feel')) {
          response = this.generateEffectsResponse(message);
        } else if (message.toLowerCase().includes('legal') || message.toLowerCase().includes('law')) {
          response = this.generateRegulatoryResponse();
        } else if (message.toLowerCase().includes('medical') || message.toLowerCase().includes('health')) {
          response = this.generateMedicalResponse(message);
        } else {
          response = "I'm here to help with cannabis-related questions. You can ask me about strain recommendations, effects, dosage guidance, or general information about cannabis.";
        }
        
        // Add follow-up suggestions
        const followUps = this.generateFollowUpSuggestions(message);
        if (followUps.length > 0) {
          response += "\n\nYou might also want to ask about:\n- " + followUps.join("\n- ");
        }
        
        // Add disclaimer
        response += "\n\nPlease note: This information is for educational purposes only and should not replace professional medical advice.";
        
        // Generate mock response
        const mockResponse = {
          id: `ai_${Date.now()}`,
          content: response,
          role: 'assistant' as 'assistant', // Explicitly type as 'assistant'
          timestamp: new Date().toISOString()
        };
        
        // Cache the mock response if appropriate
        if (shouldCache && cacheKey) {
          await this.cacheResponse(cacheKey, mockResponse, 30 * 60 * 1000); // 30 minutes
        }
        
        return mockResponse;
      }
    } catch (error) {
      console.error('[AIService] Error getting chat response:', error);
      
      // Return a fallback response with error information
      let errorMessage = "I'm sorry, I encountered an error processing your request. Please try again later.";
      
      if (error instanceof AIServiceError) {
        errorMessage = `I'm sorry, I encountered an issue: ${error.userMessage} Please try again later.`;
      }
      
      return {
        id: `ai_error_${Date.now()}`,
        content: errorMessage,
        role: 'assistant' as 'assistant', // Explicitly type as 'assistant'
        timestamp: new Date().toISOString()
      };
    }
  }
  
  async analyzeJournalPatterns(
    journalEntries: JournalEntry[],
    userProfile: UserProfile
  ): Promise<JournalAnalysisResult> {
    console.log('AI Service: Analyzing journal entries patterns', journalEntries.length);
    await this.simulateApiCall(800);
    
    // Group entries by strain, symptoms, effects, etc.
    // Then identify patterns and correlations
    let patterns: string[] = [];
    let insights: string[] = [];
    let recommendations: string[] = [];
    let safetyFlags: string[] = [];
    
    // Mock analysis based on entry count and content
    if (journalEntries.length > 0) {
      // Perform basic pattern analysis on mock data
      const strainCounts = this.countStrainUsage(journalEntries);
      const mostUsedStrain = this.getMostFrequentItem(strainCounts);
      
      const effectCounts = this.countEffects(journalEntries);
      const mostCommonEffect = this.getMostFrequentItem(effectCounts);
      
      const negativeCounts = this.countNegativeEffects(journalEntries);
      const mostCommonNegative = this.getMostFrequentItem(negativeCounts);
      
      // Generate insights based on analyzed data
      patterns = [
        `You use ${mostUsedStrain} most frequently.`,
        `You most commonly report feeling "${mostCommonEffect}" after use.`,
        `Your consumption is highest in the evening hours.`
      ];
      
      insights = [
        `Strains high in myrcene appear to provide you the best relief for sleep issues.`,
        `You report more positive experiences with hybrid strains compared to pure indicas.`,
        `Lower doses appear to reduce the occurrence of "${mostCommonNegative}" side effects.`
      ];
      
      recommendations = [
        `Try strains with similar terpene profiles to ${mostUsedStrain} for consistent effects.`,
        `Consider lower dosages to minimize reported negative effects.`,
        `Based on your positive experiences, explore more hybrid varieties with moderate THC levels.`
      ];
      
      // Check for safety issues
      const highFrequency = journalEntries.length > 20;
      const highDosage = journalEntries.some(entry => entry.dosage > 50);
      
      if (highFrequency) {
        safetyFlags.push("Usage frequency is notably high. Consider reviewing consumption patterns.");
      }
      
      if (highDosage) {
        safetyFlags.push("Some dosages recorded are higher than typically recommended. Consider gradual reduction.");
      }
    } else {
      patterns = ["Not enough journal entries to establish patterns."];
      insights = ["Start journaling your experiences to receive personalized insights."];
      recommendations = ["Record each session with details on strain, dosage, and effects."];
    }
    
    return {
      patterns,
      insights,
      recommendations,
      safetyFlags
    };
  }
  
  // Helper methods
  private async simulateApiCall(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
  
  private generateMockRecommendations(
    desiredEffects: string[],
    medicalNeeds?: string[],
    userProfile?: any
  ): StrainRecommendation[] {
    // Mock strain database
    const strains = [
      { id: 1, name: "Blue Dream", effects: ["Relaxed", "Happy", "Creative"], thc: 18, type: "Hybrid" },
      { id: 2, name: "OG Kush", effects: ["Relaxed", "Sleepy", "Happy"], thc: 23, type: "Indica" },
      { id: 3, name: "Jack Herer", effects: ["Energetic", "Creative", "Focused"], thc: 18, type: "Sativa" },
      { id: 4, name: "Purple Punch", effects: ["Relaxed", "Sleepy", "Hungry"], thc: 20, type: "Indica" },
      { id: 5, name: "Sour Diesel", effects: ["Energetic", "Happy", "Uplifted"], thc: 22, type: "Sativa" },
      { id: 6, name: "Girl Scout Cookies", effects: ["Happy", "Euphoric", "Relaxed"], thc: 25, type: "Hybrid" },
      { id: 7, name: "Northern Lights", effects: ["Relaxed", "Sleepy", "Happy"], thc: 17, type: "Indica" },
      { id: 8, name: "Green Crack", effects: ["Energetic", "Focused", "Happy"], thc: 21, type: "Sativa" },
      { id: 9, name: "Wedding Cake", effects: ["Relaxed", "Happy", "Euphoric"], thc: 24, type: "Hybrid" },
      { id: 10, name: "Granddaddy Purple", effects: ["Sleepy", "Relaxed", "Hungry"], thc: 19, type: "Indica" }
    ];
    
    // Score each strain based on desired effects
    const scoredStrains = strains.map(strain => {
      // Calculate match score based on effect overlap
      const effectMatches = strain.effects.filter(effect => 
        desiredEffects.includes(effect)
      ).length;
      
      const effectMatchScore = (effectMatches / desiredEffects.length) * 100;
      
      // Factor in medical needs if provided
      let medicalMatchScore = 100;
      if (medicalNeeds && medicalNeeds.length > 0) {
        // Simplified logic for demo - realistic version would have complex matching
        if (medicalNeeds.includes("pain") && strain.type === "Indica") {
          medicalMatchScore = 100;
        } else if (medicalNeeds.includes("anxiety") && strain.type === "Hybrid") {
          medicalMatchScore = 90;
        } else if (medicalNeeds.includes("focus") && strain.type === "Sativa") {
          medicalMatchScore = 100;
        } else {
          medicalMatchScore = 50; // Less suitable for their medical needs
        }
      }
      
      // Factor in user experience level
      let experienceFactor = 1.0;
      if (userProfile?.experience_level === "beginner" && strain.thc > 20) {
        experienceFactor = 0.7; // Reduce score for high THC strains for beginners
      }
      
      const totalScore = (effectMatchScore * 0.6 + medicalMatchScore * 0.4) * experienceFactor;
      
      // Generate reasoning factors
      const reasoningFactors = [];
      
      if (effectMatches > 0) {
        reasoningFactors.push({
          factor: `Matches ${effectMatches} of your desired effects`,
          weight: 0.6
        });
      }
      
      if (medicalNeeds && medicalNeeds.length > 0) {
        reasoningFactors.push({
          factor: `${strain.type} profile suitable for ${medicalNeeds.join(", ")}`,
          weight: 0.4
        });
      }
      
      if (userProfile?.experience_level === "beginner" && strain.thc > 20) {
        reasoningFactors.push({
          factor: "THC level may be high for beginners",
          weight: -0.3
        });
      } else if (userProfile?.experience_level === "experienced" && strain.thc < 18) {
        reasoningFactors.push({
          factor: "THC level may be mild for your experience",
          weight: -0.1
        });
      }
      
      return {
        strainId: strain.id,
        strainName: strain.name,
        matchScore: Math.min(100, Math.round(totalScore)),
        reasoningFactors
      };
    });
    
    // Sort by match score and take top 3
    const recommendations = scoredStrains
      .sort((a, b) => b.matchScore - a.matchScore)
      .slice(0, 3);
    
    // Add alternative strains to the top recommendation
    if (recommendations.length > 0) {
      const topRecommendation = recommendations[0] as any; // Type assertion to avoid TypeScript error
      topRecommendation.alternativeStrains = [
        {
          strainId: recommendations.length > 1 ? recommendations[1].strainId : 11,
          strainName: recommendations.length > 1 ? recommendations[1].strainName : "Pineapple Express",
          reason: "Similar terpene profile with slightly different effects"
        },
        {
          strainId: 12,
          strainName: "Northern Lights",
          reason: "A good alternative if you prefer more relaxing effects"
        }
      ];
    }
    
    return recommendations;
  }
  
  private generateMockReasoning(request: RecommendationRequest): string {
    const effectsList = request.desiredEffects.join(", ");
    const experienceLevel = request.userProfile.experience_level;
    
    let reasoning = `Based on your desired effects (${effectsList}) and ${experienceLevel} experience level, `;
    
    if (request.medicalNeeds && request.medicalNeeds.length > 0) {
      reasoning += `as well as your medical needs (${request.medicalNeeds.join(", ")}), `;
    }
    
    reasoning += "I've identified strains that are most likely to provide your desired experience while considering safety and effectiveness. ";
    
    reasoning += "The recommendations prioritize effect matches while accounting for THC content appropriate for your experience level.";
    
    return reasoning;
  }
  
  private generateDosageSuggestion(userProfile: any): DosageSuggestion {
    // Base dosage on experience level
    let minDosage = 0;
    let maxDosage = 0;
    let unit = "mg";
    let gradualApproach = false;
    let notes = "";
    
    switch (userProfile.experience_level) {
      case "beginner":
        minDosage = 2.5;
        maxDosage = 5;
        gradualApproach = true;
        notes = "Start with the minimum dose and wait at least 2 hours before considering more. Effects may take longer than expected for new users.";
        break;
      case "intermediate":
        minDosage = 5;
        maxDosage = 15;
        notes = "This range is appropriate for users with some tolerance. Start at the lower end if trying a new strain.";
        break;
      case "experienced":
        minDosage = 10;
        maxDosage = 30;
        notes = "This range is for users with established tolerance. Always adjust based on the specific strain's potency.";
        break;
      default:
        minDosage = 2.5;
        maxDosage = 10;
        gradualApproach = true;
        notes = "When unsure, start with a lower dose and increase gradually as needed.";
    }
    
    // Adjust for medical needs if present
    if (userProfile.medical_needs && userProfile.medical_needs.length > 0) {
      notes += " For medical use, consistency in timing and dosage is important for tracking effectiveness.";
    }
    
    return {
      minDosage,
      maxDosage,
      unit,
      gradualApproach,
      notes
    };
  }
  
  private generateSafetyNotes(request: RecommendationRequest): string[] {
    const safetyNotes: string[] = [
      "Keep all cannabis products secured and away from children and pets.",
      "Do not drive or operate heavy machinery after consumption."
    ];
    
    // Add personalized safety notes based on profile
    if (request.userProfile.experience_level === "beginner") {
      safetyNotes.push("As a beginner, start with very small amounts and wait at least 2 hours to assess effects.");
    }
    
    if (request.userProfile.avoid_effects && request.userProfile.avoid_effects.includes("anxiety")) {
      safetyNotes.push("Choose strains with balanced CBD:THC ratios to minimize anxiety risks.");
    }
    
    // Add notes based on journal entries if available
    if (request.journalEntries && request.journalEntries.length > 0) {
      const hasReportedNegatives = request.journalEntries.some(entry => 
        entry.negative_effects && entry.negative_effects.length > 0
      );
      
      if (hasReportedNegatives) {
        safetyNotes.push("Based on your journal, watch for negative effects you've previously experienced and adjust dosage accordingly.");
      }
      
      const highDosageEntries = request.journalEntries.filter(entry => 
        entry.dosage > (request.userProfile.experience_level === "beginner" ? 10 : 20)
      );
      
      if (highDosageEntries.length > 2) {
        safetyNotes.push("Your journal shows some higher dosages than typically recommended. Consider implementing scheduled tolerance breaks.");
      }
    }
    
    return safetyNotes;
  }
  
  private generateDosageResponse(userProfile: any): string {
    const dosage = this.generateDosageSuggestion(userProfile);
    
    return `Based on your experience level (${userProfile.experience_level}), a recommended dosage range would be ${dosage.minDosage}-${dosage.maxDosage}${dosage.unit}. ${dosage.notes} Remember that different consumption methods have different onset times and durations: inhalation typically takes effect in minutes and lasts 2-3 hours, while edibles can take 30-90 minutes and last 4-8 hours.`;
  }
  
  private generateEffectsResponse(message: string): string {
    if (message.includes('sativa')) {
      return "Sativa strains typically produce energizing, cerebral effects that can help with focus, creativity, and mood elevation. They're often recommended for daytime use. Common effects include: mental stimulation, increased energy, euphoria, and enhanced sensory experiences. Some users may experience increased anxiety with strong sativas, especially at higher doses.";
    } else if (message.includes('indica')) {
      return "Indica strains generally produce relaxing, full-body effects that can help with relaxation, sleep, and pain relief. They're often recommended for evening or nighttime use. Common effects include: physical relaxation, sedation, pain reduction, and appetite stimulation. Some users may experience strong sedation or 'couch-lock' with potent indicas.";
    } else if (message.includes('hybrid')) {
      return "Hybrid strains combine characteristics of both sativa and indica varieties, often providing a balanced experience. Effects can lean more energizing or relaxing depending on which parent strain is dominant. Well-balanced hybrids often provide mental clarity and physical relaxation without excessive sedation or stimulation, making them versatile for different times of day.";
    } else {
      return "Cannabis effects vary widely based on strain, dosage, consumption method, and individual factors. Common positive effects include relaxation, euphoria, creativity, pain relief, and improved mood. Possible adverse effects include dry mouth, red eyes, increased heart rate, anxiety, and sedation. The experience is highly individualized, which is why personal journaling is valuable for finding what works best for you.";
    }
  }
  
  private generateRegulatoryResponse(): string {
    return "Cannabis regulations vary significantly by country, state, and even local jurisdictions. Key regulatory aspects to consider include: legal age (typically 21+), purchase limits, possession limits, public consumption rules, home cultivation allowances, and driving restrictions. I can provide more specific information if you share your location code.";
  }
  
  private generateMedicalResponse(message: string): string {
    let response = "Cannabis has been used for various medical applications, though research is still developing. ";
    
    if (message.includes('pain')) {
      response += "For pain management, indica and indica-dominant hybrid strains with moderate to high THC levels are often reported as helpful. CBD-rich strains may also provide pain relief with less psychoactivity. Consistent dosing and keeping a symptom journal helps identify the most effective approach for your specific pain type.";
    } else if (message.includes('sleep') || message.includes('insomnia')) {
      response += "For sleep issues, indica strains with sedating terpenes like myrcene and linalool are commonly recommended. Products specifically formulated for sleep may contain CBN, which has sedative properties. Timing is important - consumption 1-2 hours before bedtime typically works best for most people.";
    } else if (message.includes('anxiety')) {
      response += "For anxiety, balanced strains with equal THC:CBD ratios or CBD-dominant strains are often recommended, as high-THC products can sometimes increase anxiety. Strains with the terpene limonene may have mood-elevating properties, while linalool can promote relaxation. Start with very low doses when addressing anxiety.";
    } else {
      response += "Common medical applications include pain management, sleep improvement, anxiety reduction, appetite stimulation, and symptom management for various conditions. The effectiveness varies significantly between individuals. Working with a healthcare professional knowledgeable about cannabis is recommended for developing a treatment plan tailored to your specific needs.";
    }
    
    response += " Always consult with a healthcare professional before using cannabis for medical purposes, especially if you're taking other medications.";
    
    return response;
  }
  
  private generateFollowUpSuggestions(message: string): string[] {
    // Generate contextual follow-up questions based on user message
    const suggestions: string[] = [];
    
    if (message.includes('dosage') || message.includes('how much')) {
      suggestions.push("What's the difference between smoking and edible dosages?");
      suggestions.push("How should I adjust dosage based on THC percentage?");
    } else if (message.includes('effect') || message.includes('feel')) {
      suggestions.push("What's the difference between sativa and indica effects?");
      suggestions.push("How long do different consumption methods' effects last?");
    } else if (message.includes('strain') || message.includes('recommend')) {
      suggestions.push("What strains are good for relaxation?");
      suggestions.push("What strains can help with creativity?");
    } else if (message.includes('medical') || message.includes('condition')) {
      suggestions.push("How does cannabis interact with medications?");
      suggestions.push("What's the difference between THC and CBD for medical use?");
    } else {
      // Default suggestions
      suggestions.push("What factors affect how cannabis affects me?");
      suggestions.push("How can I find the right strain for my needs?");
      suggestions.push("What's the difference between consumption methods?");
    }
    
    return suggestions;
  }
  
  private countStrainUsage(journalEntries: JournalEntry[]): Map<string, number> {
    const counts = new Map<string, number>();
    
    journalEntries.forEach(entry => {
      const strainName = entry.strain_name;
      counts.set(strainName, (counts.get(strainName) || 0) + 1);
    });
    
    return counts;
  }
  
  private countEffects(journalEntries: JournalEntry[]): Map<string, number> {
    const counts = new Map<string, number>();
    
    journalEntries.forEach(entry => {
      if (entry.effects_felt && entry.effects_felt.length > 0) {
        entry.effects_felt.forEach(effect => {
          counts.set(effect, (counts.get(effect) || 0) + 1);
        });
      }
    });
    
    return counts;
  }
  
  private countNegativeEffects(journalEntries: JournalEntry[]): Map<string, number> {
    const counts = new Map<string, number>();
    
    journalEntries.forEach(entry => {
      if (entry.negative_effects && entry.negative_effects.length > 0) {
        entry.negative_effects.forEach(effect => {
          counts.set(effect, (counts.get(effect) || 0) + 1);
        });
      }
    });
    
    return counts;
  }
  
  private getMostFrequentItem<T>(counts: Map<T, number>): T | null {
    let maxCount = 0;
    let maxItem: T | null = null;
    
    counts.forEach((count, item) => {
      if (count > maxCount) {
        maxCount = count;
        maxItem = item;
      }
    });
    
    return maxItem;
  }
  
  private generateRecommendationResponse(userProfile: UserProfile): string {
    const effects = userProfile.preferred_effects || [];
    const strains = ['Blue Dream', 'OG Kush', 'Sour Diesel', 'Girl Scout Cookies', 'Pineapple Express'];
    const randomStrain = strains[Math.floor(Math.random() * strains.length)];
    
    return `Based on your preferences for ${effects.join(', ')}, I would recommend trying ${randomStrain}. This strain is known for its balanced effects and is popular among ${userProfile.experience_level} users. Remember to start with a small amount, especially if you're trying a new strain.`;
  }
  
  // Helper method to format the prompt for strain recommendations
  private formatRecommendationPrompt(request: RecommendationRequest): string {
    const { userProfile, desiredEffects, medicalNeeds, context } = request;
    
    let prompt = `Recommend cannabis strains for a ${userProfile.experience_level} user `;
    prompt += `seeking the following effects: ${desiredEffects.join(', ')}. `;
    
    if (medicalNeeds && medicalNeeds.length > 0) {
      prompt += `They are looking for relief from: ${medicalNeeds.join(', ')}. `;
    }
    
    prompt += `The context is ${context || 'recreational'}. `;
    
    if (userProfile.avoid_effects && userProfile.avoid_effects.length > 0) {
      prompt += `They want to avoid these effects: ${userProfile.avoid_effects.join(', ')}. `;
    }
    
    prompt += "Provide recommendations in JSON format with the following structure: " +
      "{ recommendations: [{ strainId: number, strainName: string, matchScore: number, " +
      "reasoningFactors: [{ factor: string, weight: number }] }], " +
      "reasoning: string, confidenceScore: number, disclaimers: string[], " +
      "dosageSuggestion: { minDosage: number, maxDosage: number, unit: string, " +
      "gradualApproach: boolean, notes: string }, safetyNotes: string[] }";
    
    return prompt;
  }
  
  // Helper method to parse the AI response
  private parseRecommendationResponse(
    responseText: string, 
    originalRequest: RecommendationRequest
  ): RecommendationResponse {
    try {
      // Extract JSON from the response text
      const jsonMatch = responseText.match(/```json\n([\s\S]*?)\n```/) || 
                        responseText.match(/{[\s\S]*}/);
      
      if (jsonMatch) {
        const jsonString = jsonMatch[0].replace(/```json\n|```/g, '');
        return JSON.parse(jsonString);
      }
      
      // Fallback to structured parsing if JSON extraction fails
      console.warn('[AIService] Could not extract JSON from response, using fallback parsing');
      
      // Generate fallback response
      return this.generateFallbackResponse(originalRequest);
    } catch (error) {
      console.error("[AIService] Error parsing AI response:", error);
      // Return a fallback response
      return this.generateFallbackResponse(originalRequest);
    }
  }
  
  // Generate a fallback response when parsing fails
  private generateFallbackResponse(request: RecommendationRequest): RecommendationResponse {
    return {
      recommendations: this.generateMockRecommendations(
        request.desiredEffects,
        request.medicalNeeds,
        request.userProfile
      ),
      reasoning: "Based on your preferences, these strains should provide the effects you're looking for.",
      confidenceScore: 0.7,
      disclaimers: [
        "These recommendations are based on general strain profiles.",
        "Individual experiences may vary.",
        "Always start with a lower dosage when trying a new strain."
      ],
      dosageSuggestion: this.generateDosageSuggestion(request.userProfile),
      safetyNotes: ["Please consult with a healthcare professional for medical advice."]
    };
  }
  
  // Authenticated request with improved retry logic
  private async authenticatedRequest<T>(
    requestFn: () => Promise<T>,
    retryCount: number = 0
  ): Promise<T> {
    try {
      // Check if API key is valid
      if (!this.apiKey) {
        throw new AIServiceError(
          'API key is not configured',
          AIServiceErrorType.AUTHENTICATION,
          401,
          false,
          "Authentication failed. Please check your account settings."
        );
      }
      
      // Make the request with timeout
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => {
          reject(new AIServiceError(
            'Request timed out',
            AIServiceErrorType.TIMEOUT,
            408,
            true,
            "The request timed out. Please try again."
          ));
        }, 30000); // 30 second timeout
      });
      
      return await Promise.race([requestFn(), timeoutPromise]) as T;
    } catch (error: any) {
      let aiError: AIServiceError;
      
      // Convert to AIServiceError if needed
      if (error instanceof AIServiceError) {
        aiError = error;
      } else if (error.response) {
        // API responded with an error status
        try {
          const errorData = await error.response.json();
          aiError = this.createErrorFromResponse(error.response, errorData);
        } catch (parseError) {
          aiError = new AIServiceError(
            `Failed to parse error response: ${error.message}`,
            AIServiceErrorType.PARSING,
            error.response?.status,
            false,
            "An unexpected error occurred. Please try again later."
          );
        }
      } else if (error.request) {
        // Network error
        aiError = new AIServiceError(
          `Network error: ${error.message}`,
          AIServiceErrorType.NETWORK,
          undefined,
          true,
          "Network connection issue. Please check your internet connection."
        );
      } else {
        // Unknown error
        aiError = new AIServiceError(
          `Unknown error: ${error.message || 'No error message'}`,
          AIServiceErrorType.UNKNOWN,
          undefined,
          false,
          "An unexpected error occurred. Please try again later."
        );
      }
      
      // Handle retry logic
      if (aiError.retryable && retryCount < this.maxRetries) {
        // Exponential backoff with jitter
        const delay = Math.min(
          this.retryDelay * Math.pow(2, retryCount) + Math.random() * 1000,
          30000 // Max 30 seconds
        );
        
        console.log(`[AIService] ${aiError.type} error, retrying in ${Math.round(delay)}ms...`);
        await new Promise(resolve => setTimeout(resolve, delay));
        return this.authenticatedRequest(requestFn, retryCount + 1);
      }
      
      // Handle the error if we're not retrying
      this.handleError(aiError);
      throw aiError;
    }
  }
  
  // Track AI usage
  private async trackUsage(userId: string, requestType: string, tokensUsed: number): Promise<void> {
    try {
      await this.ensureInitialized();
      
      // Record the usage
      await this.db?.execAsync(`
        INSERT INTO ai_usage (
          user_id,
          request_type,
          tokens_used,
          timestamp
        ) VALUES ('${userId}', '${requestType}', ${tokensUsed}, ${Date.now()})
      `);
      
      // Check if user is approaching limits
      const result = await this.db?.getAllAsync<{total: number}>(`
        SELECT SUM(tokens_used) as total
        FROM ai_usage
        WHERE user_id = '${userId}' AND timestamp > ${Date.now() - 30 * 24 * 60 * 60 * 1000}
      `);
      
      const usage = result?.[0];
      
      // Implement rate limiting logic
      const MONTHLY_LIMIT = 100000; // 100k tokens per month
      if (usage && usage.total > MONTHLY_LIMIT * 0.8) {
        // Alert user they're approaching their limit
        console.log(`[AIService] User ${userId} is approaching their monthly AI usage limit`);
        // This could trigger a notification or in-app message
      }
    } catch (error) {
      console.error('[AIService] Error tracking AI usage:', error);
      // Non-critical error, don't throw
    }
  }
  
  // Submit recommendation feedback
  async submitRecommendationFeedback(
    userId: string,
    recommendationId: string,
    feedback: {
      helpful: boolean;
      accurateEffects: boolean;
      wouldTryAgain: boolean;
      comments?: string;
    }
  ): Promise<void> {
    try {
      await this.ensureInitialized();
      
      await this.feedbackDb?.execAsync(`
        INSERT INTO recommendation_feedback (
          user_id,
          recommendation_id,
          helpful,
          accurate_effects,
          would_try_again,
          comments,
          timestamp
        ) VALUES (
          '${userId}',
          '${recommendationId}',
          ${feedback.helpful ? 1 : 0},
          ${feedback.accurateEffects ? 1 : 0},
          ${feedback.wouldTryAgain ? 1 : 0},
          ${feedback.comments ? `'${feedback.comments}'` : 'NULL'},
          ${Date.now()}
        )
      `);
      
      // Use this feedback to improve future recommendations
      await this.updateUserPreferenceModel(userId, feedback);
      
      // Invalidate related cache entries
      // If feedback is negative, invalidate all recommendations for this user
      if (!feedback.helpful || !feedback.accurateEffects || !feedback.wouldTryAgain) {
        await this.invalidateCacheByPattern(`strain_recommendation_${userId}`);
      }
      
    } catch (error) {
      console.error('[AIService] Error submitting recommendation feedback:', error);
      throw error;
    }
  }
  
  // Update user preference model based on feedback
  private async updateUserPreferenceModel(userId: string, feedback: any): Promise<void> {
    // In a real implementation, this would update a user preference model
    // For now, we'll just log the feedback
    console.log(`[AIService] Updating user preference model for ${userId} based on feedback:`, feedback);
    
    // Invalidate cache for this user when their preference model is updated
    await this.invalidateCacheForUser(userId);
  }
  
  // Invalidate all cache entries for a specific user
  async invalidateCacheForUser(userId: string): Promise<void> {
    try {
      // Get all cache keys for this user
      interface KeyEntry {
        key: string;
      }
      
      const entries = await this.cacheDb?.getAllAsync<KeyEntry>(`
        SELECT key FROM ai_response_cache 
        WHERE data LIKE ?
      `, [`%"id":"${userId}"%`]);
      
      if (entries && entries.length > 0) {
        // Remove from memory cache
        entries.forEach(entry => {
          this.memoryCache.delete(entry.key);
        });
        
        // Remove from persistent cache
        const placeholders = entries.map(() => '?').join(',');
        const keys = entries.map(entry => entry.key);
        
        await this.cacheDb?.getAllAsync(`
          DELETE FROM ai_response_cache 
          WHERE key IN (${placeholders})
        `, keys);
        
        console.log(`[AIService] Invalidated ${entries.length} cache entries for user: ${userId}`);
      }
    } catch (error) {
      console.error(`[AIService] Error invalidating cache for user ${userId}:`, error);
    }
  }
  
  // Hook to call when user profile is updated
  async onUserProfileUpdated(userId: string): Promise<void> {
    // Invalidate all cache entries for this user
    await this.invalidateCacheForUser(userId);
  }
  
  // Hook to call when journal entries are updated
  async onJournalEntriesUpdated(userId: string): Promise<void> {
    // Invalidate recommendation cache for this user
    await this.invalidateCacheByPattern(`strain_recommendation_${userId}`);
  }
  
  // Hook to call when strain data is updated
  async onStrainDataUpdated(): Promise<void> {
    // Invalidate all recommendation cache entries
    await this.invalidateCacheByPattern('strain_recommendation');
  }
  
  // Hook to call when regulations are updated
  async onRegulationsUpdated(locationCode: string): Promise<void> {
    // Invalidate all cache entries related to this location
    await this.invalidateCacheByPattern(locationCode);
  }

  // Ensure the service is initialized
  private async ensureInitialized(): Promise<void> {
    if (!this.initialized) {
      await this.initialize();
    }
  }
  
  // Determine if we should use the real API or mock data
  private shouldUseRealAPI(): boolean {
    // In a real app, this could check for environment, user permissions, etc.
    // For now, we'll just check if the API key is available and not the placeholder
    return !!this.apiKey && this.apiKey.length > 0 && this.apiKey !== "YOUR_ANTHROPIC_API_KEY";
  }

  // Register custom error handlers
  registerErrorHandler(type: AIServiceErrorType, handler: (error: AIServiceError) => void): void {
    this.errorHandlers.set(type, handler);
  }

  // Set retry configuration
  setRetryConfig(maxRetries: number, baseDelayMs: number): void {
    this.maxRetries = maxRetries;
    this.retryDelay = baseDelayMs;
  }

  // Handle errors based on type
  private handleError(error: AIServiceError): void {
    console.error(`[AIService] ${error.type} error:`, error.message);
    
    // Log error for analytics
    this.logError(error);
    
    // Call custom handler if registered
    const handler = this.errorHandlers.get(error.type);
    if (handler) {
      handler(error);
    }
  }

  // Log errors for analytics
  private async logError(error: AIServiceError): Promise<void> {
    try {
      await this.ensureInitialized();
      
      // Create error logging table if it doesn't exist
      await this.db?.execAsync(`
        CREATE TABLE IF NOT EXISTS ai_service_errors (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          error_type TEXT NOT NULL,
          error_message TEXT NOT NULL,
          status_code INTEGER,
          timestamp INTEGER NOT NULL
        )
      `);
      
      // Log the error
      await this.db?.execAsync(`
        INSERT INTO ai_service_errors (
          error_type,
          error_message,
          status_code,
          timestamp
        ) VALUES (
          '${error.type}',
          '${error.message.replace(/'/g, "''")}',
          ${error.statusCode || 'NULL'},
          ${Date.now()}
        )
      `);
    } catch (logError) {
      // Don't throw from error logging
      console.error('[AIService] Error logging failed:', logError);
    }
  }

  // Create appropriate error from HTTP response
  private createErrorFromResponse(response: Response, errorData: any): AIServiceError {
    const status = response.status;
    let type = AIServiceErrorType.UNKNOWN;
    let retryable = false;
    let userMessage = "An error occurred while processing your request.";
    
    if (status === 401 || status === 403) {
      type = AIServiceErrorType.AUTHENTICATION;
      userMessage = "Authentication failed. Please check your account settings.";
    } else if (status === 429) {
      type = AIServiceErrorType.RATE_LIMIT;
      retryable = true;
      userMessage = "You've reached the usage limit. Please try again later.";
    } else if (status >= 500) {
      type = AIServiceErrorType.SERVER;
      retryable = true;
      userMessage = "The service is temporarily unavailable. Please try again later.";
    } else if (status === 408 || errorData?.error?.type === 'timeout') {
      type = AIServiceErrorType.TIMEOUT;
      retryable = true;
      userMessage = "The request timed out. Please try again.";
    }
    
    const errorMessage = errorData?.error?.message || response.statusText || 'Unknown error';
    return new AIServiceError(
      `API error: ${errorMessage}`,
      type,
      status,
      retryable,
      userMessage
    );
  }

  // Evaluate the quality of a recommendation response
  async evaluateResponseQuality(
    response: RecommendationResponse, 
    responseId: string = `rec_${Date.now()}`
  ): Promise<QualityScore> {
    try {
      await this.ensureInitialized();
      console.log('[AIService] Evaluating response quality');
      
      // Generate a unique ID for this evaluation
      const evaluationId = `eval_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
      
      if (this.apiKey && this.shouldUseRealAPI()) {
        // Use a separate AI call to evaluate the quality
        return await this.authenticatedRequest(async () => {
          // Format the evaluation prompt
          const prompt = this.formatEvaluationPrompt(response);
          
          // Call Claude API for evaluation
          const evalResponse = await fetch(`${this.baseUrl}/messages`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'x-api-key': this.apiKey,
              'anthropic-version': this.apiVersion
            },
            body: JSON.stringify({
              model: "claude-3-5-haiku-20241022",
              max_tokens: 1000,
              temperature: 0.2, // Lower temperature for more consistent evaluations
              system: "You are an expert evaluator of AI-generated cannabis recommendations. Your task is to critically analyze the quality, accuracy, and safety of recommendations. Be thorough, fair, and focus on both strengths and areas for improvement.",
              messages: [
                { 
                  role: "user", 
                  content: prompt 
                }
              ]
            })
          });
          
          if (!evalResponse.ok) {
            const errorData = await evalResponse.json();
            throw this.createErrorFromResponse(evalResponse, errorData);
          }
          
          const data = await evalResponse.json();
          
          // Parse the evaluation response
          const qualityScore = this.parseEvaluationResponse(data.content[0].text);
          
          // Store the evaluation results
          await this.storeQualityScore(evaluationId, responseId, qualityScore);
          
          return qualityScore;
        });
      } else {
        // Generate a mock evaluation for development
        const mockQualityScore: QualityScore = {
          overallScore: Math.floor(70 + Math.random() * 30), // 70-100
          relevanceScore: Math.floor(65 + Math.random() * 35),
          accuracyScore: Math.floor(75 + Math.random() * 25),
          comprehensivenessScore: Math.floor(60 + Math.random() * 40),
          safetyScore: Math.floor(80 + Math.random() * 20),
          strengths: [
            "Good variety of strain recommendations",
            "Clear dosage guidelines provided",
            "Appropriate safety warnings included"
          ],
          weaknesses: [
            "Could provide more specific information about each strain",
            "Limited personalization based on user experience level"
          ],
          improvementSuggestions: [
            "Include more details about potential side effects",
            "Add more context about how each strain addresses specific medical needs",
            "Provide more granular dosage recommendations based on consumption method"
          ]
        };
        
        // Store the mock evaluation
        await this.storeQualityScore(evaluationId, responseId, mockQualityScore);
        
        return mockQualityScore;
      }
    } catch (error) {
      console.error('[AIService] Error evaluating response quality:', error);
      
      // Return a default quality score in case of error
      return {
        overallScore: 50,
        relevanceScore: 50,
        accuracyScore: 50,
        comprehensivenessScore: 50,
        safetyScore: 70, // Assume safety is still decent
        strengths: ["Unable to fully evaluate strengths"],
        weaknesses: ["Evaluation process encountered an error"],
        improvementSuggestions: ["Try again with a different recommendation"]
      };
    }
  }
  
  // Format the prompt for evaluation
  private formatEvaluationPrompt(response: RecommendationResponse): string {
    return `
Please evaluate the quality of the following cannabis recommendation:

RECOMMENDATION DATA:
${JSON.stringify(response, null, 2)}

Evaluate this recommendation on the following criteria:
1. Overall quality (0-100)
2. Relevance to user needs (0-100)
3. Accuracy of information (0-100)
4. Comprehensiveness (0-100)
5. Safety considerations (0-100)

Also provide:
- 2-4 key strengths of this recommendation
- 2-4 areas for improvement
- 2-4 specific suggestions to make this recommendation better

Format your response as a JSON object with the following structure:
{
  "overallScore": number,
  "relevanceScore": number,
  "accuracyScore": number,
  "comprehensivenessScore": number,
  "safetyScore": number,
  "strengths": [string, string, ...],
  "weaknesses": [string, string, ...],
  "improvementSuggestions": [string, string, ...]
}
`;
  }
  
  // Parse the evaluation response from Claude
  private parseEvaluationResponse(responseText: string): QualityScore {
    try {
      // Extract JSON from the response text
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const jsonStr = jsonMatch[0];
        const parsed = JSON.parse(jsonStr);
        
        // Validate and ensure all fields are present
        return {
          overallScore: parsed.overallScore || 50,
          relevanceScore: parsed.relevanceScore || 50,
          accuracyScore: parsed.accuracyScore || 50,
          comprehensivenessScore: parsed.comprehensivenessScore || 50,
          safetyScore: parsed.safetyScore || 50,
          strengths: Array.isArray(parsed.strengths) ? parsed.strengths : ["No strengths provided"],
          weaknesses: Array.isArray(parsed.weaknesses) ? parsed.weaknesses : ["No weaknesses identified"],
          improvementSuggestions: Array.isArray(parsed.improvementSuggestions) ? 
            parsed.improvementSuggestions : ["No improvement suggestions provided"]
        };
      }
      
      // Fallback if JSON parsing fails
      throw new Error("Failed to extract JSON from evaluation response");
    } catch (error) {
      console.error('[AIService] Error parsing evaluation response:', error);
      
      // Return default values
      return {
        overallScore: 50,
        relevanceScore: 50,
        accuracyScore: 50,
        comprehensivenessScore: 50,
        safetyScore: 50,
        strengths: ["Unable to parse strengths"],
        weaknesses: ["Unable to parse evaluation properly"],
        improvementSuggestions: ["Try a different format for evaluation"]
      };
    }
  }
  
  // Store quality score in the database
  private async storeQualityScore(
    evaluationId: string, 
    responseId: string, 
    qualityScore: QualityScore
  ): Promise<void> {
    try {
      await this.feedbackDb?.execAsync(`
        INSERT INTO response_quality_scores (
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
    } catch (error) {
      console.error('[AIService] Error storing quality score:', error);
    }
  }

  // Learn from user feedback to improve future recommendations
  private async learnFromUserFeedback(feedback: UserFeedback): Promise<void> {
    try {
      await this.ensureInitialized();
      console.log('[AIService] Learning from user feedback:', feedback);
      
      // 1. Store the feedback in the database
      await this.storeFeedback(feedback);
      
      // 2. Extract patterns from the feedback
      await this.extractFeedbackPatterns(feedback);
      
      // 3. Update recommendation algorithms based on feedback
      if (feedback.responseType === 'recommendation') {
        await this.updateRecommendationAlgorithm(feedback);
      } else if (feedback.responseType === 'chat') {
        await this.updateChatResponseAlgorithm(feedback);
      }
      
      // 4. Invalidate cache for this user if feedback is negative
      if (!feedback.helpful || feedback.relevance < 3) {
        await this.invalidateCacheForUser(feedback.userId);
      }
    } catch (error) {
      console.error('[AIService] Error learning from user feedback:', error);
    }
  }
  
  // Store user feedback in the database
  private async storeFeedback(feedback: UserFeedback): Promise<void> {
    try {
      const feedbackId = `feedback_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
      
      await this.feedbackDb?.execAsync(`
        INSERT INTO user_feedback (
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
    } catch (error) {
      console.error('[AIService] Error storing feedback:', error);
      throw error;
    }
  }
  
  // Extract patterns from feedback to identify what works and what doesn't
  private async extractFeedbackPatterns(feedback: UserFeedback): Promise<void> {
    try {
      // Get the response data
      let responseData: any = null;
      let userProfileData: any = null;
      let requestFactors: any = null;
      
      if (feedback.responseType === 'recommendation') {
        // Get recommendation data from cache or database
        const cachedRecommendation = await this.getCachedRecommendationById(feedback.responseId);
        if (cachedRecommendation) {
          responseData = cachedRecommendation;
          userProfileData = cachedRecommendation.userProfile;
          requestFactors = {
            desiredEffects: cachedRecommendation.desiredEffects,
            medicalNeeds: cachedRecommendation.medicalNeeds,
            context: cachedRecommendation.context
          };
        }
      } else if (feedback.responseType === 'chat') {
        // Get chat data from cache or database
        const cachedChat = await this.getCachedChatById(feedback.responseId);
        if (cachedChat) {
          responseData = cachedChat;
          userProfileData = cachedChat.userProfile;
          requestFactors = {
            messageLength: cachedChat.message.length,
            topicKeywords: this.extractKeywords(cachedChat.message),
            previousMessagesCount: cachedChat.previousMessages?.length || 0
          };
        }
      }
      
      if (!responseData || !userProfileData) {
        console.log('[AIService] Could not find response data for pattern extraction');
        return;
      }
      
      // Generate a pattern ID based on user profile and request factors
      const patternId = await this.generatePatternId(feedback.responseType, userProfileData, requestFactors);
      
      // Check if this pattern already exists
      interface PatternEntry {
        positive_outcome_rate: number;
        sample_size: number;
        user_profile_factors: string;
        request_factors: string;
      }
      
      const existingPattern = await this.feedbackDb?.getFirstAsync<PatternEntry>(`
        SELECT positive_outcome_rate, sample_size, user_profile_factors, request_factors
        FROM feedback_patterns
        WHERE pattern_id = ?
      `, [patternId]);
      
      const isPositiveOutcome = feedback.helpful && feedback.accurate && feedback.relevance >= 4;
      
      if (existingPattern) {
        // Update existing pattern
        const newSampleSize = existingPattern.sample_size + 1;
        const oldPositiveCount = existingPattern.positive_outcome_rate * existingPattern.sample_size;
        const newPositiveCount = oldPositiveCount + (isPositiveOutcome ? 1 : 0);
        const newPositiveRate = newPositiveCount / newSampleSize;
        
        await this.feedbackDb?.getAllAsync(`
          UPDATE feedback_patterns
          SET positive_outcome_rate = ?,
              sample_size = ?,
              last_updated = ?
          WHERE pattern_id = ?
        `, [newPositiveRate, newSampleSize, Date.now(), patternId]);
      } else {
        // Create new pattern
        const userProfileFactors = this.extractRelevantProfileFactors(userProfileData);
        
        await this.feedbackDb?.getAllAsync(`
          INSERT INTO feedback_patterns (
            pattern_id,
            response_type,
            user_profile_factors,
            request_factors,
            positive_outcome_rate,
            sample_size,
            last_updated
          ) VALUES (?, ?, ?, ?, ?, ?, ?)
        `, [
          patternId,
          feedback.responseType,
          JSON.stringify(userProfileFactors),
          JSON.stringify(requestFactors),
          isPositiveOutcome ? 1 : 0,
          1,
          Date.now()
        ]);
      }
    } catch (error) {
      console.error('[AIService] Error extracting feedback patterns:', error);
    }
  }
  
  // Generate a pattern ID based on user profile and request factors
  private async generatePatternId(
    responseType: string,
    userProfile: any,
    requestFactors: any
  ): Promise<string> {
    // Create a stable representation of the key factors
    const stableRepresentation = this.createStableRepresentation({
      type: responseType,
      profile: {
        experience_level: userProfile.experience_level,
        preferred_effects: userProfile.preferred_effects,
        medical_needs: userProfile.medical_needs
      },
      request: requestFactors
    });
    
    // Generate a hash of the stable representation
    return `pattern_${SHA256(stableRepresentation).substring(0, 16)}`;
  }
  
  // Extract relevant factors from user profile for pattern matching
  private extractRelevantProfileFactors(userProfile: any): Record<string, any> {
    return {
      experience_level: userProfile.experience_level,
      has_medical_needs: Array.isArray(userProfile.medical_needs) && userProfile.medical_needs.length > 0,
      preferred_effect_count: Array.isArray(userProfile.preferred_effects) ? userProfile.preferred_effects.length : 0,
      avoid_effect_count: Array.isArray(userProfile.avoid_effects) ? userProfile.avoid_effects.length : 0
    };
  }
  
  // Extract keywords from a message for pattern matching
  private extractKeywords(message: string): string[] {
    // Simple keyword extraction - in a real app, use NLP
    const stopWords = ['a', 'an', 'the', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'with', 'about', 'is', 'are'];
    const words = message.toLowerCase().replace(/[^\w\s]/g, '').split(/\s+/);
    return words
      .filter(word => word.length > 3 && !stopWords.includes(word))
      .slice(0, 5); // Take top 5 keywords
  }
  
  // Get cached recommendation by ID
  private async getCachedRecommendationById(id: string): Promise<any> {
    try {
      // Search in memory cache first
      // Use Array.from to convert the iterator to an array to avoid downlevelIteration issues
      const cacheEntries = Array.from(this.memoryCache.entries());
      for (let i = 0; i < cacheEntries.length; i++) {
        const [key, entry] = cacheEntries[i];
        if (entry.data && entry.data.id === id) {
          return entry.data;
        }
      }
      
      // Search in persistent cache
      interface CacheEntry {
        data: string;
      }
      
      const entries = await this.cacheDb?.getAllAsync<CacheEntry>(`
        SELECT data FROM ai_response_cache
        WHERE data LIKE ?
      `, [`%"id":"${id}"%`]);
      
      if (entries && entries.length > 0) {
        for (const entry of entries) {
          try {
            const data = JSON.parse(entry.data);
            if (data.id === id) {
              return data;
            }
          } catch (e) {
            // Skip invalid JSON
          }
        }
      }
      
      return null;
    } catch (error) {
      console.error('[AIService] Error getting cached recommendation:', error);
      return null;
    }
  }
  
  // Get cached chat by ID
  private async getCachedChatById(id: string): Promise<any> {
    // Similar implementation to getCachedRecommendationById
    // Simplified for brevity
    return null;
  }
  
  // Update recommendation algorithm based on feedback
  private async updateRecommendationAlgorithm(feedback: UserFeedback): Promise<void> {
    try {
      // Get successful patterns
      interface PatternEntry {
        pattern_id: string;
        user_profile_factors: string;
        request_factors: string;
        positive_outcome_rate: number;
        sample_size: number;
      }
      
      const successfulPatterns = await this.feedbackDb?.getAllAsync<PatternEntry>(`
        SELECT pattern_id, user_profile_factors, request_factors, positive_outcome_rate, sample_size
        FROM feedback_patterns
        WHERE response_type = 'recommendation'
          AND positive_outcome_rate > 0.7
          AND sample_size >= 5
        ORDER BY positive_outcome_rate DESC, sample_size DESC
        LIMIT 10
      `);
      
      if (!successfulPatterns || successfulPatterns.length === 0) {
        return;
      }
      
      // In a real implementation, this would update a machine learning model
      // or adjust recommendation parameters
      
      // For this demo, we'll just log the successful patterns
      console.log('[AIService] Successful recommendation patterns:', 
        successfulPatterns.map(p => ({
          patternId: p.pattern_id,
          userFactors: JSON.parse(p.user_profile_factors),
          requestFactors: JSON.parse(p.request_factors),
          successRate: p.positive_outcome_rate,
          sampleSize: p.sample_size
        }))
      );
      
      // Update prompt templates based on successful patterns
      // This would be implemented in a real system
    } catch (error) {
      console.error('[AIService] Error updating recommendation algorithm:', error);
    }
  }
  
  // Update chat response algorithm based on feedback
  private async updateChatResponseAlgorithm(feedback: UserFeedback): Promise<void> {
    // Similar implementation to updateRecommendationAlgorithm
    // Simplified for brevity
  }

  // Submit detailed user feedback for AI responses
  async submitUserFeedback(
    userId: string,
    responseId: string,
    responseType: 'recommendation' | 'chat',
    feedback: {
      helpful: boolean;
      accurate: boolean;
      relevance: number; // 1-5 scale
      comments?: string;
    }
  ): Promise<void> {
    try {
      await this.ensureInitialized();
      console.log(`[AIService] Submitting ${responseType} feedback for user ${userId}`);
      
      // Create a UserFeedback object
      const userFeedback: UserFeedback = {
        userId,
        responseId,
        responseType,
        helpful: feedback.helpful,
        accurate: feedback.accurate,
        relevance: feedback.relevance,
        comments: feedback.comments,
        timestamp: Date.now()
      };
      
      // Learn from this feedback
      await this.learnFromUserFeedback(userFeedback);
      
      // If this is a recommendation, also update the legacy feedback system
      if (responseType === 'recommendation') {
        await this.submitRecommendationFeedback(
          userId,
          responseId,
          {
            helpful: feedback.helpful,
            accurateEffects: feedback.accurate,
            wouldTryAgain: feedback.relevance >= 4,
            comments: feedback.comments
          }
        );
      }
      
      // Optionally trigger an evaluation of the response quality
      if (responseType === 'recommendation') {
        // Get the recommendation from cache
        const recommendation = await this.getCachedRecommendationById(responseId);
        if (recommendation) {
          // Evaluate in the background, don't await
          this.evaluateResponseQuality(recommendation, responseId)
            .then(qualityScore => {
              console.log(`[AIService] Quality evaluation for ${responseId}:`, qualityScore);
            })
            .catch(error => {
              console.error('[AIService] Error evaluating response quality:', error);
            });
        }
      }
    } catch (error) {
      console.error('[AIService] Error submitting user feedback:', error);
      throw error;
    }
  }
  
  // Get feedback statistics for a user
  async getUserFeedbackStats(userId: string): Promise<{
    totalFeedback: number;
    positiveRate: number;
    averageRelevance: number;
  }> {
    try {
      await this.ensureInitialized();
      
      interface FeedbackStats {
        total: number;
        positive: number;
        relevance_sum: number;
      }
      
      const stats = await this.feedbackDb?.getFirstAsync<FeedbackStats>(`
        SELECT 
          COUNT(*) as total,
          SUM(CASE WHEN helpful = 1 AND accurate = 1 THEN 1 ELSE 0 END) as positive,
          SUM(relevance) as relevance_sum
        FROM user_feedback
        WHERE user_id = ?
      `, [userId]);
      
      if (stats && stats.total > 0) {
        return {
          totalFeedback: stats.total,
          positiveRate: stats.positive / stats.total,
          averageRelevance: stats.relevance_sum / stats.total
        };
      }
      
      return {
        totalFeedback: 0,
        positiveRate: 0,
        averageRelevance: 0
      };
    } catch (error) {
      console.error('[AIService] Error getting user feedback stats:', error);
      return {
        totalFeedback: 0,
        positiveRate: 0,
        averageRelevance: 0
      };
    }
  }
  
  // Get quality score statistics
  async getQualityScoreStats(): Promise<{
    averageOverallScore: number;
    averageRelevanceScore: number;
    averageSafetyScore: number;
    totalEvaluations: number;
  }> {
    try {
      await this.ensureInitialized();
      
      interface QualityStats {
        avg_overall: number;
        avg_relevance: number;
        avg_safety: number;
        total: number;
      }
      
      const stats = await this.feedbackDb?.getFirstAsync<QualityStats>(`
        SELECT 
          AVG(overall_score) as avg_overall,
          AVG(relevance_score) as avg_relevance,
          AVG(safety_score) as avg_safety,
          COUNT(*) as total
        FROM response_quality_scores
      `);
      
      if (stats) {
        return {
          averageOverallScore: stats.avg_overall || 0,
          averageRelevanceScore: stats.avg_relevance || 0,
          averageSafetyScore: stats.avg_safety || 0,
          totalEvaluations: stats.total || 0
        };
      }
      
      return {
        averageOverallScore: 0,
        averageRelevanceScore: 0,
        averageSafetyScore: 0,
        totalEvaluations: 0
      };
    } catch (error) {
      console.error('[AIService] Error getting quality score stats:', error);
      return {
        averageOverallScore: 0,
        averageRelevanceScore: 0,
        averageSafetyScore: 0,
        totalEvaluations: 0
      };
    }
  }
}

export default AIService.getInstance(); 