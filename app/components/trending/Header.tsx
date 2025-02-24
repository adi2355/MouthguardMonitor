import React, { memo } from 'react';
import { View, Text, StyleSheet, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS } from '@/src/constants';
import SearchBar from './SearchBar';
import { StrainSearchFilters } from '@/src/services/StrainService';

interface HeaderProps {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  showFilters: boolean;
  setShowFilters: (show: boolean) => void;
  filters: StrainSearchFilters;
  handleClearSearch: () => void;
}

const Header = memo(({ 
  searchQuery, 
  setSearchQuery,
  showFilters,
  setShowFilters,
  filters,
  handleClearSearch 
}: HeaderProps) => (
  <View style={styles.headerSection}>
    <LinearGradient
      colors={['rgba(0,230,118,0.15)', 'rgba(0,230,118,0.05)', 'transparent']}
      style={styles.headerGradient}
      start={{ x: 0, y: 0 }}
      end={{ x: 0, y: 1 }}
    />
    <View style={styles.headerContent}>
      <View>
        <Text style={styles.headerTitle}>Trending</Text>
        <Text style={styles.headerSubtitle}>Discover popular strains</Text>
      </View>
      <SearchBar
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        showFilters={showFilters}
        setShowFilters={setShowFilters}
        filters={filters}
        onClear={handleClearSearch}
      />
    </View>
  </View>
));

const styles = StyleSheet.create({
  headerSection: {
    height: 120,
    position: 'relative',
    backgroundColor: Platform.select({
      ios: 'rgba(26, 26, 26, 0.85)',
      android: 'rgba(26, 26, 26, 0.95)',
    }),
    marginBottom: 24,
  },
  headerGradient: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0.8,
  },
  headerContent: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  headerTitle: {
    fontSize: 34,
    fontWeight: '700',
    color: COLORS.text.primary,
    letterSpacing: 0.5,
  },
  headerSubtitle: {
    fontSize: 16,
    color: COLORS.text.secondary,
    marginTop: 4,
  },
});

export default Header; 