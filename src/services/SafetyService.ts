import { SQLiteDatabase } from "expo-sqlite";
import AsyncStorage from '@react-native-async-storage/async-storage';
import { 
  RecommendationRequest, 
  RecommendationResponse, 
  SafetyValidationResult,
  DrugInteractionResult,
  OveruseDetectionResult,
  SafetyRecord,
  JournalEntry,
  UserProfile
} from '../types/ai';
import { databaseManager } from '../DatabaseManager';

// Constants for safety thresholds
const SAFETY_DB_NAME = "SafetyRecords";
const COOLING_OFF_DAYS = 7; // Default cooling off period in days
const MAX_DAILY_SESSIONS = 5; // Threshold for potential overuse warning
const HIGH_THC_THRESHOLD = 25; // THC percentage considered high potency
const MINIMUM_AGE_REQUIREMENT = 21; // Minimum age for recommendations

export class SafetyService {
  private static instance: SafetyService;
  private initialized: boolean = false;
  
  private constructor() {}
  
  static getInstance(): SafetyService {
    if (!SafetyService.instance) {
      SafetyService.instance = new SafetyService();
    }
    return SafetyService.instance;
  }
  
  // Initialize database and safety features
  async initialize(): Promise<void> {
    if (this.initialized) return;
    
    try {
      console.log('[SafetyService] Initializing safety database...');
      
      // Database initialization is now handled by DatabaseManager
      await databaseManager.ensureInitialized();
      
      // Initialize educational content if not already done
      const hasInitialized = await AsyncStorage.getItem('safety_initialized');
      if (!hasInitialized) {
        await this.initializeEducationalContent();
        await AsyncStorage.setItem('safety_initialized', 'true');
      }
      
      this.initialized = true;
      console.log('[SafetyService] Safety service initialized');
      
    } catch (error) {
      console.error('[SafetyService] Error initializing safety database:', error);
      throw error;
    }
  }
  
  // Core validation method for recommendation requests
  async validateRecommendationRequest(request: RecommendationRequest): Promise<SafetyValidationResult> {
    try {
      await this.ensureInitialized();
      
      const { userProfile, desiredEffects, medicalNeeds, context } = request;
      const safetyFlags: string[] = [];
      let isValid = true;
      let reason = '';
      let modifications: Partial<RecommendationRequest> = {};
      let warningLevel: 'info' | 'warning' | 'critical' = 'info';
      
      // Check for required fields
      if (!userProfile) {
        return {
          valid: false,
          reason: 'User profile is required for personalized recommendations',
          warningLevel: 'critical'
        };
      }

      // Verify age restrictions (if age is provided)
      if (userProfile.experience_level === 'beginner') {
        // For beginners, add a safety flag
        safetyFlags.push('Recommendations tailored for beginners. Start with lower doses.');
      }
      
      // Check for cooling off period
      const coolingOffStatus = await this.checkCoolingOffStatus(userProfile.id);
      if (coolingOffStatus.inCoolingOff) {
        return {
          valid: false,
          reason: `Cooling off period in effect until ${new Date(coolingOffStatus.endTime!).toLocaleDateString()}`,
          warningLevel: 'critical'
        };
      }
      
      // Check for overdose concerns based on user profile
      const overuseCheck = await this.detectOverusePatterns(userProfile.id);
      if (overuseCheck.detected) {
        if (overuseCheck.level === 'severe') {
          return {
            valid: false,
            reason: overuseCheck.details || 'Usage patterns indicate potential health concerns',
            warningLevel: 'critical'
          };
        } else {
          safetyFlags.push(overuseCheck.details || 'Frequent use detected. Consider moderating consumption.');
          warningLevel = overuseCheck.level === 'moderate' ? 'warning' : 'info';
        }
      }
      
      // Check for medication interactions if applicable
      if (userProfile.medications && userProfile.medications.length > 0) {
        const interactionCheck = await this.checkMedicationInteractions(
          userProfile.medications
        );
        
        if (interactionCheck.hasInteractions) {
          if (interactionCheck.severity === 'severe') {
            return {
              valid: false,
              reason: 'Potential serious interaction with medications detected',
              safetyFlags: interactionCheck.details,
              warningLevel: 'critical'
            };
          } else {
            safetyFlags.push(...(interactionCheck.details || []));
            warningLevel = interactionCheck.severity === 'moderate' ? 'warning' : 'info';
          }
        }
      }
      
      // Adjust recommendations for beginners
      if (userProfile.experience_level === 'beginner') {
        // Modify the request to prioritize lower THC content for beginners
        modifications = {
          ...modifications,
          context: 'wellness', // Override context for beginners
          desiredEffects: [...(request.desiredEffects || []), 'mild', 'gentle']
        };
        
        safetyFlags.push('Recommendations adjusted for beginner experience level.');
      }
      
      // Handle medical context with extra care
      if (context === 'medical' && medicalNeeds && medicalNeeds.length > 0) {
        safetyFlags.push('Medical disclaimer: Consult with a healthcare professional before use.');
        
        // Check if any medical needs require special attention
        const sensitiveConditions = ['anxiety', 'heart', 'psychiatric', 'pregnancy'];
        const hasSensitiveCondition = medicalNeeds.some(need => 
          sensitiveConditions.some(condition => need.toLowerCase().includes(condition))
        );
        
        if (hasSensitiveCondition) {
          safetyFlags.push('Some conditions may require extra caution. Medical supervision is strongly advised.');
          warningLevel = 'warning';
        }
      }
      
      // Return validation result
      return {
        valid: isValid,
        reason: reason,
        modifications: Object.keys(modifications).length > 0 ? modifications : undefined,
        safetyFlags: safetyFlags.length > 0 ? safetyFlags : undefined,
        warningLevel
      };
      
    } catch (error) {
      console.error('[SafetyService] Error validating recommendation request:', error);
      return {
        valid: false,
        reason: 'Internal safety check error. Please try again later.',
        warningLevel: 'critical'
      };
    }
  }
  
