// app/dataOverviews/strains/strainDetails.tsx
import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity,
  Dimensions,
  Platform 
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { LineChart } from 'react-native-chart-kit';
import { LinearGradient } from 'expo-linear-gradient';

const windowWidth = Dimensions.get('window').width;

const COLORS = {
  background: '#000000',
  cardBackground: '#1A1A1A',
  primary: '#00E676',
  primaryDark: '#00C853',
  accent: '#69F0AE',
  text: {
    primary: '#FFFFFF',
    secondary: '#FFFFFFCC',
    tertiary: '#FFFFFF99',
    quaternary: '#FFFFFF66',
  },
  divider: '#333333'
};

// Add typography constants
const typography = {
  title: {
    fontSize: 34,
    fontWeight: Platform.select({ ios: '700', android: 'bold' }),
    letterSpacing: 0.3,
  },
  header: {
    fontSize: 20,
    fontWeight: Platform.select({ ios: '600', android: 'bold' }),
    letterSpacing: 0.2,
  },
  body: {
    fontSize: 16,
    letterSpacing: 0.1,
  }
};

// Effect categories with consensus data
const effectCategories = [
  {
    name: 'Feeling',
    effects: [
      { positive: 'Relaxed', negative: 'Anxious', consensus: 85 },
      { positive: 'Happy', negative: 'Sad', consensus: 92 },
      { positive: 'Euphoric', negative: 'Depressed', consensus: 78 }
    ]
  },
  {
    name: 'Mind',
    effects: [
      { positive: 'Creative', negative: 'Blocked', consensus: 65 },
      { positive: 'Focused', negative: 'Distracted', consensus: 70 },
      { positive: 'Clear', negative: 'Foggy', consensus: 75 }
    ]
  },
  {
    name: 'Body',
    effects: [
      { positive: 'Energetic', negative: 'Tired', consensus: 80 },
      { positive: 'Pain Free', negative: 'Pain', consensus: 88 },
      { positive: 'Active', negative: 'Sedated', consensus: 72 }
    ]
  }
];

