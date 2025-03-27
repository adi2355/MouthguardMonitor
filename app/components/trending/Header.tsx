// components/trending/Header.tsx
import React, { useState, memo } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS } from '../../../src/constants';
import { StrainSearchFilters } from '../../../src/DatabaseManager';
import { hasActiveFilters } from '../../../src/utils/filters';
import Animated, { FadeIn } from 'react-native-reanimated';
import SearchBar from './SearchBar';

interface HeaderProps {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  showFilters: boolean;
  setShowFilters: (show: boolean) => void;
  filters: StrainSearchFilters;
  handleClearSearch: () => void;
}

const Header = ({ 
  searchQuery, 
  setSearchQuery, 
  showFilters, 
  setShowFilters,
  filters,
  handleClearSearch
}: HeaderProps) => {
  const insets = useSafeAreaInsets();
  const hasFilters = hasActiveFilters(filters);
  const hasSearchOrFilters = searchQuery.trim() || hasFilters;

  return (
    <View style={[styles.container, { paddingTop: insets.top + 10 }]}>
      <LinearGradient
        colors={['rgba(0, 230, 118, 0.15)', 'transparent']}
        style={[styles.headerGradient, { top: 0 }]}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
      />
      
      <Text style={styles.title}>Trending</Text>
      
      <View style={styles.searchContainer}>
        <View style={styles.searchInputContainer}>
          <Ionicons name="search" size={20} color={COLORS.text.secondary} style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search strains..."
            placeholderTextColor={COLORS.text.placeholder}
            value={searchQuery}
            onChangeText={setSearchQuery}
            returnKeyType="search"
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')} style={styles.clearButton}>
              <Ionicons name="close-circle" size={18} color={COLORS.text.secondary} />
            </TouchableOpacity>
          )}
        </View>
        
        <TouchableOpacity 
          style={[
            styles.filterButton, 
            hasFilters && styles.activeFilterButton
          ]} 
          onPress={() => setShowFilters(!showFilters)}
        >
          <Ionicons 
            name="options-outline" 
            size={20} 
            color={hasFilters ? COLORS.accent : COLORS.text.secondary} 
          />
        </TouchableOpacity>
      </View>
      
      {hasSearchOrFilters && (
        <View style={styles.clearSearchContainer}>
          <TouchableOpacity 
            style={styles.clearSearchButton}
            onPress={handleClearSearch}
          >
            <Text style={styles.clearSearchText}>Clear All</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 20,
    paddingBottom: 16,
    position: 'relative',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.05)',
  },
  headerGradient: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 150,
  },
  title: {
    fontSize: 34,
    fontWeight: '700',
    color: 'white',
    marginBottom: 20,
    letterSpacing: 0.5,
    textShadowColor: 'rgba(0, 230, 118, 0.6)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 8,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  searchInputContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 46,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    height: 46,
    color: COLORS.text.primary,
    fontSize: 16,
  },
  clearButton: {
    padding: 6,
  },
  filterButton: {
    width: 46,
    height: 46,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  activeFilterButton: {
    backgroundColor: 'rgba(0, 230, 118, 0.1)',
    borderColor: 'rgba(0, 230, 118, 0.3)',
  },
  clearSearchContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginBottom: 4,
  },
  clearSearchButton: {
    paddingVertical: 6,
    paddingHorizontal: 10,
  },
  clearSearchText: {
    color: COLORS.accent,
    fontSize: 14,
    fontWeight: '500',
  },
});

export default Header;