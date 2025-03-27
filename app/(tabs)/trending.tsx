// app/(tabs)/trending.tsx
import React, { useState, useCallback, useEffect, memo, useMemo } from 'react';
import { View, Text, StyleSheet, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { useStrains } from '../../src/hooks/useStrains';
import { COLORS } from '../../src/constants';
import { StrainSearchFilters } from '../../src/DatabaseManager';
import { Strain } from "@/src/types";
import { LinearGradient } from 'expo-linear-gradient';
import LoadingView from '../components/shared/LoadingView';
import Header from '../components/trending/Header';
import StrainsList from '../components/trending/StrainsList';
import CompareBar from '../components/trending/CompareBar';
import SearchFilters from '../components/trending/SearchFilters';
import { hasActiveFilters } from '../../src/utils/filters';
import Animated, { FadeIn } from 'react-native-reanimated';

const TrendingScreen = memo(() => {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [compareList, setCompareList] = useState<Strain[]>([]);
  const [filters, setFilters] = useState<StrainSearchFilters>({
    geneticType: undefined,
    effects: [],
    sort: 'rating'
  });

  const { 
    strains,
    popularStrains,
    categories,
    isLoading,
    error,
    searchStrains,
    clearSearch,
    loadMore,
    toggleFavorite,
    isFavorite,
    pagination
  } = useStrains();

  useEffect(() => {
    const delaySearch = setTimeout(() => {
      if (searchQuery.trim() || hasActiveFilters(filters)) {
        searchStrains(searchQuery, filters);
      } else {
        clearSearch();
      }
    }, 300);

    return () => clearTimeout(delaySearch);
  }, [searchQuery, filters, searchStrains, clearSearch]);

  const handleFilterChange = useCallback((newFilters: StrainSearchFilters) => {
    setFilters(newFilters);
  }, []);

  const handleApplyFilters = useCallback(() => {
    setShowFilters(false);
  }, []);

  const handleClearSearch = useCallback(() => {
    setSearchQuery('');
    setFilters({
      geneticType: undefined,
      effects: [],
      sort: 'rating'
    });
    clearSearch();
  }, [clearSearch]);

  const handleCompareToggle = useCallback((strain: Strain) => {
    setCompareList(prev => {
      if (prev.some(s => s.id === strain.id)) {
        return prev.filter(s => s.id !== strain.id);
      }
      if (prev.length >= 3) return prev;
      return [...prev, strain];
    });
  }, []);

  const handleCompare = useCallback(() => {
    if (compareList.length >= 2) {
      router.push({
        pathname: "/dataOverviews/compare",
        params: { ids: compareList.map(s => s.id).join(',') }
      } as any);
    }
  }, [compareList, router]);

  // Memoize the displayed strains to prevent unnecessary re-renders
  const displayedStrains = useMemo(() => 
    searchQuery.trim() || hasActiveFilters(filters) ? strains : popularStrains,
    [searchQuery, filters, strains, popularStrains]
  );

  // Memoize the section title
  const sectionTitle = useMemo(() => 
    searchQuery.trim() || hasActiveFilters(filters) 
      ? `Search Results (${pagination.total})`
      : "Popular Strains",
    [searchQuery, filters, pagination.total]
  );

  if (isLoading && !strains.length && !popularStrains.length) {
    return <LoadingView />;
  }

  return (
    <SafeAreaProvider>
      <View style={styles.container}>
        {/* Black background */}
        <View style={StyleSheet.absoluteFillObject} />
        
        {/* Header with glow effect */}
        <LinearGradient
          colors={['rgba(0, 230, 118, 0.15)', 'transparent']}
          style={styles.headerGradient}
          start={{ x: 0.5, y: 0 }}
          end={{ x: 0.5, y: 0.3 }}
        />
        
        <Header 
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          showFilters={showFilters}
          setShowFilters={setShowFilters}
          filters={filters}
          handleClearSearch={handleClearSearch}
        />

        {showFilters && (
          <Animated.View 
            entering={FadeIn.duration(300)}
            style={styles.filtersContainer}
          >
            <SearchFilters
              filters={filters}
              onFilterChange={handleFilterChange}
              onApplyFilters={handleApplyFilters}
              categories={categories}
            />
          </Animated.View>
        )}

        <View style={styles.mainContent}>
          <View style={styles.sectionHeaderContainer}>
            <LinearGradient
              colors={['rgba(0, 230, 118, 0.12)', 'transparent']}
              style={styles.sectionHeaderGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            />
            <Text style={styles.sectionTitle}>{sectionTitle}</Text>
          </View>
          
          {/* Don't wrap this in a ScrollView since StrainsList is already virtualized */}
          <View style={styles.listWrapper}>
            <StrainsList
              strains={displayedStrains}
              onCompareToggle={handleCompareToggle}
              onFavoriteToggle={toggleFavorite}
              compareList={compareList}
              isFavorite={isFavorite}
              isLoading={isLoading}
              onEndReached={loadMore}
            />
          </View>
        </View>

        {compareList.length > 0 && (
          <CompareBar
            compareList={compareList}
            onCompareToggle={handleCompareToggle}
            onCompare={handleCompare}
          />
        )}
      </View>
    </SafeAreaProvider>
  );
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000', // Jet black background
  },
  headerGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 150,
    zIndex: 0,
  },
  filtersContainer: {
    paddingHorizontal: 20,
    paddingBottom: 16,
    marginTop: 8,
    zIndex: 1,
  },
  mainContent: {
    flex: 1,
    paddingHorizontal: 20,
  },
  sectionHeaderContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    paddingVertical: 10,
    position: 'relative',
  },
  sectionHeaderGradient: {
    position: 'absolute',
    left: -20,
    right: -20,
    top: 0,
    bottom: 0,
    height: '100%',
    borderRadius: 8,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: COLORS.text.primary,
    letterSpacing: 0.5,
    textShadowColor: 'rgba(0, 230, 118, 0.5)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 4,
  },
  listWrapper: {
    flex: 1,
  }
});

export default TrendingScreen;