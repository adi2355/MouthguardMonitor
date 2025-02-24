// app/dataOverviews/strains/strainDetails.tsx
import React, { useEffect, useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity,
  ActivityIndicator,
  Platform
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useStrains } from '@/src/hooks/useStrains';
import { Strain } from '@/src/dbManager';
import { COLORS } from '@/src/constants';

// Section component
const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <View style={styles.section}>
    <Text style={styles.sectionTitle}>{title}</Text>
    <View style={styles.sectionContent}>
      {children}
    </View>
  </View>
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

export default function StrainDetails() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const { getStrainDetails, getRelatedStrains, isLoading } = useStrains();
  
  const [strain, setStrain] = useState<Strain | null>(null);
  const [relatedStrains, setRelatedStrains] = useState<Strain[]>([]);

  useEffect(() => {
    const loadStrainData = async () => {
      if (id) {
        const strainData = await getStrainDetails(Number(id));
        if (strainData) {
          setStrain(strainData);
          const related = await getRelatedStrains(strainData);
          setRelatedStrains(related);
        }
      }
    };

    loadStrainData();
  }, [id, getStrainDetails, getRelatedStrains]);

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  if (!strain) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Strain not found</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} bounces={false}>
      {/* Gradient Header */}
      <LinearGradient
        colors={[
          'rgba(0,230,118,0.3)',
          'rgba(0,230,118,0.1)',
          'rgba(0,0,0,0)'
        ]}
        style={styles.headerGradient}
      >
        <TouchableOpacity 
          onPress={() => router.back()}
          style={styles.backButton}
        >
          <MaterialCommunityIcons 
            name="chevron-left" 
            size={32} 
            color={COLORS.text.primary} 
          />
        </TouchableOpacity>

        <View style={styles.header}>
          <Text style={styles.strainName}>{strain.name}</Text>
          <View style={styles.ratingBadge}>
            <MaterialCommunityIcons 
              name="cannabis" 
              size={20} 
              color={COLORS.primary} 
            />
            <Text style={styles.ratingText}>
              {strain.combined_rating.toFixed(1)}
            </Text>
          </View>
          <Text style={styles.geneticType}>{strain.genetic_type}</Text>
        </View>
      </LinearGradient>

      {/* Content Sections */}
      <View style={styles.content}>
        <Section title="Overview">
          <Text style={styles.overview}>{strain.overview}</Text>
        </Section>

        <Section title="Stats & Ratings">
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

        <Section title="Details">
          <View style={styles.detailsGrid}>
            <DetailItem icon="dna" label="Lineage" value={strain.lineage} />
            <DetailItem icon="water" label="CBD Level" value={strain.cbd_level} />
            <DetailItem icon="leaf" label="Terpenes" value={strain.dominant_terpenes} />
          </View>
        </Section>

        <Section title="Effects & Uses">
          <View style={styles.effectsGrid}>
            <DetailItem icon="star" label="Effects" value={strain.effects} />
            <DetailItem icon="alert" label="Potential Negatives" value={strain.negatives} />
            <DetailItem icon="medical-bag" label="Common Uses" value={strain.uses} />
          </View>
        </Section>

        {relatedStrains.length > 0 && (
          <Section title="Similar Strains">
            <View style={styles.relatedStrainsGrid}>
              {relatedStrains.map((related) => (
                <TouchableOpacity
                  key={related.id}
                  style={styles.relatedStrainItem}
                  onPress={() => {
                    if (related.id) {
                      router.push({
                        pathname: "/dataOverviews/strains/strainDetails",
                        params: { id: related.id }
                      });
                    }
                  }}
                >
                  <MaterialCommunityIcons 
                    name="cannabis" 
                    size={20} 
                    color={COLORS.primary} 
                  />
                  <View>
                    <Text style={styles.relatedStrainName}>{related.name}</Text>
                    <Text style={styles.relatedStrainType}>
                      {related.genetic_type}
                    </Text>
                  </View>
                  <Text style={styles.relatedStrainRating}>
                    {related.combined_rating.toFixed(1)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </Section>
        )}
      </View>
    </ScrollView>
  );
}

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

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
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
  },
  errorText: {
    color: COLORS.text.primary,
    fontSize: 16,
  },
  headerGradient: {
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    paddingBottom: 30,
  },
  backButton: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 16,
    backgroundColor: 'rgba(0,0,0,0.2)',
    borderRadius: 22,
  },
  header: {
    paddingHorizontal: 20,
    marginTop: 16,
  },
  strainName: {
    fontSize: 34,
    fontWeight: '700',
    color: COLORS.text.primary,
    marginBottom: 8,
  },
  ratingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,230,118,0.1)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    alignSelf: 'flex-start',
    marginBottom: 8,
    gap: 6,
  },
  ratingText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.primary,
  },
  geneticType: {
    fontSize: 18,
    color: COLORS.text.secondary,
  },
  content: {
    padding: 20,
  },
  section: {
    marginBottom: 24,
  },
  sectionContent: {
    backgroundColor: COLORS.cardBackground,
    borderRadius: 16,
    padding: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: COLORS.text.primary,
    marginBottom: 12,
  },
  overview: {
    fontSize: 16,
    color: COLORS.text.secondary,
    lineHeight: 24,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
  },
  statItem: {
    flex: 1,
    minWidth: '30%',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.05)',
    padding: 12,
    borderRadius: 12,
    gap: 8,
  },
  statLabel: {
    fontSize: 14,
    color: COLORS.text.secondary,
  },
  statValue: {
    fontSize: 24,
    fontWeight: '600',
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
  },
  detailHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  detailLabel: {
    fontSize: 14,
    color: COLORS.text.secondary,
  },
  detailValue: {
    fontSize: 16,
    color: COLORS.text.primary,
  },
  effectsGrid: {
    gap: 16,
  },
  relatedStrainsGrid: {
    gap: 12,
  },
  relatedStrainItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: 'rgba(255,255,255,0.05)',
    padding: 12,
    borderRadius: 12,
  },
  relatedStrainName: {
    fontSize: 16,
    fontWeight: '500',
    color: COLORS.text.primary,
  },
  relatedStrainType: {
    fontSize: 14,
    color: COLORS.text.secondary,
  },
  relatedStrainRating: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.primary,
    marginLeft: 'auto',
  },
});