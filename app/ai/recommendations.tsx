import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  ActivityIndicator,
  Alert,
  TextInput
} from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import useAIRecommendations from '../../src/hooks/useAIRecommendations';
import { RecommendationRequest, StrainRecommendation, UserProfile } from '../../src/types/ai';
import { COLORS } from '../../src/constants';

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

// Mock strain types for UI
const mockStrainTypes: Record<number, string> = {
  1: 'indica',
  2: 'sativa',
  3: 'hybrid'
};

// Mock effects for UI
const mockEffects: Record<number, string[]> = {
  1: ['Relaxed', 'Sleepy', 'Hungry'],
  2: ['Energetic', 'Creative', 'Focused'],
  3: ['Balanced', 'Happy', 'Euphoric']
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
  
  // Toggle context
  const toggleContext = () => {
    setContext(context === 'recreational' ? 'medical' : 'recreational');
  };
  
  // Transform StrainRecommendation to UIStrainRecommendation
  const enhanceRecommendation = (recommendation: StrainRecommendation): UIStrainRecommendation => {
    const strainId = recommendation.strainId;
    return {
      ...recommendation,
      name: recommendation.strainName,
      type: mockStrainTypes[strainId % 3 + 1] || 'hybrid',
      effects: mockEffects[strainId % 3 + 1] || ['Relaxed', 'Happy'],
      reason: recommendation.reasoningFactors.map(f => f.factor).join('. ')
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
        <LinearGradient
          colors={getStrainTypeGradient(enhancedRecommendation.type)}
          style={styles.strainTypeIndicator}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        />
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
  
  // Get gradient colors based on strain type
  const getStrainTypeGradient = (type: string): readonly [string, string] => {
    switch(type.toLowerCase()) {
      case 'indica':
        return ['#3949ab', '#1a237e'] as const; // Indigo colors
      case 'sativa':
        return ['#43a047', '#1b5e20'] as const; // Green colors
      case 'hybrid':
        return ['#7b1fa2', '#4a148c'] as const; // Purple colors
      default:
        return ['#757575', '#424242'] as const; // Gray colors
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
            color={
              safetyValidation.warningLevel === 'warning' 
                ? '#ffb300' // Amber color
                : '#2196f3' // Blue color
            } 
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
  
  return (
    <View style={styles.container}>
      <Stack.Screen 
        options={{
          title: 'AI Strain Recommendations',
          headerStyle: {
            backgroundColor: '#1a1a1a', // Dark background
          },
          headerTintColor: '#fff',
        }} 
      />
      
      <ScrollView style={styles.scrollView}>
        {/* Context Selector */}
        <View style={styles.contextSelector}>
          <Text style={styles.sectionTitle}>Purpose</Text>
          <View style={styles.contextButtons}>
            <TouchableOpacity
              style={[
                styles.contextButton,
                context === 'recreational' && styles.activeContextButton
              ]}
              onPress={() => setContext('recreational')}
            >
              <Text style={[
                styles.contextButtonText,
                context === 'recreational' && styles.activeContextButtonText
              ]}>
                Recreational
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[
                styles.contextButton,
                context === 'medical' && styles.activeContextButton
              ]}
              onPress={() => setContext('medical')}
            >
              <Text style={[
                styles.contextButtonText,
                context === 'medical' && styles.activeContextButtonText
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
                  <MaterialCommunityIcons name="close-circle" size={16} color="#fff" />
                </TouchableOpacity>
              </View>
            ))}
          </View>
          
          <View style={styles.addEffectContainer}>
            <TextInput
              style={styles.effectInput}
              placeholder="Add desired effect..."
              placeholderTextColor="#9e9e9e" // Gray color
              value={customEffect}
              onChangeText={setCustomEffect}
              onSubmitEditing={handleAddEffect}
            />
            <TouchableOpacity 
              style={styles.addEffectButton}
              onPress={handleAddEffect}
            >
              <MaterialCommunityIcons name="plus" size={20} color="#fff" />
            </TouchableOpacity>
          </View>
        </View>
        
        {/* Get Recommendations Button */}
        <TouchableOpacity 
          style={styles.getRecommendationsButton}
          onPress={fetchRecommendations}
          disabled={loading}
        >
          <Text style={styles.getRecommendationsText}>
            {loading ? 'Finding Matches...' : 'Get Recommendations'}
          </Text>
          {loading && (
            <ActivityIndicator 
              size="small" 
              color="#fff" 
              style={styles.loadingIndicator} 
            />
          )}
        </TouchableOpacity>
        
        {/* Safety Warnings */}
        {renderSafetyWarnings()}
        
        {/* Error Message */}
        {error && (
          <View style={styles.errorContainer}>
            <MaterialCommunityIcons name="alert-circle" size={24} color="#f44336" /> {/* Red color */}
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}
        
        {/* Recommendations */}
        {recommendations && recommendations.recommendations && (
          <View style={styles.recommendationsContainer}>
            <Text style={styles.recommendationsTitle}>
              Your Personalized Recommendations
            </Text>
            
            {recommendations.recommendations.map((recommendation, index) => 
              renderRecommendationCard(recommendation, index)
            )}
            
            {/* Disclaimers */}
            {recommendations.disclaimers && recommendations.disclaimers.length > 0 && (
              <View style={styles.disclaimersContainer}>
                <Text style={styles.disclaimersTitle}>Important Information</Text>
                {recommendations.disclaimers.map((disclaimer, index) => (
                  <Text key={`disclaimer-${index}`} style={styles.disclaimerText}>
                    • {disclaimer}
                  </Text>
                ))}
              </View>
            )}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000', // Black background
  },
  scrollView: {
    flex: 1,
    padding: 16,
  },
  contextSelector: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 12,
  },
  contextButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  contextButton: {
    flex: 1,
    backgroundColor: '#424242', // Dark gray
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginHorizontal: 4,
  },
  activeContextButton: {
    backgroundColor: '#4a7c59', // Green
  },
  contextButtonText: {
    color: '#bdbdbd', // Light gray
    fontWeight: '600',
  },
  activeContextButtonText: {
    color: '#fff',
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
    backgroundColor: '#4a7c59', // Green
    borderRadius: 16,
    paddingVertical: 6,
    paddingHorizontal: 12,
    marginRight: 8,
    marginBottom: 8,
  },
  selectedEffectText: {
    color: '#fff',
    marginRight: 6,
  },
  addEffectContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  effectInput: {
    flex: 1,
    backgroundColor: '#424242', // Dark gray
    borderRadius: 8,
    padding: 12,
    color: '#fff',
    marginRight: 8,
  },
  addEffectButton: {
    backgroundColor: '#4a7c59', // Green
    borderRadius: 8,
    padding: 12,
  },
  getRecommendationsButton: {
    backgroundColor: '#4caf50', // Green
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    marginBottom: 20,
    flexDirection: 'row',
    justifyContent: 'center',
  },
  getRecommendationsText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  loadingIndicator: {
    marginLeft: 10,
  },
  safetyWarningsContainer: {
    backgroundColor: '#1a1a1a', // Dark background
    borderRadius: 8,
    padding: 16,
    marginBottom: 20,
    borderLeftWidth: 4,
    borderLeftColor: '#2196f3', // Blue
  },
  safetyHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  safetyHeaderText: {
    color: '#fff',
    fontWeight: 'bold',
    marginLeft: 8,
    fontSize: 16,
  },
  safetyFlag: {
    color: '#bdbdbd', // Light gray
    marginBottom: 4,
    lineHeight: 20,
  },
  errorContainer: {
    backgroundColor: '#1a1a1a', // Dark background
    borderRadius: 8,
    padding: 16,
    marginBottom: 20,
    borderLeftWidth: 4,
    borderLeftColor: '#f44336', // Red
    flexDirection: 'row',
    alignItems: 'center',
  },
  errorText: {
    color: '#ef9a9a', // Light red
    marginLeft: 8,
    flex: 1,
  },
  recommendationsContainer: {
    marginBottom: 20,
  },
  recommendationsTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 16,
  },
  recommendationCard: {
    backgroundColor: '#1a1a1a', // Dark background
    borderRadius: 12,
    marginBottom: 16,
    overflow: 'hidden',
    flexDirection: 'row',
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
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 4,
  },
  strainType: {
    fontSize: 14,
    color: '#9e9e9e', // Gray
    marginBottom: 8,
  },
  matchScore: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#66bb6a', // Green
    marginBottom: 8,
  },
  reasonText: {
    fontSize: 14,
    color: '#bdbdbd', // Light gray
    marginBottom: 12,
    lineHeight: 20,
  },
  effectsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  effectTag: {
    backgroundColor: '#424242', // Dark gray
    borderRadius: 16,
    paddingVertical: 4,
    paddingHorizontal: 10,
    marginRight: 8,
    marginBottom: 4,
  },
  effectText: {
    color: '#bdbdbd', // Light gray
    fontSize: 12,
  },
  disclaimersContainer: {
    backgroundColor: '#1a1a1a', // Dark background
    borderRadius: 8,
    padding: 16,
    marginTop: 8,
  },
  disclaimersTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 8,
  },
  disclaimerText: {
    color: '#bdbdbd', // Light gray
    marginBottom: 4,
    lineHeight: 20,
  },
}); 