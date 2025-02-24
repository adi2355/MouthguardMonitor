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
import { COLORS } from '@/src/constants';
import LoadingView from '@/app/components/LoadingView';
import { Strain } from '@/src/dbManager';
import StrainService from '@/src/services/StrainService';

interface CompareValue {
  value: string | number;
  subtext?: string;
  multiline?: boolean;
}

interface CompareRowProps {
  label: string;
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
  values: CompareValue[];
}

const CompareRow = React.memo(({ label, icon, values }: CompareRowProps) => (
  <View style={styles.row}>
    <View style={styles.labelCell}>
      <MaterialCommunityIcons 
        name={icon} 
        size={20} 
        color={COLORS.text.secondary} 
      />
      <Text style={styles.labelText}>{label}</Text>
    </View>
    {values.map((item, index) => (
      <View key={index} style={styles.cell}>
        <Text style={[
          styles.cellText,
          item.multiline && styles.multilineText
        ]}>
          {item.value}
        </Text>
        {item.subtext && (
          <Text style={styles.subtextText}>{item.subtext}</Text>
        )}
      </View>
    ))}
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
        <View style={styles.header}>
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
          <Text style={styles.title}>{error || 'No Strains to Compare'}</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
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
        <Text style={styles.title}>Compare Strains</Text>
      </View>

      <ScrollView 
        showsVerticalScrollIndicator={false}
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
      >
        {/* Strain Names Row */}
        <View style={styles.row}>
          <View style={styles.labelCell}>
            <MaterialCommunityIcons 
              name="cannabis" 
              size={24} 
              color={COLORS.primary} 
            />
          </View>
          {strains.map(strain => (
            <View key={strain.id} style={styles.cell}>
              <Text style={styles.strainName}>{strain.name}</Text>
              <Text style={styles.strainType}>{strain.genetic_type}</Text>
            </View>
          ))}
        </View>

        {/* Rating Row */}
        <CompareRow 
          label="Rating"
          icon="star"
          values={strains.map(strain => ({
            value: strain.combined_rating.toFixed(1),
            subtext: `THC: ${strain.thc_range}`
          }))}
        />

        {/* Effects Row */}
        <CompareRow 
          label="Effects"
          icon="flash"
          values={strains.map(strain => ({
            value: strain.effects,
            multiline: true
          }))}
        />

        {/* Terpenes Row */}
        <CompareRow 
          label="Terpenes"
          icon="molecule"
          values={strains.map(strain => ({
            value: strain.dominant_terpenes,
            multiline: true
          }))}
        />

        {/* CBD Level Row */}
        <CompareRow 
          label="CBD"
          icon="medical-bag"
          values={strains.map(strain => ({
            value: strain.cbd_level
          }))}
        />

        {/* Uses Row */}
        <CompareRow 
          label="Uses"
          icon="information"
          values={strains.map(strain => ({
            value: strain.uses,
            multiline: true
          }))}
        />

        {/* Negatives Row */}
        <CompareRow 
          label="Negatives"
          icon="alert"
          values={strains.map(strain => ({
            value: strain.negatives,
            multiline: true
          }))}
        />
      </ScrollView>
    </View>
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
    padding: 20,
    paddingTop: 60,
  },
  backButton: {
    marginRight: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: COLORS.text.primary,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 20,
    gap: 16,
  },
  row: {
    flexDirection: 'row',
    backgroundColor: COLORS.cardBackground,
    borderRadius: 12,
    overflow: 'hidden',
  },
  labelCell: {
    width: 100,
    padding: 12,
    backgroundColor: 'rgba(0,230,118,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  labelText: {
    fontSize: 14,
    color: COLORS.text.secondary,
    textAlign: 'center',
  },
  cell: {
    flex: 1,
    padding: 12,
    borderLeftWidth: 1,
    borderLeftColor: 'rgba(255,255,255,0.1)',
  },
  strainName: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text.primary,
    marginBottom: 4,
  },
  strainType: {
    fontSize: 14,
    color: COLORS.text.secondary,
  },
  cellText: {
    fontSize: 14,
    color: COLORS.text.primary,
  },
  multilineText: {
    lineHeight: 20,
  },
  subtextText: {
    fontSize: 12,
    color: COLORS.text.tertiary,
    marginTop: 4,
  },
});