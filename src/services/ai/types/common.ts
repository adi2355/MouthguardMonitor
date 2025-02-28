// Constants
export const AI_USAGE_DB_NAME = "AIUsage";
export const RECOMMENDATION_FEEDBACK_DB_NAME = "RecommendationFeedback";
export const CACHE_DB_NAME = "AIResponseCache";

// Cache configuration
export const DEFAULT_CACHE_TTL = 24 * 60 * 60 * 1000; // 24 hours in milliseconds
export const MAX_CACHE_SIZE = 100; // Maximum number of cached responses

// Anthropic API constants
export const ANTHROPIC_API_URL = "https://api.anthropic.com/v1";
export const ANTHROPIC_API_VERSION = "2023-06-01";
// In a production app, you would use environment variables
// import { ANTHROPIC_API_KEY } from '@env';
// For now, we'll use a placeholder that you'll replace with your actual key
export const ANTHROPIC_API_KEY = "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"; // Replace this with your actual key

// Cache entry interface
export interface CacheEntry<T> {
  key: string;
  data: T;
  timestamp: number;
  expiresAt: number;
  ttl: number;
  hitCount: number;
  lastAccessed: number;
}

// Database entry interfaces
export interface CacheDbEntry {
  key: string;
  data: string;
  timestamp: number;
  expires_at: number;
  ttl: number;
  hit_count: number;
  last_accessed: number;
}

export interface KeyEntry {
  key: string;
}

export interface CountResult {
  count: number;
} 