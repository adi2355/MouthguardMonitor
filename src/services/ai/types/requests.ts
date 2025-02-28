import { UserProfile, JournalEntry, ChatMessage } from '../../../types/ai';

export interface RecommendationRequest {
  userProfile: UserProfile;
  journalEntries?: JournalEntry[];
  desiredEffects: string[];
  medicalNeeds?: string[];
  context?: 'recreational' | 'medical' | 'wellness';
  locationCode?: string; // For regulations
}

export interface ChatRequest {
  message: string;
  userProfile: UserProfile;
  locationCode?: string;
  previousMessages?: ChatMessage[];
} 