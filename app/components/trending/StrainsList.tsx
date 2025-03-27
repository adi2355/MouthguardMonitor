// app/components/trending/StrainsList.tsx
import React, { memo, useCallback } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  FlatList, 
  Platform
} from 'react-native';
import { useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS } from '../../../src/constants';
import { Strain } from "@/src/types";
import Animated, { FadeIn } from 'react-native-reanimated';

interface StrainsListProps {
  strains: Strain[];
  onCompareToggle: (strain: Strain) => void;
  onFavoriteToggle: (strainId: number) => void;
  compareList: Strain[];
  isFavorite: (strainId: number) => boolean;
  isLoading: boolean;
  onEndReached: () => void;
}

// Rating badge component for cleaner code
const RatingBadge = ({ rating }: { rating: number }) => (
  <LinearGradient
    colors={[
      rating >= 9 ? '#00E676' : rating >= 8 ? '#1DE9B6' : '#26C6DA', 
      rating >= 9 ? '#00C853' : rating >= 8 ? '#00BFA5' : '#00ACC1'
    ]}
    style={styles.ratingBadge}
    start={{ x: 0, y: 0 }}
    end={{ x: 1, y: 1 }}
  >
    <Text style={styles.ratingText}>{rating.toFixed(1)}</Text>
  </LinearGradient>
);

// Strain type badge
const TypeBadge = ({ type }: { type: string }) => {
  let gradientColors;
  
  // Different colors for different strain types
  switch(type.toLowerCase()) {
    case 'sativa':
    case 'sativa-dominant':
    case 'sativa-dominant hybrid':
      gradientColors = ['rgba(255, 160, 0, 0.2)', 'rgba(255, 160, 0, 0.1)'];
      break;
    case 'indica':
    case 'indica-dominant':
    case 'indica-dominant hybrid':
      gradientColors = ['rgba(123, 31, 162, 0.2)', 'rgba(123, 31, 162, 0.1)'];
      break;
    case 'hybrid':
      gradientColors = ['rgba(0, 176, 255, 0.2)', 'rgba(0, 176, 255, 0.1)'];
      break;
    default:
      gradientColors = ['rgba(120, 144, 156, 0.2)', 'rgba(120, 144, 156, 0.1)'];
  }
  
  return (
    <LinearGradient
      colors={gradientColors}
      style={styles.typeBadge}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
    >
      <Text style={styles.typeBadgeText}>{type}</Text>
    </LinearGradient>
  );
};