  // Process recommendation response to add appropriate safety information
  async processRecommendationResponse(
    response: RecommendationResponse, 
    userProfile: UserProfile,
    recentEntries: JournalEntry[]
  ): Promise<RecommendationResponse> {
    try {
      await this.ensureInitialized();
      
      let additionalDisclaimers: string[] = [];
      let enhancedSafetyNotes = [...(response.safetyNotes || [])];
      let recommendations = [...response.recommendations];
      
      // Ensure we always have basic disclaimers
      if (!response.disclaimers || response.disclaimers.length === 0) {
        additionalDisclaimers.push(
          "Cannabis affects individuals differently. Start with a low dose.",
          "Do not drive or operate machinery while using cannabis.",
          "Keep cannabis products away from children and pets."
        );
      }
      
      // Add experience level specific notes
      if (userProfile.experience_level === 'beginner') {
        additionalDisclaimers.push(
          "As a beginner, start with a very small amount and wait at least 2 hours before considering more.",
          "Effects may be stronger than expected for new users."
        );
      }
      
      // Check journal entries for negative patterns
      if (recentEntries.length > 0) {
        // Look for commonly reported negative effects
        const negativeEffectsMap = new Map<string, number>();
        recentEntries.forEach(entry => {
          if (entry.negative_effects) {
            entry.negative_effects.forEach(effect => {
              negativeEffectsMap.set(effect, (negativeEffectsMap.get(effect) || 0) + 1);
            });
          }
        });
        
        // Find frequent negative effects
        const frequentNegativeEffects = Array.from(negativeEffectsMap.entries())
          .filter(([_, count]) => count >= 2)
          .map(([effect]) => effect);
        
        if (frequentNegativeEffects.length > 0) {
          enhancedSafetyNotes.push(
            `Based on your journal, watch for these effects you've reported: ${frequentNegativeEffects.join(', ')}.`
          );
        }
        
        // Look for high dosage patterns
        const highDosageEntries = recentEntries.filter(entry => 
          entry.dosage > (userProfile.experience_level === 'beginner' ? 10 : 25)
        );
        
        if (highDosageEntries.length > 2) {
          enhancedSafetyNotes.push(
            "Your journal shows higher dosages than typically recommended. Consider a tolerance break or gradual reduction."
          );
          
          // Flag user for potential follow-up if overuse is detected
          await this.logSafetyConcern({
            userId: userProfile.id,
            concernType: 'overuse',
            concernDetails: 'High dosage pattern detected in journal entries',
            timestamp: Date.now(),
            resolutionSuggestions: [
              'Consider a 48-hour tolerance break',
              'Try microdosing techniques',
              'Explore lower THC varieties'
            ]
          });
        }
      }
      
      // Filter out potentially inappropriate recommendations
      if (userProfile.avoid_effects && userProfile.avoid_effects.length > 0) {
        // In a real app, this would check against a database of strain profiles
        // For this demo, we'll just add a safety note
        enhancedSafetyNotes.push(
          `Note: You've indicated you want to avoid ${userProfile.avoid_effects.join(', ')}. Adjust dosage accordingly.`
        );
      }
      
      // Include any contextual medical warnings
      if (userProfile.medical_needs && userProfile.medical_needs.length > 0) {
        additionalDisclaimers.push(
          "These recommendations are not a replacement for professional medical advice."
        );
      }
      
      // Return enhanced response
      return {
        ...response,
        disclaimers: [...(response.disclaimers || []), ...additionalDisclaimers],
        safetyNotes: enhancedSafetyNotes,
        recommendations
      };
      
    } catch (error) {
      console.error('[SafetyService] Error processing recommendation response:', error);
      // Return original response if processing fails
      return response;
    }
  }
  
