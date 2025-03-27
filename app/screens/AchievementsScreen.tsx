import React, { useState, useEffect, useCallback } from 'react';
import { View, StyleSheet, FlatList, Text, ActivityIndicator, RefreshControl, Platform, TouchableOpacity } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { AchievementCard } from '../components/achievements/AchievementCard';
import { AchievementDetailModal } from '../components/achievements/AchievementDetailModal';
import { databaseManager } from '../../src/DatabaseManager';
import { UserAchievementWithDetails } from '../../src/types/achievements';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { COLORS } from '../../src/constants';
import Animated, { FadeIn } from 'react-native-reanimated';
import { DatabaseResponse } from '../../src/types';

// Shared categories for filtering
const ACHIEVEMENT_CATEGORIES = [
  'All',
  'Daily & Weekly Streaks',
  'Strain Exploration',
  'Mood & Journaling',
  'Moderation & Goal-Oriented',
  'Medical-Focused',
  'Recreational-Focused',
  'AI Interaction',
  'Referral & Community',
  'Morning/Evening Check-Ins',
  'Long-Term Milestones',
  'Themed Celebrations'
];

type AchievementListItem = string | UserAchievementWithDetails;

export default function AchievementsScreen() {
  const [achievements, setAchievements] = useState<UserAchievementWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedAchievement, setSelectedAchievement] = useState<UserAchievementWithDetails | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [stats, setStats] = useState({
    total: 0,
    unlocked: 0,
    percentComplete: 0
  });
  
  const loadAchievements = async () => {
    try {
      setLoading(true);
      // In a real app, you'd get the actual user ID
      const userId = 'current-user';
      
      console.log('[AchievementsScreen] Fetching user achievements...');
      // Fetch achievements
      const userAchievements = await databaseManager.getUserAchievements(userId);
      console.log('[AchievementsScreen] Received achievements:', userAchievements?.length || 0);
      
      if (userAchievements && Array.isArray(userAchievements)) {
        setAchievements(userAchievements);
        
        // Calculate stats
        const totalCount = userAchievements.length;
        const unlockedCount = userAchievements.filter((a: UserAchievementWithDetails) => a.isUnlocked).length;
        
        setStats({
          total: totalCount,
          unlocked: unlockedCount,
          percentComplete: totalCount > 0 ? Math.round((unlockedCount / totalCount) * 100) : 0
        });
        
        // Clear new flags
        console.log('[AchievementsScreen] Clearing achievement new flags...');
        await databaseManager.clearAchievementNewFlags(userId);
      } else {
        // Handle case where achievements are not returned as expected
        console.error('[AchievementsScreen] Failed to load achievements: Invalid response format');
        setAchievements([]);
        setStats({
          total: 0,
          unlocked: 0,
          percentComplete: 0
        });
      }
    } catch (error) {
      console.error('[AchievementsScreen] Failed to load achievements:', error instanceof Error ? error.message : 'Unknown error');
      // Set empty state when there's an error
      setAchievements([]);
      setStats({
        total: 0,
        unlocked: 0,
        percentComplete: 0
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };
  
  useEffect(() => {
    loadAchievements();
  }, []);
  
  useFocusEffect(
    useCallback(() => {
      loadAchievements();
    }, [])
  );
  
  const onRefresh = () => {
    setRefreshing(true);
    loadAchievements();
  };
  
  const handleAchievementPress = (achievement: UserAchievementWithDetails) => {
    setSelectedAchievement(achievement);
    setModalVisible(true);
  };
  
  const closeModal = () => {
    setModalVisible(false);
  };
  
  const filteredAchievements = selectedCategory === 'All'
    ? achievements
    : achievements.filter(a => a.category === selectedCategory);
  
  // Group achievements by category for the "All" view
  const groupedAchievements = filteredAchievements.reduce((groups, achievement) => {
    const category = achievement.category;
    if (!groups[category]) {
      groups[category] = [];
    }
    groups[category].push(achievement);
    return groups;
  }, {} as Record<string, UserAchievementWithDetails[]>);
  
  const renderCategoryFilter = () => (
    <View style={styles.filterContainer}>
      <FlatList
        horizontal
        data={ACHIEVEMENT_CATEGORIES.filter(cat => 
          cat === 'All' || achievements.some(a => a.category === cat)
        )}
        keyExtractor={(item) => item}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={[
              styles.filterButton,
              selectedCategory === item && styles.selectedFilterButton
            ]}
            onPress={() => setSelectedCategory(item)}
          >
            <Text 
              style={[
                styles.filterText,
                selectedCategory === item && styles.selectedFilterText
              ]}
            >
              {item}
            </Text>
          </TouchableOpacity>
        )}
        showsHorizontalScrollIndicator={false}
      />
    </View>
  );
  
  const renderHeader = () => (
    <Animated.View 
      entering={FadeIn.duration(400)}
      style={styles.header}
    >
      <View style={styles.statsCard}>
        <LinearGradient
          colors={[
            'rgba(0,230,118,0.15)',
            'rgba(0,230,118,0.05)',
            'transparent'
          ]}
          style={StyleSheet.absoluteFill}
          start={{ x: 0, y: 0 }}
          end={{ x: 0, y: 1 }}
        />
        
        <View style={styles.statsContent}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{stats.unlocked}</Text>
            <Text style={styles.statLabel}>Unlocked</Text>
          </View>
          
          <View style={styles.statSeparator} />
          
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{stats.total}</Text>
            <Text style={styles.statLabel}>Total</Text>
          </View>
          
          <View style={styles.statSeparator} />
          
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{stats.percentComplete}%</Text>
            <Text style={styles.statLabel}>Complete</Text>
          </View>
        </View>
      </View>
      
      {renderCategoryFilter()}
    </Animated.View>
  );
  
  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <MaterialCommunityIcons name="trophy-outline" size={60} color={COLORS.text.secondary} />
      <Text style={styles.emptyText}>No achievements available</Text>
      <Text style={styles.emptyDescription}>Achievements may still be loading or there was an error fetching your data.</Text>
      <TouchableOpacity style={styles.retryButton} onPress={onRefresh}>
        <Text style={styles.retryText}>Try Again</Text>
      </TouchableOpacity>
    </View>
  );
  
  if (loading && !refreshing) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }
  
  // Determine data for the main FlatList
  const listData: AchievementListItem[] = selectedCategory === 'All'
    ? Object.keys(groupedAchievements)
    : filteredAchievements;
  
  return (
    <SafeAreaProvider>
      <View style={styles.container}>
        <FlatList
          data={listData}
          keyExtractor={(item) => {
            if (typeof item === 'string') {
              return item;
            } else {
              return item.id.toString();
            }
          }}
          renderItem={({ item }) => {
            if (selectedCategory === 'All' && typeof item === 'string') {
              // This is a category header in "All" view
              const categoryAchievements = groupedAchievements[item];
              return (
                <View style={styles.categoryHeaderContainer}>
                  <Text style={styles.categoryHeader}>{item}</Text>
                  <FlatList
                    data={categoryAchievements}
                    keyExtractor={(achievement) => achievement.id.toString()}
                    renderItem={({ item: achievement }) => (
                      <AchievementCard 
                        achievement={achievement} 
                        onPress={handleAchievementPress} 
                      />
                    )}
                    scrollEnabled={false}
                  />
                </View>
              );
            } else {
              // This is an individual achievement in filtered view
              return (
                <AchievementCard 
                  achievement={item as UserAchievementWithDetails} 
                  onPress={handleAchievementPress} 
                />
              );
            }
          }}
          ListHeaderComponent={renderHeader}
          ListEmptyComponent={renderEmptyState}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={[COLORS.primary]}
            />
          }
        />
        
        <AchievementDetailModal
          visible={modalVisible}
          achievement={selectedAchievement}
          onClose={closeModal}
        />
      </View>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.background,
  },
  header: {
    padding: 16,
    paddingBottom: 8,
  },
  statsCard: {
    borderRadius: 20,
    marginBottom: 16,
    overflow: 'hidden',
    backgroundColor: Platform.select({
      ios: 'rgba(26, 26, 26, 0.8)',
      android: 'rgba(26, 26, 26, 0.95)',
    }),
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    ...Platform.select({
      ios: {
        shadowColor: COLORS.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 12,
      },
      android: {
        elevation: 6,
      },
    }),
  },
  statsContent: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    padding: 20,
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statValue: {
    fontSize: 24,
    fontWeight: '600',
    color: COLORS.text.primary,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 14,
    color: COLORS.text.secondary,
    letterSpacing: 0.25,
  },
  statSeparator: {
    height: 40,
    width: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  filterContainer: {
    marginBottom: 8,
  },
  filterButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
  },
  selectedFilterButton: {
    backgroundColor: 'rgba(0, 230, 118, 0.2)',
  },
  filterText: {
    color: COLORS.text.secondary,
    fontSize: 14,
  },
  selectedFilterText: {
    color: COLORS.primary,
    fontWeight: '600',
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  categoryHeaderContainer: {
    marginTop: 16,
    marginBottom: 8,
  },
  categoryHeader: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.text.primary,
    marginBottom: 12,
    letterSpacing: 0.35,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    color: COLORS.text.secondary,
    fontSize: 16,
    marginTop: 16,
  },
  emptyDescription: {
    color: COLORS.text.secondary,
    fontSize: 14,
    marginTop: 8,
    textAlign: 'center',
    paddingHorizontal: 20,
  },
  retryButton: {
    marginTop: 20,
    paddingVertical: 10,
    paddingHorizontal: 20,
    backgroundColor: 'rgba(0, 230, 118, 0.2)',
    borderRadius: 20,
  },
  retryText: {
    color: COLORS.primary,
    fontWeight: '600',
  },
});