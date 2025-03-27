import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  Alert,
  TextInput
} from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import useAIRecommendations from '../../src/hooks/useAIRecommendations';
import { RecommendationRequest, StrainRecommendation, UserProfile } from '../../src/types';
import { COLORS } from '../../src/constants';
import LoadingView from '../components/shared/LoadingView';
import ErrorView from '../components/shared/ErrorView';

// Extended StrainRecommendation for UI purposes
interface UIStrainRecommendation extends StrainRecommendation {
  name: string;
  type: string;
  effects: string[];
  reason: string;
}

// Mock user profile for demo purposes
const mockUserProfile: UserProfile = {
  id: 'user123',
  experience_level: 'intermediate',
  preferred_effects: ['relaxed', 'creative', 'uplifted'],
  medical_needs: ['stress', 'mild pain'],
  medications: [],
  avoid_effects: ['anxiety', 'paranoia'],
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString()
};

export default function RecommendationsScreen() {
  const router = useRouter();
  const { 
    loading, 
    error, 
    recommendations, 
    safetyValidation,
    getRecommendations 
  } = useAIRecommendations();
  
  const [desiredEffects, setDesiredEffects] = useState<string[]>(['relaxed', 'creative']);
  const [context, setContext] = useState<'recreational' | 'medical'>('recreational');
  const [customEffect, setCustomEffect] = useState('');
  
  // Fetch recommendations on initial load
  useEffect(() => {
    fetchRecommendations();
  }, []);
  
  // Handle fetching recommendations
  const fetchRecommendations = async () => {
    const request: RecommendationRequest = {
      userProfile: mockUserProfile,
      desiredEffects,
      context,
      medicalNeeds: context === 'medical' ? mockUserProfile.medical_needs : []
    };
    
    await getRecommendations(request);
  };
  
  // Add custom effect
  const handleAddEffect = () => {
    if (customEffect.trim() && !desiredEffects.includes(customEffect.trim().toLowerCase())) {
      setDesiredEffects([...desiredEffects, customEffect.trim().toLowerCase()]);
      setCustomEffect('');
    }
  };
  
  // Remove effect
  const handleRemoveEffect = (effect: string) => {
    setDesiredEffects(desiredEffects.filter(e => e !== effect));
  };
  
  // Transform StrainRecommendation to UIStrainRecommendation
  const enhanceRecommendation = (recommendation: StrainRecommendation): UIStrainRecommendation => {
    // Extract genetic type from the reasoning factors if available
    let type = 'hybrid'; // Default to hybrid
    
    if (recommendation.reasoningFactors && Array.isArray(recommendation.reasoningFactors)) {
      // Look for the genetic type in the reasoning factors
      const typeFactors = recommendation.reasoningFactors.filter(factor => 
        factor.factor.includes('Indica') || 
        factor.factor.includes('Sativa') || 
        factor.factor.includes('Hybrid')
      );
      
      if (typeFactors.length > 0) {
        const typeFactor = typeFactors[0].factor.toLowerCase();
        
        if (typeFactor.includes('indica')) {
          type = 'indica';
        } else if (typeFactor.includes('sativa')) {
          type = 'sativa';
        } else if (typeFactor.includes('hybrid')) {
          type = 'hybrid';
        }
      }
    }
    
    // Extract effects from the reasoning factors
    let effects = ['Relaxed', 'Happy']; // Default effects
    
    if (recommendation.reasoningFactors && Array.isArray(recommendation.reasoningFactors)) {
      const effectsFactor = recommendation.reasoningFactors.find(factor => 
        factor.factor.includes('Matches') && factor.factor.includes('effects')
      );
      
      if (effectsFactor) {
        // Try to extract the effects from the factor text
        effects = effectsFactor.factor
          .replace('Matches', '')
          .replace('of your desired effects', '')
          .trim()
          .split(',')
          .map(e => e.trim())
          .filter(e => e.length > 0);
        
        // If we couldn't extract effects, use the desired effects from the request
        if (effects.length === 0 || (effects.length === 1 && !isNaN(parseInt(effects[0])))) {
          effects = desiredEffects.map(e => e.charAt(0).toUpperCase() + e.slice(1));
        }
      }
    }
    
    return {
      ...recommendation,
      name: recommendation.strainName,
      type: type,
      effects: effects,
      reason: recommendation.reasoningFactors && Array.isArray(recommendation.reasoningFactors) 
        ? recommendation.reasoningFactors.map(f => f.factor).join('. ')
        : 'Recommended based on your preferences'
    };
  };
  
  // Render recommendation card
  const renderRecommendationCard = (recommendation: StrainRecommendation, index: number) => {
    const enhancedRecommendation = enhanceRecommendation(recommendation);
    
    return (
      <TouchableOpacity 
        key={`recommendation-${index}`}
        style={styles.recommendationCard}
        onPress={() => Alert.alert('Strain Details', `View detailed information about ${enhancedRecommendation.name}`)}
      >
        <View style={[
          styles.strainTypeIndicator,
          { backgroundColor: getStrainTypeColor(enhancedRecommendation.type) }
        ]} />
        <View style={styles.recommendationContent}>
          <Text style={styles.strainName}>{enhancedRecommendation.name}</Text>
          <Text style={styles.strainType}>{enhancedRecommendation.type}</Text>
          <Text style={styles.matchScore}>
            {enhancedRecommendation.matchScore}% Match
          </Text>
          <Text style={styles.reasonText}>{enhancedRecommendation.reason}</Text>
          
          <View style={styles.effectsContainer}>
            {enhancedRecommendation.effects.slice(0, 3).map((effect, i) => (
              <View key={`effect-${i}`} style={styles.effectTag}>
                <Text style={styles.effectText}>{effect}</Text>
              </View>
            ))}
          </View>
        </View>
      </TouchableOpacity>
    );
  };
  
  // Get color based on strain type
  const getStrainTypeColor = (type: string): string => {
    switch(type.toLowerCase()) {
      case 'indica':
        return '#3949ab'; // Indigo color
      case 'sativa':
        return COLORS.primary; // Primary green color
      case 'hybrid':
        return '#7b1fa2'; // Purple color
      default:
        return '#757575'; // Gray color
    }
  };
  
  // Render safety warnings if any
  const renderSafetyWarnings = () => {
    if (!safetyValidation || !safetyValidation.safetyFlags) return null;
    
    return (
      <View style={styles.safetyWarningsContainer}>
        <View style={styles.safetyHeader}>
          <MaterialCommunityIcons 
            name="alert-circle-outline" 
            size={20} 
            color={safetyValidation.warningLevel === 'warning' ? '#ffb300' : '#2196f3'} 
          />
          <Text style={styles.safetyHeaderText}>Safety Information</Text>
        </View>
        
        {safetyValidation.safetyFlags.map((flag, index) => (
          <Text key={`flag-${index}`} style={styles.safetyFlag}>
            • {flag}
          </Text>
        ))}
      </View>
    );
  };
  
  if (loading) {
    return <LoadingView />;
  }
  
  if (error && !recommendations) {
    return <ErrorView error={error} />;
  }
  
  return (
    <View style={styles.container}>
      <Stack.Screen 
        options={{
          title: 'AI Strain Recommendations'
        }} 
      />
      
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.contentContainer} showsVerticalScrollIndicator={false}>
        {/* Context Selector */}
        <View style={styles.contextSelector}>
          <Text style={styles.sectionTitle}>Purpose</Text>
          <View style={styles.timeRangeButtons}>
            <TouchableOpacity
              style={[
                styles.timeRangeButton,
                context === 'recreational' && styles.timeRangeButtonActive
              ]}
              onPress={() => setContext('recreational')}
            >
              <Text style={[
                styles.timeRangeButtonText,
                context === 'recreational' && styles.timeRangeButtonTextActive
              ]}>
                Recreational
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[
                styles.timeRangeButton,
                context === 'medical' && styles.timeRangeButtonActive
              ]}
              onPress={() => setContext('medical')}
            >
              <Text style={[
                styles.timeRangeButtonText,
                context === 'medical' && styles.timeRangeButtonTextActive
              ]}>
                Medical
              </Text>
            </TouchableOpacity>
          </View>
        </View>
        
        {/* Desired Effects */}
        <View style={styles.effectsSection}>
          <Text style={styles.sectionTitle}>Desired Effects</Text>
          
          <View style={styles.selectedEffectsContainer}>
            {desiredEffects.map((effect, index) => (
              <View key={`selected-${index}`} style={styles.selectedEffect}>
                <Text style={styles.selectedEffectText}>{effect}</Text>
                <TouchableOpacity onPress={() => handleRemoveEffect(effect)}>
                  <MaterialCommunityIcons name="close-circle" size={16} color={COLORS.text.primary} />
                </TouchableOpacity>
              </View>
            ))}
          </View>
          
          <View style={styles.addEffectContainer}>
            <TextInput
              style={styles.effectInput}
              placeholder="Add desired effect..."
              placeholderTextColor={COLORS.text.tertiary}
              value={customEffect}
              onChangeText={setCustomEffect}
              onSubmitEditing={handleAddEffect}
            />
            <TouchableOpacity 
              style={styles.addEffectButton}
              onPress={handleAddEffect}
            >
              <MaterialCommunityIcons name="plus" size={20} color={COLORS.text.primary} />
            </TouchableOpacity>
          </View>
        </View>
        
        {/* Get Recommendations Button */}
        <TouchableOpacity 
          style={styles.getRecommendationsButton}
          onPress={fetchRecommendations}
        >
          <Text style={styles.getRecommendationsText}>
            Get Recommendations
          </Text>
        </TouchableOpacity>
        
        {/* Safety Warnings */}
        {renderSafetyWarnings()}
        
        {/* Error Message */}
        {error && recommendations && (
          <View style={styles.errorContainer}>
            <MaterialCommunityIcons name="alert-circle" size={24} color="#ff6b6b" />
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}
        
        {/* Recommendations */}
        {recommendations && recommendations.recommendations && Array.isArray(recommendations.recommendations) && recommendations.recommendations.length > 0 ? (
          <View style={styles.recommendationsContainer}>
            <Text style={styles.sectionTitle}>
              Your Personalized Recommendations
            </Text>
            
            {recommendations.recommendations.map((recommendation, index) => 
              renderRecommendationCard(recommendation, index)
            )}
            
            {/* Disclaimers */}
            {recommendations.disclaimers && Array.isArray(recommendations.disclaimers) && recommendations.disclaimers.length > 0 && (
              <View style={styles.disclaimersContainer}>
                <Text style={styles.insightTitle}>Important Information</Text>
                {recommendations.disclaimers.map((disclaimer, index) => (
                  <Text key={`disclaimer-${index}`} style={styles.disclaimerText}>
                    • {disclaimer}
                  </Text>
                ))}
              </View>
            )}
          </View>
        ) : (
          <View style={styles.noRecommendationsContainer}>
            <Text style={styles.noRecommendationsText}>
              No recommendations available. Try adjusting your preferences or try again later.
            </Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scrollView: {
    flex: 1,
  },
  contentContainer: {
    paddingHorizontal: 16,
    paddingBottom: 32,
  },
  contextSelector: {
    marginTop: 16,
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.text.primary,
    marginBottom: 12,
  },
  timeRangeButtons: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 12,
    padding: 4,
  },
  timeRangeButton: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 8,
  },
  timeRangeButtonActive: {
    backgroundColor: 'rgba(0, 230, 118, 0.2)',
  },
  timeRangeButtonText: {
    fontSize: 14,
    color: COLORS.text.secondary,
  },
  timeRangeButtonTextActive: {
    color: COLORS.primary,
    fontWeight: '600',
  },
  effectsSection: {
    marginBottom: 20,
  },
  selectedEffectsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 12,
  },
  selectedEffect: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 230, 118, 0.2)',
    borderRadius: 16,
    paddingVertical: 6,
    paddingHorizontal: 12,
    marginRight: 8,
    marginBottom: 8,
  },
  selectedEffectText: {
    color: COLORS.primary,
    marginRight: 6,
    fontWeight: '500',
  },
  addEffectContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  effectInput: {
    flex: 1,
    backgroundColor: COLORS.cardBackground,
    borderRadius: 8,
    padding: 12,
    color: COLORS.text.primary,
    marginRight: 8,
    borderWidth: 1,
    borderColor: 'rgba(0, 230, 118, 0.1)',
  },
  addEffectButton: {
    backgroundColor: 'rgba(0, 230, 118, 0.2)',
    borderRadius: 8,
    padding: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  getRecommendationsButton: {
    backgroundColor: COLORS.primary,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginBottom: 20,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  getRecommendationsText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 16,
  },
  loadingIndicator: {
    marginLeft: 10,
  },
  safetyWarningsContainer: {
    backgroundColor: COLORS.cardBackground,
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: 'rgba(0, 230, 118, 0.1)',
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 2,
  },
  safetyHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  safetyHeaderText: {
    color: COLORS.text.primary,
    fontWeight: '600',
    marginLeft: 8,
    fontSize: 16,
  },
  safetyFlag: {
    color: COLORS.text.secondary,
    marginBottom: 4,
    lineHeight: 20,
  },
  errorContainer: {
    backgroundColor: 'rgba(255, 107, 107, 0.1)',
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
    flexDirection: 'row',
    alignItems: 'center',
  },
  errorText: {
    color: '#ff6b6b',
    marginLeft: 8,
    flex: 1,
  },
  recommendationsContainer: {
    marginBottom: 20,
  },
  recommendationCard: {
    backgroundColor: COLORS.cardBackground,
    borderRadius: 16,
    marginBottom: 16,
    overflow: 'hidden',
    flexDirection: 'row',
    borderWidth: 1,
    borderColor: 'rgba(0, 230, 118, 0.1)',
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
  },
  strainTypeIndicator: {
    width: 8,
    height: '100%',
  },
  recommendationContent: {
    padding: 16,
    flex: 1,
  },
  strainName: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.text.primary,
    marginBottom: 4,
  },
  strainType: {
    fontSize: 14,
    color: COLORS.text.tertiary,
    marginBottom: 8,
    textTransform: 'capitalize'
  },
  matchScore: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.primary,
    marginBottom: 8,
  },
  reasonText: {
    fontSize: 14,
    color: COLORS.text.secondary,
    marginBottom: 12,
    lineHeight: 20,
  },
  effectsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  effectTag: {
    backgroundColor: 'rgba(0, 230, 118, 0.1)',
    borderRadius: 16,
    paddingVertical: 4,
    paddingHorizontal: 10,
    marginRight: 8,
    marginBottom: 4,
  },
  effectText: {
    color: COLORS.primary,
    fontSize: 12,
    fontWeight: '500',
  },
  disclaimersContainer: {
    backgroundColor: COLORS.cardBackground,
    borderRadius: 16,
    padding: 16,
    marginTop: 8,
    borderWidth: 1,
    borderColor: 'rgba(0, 230, 118, 0.1)',
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  insightTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text.primary,
    marginBottom: 8,
  },
  disclaimerText: {
    color: COLORS.text.secondary,
    marginBottom: 4,
    lineHeight: 20,
  },
  noRecommendationsContainer: {
    backgroundColor: COLORS.cardBackground,
    borderRadius: 16,
    padding: 16,
    marginTop: 20,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(0, 230, 118, 0.1)',
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  noRecommendationsText: {
    color: COLORS.text.secondary,
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 22,
  },
});