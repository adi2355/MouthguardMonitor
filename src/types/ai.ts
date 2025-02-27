// AI recommendation system types
export interface UserProfile {
  id: string;
  experience_level: 'beginner' | 'intermediate' | 'experienced';
  preferred_effects: string[];
  medical_needs?: string[];
  avoid_effects?: string[];
  preferred_consumption_method?: string;
  thc_tolerance?: number; // Scale 1-10
  medications?: string[];
  created_at: string;
  updated_at: string;
}

export interface ChatMessage {
  id: string;
  content: string;
  role: 'user' | 'assistant';
  timestamp: string;
}

export interface JournalEntry {
  id: string;
  user_id: string;
  strain_id: number;
  strain_name: string;
  consumption_method: string;
  dosage: number;
  dosage_unit: string;
  effects_felt: string[];
  rating: number;
  effectiveness: number;
  notes?: string;
  mood_before?: string;
  mood_after?: string;
  medical_symptoms_relieved?: string[];
  negative_effects?: string[];
  duration_minutes?: number;
  created_at: string;
}

export interface RecommendationRequest {
  userProfile: UserProfile;
  journalEntries?: JournalEntry[];
  desiredEffects: string[];
  medicalNeeds?: string[];
  context?: 'recreational' | 'medical' | 'wellness';
  locationCode?: string; // For regulations
}

export interface StrainRecommendation {
  strainId: number;
  strainName: string;
  matchScore: number; // 0-100
  reasoningFactors: {
    factor: string;
    weight: number;
  }[];
  alternativeStrains?: {
    strainId: number;
    strainName: string;
    reason: string;
  }[];
}

export interface DosageSuggestion {
  minDosage: number;
  maxDosage: number;
  unit: string;
  gradualApproach: boolean;
  notes: string;
}

export interface RecommendationResponse {
  recommendations: StrainRecommendation[];
  reasoning: string;
  confidenceScore: number;
  disclaimers: string[];
  dosageSuggestion?: DosageSuggestion;
  safetyNotes?: string[];
}

export interface ChatRequest {
  message: string;
  userProfile: UserProfile;
  locationCode?: string;
  previousMessages?: {
    role: 'user' | 'assistant';
    content: string;
  }[];
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
  modifications?: Partial<RecommendationRequest>;
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

export interface SafetyRecord {
  id: string;
  user_id: string;
  concern_type: 'overuse' | 'negative_effects' | 'interactions';
  concern_details: string;
  resolution_suggestions: string[];
  cooling_off_until: number | null;
  created_at: string;
} 