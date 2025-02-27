import { useState, useEffect, useCallback } from 'react';
import AIService from '../services/AIService';
import SafetyService from '../services/SafetyService';
import { 
  RecommendationRequest, 
  RecommendationResponse, 
  ChatMessage, 
  UserProfile,
  JournalEntry,
  SafetyValidationResult
} from '../types/ai';
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
  
  // Initialize services
  useEffect(() => {
    const initServices = async () => {
      try {
        await AIService.initialize();
        await SafetyService.initialize();
      } catch (err) {
        console.error('Error initializing AI or Safety services:', err);
        setError('Failed to initialize recommendation services');
      }
    };
    
    initServices();
    
    // Load cached recommendations if available
    loadCachedRecommendations();
    
    return () => {
      // Cleanup
      AIService.cleanup();
      SafetyService.cleanup();
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
      const validationResult = await SafetyService.validateRecommendationRequest(request);
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
      const rawRecommendations = await AIService.getStrainRecommendations(safeRequest);
      
      // Process recommendations through safety service
      const safeRecommendations = await SafetyService.processRecommendationResponse(
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
  }, []);
  
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
      
      // Get AI response
      const aiResponse = await AIService.getChatResponse(
        message,
        userProfile,
        chatHistory
      );
      
      // Add AI response to history
      setChatHistory(prev => [...prev, aiResponse]);
      
      setLoading(false);
      return aiResponse;
      
    } catch (err) {
      console.error('Error getting chat response:', err);
      setError('Failed to get response. Please try again later.');
      setLoading(false);
      return null;
    }
  }, [chatHistory]);
  
  // Analyze journal patterns
  const analyzeJournalPatterns = useCallback(async (
    entries: JournalEntry[],
    userProfile: UserProfile
  ) => {
    setLoading(true);
    setError(null);
    
    try {
      const analysis = await AIService.analyzeJournalPatterns(entries, userProfile);
      setLoading(false);
      return analysis;
      
    } catch (err) {
      console.error('Error analyzing journal patterns:', err);
      setError('Failed to analyze journal entries. Please try again later.');
      setLoading(false);
      return null;
    }
  }, []);
  
  // Clear chat history
  const clearChatHistory = useCallback(() => {
    setChatHistory([]);
  }, []);
  
  // Get safety history
  const getSafetyHistory = useCallback(async (userId: string) => {
    try {
      return await SafetyService.getSafetyHistory(userId);
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