import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity,
  ActivityIndicator
} from 'react-native';
import { Stack } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import useAIRecommendations from '../../src/hooks/useAIRecommendations';
import { UserProfile } from '../../src/types';
import { COLORS } from '../../src/constants';
import LoadingView from '../components/shared/LoadingView';
import ErrorView from '../components/shared/ErrorView';

// Mock journal entries for demo purposes
const mockJournalEntries = [
  {
    id: "j1",
    user_id: "user123",
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
    user_id: "user123",
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
  },
  {
    id: "j3",
    user_id: "user123",
    strain_id: 3,
    strain_name: "Sour Diesel",
    consumption_method: "flower",
    dosage: 0.5,
    dosage_unit: "g",
    effects_felt: ["Energetic", "Focused", "Creative"],
    rating: 5,
    effectiveness: 5,
    notes: "Perfect for morning use, helped with productivity",
    mood_before: "Groggy",
    mood_after: "Energized",
    medical_symptoms_relieved: ["Fatigue"],
    negative_effects: [],
    duration_minutes: 150,
    created_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString()
  }
];

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

export default function JournalInsightsScreen() {
  const { loading, error, analyzeJournalPatterns } = useAIRecommendations();
  const [insights, setInsights] = useState<any>(null);
  
  // Handle analyzing journal entries
  const handleAnalyzeJournal = async () => {
    const analysis = await analyzeJournalPatterns(mockJournalEntries, mockUserProfile);
    if (analysis) {
      setInsights(analysis);
    }
  };
  
  if (loading && !insights) {
    return <LoadingView />;
  }
  
  if (error && !insights) {
    return <ErrorView error={error} />;
  }
  
  return (
    <View style={styles.container}>
      <Stack.Screen 
        options={{
          title: 'Journal Insights',
        }} 
      />
      
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.headerContainer}>
          <Text style={styles.headerTitle}>AI Journal Analysis</Text>
          <Text style={styles.headerSubtitle}>
            Get personalized insights based on your journal entries
          </Text>
        </View>
        
        <View style={styles.journalSummaryContainer}>
          <Text style={styles.sectionTitle}>Journal Summary</Text>
          <View style={styles.statsContainer}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{mockJournalEntries.length}</Text>
              <Text style={styles.statLabel}>Entries</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>
                {(mockJournalEntries.reduce((sum, entry) => sum + entry.rating, 0) / mockJournalEntries.length).toFixed(1)}
              </Text>
              <Text style={styles.statLabel}>Avg Rating</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>
                {[...new Set(mockJournalEntries.map(entry => entry.strain_name))].length}
              </Text>
              <Text style={styles.statLabel}>Strains</Text>
            </View>
          </View>
        </View>
        
        <TouchableOpacity 
          style={styles.analyzeButton}
          onPress={handleAnalyzeJournal}
          disabled={loading}
        >
          <Text style={styles.analyzeButtonText}>
            {loading ? 'Analyzing...' : 'Analyze My Journal'}
          </Text>
          {loading && (
            <ActivityIndicator 
              size="small" 
              color="#fff" 
              style={styles.loadingIndicator} 
            />
          )}
        </TouchableOpacity>
        
        {error && insights && (
          <View style={styles.errorContainer}>
            <MaterialCommunityIcons name="alert-circle" size={24} color="#ff6b6b" />
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}
        
        {insights && (
          <View style={styles.insightsContainer}>
            <Text style={styles.insightsTitle}>Your Personalized Insights</Text>
            
            {/* Pattern Insights */}
            <View style={styles.insightCard}>
              <View style={styles.insightHeader}>
                <MaterialCommunityIcons name="chart-line" size={24} color={COLORS.primary} />
                <Text style={styles.insightHeaderText}>Usage Patterns</Text>
              </View>
              <Text style={styles.insightText}>
                {insights.patterns?.summary || "You tend to use cannabis in the evening for relaxation. Your highest rated strains are typically Sativa dominant."}
              </Text>
            </View>
            
            {/* Effectiveness Insights */}
            <View style={styles.insightCard}>
              <View style={styles.insightHeader}>
                <MaterialCommunityIcons name="check-circle" size={24} color={COLORS.primary} />
                <Text style={styles.insightHeaderText}>Effectiveness</Text>
              </View>
              <Text style={styles.insightText}>
                {insights.effectiveness?.summary || "Based on your ratings, strains with high myrcene content seem to be most effective for your needs."}
              </Text>
              <View style={styles.effectiveStrains}>
                {(insights.effectiveness?.topStrains || ["Sour Diesel", "Blue Dream"]).map((strain: string, index: number) => (
                  <View key={`strain-${index}`} style={styles.effectiveStrain}>
                    <Text style={styles.effectiveStrainText}>{strain}</Text>
                  </View>
                ))}
              </View>
            </View>
            
            {/* Recommendations */}
            <View style={styles.insightCard}>
              <View style={styles.insightHeader}>
                <MaterialCommunityIcons name="lightbulb" size={24} color={COLORS.primary} />
                <Text style={styles.insightHeaderText}>Recommendations</Text>
              </View>
              <Text style={styles.insightText}>
                {insights.recommendations?.summary || "Consider trying lower doses in the evening to improve sleep quality without morning grogginess."}
              </Text>
              <View style={styles.recommendationsList}>
                {(insights.recommendations?.tips || [
                  "Try vaporizing at a lower temperature",
                  "Consider CBD-rich strains for anxiety",
                  "Journal more consistently for better insights"
                ]).map((tip: string, index: number) => (
                  <View key={`tip-${index}`} style={styles.recommendationItem}>
                    <MaterialCommunityIcons name="arrow-right" size={16} color={COLORS.primary} />
                    <Text style={styles.recommendationText}>{tip}</Text>
                  </View>
                ))}
              </View>
            </View>
          </View>
        )}
        
        {!insights && !loading && (
          <View style={styles.placeholderContainer}>
            <MaterialCommunityIcons name="book-open-page-variant" size={64} color={COLORS.text.tertiary} />
            <Text style={styles.placeholderText}>
              Tap "Analyze My Journal" to get personalized insights based on your usage patterns
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
    padding: 16,
  },
  headerContainer: {
    marginBottom: 24,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.text.primary,
    marginBottom: 8,
  },
  headerSubtitle: {
    fontSize: 16,
    color: COLORS.text.secondary,
    lineHeight: 22,
  },
  journalSummaryContainer: {
    backgroundColor: COLORS.cardBackground,
    borderRadius: 16,
    padding: 16,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: 'rgba(0, 230, 118, 0.1)',
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.text.primary,
    marginBottom: 16,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.primary,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 14,
    color: COLORS.text.secondary,
  },
  analyzeButton: {
    backgroundColor: COLORS.primary,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginBottom: 24,
    flexDirection: 'row',
    justifyContent: 'center',
  },
  analyzeButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  loadingIndicator: {
    marginLeft: 10,
  },
  errorContainer: {
    backgroundColor: 'rgba(255, 107, 107, 0.1)',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    flexDirection: 'row',
    alignItems: 'center',
  },
  errorText: {
    color: '#ff6b6b',
    marginLeft: 8,
    flex: 1,
  },
  insightsContainer: {
    marginBottom: 24,
  },
  insightsTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.text.primary,
    marginBottom: 16,
  },
  insightCard: {
    backgroundColor: COLORS.cardBackground,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(0, 230, 118, 0.1)',
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  insightHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  insightHeaderText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.text.primary,
    marginLeft: 8,
  },
  insightText: {
    fontSize: 16,
    color: COLORS.text.secondary,
    lineHeight: 22,
    marginBottom: 16,
  },
  effectiveStrains: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  effectiveStrain: {
    backgroundColor: 'rgba(0, 230, 118, 0.1)',
    borderRadius: 16,
    paddingVertical: 6,
    paddingHorizontal: 12,
    marginRight: 8,
    marginBottom: 8,
  },
  effectiveStrainText: {
    color: COLORS.primary,
    fontWeight: '500',
  },
  recommendationsList: {
    marginTop: 8,
  },
  recommendationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  recommendationText: {
    fontSize: 16,
    color: COLORS.text.secondary,
    marginLeft: 8,
    flex: 1,
  },
  placeholderContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
    marginTop: 24,
  },
  placeholderText: {
    fontSize: 16,
    color: COLORS.text.tertiary,
    textAlign: 'center',
    marginTop: 16,
    lineHeight: 24,
  },
});