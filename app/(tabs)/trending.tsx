// app/(tabs)/trending.tsx
import React, { useState, useCallback, useEffect, memo } from 'react';
import { View, StyleSheet, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { useStrains } from '@/src/hooks/useStrains';
import { COLORS } from '@/src/constants';
import { StrainSearchFilters } from '@/src/services/StrainService';
import { Strain } from '@/src/dbManager';
import LoadingView from '@/app/components/LoadingView';
import Animated, { FadeIn } from 'react-native-reanimated';
import Header from '@/app/components/trending/Header';
import Section from '@/app/components/trending/Section';
import StrainsList from '@/app/components/trending/StrainsList';
import CompareBar from '@/app/components/trending/CompareBar';
import SearchFilters from '@/app/components/search/SearchFilters';
import { hasActiveFilters } from '@/src/utils/filters';

export default memo(function TrendingScreen() {
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

  if (isLoading && !strains.length && !popularStrains.length) {
    return <LoadingView />;
  }

  return (
    <SafeAreaProvider>
      <Animated.ScrollView
        style={styles.container}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
        entering={FadeIn.duration(200)}
        scrollEventThrottle={16}
        removeClippedSubviews={true}
      >
        <Header 
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          showFilters={showFilters}
          setShowFilters={setShowFilters}
          filters={filters}
          handleClearSearch={handleClearSearch}
        />

        <View style={styles.mainContent}>
          {showFilters && (
            <Section title="Filters">
              <SearchFilters
                filters={filters}
                onFilterChange={handleFilterChange}
                onApplyFilters={handleApplyFilters}
                categories={categories}
              />
            </Section>
          )}

          <Section title={searchQuery.trim() || hasActiveFilters(filters) ? 
            `Search Results (${pagination.total})` : 
            "Popular Strains"
          }>
            <StrainsList
              strains={searchQuery.trim() || hasActiveFilters(filters) ? 
                strains : 
                popularStrains
              }
              onCompareToggle={handleCompareToggle}
              onFavoriteToggle={toggleFavorite}
              compareList={compareList}
              isFavorite={isFavorite}
              isLoading={isLoading}
              onEndReached={loadMore}
            />
          </Section>
        </View>
      </Animated.ScrollView>

      {compareList.length > 0 && (
        <CompareBar
          compareList={compareList}
          onCompareToggle={handleCompareToggle}
          onCompare={handleCompare}
        />
      )}
    </SafeAreaProvider>
  );
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  contentContainer: {
    paddingBottom: 32,
  },
  mainContent: {
    paddingHorizontal: 20,
  },
});