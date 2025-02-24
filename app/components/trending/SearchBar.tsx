import React, { memo } from 'react';
import { View, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { COLORS } from '@/src/constants';
import { StrainSearchFilters } from '@/src/services/StrainService';
import { hasActiveFilters } from '@/src/utils/filters';

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
}: SearchBarProps) => (
  <View style={styles.searchContainer}>
    <View style={styles.searchBar}>
      <MaterialCommunityIcons 
        name="magnify" 
        size={24} 
        color={COLORS.text.secondary} 
      />
      <TextInput
        style={styles.searchInput}
        placeholder="Search strains..."
        placeholderTextColor={COLORS.text.secondary}
        value={searchQuery}
        onChangeText={setSearchQuery}
        returnKeyType="search"
      />
      {(searchQuery.trim() || hasActiveFilters(filters)) && (
        <TouchableOpacity onPress={onClear}>
          <MaterialCommunityIcons 
            name="close-circle" 
            size={20} 
            color={COLORS.text.secondary} 
          />
        </TouchableOpacity>
      )}
    </View>

    <TouchableOpacity 
      style={[
        styles.filterButton, 
        showFilters && styles.filterButtonActive,
        hasActiveFilters(filters) && styles.filterButtonHasFilters
      ]} 
      onPress={() => setShowFilters(!showFilters)}
    >
      <MaterialCommunityIcons 
        name="filter-variant" 
        size={24} 
        color={
          showFilters || hasActiveFilters(filters)
            ? COLORS.primary 
            : COLORS.text.secondary
        } 
      />
    </TouchableOpacity>
  </View>
));

const styles = StyleSheet.create({
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 16,
  },
  searchBar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(26, 26, 26, 0.9)',
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 44,
    borderWidth: 1,
    borderColor: 'rgba(0, 230, 118, 0.1)',
  },
  searchInput: {
    flex: 1,
    color: COLORS.text.primary,
    fontSize: 16,
    marginLeft: 8,
    padding: 0,
  },
  filterButton: {
    width: 44,
    height: 44,
    backgroundColor: 'rgba(26, 26, 26, 0.9)',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(0, 230, 118, 0.1)',
  },
  filterButtonActive: {
    backgroundColor: 'rgba(0, 230, 118, 0.1)',
  },
  filterButtonHasFilters: {
    borderColor: COLORS.primary,
  },
});

export default SearchBar; 