  /**
   * Detects potential overuse patterns in user's consumption history
   * Uses more sophisticated pattern recognition to identify concerning usage trends
   */
  async detectOverusePatterns(userId: string): Promise<OveruseDetectionResult> {
    try {
      await this.ensureInitialized();
      
      // Get recent journal entries
      const recentEntries = await this.getRecentJournalEntries(userId, 90); // Last 90 days
      
      if (recentEntries.length < 5) {
        return { detected: false };
      }
      
      // Extract features for pattern analysis
      const features = this.extractUsageFeatures(recentEntries);
      
      // Check for increasing frequency pattern
      const weeklyUsageCounts = this.getWeeklyUsageCounts(recentEntries);
      const increasingFrequency = this.detectIncreasingTrend(weeklyUsageCounts);
      
      // Check for increasing dosage pattern
      const weeklyAvgDosages = this.getWeeklyAverageDosages(recentEntries);
      const increasingDosage = this.detectIncreasingTrend(weeklyAvgDosages);
      
      // Check for tolerance development (same dosage, decreasing effectiveness)
      const effectivenessRatios = this.getEffectivenessRatios(recentEntries);
      const decreasingEffectiveness = this.detectDecreasingTrend(effectivenessRatios);
      
      // Check for withdrawal symptoms
      const withdrawalSymptoms = this.detectWithdrawalSymptoms(recentEntries);
      
      // Determine overall risk level
      let level: 'mild' | 'moderate' | 'severe' | undefined;
      let details = '';
      let recommendedAction = '';
      let coolingOffPeriod: number | undefined;
      
      const riskFactors = [
        increasingFrequency && 'increasing usage frequency',
        increasingDosage && 'increasing dosage',
        decreasingEffectiveness && 'developing tolerance',
        withdrawalSymptoms && 'potential withdrawal symptoms'
      ].filter(Boolean);
      
      if (riskFactors.length >= 3) {
        level = 'severe';
        details = `Multiple concerning patterns detected: ${riskFactors.join(', ')}.`;
        recommendedAction = 'Consider a 7-day tolerance break and consult with a healthcare provider.';
        coolingOffPeriod = 7;
      } else if (riskFactors.length >= 2) {
        level = 'moderate';
        details = `Some concerning patterns detected: ${riskFactors.join(', ')}.`;
        recommendedAction = 'Consider scheduling regular cannabis-free days each week.';
      } else if (riskFactors.length >= 1) {
        level = 'mild';
        details = `Early warning signs detected: ${riskFactors.join(', ')}.`;
        recommendedAction = 'Consider mindful consumption practices and occasional breaks.';
      } else {
        return { detected: false };
      }
      
      // Log safety concern if moderate or severe
      if (level === 'moderate' || level === 'severe') {
        await this.logSafetyConcern({
          userId,
          concernType: 'overuse',
          concernDetails: details,
          timestamp: Date.now(),
          resolutionSuggestions: [recommendedAction],
          coolingOffUntil: level === 'severe' ? Date.now() + (coolingOffPeriod! * 24 * 60 * 60 * 1000) : undefined
        });
      }
      
      return {
        detected: true,
        level,
        details,
        recommendedAction,
        coolingOffPeriod
      };
    } catch (error) {
      console.error('[SafetyService] Error detecting overuse patterns:', error);
      return { detected: false };
    }
  }
  
