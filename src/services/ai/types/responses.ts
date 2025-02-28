import { DosageSuggestion, StrainRecommendation } from '../../../types/ai';

export interface RecommendationResponse {
  recommendations: StrainRecommendation[];
  reasoning: string;
  confidenceScore: number;
  disclaimers: string[];
  dosageSuggestion?: DosageSuggestion;
  safetyNotes?: string[];
  error?: {
    message: string;
    type: string;
    recoverable: boolean;
  };
  // Adding responseId to fix the type issue in evaluateResponseQuality
  responseId?: string;
}

export interface ChatResponse {
  response: string;
  educationalLinks?: string[];
  disclaimers?: string[];
  regulatoryNotes?: string[];
  followUpSuggestions?: string[];
}

export interface JournalAnalysisResult {
  patterns: string[];
  insights: string[];
  recommendations: string[];
  safetyFlags?: string[];
}

export interface SafetyValidationResult {
  valid: boolean;
  reason?: string;
  modifications?: any; // Using any instead of Partial<RecommendationRequest> to avoid circular dependency
  safetyFlags?: string[];
  warningLevel?: 'info' | 'warning' | 'critical';
}

export interface DrugInteractionResult {
  hasInteractions: boolean;
  details?: string[];
  severity?: 'mild' | 'moderate' | 'severe';
  recommendations?: string[];
}

export interface OveruseDetectionResult {
  detected: boolean;
  level?: 'mild' | 'moderate' | 'severe';
  details?: string;
  recommendedAction?: string;
  coolingOffPeriod?: number; // in days
} 