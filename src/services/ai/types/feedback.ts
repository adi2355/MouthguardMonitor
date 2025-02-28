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

// Database-specific interfaces for feedback
export interface PatternEntry {
  pattern_id: string;
  user_profile_factors: string;
  request_factors: string;
  positive_outcome_rate: number;
  sample_size: number;
}

export interface FeedbackStats {
  total: number;
  positive: number;
  relevance_sum: number;
}

export interface QualityStats {
  avg_overall: number;
  avg_relevance: number;
  avg_safety: number;
  total: number;
} 