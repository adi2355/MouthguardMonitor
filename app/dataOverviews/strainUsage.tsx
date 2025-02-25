import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { COLORS } from '../../src/constants';
import { useDataService } from '../../src/hooks/useDataService';
import LoadingView from '../components/shared/LoadingView';
import ErrorView from '../components/shared/ErrorView';
import { LinearGradient } from 'expo-linear-gradient';

interface StrainUsage {
  strainId: number;
  strainName: string;
  strainType: string;
  usageCount: number;
  percentageOfTotal: number;
}

export default function StrainUsage() {
  const router = useRouter();
  const { usageStats, isLoading, error } = useDataService();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState<string | null>(null);

  // Sample strain data - in a real app, this would come from your database
  const mockStrainData: StrainUsage[] = [
    {
      strainId: 1,
      strainName: "Blue Dream",
      strainType: "Hybrid",
      usageCount: 42,
      percentageOfTotal: 35.6
    },
    {
      strainId: 2,
      strainName: "OG Kush",
      strainType: "Indica",
      usageCount: 28,
      percentageOfTotal: 23.7
    },
    {
      strainId: 3,
      strainName: "Sour Diesel",
      strainType: "Sativa",
      usageCount: 18,
      percentageOfTotal: 15.3
    },
    {
      strainId: 4,
      strainName: "Girl Scout Cookies",
      strainType: "Hybrid",
      usageCount: 15,
      percentageOfTotal: 12.7
    },
    {
      strainId: 5,
      strainName: "Northern Lights",
      strainType: "Indica",
      usageCount: 10,
      percentageOfTotal: 8.5
    },
    {
      strainId: 6,
      strainName: "Jack Herer",
      strainType: "Sativa",
      usageCount: 5,
      percentageOfTotal: 4.2
    }
  ];

  if (isLoading) return <LoadingView />;
  if (error) return <ErrorView error={error} />;

  // Filter strains based on search query and selected type
  const filteredStrains = mockStrainData.filter(strain => {
    const matchesSearch = searchQuery === '' || 
      strain.strainName.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = selectedType === null || strain.strainType === selectedType;
    return matchesSearch && matchesType;
  });

  return (
    <SafeAreaProvider>
      <ScrollView 
        style={styles.container}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity 
            onPress={() => router.back()}
            style={styles.backButton}
          >
            <MaterialCommunityIcons 
              name="chevron-left" 
              size={28} 
              color={COLORS.primary} 
            />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Strain Usage Analytics</Text>
        </View>

        {/* Search and Filter */}
        <View style={styles.searchContainer}>
          <View style={styles.searchInputContainer}>
            <MaterialCommunityIcons 
              name="magnify" 
              size={20} 
              color={COLORS.text.secondary} 
              style={styles.searchIcon}
            />
            <TextInput
              style={styles.searchInput}
              placeholder="Search strains..."
              placeholderTextColor={COLORS.text.tertiary}
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
          </View>
          
          <View style={styles.filterButtons}>
            <TouchableOpacity
              style={[
                styles.filterButton,
                selectedType === null && styles.filterButtonActive
              ]}
              onPress={() => setSelectedType(null)}
            >
              <Text style={[
                styles.filterButtonText,
                selectedType === null && styles.filterButtonTextActive
              ]}>All</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.filterButton,
                selectedType === 'Indica' && styles.filterButtonActive
              ]}
              onPress={() => setSelectedType('Indica')}
            >
              <Text style={[
                styles.filterButtonText,
                selectedType === 'Indica' && styles.filterButtonTextActive
              ]}>Indica</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.filterButton,
                selectedType === 'Sativa' && styles.filterButtonActive
              ]}
              onPress={() => setSelectedType('Sativa')}
            >
              <Text style={[
                styles.filterButtonText,
                selectedType === 'Sativa' && styles.filterButtonTextActive
              ]}>Sativa</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.filterButton,
                selectedType === 'Hybrid' && styles.filterButtonActive
              ]}
              onPress={() => setSelectedType('Hybrid')}
            >
              <Text style={[
                styles.filterButtonText,
                selectedType === 'Hybrid' && styles.filterButtonTextActive
              ]}>Hybrid</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Strains List */}
        <View style={styles.strainsList}>
          {filteredStrains.length === 0 ? (
            <View style={styles.emptyState}>
              <MaterialCommunityIcons 
                name="cannabis" 
                size={48} 
                color={COLORS.text.tertiary} 
              />
              <Text style={styles.emptyStateText}>No strains found</Text>
            </View>
          ) : (
            filteredStrains.map(strain => (
              <View key={strain.strainId} style={styles.strainItem}>
                <View style={styles.strainHeader}>
                  <View>
                    <Text style={styles.strainName}>{strain.strainName}</Text>
                    <View style={styles.typeContainer}>
                      <View style={[
                        styles.typeDot, 
                        { 
                          backgroundColor: 
                            strain.strainType === 'Indica' ? '#9C27B0' : 
                            strain.strainType === 'Sativa' ? '#FF9800' : 
                            COLORS.primary 
                        }
                      ]} />
                      <Text style={styles.strainType}>{strain.strainType}</Text>
                    </View>
                  </View>
                  <View style={styles.usageContainer}>
                    <Text style={styles.usageCount}>{strain.usageCount} hits</Text>
                    <Text style={styles.usagePercentage}>{strain.percentageOfTotal.toFixed(1)}%</Text>
                  </View>
                </View>
                
                <View style={styles.progressContainer}>
                  <LinearGradient
                    colors={
                      strain.strainType === 'Indica' ? ['#9C27B0', '#CE93D8'] : 
                      strain.strainType === 'Sativa' ? ['#FF9800', '#FFCC80'] : 
                      [COLORS.primary, COLORS.primaryLight]
                    }
                    style={[styles.progressFill, { width: `${strain.percentageOfTotal}%` }]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                  />
                </View>
              </View>
            ))
          )}
        </View>
      </ScrollView>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  contentContainer: {
    paddingBottom: 32,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 230, 118, 0.1)',
    marginRight: 12,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: COLORS.text.primary,
    letterSpacing: 0.35,
  },
  searchContainer: {
    paddingHorizontal: 16,
    marginTop: 16,
    marginBottom: 24,
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    paddingHorizontal: 12,
    marginBottom: 16,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    height: 48,
    color: COLORS.text.primary,
    fontSize: 16,
  },
  filterButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  filterButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  filterButtonActive: {
    backgroundColor: 'rgba(0, 230, 118, 0.2)',
  },
  filterButtonText: {
    fontSize: 14,
    color: COLORS.text.secondary,
  },
  filterButtonTextActive: {
    color: COLORS.primary,
    fontWeight: '600',
  },
  strainsList: {
    paddingHorizontal: 16,
    gap: 16,
  },
  strainItem: {
    backgroundColor: 'rgba(26, 26, 26, 0.8)',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  strainHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  strainName: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.text.primary,
    marginBottom: 4,
  },
  typeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  typeDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  strainType: {
    fontSize: 14,
    color: COLORS.text.secondary,
  },
  usageContainer: {
    alignItems: 'flex-end',
  },
  usageCount: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text.primary,
    marginBottom: 4,
  },
  usagePercentage: {
    fontSize: 14,
    color: COLORS.text.secondary,
  },
  progressContainer: {
    height: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 48,
  },
  emptyStateText: {
    fontSize: 16,
    color: COLORS.text.secondary,
    marginTop: 16,
  },
}); 