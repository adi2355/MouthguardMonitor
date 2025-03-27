// app/components/trending/SearchBar.tsx
import React, { memo } from 'react';
import { View, TextInput, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../../../src/constants';
import { LinearGradient } from 'expo-linear-gradient';
import { StrainSearchFilters } from '../../../src/DatabaseManager';
import { hasActiveFilters } from '../../../src/utils/filters';
import Animated, { useAnimatedStyle, useSharedValue, withSpring, FadeIn } from 'react-native-reanimated';

interface SearchBarProps {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  showFilters: boolean;
  setShowFilters: (show: boolean) => void;
  filters: StrainSearchFilters;
  onClear: () => void;
}

const SearchBar = memo(({
  searchQuery,
  setSearchQuery,
  showFilters,
  setShowFilters,
  filters,
  onClear
}: SearchBarProps) => {
  // Determine if we need the clear button
  const showClearButton = searchQuery.trim() || hasActiveFilters(filters);
  
  // Define filter button states
  const hasFilters = hasActiveFilters(filters);
  const isFilterActive = showFilters || hasFilters;
  
  return (
    <View style={styles.searchContainer}>
      {/* Main search input with enhanced styling */}
      <View style={styles.searchBar}>
        <LinearGradient
          colors={['rgba(0,0,0,0.2)', 'rgba(0,0,0,0.1)']}
          style={StyleSheet.absoluteFillObject}
          start={{ x: 0, y: 0 }}
          end={{ x: 0, y: 1 }}
        />
        
        <MaterialCommunityIcons 
          name="magnify" 
          size={22} 
          color={COLORS.text.secondary} 
          style={styles.searchIcon}
        />
        
        <TextInput
          style={styles.searchInput}
          placeholder="Search strains..."
          placeholderTextColor="rgba(255,255,255,0.4)"
          value={searchQuery}
          onChangeText={setSearchQuery}
          returnKeyType="search"
          autoCapitalize="none"
          autoCorrect={false}
          clearButtonMode="while-editing"
        />
        
        {Platform.OS === 'android' && showClearButton && (
          <TouchableOpacity 
            onPress={onClear}
            style={styles.clearButton}
          >
            <MaterialCommunityIcons 
              name="close-circle" 
              size={18} 
              color={COLORS.text.secondary} 
            />
          </TouchableOpacity>
        )}
      </View>

      {/* Enhanced filter button with states */}
      <TouchableOpacity 
        style={[styles.filterButton, isFilterActive && styles.filterButtonActive]}
        onPress={() => setShowFilters(!showFilters)}
        activeOpacity={0.7}
      >
        <LinearGradient
          colors={
            isFilterActive 
              ? ['rgba(0,230,118,0.2)', 'rgba(0,230,118,0.1)']
              : ['rgba(0,0,0,0.2)', 'rgba(0,0,0,0.1)']
          }
          style={StyleSheet.absoluteFillObject}
          start={{ x: 0, y: 0 }}
          end={{ x: 0, y: 1 }}
        />
        
        <MaterialCommunityIcons 
          name="filter-variant" 
          size={22} 
          color={isFilterActive ? COLORS.primary : COLORS.text.secondary} 
        />
        
        {/* Badge indicator if filters are active */}
        {hasFilters && (
          <View style={styles.filterBadge}>
            <LinearGradient
              colors={['#00E676', '#00C853']}
              style={StyleSheet.absoluteFillObject}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            />
          </View>
        )}
      </TouchableOpacity>
    </View>
  );
});

const styles = StyleSheet.create({
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  searchBar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.25)',
    borderRadius: 12,
    height: 44,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  searchIcon: {
    marginLeft: 12,
    marginRight: 4,
  },
  searchInput: {
    flex: 1,
    color: '#000000',
    fontSize: 16,
    fontWeight: '400',
    paddingVertical: 10,
    paddingHorizontal: 8,
  },
  clearButton: {
    padding: 8,
    marginRight: 4,
  },
  filterButton: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.25)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    overflow: 'hidden',
    position: 'relative',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  filterButtonActive: {
    borderColor: 'rgba(0, 230, 118, 0.3)',
  },
  filterBadge: {
    position: 'absolute',
    top: 10,
    right: 10,
    width: 8,
    height: 8,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    overflow: 'hidden',
  },
});

export default SearchBar;