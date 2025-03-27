import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { StrainSearchFilters } from '../../../src/DatabaseManager';
import { COLORS } from '../../../src/constants';
import { LinearGradient } from 'expo-linear-gradient';

interface SearchFiltersProps {
  filters: StrainSearchFilters;
  onFilterChange: (filters: StrainSearchFilters) => void;
  onApplyFilters: () => void;
  categories: { [key: string]: number };
}

const SORT_OPTIONS = [
  { key: 'rating', label: 'Rating', icon: 'star' },
  { key: 'name', label: 'Name', icon: 'sort-alphabetical-ascending' },
  { key: 'thc', label: 'THC', icon: 'percent' },
] as const;

const COMMON_EFFECTS = [
  'Relaxed',
  'Energetic',
  'Creative',
  'Focused',
  'Euphoric',
  'Sleepy',
  'Happy',
  'Uplifted'
];

export default function SearchFilters({ 
  filters, 
  onFilterChange, 
  onApplyFilters,
  categories 
}: SearchFiltersProps) {
  const [localFilters, setLocalFilters] = useState<StrainSearchFilters>(filters);

  const handleSortChange = (sort: StrainSearchFilters['sort']) => {
    setLocalFilters(prev => ({ ...prev, sort }));
  };

  const handleEffectToggle = (effect: string) => {
    const currentEffects = localFilters.effects || [];
    const newEffects = currentEffects.includes(effect)
      ? currentEffects.filter(e => e !== effect)
      : [...currentEffects, effect];
    setLocalFilters(prev => ({ ...prev, effects: newEffects }));
  };

  const handleGeneticTypeChange = (geneticType: string | undefined) => {
    setLocalFilters(prev => ({ ...prev, geneticType }));
  };

  const handleApply = () => {
    onFilterChange(localFilters);
    onApplyFilters();
  };

  return (
    <View style={styles.container}>
      {/* Sort Options */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Sort By</Text>
        <View style={styles.sortOptions}>
          {SORT_OPTIONS.map(({ key, label, icon }) => (
            <TouchableOpacity
              key={key}
              style={[
                styles.sortOption,
                localFilters.sort === key && styles.sortOptionActive
              ]}
              onPress={() => handleSortChange(key)}
            >
              <MaterialCommunityIcons
                name={icon}
                size={18}
                color={localFilters.sort === key ? COLORS.primary : COLORS.text.secondary}
              />
              <Text style={[
                styles.sortOptionText,
                localFilters.sort === key && styles.sortOptionTextActive
              ]}>
                {label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Genetic Types */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Genetic Type</Text>
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          style={styles.geneticTypes}
        >
          <TouchableOpacity
            style={[
              styles.typeChip,
              !localFilters.geneticType && styles.typeChipActive
            ]}
            onPress={() => handleGeneticTypeChange(undefined)}
          >
            <Text style={[
              styles.typeChipText,
              !localFilters.geneticType && styles.typeChipTextActive
            ]}>
              All
            </Text>
          </TouchableOpacity>
          {Object.entries(categories).map(([type, count]) => (
            <TouchableOpacity
              key={type}
              style={[
                styles.typeChip,
                localFilters.geneticType === type && styles.typeChipActive
              ]}
              onPress={() => handleGeneticTypeChange(type)}
            >
              <Text style={[
                styles.typeChipText,
                localFilters.geneticType === type && styles.typeChipTextActive
              ]}>
                {type} ({count})
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Effects */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Effects</Text>
        <View style={styles.effectsGrid}>
          {COMMON_EFFECTS.map(effect => (
            <TouchableOpacity
              key={effect}
              style={[
                styles.effectChip,
                (localFilters.effects || []).includes(effect) && styles.effectChipActive
              ]}
              onPress={() => handleEffectToggle(effect)}
            >
              <Text style={[
                styles.effectChipText,
                (localFilters.effects || []).includes(effect) && styles.effectChipTextActive
              ]}>
                {effect}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Apply Button */}
      <TouchableOpacity 
        style={styles.applyButton}
        onPress={handleApply}
      >
        <LinearGradient
          colors={[COLORS.primary, COLORS.primaryDark]}
          style={styles.applyButtonGradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <Text style={styles.applyButtonText}>Apply Filters</Text>
          <MaterialCommunityIcons 
            name="check" 
            size={20} 
            color="#FFF" 
          />
        </LinearGradient>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.cardBackground,
    borderRadius: 12,
    padding: 16,
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text.primary,
    marginBottom: 12,
  },
  sortOptions: {
    flexDirection: 'row',
    gap: 12,
  },
  sortOption: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    gap: 6,
  },
  sortOptionActive: {
    backgroundColor: 'rgba(0, 230, 118, 0.1)',
  },
  sortOptionText: {
    fontSize: 14,
    color: COLORS.text.secondary,
  },
  sortOptionTextActive: {
    color: COLORS.primary,
  },
  geneticTypes: {
    flexDirection: 'row',
  },
  typeChip: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginRight: 8,
  },
  typeChipActive: {
    backgroundColor: 'rgba(0, 230, 118, 0.1)',
  },
  typeChipText: {
    fontSize: 14,
    color: COLORS.text.secondary,
  },
  typeChipTextActive: {
    color: COLORS.primary,
  },
  effectsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  effectChip: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  effectChipActive: {
    backgroundColor: 'rgba(0, 230, 118, 0.1)',
  },
  effectChipText: {
    fontSize: 14,
    color: COLORS.text.secondary,
  },
  effectChipTextActive: {
    color: COLORS.primary,
  },
  applyButton: {
    marginTop: 20,
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  applyButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 8,
    width: '100%',
  },
  applyButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFF',
    marginRight: 8,
  },
});