// app/dataOverviews/strains/strainDetails.tsx
import React, { useEffect, useState, useCallback } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity,
  ActivityIndicator,
  Platform,
  StatusBar,
  Alert
} from 'react-native';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { useStrainsRepository } from '@/src/providers/AppProvider';
import { Strain } from "@/src/types";
import { COLORS } from '../../../src/constants';
import Animated, { FadeInDown, FadeIn } from 'react-native-reanimated';

// Section component
const Section = ({ title, children, delay = 0 }: { title: string; children: React.ReactNode; delay?: number }) => (
  <Animated.View 
    style={styles.section}
    entering={FadeInDown.springify().delay(delay).damping(12)}
  >
    <Text style={styles.sectionTitle}>{title}</Text>
    <View style={styles.sectionContent}>
      {children}
    </View>
  </Animated.View>
);

// StatItem component
const StatItem = ({ 
  icon, 
  label, 
  value, 
  subtext, 
  highlight 
}: { 
  icon: keyof typeof MaterialCommunityIcons.glyphMap; 
  label: string; 
  value: string; 
  subtext?: string;
  highlight?: boolean;
}) => (
  <View style={styles.statItem}>
    <MaterialCommunityIcons 
      name={icon} 
      size={24} 
      color={highlight ? COLORS.primary : COLORS.text.secondary} 
    />
    <Text style={styles.statLabel}>{label}</Text>
    <Text style={[
      styles.statValue,
      highlight && { color: COLORS.primary }
    ]}>{value}</Text>
    {subtext && <Text style={styles.statSubtext}>{subtext}</Text>}
  </View>
);

const DetailItem = ({ 
  icon, 
  label, 
  value 
}: { 
  icon: keyof typeof MaterialCommunityIcons.glyphMap; 
  label: string; 
  value: string;
}) => (
  <View style={styles.detailItem}>
    <View style={styles.detailHeader}>
      <MaterialCommunityIcons 
        name={icon} 
        size={20} 
        color={COLORS.text.secondary} 
      />
      <Text style={styles.detailLabel}>{label}</Text>
    </View>
    <Text style={styles.detailValue}>{value}</Text>
  </View>
);

// Enhanced rating badge component
const RatingBadge = ({ rating }: { rating: number }) => (
  <LinearGradient
    colors={[
      rating >= 9 ? 'rgba(0,230,118,0.2)' : rating >= 8 ? 'rgba(0,230,118,0.15)' : 'rgba(0,230,118,0.1)',
      rating >= 9 ? 'rgba(0,230,118,0.1)' : rating >= 8 ? 'rgba(0,230,118,0.05)' : 'rgba(0,230,118,0.03)'
    ]}
    style={styles.ratingBadge}
    start={{ x: 0, y: 0 }}
    end={{ x: 1, y: 1 }}
  >
    <MaterialCommunityIcons 
      name="cannabis" 
      size={18} 
      color={COLORS.primary} 
    />
    <Text style={styles.ratingText}>
      {rating.toFixed(1)}
    </Text>
  </LinearGradient>
);