export default function StrainDetails() {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const [showUserReview, setShowUserReview] = useState(false);
  const [userRatings, setUserRatings] = useState({});
  
  // Chart configuration
  const chartConfig = {
    backgroundGradientFrom: COLORS.cardBackground,
    backgroundGradientTo: COLORS.cardBackground,
    color: (opacity = 1) => `rgba(0, 230, 118, ${opacity})`,
    strokeWidth: 2,
    useShadowColorFromDataset: false,
    decimalPlaces: 0,
    labelColor: () => COLORS.text.tertiary,
    style: {
      borderRadius: 16,
    },
    propsForDots: {
      r: "4",
      strokeWidth: "2",
      stroke: COLORS.accent,
    }
  };

  const usageData = {
    labels: ["Jan", "Feb", "Mar", "Apr", "May", "Jun"],
    datasets: [{
      data: [20, 45, 28, 80, 99, 43],
      color: (opacity = 1) => `rgba(0, 230, 118, ${opacity})`,
      strokeWidth: 2
    }]
  };

  // Community consensus bar component
  const EffectBar = ({ effect, consensus }) => (
    <View style={styles.effectBarContainer}>
      <Text style={styles.effectLabel}>{effect.negative}</Text>
      <View style={styles.barContainer}>
        <View style={[styles.consensusBar, { width: `${consensus}%` }]} />
      </View>
      <Text style={styles.effectLabel}>{effect.positive}</Text>
    </View>
  );

  // User rating component
  const UserRatingBar = ({ effect, onRate }) => (
    <View style={styles.userRatingContainer}>
      <Text style={styles.effectLabel}>{effect.negative}</Text>
      <View style={styles.userBarContainer}>
        {[0, 25, 50, 75, 100].map((value) => (
          <TouchableOpacity
            key={value}
            style={[
              styles.ratingButton,
              userRatings[effect.positive] === value && styles.ratingButtonSelected
            ]}
            onPress={() => onRate(effect.positive, value)}
          />
        ))}
      </View>
      <Text style={styles.effectLabel}>{effect.positive}</Text>
    </View>
  );

  // Update section components to include gradients
  const Section = ({ children, title, style }) => (
    <View style={[styles.section, style]}>
      <LinearGradient
        colors={['rgba(0,230,118,0.2)', 'rgba(0,230,118,0.05)', 'rgba(0,0,0,0)']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.sectionGradient}
      />
      {title && <Text style={[styles.sectionTitle, typography.header]}>{title}</Text>}
      {children}
    </View>
  );

  // Update chart container to include gradient
  const ChartContainer = ({ children }) => (
    <View style={styles.chartWrapper}>
      <LinearGradient
        colors={['rgba(0,230,118,0.15)', 'rgba(0,230,118,0.05)', 'rgba(0,0,0,0)']}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={styles.chartGradient}
      />
      {children}
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <MaterialCommunityIcons name="chevron-left" size={24} color="#fff" />
          <Text style={styles.backText}>Back</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content}>
        <Text style={styles.title}>Blue Dream</Text>
        
        {/* Main Info Card */}
        <View style={styles.infoCard}>
          <View style={styles.infoRow}>
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>Type</Text>
              <Text style={styles.infoValue}>Hybrid</Text>
            </View>
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>THC</Text>
              <Text style={styles.infoValue}>18-24%</Text>
            </View>
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>CBD</Text>
              <Text style={styles.infoValue}>0.1-1%</Text>
            </View>
          </View>
        </View>

        {/* Description */}
        <Section style={styles.section}>
          <Text style={styles.sectionTitle}>Description</Text>
          <Text style={styles.description}>
            Blue Dream is a sativa-dominant hybrid strain made by crossing Blueberry with Haze. Known for its sweet berry aroma and balanced effects.
          </Text>
        </Section>

        {/* Usage Overview */}
        <Section style={styles.section}>
          <Text style={styles.sectionTitle}>Usage Overview</Text>
          <View style={styles.chartContainer}>
            <LineChart
              data={usageData}
              width={windowWidth - 48}
              height={220}
              chartConfig={chartConfig}
              bezier
              style={styles.chart}
            />
            <Text style={styles.chartLabel}>Monthly Usage</Text>
          </View>
        </Section>

        {/* Community Consensus */}
        <Section style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Community Consensus</Text>
            <Text style={styles.communityCount}>2,451 reports</Text>
          </View>
          
          {effectCategories.map((category, index) => (
            <View key={index} style={styles.categoryContainer}>
              <Text style={styles.categoryTitle}>{category.name}</Text>
              {category.effects.map((effect, effectIndex) => (
                <EffectBar 
                  key={effectIndex} 
                  effect={effect} 
                  consensus={effect.consensus}
                />
              ))}
            </View>
          ))}
        </Section>

        {/* User Review Section */}
        <Section style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Your Experience</Text>
            {!showUserReview ? (
              <TouchableOpacity 
                style={styles.addReviewButton}
                onPress={() => setShowUserReview(true)}
              >
                <Text style={styles.addReviewText}>Add Review</Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity 
                style={styles.editButton}
                onPress={() => setShowUserReview(false)}
              >
                <MaterialCommunityIcons name="pencil" size={20} color="#007AFF" />
              </TouchableOpacity>
            )}
          </View>

          {showUserReview ? (
            <>
              {effectCategories.map((category, index) => (
                <View key={index} style={styles.categoryContainer}>
                  <Text style={styles.categoryTitle}>{category.name}</Text>
                  {category.effects.map((effect, effectIndex) => (
                    <UserRatingBar
                      key={effectIndex}
                      effect={effect}
                      onRate={(effectName, value) => 
                        setUserRatings(prev => ({...prev, [effectName]: value}))
                      }
                    />
                  ))}
                </View>
              ))}
              <TouchableOpacity style={styles.submitButton}>
                <Text style={styles.submitButtonText}>Save Review</Text>
              </TouchableOpacity>
            </>
          ) : (
            <Text style={styles.noReviewText}>
              You haven't reviewed this strain yet
            </Text>
          )}
        </Section>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  backText: {
    color: COLORS.text.primary,
    fontSize: 17,
    marginLeft: 4,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  title: {
    ...typography.title,
    color: COLORS.text.primary,
    marginBottom: 20,
  },
  infoCard: {
    backgroundColor: COLORS.cardBackground,
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  infoItem: {
    alignItems: 'center',
  },
  infoLabel: {
    color: COLORS.text.tertiary,
    fontSize: 14,
    marginBottom: 4,
  },
  infoValue: {
    color: COLORS.text.primary,
    fontSize: 17,
    fontWeight: '600',
  },
  section: {
    backgroundColor: COLORS.cardBackground,
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    overflow: 'hidden',
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: COLORS.text.primary,
    marginBottom: 12,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  communityCount: {
    fontSize: 14,
    color: COLORS.text.tertiary,
  },
  description: {
    color: COLORS.text.secondary,
    fontSize: 16,
    lineHeight: 24,
  },
  chartContainer: {
    alignItems: 'center',
  },
  chart: {
    borderRadius: 12,
    marginVertical: 8,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 4,
  },
  chartLabel: {
    color: COLORS.text.tertiary,
    fontSize: 14,
    marginTop: 8,
  },
  categoryContainer: {
    marginBottom: 20,
  },
  categoryTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text.tertiary,
    marginBottom: 12,
  },
  effectBarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  effectLabel: {
    color: COLORS.text.tertiary,
    width: 80,
    fontSize: 14,
  },
  barContainer: {
    flex: 1,
    height: 8,
    backgroundColor: COLORS.divider,
    borderRadius: 4,
    marginHorizontal: 12,
    overflow: 'hidden',
  },
  consensusBar: {
    height: '100%',
    backgroundColor: COLORS.primary,
    borderRadius: 4,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 6,
    elevation: 4,
  },
  userRatingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  userBarContainer: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginHorizontal: 12,
  },
  ratingButton: {
    width: 22,
    height: 22,
    borderRadius: 12,
    backgroundColor: COLORS.divider,
    borderWidth: 1,
    borderColor: COLORS.text.quaternary,
  },
  ratingButtonSelected: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.accent,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 8,
    elevation: 6,
  },
  addReviewButton: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 16,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 4,
  },
  addReviewText: {
    color: COLORS.text.primary,
    fontSize: 14,
    fontWeight: '600',
  },
  editButton: {
    padding: 8,
  },
  noReviewText: {
    color: COLORS.text.tertiary,
    fontSize: 16,
    textAlign: 'center',
    marginVertical: 20,
  },
  submitButton: {
    backgroundColor: COLORS.primary,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 16,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 6,
  },
  submitButtonText: {
    color: COLORS.text.primary,
    fontSize: 17,
    fontWeight: '600',
  },
  sectionGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  chartWrapper: {
    position: 'relative',
    borderRadius: 12,
    overflow: 'hidden',
    marginVertical: 8,
  },
  chartGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
});