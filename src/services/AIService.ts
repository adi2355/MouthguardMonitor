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

// Constants
const AI_USAGE_DB_NAME = "AIUsage";
const RECOMMENDATION_FEEDBACK_DB_NAME = "RecommendationFeedback";

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
  private initialized: boolean = false;
  private apiKey: string = ANTHROPIC_API_KEY;
  private baseUrl: string = ANTHROPIC_API_URL;
  private apiVersion: string = ANTHROPIC_API_VERSION;

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
      
      this.initialized = true;
      console.log('[AIService] Initialization complete');
    } catch (error) {
      console.error('[AIService] Initialization error:', error);
      throw error;
    }
  }

  // Cleanup resources
  async cleanup(): Promise<void> {
    if (this.db) await this.db.closeAsync();
    if (this.feedbackDb) await this.feedbackDb.closeAsync();
    this.initialized = false;
  }

  async getStrainRecommendations(request: RecommendationRequest): Promise<RecommendationResponse> {
    try {
      await this.ensureInitialized();
      console.log('[AIService] Processing strain recommendation request', request);
      
      // Check if we should use the real API or mock data
      if (this.apiKey && this.shouldUseRealAPI()) {
        return await this.authenticatedRequest(async () => {
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
            throw new Error(`Claude API error: ${errorData.error?.message || response.statusText}`);
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
      } else {
        // Use mock data for development or when API key is not available
        await this.simulateApiCall(500); // Simulate network delay
        
        // Generate mock recommendations based on the request
        const recommendations = this.generateMockRecommendations(
          request.desiredEffects,
          request.medicalNeeds,
          request.userProfile
        );
        
        return {
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
      }
    } catch (error) {
      console.error('[AIService] Error getting recommendations:', error);
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
      if (this.apiKey && this.shouldUseRealAPI()) {
        return await this.authenticatedRequest(async () => {
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
            throw new Error(`Claude API error: ${errorData.error?.message || response.statusText}`);
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
            role: 'assistant',
            timestamp: new Date().toISOString()
          };
        });
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
        
        return {
          id: `ai_${Date.now()}`,
          content: response,
          role: 'assistant',
          timestamp: new Date().toISOString()
        };
      }
    } catch (error) {
      console.error('[AIService] Error getting chat response:', error);
      
      // Return a fallback response
      return {
        id: `ai_error_${Date.now()}`,
        content: "I'm sorry, I encountered an error processing your request. Please try again later.",
        role: 'assistant',
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
  
  // Authenticated request with retry logic
  private async authenticatedRequest<T>(
    requestFn: () => Promise<T>,
    retryCount: number = 0
  ): Promise<T> {
    try {
      // Check if API key is valid
      if (!this.apiKey) {
        throw new Error('API key is not configured');
      }
      
      // Make the request
      return await requestFn();
    } catch (error: any) {
      // Handle different error types
      if (error.response) {
        // API responded with an error status
        const status = error.response.status;
        
        if (status === 401 || status === 403) {
          throw new Error('Authentication failed. Please check your API key.');
        } else if (status === 429) {
          // Rate limit exceeded
          if (retryCount < 3) {
            // Exponential backoff
            const delay = Math.pow(2, retryCount) * 1000;
            console.log(`Rate limit exceeded. Retrying in ${delay}ms...`);
            await new Promise(resolve => setTimeout(resolve, delay));
            return this.authenticatedRequest(requestFn, retryCount + 1);
          } else {
            throw new Error('Rate limit exceeded. Please try again later.');
          }
        } else if (status >= 500) {
          throw new Error('AI service is currently unavailable. Please try again later.');
        }
      }
      
      // Network or other errors
      console.error('[AIService] Request error:', error);
      throw new Error('Failed to communicate with AI service. Please check your connection.');
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
}

export default AIService.getInstance(); 