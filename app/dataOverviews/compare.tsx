// app/dataOverviews/compare.tsx
import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity 
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { COLORS } from '../../src/constants';
import LoadingView from '../components/shared/LoadingView';
import { Strain } from "@/src/types";
import StrainService from '../../src/services/StrainService';
import Animated, { FadeIn } from 'react-native-reanimated';

interface CompareRowProps {
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
  label: string;
  values: { text: string; subtext?: string }[];
}

const CompareRow = React.memo(({ icon, label, values }: CompareRowProps) => (
  <View style={styles.rowCard}>
    <View style={styles.rowHeader}>
      <View style={styles.iconContainer}>
        <MaterialCommunityIcons 
          name={icon} 
          size={20} 
          color={COLORS.primary} 
        />
      </View>
      <Text style={styles.rowLabel}>{label}</Text>
    </View>
    
    <View style={styles.rowContent}>
      {values.map((value, index) => (
        <View key={index} style={styles.valueCell}>
          <Text style={styles.valueText}>{value.text}</Text>
          {value.subtext && (
            <Text style={styles.valueSubtext}>{value.subtext}</Text>
          )}
        </View>
      ))}
    </View>
  </View>
));

export default function CompareScreen() {
  const router = useRouter();
  const { ids } = useLocalSearchParams();
  const [strains, setStrains] = useState<Strain[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Parse IDs once using useMemo
  const strainIds = useMemo(() => {
    return ids?.toString().split(',').map(Number).filter(Boolean) || [];
  }, [ids]);

  // Load strains once using useCallback
  const loadStrains = useCallback(async () => {
    if (!strainIds.length) {
      setError('No strains selected for comparison');
      setIsLoading(false);
      return;
    }
    
    try {
      setIsLoading(true);
      setError(null);
      const uniqueIds = [...new Set(strainIds)]; // Remove duplicates
      const loadedStrains = await Promise.all(
        uniqueIds.map(id => StrainService.getStrainById(id))
      );
      
      const validStrains = loadedStrains.filter((strain): strain is Strain => 
        strain !== null
      );

      if (!validStrains.length) {
        setError('Could not load the selected strains');
      }
      
      setStrains(validStrains);
    } catch (error) {
      console.error('Error loading strains:', error);
      setError('Failed to load strains for comparison');
    } finally {
      setIsLoading(false);
    }
  }, [strainIds]);

  // Load data only once when IDs change
  useEffect(() => {
    loadStrains();
  }, [loadStrains]);

  if (isLoading) {
    return <LoadingView />;
  }

  if (error || !strains.length) {
    return (
      <View style={styles.container}>
        <View style={styles.headerBar}>
          <TouchableOpacity 
            onPress={() => router.back()}
          >
            <MaterialCommunityIcons 
              name="chevron-left" 
              size={24} 
              color="#FFFFFF" 
            />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Compare Strains</Text>
        </View>
        <View style={styles.header}>
          <TouchableOpacity 
            onPress={() => router.back()}
            style={styles.backButton}
          >
            <MaterialCommunityIcons 
              name="chevron-left" 
              size={24} 
              color={COLORS.primary} 
            />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{error || 'No Strains to Compare'}</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Navigation Bar */}
      
      
      {/* Main Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          onPress={() => router.back()}
          style={styles.backButton}
        >
          <MaterialCommunityIcons 
            name="chevron-left" 
            size={24} 
            color={COLORS.primary} 
          />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Compare Strains</Text>
      </View>

      <ScrollView 
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* Strain Names Card */}
        <View style={styles.rowCard}>
          <View style={styles.rowHeader}>
            <View style={styles.iconContainer}>
              <MaterialCommunityIcons 
                name="cannabis" 
                size={20} 
                color={COLORS.primary} 
              />
            </View>
          </View>
          
          <View style={styles.rowContent}>
            {strains.map((strain, index) => (
              <View key={index} style={styles.strainNameCell}>
                <Text style={styles.strainName}>{strain.name}</Text>
                <Text style={styles.strainType}>{strain.genetic_type}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Rating Row */}
        <CompareRow 
          icon="star"
          label="Rating"
          values={strains.map(strain => ({
            text: strain.combined_rating.toFixed(1),
            subtext: `THC: ${strain.thc_range}`
          }))}
        />

        {/* Effects Row */}
        <CompareRow 
          icon="flash"
          label="Effects"
          values={strains.map(strain => ({
            text: strain.effects
          }))}
        />

        {/* Terpenes Row */}
        <CompareRow 
          icon="molecule"
          label="Terpenes"
          values={strains.map(strain => ({
            text: strain.dominant_terpenes
          }))}
        />

        {/* CBD Level Row */}
        <CompareRow 
          icon="medical-bag"
          label="CBD"
          values={strains.map(strain => ({
            text: strain.cbd_level
          }))}
        />

        {/* Uses Row */}
        <CompareRow 
          icon="information"
          label="Uses"
          values={strains.map(strain => ({
            text: strain.uses
          }))}
        />

        {/* Negatives Row */}
        <CompareRow 
          icon="alert"
          label="Negatives"
          values={strains.map(strain => ({
            text: strain.negatives
          }))}
        />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  headerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
  },
  headerText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#000000',
    marginLeft: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: '#000000',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 230, 118, 0.1)',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0, 230, 118, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
    gap: 12,
  },
  rowCard: {
    backgroundColor: 'rgba(12, 20, 14, 1)',
    borderRadius: 12,
    marginBottom: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(0, 230, 118, 0.1)',
  },
  rowHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderBottomWidth: 0,
    borderBottomColor: 'rgba(0, 230, 118, 0.1)',
  },
  iconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(0, 230, 118, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  rowLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#AAAAAA',
  },
  rowContent: {
    flexDirection: 'row',
    paddingVertical: 8,
  },
  valueCell: {
    flex: 1,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRightWidth: 1,
    borderRightColor: 'rgba(255, 255, 255, 0.05)',
  },
  strainNameCell: {
    flex: 1,
    padding: 8,
    alignItems: 'center',
  },
  strainName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 4,
  },
  strainType: {
    fontSize: 12,
    color: COLORS.primary,
    textAlign: 'center',
  },
  valueText: {
    fontSize: 14,
    color: '#FFFFFF',
    lineHeight: 20,
  },
  valueSubtext: {
    fontSize: 12,
    color: '#AAAAAA',
    marginTop: 4,
  },
});