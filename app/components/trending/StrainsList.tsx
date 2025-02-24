import React, { memo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList } from 'react-native';
import { useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS } from '@/src/constants';
import { Strain } from '@/src/dbManager';
import Animated, { FadeIn } from 'react-native-reanimated';
import LoadingView from '@/app/components/LoadingView';

interface StrainsListProps {
  strains: Strain[];
  onCompareToggle: (strain: Strain) => void;
  onFavoriteToggle: (strainId: number) => void;
  compareList: Strain[];
  isFavorite: (strainId: number) => boolean;
  isLoading: boolean;
  onEndReached: () => void;
}

const StrainsList = memo(({
  strains,
  onCompareToggle,
  onFavoriteToggle,
  compareList,
  isFavorite,
  isLoading,
  onEndReached,
}: StrainsListProps) => {
  const router = useRouter();

  const renderStrainItem = ({ item: strain }: { item: Strain }) => (
    <Animated.View 
      entering={FadeIn.duration(300)}
      style={styles.strainItem}
    >
      <TouchableOpacity
        onPress={() => router.push({
          pathname: "/dataOverviews/strains/strainDetails",
          params: { id: strain.id }
        } as any)}
      >
        <LinearGradient
          colors={['rgba(0,230,118,0.2)', 'rgba(0,230,118,0.05)', 'rgba(0,230,118,0)']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFill}
        />
        
        <View style={styles.strainContent}>
          <View style={styles.strainHeader}>
            <Text style={styles.strainName}>{strain.name}</Text>
            <Text style={styles.rating}>{strain.combined_rating.toFixed(1)}</Text>
          </View>

          <Text style={styles.strainType}>{strain.genetic_type}</Text>
          <Text numberOfLines={2} style={styles.strainDescription}>
            {strain.overview}
          </Text>

          <View style={styles.actionButtons}>
            <TouchableOpacity 
              onPress={() => onFavoriteToggle(strain.id!)}
              style={styles.actionButton}
            >
              <MaterialCommunityIcons 
                name={isFavorite(strain.id!) ? "heart" : "heart-outline"} 
                size={24} 
                color={isFavorite(strain.id!) ? COLORS.primary : COLORS.text.secondary} 
              />
            </TouchableOpacity>
            
            <TouchableOpacity 
              onPress={() => onCompareToggle(strain)}
              style={styles.actionButton}
              disabled={compareList.length >= 3 && !compareList.some(s => s.id === strain.id)}
            >
              <MaterialCommunityIcons 
                name={compareList.some(s => s.id === strain.id) ? "compare" : "compare-horizontal"} 
                size={24} 
                color={compareList.some(s => s.id === strain.id) ? COLORS.primary : COLORS.text.secondary} 
              />
            </TouchableOpacity>
          </View>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );

  if (!strains.length && !isLoading) {
    return (
      <View style={styles.emptyContainer}>
        <MaterialCommunityIcons 
          name="cannabis" 
          size={48} 
          color={COLORS.text.secondary} 
        />
        <Text style={styles.emptyText}>
          No strains found matching your criteria
        </Text>
      </View>
    );
  }

  return (
    <FlatList
      data={strains}
      renderItem={renderStrainItem}
      keyExtractor={item => item.id!.toString()}
      contentContainerStyle={styles.content}
      onEndReached={onEndReached}
      onEndReachedThreshold={0.5}
      ListFooterComponent={
        isLoading ? <LoadingView /> : null
      }
    />
  );
});

const styles = StyleSheet.create({
  content: {
    gap: 12,
  },
  strainItem: {
    backgroundColor: 'rgba(26, 26, 26, 0.9)',
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(0, 230, 118, 0.1)',
  },
  strainContent: {
    padding: 16,
  },
  strainHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  strainName: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.text.primary,
    letterSpacing: 0.3,
  },
  rating: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.primary,
  },
  strainType: {
    fontSize: 14,
    color: COLORS.text.secondary,
    marginBottom: 4,
  },
  strainDescription: {
    fontSize: 14,
    color: COLORS.text.tertiary,
    lineHeight: 20,
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
    marginTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0, 230, 118, 0.1)',
    paddingTop: 12,
  },
  actionButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 20,
    backgroundColor: 'rgba(26, 26, 26, 0.9)',
    borderWidth: 1,
    borderColor: 'rgba(0, 230, 118, 0.1)',
  },
  emptyContainer: {
    padding: 40,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
    backgroundColor: 'rgba(26, 26, 26, 0.9)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(0, 230, 118, 0.1)',
  },
  emptyText: {
    fontSize: 16,
    color: COLORS.text.secondary,
    textAlign: 'center',
    letterSpacing: 0.2,
  },
});

export default StrainsList; 