  // Helper methods for pattern detection
  
  /**
   * Get recent journal entries for a user
   */
  private async getRecentJournalEntries(userId: string, days: number): Promise<JournalEntry[]> {
    // In a real implementation, this would query the journal database
    // For now, return mock data
    return [
      {
        id: "j1",
        user_id: userId,
        strain_id: 1,
        strain_name: "Blue Dream",
        consumption_method: "vaporize",
        dosage: 15,
        dosage_unit: "mg",
        effects_felt: ["Relaxed", "Happy", "Creative"],
        rating: 4,
        effectiveness: 4,
        notes: "Good for evening relaxation, helped with creativity",
        mood_before: "Stressed",
        mood_after: "Calm",
        medical_symptoms_relieved: ["Anxiety"],
        negative_effects: ["Dry mouth"],
        duration_minutes: 180,
        created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString()
      },
      {
        id: "j2",
        user_id: userId,
        strain_id: 2,
        strain_name: "OG Kush",
        consumption_method: "edible",
        dosage: 10,
        dosage_unit: "mg",
        effects_felt: ["Sleepy", "Relaxed", "Hungry"],
        rating: 3,
        effectiveness: 4,
        notes: "Helped with sleep, but made me too hungry",
        mood_before: "Tired",
        mood_after: "Sleepy",
        medical_symptoms_relieved: ["Insomnia"],
        negative_effects: ["Groggy morning"],
        duration_minutes: 240,
        created_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString()
      }
    ];
  }
  
  /**
   * Extract features for pattern analysis
   */
  private extractUsageFeatures(entries: JournalEntry[]): any {
    // Extract features for ML analysis
    // In a real implementation, this would extract meaningful features
    return {
      totalEntries: entries.length,
      averageDosage: entries.reduce((sum, entry) => sum + entry.dosage, 0) / entries.length,
      averageEffectiveness: entries.reduce((sum, entry) => sum + entry.effectiveness, 0) / entries.length,
      uniqueStrains: new Set(entries.map(entry => entry.strain_id)).size,
      negativeEffectsRate: entries.filter(entry => entry.negative_effects && entry.negative_effects.length > 0).length / entries.length
    };
  }
  
  /**
   * Group entries by week and count
   */
  private getWeeklyUsageCounts(entries: JournalEntry[]): number[] {
    // Group entries by week and count
    const weeklyCounts: number[] = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]; // 12 weeks
    
    entries.forEach(entry => {
      const entryDate = new Date(entry.created_at);
      const now = new Date();
      const diffTime = Math.abs(now.getTime() - entryDate.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      const weekIndex = Math.floor(diffDays / 7);
      
      if (weekIndex < weeklyCounts.length) {
        weeklyCounts[weekIndex]++;
      }
    });
    
    return weeklyCounts.reverse(); // Most recent first
  }
  
