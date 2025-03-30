import React from 'react';
import { View, Text, StyleSheet, Platform } from 'react-native';
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { LinearGradient } from 'expo-linear-gradient';
import { Card } from "./shared/Card";
import { COLORS } from "../../src/constants";
import { UsageStats } from "../../src/types";
import Animated, { FadeInDown, Layout } from 'react-native-reanimated';

interface StatsOverviewCardProps {
  stats: UsageStats;
}

function formatDuration(ms: number): string {
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
}

const StatsOverviewCard: React.FC<StatsOverviewCardProps> = ({ stats }) => {
  // Enhanced gradient combinations with type assertions
  const gradientBase = ['rgba(0,230,118,0.2)', 'rgba(0,230,118,0.08)', 'transparent'] as const;
  const accentGradient = ['rgba(0,230,118,0.3)', 'rgba(0,230,118,0.15)'] as const;
  
  // Weekly difference calculation for message
  const weekendVsWeekday = ((stats.weekdayStats.weekend.avg - stats.weekdayStats.weekday.avg) / stats.weekdayStats.weekday.avg) * 100;
  const isWeekendHigher = weekendVsWeekday > 0;

  return (
    <Animated.View 
      entering={FadeInDown.springify()}
      layout={Layout.springify()}
      style={styles.container}
    >
      {/* Enhanced Background Gradient */}
      <LinearGradient
        colors={gradientBase}
        style={styles.backgroundGradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      />

      {/* Shimmer Effect Layer */}
      <LinearGradient
        colors={['transparent', 'rgba(255,255,255,0.05)', 'transparent'] as const}
        style={styles.shimmerEffect}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      />
      
      <View style={styles.content}>
        {/* Enhanced Header */}
        <View style={styles.header}>
          <View style={styles.titleRow}>
            <LinearGradient
              colors={accentGradient}
              style={styles.iconContainer}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <MaterialCommunityIcons 
                name="chart-box-outline" 
                size={22} 
                color={COLORS.primary}
              />
            </LinearGradient>
            <View style={styles.titleContainer}>
              <Text style={styles.title}>Usage Statistics</Text>
              <Text style={styles.subtitle}>
                Detailed overview of your usage patterns
              </Text>
            </View>
          </View>
        </View>

        {/* Hit Counts Section */}
        <View style={styles.statsSection}>
          <Text style={styles.sectionTitle}>Hit Counts</Text>
          <View style={styles.statsContainer}>
            <LinearGradient
              colors={['rgba(255,255,255,0.08)', 'rgba(255,255,255,0.03)'] as const}
              style={styles.statsGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <View style={styles.statRow}>
                <View style={styles.statItem}>
                  <Text style={styles.statLabel}>Daily Average</Text>
                  <Text style={styles.statValue}>{stats.averageHitsPerDay}</Text>
                </View>
                <View style={styles.statDivider} />
                <View style={styles.statItem}>
                  <Text style={styles.statLabel}>Peak Day</Text>
                  <Text style={styles.statValue}>{stats.peakDayHits}</Text>
                </View>
                <View style={styles.statDivider} />
                <View style={styles.statItem}>
                  <Text style={styles.statLabel}>Total Hits</Text>
                  <Text style={styles.statValue}>{stats.totalHits ?? 0}</Text>
                </View>
              </View>
            </LinearGradient>
          </View>
        </View>

        {/* Duration Stats Section */}
        <View style={styles.statsSection}>
          <Text style={styles.sectionTitle}>Duration</Text>
          <View style={styles.statsContainer}>
            <LinearGradient
              colors={['rgba(255,255,255,0.08)', 'rgba(255,255,255,0.03)'] as const}
              style={styles.statsGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <View style={styles.statRow}>
                <View style={styles.statItem}>
                  <Text style={styles.statLabel}>Average</Text>
                  <Text style={styles.statValue}>{formatDuration(stats.averageDuration)}</Text>
                </View>
                <View style={styles.statDivider} />
                <View style={styles.statItem}>
                  <Text style={styles.statLabel}>Longest</Text>
                  <Text style={styles.statValue}>{formatDuration(stats.longestHit)}</Text>
                </View>
                <View style={styles.statDivider} />
                <View style={styles.statItem}>
                  <Text style={styles.statLabel}>Shortest</Text>
                  <Text style={styles.statValue}>{formatDuration(stats.shortestHit)}</Text>
                </View>
              </View>
            </LinearGradient>
          </View>
        </View>

        {/* Time Patterns Section */}
        <View style={styles.statsSection}>
          <Text style={styles.sectionTitle}>Activity Patterns</Text>
          <View style={styles.statsContainer}>
            <LinearGradient
              colors={['rgba(255,255,255,0.08)', 'rgba(255,255,255,0.03)'] as const}
              style={styles.statsGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <View style={styles.statRow}>
                <View style={styles.statItem}>
                  <Text style={styles.statLabel}>Peak Hours</Text>
                  <Text style={styles.statValue}>{stats.mostActiveHour}:00</Text>
                </View>
                <View style={styles.statDivider} />
                <View style={styles.statItem}>
                  <Text style={styles.statLabel}>Quiet Hours</Text>
                  <Text style={styles.statValue}>{stats.leastActiveHour}:00</Text>
                </View>
                <View style={styles.statDivider} />
                <View style={styles.statItem}>
                  <Text style={styles.statLabel}>Consistency</Text>
                  <Text style={styles.statValue}>{stats.consistency.toFixed(1)}</Text>
                </View>
              </View>
            </LinearGradient>
          </View>
        </View>

        {/* Weekday vs Weekend */}
        <View style={[styles.statsSection, styles.lastSection]}>
          <Text style={styles.sectionTitle}>Weekly Distribution</Text>
          <View style={styles.statsContainer}>
            <LinearGradient
              colors={['rgba(255,255,255,0.08)', 'rgba(255,255,255,0.03)'] as const}
              style={styles.statsGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <View style={styles.statRow}>
                <View style={styles.statItem}>
                  <Text style={styles.statLabel}>Weekday Avg</Text>
                  <Text style={styles.statValue}>
                    {stats.weekdayStats.weekday.avg}
                  </Text>
                </View>
                <View style={styles.statDivider} />
                <View style={styles.statItem}>
                  <Text style={styles.statLabel}>Weekend Avg</Text>
                  <Text style={styles.statValue}>
                    {stats.weekdayStats.weekend.avg}
                  </Text>
                </View>
                <View style={styles.statDivider} />
                <View style={styles.statItem}>
                  <Text style={styles.statLabel}>Difference</Text>
                  <View style={styles.changeContainer}>
                    <MaterialCommunityIcons 
                      name={isWeekendHigher ? "trending-up" : "trending-down"} 
                      size={16} 
                      color={isWeekendHigher ? COLORS.primary : '#FF5252'} 
                    />
                    <Text style={[
                      styles.changeText,
                      { color: isWeekendHigher ? COLORS.primary : '#FF5252' }
                    ]}>
                      {Math.abs(weekendVsWeekday).toFixed(1)}%
                    </Text>
                  </View>
                </View>
              </View>
            </LinearGradient>
          </View>
        </View>

        {/* Message Box */}
        <View style={styles.messageContainer}>
          <LinearGradient
            colors={accentGradient}
            style={styles.statusIcon}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <MaterialCommunityIcons
              name="information-outline"
              size={24}
              color={COLORS.primary}
            />
          </LinearGradient>

          <Text style={styles.messageText}>
            Your most active times are at {stats.mostActiveHour}:00 with an average session duration of {formatDuration(stats.averageDuration)}. Your usage is {Math.abs(weekendVsWeekday).toFixed(1)}% {isWeekendHigher ? "higher" : "lower"} on weekends compared to weekdays.
          </Text>
        </View>
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: 20,
    overflow: 'hidden',
    backgroundColor: COLORS.cardBackground,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    marginBottom: 16,
    ...Platform.select({
      ios: {
        shadowColor: COLORS.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 12,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  backgroundGradient: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0.8,
  },
  shimmerEffect: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0.4,
  },
  content: {
    padding: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
  },
  titleContainer: {
    marginLeft: 12,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.text.primary,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 13,
    color: COLORS.text.secondary,
  },
  statsSection: {
    marginBottom: 20,
  },
  lastSection: {
    marginBottom: 20, // Changed from 0 to accommodate message box
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.text.primary,
    marginBottom: 10,
    letterSpacing: -0.24,
  },
  statsContainer: {
    borderRadius: 16,
    overflow: 'hidden',
  },
  statsGradient: {
    padding: 16,
  },
  statRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statLabel: {
    fontSize: 13,
    color: COLORS.text.secondary,
    marginBottom: 4,
  },
  statValue: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text.primary,
  },
  statDivider: {
    width: 1,
    height: 40,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    marginHorizontal: 8,
  },
  changeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  changeText: {
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 4,
  },
  messageContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    padding: 12,
    borderRadius: 12,
  },
  statusIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
  },
  messageText: {
    flex: 1,
    fontSize: 14,
    color: COLORS.text.secondary,
    lineHeight: 20,
  },
});

export default StatsOverviewCard;