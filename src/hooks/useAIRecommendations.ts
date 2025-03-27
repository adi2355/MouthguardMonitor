import { useState, useEffect, useCallback, useRef } from 'react';
import { AIService } from '../services/ai';
import { ChatRequest } from '../services/ai/types/requests';
import { databaseManager } from '../DatabaseManager';
import { 
  RecommendationRequest, 
  RecommendationResponse, 
  ChatMessage, 
  UserProfile,
  JournalEntry,
  SafetyValidationResult,
  SafetyRecord
} from '../types';
import { DatabaseResponse } from '../types';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Cache keys
const RECOMMENDATIONS_CACHE_KEY = 'ai_recommendations_cache';
const RECOMMENDATIONS_CACHE_EXPIRY = 24 * 60 * 60 * 1000; // 24 hours

export const useAIRecommendations = () => {
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [recommendations, setRecommendations] = useState<RecommendationResponse | null>(null);
  const [safetyValidation, setSafetyValidation] = useState<SafetyValidationResult | null>(null);
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  
  // Track initialization state
  const isInitialized = useRef<boolean>(false);
  const cleanupCalled = useRef<boolean>(false);
  
  // Get AIService instance
  const aiService = AIService.getInstance();
  
  // Initialize services
  useEffect(() => {
    const initServices = async () => {
      if (isInitialized.current) return;
      
      try {
        // First ensure database is initialized
        await databaseManager.ensureInitialized();
        
        // Then initialize AI service
        await aiService.initialize();
        
        isInitialized.current = true;
        
        // Load cached recommendations only after initialization
        await loadCachedRecommendations();
      } catch (err) {
        console.error('Error initializing AI or Database services:', err);
        setError('Failed to initialize recommendation services');
      }
    };
    
    initServices();
    
    return () => {
      // Cleanup only if not already called
      if (!cleanupCalled.current) {
        cleanupCalled.current = true;
      }
    };
  }, []);
  
  // Load cached recommendations
  const loadCachedRecommendations = async () => {
    try {
      const cachedData = await AsyncStorage.getItem(RECOMMENDATIONS_CACHE_KEY);
      
      if (cachedData) {
        const { recommendations: cachedRecommendations, timestamp } = JSON.parse(cachedData);
        
        // Check if cache is still valid
        if (Date.now() - timestamp < RECOMMENDATIONS_CACHE_EXPIRY) {
          setRecommendations(cachedRecommendations);
        }
      }
    } catch (err) {
      console.warn('Error loading cached recommendations:', err);
      // Non-critical error, don't set error state
    }
  };
  
  // Cache recommendations
  const cacheRecommendations = async (recommendations: RecommendationResponse) => {
    try {
      await AsyncStorage.setItem(
        RECOMMENDATIONS_CACHE_KEY,
        JSON.stringify({
          recommendations,
          timestamp: Date.now()
        })
      );
    } catch (err) {
      console.warn('Error caching recommendations:', err);
      // Non-critical error, don't set error state
    }
  };
  
  // Get strain recommendations with safety checks
  const getRecommendations = useCallback(async (
    request: RecommendationRequest,
    recentEntries: JournalEntry[] = []
  ): Promise<RecommendationResponse | null> => {
    setLoading(true);
    setError(null);
    
    try {
      // Validate request for safety concerns
      const validationResult = await databaseManager.validateRecommendationRequest(request);
      setSafetyValidation(validationResult);
      
      // If request is invalid due to safety concerns, return early
      if (!validationResult.valid) {
        setError(validationResult.reason || 'Request failed safety validation');
        setLoading(false);
        return null;
      }
      
      // Apply any safety modifications to the request
      const safeRequest = validationResult.modifications 
        ? { ...request, ...validationResult.modifications }
        : request;
      
      // Get recommendations from AI service
      const rawRecommendations = await aiService.getRecommendations(safeRequest);
      
      // Process recommendations through safety service
      const safeRecommendations = await databaseManager.processRecommendationResponse(
        rawRecommendations,
        request.userProfile,
        recentEntries
      );
      
      // Update state and cache
      setRecommendations(safeRecommendations);
      cacheRecommendations(safeRecommendations);
      
      setLoading(false);
      return safeRecommendations;
      
    } catch (err) {
      console.error('Error getting recommendations:', err);
      setError('Failed to get recommendations. Please try again later.');
      setLoading(false);
      return null;
    }
  }, [aiService]);
  
  // Get chat response
  const getChatResponse = useCallback(async (
    message: string,
    userProfile: UserProfile
  ): Promise<ChatMessage | null> => {
    setLoading(true);
    setError(null);
    
    try {
      // Add user message to history
      const userMessage: ChatMessage = {
        id: `user_${Date.now()}`,
        content: message,
        role: 'user',
        timestamp: new Date().toISOString()
      };
      
      setChatHistory(prev => [...prev, userMessage]);
      
      // Create chat request - convert ChatMessage to the simplified format expected by AIService
      const chatRequest: ChatRequest = {
        message,
        userProfile,
        // Only include the role and content properties that AIService needs
        previousMessages: chatHistory.length > 0 
          ? chatHistory.map(msg => ({ 
              role: msg.role, 
              content: msg.content 
            })) as any // Use type assertion to bypass the type check
          : undefined
      };
      
      // Get AI response
      const aiResponseData = await aiService.getChatResponse(chatRequest);
      
      // Create chat message from response
      const aiResponseMessage: ChatMessage = {
        id: `assistant_${Date.now()}`,
        content: aiResponseData.response,
        role: 'assistant',
        timestamp: new Date().toISOString()
      };
      
      // Add AI response to history
      setChatHistory(prev => [...prev, aiResponseMessage]);
      
      setLoading(false);
      return aiResponseMessage;
      
    } catch (err) {
      console.error('Error getting chat response:', err);
      setError('Failed to get response. Please try again later.');
      setLoading(false);
      return null;
    }
  }, [chatHistory, aiService]);
  
  // Analyze journal patterns
  const analyzeJournalPatterns = useCallback(async (
    entries: JournalEntry[],
    userProfile: UserProfile
  ) => {
    setLoading(true);
    setError(null);
    
    try {
      const analysis = await aiService.analyzeJournalEntries(userProfile.id, entries);
      setLoading(false);
      return analysis;
      
    } catch (err) {
      console.error('Error analyzing journal patterns:', err);
      setError('Failed to analyze journal entries. Please try again later.');
      setLoading(false);
      return null;
    }
  }, [aiService]);
  
  // Clear chat history
  const clearChatHistory = useCallback(() => {
    setChatHistory([]);
  }, []);
  
  // Get safety history
  const getSafetyHistory = useCallback(async (userId: string) => {
    try {
      return await databaseManager.getSafetyHistory(userId);
    } catch (err) {
      console.error('Error getting safety history:', err);
      return [];
    }
  }, []);
  
  return {
    loading,
    error,
    recommendations,
    safetyValidation,
    chatHistory,
    getRecommendations,
    getChatResponse,
    analyzeJournalPatterns,
    clearChatHistory,
    getSafetyHistory
  };
};

export default useAIRecommendations; 