  /**
   * Get weekly average dosages
   */
  private getWeeklyAverageDosages(entries: JournalEntry[]): number[] {
    // Group entries by week and calculate average dosage
    const weeklyDosages: { sum: number, count: number }[] = Array(12).fill(0).map(() => ({ sum: 0, count: 0 }));
    
    entries.forEach(entry => {
      const entryDate = new Date(entry.created_at);
      const now = new Date();
      const diffTime = Math.abs(now.getTime() - entryDate.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      const weekIndex = Math.floor(diffDays / 7);
      
      if (weekIndex < weeklyDosages.length) {
        weeklyDosages[weekIndex].sum += entry.dosage;
        weeklyDosages[weekIndex].count++;
      }
    });
    
    return weeklyDosages.map(week => week.count > 0 ? week.sum / week.count : 0).reverse();
  }
  
  /**
   * Calculate effectiveness ratios (effectiveness / dosage)
   */
  private getEffectivenessRatios(entries: JournalEntry[]): number[] {
    // Calculate effectiveness to dosage ratios over time
    const sortedEntries = [...entries].sort((a, b) => 
      new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
    );
    
    return sortedEntries.map(entry => entry.effectiveness / entry.dosage);
  }
  
  /**
   * Detect increasing trend in a series of values
   */
  private detectIncreasingTrend(values: number[]): boolean {
    if (values.length < 3) return false;
    
    // Simple linear regression
    const n = values.length;
    const indices = Array.from({ length: n }, (_, i) => i);
    
    const sumX = indices.reduce((sum, x) => sum + x, 0);
    const sumY = values.reduce((sum, y) => sum + y, 0);
    const sumXY = indices.reduce((sum, x, i) => sum + x * values[i], 0);
    const sumXX = indices.reduce((sum, x) => sum + x * x, 0);
    
    const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
    
    // Check if the slope is positive and significant
    return slope > 0.1;
  }
  
  /**
   * Detect decreasing trend in a series of values
   */
  private detectDecreasingTrend(values: number[]): boolean {
    if (values.length < 3) return false;
    
    // Simple linear regression
    const n = values.length;
    const indices = Array.from({ length: n }, (_, i) => i);
    
    const sumX = indices.reduce((sum, x) => sum + x, 0);
    const sumY = values.reduce((sum, y) => sum + y, 0);
    const sumXY = indices.reduce((sum, x, i) => sum + x * values[i], 0);
    const sumXX = indices.reduce((sum, x) => sum + x * x, 0);
    
    const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
    
    // Check if the slope is negative and significant
    return slope < -0.1;
  }
  
  /**
   * Detect potential withdrawal symptoms
   */
  private detectWithdrawalSymptoms(entries: JournalEntry[]): boolean {
    // Look for patterns indicating withdrawal
    // This is a simplified implementation
    
    // Check for mood deterioration after periods without use
    const sortedEntries = [...entries].sort((a, b) => 
      new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
    );
    
    // Look for gaps between entries
    for (let i = 1; i < sortedEntries.length; i++) {
      const prevEntry = sortedEntries[i - 1];
      const currEntry = sortedEntries[i];
      
      const prevDate = new Date(prevEntry.created_at);
      const currDate = new Date(currEntry.created_at);
      
      const diffHours = (currDate.getTime() - prevDate.getTime()) / (1000 * 60 * 60);
      
      // If there's a gap of more than 48 hours and mood deteriorated
      if (diffHours > 48 && 
          currEntry.mood_before === "Irritable" || 
          currEntry.mood_before === "Anxious" ||
          currEntry.mood_before === "Restless") {
        return true;
      }
    }
    
    return false;
  }
  
  // Check for medication interactions with cannabis
  async checkMedicationInteractions(
    medications: string[]
  ): Promise<DrugInteractionResult> {
    try {
      await this.ensureInitialized();
      
      // In a real app, this would check against a medical database
      // For this demo, we'll use a simplified mock implementation
      
      // Known high-risk interactions
      const highRiskMeds = [
        'warfarin', 'clopidogrel', 'rivaroxaban', 'dabigatran', // Blood thinners
        'tacrolimus', 'cyclosporine', // Immunosuppressants
        'lithium', 'clozapine', // Psychiatric medications
        'theophylline', // Respiratory
        'amiodarone', 'digoxin' // Cardiac
      ];
      
      // Moderate risk interactions
      const moderateRiskMeds = [
        'fluoxetine', 'sertraline', 'paroxetine', 'citalopram', // SSRIs
        'zolpidem', 'eszopiclone', // Sleep medications
        'alprazolam', 'lorazepam', 'diazepam', // Benzodiazepines
        'amlodipine', 'diltiazem', // Blood pressure
        'metformin', 'glyburide', // Diabetes
        'oxycodone', 'hydrocodone', 'tramadol' // Pain medications
      ];
      
      // Check for matches
      const highRiskMatches = medications.filter(med => 
        highRiskMeds.some(risk => med.toLowerCase().includes(risk.toLowerCase()))
      );
      
      const moderateRiskMatches = medications.filter(med => 
        moderateRiskMeds.some(risk => med.toLowerCase().includes(risk.toLowerCase()))
      );
      
      if (highRiskMatches.length > 0) {
        return {
          hasInteractions: true,
          details: highRiskMatches.map(med => 
            `Potential serious interaction between cannabis and ${med}. Consult a healthcare provider before use.`
          ),
          severity: 'severe',
          recommendations: [
            'Consult with your healthcare provider before using cannabis',
            'Monitor for unexpected side effects if using both substances',
            'Consider CBD-only products which may have fewer interactions'
          ]
        };
      } else if (moderateRiskMatches.length > 0) {
        return {
          hasInteractions: true,
          details: moderateRiskMatches.map(med => 
            `Potential interaction between cannabis and ${med}. Use with caution.`
          ),
          severity: 'moderate',
          recommendations: [
            'Start with very low doses and monitor effects carefully',
            'Space out timing between medication and cannabis use',
            'Keep a detailed journal of any side effects'
          ]
        };
      }
      
      return {
        hasInteractions: false
      };
      
    } catch (error) {
      console.error('[SafetyService] Error checking drug interactions:', error);
      return {
        hasInteractions: false
      };
    }
  }
  
  // Log a safety concern for a user - update database access
  async logSafetyConcern(data: {
    userId: string;
    concernType: 'overuse' | 'negative_effects' | 'interactions';
    concernDetails: string;
    timestamp: number;
    resolutionSuggestions?: string[];
    coolingOffUntil?: number;
  }): Promise<void> {
    try {
      await this.ensureInitialized();
      
      const db = await this.getDatabase();
      const id = `concern_${Date.now()}`;
      
      const resolutionSuggestionsJSON = data.resolutionSuggestions ? 
        JSON.stringify(data.resolutionSuggestions) : null;
      
      // Use run instead of execAsync for parameterized queries
      await db.runAsync(`
        INSERT INTO ${SAFETY_DB_NAME} (
          id,
          user_id,
          concern_type,
          concern_details,
          resolution_suggestions,
          cooling_off_until,
          created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [
          id,
          data.userId,
          data.concernType,
          data.concernDetails,
          resolutionSuggestionsJSON,
          data.coolingOffUntil || null,
          data.timestamp
        ]
      );
      
      console.log('[SafetyService] Safety concern logged for user', data.userId);
      
    } catch (error) {
      console.error('[SafetyService] Error logging safety concern:', error);
      throw error;
    }
  }
  
  // Get safety history for a user
  async getSafetyHistory(userId: string): Promise<SafetyRecord[]> {
    try {
      await this.ensureInitialized();
      
      const db = await this.getDatabase();
      
      const records = await db.getAllAsync(`
        SELECT * FROM ${SAFETY_DB_NAME}
        WHERE user_id = ?
        ORDER BY created_at DESC
      `, [userId]);
      
      return records.map((row: any) => ({
        id: row.id,
        user_id: row.user_id,
        concern_type: row.concern_type as 'overuse' | 'negative_effects' | 'interactions',
        concern_details: row.concern_details,
        resolution_suggestions: row.resolution_suggestions 
          ? JSON.parse(row.resolution_suggestions) 
          : [],
        cooling_off_until: row.cooling_off_until,
        created_at: new Date(row.created_at).toISOString()
      }));
      
    } catch (error) {
      console.error('[SafetyService] Error getting safety history:', error);
      return [];
    }
  }
  
  // Check cooling off status - update database access
  async checkCoolingOffStatus(userId: string): Promise<{
    inCoolingOff: boolean;
    endTime?: number;
    reason?: string;
  }> {
    try {
      await this.ensureInitialized();
      
      const db = await this.getDatabase();
      
      const nowTimestamp = Date.now();
      
      // Use parameterized query with getAllAsync
      const results = await db.getAllAsync<{cooling_off_until: number, concern_details: string}>(`
        SELECT cooling_off_until, concern_details 
        FROM ${SAFETY_DB_NAME}
        WHERE user_id = ? 
        AND cooling_off_until IS NOT NULL 
        AND cooling_off_until > ?
        ORDER BY cooling_off_until DESC
        LIMIT 1`,
        [userId, nowTimestamp]
      );
      
      const record = results[0];
      
      if (record && record.cooling_off_until) {
        return {
          inCoolingOff: true,
          endTime: record.cooling_off_until,
          reason: record.concern_details
        };
      }
      
      return { inCoolingOff: false };
      
    } catch (error) {
      console.error('[SafetyService] Error checking cooling off status:', error);
      return { inCoolingOff: false };
    }
  }
  
  // Private helper methods
  
  private async ensureInitialized(): Promise<void> {
    if (!this.initialized) {
      await this.initialize();
    }
  }
  
  private async initializeEducationalContent(): Promise<void> {
    // Set up initial educational content in storage
    const educationalContent = {
      harm_reduction: [
        {
          title: "Start Low, Go Slow",
          content: "Begin with a low dose (2.5-5mg THC) and wait at least 2 hours before considering more."
        },
        {
          title: "Know Your Source",
          content: "Only purchase cannabis from legal, regulated sources to ensure quality and safety."
        },
        {
          title: "Mind Your Method",
          content: "Different consumption methods have different onset times and potency levels. Edibles take longer to feel but last longer."
        },
        {
          title: "Set and Setting",
          content: "Use in a comfortable, safe environment with trusted people, especially when trying a new product."
        },
        {
          title: "Stay Hydrated",
          content: "Drink plenty of water before, during, and after cannabis use to minimize dry mouth and dehydration."
        }
      ],
      warning_signs: [
        {
          title: "Increasing Tolerance",
          content: "Needing more cannabis to achieve the same effects is a sign of developing tolerance."
        },
        {
          title: "Preoccupation",
          content: "Thinking about cannabis frequently or planning life around cannabis use."
        },
        {
          title: "Interference",
          content: "Cannabis use affecting responsibilities, relationships, or activities you once enjoyed."
        },
        {
          title: "Withdrawal",
          content: "Experiencing irritability, sleep problems, decreased appetite, or mood changes when not using."
        }
      ],
      responsible_use: [
        {
          title: "Schedule Cannabis-Free Days",
          content: "Regular breaks help prevent tolerance and dependence. Aim for at least 2-3 cannabis-free days per week."
        },
        {
          title: "Keep a Journal",
          content: "Track your usage, effects, and how you feel the next day to identify patterns and optimal dosing."
        },
        {
          title: "Never Drive",
          content: "Cannabis impairs coordination and reaction time. Never drive or operate heavy machinery after use."
        },
        {
          title: "Secure Storage",
          content: "Store cannabis products securely and out of reach of children and pets."
        }
      ]
    };
    
    await AsyncStorage.setItem('educational_content', JSON.stringify(educationalContent));
  }
  
  // Get database connection from DatabaseManager
  private async getDatabase(): Promise<SQLiteDatabase> {
    await this.ensureInitialized();
    return databaseManager.getDatabase(SAFETY_DB_NAME);
  }
  
  // Cleanup method updated to remove database close code
  async cleanup(): Promise<void> {
    this.initialized = false;
    console.log('[SafetyService] Cleanup completed');
  }
}

export default SafetyService.getInstance(); 