export const StrainsList = memo(({
  strains,
  onCompareToggle,
  onFavoriteToggle,
  compareList,
  isFavorite,
  isLoading,
  onEndReached,
}: StrainsListProps) => {
  const router = useRouter();

  // Optimize with useCallback
  const renderStrainItem = useCallback(({ item: strain, index }: { item: Strain, index: number }) => (
    <Animated.View 
    entering={FadeIn.duration(150)} // Much shorter duration, no delay
    style={styles.strainItemContainer}
  >
      <TouchableOpacity
        onPress={() => router.push({
          pathname: "/strains/details",
          params: { id: strain.id }
        } as any)}
        style={styles.strainItem}
        activeOpacity={0.8}
      >
        <LinearGradient
          colors={['rgba(0, 230, 118, 0.1)', 'rgba(0, 230, 118, 0.05)', 'rgba(0, 230, 118, 0)']}
          style={StyleSheet.absoluteFill}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        />
        
        {/* Left content */}
        <View style={styles.strainContent}>
          <View style={styles.strainHeader}>
            <Text style={styles.strainName}>{strain.name}</Text>
            <RatingBadge rating={strain.combined_rating} />
          </View>

          <TypeBadge type={strain.genetic_type} />
          
          <Text 
            numberOfLines={2} 
            style={styles.strainDescription}
          >
            {strain.overview}
          </Text>

          {strain.effects && (
            <View style={styles.effectsContainer}>
              {strain.effects.split(',').slice(0, 3).map((effect, idx) => (
                <View key={idx} style={styles.effectBadge}>
                  <Text style={styles.effectText}>{effect.trim()}</Text>
                </View>
              ))}
            </View>
          )}
        </View>

        {/* Action buttons */}
        <View style={styles.actionButtons}>
          <TouchableOpacity 
            onPress={() => onFavoriteToggle(strain.id!)}
            style={[
              styles.actionButton,
              isFavorite(strain.id!) && styles.favoriteButton
            ]}
          >
            <MaterialCommunityIcons 
              name={isFavorite(strain.id!) ? "heart" : "heart-outline"} 
              size={22} 
              color={isFavorite(strain.id!) ? '#FFFFFF' : COLORS.text.secondary} 
            />
          </TouchableOpacity>
          
          <TouchableOpacity 
            onPress={() => onCompareToggle(strain)}
            style={[
              styles.actionButton,
              compareList.some(s => s.id === strain.id) && styles.compareButton
            ]}
            disabled={compareList.length >= 3 && !compareList.some(s => s.id === strain.id)}
          >
            <MaterialCommunityIcons 
              name={compareList.some(s => s.id === strain.id) ? "compare" : "compare-horizontal"} 
              size={22} 
              color={compareList.some(s => s.id === strain.id) ? '#FFFFFF' : COLORS.text.secondary} 
            />
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    </Animated.View>
  ), [onCompareToggle, onFavoriteToggle, compareList, isFavorite, router]);

  const keyExtractor = useCallback((item: Strain, index: number) => {
    // Use unique combination of id and index if id exists, otherwise use index-based fallback
    return item.id ? `strain-${item.id}-${index}` : `strain-index-${index}`;
  }, []);
  

  if (!strains.length && !isLoading) {
    return (
      <View style={styles.emptyContainer}>
        <MaterialCommunityIcons 
          name="cannabis" 
          size={48} 
          color={COLORS.primary}
          style={{ opacity: 0.5 }}
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
      keyExtractor={keyExtractor}
      contentContainerStyle={styles.content}
      onEndReached={onEndReached}
      onEndReachedThreshold={0.5}
      showsVerticalScrollIndicator={false}
      // Performance optimizations
      removeClippedSubviews={Platform.OS === 'android'}
      windowSize={5}
      maxToRenderPerBatch={5}
      initialNumToRender={8}  // Limit initial render batch
      updateCellsBatchingPeriod={50}  // Group cell updates to optimize performance
      // Add key tracking for debugging
      maintainVisibleContentPosition={{
        minIndexForVisible: 0,
      }}
    />
  );
  
});

// Export default for expo-router
export default StrainsList;

const styles = StyleSheet.create({
  content: {
    paddingBottom: 80, // Space for the compare bar
  },
  strainItemContainer: {
    marginBottom: 16,
    borderRadius: 16,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  strainItem: {
    backgroundColor: 'rgba(26, 32, 28, 0.95)',
    borderRadius: 16,
    overflow: 'hidden',
    flexDirection: 'row',
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(0, 230, 118, 0.15)',
  },
  strainContent: {
    flex: 1,
  },
  strainHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  strainName: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.text.primary,
    letterSpacing: 0.5,
    flex: 1,
    marginRight: 8,
  },
  ratingBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ratingText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 16,
  },
  typeBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    marginBottom: 10,
  },
  typeBadgeText: {
    fontSize: 13,
    color: COLORS.text.primary,
    fontWeight: '500',
  },
  strainDescription: {
    fontSize: 14,
    color: COLORS.text.secondary,
    lineHeight: 20,
    marginBottom: 12,
  },
  effectsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  effectBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  effectText: {
    fontSize: 12,
    color: COLORS.text.secondary,
  },
  actionButtons: {
    marginLeft: 16,
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  actionButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    marginVertical: 6,
  },
  favoriteButton: {
    backgroundColor: 'rgba(255, 82, 82, 0.8)',
  },
  compareButton: {
    backgroundColor: 'rgba(0, 230, 118, 0.8)',
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(26, 32, 28, 0.5)',
    padding: 40,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(0, 230, 118, 0.1)',
    marginVertical: 30,
  },
  emptyText: {
    fontSize: 16,
    color: COLORS.text.primary,
    textAlign: 'center',
    marginTop: 16,
    opacity: 0.8,
  },
});