export default function StrainDetails() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const strainsRepository = useStrainsRepository();
  
  const [loading, setLoading] = useState(true);
  const [strain, setStrain] = useState<Strain | null>(null);
  const [relatedStrains, setRelatedStrains] = useState<Strain[]>([]);

  // Hide the default stack navigator
  useEffect(() => {
    // This ensures we don't show multiple headers
    StatusBar.setBarStyle('light-content');
    return () => {
      StatusBar.setBarStyle('default');
    };
  }, []);

  useEffect(() => {
    const strainId = Number(params.id);
    if (!strainId) {
      Alert.alert('Error', 'Invalid strain ID provided');
      router.back();
      return;
    }
    
    loadStrainDetails(strainId);
  }, [params.id]);
  
  const loadStrainDetails = async (strainId: number) => {
    try {
      setLoading(true);
      
      // Fetch strain details by ID
      const strainResult = await strainsRepository.getStrainById(strainId);
      
      if (!strainResult.success) {
        // Check for error property on failed validation result
        Alert.alert('Error', strainResult.error || 'Failed to load strain details');
        router.back();
        return;
      }
      
      if (!strainResult.data) {
        Alert.alert('Error', 'Strain not found');
        router.back();
        return;
      }
      
      setStrain(strainResult.data);
      
      // Fetch related strains
      const relatedResult = await strainsRepository.getRelatedStrains(strainResult.data);
      
      if (relatedResult.success && relatedResult.data) {
        setRelatedStrains(relatedResult.data);
      }
    } catch (error) {
      console.error('Error loading strain details:', error);
      Alert.alert('Error', 'Failed to load strain details');
    } finally {
      setLoading(false);
    }
  };

  const handleBackPress = useCallback(() => {
    router.back();
  }, [router]);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loadingText}>Loading strain details...</Text>
      </View>
    );
  }

  if (!strain) {
    return (
      <View style={styles.errorContainer}>
        <Ionicons name="alert-circle-outline" size={64} color={COLORS.text.tertiary} />
        <Text style={styles.errorText}>Strain not found</Text>
        <TouchableOpacity style={styles.backButton} onPress={handleBackPress}>
          <Text style={styles.backButtonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <>
      {/* Hide the stack navigator header */}
      <Stack.Screen options={{ headerShown: false }} />
      
      <View style={styles.container}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {/* Premium Gradient Header */}
          <LinearGradient
            colors={[
              'rgba(0,230,118,0.3)',
              'rgba(0,230,118,0.1)',
              'rgba(0,0,0,0)'
            ]}
            style={styles.headerGradient}
          >
            {/* Back button */}
            <TouchableOpacity 
              onPress={handleBackPress}
              style={styles.backButton}
            >
              <LinearGradient
                colors={['rgba(0,0,0,0.3)', 'rgba(0,0,0,0.2)']}
                style={StyleSheet.absoluteFillObject}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              />
              <MaterialCommunityIcons 
                name="chevron-left" 
                size={28} 
                color={COLORS.text.primary} 
              />
            </TouchableOpacity>

            <Animated.View 
              style={styles.header}
              entering={FadeIn.duration(600)}
            >
              <Text style={styles.strainName}>{strain.name}</Text>
              <RatingBadge rating={strain.combined_rating} />
              <Text style={styles.geneticType}>{strain.genetic_type}</Text>
            </Animated.View>
          </LinearGradient>

          {/* Content Sections */}
          <View style={styles.content}>
            <Section title="Overview" delay={100}>
              <Text style={styles.overview}>{strain.overview}</Text>
            </Section>

            <Section title="Stats & Ratings" delay={200}>
              <View style={styles.statsGrid}>
                <StatItem 
                  icon="scale" 
                  label="THC Rating" 
                  value={`${strain.thc_rating.toFixed(1)}`} 
                  subtext={strain.thc_range} 
                />
                <StatItem 
                  icon="star" 
                  label="User Rating" 
                  value={`${strain.user_rating.toFixed(1)}`} 
                />
                <StatItem 
                  icon="trending-up" 
                  label="Combined" 
                  value={`${strain.combined_rating.toFixed(1)}`} 
                  highlight 
                />
              </View>
            </Section>

            <Section title="Details" delay={300}>
              <View style={styles.detailsGrid}>
                <DetailItem icon="dna" label="Lineage" value={strain.lineage} />
                <DetailItem icon="water" label="CBD Level" value={strain.cbd_level} />
                <DetailItem icon="leaf" label="Terpenes" value={strain.dominant_terpenes} />
              </View>
            </Section>

            <Section title="Effects & Uses" delay={400}>
              <View style={styles.effectsGrid}>
                <DetailItem icon="star" label="Effects" value={strain.effects} />
                <DetailItem icon="alert" label="Potential Negatives" value={strain.negatives} />
                <DetailItem icon="medical-bag" label="Common Uses" value={strain.uses} />
              </View>
            </Section>

            {relatedStrains.length > 0 && (
              <Section title="Similar Strains" delay={500}>
                <Text style={styles.similarDescription}>
                  Strains with similar genetic profiles and effects
                </Text>
                <View style={styles.relatedStrainsGrid}>
                  {relatedStrains.map((related, index) => (
                    <Animated.View
                      key={related.id}
                      entering={FadeInDown.delay(600 + index * 100).springify()}
                    >
                      <TouchableOpacity
                        style={styles.relatedStrainItem}
                        activeOpacity={0.7}
                        onPress={() => {
                          if (related.id) {
                            router.push({
                              pathname: "/dataOverviews/strains/strainDetails",
                              params: { id: related.id }
                            });
                          }
                        }}
                      >
                        <LinearGradient
                          colors={['rgba(0,0,0,0.3)', 'rgba(0,0,0,0.1)']}
                          style={StyleSheet.absoluteFillObject}
                          start={{ x: 0, y: 0 }}
                          end={{ x: 1, y: 1 }}
                        />
                        <View style={styles.relatedStrainIcon}>
                          <MaterialCommunityIcons 
                            name="cannabis" 
                            size={20} 
                            color={COLORS.primary} 
                          />
                        </View>
                        <View style={styles.relatedStrainInfo}>
                          <Text style={styles.relatedStrainName}>{related.name}</Text>
                          <Text style={styles.relatedStrainType}>
                            {related.genetic_type}
                          </Text>
                        </View>
                        <View style={styles.relatedStrainRatingContainer}>
                          <RatingBadge rating={related.combined_rating} />
                        </View>
                      </TouchableOpacity>
                    </Animated.View>
                  ))}
                </View>
              </Section>
            )}
          </View>
        </ScrollView>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.background,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.background,
    padding: 20,
  },
  errorText: {
    color: COLORS.text.primary,
    fontSize: 18,
    marginBottom: 20,
  },
  backButtonText: {
    color: COLORS.primary,
    fontSize: 16,
    fontWeight: '600',
  },
  headerGradient: {
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    paddingBottom: 20,
  },
  backButton: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 16,
    borderRadius: 22,
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  header: {
    paddingHorizontal: 20,
    marginTop: 16,
  },
  strainName: {
    fontSize: 36,
    fontWeight: '700',
    color: COLORS.text.primary,
    marginBottom: 12,
    textShadowColor: 'rgba(0,0,0,0.2)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  ratingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    alignSelf: 'flex-start',
    marginBottom: 12,
    gap: 8,
    borderWidth: 1,
    borderColor: 'rgba(0,230,118,0.2)',
  },
  ratingText: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.primary,
  },
  geneticType: {
    fontSize: 18,
    fontWeight: '500',
    color: COLORS.text.secondary,
  },
  content: {
    padding: 20,
  },
  section: {
    marginBottom: 24,
  },
  sectionContent: {
    backgroundColor: 'rgba(26, 32, 28, 0.9)',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
    ...Platform.select({
      ios: {
        shadowColor: 'rgba(0,0,0,0.3)',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: COLORS.text.primary,
    marginBottom: 12,
    letterSpacing: 0.3,
  },
  overview: {
    fontSize: 16,
    color: COLORS.text.secondary,
    lineHeight: 24,
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.2)',
    padding: 16,
    borderRadius: 12,
    gap: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  statLabel: {
    fontSize: 14,
    color: COLORS.text.secondary,
  },
  statValue: {
    fontSize: 24,
    fontWeight: '700',
    color: COLORS.text.primary,
  },
  statSubtext: {
    fontSize: 12,
    color: COLORS.text.tertiary,
  },
  detailsGrid: {
    gap: 16,
  },
  detailItem: {
    gap: 8,
    marginBottom: 12,
  },
  detailHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  detailLabel: {
    fontSize: 15,
    fontWeight: '500',
    color: COLORS.text.secondary,
  },
  detailValue: {
    fontSize: 16,
    color: COLORS.text.primary,
    paddingLeft: 28,
  },
  effectsGrid: {
    gap: 16,
  },
  similarDescription: {
    fontSize: 14,
    color: COLORS.text.tertiary,
    marginBottom: 16,
    fontStyle: 'italic',
  },
  relatedStrainsGrid: {
    gap: 12,
  },
  relatedStrainItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 14,
    backgroundColor: 'rgba(26, 32, 28, 0.6)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: 'rgba(0,0,0,0.2)',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  relatedStrainIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(0,230,118,0.08)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(0,230,118,0.1)',
  },
  relatedStrainInfo: {
    flex: 1,
    marginLeft: 12,
  },
  relatedStrainName: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text.primary,
  },
  relatedStrainType: {
    fontSize: 14,
    color: COLORS.text.secondary,
    marginTop: 2,
  },
  relatedStrainRatingContainer: {
    marginLeft: 'auto',
  },
  loadingText: {
    color: COLORS.text.secondary,
    marginTop: 16,
    fontSize: 16,
  },
});